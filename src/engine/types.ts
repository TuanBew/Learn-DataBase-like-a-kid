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
}

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
}

export interface Database {
  /** Tên database, ví dụ 'trasua'. Hiện trong thông báo lỗi của MySQL. */
  name: string;
  tables: TableDef[];
}
