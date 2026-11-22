import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e1',
  chapter: 7,
  kind: 'write',
  title: 'Khách của các đơn bị hủy',
  prompt: 'Chủ tiệm muốn gọi hỏi khách có đơn bị hủy. Cần mã đơn kèm họ tên khách, nối từ `orders` sang `customers`.',
  asks: [
    'Hiện `order_id` và `full_name`.',
    'Chỉ lấy đơn có `status` là `cancelled`.',
    'Đơn không có khách thì không hiện.',
    'Xếp theo `order_id` tăng dần.',
  ],
  database: 'teashop',
  tables: ['orders', 'customers'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT o.order_id, c.full_name\nFROM orders o\n',
    oracle: 'SELECT o.order_id, c.full_name\nFROM orders o\n',
  },
  solution: {
    mysql: "SELECT o.order_id, c.full_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nWHERE o.status = 'cancelled'\nORDER BY o.order_id;",
    oracle: "SELECT o.order_id, c.full_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nWHERE o.status = 'cancelled'\nORDER BY o.order_id;",
  },
  check: { orderMatters: true },
  why: 'INNER JOIN ghép mỗi đơn với khách có cùng `customer_id`. Đơn không có khách bị bỏ ra, và WHERE giữ lại đơn cancelled.',
  hints: {
    light: 'Hai table cùng có một column chung để ghép row lại với nhau. Column chung đó là key.',
    specific: 'Nối bằng INNER JOIN customers c ON o.customer_id = c.customer_id. Sau đó lọc đơn cancelled bằng WHERE và xếp bằng ORDER BY.',
    skeleton: {
      mysql: "SELECT o.order_id, c.full_name\nFROM orders o\nINNER JOIN customers c ON o.____ = c.____\nWHERE o.status = ____\nORDER BY o.order_id;",
      oracle: "SELECT o.order_id, c.full_name\nFROM orders o\nINNER JOIN customers c ON o.____ = c.____\nWHERE o.status = ____\nORDER BY o.order_id;",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT o.order_id, c.full_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id ORDER BY o.order_id',
        oracle: 'SELECT o.order_id, c.full_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id ORDER BY o.order_id',
      },
      hint: "Phần nối đã đúng. Query đang hiện mọi đơn, nên cần thêm WHERE o.status = 'cancelled'.",
    },
    {
      id: 'wrong-key',
      sql: {
        mysql: "SELECT o.order_id, c.full_name FROM orders o INNER JOIN customers c ON o.store_id = c.customer_id WHERE o.status = 'cancelled' ORDER BY o.order_id",
        oracle: "SELECT o.order_id, c.full_name FROM orders o INNER JOIN customers c ON o.store_id = c.customer_id WHERE o.status = 'cancelled' ORDER BY o.order_id",
      },
      hint: '`store_id` là mã tiệm, không phải mã khách, nên tên khách bị ghép sai. Nối bằng `o.customer_id = c.customer_id`.',
    },
    {
      id: 'left-join',
      sql: {
        mysql: "SELECT o.order_id, c.full_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id WHERE o.status = 'cancelled' ORDER BY o.order_id",
        oracle: "SELECT o.order_id, c.full_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id WHERE o.status = 'cancelled' ORDER BY o.order_id",
      },
      hint: 'LEFT JOIN giữ cả đơn không có khách, và tên khách ở đó là NULL. Đề bài chỉ cần đơn có khách, nên dùng INNER JOIN.',
    },
  ],
};
