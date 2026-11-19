/** Chữ và dữ liệu của cảnh "Diễn tập UPDATE và DELETE" (bài INSERT, UPDATE, DELETE). */

export interface DmlPreset {
  id: string;
  label: string;
  sql: string;
  /** Lời Bi nói sau khi lệnh chạy. */
  say: string;
}

const presets: DmlPreset[] = [
  {
    id: 'update-where',
    label: 'UPDATE có WHERE',
    sql: 'UPDATE products\nSET price = 48000\nWHERE product_id = 2;',
    say: 'WHERE chọn đúng row có `product_id` là 2. Chỉ 1 row đổi giá, 13 row còn lại giữ nguyên.',
  },
  {
    id: 'update-all',
    label: 'UPDATE quên WHERE',
    sql: 'UPDATE products\nSET price = 48000;',
    say: 'Lệnh này không có WHERE. Cả 14 món cùng đổi giá thành 48.000. Bấm ROLLBACK để lấy lại dữ liệu cũ.',
  },
  {
    id: 'delete-where',
    label: 'DELETE có WHERE',
    sql: 'DELETE FROM products\nWHERE product_id = 14;',
    say: 'WHERE chọn đúng row có `product_id` là 14. Chỉ 1 row bị xóa.',
  },
  {
    id: 'delete-all',
    label: 'DELETE quên WHERE',
    sql: 'DELETE FROM products;',
    say: 'Lệnh này không có WHERE. Cả 14 row bị xóa. Bấm ROLLBACK để lấy lại dữ liệu cũ.',
  },
];

export const copy = {
  presets,
  table: 'products',
  /** Các column giữ lại trong bản sao, cho dễ nhìn trên điện thoại. */
  columns: ['product_id', 'name', 'price'],
  presetsLabel: 'Chọn một lệnh',
  sqlLabel: 'Lệnh sẽ chạy',
  run: 'Chạy',
  rollback: 'ROLLBACK',
  copyChip: 'Bản sao của products',
  rowsChip: (n: number) => `${n} row`,
  touchedChip: (n: number) => `${n} row bị đụng tới`,
  alarm: 'Quên WHERE: mọi row đều bị đụng tới.',
  says: {
    start: 'Đây là bản sao của table `products`. Mình giữ ba column cho dễ nhìn. Chọn một lệnh, rồi bấm Chạy.',
    picked: 'Đọc lệnh này. Đoán xem mấy row bị đụng tới, rồi bấm Chạy.',
    rolledBack: 'Dữ liệu đã về như cũ. Ở đây mình chưa lưu thay đổi, nên ROLLBACK cứu được. Ở công ty, chạy SELECT với đúng WHERE đó trước khi sửa.',
    error: 'Lệnh này không chạy được trên bản sao.',
  },
};
