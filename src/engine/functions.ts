import type { Dialect, SqlDate, Value } from './types';
import { type Span, runtimeError } from './errors';
import { isDate, parseIsoDate, toNumber, toText } from './values';

/** Thứ engine cần biết lúc chạy function. */
export interface FnEnv {
  /** "Bây giờ" của khóa học, cố định để kết quả không đổi theo ngày. */
  now: SqlDate;
  /** Sequence của Oracle. Session cấp hai hàm này. Không có thì mọi sequence đều không tồn tại. */
  seq?: {
    next(name: string, span: Span): number;
    curr(name: string, span: Span): number;
  };
}

export interface FnDef {
  min: number;
  max: number;
  /** Function chỉ có ở một dialect. */
  only?: Dialect;
  /** Tên function tương đương ở dialect kia. */
  use?: string;
  /** Viết được mà không cần ngoặc, ví dụ SYSDATE. Giá trị là các dialect cho phép. */
  bare?: Dialect[];
  /** Bắt buộc viết không ngoặc ở dialect này. */
  bareOnly?: Dialect[];
  run: (a: Value[], d: Dialect, span: Span, env: FnEnv) => Value;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

interface Parts {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

export function dateParts(v: SqlDate): Parts {
  const [date, time = '00:00:00'] = v.iso.split(' ');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi, s] = time.split(':').map(Number);
  return { y, mo, d, h, mi, s };
}

export function makeDate(p: Parts, withTime: boolean): SqlDate {
  const date = `${pad(p.y, 4)}-${pad(p.mo)}-${pad(p.d)}`;
  return { kind: 'date', iso: withTime ? `${date} ${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}` : date };
}

const utc = (p: Parts) => Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);

/** Cộng một số ngày (có thể lẻ) vào một ngày. */
export function addDays(v: SqlDate, days: number): SqlDate {
  const t = new Date(utc(dateParts(v)) + Math.round(days * 86400000));
  const withTime = v.iso.length > 10 || !Number.isInteger(days);
  return makeDate({ y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() }, withTime);
}

/** Số ngày giữa hai ngày: a trừ b. */
export function diffDays(a: SqlDate, b: SqlDate): number {
  return (utc(dateParts(a)) - utc(dateParts(b))) / 86400000;
}

/** Đổi một giá trị thành ngày theo luật của dialect. MySQL tự hiểu chuỗi ISO, Oracle thì không. */
function asDate(v: Value, d: Dialect, span: Span): SqlDate | null {
  if (v === null) return null;
  if (isDate(v)) return v;
  if (typeof v === 'string' && d === 'mysql') return parseIsoDate(v);
  throw runtimeError(d, ['1525', 'HY000', `Incorrect DATE value: '${toText(v)}'`], '01861', span, 'date-literal-oracle', { text: toText(v) });
}

/** Định dạng ngày theo mẫu của MySQL: %Y, %m, %d... */
function mysqlFormat(v: SqlDate, fmt: string): string {
  const p = dateParts(v);
  const dow = new Date(utc(p)).getUTCDay();
  const map: Record<string, string> = {
    Y: pad(p.y, 4),
    y: pad(p.y % 100),
    m: pad(p.mo),
    c: String(p.mo),
    d: pad(p.d),
    e: String(p.d),
    H: pad(p.h),
    k: String(p.h),
    i: pad(p.mi),
    s: pad(p.s),
    S: pad(p.s),
    M: MONTHS[p.mo - 1],
    b: MONTHS[p.mo - 1].slice(0, 3),
    W: DAYS[dow],
    a: DAYS[dow].slice(0, 3),
    T: `${pad(p.h)}:${pad(p.mi)}:${pad(p.s)}`,
    '%': '%',
  };
  return fmt.replace(/%(.)/g, (_m, c: string) => map[c] ?? c);
}

const ORACLE_TOKENS = ['YYYY', 'HH24', 'MONTH', 'MON', 'DAY', 'MM', 'DD', 'DY', 'YY', 'HH', 'MI', 'SS'];

/** Định dạng ngày theo mẫu của Oracle: YYYY, MM, DD, HH24, MI, SS... */
function oracleFormat(v: SqlDate, fmt: string): string {
  const p = dateParts(v);
  const dow = new Date(utc(p)).getUTCDay();
  let out = '';
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === '"') {
      const j = fmt.indexOf('"', i + 1);
      out += fmt.slice(i + 1, j < 0 ? fmt.length : j);
      i = j < 0 ? fmt.length : j + 1;
      continue;
    }
    const tok = ORACLE_TOKENS.find((t) => fmt.slice(i, i + t.length).toUpperCase() === t);
    if (!tok) {
      out += fmt[i++];
      continue;
    }
    const raw = fmt.slice(i, i + tok.length);
    const cased = (s: string) => (raw === raw.toUpperCase() ? s.toUpperCase() : raw[0] === raw[0].toUpperCase() ? s : s.toLowerCase());
    switch (tok) {
      case 'YYYY':
        out += pad(p.y, 4);
        break;
      case 'YY':
        out += pad(p.y % 100);
        break;
      case 'MM':
        out += pad(p.mo);
        break;
      case 'DD':
        out += pad(p.d);
        break;
      case 'HH24':
        out += pad(p.h);
        break;
      case 'HH':
        out += pad(p.h % 12 === 0 ? 12 : p.h % 12);
        break;
      case 'MI':
        out += pad(p.mi);
        break;
      case 'SS':
        out += pad(p.s);
        break;
      case 'MONTH':
        out += cased(MONTHS[p.mo - 1]);
        break;
      case 'MON':
        out += cased(MONTHS[p.mo - 1].slice(0, 3));
        break;
      case 'DAY':
        out += cased(DAYS[dow]);
        break;
      case 'DY':
        out += cased(DAYS[dow].slice(0, 3));
        break;
    }
    i += tok.length;
  }
  return out;
}

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

const text = (f: (s: string, d: Dialect) => Value) => (a: Value[], d: Dialect) => (a[0] === null ? null : f(toText(a[0]), d));
const num = (f: (n: number) => number) => (a: Value[], d: Dialect, span: Span) => {
  const n = toNumber(a[0], d, span);
  return n === null ? null : f(n);
};
const roundTo = (n: number, p: number, fn: (x: number) => number) => {
  const k = 10 ** Math.trunc(p);
  return fn(n * k) / k;
};
const part = (pick: (p: Parts) => number) => (a: Value[], d: Dialect, span: Span) => {
  const v = asDate(a[0], d, span);
  return v ? pick(dateParts(v)) : null;
};

function substr(a: Value[], d: Dialect, span: Span): Value {
  if (a[0] === null || a[1] === null) return null;
  const s = [...toText(a[0])];
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

/** Các function engine hiểu, trừ năm function gom (COUNT, SUM, AVG, MIN, MAX) do executor tính. */
export const FUNCTIONS: Record<string, FnDef> = {
  /* chuỗi */
  UPPER: { min: 1, max: 1, run: text((s) => s.toUpperCase()) },
  LOWER: { min: 1, max: 1, run: text((s) => s.toLowerCase()) },
  // MySQL: LENGTH đếm byte, nên chữ có dấu tính nhiều hơn 1. Oracle: LENGTH đếm ký tự.
  LENGTH: { min: 1, max: 1, run: text((s, d) => (d === 'mysql' ? new TextEncoder().encode(s).length : [...s].length)) },
  CHAR_LENGTH: { min: 1, max: 1, only: 'mysql', use: 'LENGTH', run: text((s) => [...s].length) },
  SUBSTR: { min: 2, max: 3, run: substr },
  SUBSTRING: { min: 2, max: 3, only: 'mysql', use: 'SUBSTR', run: substr },
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
  TRIM: { min: 1, max: 1, run: text((s) => s.trim()) },
  LTRIM: { min: 1, max: 1, run: text((s) => s.trimStart()) },
  RTRIM: { min: 1, max: 1, run: text((s) => s.trimEnd()) },
  REPLACE: { min: 3, max: 3, run: (a) => (a.some((v) => v === null) ? null : toText(a[0]).split(toText(a[1])).join(toText(a[2]))) },
  INITCAP: { min: 1, max: 1, only: 'oracle', use: 'UPPER hoặc LOWER', run: text((s) => s.toLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase())) },
  CONCAT: {
    min: 1,
    max: 99,
    run: (a, d) => {
      if (d === 'mysql') return a.some((v) => v === null) ? null : a.map(toText).join('');
      return a.map((v) => (v === null ? '' : toText(v))).join('');
    },
  },

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
      return Math.sign(n) * roundTo(Math.abs(n) + 1e-9, p, Math.round);
    },
  },
  TRUNCATE: {
    min: 2,
    max: 2,
    only: 'mysql',
    use: 'TRUNC',
    run: (a, d, span) => {
      const n = toNumber(a[0], d, span);
      const p = toNumber(a[1], d, span);
      return n === null || p === null ? null : roundTo(n, p, Math.trunc);
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
      if (isDate(a[0])) return { kind: 'date', iso: `${a[0].iso.slice(0, 10)} 00:00:00` };
      const p = a.length > 1 ? toNumber(a[1], d, span) : 0;
      return p === null ? null : roundTo(toNumber(a[0], d, span)!, p, Math.trunc);
    },
  },
  MOD: {
    min: 2,
    max: 2,
    run: (a, d, span) => {
      const x = toNumber(a[0], d, span);
      const y = toNumber(a[1], d, span);
      if (x === null || y === null) return null;
      return y === 0 ? (d === 'oracle' ? x : null) : x % y;
    },
  },

  /* NULL */
  COALESCE: { min: 1, max: 99, run: (a) => a.find((v) => v !== null) ?? null },
  IFNULL: { min: 2, max: 2, only: 'mysql', use: 'NVL', run: (a) => (a[0] !== null ? a[0] : a[1]) },
  NVL: { min: 2, max: 2, only: 'oracle', use: 'IFNULL', run: (a) => (a[0] !== null ? a[0] : a[1]) },
  NULLIF: { min: 2, max: 2, run: (a) => (a[0] !== null && a[1] !== null && toText(a[0]) === toText(a[1]) ? null : a[0]) },

  /* ngày giờ */
  NOW: { min: 0, max: 0, only: 'mysql', use: 'SYSDATE', run: (_a, _d, _s, env) => env.now },
  CURDATE: { min: 0, max: 0, only: 'mysql', use: 'TRUNC(SYSDATE)', run: (_a, _d, _s, env) => ({ kind: 'date', iso: env.now.iso.slice(0, 10) }) },
  SYSDATE: { min: 0, max: 0, bare: ['oracle'], bareOnly: ['oracle'], run: (_a, _d, _s, env) => env.now },
  CURRENT_TIMESTAMP: { min: 0, max: 0, bare: ['mysql', 'oracle'], bareOnly: ['oracle'], run: (_a, _d, _s, env) => env.now },
  // MySQL: CURRENT_DATE chỉ có ngày. Oracle: DATE luôn kèm giờ.
  CURRENT_DATE: { min: 0, max: 0, bare: ['mysql', 'oracle'], bareOnly: ['oracle'], run: (_a, d, _s, env) => (d === 'mysql' ? { kind: 'date', iso: env.now.iso.slice(0, 10) } : env.now) },
  DATE: { min: 1, max: 1, only: 'mysql', use: 'TRUNC', run: (a, d, span) => {
    const v = asDate(a[0], d, span);
    return v ? { kind: 'date', iso: v.iso.slice(0, 10) } : null;
  } },
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
      return x && y ? Math.round(diffDays({ kind: 'date', iso: x.iso.slice(0, 10) }, { kind: 'date', iso: y.iso.slice(0, 10) })) : null;
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
  TO_CHAR: {
    min: 1,
    max: 2,
    only: 'oracle',
    use: 'DATE_FORMAT',
    run: (a) => {
      if (a[0] === null) return null;
      if (!isDate(a[0])) return toText(a[0]);
      return oracleFormat(a[0], a.length > 1 && a[1] !== null ? toText(a[1]) : 'DD-MON-YY');
    },
  },
  TO_DATE: {
    min: 1,
    max: 2,
    only: 'oracle',
    use: 'STR_TO_DATE',
    run: (a, d, span) => {
      if (a[0] === null) return null;
      if (isDate(a[0])) return a[0];
      const s = toText(a[0]);
      // Không có mẫu thì Oracle dùng định dạng mặc định DD-MON-RR, chuỗi kiểu 2026-03-02 không khớp.
      const v = a.length > 1 && a[1] !== null ? parseWith(s, toText(a[1]), d) : null;
      if (!v) throw runtimeError(d, ['1411', 'HY000', ''], '01861', span, 'date-literal-oracle', { text: s });
      return { kind: 'date', iso: v.iso.length === 10 ? `${v.iso} 00:00:00` : v.iso };
    },
  },
  TO_NUMBER: { min: 1, max: 1, only: 'oracle', use: 'phép cộng với 0', run: (a, d, span) => toNumber(a[0], d, span) },
};

/** EXTRACT(unit FROM ngày) */
export function extract(unit: string, v: Value, d: Dialect, span: Span): Value {
  const date = asDate(v, d, span);
  if (!date) return null;
  const p = dateParts(date);
  const map: Record<string, number> = { YEAR: p.y, MONTH: p.mo, DAY: p.d, HOUR: p.h, MINUTE: p.mi, SECOND: p.s };
  return map[unit] ?? null;
}
