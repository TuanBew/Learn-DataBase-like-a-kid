import { createSession } from '../index';
import type { Database, Dialect, Session, Value } from '../index';

/** Đồ dùng chung cho các test DDL: session trên database rỗng, chạy lệnh và đọc kết quả. */

export const EMPTY: Database = { name: 'lab', tables: [] };
const cell = (v: Value) => (typeof v === 'object' && v !== null ? v.iso : v);

export const S = (d: Dialect): Session => createSession(EMPTY, d);

export const good = (s: Session, sql: string) => {
  const r = s.run(sql);
  if (!r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return r;
};

export const err = (s: Session, sql: string) => {
  const r = s.run(sql);
  if (r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> expected error, got ${r.kind}`);
  return r.error;
};

export const rows = (s: Session, sql: string) => {
  const r = s.run(sql);
  if (!r.ok || r.kind !== 'select') throw new Error(`[${s.dialect}] ${sql} -> không phải SELECT thành công`);
  return r.result.rows.map((row) => row.map(cell));
};

export const all = (s: Session, sqls: string[]) => sqls.forEach((x) => good(s, x));

export const BOTH: Dialect[] = ['mysql', 'oracle'];
export const INT: Record<Dialect, string> = { mysql: 'INT', oracle: 'NUMBER' };
export const TEXT: Record<Dialect, string> = { mysql: 'VARCHAR', oracle: 'VARCHAR2' };
