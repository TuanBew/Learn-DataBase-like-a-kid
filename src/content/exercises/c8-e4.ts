import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: true, aliasMatters: true },
  id: 'c8-e4',
  kind: 'write',
  title: 'Năm khách chi nhiều nhất',
  prompt: 'Kế toán cần danh sách năm khách đã chi nhiều nhất. Hãy gom `order_items` theo đơn trong một subquery ở FROM để ra tiền của từng đơn, rồi nối với `orders` và `customers`.',
  asks: [
    'Tiền của một đơn là tổng `quantity * unit_price`, tính bằng subquery trong FROM.',
    'Bỏ đơn có `status` là `cancelled`.',
    'Hiện `customer_name` và tổng tiền của khách, đặt tên `total_spent`.',
    'Xếp `total_spent` giảm dần, lấy 5 khách đầu.'
  ],
  database: 'company',
  tables: [ 'customers', 'orders', 'order_items' ],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
      'FROM orders AS o\n' +
      'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) t ON o.order_id = t.order_id\n' +
      'INNER JOIN customers AS c ON o.customer_id = c.customer_id\n' +
      "WHERE o.status <> 'cancelled'\n" +
      'GROUP BY c.customer_id, c.customer_name\n' +
      'ORDER BY total_spent DESC\n' +
      'LIMIT 5;',
    oracle: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
      'FROM orders o\n' +
      'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) t ON o.order_id = t.order_id\n' +
      'INNER JOIN customers c ON o.customer_id = c.customer_id\n' +
      "WHERE o.status <> 'cancelled'\n" +
      'GROUP BY c.customer_id, c.customer_name\n' +
      'ORDER BY total_spent DESC\n' +
      'FETCH FIRST 5 ROWS ONLY'
  },
  why: 'Subquery gom `order_items` thành một row cho mỗi đơn trước khi nối. Sau đó mỗi khách cộng tiền các đơn của mình, nên không đếm trùng.',
  hints: {
    light: 'Gom trước, nối sau. Subquery trong FROM cho ra một table nhỏ: mỗi đơn một row với tiền của đơn đó.',
    specific: 'Subquery gom `order_items` bằng GROUP BY `order_id`. Query ngoài nối nó với `orders` rồi `customers`, bỏ đơn cancelled, và cộng theo khách.',
    skeleton: {
      mysql: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
        'FROM orders AS o\n' +
        'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY ____) t ON o.order_id = t.order_id\n' +
        'INNER JOIN customers AS c ON o.customer_id = c.customer_id\n' +
        "WHERE o.status ____ 'cancelled'\n" +
        'GROUP BY c.customer_id, c.customer_name\n' +
        'ORDER BY total_spent DESC\n' +
        'LIMIT 5',
      oracle: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
        'FROM orders o\n' +
        'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY ____) t ON o.order_id = t.order_id\n' +
        'INNER JOIN customers c ON o.customer_id = c.customer_id\n' +
        "WHERE o.status ____ 'cancelled'\n" +
        'GROUP BY c.customer_id, c.customer_name\n' +
        'ORDER BY total_spent DESC\n' +
        'FETCH FIRST 5 ROWS ONLY'
    }
  },
  wrong: [
    {
      id: 'cancelled',
      sql: {
        mysql: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
          'FROM orders AS o\n' +
          'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) t ON o.order_id = t.order_id\n' +
          'INNER JOIN customers AS c ON o.customer_id = c.customer_id\n' +
          'GROUP BY c.customer_id, c.customer_name\n' +
          'ORDER BY total_spent DESC\n' +
          'LIMIT 5',
        oracle: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
          'FROM orders o\n' +
          'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) t ON o.order_id = t.order_id\n' +
          'INNER JOIN customers c ON o.customer_id = c.customer_id\n' +
          'GROUP BY c.customer_id, c.customer_name\n' +
          'ORDER BY total_spent DESC\n' +
          'FETCH FIRST 5 ROWS ONLY'
      },
      hint: "Query đang tính cả đơn cancelled. Thêm `WHERE o.status <> 'cancelled'` ở query ngoài."
    },
    {
      id: 'asc',
      sql: {
        mysql: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
          'FROM orders AS o\n' +
          'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) t ON o.order_id = t.order_id\n' +
          'INNER JOIN customers AS c ON o.customer_id = c.customer_id\n' +
          "WHERE o.status <> 'cancelled'\n" +
          'GROUP BY c.customer_id, c.customer_name\n' +
          'ORDER BY total_spent ASC\n' +
          'LIMIT 5',
        oracle: 'SELECT c.customer_name, SUM(t.total) AS total_spent\n' +
          'FROM orders o\n' +
          'INNER JOIN (SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id) t ON o.order_id = t.order_id\n' +
          'INNER JOIN customers c ON o.customer_id = c.customer_id\n' +
          "WHERE o.status <> 'cancelled'\n" +
          'GROUP BY c.customer_id, c.customer_name\n' +
          'ORDER BY total_spent ASC\n' +
          'FETCH FIRST 5 ROWS ONLY'
      },
      hint: 'ASC xếp khách chi ít nhất lên đầu. Đổi thành DESC để lấy khách chi nhiều nhất.'
    }
  ]
};
