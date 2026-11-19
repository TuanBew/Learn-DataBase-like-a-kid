import type { Database, Dialect } from './types';
import { SqlError, unsupported } from './errors';
import { execSelect } from './executor';
import { friendly } from './messages.vi';
import { parse } from './parser';
import type { ResultSet, Trace } from './trace';

export type SelectResult = { ok: true; result: ResultSet; trace: Trace } | { ok: false; error: SqlError };

/**
 * Chạy một câu SELECT trên database mẫu. Không bao giờ ném lỗi ra ngoài:
 * lỗi nào cũng trở thành `SqlError` có lời giải thích cho người học.
 * Lệnh sửa dữ liệu (INSERT, UPDATE, DELETE, COMMIT...) cần `createSession`.
 */
export function run(sql: string, db: Database, dialect: Dialect): SelectResult {
  try {
    const stmt = parse(sql, dialect);
    if (stmt.t !== 'select') {
      const err = unsupported('', { s: 0, e: sql.length });
      err.hint = 'select-only';
      err.friendly = friendly['select-only']({});
      return { ok: false, error: err };
    }
    const trace = execSelect(stmt, db, dialect, sql);
    return { ok: true, result: trace.result, trace };
  } catch (e) {
    if (e instanceof SqlError) return { ok: false, error: e };
    const err = unsupported('', { s: 0, e: sql.length });
    err.hint = 'internal';
    err.friendly = friendly.internal({});
    return { ok: false, error: err };
  }
}

export { SqlError } from './errors';
export { grade } from './grade';
export type { GradeOptions, GradeReport } from './grade';
export { createSession } from './session';
export type { DmlTrace, RunResult, Session } from './session';
export type { ResultSet, Trace, TraceStep, TraceClause, TraceCol, TraceRow } from './trace';
export type { Database, Dialect, Value, TableDef, ColumnDef, ColumnType } from './types';
export { show, showQuoted, toText } from './values';
