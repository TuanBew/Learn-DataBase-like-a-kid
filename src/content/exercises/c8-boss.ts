import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: true, aliasMatters: true },
  id: 'c8-boss',
  kind: 'write',
  title: 'Boss: Báo cáo khách hàng nhiều bước',
  prompt: 'Giám đốc cần báo cáo cuối năm: những khách chi nhiều hơn mặt bằng chung, kèm các khách chưa từng đặt đơn để phòng kinh doanh gọi hỏi thăm. Hãy viết bằng WITH.',
  asks: [
    'Bước `cust_rev`: mỗi khách một row với `revenue` là tổng `quantity * unit_price`, bỏ đơn `cancelled`.',
    'Phần một: khách có `revenue` lớn hơn trung bình `revenue` trong `cust_rev`, kèm `country_name`.',
    'Phần hai, ghép bằng UNION ALL: khách không có đơn nào trong `orders`, với `revenue` là 0.',
    'Hiện `customer_name`, `country_name`, `revenue`. Xếp `revenue` giảm dần, rồi `customer_name` tăng dần.'
  ],
  database: 'company',
  tables: [ 'customers', 'countries', 'orders', 'order_items' ],
  starter: { mysql: 'WITH cust_rev AS (\n  \n)\nSELECT ', oracle: 'WITH cust_rev AS (\n  \n)\nSELECT ' },
  solution: {
    mysql: 'WITH cust_rev AS (\n' +
      '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
      '  FROM orders AS o\n' +
      '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
      "  WHERE o.status <> 'cancelled'\n" +
      '  GROUP BY o.customer_id\n' +
      ')\n' +
      'SELECT c.customer_name, co.country_name, r.revenue\n' +
      'FROM cust_rev r\n' +
      'INNER JOIN customers AS c ON c.customer_id = r.customer_id\n' +
      'INNER JOIN countries AS co ON co.country_id = c.country_id\n' +
      'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
      'UNION ALL\n' +
      'SELECT c.customer_name, co.country_name, 0\n' +
      'FROM customers AS c\n' +
      'INNER JOIN countries AS co ON co.country_id = c.country_id\n' +
      'WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.customer_id)\n' +
      'ORDER BY revenue DESC, customer_name;',
    oracle: 'WITH cust_rev AS (\n' +
      '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
      '  FROM orders o\n' +
      '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
      "  WHERE o.status <> 'cancelled'\n" +
      '  GROUP BY o.customer_id\n' +
      ')\n' +
      'SELECT c.customer_name, co.country_name, r.revenue\n' +
      'FROM cust_rev r\n' +
      'INNER JOIN customers c ON c.customer_id = r.customer_id\n' +
      'INNER JOIN countries co ON co.country_id = c.country_id\n' +
      'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
      'UNION ALL\n' +
      'SELECT c.customer_name, co.country_name, 0\n' +
      'FROM customers c\n' +
      'INNER JOIN countries co ON co.country_id = c.country_id\n' +
      'WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)\n' +
      'ORDER BY revenue DESC, customer_name'
  },
  why: 'Bước `cust_rev` tính doanh thu một lần, rồi dùng cho cả phép lọc lẫn phép tính trung bình. UNION ALL thêm các khách chưa có đơn, vì họ không có row nào trong `cust_rev`.',
  hints: {
    light: 'Tách thành ba việc: doanh thu mỗi khách, lọc trên trung bình, rồi thêm khách chưa có đơn.',
    specific: 'Query chính nối `cust_rev` với `customers` và `countries`, lọc `revenue` lớn hơn AVG. Sau UNION ALL, lấy khách NOT EXISTS trong `orders` với số 0 thay cho `revenue`.',
    skeleton: {
      mysql: 'WITH cust_rev AS (\n' +
        '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
        '  FROM orders o\n' +
        '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
        "  WHERE o.status <> 'cancelled'\n" +
        '  GROUP BY o.customer_id\n' +
        ')\n' +
        'SELECT c.customer_name, co.country_name, r.revenue\n' +
        'FROM cust_rev r\n' +
        'INNER JOIN customers c ON c.customer_id = r.customer_id\n' +
        'INNER JOIN countries co ON co.country_id = c.country_id\n' +
        'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
        '____\n' +
        'SELECT c.customer_name, co.country_name, 0\n' +
        'FROM customers c\n' +
        'INNER JOIN countries co ON co.country_id = c.country_id\n' +
        'WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)\n' +
        'ORDER BY revenue DESC, customer_name',
      oracle: 'WITH cust_rev AS (\n' +
        '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
        '  FROM orders o\n' +
        '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
        "  WHERE o.status <> 'cancelled'\n" +
        '  GROUP BY o.customer_id\n' +
        ')\n' +
        'SELECT c.customer_name, co.country_name, r.revenue\n' +
        'FROM cust_rev r\n' +
        'INNER JOIN customers c ON c.customer_id = r.customer_id\n' +
        'INNER JOIN countries co ON co.country_id = c.country_id\n' +
        'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
        '____\n' +
        'SELECT c.customer_name, co.country_name, 0\n' +
        'FROM customers c\n' +
        'INNER JOIN countries co ON co.country_id = c.country_id\n' +
        'WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)\n' +
        'ORDER BY revenue DESC, customer_name'
    }
  },
  wrong: [
    {
      id: 'no-zero',
      sql: {
        mysql: 'WITH cust_rev AS (\n' +
          '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders AS o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          "  WHERE o.status <> 'cancelled'\n" +
          '  GROUP BY o.customer_id\n' +
          ')\n' +
          'SELECT c.customer_name, co.country_name, r.revenue\n' +
          'FROM cust_rev r\n' +
          'INNER JOIN customers AS c ON c.customer_id = r.customer_id\n' +
          'INNER JOIN countries AS co ON co.country_id = c.country_id\n' +
          'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
          'ORDER BY revenue DESC, customer_name',
        oracle: 'WITH cust_rev AS (\n' +
          '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          "  WHERE o.status <> 'cancelled'\n" +
          '  GROUP BY o.customer_id\n' +
          ')\n' +
          'SELECT c.customer_name, co.country_name, r.revenue\n' +
          'FROM cust_rev r\n' +
          'INNER JOIN customers c ON c.customer_id = r.customer_id\n' +
          'INNER JOIN countries co ON co.country_id = c.country_id\n' +
          'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
          'ORDER BY revenue DESC, customer_name'
      },
      hint: 'Báo cáo còn thiếu các khách chưa có đơn. Thêm UNION ALL với query lấy khách NOT EXISTS trong `orders`, `revenue` là 0.'
    },
    {
      id: 'cancelled',
      sql: {
        mysql: 'WITH cust_rev AS (\n' +
          '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders AS o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          '  GROUP BY o.customer_id\n' +
          ')\n' +
          'SELECT c.customer_name, co.country_name, r.revenue\n' +
          'FROM cust_rev r\n' +
          'INNER JOIN customers AS c ON c.customer_id = r.customer_id\n' +
          'INNER JOIN countries AS co ON co.country_id = c.country_id\n' +
          'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
          'UNION ALL\n' +
          'SELECT c.customer_name, co.country_name, 0\n' +
          'FROM customers AS c\n' +
          'INNER JOIN countries AS co ON co.country_id = c.country_id\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.customer_id)\n' +
          'ORDER BY revenue DESC, customer_name',
        oracle: 'WITH cust_rev AS (\n' +
          '  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          '  GROUP BY o.customer_id\n' +
          ')\n' +
          'SELECT c.customer_name, co.country_name, r.revenue\n' +
          'FROM cust_rev r\n' +
          'INNER JOIN customers c ON c.customer_id = r.customer_id\n' +
          'INNER JOIN countries co ON co.country_id = c.country_id\n' +
          'WHERE r.revenue > (SELECT AVG(revenue) FROM cust_rev)\n' +
          'UNION ALL\n' +
          'SELECT c.customer_name, co.country_name, 0\n' +
          'FROM customers c\n' +
          'INNER JOIN countries co ON co.country_id = c.country_id\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)\n' +
          'ORDER BY revenue DESC, customer_name'
      },
      hint: "Doanh thu đang tính cả đơn cancelled. Thêm `WHERE o.status <> 'cancelled'` vào `cust_rev`."
    }
  ]
};
