import { createSession } from '../index';
import type { Database, Dialect, RunResult, Session, Value } from '../index';

/** Database mẫu của các test báo cáo nâng cao: giống hệt database `congty` đã nạp vào MySQL 8.0.46 để đối chiếu. */
export const congty: Database = {
  name: 'congty',
  tables: [
    {
      name: 'employees',
      columns: [
        { name: 'id', type: 'int', pk: true },
        { name: 'name', type: 'text', notNull: true, sqlType: 'VARCHAR', length: 50 },
        { name: 'dept', type: 'text', sqlType: 'VARCHAR', length: 20 },
        { name: 'salary', type: 'decimal', sqlType: 'DECIMAL', precision: 10, scale: 2 },
        { name: 'hired', type: 'date' },
      ],
      rows: [
        [1, 'An', 'IT', 100, '2020-01-01'],
        [2, 'Binh', 'IT', 200, '2021-01-01'],
        [3, 'Chi', 'HR', 150, '2019-05-05'],
        [4, 'Dung', 'HR', 150, '2022-02-02'],
        [5, 'Em', null, 90, '2023-03-03'],
      ],
    },
    {
      name: 'kv',
      columns: [
        { name: 'k', type: 'text', pk: true, sqlType: 'VARCHAR', length: 5 },
        { name: 'v', type: 'int' },
        { name: 'w', type: 'int' },
      ],
      rows: [
        ['a', 1, 1],
        ['b', 2, 2],
      ],
    },
  ],
};

export const DIALECTS: Dialect[] = ['mysql', 'oracle'];
export const each = (it: (name: string, fn: () => void) => void, name: string, fn: (d: Dialect) => void) => {
  for (const d of DIALECTS) it(`[${d}] ${name}`, () => fn(d));
};

export const cell = (v: Value) => (typeof v === 'object' && v !== null ? v.iso : v);

export const sess = (d: Dialect): Session => createSession(congty, d);

export function must(r: RunResult, sql = ''): Exclude<RunResult, { ok: false }> {
  if (!r.ok) throw new Error(`${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return r;
}

/** Chạy một lệnh, ném lỗi nếu lệnh lỗi. */
export const exec = (s: Session, sql: string) => must(s.run(sql), `[${s.dialect}] ${sql}`);

/** Chạy một lệnh phải lỗi, trả về lỗi. */
export function bad(s: Session, sql: string) {
  const r = s.run(sql);
  if (r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> expected error`);
  return r.error;
}

/** Các row của một SELECT, ô ngày đổi thành chuỗi. */
export function sel(s: Session, sql: string): Value[][] {
  const r = exec(s, sql);
  if (r.kind !== 'select') throw new Error(`[${s.dialect}] ${sql}\n   -> không phải SELECT`);
  return r.result.rows.map((row) => row.map(cell) as Value[]);
}

export const col0 = (s: Session, sql: string) => sel(s, sql).map((r) => r[0]);
