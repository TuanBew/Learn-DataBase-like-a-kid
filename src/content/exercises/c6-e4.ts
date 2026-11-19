import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e4',
  chapter: 6,
  kind: 'translate',
  title: 'Chuyển query nối khách sang Oracle',
  prompt: 'Query MySQL này lấy 5 đơn đầu kèm tên khách. Viết lại cho Oracle: bỏ `AS` trước alias của table và đổi LIMIT thành FETCH FIRST.',
  asks: [
    'Giữ nguyên các column, phần nối và ORDER BY.',
    'Alias của table viết liền, không có `AS`.',
    'Lấy 5 row đầu bằng FETCH FIRST.',
  ],
  database: 'teashop',
  tables: ['orders', 'customers'],
  dialects: ['oracle'],
  from: 'SELECT o.order_id, c.full_name\nFROM orders AS o\nINNER JOIN customers AS c ON o.customer_id = c.customer_id\nORDER BY o.order_id\nLIMIT 5;',
  starter: {
    oracle: 'SELECT o.order_id, c.full_name\nFROM orders AS o\nINNER JOIN customers AS c ON o.customer_id = c.customer_id\nORDER BY o.order_id\nLIMIT 5;',
  },
  solution: {
    oracle: 'SELECT o.order_id, c.full_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nORDER BY o.order_id\nFETCH FIRST 5 ROWS ONLY',
  },
  check: { orderMatters: true },
  why: 'Oracle không nhận `AS` trước alias của table, nên `orders AS o` thành `orders o`. Oracle cũng không có LIMIT, nên dùng FETCH FIRST 5 ROWS ONLY.',
  hints: {
    light: 'Hai chỗ khác nhau giữa MySQL và Oracle trong query này: alias của table và cách lấy vài row đầu.',
    specific: 'Xóa chữ `AS` ở `orders AS o` và `customers AS c`. Thay `LIMIT 5` bằng `FETCH FIRST 5 ROWS ONLY`.',
    skeleton: {
      oracle: 'SELECT o.order_id, c.full_name\nFROM orders ____\nINNER JOIN customers ____ ON o.customer_id = c.customer_id\nORDER BY o.order_id\nFETCH FIRST ____ ROWS ONLY',
    },
  },
  wrong: [
    {
      id: 'no-limit',
      sql: {
        oracle: 'SELECT o.order_id, c.full_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id ORDER BY o.order_id',
      },
      hint: 'Phần alias đã đúng kiểu Oracle. Query còn thiếu bước lấy 5 row đầu: thêm FETCH FIRST 5 ROWS ONLY ở cuối.',
    },
    {
      id: 'left-join',
      sql: {
        oracle: 'SELECT o.order_id, c.full_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id ORDER BY o.order_id FETCH FIRST 5 ROWS ONLY',
      },
      hint: 'Query gốc dùng INNER JOIN, còn bản này đổi thành LEFT JOIN nên đơn không có khách lọt vào. Giữ INNER JOIN như query MySQL.',
    },
  ],
};
