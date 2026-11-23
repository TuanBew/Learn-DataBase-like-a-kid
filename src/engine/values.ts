import type { Dialect, SqlDate, Value } from './types';
import { type Span, runtimeError } from './errors';

export const isDate = (v: Value): v is SqlDate => typeof v === 'object' && v !== null && v.kind === 'date';

/**
 * Bỏ dấu và hạ chữ thường, giống collation mặc định utf8mb4_0900_ai_ci của MySQL 8.
 * Chữ đ không tách được thành d cộng dấu, nên đổi riêng: MySQL 8.0.46 thật coi 'đ' = 'd'.
 */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/đ/g, 'd');
}

const fullIso = (d: SqlDate) => (d.iso.length === 10 ? `${d.iso} 00:00:00` : d.iso);

/** Chuỗi có đúng dạng ngày ISO không. */
export function parseIsoDate(s: string): SqlDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
  return { kind: 'date', iso: h === undefined ? `${y}-${mo}-${d}` : `${y}-${mo}-${d} ${h}:${mi}:${se ?? '00'}` };
}

/** Cảnh báo của MySQL (SHOW WARNINGS). Gom trong lúc một query chạy, mỗi câu chỉ ghi một lần. */
export interface Warning {
  code: number;
  message: string;
}
let pending: Warning[] = [];
export const resetWarnings = (): void => {
  pending = [];
};
export const warn = (code: number, message: string): void => {
  if (pending.length < 20 && !pending.some((w) => w.code === code && w.message === message)) pending.push({ code, message });
};
export const peekWarnings = (): Warning[] => [...pending];

const MYSQL_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/;
const ORACLE_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/** Đổi sang số theo luật của từng dialect. MySQL dễ tính (kèm cảnh báo), Oracle báo ORA-01722. */
export function toNumber(v: Value, d: Dialect, span: Span): number | null {
  if (v === null) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const t = v.trim();
    if (d === 'oracle') {
      if (ORACLE_NUMBER.test(t)) return Number(t);
      throw runtimeError(d, ['1292', '22007', ''], '01722', span, 'invalid-number', { text: v });
    }
    const m = MYSQL_NUMBER.exec(t);
    if (!m || m[0].length !== t.length) warn(1292, `Truncated incorrect DOUBLE value: '${v}'`);
    return m ? Number(m[0]) : 0;
  }
  if (d === 'oracle') throw runtimeError(d, ['1292', '22007', ''], '01722', span, 'invalid-number', { text: v.iso });
  return Number(v.iso.slice(0, 10).replace(/-/g, ''));
}

/**
 * So sánh hai giá trị. Trả về số âm, 0, số dương. Trả về null nếu một bên là NULL.
 */
export function compare(a: Value, b: Value, d: Dialect, span: Span): number | null {
  if (a === null || b === null) return null;
  if (typeof a === 'boolean') a = a ? 1 : 0;
  if (typeof b === 'boolean') b = b ? 1 : 0;
  if (isDate(a) || isDate(b)) {
    const da = isDate(a) ? a : typeof a === 'string' ? dateFromString(a, d, span) : null;
    const db = isDate(b) ? b : typeof b === 'string' ? dateFromString(b, d, span) : null;
    if (!da || !db) return cmp(toNumber(a, d, span)!, toNumber(b, d, span)!);
    return cmp(fullIso(da), fullIso(db));
  }
  if (typeof a === 'number' && typeof b === 'number') return cmp(a, b);
  if (typeof a === 'string' && typeof b === 'string') {
    return d === 'mysql' ? cmp(fold(a), fold(b)) : cmp(a, b);
  }
  return cmp(toNumber(a, d, span)!, toNumber(b, d, span)!);
}

function dateFromString(s: string, d: Dialect, span: Span): SqlDate | null {
  if (d === 'oracle') throw runtimeError(d, ['1525', 'HY000', ''], '01861', span, 'date-literal-oracle', { text: s });
  return parseIsoDate(s);
}

function cmp<T extends number | string>(a: T, b: T): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Khóa để coi hai giá trị là "giống nhau" khi DISTINCT hoặc gom nhóm. */
export function keyOf(v: Value, d: Dialect): string {
  if (v === null) return 'N';
  if (typeof v === 'number') return `n${v}`;
  if (typeof v === 'boolean') return `n${v ? 1 : 0}`;
  if (typeof v === 'string') return `s${d === 'mysql' ? fold(v) : v}`;
  return `d${fullIso(v)}`;
}

const tidy = (n: number) => Math.round(n * 1e10) / 1e10;

export function arith(op: '+' | '-' | '*' | '/' | '%', a: Value, b: Value, d: Dialect, span: Span): Value {
  const x = toNumber(a, d, span);
  const y = toNumber(b, d, span);
  if (x === null || y === null) return null;
  switch (op) {
    case '+':
      return tidy(x + y);
    case '-':
      return tidy(x - y);
    case '*':
      return tidy(x * y);
    case '/':
      if (y === 0) {
        if (d === 'oracle') throw runtimeError(d, ['1365', '22012', 'Division by 0'], '01476', span, 'divide-zero');
        return null;
      }
      return tidy(x / y);
    case '%':
      return y === 0 ? null : tidy(x % y);
  }
}

/** LIKE: `%` là nhiều ký tự bất kỳ, `_` là đúng một ký tự. */
export function like(v: Value, pat: Value, d: Dialect): boolean | null {
  if (v === null || pat === null) return null;
  let s = toText(v);
  let p = toText(pat);
  if (d === 'mysql') {
    s = fold(s);
    p = fold(p);
  }
  let re = '';
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '\\' && d === 'mysql' && i + 1 < p.length) {
      re += escapeRe(p[++i]);
    } else if (c === '%') re += '[\\s\\S]*';
    else if (c === '_') re += '[\\s\\S]';
    else re += escapeRe(c);
  }
  return new RegExp(`^${re}$`, 'u').test(s);
}

const escapeRe = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Giá trị thành chữ, đúng như DBMS in ra. */
export function toText(v: Value): string {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  return v.iso;
}

/**
 * Số tiền được chấm ngăn nghìn cho dễ đọc: 8.000, 25.000.
 * Áp cho số nguyên từ 10.000 trở lên, và số tròn 500 từ 1.000 trở lên.
 * Mã như 1001 hay năm 2026 thì giữ nguyên.
 */
export function niceNumber(n: number): string {
  const a = Math.abs(n);
  if (Number.isInteger(n) && (a >= 10000 || (a >= 1000 && a % 500 === 0))) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return String(n);
}

/** Giá trị để hiện cho người học: số dễ đọc, chuỗi giữ nguyên. */
export function show(v: Value): string {
  if (typeof v === 'number') return niceNumber(v);
  return toText(v);
}

/**
 * Định dạng theo cả column: một column số hoặc chấm ngăn nghìn cho mọi số nguyên từ 1.000 trở lên,
 * hoặc không chấm số nào. Chỉ đổi chữ hiện ra, không đổi giá trị.
 */
export function columnFormatter(values: readonly Value[]): (v: Value) => string {
  const big = values.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && Math.abs(v) >= 1000);
  const dots = big.some((v) => Math.abs(v) >= 10000) || (big.length > 0 && big.every((v) => v % 500 === 0));
  return (v: Value) => {
    if (typeof v === 'number') {
      return dots && Number.isInteger(v) && Math.abs(v) >= 1000 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(v);
    }
    return toText(v);
  };
}

/** Giá trị trong câu giải thích: chuỗi có nháy đơn. */
export function showQuoted(v: Value): string {
  if (typeof v === 'string') return `'${v}'`;
  return show(v);
}

/** Oracle coi chuỗi rỗng là NULL. */
export function norm(v: Value, d: Dialect): Value {
  return d === 'oracle' && v === '' ? null : v;
}
