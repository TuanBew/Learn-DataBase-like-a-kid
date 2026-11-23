import { castValue, parseOracleDefaultDate } from './cast';
import {
  DAYS,
  MONTHS,
  type Parts,
  addDays,
  addMonths,
  addSeconds,
  dateParts,
  diffDays,
  lastDayOf,
  makeDate,
  mysqlFormat,
  oracleFormat,
  parseLooseDate,
  utc,
  weekday,
} from './dates';
import { type Span, oraFail, runtimeError } from './errors';
import { BadNumberFormat, mysqlFormatNumber, oracleNumberFormat, oracleNumberText, roundHalf, truncTo } from './numfmt';
import type { Dialect, SqlDate, Value } from './types';
import { compare, fold, isDate, toNumber, toText, warn } from './values';

export { addDays, dateParts, diffDays, makeDate } from './dates';

/** Thứ engine cần biết lúc chạy function. */
export interface FnEnv {
  /** "Bây giờ" của khóa học, cố định để kết quả không đổi theo ngày. */
  now: SqlDate;
  /** Tên schema đang đăng nhập, in hoa (Oracle USER). */
  user?: string;
  /** MySQL INSERT ... ON DUPLICATE KEY UPDATE: row định thêm, cho VALUES(column). */
  incoming?: { columns: { name: string }[]; cells: Value[] };
  /** Sequence của Oracle. Session cấp hai hàm này. Không có thì mọi sequence đều không tồn tại. */
  seq?: {
    next(name: string, span: Span): number;
    curr(name: string, span: Span): number;
  };
}

export interface FnDef {
  min: number;
  max: number;
  /** Số tham số riêng của từng dialect, khi hai bên khác nhau. Có thì thay cho `min` và `max`. */
  arity?: Partial<Record<Dialect, [number, number]>>;
  /** MySQL: đưa sai số tham số thì báo 1064 (function nằm trong cú pháp) thay vì 1582. */
  syntax?: boolean;
  /** Function chỉ có ở một dialect. */
  only?: Dialect;
  /** Tên function tương đương ở dialect kia. */
  use?: string;
  /** Viết được mà không cần ngoặc, ví dụ SYSDATE. Giá trị là các dialect cho phép. */
  bare?: Dialect[];
  /** Bắt buộc viết không ngoặc ở dialect này. */
  bareOnly?: Dialect[];
  /** Số tham số người học thấy trong danh mục, khi khác số tham số engine đếm (TIMESTAMPDIFF tính cả đơn vị). */
  shown?: [number, number];
  /** `unit` là đơn vị của INTERVAL (DATE_ADD) hay của TIMESTAMPDIFF. */
  run: (a: Value[], d: Dialect, span: Span, env: FnEnv, unit?: string) => Value;
}

/** Số tham số của một function ở một dialect. */
export const arityOf = (def: FnDef, d: Dialect): [number, number] => def.arity?.[d] ?? [def.min, def.max];

/** Đổi một giá trị thành ngày theo luật của dialect. MySQL tự hiểu chuỗi ngày, Oracle thì không. */
function asDate(v: Value, d: Dialect, span: Span): SqlDate | null {
  if (v === null) return null;
  if (isDate(v)) return v;
  if (typeof v === 'string' && d === 'mysql') {
    const r = parseLooseDate(v);
    if (!r) warn1292(v);
    return r ? r.date : null;
  }
  throw runtimeError(d, ['1525', 'HY000', `Incorrect DATE value: '${toText(v)}'`], '01861', span, 'date-literal-oracle', { text: toText(v) });
}
const warn1292 = (v: string) => warn(1292, `Incorrect datetime value: '${v}'`);

/** Đọc một chuỗi thành ngày theo mẫu. `tokens` là bảng ký hiệu của dialect. */
function parseWith(text: string, fmt: string, d: Dialect): SqlDate | null {
  const p: Parts = { y: 2026, mo: 1, d: 1, h: 0, mi: 0, s: 0 };
  let withTime = false;
  let re = '^';
  const order: (keyof Parts)[] = [];
  const add = (k: keyof Parts, digits: string, time = false) => {
    re += `(${digits})`;
    order.push(k);
    if (time) withTime = true;
  };
  let i = 0;
  while (i < fmt.length) {
    if (d === 'mysql' && fmt[i] === '%') {
      const c = fmt[i + 1];
      if (c === 'Y') add('y', '\\d{4}');
      else if (c === 'm' || c === 'c') add('mo', '\\d{1,2}');
      else if (c === 'd' || c === 'e') add('d', '\\d{1,2}');
      else if (c === 'H' || c === 'k') add('h', '\\d{1,2}', true);
      else if (c === 'i') add('mi', '\\d{1,2}', true);
      else if (c === 's' || c === 'S') add('s', '\\d{1,2}', true);
      else return null;
      i += 2;
      continue;
    }
    if (d === 'oracle') {
      const tok = ['YYYY', 'HH24', 'MM', 'DD', 'MI', 'SS'].find((t) => fmt.slice(i, i + t.length).toUpperCase() === t);
      if (tok) {
        if (tok === 'YYYY') add('y', '\\d{4}');
        else if (tok === 'MM') add('mo', '\\d{1,2}');
        else if (tok === 'DD') add('d', '\\d{1,2}');
        else if (tok === 'HH24') add('h', '\\d{1,2}', true);
        else if (tok === 'MI') add('mi', '\\d{1,2}', true);
        else add('s', '\\d{1,2}', true);
        i += tok.length;
        continue;
      }
    }
    re += fmt[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    i++;
  }
  const m = new RegExp(`${re}$`).exec(text.trim());
  if (!m) return null;
  order.forEach((k, j) => {
    p[k] = Number(m[j + 1]);
  });
  if (p.mo < 1 || p.mo > 12 || p.d < 1 || p.d > 31 || p.h > 23 || p.mi > 59 || p.s > 59) return null;
  return makeDate(p, withTime);
}

const text = (f: (s: string, d: Dialect) => Value) => (a: Value[], d: Dialect) => (a[0] === null ? null : f(toText(a[0], d), d));
const num = (f: (n: number) => number) => (a: Value[], d: Dialect, span: Span) => {
  const n = toNumber(a[0], d, span);
  return n === null ? null : f(n);
};
const part = (pick: (p: Parts) => number) => (a: Value[], d: Dialect, span: Span) => {
  const v = asDate(a[0], d, span);
  return v ? pick(dateParts(v)) : null;
};
const nul = (a: Value[]) => a.some((v) => v === null);
const dateOnly = (v: SqlDate): SqlDate => ({ kind: 'date', iso: v.iso.slice(0, 10) });
const midnight = (v: SqlDate): SqlDate => ({ kind: 'date', iso: `${v.iso.slice(0, 10)} 00:00:00` });
const fullIso = (v: SqlDate) => (v.iso.length === 10 ? `${v.iso} 00:00:00` : v.iso);
const tidy = (n: number) => Math.round(n * 1e10) / 1e10;

function substr(a: Value[], d: Dialect, span: Span): Value {
  if (a[0] === null || a[1] === null) return null;
  const s = [...toText(a[0], d)];
  let pos = toNumber(a[1], d, span)!;
  const len = a.length > 2 ? toNumber(a[2], d, span) : null;
  if (a.length > 2 && len === null) return null;
  // Vị trí tính từ 1. Số âm là đếm từ cuối chuỗi. Oracle coi 0 như 1, MySQL coi 0 là chuỗi rỗng.
  if (pos === 0) {
    if (d === 'mysql') return '';
    pos = 1;
  }
  const start = pos > 0 ? pos - 1 : s.length + pos;
  if (start < 0 || start >= s.length) return '';
  if (len !== null && len < 1) return '';
  return s.slice(start, len === null ? undefined : start + len).join('');
}

/** MySQL tìm chuỗi con không phân biệt hoa thường nhưng có phân biệt dấu (đã kiểm: INSTR('á', 'a') ra 0). Trả về vị trí từ 1, hoặc 0. */
function mysqlLocate(sub: Value, s: Value, pos = 1): Value {
  if (sub === null || s === null) return null;
  if (pos < 1) return 0;
  const hay = toText(s).toLowerCase();
  const i = hay.indexOf(toText(sub).toLowerCase(), pos - 1);
  return i < 0 ? 0 : [...hay.slice(0, i)].length + 1;
}

/** Oracle INSTR(chuỗi, con [, vị trí [, lần thứ]]). Vị trí âm là tìm ngược từ cuối chuỗi. */
function oracleInstr(a: Value[], d: Dialect, span: Span): Value {
  if (nul(a)) return null;
  const s = toText(a[0]);
  const sub = toText(a[1]);
  const pos = a.length > 2 ? Math.trunc(toNumber(a[2], d, span)!) : 1;
  const occ = a.length > 3 ? Math.trunc(toNumber(a[3], d, span)!) : 1;
  if (occ < 1) throw oraFail('01428', `argument '${occ}' is out of range`, 'arg-out-of-range', { name: 'INSTR', value: occ }, span);
  if (pos === 0) return 0;
  let at = pos > 0 ? pos - 1 : s.length + pos;
  for (let k = 0; k < occ; k++) {
    const i = pos > 0 ? s.indexOf(sub, at) : s.lastIndexOf(sub, at);
    if (i < 0) return 0;
    if (k === occ - 1) return i + 1;
    at = pos > 0 ? i + 1 : i - 1;
  }
  return 0;
}

function padWith(dir: 'l' | 'r') {
  return (a: Value[], d: Dialect, span: Span): Value => {
    if (nul(a)) return null;
    const s = [...toText(a[0])];
    const len = Math.trunc(toNumber(a[1], d, span)!);
    const fill = a.length > 2 ? [...toText(a[2])] : [' '];
    // MySQL: độ dài âm cho NULL. Oracle: độ dài 0 cho chuỗi rỗng, tức NULL (engine đổi '' thành NULL ở Oracle).
    if (len < 0) return null;
    if (len <= s.length) return s.slice(0, len).join('');
    if (fill.length === 0) return d === 'mysql' ? '' : null;
    const filler = Array.from({ length: len - s.length }, (_x, i) => fill[i % fill.length]).join('');
    return dir === 'l' ? filler + s.join('') : s.join('') + filler;
  };
}

/** ASCII: MySQL cho byte đầu của chữ, Oracle cho số của chữ đầu trong database UTF-8 (các byte đọc như một số). */
function asciiOf(a: Value[], d: Dialect): Value {
  if (a[0] === null) return null;
  const s = toText(a[0]);
  if (s === '') return d === 'mysql' ? 0 : null;
  const bytes = [...new TextEncoder().encode([...s][0])];
  return d === 'mysql' ? bytes[0] : bytes.reduce((n, b) => n * 256 + b, 0);
}

/** CHR(n) của Oracle và CHAR(n, ...) của MySQL: số là các byte UTF-8 của chữ. */
function charOf(a: Value[], d: Dialect, span: Span): Value {
  if (d === 'oracle' && a[0] === null) return null;
  const bytes: number[] = [];
  for (const v of a) {
    if (v === null) continue;
    let n = Math.max(0, roundHalf(toNumber(v, d, span)!, 0));
    const group: number[] = [];
    do {
      group.unshift(n % 256);
      n = Math.floor(n / 256);
    } while (n > 0);
    bytes.push(...group);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Giá trị đúng sai của một giá trị (IF). */
const truthy = (v: Value, d: Dialect, span: Span): boolean => (v === null ? false : typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : typeof v === 'string' ? toNumber(v, d, span) !== 0 : true);

/**
 * GREATEST và LEAST. NULL ở đâu thì kết quả NULL, ở cả hai dialect.
 * MySQL: có một chuỗi thì so tất cả như chuỗi. Oracle: kiểu của tham số đầu quyết định.
 */
function extreme(pick: 'max' | 'min') {
  return (a: Value[], d: Dialect, span: Span): Value => {
    if (nul(a)) return null;
    const hasDate = a.some(isDate);
    const kind: 'num' | 'text' | 'date' =
      d === 'mysql'
        ? hasDate
          ? 'date'
          : a.some((v) => typeof v === 'string')
            ? 'text'
            : 'num'
        : isDate(a[0])
          ? 'date'
          : typeof a[0] === 'string'
            ? 'text'
            : 'num';
    const key = (v: Value): number | string => {
      if (kind === 'num') return toNumber(v, d, span)!;
      if (kind === 'date') return fullIso(asDate(v, d, span) ?? { kind: 'date', iso: '' });
      return d === 'mysql' ? fold(toText(v)) : toText(v);
    };
    let best = a[0];
    for (const v of a.slice(1)) if (pick === 'max' ? key(v) > key(best) : key(v) < key(best)) best = v;
    if (kind === 'date') return asDate(best, d, span);
    return kind === 'text' ? toText(best) : toNumber(best, d, span);
  };
}

const UNIT_SECONDS: Record<string, number> = { SECOND: 1, MINUTE: 60, HOUR: 3600, DAY: 86400, WEEK: 604800 };

/** DATE_ADD và DATE_SUB của MySQL. */
function dateAdd(sign: 1 | -1) {
  return (a: Value[], d: Dialect, span: Span, _env: FnEnv, unit = 'DAY'): Value => {
    const v = asDate(a[0], d, span);
    const raw = toNumber(a[1], d, span);
    if (!v || raw === null) return null;
    const n = roundHalf(raw, 0) * sign;
    switch (unit) {
      case 'MONTH':
        return addMonths(v, n);
      case 'QUARTER':
        return addMonths(v, n * 3);
      case 'YEAR':
        return addMonths(v, n * 12);
      case 'DAY':
      case 'WEEK':
        return addDays(v, n * (unit === 'WEEK' ? 7 : 1));
      default:
        return addSeconds(v, n * UNIT_SECONDS[unit]);
    }
  };
}

/** TIMESTAMPDIFF(unit, a, b) của MySQL: số đơn vị trọn vẹn từ a tới b. */
function timestampDiff(a: Value[], d: Dialect, span: Span, _env: FnEnv, unit = 'DAY'): Value {
  const x = asDate(a[0], d, span);
  const y = asDate(a[1], d, span);
  if (!x || !y) return null;
  const p = dateParts(x);
  const q = dateParts(y);
  if (unit === 'MONTH' || unit === 'QUARTER' || unit === 'YEAR') {
    let months = (q.y - p.y) * 12 + (q.mo - p.mo);
    // Phần còn lại trong tháng: ngày, giờ, phút, giây. Chưa tròn tháng thì lùi một tháng về phía 0.
    const rest = [q.d - p.d, q.h - p.h, q.mi - p.mi, q.s - p.s].find((n) => n !== 0) ?? 0;
    if (months > 0 && rest < 0) months--;
    if (months < 0 && rest > 0) months++;
    return Math.trunc(months / (unit === 'MONTH' ? 1 : unit === 'QUARTER' ? 3 : 12));
  }
  return Math.trunc((utc(q) - utc(p)) / 1000 / UNIT_SECONDS[unit]);
}

const DAY_KEYS = DAYS.map((n) => n.toUpperCase());

/** Cắt các chữ trong `set` ở đầu hoặc cuối chuỗi (LTRIM, RTRIM của Oracle). */
function trimSet(a: Value[], dir: 'LEADING' | 'TRAILING'): Value {
  if (a[0] === null) return null;
  if (a.length > 1 && a[1] === null) return null;
  const set = a.length > 1 ? new Set([...toText(a[1])]) : new Set([' ']);
  let chars = [...toText(a[0])];
  if (dir === 'LEADING') while (chars.length > 0 && set.has(chars[0])) chars.shift();
  else while (chars.length > 0 && set.has(chars[chars.length - 1])) chars.pop();
  return chars.join('');
}

/** TRIM(s) và TRIM(LEADING | TRAILING | BOTH x FROM s). Oracle chỉ cho x dài đúng một chữ, MySQL cho x dài hơn (cắt cả cụm). */
function trimFn(a: Value[], d: Dialect, span: Span, _env: FnEnv, unit?: string): Value {
  if (a[0] === null) return null;
  if (!unit) return toText(a[0]).trim();
  if (a.length > 1 && a[1] === null) return null;
  const x = a.length > 1 ? toText(a[1]) : ' ';
  if (d === 'oracle' && [...x].length !== 1) throw oraFail('30001', 'trim set should have only one character', 'trim-one-char', {}, span);
  let s = toText(a[0]);
  if (x === '') return s;
  if (unit !== 'TRAILING') while (s.startsWith(x)) s = s.slice(x.length);
  if (unit !== 'LEADING') while (s.endsWith(x)) s = s.slice(0, s.length - x.length);
  return s;
}

/** TRUNC(ngày, mẫu) của Oracle. */
function truncDate(v: SqlDate, fmt: string, span: Span): SqlDate {
  const p = dateParts(v);
  const f = fmt.toUpperCase();
  const at = (q: Partial<Parts>) => makeDate({ ...p, h: 0, mi: 0, s: 0, ...q }, true);
  if (['DD', 'DDD', 'J'].includes(f)) return at({});
  if (['MM', 'MON', 'MONTH', 'RM'].includes(f)) return at({ d: 1 });
  if (['YYYY', 'YEAR', 'SYYYY', 'YYY', 'YY', 'Y'].includes(f)) return at({ mo: 1, d: 1 });
  if (f === 'Q') return at({ mo: Math.floor((p.mo - 1) / 3) * 3 + 1, d: 1 });
  // Đã kiểm trên Oracle XE 21c và 18c thật (NLS_TERRITORY AMERICA): 'DAY' cắt về Chủ nhật.
  if (['DAY', 'DY', 'D'].includes(f)) return addDays(at({}), -weekday(p));
  if (['HH', 'HH12', 'HH24'].includes(f)) return makeDate({ ...p, mi: 0, s: 0 }, true);
  if (f === 'MI') return makeDate({ ...p, s: 0 }, true);
  throw oraFail('01899', 'bad precision specifier', 'bad-trunc-unit', { text: fmt }, span);
}

function toCharOracle(a: Value[], _d: Dialect, span: Span): Value {
  if (a[0] === null) return null;
  const fmt = a.length > 1 && a[1] !== null ? toText(a[1]) : undefined;
  if (isDate(a[0])) return oracleFormat(a[0], fmt ?? 'DD-MON-YY');
  if (typeof a[0] === 'number') {
    if (fmt === undefined) return oracleNumberText(a[0]);
    try {
      return oracleNumberFormat(a[0], fmt);
    } catch (e) {
      if (e instanceof BadNumberFormat) throw oraFail('01481', 'invalid number format model', 'bad-number-format', { fmt }, span);
      throw e;
    }
  }
  return toText(a[0]);
}

/** POWER và POW. Kết quả không tính được hoặc quá lớn thì báo lỗi như DBMS. */
function powerOf(name: string, a: Value[], d: Dialect, span: Span): Value {
  const x = toNumber(a[0], d, span);
  const y = toNumber(a[1], d, span);
  if (x === null || y === null) return null;
  const r = x ** y;
  if (Number.isFinite(r)) return r;
  if (d === 'mysql') throw runtimeError(d, ['1690', '22003', `DOUBLE value is out of range in '${name}(${x},${y})'`], '01426', span, 'number-overflow', { name: 'POWER' });
  if (Number.isNaN(r)) throw oraFail('01428', `argument '${x}' is out of range`, 'arg-out-of-range', { name: 'POWER', value: x }, span);
  throw runtimeError(d, ['1690', '22003', ''], '01426', span, 'number-overflow', { name: 'POWER' });
}

/** Các function engine hiểu, trừ các function gom (COUNT, SUM, AVG, MIN, MAX, GROUP_CONCAT, LISTAGG), GROUPING, EXTRACT và CAST do executor tính. */
export const FUNCTIONS: Record<string, FnDef> = {
  /* chuỗi */
  UPPER: { min: 1, max: 1, run: text((s) => s.toUpperCase()) },
  LOWER: { min: 1, max: 1, run: text((s) => s.toLowerCase()) },
  // MySQL: LENGTH đếm byte, nên chữ có dấu tính nhiều hơn 1. Oracle: LENGTH đếm ký tự.
  LENGTH: { min: 1, max: 1, run: text((s, d) => (d === 'mysql' ? new TextEncoder().encode(s).length : [...s].length)) },
  CHAR_LENGTH: { min: 1, max: 1, only: 'mysql', use: 'LENGTH', run: text((s) => [...s].length) },
  SUBSTR: { min: 2, max: 3, syntax: true, run: substr },
  SUBSTRING: { min: 2, max: 3, syntax: true, only: 'mysql', use: 'SUBSTR', run: substr },
  LEFT: { min: 2, max: 2, only: 'mysql', use: 'SUBSTR(chuỗi, 1, n)', run: (a, d, span) => (a[0] === null || a[1] === null ? null : [...toText(a[0])].slice(0, Math.max(0, toNumber(a[1], d, span)!)).join('')) },
  RIGHT: {
    min: 2,
    max: 2,
    only: 'mysql',
    use: 'SUBSTR(chuỗi, -n)',
    run: (a, d, span) => {
      if (a[0] === null || a[1] === null) return null;
      const n = Math.max(0, toNumber(a[1], d, span)!);
      return n === 0 ? '' : [...toText(a[0])].slice(-n).join('');
    },
  },
  // TRIM(s), hoặc TRIM(LEADING | TRAILING | BOTH 'x' FROM s): đơn vị `unit` là hướng, tham số thứ hai là chuỗi cần cắt.
  TRIM: { min: 1, max: 2, syntax: true, run: trimFn },
  LTRIM: { min: 1, max: 1, arity: { oracle: [1, 2] }, run: (a) => trimSet(a, 'LEADING') },
  RTRIM: { min: 1, max: 1, arity: { oracle: [1, 2] }, run: (a) => trimSet(a, 'TRAILING') },
  // Oracle: bỏ tham số thứ ba, hoặc để '' (là NULL), thì xóa chuỗi tìm ra khỏi chuỗi gốc.
  REPLACE: {
    min: 3,
    max: 3,
    syntax: true,
    arity: { oracle: [2, 3] },
    run: (a, d) => {
      if (a[0] === null) return null;
      if (d === 'oracle') {
        if (a[1] === null) return a[0];
        return toText(a[0]).split(toText(a[1])).join(a[2] === undefined || a[2] === null ? '' : toText(a[2]));
      }
      return a.some((v) => v === null) ? null : toText(a[0]).split(toText(a[1])).join(toText(a[2]));
    },
  },
  INITCAP: { min: 1, max: 1, only: 'oracle', use: 'UPPER hoặc LOWER', run: text((s) => s.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase())) },
  CONCAT: {
    min: 1,
    max: 99,
    arity: { oracle: [2, 2] },
    run: (a, d) => {
      if (d === 'mysql') return a.some((v) => v === null) ? null : a.map((v) => toText(v)).join('');
      return a.map((v) => (v === null ? '' : toText(v, d))).join('');
    },
  },
  CONCAT_WS: {
    min: 2,
    max: 99,
    only: 'mysql',
    use: "dấu ||, ví dụ a || ', ' || b",
    run: (a) => (a[0] === null ? null : a.slice(1).filter((v) => v !== null).map((v) => toText(v)).join(toText(a[0]))),
  },
  INSTR: { min: 2, max: 4, arity: { mysql: [2, 2], oracle: [2, 4] }, run: (a, d, span) => (d === 'mysql' ? mysqlLocate(a[1], a[0]) : oracleInstr(a, d, span)) },
  LOCATE: {
    min: 2,
    max: 3,
    only: 'mysql',
    use: 'INSTR(chuỗi, chuỗi con)',
    run: (a, d, span) => (a.length > 2 && a[2] === null ? 0 : mysqlLocate(a[0], a[1], a.length > 2 ? toNumber(a[2], d, span)! : 1)),
  },
  POSITION: { min: 2, max: 2, only: 'mysql', use: 'INSTR(chuỗi, chuỗi con)', run: (a) => mysqlLocate(a[0], a[1]) },
  LPAD: { min: 2, max: 3, arity: { mysql: [3, 3], oracle: [2, 3] }, run: padWith('l') },
  RPAD: { min: 2, max: 3, arity: { mysql: [3, 3], oracle: [2, 3] }, run: padWith('r') },
  REVERSE: { min: 1, max: 1, syntax: true, only: 'mysql', use: 'SUBSTR từng chữ rồi nối ngược bằng ||', run: text((s) => [...s].reverse().join('')) },
  REPEAT: {
    min: 2,
    max: 2,
    syntax: true,
    only: 'mysql',
    use: 'RPAD(chuỗi, n * LENGTH(chuỗi), chuỗi)',
    run: (a, d, span) => (nul(a) ? null : toText(a[0]).repeat(Math.max(0, Math.trunc(toNumber(a[1], d, span)!)))),
  },
  ASCII: { min: 1, max: 1, syntax: true, run: asciiOf },
  CHAR: { min: 1, max: 99, syntax: true, only: 'mysql', use: 'CHR', run: charOf },
  CHR: { min: 1, max: 1, only: 'oracle', use: 'CHAR', run: charOf },

  /* số */
  ABS: { min: 1, max: 1, run: num(Math.abs) },
  FLOOR: { min: 1, max: 1, run: num(Math.floor) },
  CEIL: { min: 1, max: 1, run: num(Math.ceil) },
  CEILING: { min: 1, max: 1, only: 'mysql', use: 'CEIL', run: num(Math.ceil) },
  ROUND: {
    min: 1,
    max: 2,
    run: (a, d, span) => {
      const n = toNumber(a[0], d, span);
      const p = a.length > 1 ? toNumber(a[1], d, span) : 0;
      if (n === null || p === null) return null;
      return roundHalf(n, p);
    },
  },
  TRUNCATE: {
    min: 2,
    max: 2,
    syntax: true,
    only: 'mysql',
    use: 'TRUNC',
    run: (a, d, span) => {
      const n = toNumber(a[0], d, span);
      const p = toNumber(a[1], d, span);
      return n === null || p === null ? null : truncTo(n, p);
    },
  },
  // Oracle: TRUNC cắt phần lẻ của số, hoặc cắt phần giờ của ngày.
  TRUNC: {
    min: 1,
    max: 2,
    only: 'oracle',
    use: 'TRUNCATE cho số, DATE cho ngày',
    run: (a, d, span) => {
      if (a[0] === null) return null;
      if (isDate(a[0])) return a.length > 1 ? (a[1] === null ? null : truncDate(a[0], toText(a[1]), span)) : midnight(a[0]);
      const p = a.length > 1 ? toNumber(a[1], d, span) : 0;
      return p === null ? null : truncTo(toNumber(a[0], d, span)!, p);
    },
  },
  MOD: {
    min: 2,
    max: 2,
    syntax: true,
    run: (a, d, span) => {
      const x = toNumber(a[0], d, span);
      const y = toNumber(a[1], d, span);
      if (x === null || y === null) return null;
      return y === 0 ? (d === 'oracle' ? x : null) : x % y;
    },
  },
  POWER: { min: 2, max: 2, run: (a, d, span) => powerOf('pow', a, d, span) },
  POW: { min: 2, max: 2, only: 'mysql', use: 'POWER', run: (a, d, span) => powerOf('pow', a, d, span) },
  SQRT: {
    min: 1,
    max: 1,
    run: (a, d, span) => {
      const n = toNumber(a[0], d, span);
      if (n === null) return null;
      if (n < 0) {
        if (d === 'mysql') return null;
        throw oraFail('01428', `argument '${n}' is out of range`, 'arg-out-of-range', { name: 'SQRT', value: n }, span);
      }
      return Math.sqrt(n);
    },
  },
  SIGN: { min: 1, max: 1, run: num(Math.sign) },
  GREATEST: { min: 1, max: 99, arity: { mysql: [2, 99], oracle: [1, 99] }, run: extreme('max') },
  LEAST: { min: 1, max: 99, arity: { mysql: [2, 99], oracle: [1, 99] }, run: extreme('min') },
  FORMAT: {
    min: 2,
    max: 2,
    syntax: true,
    only: 'mysql',
    use: "TO_CHAR(số, 'FM999,999,999')",
    run: (a, d, span) => (nul(a) ? null : mysqlFormatNumber(toNumber(a[0], d, span)!, toNumber(a[1], d, span)!)),
  },

  /* NULL và rẽ nhánh */
  COALESCE: { min: 1, max: 99, syntax: true, arity: { mysql: [1, 99], oracle: [2, 99] }, run: (a) => a.find((v) => v !== null) ?? null },
  IFNULL: { min: 2, max: 2, only: 'mysql', use: 'NVL', run: (a) => (a[0] !== null ? a[0] : a[1]) },
  // Tài liệu 19c: expr1 là chữ thì expr2 đổi sang chữ. expr1 là số thì expr2 đổi sang số (chữ không phải số: ORA-01722).
  NVL: {
    min: 2,
    max: 2,
    only: 'oracle',
    use: 'IFNULL',
    run: (a, d, span) => {
      const [x, y] = a;
      // Đã kiểm trên Oracle XE 21c và 18c thật. Giới hạn đã biết: engine không biết data type của NULL (NVL(cột_số, 'abc') mà cột là NULL
      // thì Oracle báo ORA-01722, engine trả 'abc'), nên chỉ bắt lỗi khi expr1 có giá trị thật.
      if (typeof x === 'number' && typeof y === 'string') toNumber(y, d, span);
      if (isDate(x) && typeof y === 'number') throw oraFail('00932', 'inconsistent datatypes: expected DATE got NUMBER', 'inconsistent-types', { want: 'DATE', got: 'NUMBER' }, span);
      if (typeof x === 'number' && isDate(y)) throw oraFail('00932', 'inconsistent datatypes: expected NUMBER got DATE', 'inconsistent-types', { want: 'NUMBER', got: 'DATE' }, span);
      return x !== null ? x : y;
    },
  },
  USER: { min: 0, max: 0, only: 'oracle', use: 'DATABASE()', bare: ['oracle'], bareOnly: ['oracle'], run: (_a, _d, _s, env) => env.user ?? null },
  NVL2: { min: 3, max: 3, only: 'oracle', use: 'IF(x IS NOT NULL, a, b)', run: (a) => (a[0] !== null ? a[1] : a[2]) },
  NULLIF: { min: 2, max: 2, run: (a, d, span) => (a[0] !== null && a[1] !== null && compare(a[0], a[1], d, span) === 0 ? null : a[0]) },
  IF: { min: 3, max: 3, syntax: true, only: 'mysql', use: 'CASE WHEN ... THEN ... ELSE ... END, hoặc DECODE', run: (a, d, span) => (truthy(a[0], d, span) ? a[1] : a[2]) },
  // DECODE coi NULL bằng NULL. Số tham số chẵn thì tham số cuối là giá trị mặc định, không có thì ra NULL.
  DECODE: {
    min: 3,
    max: 99,
    only: 'oracle',
    use: 'CASE WHEN ... THEN ... ELSE ... END',
    run: (a, d, span) => {
      for (let i = 1; i + 1 < a.length; i += 2) {
        const hit = a[0] === null || a[i] === null ? a[0] === null && a[i] === null : compare(a[0], a[i], d, span) === 0;
        if (hit) return a[i + 1];
      }
      return a.length % 2 === 0 ? a[a.length - 1] : null;
    },
  },

  /* đổi data type */
  CAST: { min: 1, max: 1, run: () => null },
  CONVERT: { min: 1, max: 1, only: 'mysql', use: 'CAST(x AS type)', run: () => null },
  TO_NUMBER: { min: 1, max: 1, only: 'oracle', use: 'CAST(x AS DECIMAL), hoặc phép cộng với 0', run: (a, d, span) => toNumber(a[0], d, span) },

  /* ngày giờ */
  NOW: { min: 0, max: 0, only: 'mysql', use: 'SYSDATE', run: (_a, _d, _s, env) => env.now },
  CURDATE: { min: 0, max: 0, only: 'mysql', use: 'TRUNC(SYSDATE)', run: (_a, _d, _s, env) => ({ kind: 'date', iso: env.now.iso.slice(0, 10) }) },
  SYSDATE: { min: 0, max: 0, bare: ['oracle'], bareOnly: ['oracle'], run: (_a, _d, _s, env) => env.now },
  // Oracle in cả phần giây lẻ và múi giờ. Engine chỉ có ngày giờ, nên SYSTIMESTAMP cho cùng giá trị với SYSDATE.
  SYSTIMESTAMP: { min: 0, max: 0, only: 'oracle', use: 'NOW()', bare: ['oracle'], bareOnly: ['oracle'], run: (_a, _d, _s, env) => env.now },
  CURRENT_TIMESTAMP: { min: 0, max: 0, bare: ['mysql', 'oracle'], bareOnly: ['oracle'], run: (_a, _d, _s, env) => env.now },
  // MySQL: CURRENT_DATE chỉ có ngày. Oracle: DATE luôn kèm giờ.
  CURRENT_DATE: { min: 0, max: 0, bare: ['mysql', 'oracle'], bareOnly: ['oracle'], run: (_a, d, _s, env) => (d === 'mysql' ? { kind: 'date', iso: env.now.iso.slice(0, 10) } : env.now) },
  DATE: {
    min: 1,
    max: 1,
    only: 'mysql',
    use: 'TRUNC',
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      return v ? dateOnly(v) : null;
    },
  },
  YEAR: { min: 1, max: 1, only: 'mysql', use: 'EXTRACT(YEAR FROM ngày)', run: part((p) => p.y) },
  MONTH: { min: 1, max: 1, only: 'mysql', use: 'EXTRACT(MONTH FROM ngày)', run: part((p) => p.mo) },
  DAY: { min: 1, max: 1, only: 'mysql', use: 'EXTRACT(DAY FROM ngày)', run: part((p) => p.d) },
  HOUR: { min: 1, max: 1, only: 'mysql', use: "TO_CHAR(ngày, 'HH24')", run: part((p) => p.h) },
  DATEDIFF: {
    min: 2,
    max: 2,
    only: 'mysql',
    use: 'ngày1 - ngày2',
    run: (a, d, span) => {
      const x = asDate(a[0], d, span);
      const y = asDate(a[1], d, span);
      return x && y ? Math.round(diffDays(dateOnly(x), dateOnly(y))) : null;
    },
  },
  DATE_ADD: { min: 2, max: 2, only: 'mysql', use: 'ngày + số ngày, hoặc ADD_MONTHS', run: dateAdd(1) },
  DATE_SUB: { min: 2, max: 2, only: 'mysql', use: 'ngày - số ngày, hoặc ADD_MONTHS với số âm', run: dateAdd(-1) },
  TIMESTAMPDIFF: { min: 2, max: 2, shown: [3, 3], only: 'mysql', use: 'ngày - ngày (ra số ngày), hoặc MONTHS_BETWEEN', run: timestampDiff },
  DAYNAME: {
    min: 1,
    max: 1,
    only: 'mysql',
    use: "TO_CHAR(ngày, 'DAY')",
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      return v ? DAYS[weekday(dateParts(v))] : null;
    },
  },
  MONTHNAME: {
    min: 1,
    max: 1,
    only: 'mysql',
    use: "TO_CHAR(ngày, 'MONTH')",
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      return v ? MONTHS[dateParts(v).mo - 1] : null;
    },
  },
  DAYOFWEEK: { min: 1, max: 1, only: 'mysql', use: "TO_CHAR(ngày, 'DY')", run: part((p) => weekday(p) + 1) },
  WEEKDAY: { min: 1, max: 1, only: 'mysql', use: "TO_CHAR(ngày, 'DY')", run: part((p) => (weekday(p) + 6) % 7) },
  QUARTER: { min: 1, max: 1, syntax: true, only: 'mysql', use: "TO_CHAR(ngày, 'Q')", run: part((p) => Math.ceil(p.mo / 3)) },
  // MySQL cho ngày thuần (bỏ giờ). Oracle giữ nguyên giờ.
  LAST_DAY: {
    min: 1,
    max: 1,
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      if (!v) return null;
      return d === 'mysql' ? dateOnly(lastDayOf(v)) : lastDayOf(v);
    },
  },
  ADD_MONTHS: {
    min: 2,
    max: 2,
    only: 'oracle',
    use: 'DATE_ADD(ngày, INTERVAL n MONTH)',
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      const n = toNumber(a[1], d, span);
      return !v || n === null ? null : addMonths(v, Math.trunc(n), true);
    },
  },
  // Cùng ngày trong tháng, hoặc cùng là ngày cuối tháng: ra số nguyên. Ngoài ra tính phần lẻ trên tháng 31 ngày.
  MONTHS_BETWEEN: {
    min: 2,
    max: 2,
    only: 'oracle',
    use: 'TIMESTAMPDIFF(MONTH, ngày1, ngày2)',
    run: (a, d, span) => {
      const x = asDate(a[0], d, span);
      const y = asDate(a[1], d, span);
      if (!x || !y) return null;
      const p = dateParts(x);
      const q = dateParts(y);
      const months = (p.y - q.y) * 12 + (p.mo - q.mo);
      const end = (z: Parts) => z.d === new Date(Date.UTC(z.y, z.mo, 0)).getUTCDate();
      if (p.d === q.d || (end(p) && end(q))) return months;
      const secs = (z: Parts) => z.h * 3600 + z.mi * 60 + z.s;
      return tidy(months + (p.d - q.d + (secs(p) - secs(q)) / 86400) / 31);
    },
  },
  NEXT_DAY: {
    min: 2,
    max: 2,
    only: 'oracle',
    use: 'DATE_ADD kết hợp WEEKDAY',
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      if (!v || a[1] === null) return null;
      const name = toText(a[1]).trim().toUpperCase();
      const want = DAY_KEYS.findIndex((n) => name.length >= 3 && n.startsWith(name));
      if (want < 0) throw oraFail('01846', 'not a valid day of the week', 'bad-day-name', { text: toText(a[1]) }, span);
      const here = weekday(dateParts(v));
      return addDays(v, ((want - here + 6) % 7) + 1);
    },
  },
  DATE_FORMAT: {
    min: 2,
    max: 2,
    only: 'mysql',
    use: 'TO_CHAR',
    run: (a, d, span) => {
      const v = asDate(a[0], d, span);
      return v && a[1] !== null ? mysqlFormat(v, toText(a[1])) : null;
    },
  },
  STR_TO_DATE: { min: 2, max: 2, only: 'mysql', use: 'TO_DATE', run: (a, d) => (a[0] === null || a[1] === null ? null : parseWith(toText(a[0]), toText(a[1]), d)) },
  TO_CHAR: { min: 1, max: 2, only: 'oracle', use: 'DATE_FORMAT cho ngày, FORMAT cho số', run: toCharOracle },
  TO_DATE: {
    min: 1,
    max: 2,
    only: 'oracle',
    use: 'STR_TO_DATE',
    run: (a, d, span) => {
      if (a[0] === null) return null;
      if (isDate(a[0])) return a[0];
      const s = toText(a[0]);
      // Không có mẫu thì Oracle dùng định dạng mặc định DD-MON-RR. Chuỗi kiểu 2026-03-02 không khớp.
      const v = a.length > 1 && a[1] !== null ? parseWith(s, toText(a[1]), d) : parseOracleDefaultDate(s);
      if (!v) throw runtimeError(d, ['1411', 'HY000', ''], '01861', span, 'date-literal-oracle', { text: s });
      return { kind: 'date', iso: fullIso(v) };
    },
  },
};

/** EXTRACT(unit FROM ngày) */
export function extract(unit: string, v: Value, d: Dialect, span: Span): Value {
  const date = asDate(v, d, span);
  if (!date) return null;
  const p = dateParts(date);
  const map: Record<string, number> = { YEAR: p.y, MONTH: p.mo, DAY: p.d, HOUR: p.h, MINUTE: p.mi, SECOND: p.s };
  return map[unit] ?? null;
}

export { castValue };
