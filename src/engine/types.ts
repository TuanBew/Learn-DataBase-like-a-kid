/** Kiểu dữ liệu nền của SQL engine. Không phụ thuộc React. */

export type Dialect = 'mysql' | 'oracle';

/** Ngày hoặc ngày giờ. `iso` có dạng 'YYYY-MM-DD' hoặc 'YYYY-MM-DD HH:MM:SS'. */
export interface SqlDate {
  kind: 'date';
  iso: string;
}

/** Giá trị trong lúc engine chạy. */
export type Value = number | string | boolean | null | SqlDate;

/**
 * Giá trị viết trong file dữ liệu mẫu.
 * Column kiểu 'date' viết chuỗi 'YYYY-MM-DD', kiểu 'datetime' viết 'YYYY-MM-DD HH:MM:SS'.
 */
export type RawValue = number | string | null;

export type ColumnType = 'int' | 'decimal' | 'text' | 'date' | 'datetime';

export interface ColumnDef {
  /** Tên column, tiếng Anh, snake_case. */
  name: string;
  type: ColumnType;
  /** Tên gọi đời thường bằng tiếng Việt, dùng trong lời giải thích, ví dụ 'giá'. */
  label?: string;
  pk?: boolean;
  fk?: { table: string; column: string };
  notNull?: boolean;
  unique?: boolean;
  /** Column tự sinh mã tăng dần: AUTO_INCREMENT ở MySQL, GENERATED AS IDENTITY ở Oracle. */
  identity?: boolean;
  /** Oracle: GENERATED ALWAYS ('always'), BY DEFAULT ('default'), BY DEFAULT ON NULL ('on-null'). */
  identityMode?: 'always' | 'default' | 'on-null';
  /** Tên data type như người học viết, in hoa: 'VARCHAR', 'NUMBER'... Table mẫu không có field này. */
  sqlType?: string;
  /** Độ dài tối đa của VARCHAR, VARCHAR2, CHAR. */
  length?: number;
  /** Oracle VARCHAR2(n CHAR): đếm ký tự. Không có thì Oracle đếm byte. */
  charLength?: boolean;
  /** Tổng số chữ số của DECIMAL(p,s) hoặc NUMBER(p,s). */
  precision?: number;
  /** Số chữ số sau dấu phẩy. */
  scale?: number;
  /** Giá trị mặc định, viết như trong SQL: "'x'", '5', 'CURRENT_TIMESTAMP'. */
  default?: string;
  /** Chỉ engine dùng: tên column của subquery trong FROM hay khối WITH ở Oracle, giữ đúng chữ hoa chữ thường. */
  exact?: boolean;
}

/** Luật của table. Mỗi luật có tên, và tên đó hiện trong thông báo lỗi. */
export type ConstraintDef =
  | { kind: 'pk'; name: string; columns: string[] }
  | { kind: 'unique'; name: string; columns: string[] }
  | { kind: 'fk'; name: string; columns: string[]; refTable: string; refColumns: string[]; onDelete?: 'cascade' | 'set null' }
  | { kind: 'check'; name: string; expr: string };

export interface TableDef {
  /** Tên table, tiếng Anh, snake_case. */
  name: string;
  /** Một câu tiếng Việt nói table này lưu gì. */
  about?: string;
  columns: ColumnDef[];
  /** Các luật CHECK của table, viết như trong SQL, ví dụ 'price > 0'. */
  checks?: string[];
  /** Mỗi row là một mảng giá trị, đúng thứ tự của `columns`. */
  rows: RawValue[][];
  /**
   * Mọi luật của table. Table mẫu không viết field này: session tự dựng từ `pk`, `unique`, `fk`, `checks`.
   * Sau CREATE hay ALTER, các field kia được giữ khớp với danh sách này.
   */
  constraints?: ConstraintDef[];
  /** Số AUTO_INCREMENT hoặc identity sẽ cấp tiếp theo. Không có thì lấy số lớn nhất đang có cộng 1. */
  autoInc?: number;
  /** Chỉ engine dùng: row đã nạp sẵn của subquery trong FROM hay khối WITH. Không có trong database của người học. */
  loaded?: Value[][];
}

/** Sequence của Oracle. */
export interface SequenceDef {
  name: string;
  start: number;
  increment: number;
  /** Giá trị NEXTVAL vừa cấp. Chưa ai gọi NEXTVAL thì không có field này. */
  last?: number;
}

export interface Database {
  /** Tên database, ví dụ 'trasua'. Hiện trong thông báo lỗi của MySQL. */
  name: string;
  tables: TableDef[];
  /** Sequence (Oracle). */
  sequences?: SequenceDef[];
  /** Bộ đếm đặt tên SYS_C00... cho luật không có tên ở Oracle. */
  sysName?: number;
}
