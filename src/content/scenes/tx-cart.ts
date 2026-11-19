/** Chữ và dữ liệu của cảnh "Giỏ thay đổi" (bài transaction, COMMIT, ROLLBACK). */

export interface TxCommand {
  id: string;
  label: string;
  sql: string;
  /** Chữ trên mẩu giấy nằm trong giỏ. */
  chip: string;
}

const commands: TxCommand[] = [
  { id: 'price', label: 'Đổi giá món 2', sql: 'UPDATE products SET price = 50000 WHERE product_id = 2;', chip: 'giá món 2 thành 50.000' },
  { id: 'add', label: 'Thêm món 15', sql: "INSERT INTO products VALUES (15, 'Trà xoài', 40000);", chip: 'thêm món 15' },
  { id: 'remove', label: 'Xóa món 3', sql: 'DELETE FROM products WHERE product_id = 3;', chip: 'xóa món 3' },
];

export const copy = {
  commands,
  table: 'products',
  columns: ['product_id', 'name', 'price'],
  /** Số row đầu của products dùng trong cảnh. */
  take: 4,
  dialectLabel: 'DBMS',
  dialects: [
    { id: 'mysql', name: 'MySQL' },
    { id: 'oracle', name: 'Oracle' },
  ] as { id: 'mysql' | 'oracle'; name: string }[],
  commandsLabel: 'Chạy một lệnh',
  mine: 'Bạn thấy',
  theirs: 'Người khác thấy',
  cart: 'Giỏ thay đổi',
  cartEmpty: 'Giỏ trống',
  cartCount: (n: number) => `${n} thay đổi chưa COMMIT`,
  begin: 'START TRANSACTION',
  commit: 'COMMIT',
  rollback: 'ROLLBACK',
  reset: 'Làm lại',
  lastSql: 'Lệnh vừa chạy',
  says: {
    startOracle: 'Ở Oracle, mỗi thay đổi nằm trong giỏ cho tới khi bạn COMMIT. Bấm một lệnh để bỏ thay đổi vào giỏ.',
    startMysql: 'MySQL bật autocommit. Bấm một lệnh và xem thay đổi có ghé giỏ không.',
    pending: 'Thay đổi vào giỏ. Bạn thấy nó ở table bên trái. Người khác chưa thấy, vì bạn chưa COMMIT.',
    auto: 'MySQL tự COMMIT ngay sau lệnh này. Thay đổi không ghé giỏ, và người khác thấy liền. ROLLBACK không lấy lại được nữa.',
    begin: 'Từ giờ MySQL bỏ thay đổi vào giỏ, cho tới khi bạn COMMIT hoặc ROLLBACK.',
    commit: (n: number) => `COMMIT lưu hẳn ${n} thay đổi trong giỏ. Giờ người khác cũng thấy. Từ đây ROLLBACK không lấy lại được.`,
    rollback: (n: number) => `ROLLBACK bỏ ${n} thay đổi trong giỏ. Table của bạn về như lúc chưa bắt đầu.`,
    commitEmpty: 'Giỏ đang trống, nên COMMIT không có gì để lưu.',
    rollbackEmpty: 'Giỏ đang trống, nên ROLLBACK không có gì để bỏ.',
    rollbackTooLate: 'Giỏ đang trống. Các lệnh trước đã COMMIT rồi, nên ROLLBACK không lấy lại được.',
    error: 'Lệnh này không chạy được.',
  },
};
