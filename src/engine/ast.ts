import type { Span } from './errors';
import type { ColumnType } from './types';

export type CompareOp = '=' | '<>' | '<' | '<=' | '>' | '>=';
export type BinOp = CompareOp | '+' | '-' | '*' | '/' | '%' | '||' | 'AND' | 'OR';

export type Expr =
  | { t: 'num'; v: number; span: Span }
  | { t: 'str'; v: string; span: Span }
  | { t: 'null'; span: Span }
  | { t: 'bool'; v: boolean; span: Span }
  | { t: 'date'; v: string; span: Span }
  | { t: 'col'; table?: string; name: string; quoted?: boolean; span: Span }
  | { t: 'unary'; op: '-' | '+' | 'NOT'; e: Expr; span: Span }
  | { t: 'bin'; op: BinOp; l: Expr; r: Expr; span: Span; opSpan: Span }
  | { t: 'isnull'; e: Expr; not: boolean; span: Span }
  | { t: 'in'; e: Expr; list: Expr[]; not: boolean; span: Span }
  | { t: 'insub'; e: Expr; q: SelectStmt; not: boolean; span: Span }
  | { t: 'between'; e: Expr; lo: Expr; hi: Expr; not: boolean; span: Span }
  | { t: 'like'; e: Expr; pat: Expr; not: boolean; span: Span }
  /** `star` là COUNT(*). `distinct` là COUNT(DISTINCT x). `unit` là EXTRACT(unit FROM x). */
  | { t: 'fn'; name: string; args: Expr[]; star?: boolean; distinct?: boolean; unit?: string; bare?: boolean; span: Span; nameSpan: Span }
  | { t: 'case'; operand?: Expr; whens: { when: Expr; then: Expr }[]; else?: Expr; span: Span }
  /** Scalar subquery: một query trong ngoặc trả về đúng một giá trị. */
  | { t: 'sub'; q: SelectStmt; span: Span };

export interface SelectItem {
  /** null nghĩa là dấu `*`. */
  e: Expr | null;
  /** `t.*` */
  starTable?: string;
  alias?: string;
  aliasQuoted?: boolean;
  span: Span;
}

export interface OrderItem {
  e: Expr;
  desc: boolean;
  nulls?: 'FIRST' | 'LAST';
  span: Span;
}

export interface TableRef {
  table: string;
  quoted?: boolean;
  alias?: string;
  span: Span;
}

export interface Join {
  /** cross: nối bằng dấu phẩy, hoặc JOIN không có ON ở MySQL. */
  kind: 'inner' | 'left' | 'cross';
  ref: TableRef;
  on?: Expr;
  span: Span;
}

export type ClauseKind = 'SELECT' | 'FROM' | 'WHERE' | 'GROUP BY' | 'HAVING' | 'ORDER BY' | 'LIMIT' | 'FETCH';

export interface SelectStmt {
  t: 'select';
  distinct: boolean;
  items: SelectItem[];
  from?: TableRef;
  joins: Join[];
  where?: Expr;
  groupBy?: Expr[];
  having?: Expr;
  orderBy?: OrderItem[];
  limit?: { style: 'limit' | 'fetch'; count: number | null; offset: number; span: Span };
  /** Các clause theo thứ tự người học viết. */
  clauses: { kind: ClauseKind; span: Span }[];
  span: Span;
}

export interface InsertStmt {
  t: 'insert';
  table: TableRef;
  columns?: { name: string; span: Span }[];
  rows: { values: Expr[]; span: Span }[];
  span: Span;
}

export interface UpdateStmt {
  t: 'update';
  table: TableRef;
  sets: { name: string; span: Span; e: Expr }[];
  where?: Expr;
  span: Span;
}

export interface DeleteStmt {
  t: 'delete';
  table: TableRef;
  where?: Expr;
  span: Span;
}

export interface TxStmt {
  t: 'commit' | 'rollback' | 'begin';
  span: Span;
}

export interface ColumnSpec {
  name: string;
  /** Tên data type đúng như người học gõ, in hoa: INT, VARCHAR2... */
  typeName: string;
  type: ColumnType;
  notNull?: boolean;
  unique?: boolean;
  pk?: boolean;
  /** AUTO_INCREMENT hoặc GENERATED ... AS IDENTITY. */
  identity?: boolean;
  check?: string;
  fk?: { table: string; column: string };
  span: Span;
}

export interface CreateTableStmt {
  t: 'create';
  name: string;
  nameSpan: Span;
  columns: ColumnSpec[];
  /** CHECK viết ở cấp table. */
  checks: string[];
  span: Span;
}

export type Statement = SelectStmt | InsertStmt | UpdateStmt | DeleteStmt | TxStmt | CreateTableStmt;

/** Thứ tự chạy thật của các clause. */
export const RUN_ORDER: ClauseKind[] = ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY', 'LIMIT', 'FETCH'];

export const AGGREGATES = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);
