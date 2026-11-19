import type { Database, Dialect } from './types';
import { SqlError, unsupported } from './errors';
import { parse } from './parser';
import { execSelect } from './executor';
import type { ResultSet, Trace } from './trace';

export type RunResult = { ok: true; result: ResultSet; trace: Trace } | { ok: false; error: SqlError };

/**
 * Chạy một câu query trên database mẫu. Không bao giờ ném lỗi ra ngoài:
 * lỗi nào cũng trở thành `SqlError` có lời giải thích cho người học.
 */
export function run(sql: string, db: Database, dialect: Dialect): RunResult {
  try {
    const stmt = parse(sql, dialect);
    const trace = execSelect(stmt, db, dialect, sql);
    return { ok: true, result: trace.result, trace };
  } catch (e) {
    if (e instanceof SqlError) return { ok: false, error: e };
    const err = unsupported('', { s: 0, e: sql.length });
    err.hint = 'internal';
    err.friendly = 'Engine của khóa học chưa chạy được query này. Thử viết query gọn hơn.';
    return { ok: false, error: err };
  }
}

export { SqlError } from './errors';
export { grade } from './grade';
export type { GradeOptions, GradeReport } from './grade';
export type { ResultSet, Trace, TraceStep, TraceClause, TraceCol, TraceRow } from './trace';
export type { Database, Dialect, Value, TableDef, ColumnDef, ColumnType } from './types';
export { show, showQuoted, toText } from './values';
