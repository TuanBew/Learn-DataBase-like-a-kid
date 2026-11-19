import type { ClauseKind } from './ast';
import type { ColumnType, Dialect, Value } from './types';

/** Một clause trong câu query: thứ tự viết và thứ tự chạy thật. */
export interface TraceClause {
  kind: ClauseKind;
  /** Nguyên văn clause, ví dụ 'WHERE price > 30000'. */
  text: string;
  /** Vị trí trong câu người học viết, tính từ 0. */
  written: number;
  /** Vị trí khi chạy thật, tính từ 0. */
  run: number;
}

export interface TraceCol {
  /** Khóa ổn định qua các bước: 'c2' là column thứ 2 của table gốc, 'x0' là column tính toán. */
  key: string;
  header: string;
  /** Tên đời thường tiếng Việt, nếu có. */
  label?: string;
  type: ColumnType | 'expr';
}

export interface TraceRow {
  /** Số thứ tự của row trong table gốc. Không đổi qua các bước. */
  id: number;
  cells: Value[];
}

export type TraceStep =
  | { kind: 'from'; table: string; alias?: string; columns: TraceCol[]; rows: TraceRow[] }
  | {
      /** Ghép thêm một table vào các row đang có. */
      kind: 'join';
      joinKind: 'inner' | 'left' | 'cross';
      table: string;
      alias?: string;
      /** Điều kiện ON, nguyên văn. */
      on?: string;
      rightColumns: TraceCol[];
      rightRows: TraceRow[];
      /** Mọi column sau khi ghép. */
      columns: TraceCol[];
      rows: TraceRow[];
      /** Row mới ghép từ row bên trái nào và row bên phải nào. `right` là null khi LEFT JOIN không tìm thấy row khớp. */
      links: { id: number; left: number; right: number | null }[];
    }
  | {
      /** Một subquery chạy trước, ra một giá trị hoặc một danh sách. */
      kind: 'subquery';
      text: string;
      scalar: boolean;
      columns: string[];
      rows: Value[][];
      total: number;
    }
  | {
      /** Gom row vào các nhóm. Mỗi nhóm thành một row gồm các giá trị của GROUP BY và các function gom. */
      kind: 'group';
      /** true khi không có GROUP BY: mọi row vào chung một nhóm. */
      implicit: boolean;
      keys: string[];
      aggs: string[];
      columns: TraceCol[];
      groups: { id: number; rowIds: number[]; cells: Value[] }[];
    }
  | { kind: 'having'; verdicts: { id: number; pass: boolean; reason: string }[] }
  | { kind: 'where'; verdicts: { id: number; pass: boolean; reason: string }[] }
  | {
      kind: 'select';
      star: boolean;
      distinct: boolean;
      columns: TraceCol[];
      rows: TraceRow[];
      /** Khóa của các column gốc không được chọn. */
      dropped: string[];
      /** Khóa của các column mới do tính toán. */
      computed: string[];
      /** Row bị DISTINCT bỏ vì trùng với row đứng trước. */
      duplicates: number[];
    }
  | {
      kind: 'order';
      keys: { text: string; desc: boolean; col?: string }[];
      before: number[];
      after: number[];
      /** Giá trị dùng để sắp, cho từng row, khi column đó không còn trên sân khấu. */
      hidden: { id: number; text: string }[];
      /** Có NULL trong column sắp xếp: NULL đứng đầu hay cuối. */
      nulls?: 'first' | 'last';
    }
  | {
      kind: 'limit';
      style: 'limit' | 'fetch';
      offset: number;
      count: number | null;
      skipped: number[];
      kept: number[];
      cut: number[];
    };

export interface ResultSet {
  columns: string[];
  types: (ColumnType | 'expr')[];
  rows: Value[][];
  /** id của row gốc ứng với từng row kết quả. */
  rowIds: number[];
}

export interface Trace {
  dialect: Dialect;
  sql: string;
  clauses: TraceClause[];
  /** Khóa của các column gốc mà query nhắc tới. Sân khấu ưu tiên hiện các column này khi màn hình hẹp. */
  focus: string[];
  steps: TraceStep[];
  result: ResultSet;
}
