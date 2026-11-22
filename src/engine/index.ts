import type { Database, Dialect } from './types';
import { SqlError, unsupported } from './errors';
import { execSelect } from './executor';
import { FUNCTIONS, arityOf } from './functions';
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
    if (stmt.t !== 'select' && stmt.t !== 'setop') {
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
export type { DdlResult } from './ddl';
export { gradeSchema } from './grade-schema';
export type { SchemaSpec, TableSpec, ColumnSpec, Probe, SchemaCheck, SchemaReport } from './schema-spec';
export type { SchemaView, SchemaTable, SchemaColumn, SchemaSequence } from './schema-view';
export { splitStatements } from './split';
export type { Piece } from './split';
export type { Query, SetStmt } from './ast';
export type { Warning } from './values';
export type { ResultSet, Trace, TraceStep, TraceClause, TraceCol, TraceRow } from './trace';
export type { Database, Dialect, Value, TableDef, ColumnDef, ColumnType, ConstraintDef, SequenceDef } from './types';
export { show, showQuoted, toText } from './values';

/** Một function mà engine chạy được. `max` null nghĩa là không giới hạn số tham số. */
export interface FunctionInfo {
  name: string;
  min: number;
  max: number | null;
  kind: 'scalar' | 'aggregate';
}

/** Function gom và function đặc biệt không nằm trong bảng FUNCTIONS, vì executor tự tính. */
const SPECIAL: Record<string, { min: number; max: number | null; kind: FunctionInfo['kind']; only?: Dialect }> = {
  COUNT: { min: 1, max: 1, kind: 'aggregate' },
  SUM: { min: 1, max: 1, kind: 'aggregate' },
  AVG: { min: 1, max: 1, kind: 'aggregate' },
  MIN: { min: 1, max: 1, kind: 'aggregate' },
  MAX: { min: 1, max: 1, kind: 'aggregate' },
  GROUP_CONCAT: { min: 1, max: null, kind: 'aggregate', only: 'mysql' },
  LISTAGG: { min: 1, max: 2, kind: 'aggregate', only: 'oracle' },
  GROUPING: { min: 1, max: null, kind: 'aggregate' },
  EXTRACT: { min: 1, max: 1, kind: 'scalar' },
};

/** Mọi function engine chạy được ở một dialect, theo thứ tự tên. Dùng cho trang tra cứu function. */
export function functionCatalog(dialect: Dialect): FunctionInfo[] {
  const out: FunctionInfo[] = [];
  for (const [name, def] of Object.entries(FUNCTIONS)) {
    if (def.only && def.only !== dialect) continue;
    const [min, max] = def.shown ?? arityOf(def, dialect);
    out.push({ name, min, max: max >= 99 ? null : max, kind: 'scalar' });
  }
  for (const [name, def] of Object.entries(SPECIAL)) {
    if (def.only && def.only !== dialect) continue;
    out.push({ name, min: def.min, max: def.max, kind: def.kind });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
