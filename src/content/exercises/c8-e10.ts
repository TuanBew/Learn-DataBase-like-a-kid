import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false, aliasMatters: true },
  id: 'c8-e10',
  kind: 'write',
  title: 'Nhân viên bán hơn mức trung bình',
  prompt: 'Trưởng phòng kinh doanh muốn thưởng những người bán giỏi hơn mặt bằng chung. Hãy dùng WITH để tính doanh số của từng nhân viên bán, rồi giữ người có doanh số cao hơn doanh số trung bình của các nhân viên bán.',
  asks: [
    'Bước đầu tên `rep_sales`: mỗi `sales_rep_id` một row, kèm `revenue` là tổng `quantity * unit_price`.',
    'Bỏ đơn `cancelled` và đơn chưa có `sales_rep_id` (NULL).',
    'Hiện `sales_rep_id` và `revenue` của người có `revenue` lớn hơn trung bình `revenue` trong `rep_sales`.'
  ],
  database: 'company',
  tables: [ 'orders', 'order_items' ],
  starter: {
    mysql: 'WITH rep_sales AS (\n  \n)\nSELECT sales_rep_id, revenue\nFROM rep_sales\nWHERE ',
    oracle: 'WITH rep_sales AS (\n  \n)\nSELECT sales_rep_id, revenue\nFROM rep_sales\nWHERE '
  },
  solution: {
    mysql: 'WITH rep_sales AS (\n' +
      '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
      '  FROM orders o\n' +
      '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
      "  WHERE o.sales_rep_id IS NOT NULL AND o.status <> 'cancelled'\n" +
      '  GROUP BY o.sales_rep_id\n' +
      ')\n' +
      'SELECT sales_rep_id, revenue\n' +
      'FROM rep_sales\n' +
      'WHERE revenue > (SELECT AVG(revenue) FROM rep_sales);',
    oracle: 'WITH rep_sales AS (\n' +
      '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
      '  FROM orders o\n' +
      '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
      "  WHERE o.sales_rep_id IS NOT NULL AND o.status <> 'cancelled'\n" +
      '  GROUP BY o.sales_rep_id\n' +
      ')\n' +
      'SELECT sales_rep_id, revenue\n' +
      'FROM rep_sales\n' +
      'WHERE revenue > (SELECT AVG(revenue) FROM rep_sales)'
  },
  why: 'Bước `rep_sales` có tên nên dùng được hai lần: một lần để lọc từng người, một lần trong subquery để tính trung bình. Query chính vì thế chỉ còn một phép so sánh.',
  hints: {
    light: 'Chia làm hai bước. Bước một gom doanh số theo nhân viên và đặt tên. Bước hai so từng người với trung bình của chính bước một.',
    specific: 'Trong `rep_sales`, nối `orders` với `order_items`, lọc cancelled và NULL, rồi GROUP BY `sales_rep_id`. Query chính so `revenue` với `(SELECT AVG(revenue) FROM rep_sales)`.',
    skeleton: {
      mysql: 'WITH rep_sales AS (\n' +
        '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
        '  FROM orders o\n' +
        '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
        "  WHERE o.sales_rep_id IS NOT NULL AND o.status <> 'cancelled'\n" +
        '  GROUP BY ____\n' +
        ')\n' +
        'SELECT sales_rep_id, revenue\n' +
        'FROM rep_sales\n' +
        'WHERE revenue > (SELECT ____(revenue) FROM rep_sales)',
      oracle: 'WITH rep_sales AS (\n' +
        '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
        '  FROM orders o\n' +
        '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
        "  WHERE o.sales_rep_id IS NOT NULL AND o.status <> 'cancelled'\n" +
        '  GROUP BY ____\n' +
        ')\n' +
        'SELECT sales_rep_id, revenue\n' +
        'FROM rep_sales\n' +
        'WHERE revenue > (SELECT ____(revenue) FROM rep_sales)'
    }
  },
  wrong: [
    {
      id: 'cancelled',
      sql: {
        mysql: 'WITH rep_sales AS (\n' +
          '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          '  WHERE o.sales_rep_id IS NOT NULL\n' +
          '  GROUP BY o.sales_rep_id\n' +
          ')\n' +
          'SELECT sales_rep_id, revenue\n' +
          'FROM rep_sales\n' +
          'WHERE revenue > (SELECT AVG(revenue) FROM rep_sales)',
        oracle: 'WITH rep_sales AS (\n' +
          '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          '  WHERE o.sales_rep_id IS NOT NULL\n' +
          '  GROUP BY o.sales_rep_id\n' +
          ')\n' +
          'SELECT sales_rep_id, revenue\n' +
          'FROM rep_sales\n' +
          'WHERE revenue > (SELECT AVG(revenue) FROM rep_sales)'
      },
      hint: "Doanh số đang tính cả đơn cancelled. Thêm `o.status <> 'cancelled'` vào WHERE của `rep_sales`."
    },
    {
      id: 'null-rep',
      sql: {
        mysql: 'WITH rep_sales AS (\n' +
          '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          "  WHERE o.status <> 'cancelled'\n" +
          '  GROUP BY o.sales_rep_id\n' +
          ')\n' +
          'SELECT sales_rep_id, revenue\n' +
          'FROM rep_sales\n' +
          'WHERE revenue > (SELECT AVG(revenue) FROM rep_sales)',
        oracle: 'WITH rep_sales AS (\n' +
          '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          "  WHERE o.status <> 'cancelled'\n" +
          '  GROUP BY o.sales_rep_id\n' +
          ')\n' +
          'SELECT sales_rep_id, revenue\n' +
          'FROM rep_sales\n' +
          'WHERE revenue > (SELECT AVG(revenue) FROM rep_sales)'
      },
      hint: 'Các đơn chưa có nhân viên phụ trách tạo ra một nhóm NULL và làm lệch con số trung bình. Thêm `o.sales_rep_id IS NOT NULL` vào `rep_sales`.'
    },
    {
      id: 'lower',
      sql: {
        mysql: 'WITH rep_sales AS (\n' +
          '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          "  WHERE o.sales_rep_id IS NOT NULL AND o.status <> 'cancelled'\n" +
          '  GROUP BY o.sales_rep_id\n' +
          ')\n' +
          'SELECT sales_rep_id, revenue\n' +
          'FROM rep_sales\n' +
          'WHERE revenue < (SELECT AVG(revenue) FROM rep_sales)',
        oracle: 'WITH rep_sales AS (\n' +
          '  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n' +
          '  FROM orders o\n' +
          '  INNER JOIN order_items oi ON o.order_id = oi.order_id\n' +
          "  WHERE o.sales_rep_id IS NOT NULL AND o.status <> 'cancelled'\n" +
          '  GROUP BY o.sales_rep_id\n' +
          ')\n' +
          'SELECT sales_rep_id, revenue\n' +
          'FROM rep_sales\n' +
          'WHERE revenue < (SELECT AVG(revenue) FROM rep_sales)'
      },
      hint: 'Dấu `<` giữ người bán thấp hơn trung bình. Đổi thành `>`.'
    }
  ]
};
