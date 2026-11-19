import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e6',
  chapter: 6,
  kind: 'fill',
  title: 'Khách từng có đơn bị hủy',
  prompt: 'Chủ tiệm muốn biết tên các khách từng có đơn `cancelled`. Dùng subquery trả về danh sách mã khách cho IN. Điền các chỗ trống `____`.',
  asks: ['Chỉ hiện `full_name`.', 'Chỉ lấy khách có `customer_id` nằm trong danh sách mã khách của đơn cancelled.'],
  database: 'teashop',
  tables: ['customers', 'orders'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT full_name\nFROM customers\nWHERE customer_id ____ (SELECT ____ FROM orders WHERE status = 'cancelled');",
    oracle: "SELECT full_name\nFROM customers\nWHERE customer_id ____ (SELECT ____ FROM orders WHERE status = 'cancelled')",
  },
  solution: {
    mysql: "SELECT full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled');",
    oracle: "SELECT full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled')",
  },
  check: { orderMatters: false },
  why: 'Subquery chạy trước và trả về mã của khách có đơn cancelled. IN giữ các khách trong customers có mã nằm trong danh sách đó.',
  hints: {
    light: 'Subquery trả về một danh sách mã. Query ngoài dùng danh sách đó để lọc.',
    specific: 'Chỗ trống đầu là từ khóa kiểm tra "nằm trong danh sách". Chỗ trống thứ hai là column `customer_id` của table `orders`.',
    skeleton: {
      mysql: "SELECT full_name\nFROM customers\nWHERE customer_id ____ (SELECT ____ FROM orders WHERE status = 'cancelled');",
      oracle: "SELECT full_name\nFROM customers\nWHERE customer_id ____ (SELECT ____ FROM orders WHERE status = 'cancelled')",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT full_name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders)',
        oracle: 'SELECT full_name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders)',
      },
      hint: 'Subquery đang trả mã của mọi khách có đơn. Thêm WHERE status = \'cancelled\' vào subquery để giữ khách có đơn bị hủy.',
    },
    {
      id: 'wrong-column',
      sql: {
        mysql: "SELECT full_name FROM customers WHERE customer_id IN (SELECT store_id FROM orders WHERE status = 'cancelled')",
        oracle: "SELECT full_name FROM customers WHERE customer_id IN (SELECT store_id FROM orders WHERE status = 'cancelled')",
      },
      hint: 'Subquery đang trả mã tiệm, nên so nhầm với mã khách. Đổi `store_id` thành `customer_id`.',
    },
  ],
};
