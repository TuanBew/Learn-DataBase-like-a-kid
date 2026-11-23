import type { SqlExercise } from '../types';

const from = 'FROM orders o\nINNER JOIN order_items oi ON oi.order_id = o.order_id\n';
const mysqlSel = (where: string) =>
  `SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS report_month,\n       SUM(oi.quantity * oi.unit_price) AS revenue\n${from}WHERE ${where}\nGROUP BY DATE_FORMAT(o.order_date, '%Y-%m')\nORDER BY report_month`;
const oracleSel = (where: string) =>
  `SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS report_month,\n       SUM(oi.quantity * oi.unit_price) AS revenue\n${from}WHERE ${where}\nGROUP BY TO_CHAR(o.order_date, 'YYYY-MM')\nORDER BY report_month`;

const mYear = "o.order_date >= '2025-01-01'\n  AND o.order_date < '2026-01-01'";
const oYear = "o.order_date >= DATE '2025-01-01'\n  AND o.order_date < DATE '2026-01-01'";

export const exercise: SqlExercise = {
  id: 'c12-e2',
  chapter: 12,
  kind: 'write',
  title: 'Doanh thu theo tháng của năm 2025',
  prompt:
    'Anh Hùng, trưởng phòng kinh doanh, cần doanh thu từng tháng của năm 2025 để họp đầu tháng. Bạn làm bước đầu của báo cáo nhé. Doanh thu của một đơn là tổng `quantity * unit_price` của các món trong đơn.',
  asks: [
    'Hiện `report_month` theo dạng năm-tháng, ví dụ `2025-01`, và `revenue`.',
    'Chỉ lấy đơn đặt trong năm 2025.',
    "Bỏ đơn có `status` là 'cancelled'.",
    'Xếp theo `report_month` tăng dần.',
  ],
  database: 'company',
  tables: ['orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: 'SELECT ', oracle: 'SELECT ' },
  solution: {
    mysql: mysqlSel(`o.status <> 'cancelled'\n  AND ${mYear}`),
    oracle: oracleSel(`o.status <> 'cancelled'\n  AND ${oYear}`),
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Query nối `orders` với `order_items` để có ngày và tiền trên cùng một row. WHERE bỏ đơn hủy và giữ năm 2025, rồi GROUP BY gom theo tháng. Mười hai tháng cộng lại là doanh thu cả năm.',
  hints: {
    light: 'Mỗi tháng là một nhóm, nên cần GROUP BY. Tên tháng lấy từ `order_date` bằng function định dạng ngày.',
    specific: 'Nối `orders` với `order_items` bằng `order_id`. WHERE lọc `status` và khoảng `order_date`. GROUP BY đúng biểu thức tháng đã hiện ở SELECT.',
    skeleton: {
      mysql:
        "SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS report_month,\n       SUM(____ * ____) AS revenue\nFROM orders o\nINNER JOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> ____\n  AND o.order_date >= ____\n  AND o.order_date < ____\nGROUP BY ____\nORDER BY report_month",
      oracle:
        "SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS report_month,\n       SUM(____ * ____) AS revenue\nFROM orders o\nINNER JOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> ____\n  AND o.order_date >= ____\n  AND o.order_date < ____\nGROUP BY ____\nORDER BY report_month",
    },
  },
  wrong: [
    {
      id: 'with-cancelled',
      sql: { mysql: mysqlSel(mYear), oracle: oracleSel(oYear) },
      hint: "Query này còn tính đơn 'cancelled', nên doanh thu cao hơn số thật. Thêm điều kiện `o.status <> 'cancelled'` vào WHERE.",
    },
    {
      id: 'all-years',
      sql: { mysql: mysqlSel("o.status <> 'cancelled'"), oracle: oracleSel("o.status <> 'cancelled'") },
      hint: 'Query này lấy cả năm 2026, nên báo cáo thừa hai tháng. Giới hạn `order_date` từ 2025-01-01 tới trước 2026-01-01.',
    },
  ],
};
