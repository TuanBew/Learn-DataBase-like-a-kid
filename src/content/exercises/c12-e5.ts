import type { SqlExercise } from '../types';

const build = (_oracle: boolean, where: string) =>
  `SELECT o.order_id, c.customer_name, SUM(oi.quantity * oi.unit_price) AS order_total\nFROM orders o\nINNER JOIN customers c ON c.customer_id = o.customer_id\nINNER JOIN order_items oi ON oi.order_id = o.order_id\nWHERE ${where}\nGROUP BY o.order_id, c.customer_name\nORDER BY o.order_id`;
const right = "o.sales_rep_id IS NULL\n  AND o.status <> 'cancelled'";

export const exercise: SqlExercise = {
  id: 'c12-e5',
  chapter: 12,
  kind: 'write',
  title: 'Đối soát: đơn chưa có nhân viên phụ trách',
  prompt:
    'Kế toán báo tổng doanh thu theo nhân viên thấp hơn tổng doanh thu theo tháng. Bạn nghi ngờ vài đơn chưa ghi nhân viên phụ trách nên bị bỏ khỏi báo cáo nhân viên. Bạn lập danh sách các đơn đó để gửi lại cho kế toán.',
  asks: [
    'Chỉ lấy đơn có `sales_rep_id` là NULL.',
    "Bỏ đơn có `status` là 'cancelled'.",
    'Hiện `order_id`, `customer_name` và `order_total` là tổng `quantity * unit_price` của đơn.',
    'Xếp theo `order_id` tăng dần.',
  ],
  database: 'company',
  tables: ['orders', 'customers', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: 'SELECT ', oracle: 'SELECT ' },
  solution: { mysql: build(false, right), oracle: build(true, right) },
  check: { orderMatters: true, aliasMatters: true },
  why: 'NULL nghĩa là chưa có giá trị, nên phải lọc bằng IS NULL. Các đơn này có doanh thu nhưng không thuộc nhân viên nào. Đó là chỗ lệch giữa hai báo cáo.',
  hints: {
    light: 'So sánh với NULL phải dùng IS NULL. Dấu `=` với NULL không bao giờ cho kết quả đúng.',
    specific: 'WHERE cần hai điều kiện: `o.sales_rep_id IS NULL` và `o.status <> \'cancelled\'`. Nối thêm `customers` để lấy tên khách, rồi GROUP BY `o.order_id` và `c.customer_name`.',
    skeleton: {
      mysql: "SELECT o.order_id, c.customer_name, SUM(____ * ____) AS order_total\nFROM orders o\nINNER JOIN customers c ON c.customer_id = o.customer_id\nINNER JOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.sales_rep_id ____\n  AND o.status <> ____\nGROUP BY o.order_id, c.customer_name\nORDER BY o.order_id",
      oracle: "SELECT o.order_id, c.customer_name, SUM(____ * ____) AS order_total\nFROM orders o\nINNER JOIN customers c ON c.customer_id = o.customer_id\nINNER JOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.sales_rep_id ____\n  AND o.status <> ____\nGROUP BY o.order_id, c.customer_name\nORDER BY o.order_id",
    },
  },
  wrong: [
    {
      id: 'with-cancelled',
      sql: { mysql: build(false, 'o.sales_rep_id IS NULL'), oracle: build(true, 'o.sales_rep_id IS NULL') },
      hint: "Danh sách này còn một đơn 'cancelled'. Đơn hủy không tính doanh thu, nên thêm `o.status <> 'cancelled'`.",
    },
    {
      id: 'equals-null',
      sql: { mysql: build(false, "o.sales_rep_id = NULL\n  AND o.status <> 'cancelled'"), oracle: build(true, "o.sales_rep_id = NULL\n  AND o.status <> 'cancelled'") },
      hint: 'So sánh `= NULL` không bao giờ đúng, nên kết quả rỗng. Đổi thành `IS NULL`.',
    },
  ],
};
