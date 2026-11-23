import type { SqlExercise } from '../types';

const mysqlSql = (revenueCol: string, running: string, prev: string, where = "o.status <> 'cancelled' AND ") =>
  'WITH monthly AS (\n' +
  "  SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS ym,\n" +
  `         SUM(${revenueCol}) AS revenue\n` +
  '  FROM orders o\n' +
  '  JOIN order_items oi ON oi.order_id = o.order_id\n' +
  `  WHERE ${where}o.order_date >= '2025-01-01' AND o.order_date < '2026-01-01'\n` +
  "  GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')\n" +
  ')\n' +
  'SELECT ym, revenue,\n' +
  `       ${running} AS running_total,\n` +
  `       ${prev} AS prev_revenue\n` +
  'FROM monthly\n' +
  'ORDER BY ym';

const oracleSql = (revenueCol: string, running: string, prev: string, where = "o.status <> 'cancelled' AND ") =>
  'WITH monthly AS (\n' +
  "  SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS ym,\n" +
  `         SUM(${revenueCol}) AS revenue\n` +
  '  FROM orders o\n' +
  '  JOIN order_items oi ON oi.order_id = o.order_id\n' +
  `  WHERE ${where}o.order_date >= DATE '2025-01-01' AND o.order_date < DATE '2026-01-01'\n` +
  "  GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')\n" +
  ')\n' +
  'SELECT ym, revenue,\n' +
  `       ${running} AS running_total,\n` +
  `       ${prev} AS prev_revenue\n` +
  'FROM monthly\n' +
  'ORDER BY ym';

const REV = 'oi.quantity * oi.unit_price';
const RUN = 'SUM(revenue) OVER (ORDER BY ym)';
const PREV = 'LAG(revenue) OVER (ORDER BY ym)';

const skeleton = (core: string, end: string) =>
  core.replace(RUN, 'SUM(revenue) OVER (ORDER BY ____)').replace(PREV, '____(revenue) OVER (ORDER BY ym)') + end;

export const exercise: SqlExercise = {
  id: 'c9-e4',
  chapter: 9,
  kind: 'write',
  title: 'Doanh thu từng tháng của năm 2025',
  prompt:
    'Chị kế toán cần báo cáo doanh thu từng tháng của năm 2025. Mỗi tháng kèm doanh thu cộng dồn từ đầu năm và doanh thu của tháng trước. Query khung đã gom doanh thu theo tháng. Bạn thêm hai window function.',
  asks: [
    'Doanh thu là tổng `quantity * unit_price`. Không tính đơn có `status` là `cancelled`.',
    'Hiện tháng, doanh thu tháng, doanh thu cộng dồn và doanh thu tháng trước.',
    'Tháng đầu chưa có tháng trước, nên để NULL.',
    'Sắp theo tháng tăng dần.',
  ],
  database: 'company',
  tables: ['orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql:
      'WITH monthly AS (\n' +
      "  SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS ym,\n" +
      '    SUM(oi.quantity * oi.unit_price) AS revenue\n' +
      '  FROM orders o\n' +
      '  JOIN order_items oi ON oi.order_id = o.order_id\n' +
      "  WHERE o.status <> 'cancelled' AND o.order_date >= '2025-01-01' AND o.order_date < '2026-01-01'\n" +
      "  GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')\n" +
      ')\n' +
      'SELECT ym, revenue\n' +
      'FROM monthly\n' +
      'ORDER BY ym;',
    oracle:
      'WITH monthly AS (\n' +
      "  SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS ym,\n" +
      '    SUM(oi.quantity * oi.unit_price) AS revenue\n' +
      '  FROM orders o\n' +
      '  JOIN order_items oi ON oi.order_id = o.order_id\n' +
      "  WHERE o.status <> 'cancelled' AND o.order_date >= DATE '2025-01-01' AND o.order_date < DATE '2026-01-01'\n" +
      "  GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')\n" +
      ')\n' +
      'SELECT ym, revenue\n' +
      'FROM monthly\n' +
      'ORDER BY ym',
  },
  solution: {
    mysql: mysqlSql(REV, RUN, PREV) + ';',
    oracle: oracleSql(REV, RUN, PREV),
  },
  check: { orderMatters: true },
  why: 'SUM với ORDER BY trong OVER cộng dồn từ tháng đầu tới tháng hiện tại. LAG lấy doanh thu của row đứng ngay trước, tức là tháng trước.',
  hints: {
    light: 'Cả hai column mới cùng sắp theo tháng. Một cái cộng dồn, một cái nhìn lại row trước.',
    specific: 'Cộng dồn dùng SUM(revenue) OVER (ORDER BY ym). Tháng trước dùng LAG(revenue) OVER (ORDER BY ym).',
    skeleton: {
      mysql: skeleton(mysqlSql(REV, RUN, PREV), ';'),
      oracle: skeleton(oracleSql(REV, RUN, PREV), ''),
    },
  },
  wrong: [
    {
      id: 'no-order',
      sql: {
        mysql: mysqlSql(REV, 'SUM(revenue) OVER ()', PREV),
        oracle: oracleSql(REV, 'SUM(revenue) OVER ()', PREV),
      },
      hint: 'OVER () trống cộng cả năm, nên mọi tháng cùng một con số. Thêm ORDER BY ym trong OVER để cộng dồn từng tháng.',
    },
    {
      id: 'lead',
      sql: {
        mysql: mysqlSql(REV, RUN, 'LEAD(revenue) OVER (ORDER BY ym)'),
        oracle: oracleSql(REV, RUN, 'LEAD(revenue) OVER (ORDER BY ym)'),
      },
      hint: 'LEAD nhìn tới tháng sau. Đề cần tháng trước, nên đổi LEAD thành LAG.',
    },
    {
      id: 'with-cancelled',
      sql: {
        mysql: mysqlSql(REV, RUN, PREV, ''),
        oracle: oracleSql(REV, RUN, PREV, ''),
      },
      hint: 'Doanh thu đang tính cả đơn `cancelled`. Thêm `o.status <> \'cancelled\'` vào WHERE của khối `monthly`.',
    },
  ],
};
