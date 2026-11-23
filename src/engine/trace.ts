import type { ClauseKind } from './ast';
import type { ColumnType, Dialect, Value } from './types';
import type { Warning } from './values';

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
  | {
      kind: 'from';
      table: string;
      alias?: string;
      /** Table này là kết quả của một màn chạy trước: khối WITH hay subquery trong FROM. */
      source?: 'cte' | 'derived';
      columns: TraceCol[];
      rows: TraceRow[];
    }
  | {
      /** Ghép thêm một table vào các row đang có. */
      kind: 'join';
      joinKind: 'inner' | 'left' | 'right' | 'full' | 'cross';
      table: string;
      alias?: string;
      /** Table bên phải là kết quả của một màn chạy trước. */
      source?: 'cte' | 'derived';
      /** Điều kiện ON, nguyên văn. */
      on?: string;
      rightColumns: TraceCol[];
      rightRows: TraceRow[];
      /** Mọi column sau khi ghép. */
      columns: TraceCol[];
      rows: TraceRow[];
      /** Row mới ghép từ row bên trái nào và row bên phải nào. `right` là null khi LEFT hay FULL JOIN không tìm thấy row khớp. `left` là null khi RIGHT hay FULL JOIN không tìm thấy row khớp. */
      links: { id: number; left: number | null; right: number | null }[];
      /** USING hay NATURAL: tên các column được gộp thành một khi SELECT *. */
      merged?: string[];
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
      /** Số key đứng cuối GROUP BY được cuộn lên thành dòng tổng (ROLLUP). Các nhóm khi đó có thể chung row. */
      rollup?: number;
      keys: string[];
      aggs: string[];
      columns: TraceCol[];
      groups: { id: number; rowIds: number[]; cells: Value[] }[];
    }
  | {
      /** Một toán tử ghép kết quả: UNION, UNION ALL, INTERSECT, EXCEPT hay MINUS. Query ghép nhiều vế có một step cho mỗi toán tử, từ trái sang phải. */
      kind: 'setop';
      op: 'union' | 'union all' | 'intersect' | 'except';
      /** Chữ người học viết: UNION, UNION ALL, INTERSECT, EXCEPT hoặc MINUS. */
      word: string;
      columns: TraceCol[];
      /** Row đầu vào: bên trái là kết quả đã có, bên phải là kết quả của vế mới. id không đổi qua các step. */
      left: TraceRow[];
      right: TraceRow[];
      /** Row sau khi ghép. */
      rows: TraceRow[];
      /** Row bị loại: trùng với row đứng trước, không có ở vế kia (INTERSECT), hay có ở vế kia (EXCEPT, MINUS). */
      removed: { id: number; why: 'dup' | 'absent' | 'present' }[];
    }
  | {
      /** Một cụm OVER (...) của window function. Row không gộp lại: mỗi row nhận thêm một giá trị. Các cụm OVER khác nhau có step riêng, cộng dồn column. */
      kind: 'window';
      /** Nguyên văn các function dùng cùng cụm OVER, ví dụ 'RANK() OVER (PARTITION BY d ORDER BY s DESC)'. */
      fns: string[];
      partitionBy: string[];
      orderBy: { text: string; desc: boolean }[];
      /** Các phần: id row theo thứ tự trong phần. Phần xếp theo giá trị PARTITION BY. */
      parts: { label: string; ids: number[] }[];
      /** Mọi column sau khi thêm column mới: column cũ rồi tới column của các cụm OVER đã tính. */
      columns: TraceCol[];
      /** Khóa các column mới của step này. Khóa dạng 'w0', 'w1'. */
      added: string[];
      rows: TraceRow[];
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
  /** Cảnh báo kèm kết quả (SHOW WARNINGS của MySQL), ví dụ khi đổi chuỗi '12abc' thành số. Chỉ MySQL có. */
  warnings?: Warning[];
}

/** Một màn chạy trước màn chính: khối WITH, subquery trong FROM, hay một vế của query ghép kết quả. */
export interface TraceAct {
  kind: 'cte' | 'derived' | 'branch';
  /** Tên khối WITH, alias của subquery trong FROM (rỗng nếu Oracle không có alias), hay tên vế ('vế 1'). */
  name: string;
  /** Nguyên văn query của màn này. */
  sql: string;
  trace: Trace;
}

export interface Trace {
  dialect: Dialect;
  sql: string;
  clauses: TraceClause[];
  /** Khóa của các column gốc mà query nhắc tới. Sân khấu ưu tiên hiện các column này khi màn hình hẹp. */
  focus: string[];
  steps: TraceStep[];
  result: ResultSet;
  /** Các màn chạy trước màn chính, theo thứ tự chạy. Khối WITH dùng nhiều lần chỉ có một màn. Mỗi `trace` lại có thể có `acts`. */
  acts?: TraceAct[];
  /**
   * true khi query có subquery phụ thuộc query bên ngoài (chạy lại cho từng row): `steps` chỉ diễn query bên ngoài.
   * `result` vẫn đúng và đầy đủ.
   */
  partial?: boolean;
}
