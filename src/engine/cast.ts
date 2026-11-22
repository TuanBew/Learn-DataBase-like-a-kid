import type { CastType } from './ast';
import { MONTHS, makeDate, oracleFormat, parseLooseDate } from './dates';
import { type Span, oraFail, runtimeError } from './errors';
import { oracleNumberText, roundHalf } from './numfmt';
import type { Dialect, SqlDate, Value } from './types';
import { isDate, toNumber, toText, warn } from './values';

const INT_PREFIX = /^\s*[+-]?\d+/;
const DEC_PREFIX = /^\s*[+-]?(\d+\.?\d*|\.\d+)/;

const dateOnly = (v: SqlDate): SqlDate => ({ kind: 'date', iso: v.iso.slice(0, 10) });
const withTime = (v: SqlDate): SqlDate => ({ kind: 'date', iso: v.iso.length === 10 ? `${v.iso} 00:00:00` : v.iso });

/** Chuỗi như `09-MAR-26`: dạng ngày mặc định của Oracle (DD-MON-RR). */
export function parseOracleDefaultDate(text: string): SqlDate | null {
  const m = /^\s*(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})\s*$/.exec(text);
  if (!m) return null;
  const mo = MONTHS.findIndex((n) => n.slice(0, 3).toUpperCase() === m[2].toUpperCase()) + 1;
  let y = Number(m[3]);
  if (m[3].length === 2) y += y < 50 ? 2000 : 1900;
  const d = Number(m[1]);
  if (mo === 0 || d < 1 || d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return null;
  return makeDate({ y, mo, d, h: 0, mi: 0, s: 0 }, true);
}

/** Số bị chặn ở trần của DECIMAL(p,s). */
function clampDecimal(n: number, p: number, s: number): number {
  const max = 10 ** (p - s) - 10 ** -s;
  if (Math.abs(n) <= max + 1e-12) return n;
  warn(1264, "Out of range value for column 'CAST' at row 1");
  return n < 0 ? -roundHalf(max, s) : roundHalf(max, s);
}

function mysqlCast(v: Value, t: CastType, d: Dialect, span: Span): Value {
  switch (t.kind) {
    case 'signed':
    case 'unsigned': {
      let n: number;
      if (typeof v === 'string') {
        const m = INT_PREFIX.exec(v);
        // Chuỗi không phải số nguyên thuần: lấy phần số nguyên đứng đầu, kèm cảnh báo.
        if (!/^\s*[+-]?\d+\s*$/.test(v)) warn(1292, `Truncated incorrect INTEGER value: '${v}'`);
        n = m ? Number(m[0]) : 0;
      } else n = roundHalf(toNumber(v, d, span)!, 0);
      if (t.kind === 'unsigned' && n < 0) {
        warn(1105, 'Cast to unsigned converted negative integer to its positive complement');
        return (2n ** 64n + BigInt(n)).toString();
      }
      return n;
    }
    case 'decimal': {
      const p = t.p ?? 10;
      const s = t.s ?? 0;
      let n: number;
      if (typeof v === 'string') {
        const m = DEC_PREFIX.exec(v);
        if (!m || m[0].trim().length !== v.trim().length) warn(1292, `Truncated incorrect DECIMAL value: '${v}'`);
        n = m ? Number(m[0]) : 0;
      } else n = toNumber(v, d, span)!;
      return clampDecimal(roundHalf(n, s), p, s);
    }
    case 'double':
      return toNumber(v, d, span);
    case 'char': {
      const s = toText(v);
      if (t.n !== undefined && [...s].length > t.n) {
        warn(1292, `Truncated incorrect CHAR(${t.n}) value: '${s}'`);
        return [...s].slice(0, t.n).join('');
      }
      return s;
    }
    default: {
      // date, datetime
      const kind = t.kind === 'date' ? 'date' : 'datetime';
      let out: SqlDate | null = null;
      if (isDate(v)) out = v;
      else {
        const text = typeof v === 'number' ? String(v) : toText(v);
        const r = typeof v === 'boolean' ? null : parseLooseDate(text);
        if (r) {
          out = r.date;
          if (!r.clean) warn(1292, `Truncated incorrect ${kind} value: '${text}'`);
        } else warn(1292, `Incorrect datetime value: '${text}'`);
      }
      if (!out) return null;
      return kind === 'date' ? dateOnly(out) : withTime(out);
    }
  }
}

function oracleCast(v: Value, t: CastType, d: Dialect, span: Span): Value {
  switch (t.kind) {
    case 'number': {
      if (isDate(v)) throw oraFail('00932', 'inconsistent datatypes: expected NUMBER got DATE', 'inconsistent-types', { want: 'NUMBER', got: 'DATE' }, span);
      let n = toNumber(v, d, span)!;
      if (t.s !== undefined) n = roundHalf(n, t.s);
      if (t.p !== undefined && Math.abs(n) >= 10 ** (t.p - (t.s ?? 0))) {
        throw runtimeError(d, ['1264', '22003', ''], '01438', span, 'number-too-big', { p: t.p, s: t.s ?? 0 });
      }
      return n;
    }
    case 'text': {
      const s = isDate(v) ? oracleFormat(v, 'DD-MON-YY') : typeof v === 'number' ? oracleNumberText(v) : toText(v);
      return t.n !== undefined ? [...s].slice(0, t.n).join('') : s;
    }
    default: {
      if (isDate(v)) return withTime(v);
      if (typeof v === 'string') {
        const r = parseOracleDefaultDate(v);
        if (!r) throw runtimeError(d, ['1525', 'HY000', ''], '01861', span, 'date-literal-oracle', { text: v });
        return r;
      }
      throw oraFail('00932', 'inconsistent datatypes: expected DATE got NUMBER', 'inconsistent-types', { want: 'DATE', got: 'NUMBER' }, span);
    }
  }
}

/** CAST(v AS type) và CONVERT(v, type). NULL luôn ra NULL. */
export function castValue(v: Value, t: CastType, d: Dialect, span: Span): Value {
  if (v === null) return null;
  return d === 'mysql' ? mysqlCast(v, t, d, span) : oracleCast(v, t, d, span);
}
