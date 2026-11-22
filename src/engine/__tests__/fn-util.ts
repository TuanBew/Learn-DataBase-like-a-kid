import { run } from '../index';
import type { Dialect, Value } from '../index';
import { teashop as base } from '../../data/teashop';
import type { Database } from '../types';

/** Database mẫu của các test function: teashop thêm table `s` (bán hàng theo vùng) để thử gom nhóm. */
export const sales: Database = {
  ...base,
  tables: [
    ...base.tables,
    {
      name: 's',
      columns: [
        { name: 'id', type: 'int', pk: true },
        { name: 'region', type: 'text' },
        { name: 'prod', type: 'text' },
        { name: 'qty', type: 'int' },
        { name: 'd', type: 'date' },
      ],
      rows: [
        [1, 'Nam', 'Tra', 5, '2026-01-05'],
        [2, 'Bac', 'Sua', 3, '2026-01-20'],
        [3, 'Nam', 'Sua', 7, '2026-02-03'],
        [4, 'Bac', 'Tra', null, '2026-02-10'],
        [5, 'Nam', 'Tra', 2, '2026-02-11'],
        [6, null, 'Tra', 4, '2026-03-01'],
        [7, 'Bac', 'Tra', 1, '2026-03-02'],
      ],
    },
  ],
};

export const cell = (v: Value) => (typeof v === 'object' && v !== null ? v.iso : v);

/** Chạy một câu SELECT, ném lỗi nếu query lỗi. */
export const rows = (sql: string, d: Dialect) => {
  const r = run(sql, sales, d);
  if (!r.ok) throw new Error(`[${d}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return { rows: r.result.rows.map((row) => row.map(cell)), columns: r.result.columns, warnings: r.result.warnings };
};

/** Lỗi của một câu SELECT. Ném lỗi nếu query chạy được. */
export const fails = (sql: string, d: Dialect) => {
  const r = run(sql, sales, d);
  if (r.ok) throw new Error(`[${d}] ${sql}\n   -> expected error, got ${JSON.stringify(r.result.rows)}`);
  return r.error;
};

const wrap = (expr: string, d: Dialect) => (d === 'oracle' ? `SELECT ${expr} FROM dual` : `SELECT ${expr}`);

/** Giá trị của một biểu thức, tính trên một câu SELECT không có table. */
export const val = (expr: string, d: Dialect) => rows(wrap(expr, d), d).rows[0][0];

/** Lỗi của một biểu thức. */
export const bad = (expr: string, d: Dialect) => fails(wrap(expr, d), d);

export type Case = [expr: string, expected: Value];
