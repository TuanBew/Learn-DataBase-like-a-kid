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
  /** `outer`: Oracle viết dấu `(+)` ngay sau column trong WHERE (nối ngoài kiểu cũ). */
  | { t: 'col'; table?: string; name: string; quoted?: boolean; outer?: boolean; span: Span }
  | { t: 'unary'; op: '-' | '+' | 'NOT'; e: Expr; span: Span }
  | { t: 'bin'; op: BinOp; l: Expr; r: Expr; span: Span; opSpan: Span }
  | { t: 'isnull'; e: Expr; not: boolean; span: Span }
  | { t: 'in'; e: Expr; list: Expr[]; not: boolean; span: Span }
  | { t: 'insub'; e: Expr; q: Query; not: boolean; span: Span }
  /** `EXISTS (subquery)`. NOT EXISTS là `unary NOT` bọc ngoài. */
  | { t: 'exists'; q: Query; span: Span }
  /** `e op ANY|SOME|ALL (subquery)`. `word` là chữ người học viết: ANY, SOME hoặc ALL. */
  | { t: 'quant'; op: CompareOp; quant: 'any' | 'all'; word: string; e: Expr; q: Query; span: Span; opSpan: Span }
  | { t: 'between'; e: Expr; lo: Expr; hi: Expr; not: boolean; span: Span }
  | { t: 'like'; e: Expr; pat: Expr; not: boolean; span: Span }
  /** `star` là COUNT(*). `distinct` là COUNT(DISTINCT x). `unit` là EXTRACT(unit FROM x). */
  | {
      t: 'fn';
      name: string;
      args: Expr[];
      star?: boolean;
      distinct?: boolean;
      /** EXTRACT(unit FROM x), và đơn vị của INTERVAL, TIMESTAMPDIFF. */
      unit?: string;
      bare?: boolean;
      /** CAST(x AS type) và CONVERT(x, type). */
      cast?: CastType;
      /** GROUP_CONCAT và LISTAGG: ORDER BY trong ngoặc, và chuỗi nối. */
      within?: OrderItem[];
      sep?: string;
      /** Window function: phần OVER (...). */
      over?: WindowSpec;
      span: Span;
      nameSpan: Span;
    }
  | { t: 'case'; operand?: Expr; whens: { when: Expr; then: Expr }[]; else?: Expr; span: Span }
  /** Scalar subquery: một query trong ngoặc trả về đúng một giá trị. */
  | { t: 'sub'; q: Query; span: Span }
  /** `seq.NEXTVAL`, `seq.CURRVAL` của Oracle. */
  | { t: 'seq'; seq: string; which: 'NEXTVAL' | 'CURRVAL'; span: Span; seqSpan: Span }
  /** Từ khóa DEFAULT đứng thay một giá trị trong INSERT hay UPDATE. */
  | { t: 'default'; span: Span };

/** `OVER ([PARTITION BY ...] [ORDER BY ...] [ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW])`. */
export interface WindowSpec {
  partition: Expr[];
  orderBy: OrderItem[];
  /** Khung viết rõ: cộng dồn từng row. Không có thì dùng khung mặc định của SQL. */
  rows?: boolean;
  span: Span;
}

/** Data type đích của CAST. */
export interface CastType {
  kind: 'signed' | 'unsigned' | 'decimal' | 'char' | 'date' | 'datetime' | 'double' | 'number' | 'text';
  /** DECIMAL(p,s), NUMBER(p,s). */
  p?: number;
  s?: number;
  /** CHAR(n), VARCHAR2(n). */
  n?: number;
}

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
  /** Với subquery trong FROM: bằng alias (rỗng nếu Oracle không có alias). */
  table: string;
  /** Subquery trong FROM: `FROM (SELECT ...) alias`. */
  sub?: Query;
  quoted?: boolean;
  /** `schema.table`: tên schema đứng trước dấu chấm. */
  schema?: { name: string; quoted: boolean; span: Span };
  alias?: string;
  /** MySQL: chữ FULL đứng ngay sau table, trước JOIN, bị đọc thành alias. */
  fullAlias?: boolean;
  span: Span;
}

export interface Join {
  /** cross: nối bằng dấu phẩy, CROSS JOIN, hoặc JOIN không có ON ở MySQL. */
  kind: 'inner' | 'left' | 'right' | 'full' | 'cross';
  ref: TableRef;
  on?: Expr;
  /** JOIN ... USING (a, b) */
  using?: { name: string; span: Span }[];
  natural?: boolean;
  /** Nối bằng dấu phẩy trong FROM. */
  comma?: boolean;
  span: Span;
}

export type ClauseKind = 'SELECT' | 'FROM' | 'WHERE' | 'GROUP BY' | 'HAVING' | 'ORDER BY' | 'LIMIT' | 'FETCH';

/** Một khối của WITH: `ten [(column, ...)] AS (query)`. */
export interface Cte {
  name: string;
  nameSpan: Span;
  columns?: { name: string; span: Span }[];
  q: Query;
  span: Span;
}

export interface SelectStmt {
  t: 'select';
  /** WITH đứng trước query này. */
  with?: Cte[];
  distinct: boolean;
  items: SelectItem[];
  from?: TableRef;
  joins: Join[];
  where?: Expr;
  groupBy?: Expr[];
  /** Số key đứng cuối GROUP BY được cuộn lên thành dòng tổng: WITH ROLLUP (MySQL) hay ROLLUP(...) (Oracle). */
  rollup?: number;
  having?: Expr;
  orderBy?: OrderItem[];
  limit?: { style: 'limit' | 'fetch'; count: number | null; offset: number; span: Span };
  /** Các clause theo thứ tự người học viết. */
  clauses: { kind: ClauseKind; span: Span }[];
  span: Span;
}

/** Ghép kết quả hai query: UNION, UNION ALL, INTERSECT, EXCEPT (MySQL), MINUS (Oracle). ORDER BY và LIMIT ở đây áp cho cả kết quả. */
export interface SetStmt {
  t: 'setop';
  with?: Cte[];
  op: 'union' | 'union all' | 'intersect' | 'except';
  /** Chữ người học viết: UNION, UNION ALL, INTERSECT, EXCEPT hoặc MINUS. */
  word: string;
  left: Query;
  right: Query;
  orderBy?: OrderItem[];
  limit?: SelectStmt['limit'];
  /** Chỉ gồm ORDER BY và LIMIT hoặc FETCH đứng cuối. */
  clauses: SelectStmt['clauses'];
  span: Span;
  opSpan: Span;
}

export type Query = SelectStmt | SetStmt;

export interface InsertStmt {
  t: 'insert';
  table: TableRef;
  columns?: { name: string; span: Span }[];
  rows: { values: Expr[]; span: Span }[];
  /** INSERT ... SELECT: lấy row từ một câu SELECT thay cho VALUES. */
  select?: Query;
  /** MySQL: `[AS alias] ON DUPLICATE KEY UPDATE c = ...`. */
  onDup?: { alias?: string; sets: { name: string; span: Span; e: Expr }[]; span: Span };
  span: Span;
}

/** Oracle: MERGE INTO t USING src ON (...) WHEN MATCHED ... WHEN NOT MATCHED .... */
export interface MergeStmt {
  t: 'merge';
  table: TableRef;
  using: TableRef;
  on: Expr;
  matched?: { sets: { name: string; span: Span; e: Expr }[]; span: Span };
  notMatched?: { columns?: { name: string; span: Span }[]; values: Expr[]; span: Span };
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

/** SAVEPOINT ten, hoặc ROLLBACK TO [SAVEPOINT] ten. */
export interface SavepointStmt {
  t: 'savepoint' | 'rollback-to';
  name: string;
  nameSpan: Span;
  span: Span;
}

export interface CreateViewStmt {
  t: 'createview';
  name: string;
  nameSpan: Span;
  schema?: TableRef['schema'];
  orReplace: boolean;
  /** Nguyên văn câu SELECT sau chữ AS. */
  select: string;
  query: Query;
  span: Span;
}

export interface DropViewStmt {
  t: 'dropview';
  name: string;
  nameSpan: Span;
  schema?: TableRef['schema'];
  ifExists: boolean;
  span: Span;
}

type Named = { name: string; span: Span };

/** Một luật viết trong CREATE TABLE hoặc ALTER TABLE, ngay sau column hoặc ở cấp table. */
export interface ConstraintSpec {
  kind: 'pk' | 'unique' | 'fk' | 'check';
  /** Tên đặt bằng CONSTRAINT. Không có thì engine tự đặt. */
  name?: string;
  nameSpan?: Span;
  columns: Named[];
  ref?: { table: string; tableSpan: Span; columns: Named[]; onDelete?: 'cascade' | 'set null' };
  /** CHECK: nguyên văn biểu thức trong ngoặc. */
  expr?: string;
  exprSpan?: Span;
  /** Viết ngay sau column, không phải ở cấp table. */
  inline: boolean;
  span: Span;
}

export interface ColumnSpec {
  name: string;
  /** Tên data type đúng như người học gõ, in hoa: INT, VARCHAR2... Rỗng nếu không viết (Oracle MODIFY). */
  typeName: string;
  type: ColumnType;
  length?: number;
  charLength?: boolean;
  precision?: number;
  scale?: number;
  /** NOT NULL hoặc NULL viết rõ ra. */
  nullSpec?: 'not null' | 'null';
  /** AUTO_INCREMENT hoặc GENERATED ... AS IDENTITY. */
  identity?: boolean;
  /** Oracle: ALWAYS, BY DEFAULT, hoặc BY DEFAULT ON NULL. */
  identityMode?: 'always' | 'default' | 'on-null';
  default?: { text: string; span: Span };
  /** Luật viết ngay sau column. */
  constraints: ConstraintSpec[];
  span: Span;
}

export interface CreateTableStmt {
  t: 'create';
  name: string;
  nameSpan: Span;
  schema?: TableRef['schema'];
  ifNotExists?: boolean;
  /** CREATE TABLE ... AS SELECT: chép column và row từ query. `columns` rỗng. */
  asSelect?: Query;
  /** MySQL: AUTO_INCREMENT=n sau dấu ngoặc. */
  autoInc?: number;
  columns: ColumnSpec[];
  /** Luật viết ở cấp table. */
  constraints: ConstraintSpec[];
  span: Span;
}

export type AlterAction =
  | { a: 'add-column'; cols: ColumnSpec[]; span: Span }
  | { a: 'modify'; cols: ColumnSpec[]; span: Span }
  | { a: 'drop-column'; names: Named[]; span: Span }
  | { a: 'rename-column'; from: Named; to: Named; span: Span }
  | { a: 'rename-to'; to: Named; span: Span }
  | { a: 'add-constraint'; c: ConstraintSpec; span: Span }
  /** `via` là cách người học viết: DROP CONSTRAINT, DROP PRIMARY KEY, DROP FOREIGN KEY, DROP CHECK. */
  | { a: 'drop-constraint'; via: 'constraint' | 'primary' | 'foreign' | 'check'; name?: string; span: Span };

export interface AlterTableStmt {
  t: 'alter';
  table: TableRef;
  actions: AlterAction[];
  span: Span;
}

export interface DropTableStmt {
  t: 'drop';
  table: TableRef;
  ifExists: boolean;
  /** Oracle: CASCADE CONSTRAINTS. */
  cascade: boolean;
  span: Span;
}

export interface TruncateStmt {
  t: 'truncate';
  table: TableRef;
  span: Span;
}

export interface CreateSequenceStmt {
  t: 'createseq';
  name: string;
  nameSpan: Span;
  start?: number;
  increment?: number;
  /** Vị trí của số INCREMENT BY, để gạch chân khi bằng 0. */
  incrementSpan?: Span;
  /** CACHE n, hoặc 0 khi viết NOCACHE. Không viết thì Oracle dùng 20. */
  cache?: number;
  span: Span;
}

export interface DropSequenceStmt {
  t: 'dropseq';
  name: string;
  nameSpan: Span;
  span: Span;
}

export type Statement =
  | SelectStmt
  | SetStmt
  | InsertStmt
  | UpdateStmt
  | DeleteStmt
  | TxStmt
  | SavepointStmt
  | MergeStmt
  | CreateViewStmt
  | DropViewStmt
  | CreateTableStmt
  | AlterTableStmt
  | DropTableStmt
  | TruncateStmt
  | CreateSequenceStmt
  | DropSequenceStmt;

/** Thứ tự chạy thật của các clause. */
export const RUN_ORDER: ClauseKind[] = ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY', 'LIMIT', 'FETCH'];

export const AGGREGATES = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP_CONCAT', 'LISTAGG']);

/** Window function chỉ có nghĩa khi có OVER. */
export const RANKING = new Set(['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD']);
/** Aggregate dùng được với OVER. */
export const WINDOW_AGGS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);
