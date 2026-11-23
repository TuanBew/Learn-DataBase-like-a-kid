import type { SqlExercise } from '../types';

const from = '  FROM orders o\n  INNER JOIN order_items oi ON oi.order_id = o.order_id\n';
const date = (d: string, oracle: boolean) => (oracle ? `DATE '${d}'` : `'${d}'`);

const build = (oracle: boolean, where: string) => {
  const name = oracle ? "e.first_name || ' ' || e.last_name" : "CONCAT(e.first_name, ' ', e.last_name)";
  return `WITH rep_rev AS (\n  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n${from}  WHERE ${where}\n  GROUP BY o.sales_rep_id\n)\nSELECT ${name} AS employee_name,\n       r.revenue,\n       RANK() OVER (ORDER BY r.revenue DESC) AS rank_no\nFROM rep_rev r\nINNER JOIN employees e ON e.employee_id = r.sales_rep_id\nORDER BY rank_no, employee_name`;
};
const q4 = (oracle: boolean) =>
  `o.status <> 'cancelled'\n    AND o.order_date >= ${date('2025-10-01', oracle)}\n    AND o.order_date < ${date('2026-01-01', oracle)}`;
const q4Cancelled = (oracle: boolean) =>
  `o.order_date >= ${date('2025-10-01', oracle)}\n    AND o.order_date < ${date('2026-01-01', oracle)}`;
const wholeYear = (oracle: boolean) =>
  `o.status <> 'cancelled'\n    AND o.order_date >= ${date('2025-01-01', oracle)}\n    AND o.order_date < ${date('2026-01-01', oracle)}`;

export const exercise: SqlExercise = {
  id: 'c12-e3',
  chapter: 12,
  kind: 'write',
  title: 'Xếp hạng nhân viên bán quý 4 năm 2025',
  prompt:
    'Anh Hùng muốn biết ai bán tốt nhất ở quý 4 năm 2025, từ 1 tháng 10 tới hết 31 tháng 12. Bạn tính doanh thu của từng nhân viên bán, rồi xếp hạng. Đơn nào chưa ghi nhân viên bán thì không tính.',
  asks: [
    'Bước `rep_rev` (viết bằng WITH): mỗi nhân viên một row với `revenue` là tổng `quantity * unit_price`.',
    "Chỉ lấy đơn đặt trong quý 4 năm 2025, bỏ đơn 'cancelled' và đơn không có `sales_rep_id`.",
    'Hiện `employee_name` (họ và tên đệm, dấu cách, tên gọi), `revenue` và `rank_no` bằng RANK, doanh thu cao nhất là hạng 1.',
    'Xếp theo `rank_no`, rồi `employee_name`.',
  ],
  database: 'company',
  tables: ['orders', 'order_items', 'employees'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: 'WITH rep_rev AS (\n  \n)\nSELECT ', oracle: 'WITH rep_rev AS (\n  \n)\nSELECT ' },
  solution: { mysql: build(false, q4(false)), oracle: build(true, q4(true)) },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Bước `rep_rev` tính doanh thu một lần cho mỗi nhân viên. INNER JOIN với `employees` loại luôn các đơn có `sales_rep_id` NULL. RANK xếp hạng trên kết quả đó.',
  hints: {
    light: 'Tách hai việc. Việc một: doanh thu mỗi nhân viên trong quý 4. Việc hai: xếp hạng các nhân viên đó bằng RANK.',
    specific:
      'Trong `rep_rev`, GROUP BY `o.sales_rep_id` và lọc `order_date` từ 2025-10-01 tới trước 2026-01-01. Ngoài WITH, nối `rep_rev` với `employees`, rồi thêm `RANK() OVER (ORDER BY r.revenue DESC)`.',
    skeleton: {
      mysql:
        "WITH rep_rev AS (\n  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n  FROM orders o\n  INNER JOIN order_items oi ON oi.order_id = o.order_id\n  WHERE o.status <> 'cancelled'\n    AND o.order_date >= ____\n    AND o.order_date < ____\n  GROUP BY o.sales_rep_id\n)\nSELECT CONCAT(e.first_name, ' ', e.last_name) AS employee_name,\n       r.revenue,\n       RANK() OVER (ORDER BY ____ DESC) AS rank_no\nFROM rep_rev r\nINNER JOIN employees e ON e.employee_id = ____\nORDER BY rank_no, employee_name",
      oracle:
        "WITH rep_rev AS (\n  SELECT o.sales_rep_id, SUM(oi.quantity * oi.unit_price) AS revenue\n  FROM orders o\n  INNER JOIN order_items oi ON oi.order_id = o.order_id\n  WHERE o.status <> 'cancelled'\n    AND o.order_date >= ____\n    AND o.order_date < ____\n  GROUP BY o.sales_rep_id\n)\nSELECT e.first_name || ' ' || e.last_name AS employee_name,\n       r.revenue,\n       RANK() OVER (ORDER BY ____ DESC) AS rank_no\nFROM rep_rev r\nINNER JOIN employees e ON e.employee_id = ____\nORDER BY rank_no, employee_name",
    },
  },
  wrong: [
    {
      id: 'whole-year',
      sql: { mysql: build(false, wholeYear(false)), oracle: build(true, wholeYear(true)) },
      hint: 'Query này tính cả năm 2025. Đề bài chỉ cần quý 4, từ 2025-10-01 tới trước 2026-01-01.',
    },
    {
      id: 'with-cancelled',
      sql: { mysql: build(false, q4Cancelled(false)), oracle: build(true, q4Cancelled(true)) },
      hint: "Query này còn tính đơn 'cancelled'. Thêm `o.status <> 'cancelled'` vào WHERE của `rep_rev`.",
    },
  ],
};
