import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e12',
  chapter: 7,
  kind: 'debug',
  title: 'Tổng hạn mức phình to',
  prompt: 'Chị Hạnh muốn biết tổng `credit_limit` của các khách đã có đơn. Query này ra số quá lớn, vì mỗi khách bị cộng nhiều lần. Bấm Chạy để xem số, rồi sửa để mỗi khách chỉ cộng một lần.',
  asks: [
    'Hiện một số duy nhất: tổng `credit_limit`.',
    'Chỉ tính khách có ít nhất một đơn.',
    'Mỗi khách chỉ cộng đúng một lần.',
  ],
  database: 'company',
  tables: ['customers', 'orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT SUM(c.credit_limit) AS total_credit\nFROM customers c\nINNER JOIN orders o ON c.customer_id = o.customer_id\nINNER JOIN order_items oi ON o.order_id = oi.order_id;',
    oracle: 'SELECT SUM(c.credit_limit) AS total_credit\nFROM customers c\nINNER JOIN orders o ON c.customer_id = o.customer_id\nINNER JOIN order_items oi ON o.order_id = oi.order_id',
  },
  solution: {
    mysql: 'SELECT SUM(c.credit_limit) AS total_credit\nFROM customers c\nINNER JOIN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY customer_id\n) o ON c.customer_id = o.customer_id;',
    oracle: 'SELECT SUM(c.credit_limit) AS total_credit\nFROM customers c\nINNER JOIN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY customer_id\n) o ON c.customer_id = o.customer_id',
  },
  check: { orderMatters: false },
  why: 'Một khách có nhiều đơn, một đơn có nhiều món, nên nối thẳng chép `credit_limit` nhiều lần. Gom `orders` về một row cho mỗi khách trước, rồi mới nối, thì mỗi khách chỉ có một bản.',
  hints: {
    light: 'Một khách ghép với nhiều đơn, và mỗi đơn ghép với nhiều món. Hãy gom trước để mỗi khách còn đúng một row, rồi mới nối.',
    specific: 'Bỏ `order_items`, vì bạn không cần món. Thay `orders` bằng subquery `SELECT customer_id FROM orders GROUP BY customer_id`, đặt trong ngoặc sau JOIN và cho một alias.',
    skeleton: {
      mysql: 'SELECT SUM(c.credit_limit) AS total_credit\nFROM customers c\nINNER JOIN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY ____\n) o ON c.customer_id = o.____;',
      oracle: 'SELECT SUM(c.credit_limit) AS total_credit\nFROM customers c\nINNER JOIN (\n  SELECT customer_id\n  FROM orders\n  GROUP BY ____\n) o ON c.customer_id = o.____',
    },
  },
  wrong: [
    {
      id: 'drop-items-only',
      sql: {
        mysql: 'SELECT SUM(c.credit_limit) AS total_credit FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id',
        oracle: 'SELECT SUM(c.credit_limit) AS total_credit FROM customers c INNER JOIN orders o ON c.customer_id = o.customer_id',
      },
      hint: 'Số nhỏ đi, nhưng vẫn quá lớn. Khách có nhiều đơn vẫn bị cộng nhiều lần. Gom `orders` về một row cho mỗi khách trước khi nối.',
    },
    {
      id: 'all-customers',
      sql: {
        mysql: 'SELECT SUM(credit_limit) AS total_credit FROM customers',
        oracle: 'SELECT SUM(credit_limit) AS total_credit FROM customers',
      },
      hint: 'Mỗi khách chỉ cộng một lần rồi, nhưng query này tính cả khách chưa có đơn nào. Giữ đúng các khách có đơn bằng cách nối với `orders` đã gom.',
    },
  ],
};
