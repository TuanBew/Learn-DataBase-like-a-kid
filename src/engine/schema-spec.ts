import type { ColumnType, Dialect } from './types';

/** Đề bài "dựng table": cấu trúc người học phải tạo, và các phép thử hành vi. */

export interface SchemaSpec {
  tables: TableSpec[];
  probes?: Probe[];
}

export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
  /** primary key ghép. primary key một column thì ghi `pk` ở column. */
  primaryKey?: string[];
  /** Cho table có thêm column ngoài đề. Mặc định false. */
  allowExtra?: boolean;
  /** Table phải có ít nhất ngần này row (bài chèn dữ liệu). Sinh một check riêng. */
  minRows?: number;
}

export interface ColumnSpec {
  name: string;
  /** Nhóm data type được nhận. */
  type: ColumnType | ColumnType[];
  /** Với chữ: độ dài tối thiểu phải có. */
  minLength?: number;
  pk?: boolean;
  identity?: boolean;
  notNull?: boolean;
  unique?: boolean;
  /** Giá trị DEFAULT phải có. So theo giá trị, không so cách viết. */
  default?: string | number;
  fk?: { table: string; column: string; onDelete?: 'cascade' | 'set null' };
  /** Lời hiện ở danh sách yêu cầu của bài tập. */
  label: string;
}

/** Phép thử hành vi, chạy trên một bản sao của database người học. Dùng để chấm CHECK và các luật khó đọc từ cấu trúc. */
export interface Probe {
  id: string;
  label: string;
  /** Các lệnh chuẩn bị, phải chạy được. */
  setup?: Partial<Record<Dialect, string[]>>;
  sql: Partial<Record<Dialect, string>>;
  expect: 'ok' | 'error';
}

export interface SchemaCheck {
  id: string;
  label: string;
  ok: boolean;
  /** Nói ngắn chỗ lệch, tiếng Việt. */
  note?: string;
}

export interface SchemaReport {
  ok: boolean;
  checks: SchemaCheck[];
}
