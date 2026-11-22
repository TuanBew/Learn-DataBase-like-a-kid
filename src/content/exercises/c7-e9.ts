import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e9',
  chapter: 7,
  kind: 'write',
  title: 'Doanh thu theo vùng',
  prompt: 'Anh Long, giám đốc kinh doanh, hỏi mỗi vùng mang về bao nhiêu tiền. Bạn nối năm table để tính, và bỏ các đơn đã hủy.',
  asks: [
    'Hiện `region_name` và doanh thu, đặt tên column doanh thu là `revenue`.',
    "Bỏ đơn có `status` là 'cancelled'.",
    'Doanh thu là tổng `quantity * unit_price`, mỗi vùng một row.',
    'Vùng có doanh thu cao đứng trước.',
  ],
  database: 'company',
  tables: ['order_items', 'orders', 'customers', 'countries', 'regions'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\n',
    oracle: 'SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\n',
  },
  solution: {
    mysql: "SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN countries co ON c.country_id = co.country_id\nINNER JOIN regions r ON co.region_id = r.region_id\nWHERE o.status <> 'cancelled'\nGROUP BY r.region_name\nORDER BY revenue DESC;",
    oracle: "SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN countries co ON c.country_id = co.country_id\nINNER JOIN regions r ON co.region_id = r.region_id\nWHERE o.status <> 'cancelled'\nGROUP BY r.region_name\nORDER BY revenue DESC",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Bốn JOIN đi từ món tới đơn, khách, quốc gia, vùng. WHERE bỏ đơn cancelled, rồi GROUP BY gom doanh thu theo vùng.',
  hints: {
    light: 'Đi từng bước theo foreign key: món, đơn, khách, quốc gia, vùng. Thêm một JOIN rồi chạy thử.',
    specific: "Nối `orders` bằng `order_id`, `customers` bằng `customer_id`, `countries` bằng `country_id`, `regions` bằng `region_id`. WHERE `o.status <> 'cancelled'`, GROUP BY `r.region_name`.",
    skeleton: {
      mysql: "SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.____\nINNER JOIN customers c ON o.customer_id = c.____\nINNER JOIN countries co ON c.country_id = co.____\nINNER JOIN regions r ON co.region_id = r.____\nWHERE o.status <> ____\nGROUP BY ____\nORDER BY revenue DESC;",
      oracle: "SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.____\nINNER JOIN customers c ON o.customer_id = c.____\nINNER JOIN countries co ON c.country_id = co.____\nINNER JOIN regions r ON co.region_id = r.____\nWHERE o.status <> ____\nGROUP BY ____\nORDER BY revenue DESC",
    },
  },
  wrong: [
    {
      id: 'no-status',
      sql: {
        mysql: 'SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id GROUP BY r.region_name ORDER BY revenue DESC',
        oracle: 'SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id GROUP BY r.region_name ORDER BY revenue DESC',
      },
      hint: "Năm table đã nối đúng. Doanh thu đang cộng cả đơn cancelled. Thêm WHERE o.status <> 'cancelled'.",
    },
    {
      id: 'only-delivered',
      sql: {
        mysql: "SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id WHERE o.status = 'delivered' GROUP BY r.region_name ORDER BY revenue DESC",
        oracle: "SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id WHERE o.status = 'delivered' GROUP BY r.region_name ORDER BY revenue DESC",
      },
      hint: "Điều kiện này giữ mỗi đơn delivered và bỏ luôn đơn shipped, processing. Đề chỉ bỏ cancelled, nên viết o.status <> 'cancelled'.",
    },
    {
      id: 'no-quantity',
      sql: {
        mysql: "SELECT r.region_name, SUM(oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id WHERE o.status <> 'cancelled' GROUP BY r.region_name ORDER BY revenue DESC",
        oracle: "SELECT r.region_name, SUM(oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id WHERE o.status <> 'cancelled' GROUP BY r.region_name ORDER BY revenue DESC",
      },
      hint: 'Query này cộng đơn giá mà quên số lượng. Tiền của một món là `oi.quantity * oi.unit_price`.',
    },
  ],
};
