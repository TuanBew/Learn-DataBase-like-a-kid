import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c11-e3',
  chapter: 11,
  kind: 'write',
  title: 'Các đơn đặt trong ngày 28 tháng 2',
  prompt:
    'Chị bán hàng nhờ bạn lấy mọi đơn đặt trong ngày 2026-02-28. Cột `order_date` có cả giờ, nên so bằng dấu `=` sẽ sót đơn. Hãy viết điều kiện bằng một khoảng ngày.',
  asks: [
    'Hiện `order_id`, `order_date` và `status`.',
    'Giữ đơn có `order_date` từ đầu ngày 2026-02-28, và trước đầu ngày 2026-03-01.',
    'Không dùng `=` và không dùng function bọc column.',
  ],
  database: 'company',
  tables: ['orders'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT order_id, order_date, status\nFROM orders\nWHERE ',
    oracle: 'SELECT order_id, order_date, status\nFROM orders\nWHERE ',
  },
  solution: {
    mysql:
      'SELECT order_id, order_date, status\n' +
      'FROM orders\n' +
      "WHERE order_date >= '2026-02-28' AND order_date < '2026-03-01';",
    oracle:
      'SELECT order_id, order_date, status\n' +
      'FROM orders\n' +
      "WHERE order_date >= DATE '2026-02-28' AND order_date < DATE '2026-03-01'",
  },
  check: { orderMatters: false },
  why: 'Khoảng `>= ngày AND < ngày kế` bao trọn mọi giờ trong ngày, kể cả giờ khác 00:00. Dùng `=` chỉ khớp đơn đặt đúng nửa đêm.',
  hints: {
    light: 'Một ngày chạy từ 00:00 của hôm đó tới trước 00:00 của hôm sau. Hãy viết hai cận đó.',
    specific: 'Cận dưới là `>=` ngày 2026-02-28. Cận trên là `<` ngày 2026-03-01. Nối hai điều kiện bằng AND.',
    skeleton: {
      mysql: "SELECT order_id, order_date, status\nFROM orders\nWHERE order_date >= '2026-02-28' AND order_date ____ '____';",
      oracle: "SELECT order_id, order_date, status\nFROM orders\nWHERE order_date >= DATE '2026-02-28' AND order_date ____ DATE '____'",
    },
  },
  wrong: [
    {
      id: 'equals',
      sql: {
        mysql: "SELECT order_id, order_date, status FROM orders WHERE order_date = '2026-02-28'",
        oracle: "SELECT order_id, order_date, status FROM orders WHERE order_date = DATE '2026-02-28'",
      },
      hint: 'Dấu `=` chỉ khớp đơn đặt đúng 00:00 của ngày đó, nên kết quả rỗng. Dùng khoảng: `>=` ngày đó và `<` ngày kế.',
    },
    {
      id: 'no-upper',
      sql: {
        mysql: "SELECT order_id, order_date, status FROM orders WHERE order_date >= '2026-02-28'",
        oracle: "SELECT order_id, order_date, status FROM orders WHERE order_date >= DATE '2026-02-28'",
      },
      hint: 'Query chưa có cận trên, nên các đơn của những ngày sau cũng vào. Thêm `AND order_date <` ngày 2026-03-01.',
    },
  ],
};
