import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e2',
  chapter: 6,
  kind: 'debug',
  title: 'Sửa query món trong đơn 1004',
  prompt: 'Query dưới đây muốn liệt kê các món trong đơn 1004, nhưng đang báo lỗi. Bấm Chạy để đọc lỗi, rồi sửa.',
  asks: ['Hiện `order_id`, `product_id` và `quantity`.', 'Chỉ lấy đơn có `order_id` bằng 1004.'],
  database: 'teashop',
  tables: ['orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT order_id, product_id, quantity\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.order_id = 1004;',
    oracle: 'SELECT order_id, product_id, quantity\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.order_id = 1004;',
  },
  solution: {
    mysql: 'SELECT o.order_id, oi.product_id, oi.quantity\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.order_id = 1004;',
    oracle: 'SELECT o.order_id, oi.product_id, oi.quantity\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.order_id = 1004;',
  },
  check: { orderMatters: false },
  why: '`order_id` có ở cả hai table, nên database không biết bạn muốn column của table nào. Thêm alias `o.` phía trước là hết lỗi.',
  hints: {
    light: 'Khi hai table có column trùng tên, database cần biết column đó thuộc table nào.',
    specific: 'Column `order_id` nằm ở cả `orders` và `order_items`. Viết `o.order_id` hoặc `oi.order_id` trong SELECT.',
    skeleton: {
      mysql: 'SELECT ____.order_id, oi.product_id, oi.quantity\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.order_id = 1004;',
      oracle: 'SELECT ____.order_id, oi.product_id, oi.quantity\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.order_id = 1004;',
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT o.order_id, oi.product_id, oi.quantity FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id',
        oracle: 'SELECT o.order_id, oi.product_id, oi.quantity FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id',
      },
      hint: 'Lỗi column trùng tên đã hết. Query còn thiếu WHERE o.order_id = 1004 nên đang hiện món của mọi đơn.',
    },
    {
      id: 'wrong-key',
      sql: {
        mysql: 'SELECT o.order_id, oi.product_id, oi.quantity FROM orders o INNER JOIN order_items oi ON o.order_id = oi.item_id WHERE o.order_id = 1004',
        oracle: 'SELECT o.order_id, oi.product_id, oi.quantity FROM orders o INNER JOIN order_items oi ON o.order_id = oi.item_id WHERE o.order_id = 1004',
      },
      hint: '`item_id` là mã của từng row món, không phải mã đơn. Nối bằng `o.order_id = oi.order_id`.',
    },
  ],
};
