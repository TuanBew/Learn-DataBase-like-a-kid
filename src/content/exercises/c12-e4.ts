import type { SqlExercise } from '../types';

const date = (d: string, oracle: boolean) => (oracle ? `DATE '${d}'` : `'${d}'`);

const build = (where: string, top: number) =>
  `WITH cust_rev AS (\n  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS revenue\n  FROM orders o\n  INNER JOIN order_items oi ON oi.order_id = o.order_id\n  WHERE ${where}\n  GROUP BY o.customer_id\n),\nranked AS (\n  SELECT r.region_id, r.region_name, c.customer_name, cr.revenue,\n         RANK() OVER (PARTITION BY r.region_id ORDER BY cr.revenue DESC) AS pos\n  FROM cust_rev cr\n  INNER JOIN customers c ON c.customer_id = cr.customer_id\n  INNER JOIN countries co ON co.country_id = c.country_id\n  INNER JOIN regions r ON r.region_id = co.region_id\n)\nSELECT region_name, customer_name, revenue, pos\nFROM ranked\nWHERE pos <= ${top}\nORDER BY region_id, pos, customer_name`;
const y2025 = (oracle: boolean) =>
  `o.status <> 'cancelled'\n    AND o.order_date >= ${date('2025-01-01', oracle)}\n    AND o.order_date < ${date('2026-01-01', oracle)}`;
const allYears = "o.status <> 'cancelled'";

export const exercise: SqlExercise = {
  id: 'c12-e4',
  chapter: 12,
  kind: 'write',
  title: 'Ba khách mua nhiều nhất mỗi vùng',
  prompt:
    'Phòng kinh doanh muốn chăm kỹ các khách lớn của năm 2025. Bạn lọc ra ba khách có doanh thu cao nhất trong từng khu vực. Khu vực nào có ít hơn ba khách có đơn thì hiện bấy nhiêu khách.',
  asks: [
    "Bước `cust_rev`: doanh thu từng khách trong năm 2025, bỏ đơn 'cancelled'.",
    'Nối khách tới `countries` và `regions` để có `region_name`.',
    'Bước `ranked`: `pos` là RANK trong từng khu vực, `PARTITION BY` khu vực, doanh thu cao nhất là hạng 1.',
    'Hiện `region_name`, `customer_name`, `revenue`, `pos`, chỉ giữ `pos` từ 1 tới 3. Xếp theo mã khu vực, `pos`, rồi `customer_name`.',
  ],
  database: 'company',
  tables: ['customers', 'countries', 'regions', 'orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: 'WITH cust_rev AS (\n  \n)\nSELECT ', oracle: 'WITH cust_rev AS (\n  \n)\nSELECT ' },
  solution: { mysql: build(y2025(false), 3), oracle: build(y2025(true), 3) },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Window function không lọc được trong WHERE cùng cấp, nên bước `ranked` tính `pos` trước. Query ngoài mới lọc `pos <= 3`. PARTITION BY làm RANK bắt đầu lại từ 1 ở mỗi khu vực.',
  hints: {
    light: 'Muốn top N mỗi nhóm, tính hạng bằng RANK với PARTITION BY nhóm đó, rồi lọc hạng ở một bước sau.',
    specific:
      'Viết ba bước: `cust_rev` cộng doanh thu mỗi khách, `ranked` nối `countries`, `regions` và tính `RANK() OVER (PARTITION BY r.region_id ORDER BY cr.revenue DESC)`, rồi SELECT ngoài lọc `pos <= 3`.',
    skeleton: {
      mysql: build(y2025(false), 3).replace('PARTITION BY r.region_id', 'PARTITION BY ____').replace('pos <= 3', 'pos <= ____'),
      oracle: build(y2025(true), 3).replace('PARTITION BY r.region_id', 'PARTITION BY ____').replace('pos <= 3', 'pos <= ____'),
    },
  },
  wrong: [
    {
      id: 'all-years',
      sql: { mysql: build(allYears, 3), oracle: build(allYears, 3) },
      hint: 'Query này tính doanh thu mọi năm. Đề bài chỉ cần năm 2025, nên giới hạn `order_date` trong `cust_rev`.',
    },
    {
      id: 'top-two',
      sql: { mysql: build(y2025(false), 2), oracle: build(y2025(true), 2) },
      hint: 'Query này chỉ giữ hai khách mỗi khu vực. Đổi điều kiện thành `pos <= 3`.',
    },
  ],
};
