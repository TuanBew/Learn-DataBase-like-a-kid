import type { Dialect, Value } from './types';
import type { Span } from './errors';
import { toNumber, toText } from './values';

export interface FnDef {
  min: number;
  max: number;
  /** Function chỉ có ở một dialect. */
  only?: Dialect;
  /** Tên function tương đương ở dialect kia. */
  use?: string;
  run: (a: Value[], d: Dialect, span: Span) => Value;
}

const text = (f: (s: string, d: Dialect) => Value) => (a: Value[], d: Dialect) => (a[0] === null ? null : f(toText(a[0]), d));

/** Các function engine hiểu. Mốc 2 sẽ thêm function chuỗi và ngày giờ. */
export const FUNCTIONS: Record<string, FnDef> = {
  UPPER: { min: 1, max: 1, run: text((s) => s.toUpperCase()) },
  LOWER: { min: 1, max: 1, run: text((s) => s.toLowerCase()) },
  // MySQL: LENGTH đếm byte, nên chữ có dấu tính nhiều hơn 1. Oracle: LENGTH đếm ký tự.
  LENGTH: { min: 1, max: 1, run: text((s, d) => (d === 'mysql' ? new TextEncoder().encode(s).length : [...s].length)) },
  CHAR_LENGTH: { min: 1, max: 1, only: 'mysql', use: 'LENGTH', run: text((s) => [...s].length) },
  ABS: {
    min: 1,
    max: 1,
    run: (a, d, span) => {
      const n = toNumber(a[0], d, span);
      return n === null ? null : Math.abs(n);
    },
  },
  ROUND: {
    min: 1,
    max: 2,
    run: (a, d, span) => {
      const n = toNumber(a[0], d, span);
      const p = a.length > 1 ? toNumber(a[1], d, span) : 0;
      if (n === null || p === null) return null;
      const k = 10 ** Math.trunc(p);
      return (Math.sign(n) * Math.round(Math.abs(n) * k + 1e-9)) / k;
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
  COALESCE: { min: 1, max: 99, run: (a) => a.find((v) => v !== null) ?? null },
  IFNULL: { min: 2, max: 2, only: 'mysql', use: 'NVL', run: (a) => (a[0] !== null ? a[0] : a[1]) },
  NVL: { min: 2, max: 2, only: 'oracle', use: 'IFNULL', run: (a) => (a[0] !== null ? a[0] : a[1]) },
  CONCAT: {
    min: 1,
    max: 99,
    run: (a, d) => {
      if (d === 'mysql') return a.some((v) => v === null) ? null : a.map(toText).join('');
      return a.map((v) => (v === null ? '' : toText(v))).join('');
    },
  },
};
