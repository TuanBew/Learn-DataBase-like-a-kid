import type { Span } from './errors';

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
  | { t: 'between'; e: Expr; lo: Expr; hi: Expr; not: boolean; span: Span }
  | { t: 'like'; e: Expr; pat: Expr; not: boolean; span: Span }
  | { t: 'fn'; name: string; args: Expr[]; span: Span; nameSpan: Span }
  | { t: 'case'; operand?: Expr; whens: { when: Expr; then: Expr }[]; else?: Expr; span: Span };

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

export type ClauseKind = 'SELECT' | 'FROM' | 'WHERE' | 'GROUP BY' | 'HAVING' | 'ORDER BY' | 'LIMIT' | 'FETCH';

export interface SelectStmt {
  t: 'select';
  distinct: boolean;
  items: SelectItem[];
  from?: { table: string; quoted?: boolean; alias?: string; span: Span };
  where?: Expr;
  orderBy?: OrderItem[];
  limit?: { style: 'limit' | 'fetch'; count: number | null; offset: number; span: Span };
  /** Các clause theo thứ tự người học viết. */
  clauses: { kind: ClauseKind; span: Span }[];
}

export type Statement = SelectStmt;

/** Thứ tự chạy thật của các clause. */
export const RUN_ORDER: ClauseKind[] = ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY', 'LIMIT', 'FETCH'];
