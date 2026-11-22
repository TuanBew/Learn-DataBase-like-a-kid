import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-boss',
  chapter: 7,
  kind: 'write',
  title: 'Boss: đơn kèm khách, vùng và nhân viên bán',
  prompt: "Giám đốc cần danh sách theo dõi các đơn đặt từ ngày 2026-01-01. Mỗi đơn kèm tên khách, quốc gia, vùng, nhân viên bán và phòng của nhân viên đó. Đơn không có nhân viên bán vẫn phải hiện.",
  asks: [
    'Hiện `order_id`, `customer_name`, `country_name`, `region_name`, tên nhân viên bán đặt là `sales_rep`, và `department_name`.',
    'Tên nhân viên là `first_name` và `last_name` ghép lại, cách nhau một dấu cách.',
    'Chỉ lấy đơn có `order_date` từ 2026-01-01 trở đi.',
    'Đơn không có nhân viên bán vẫn hiện, với `sales_rep` và `department_name` để trống.',
    'Xếp theo `order_id` tăng dần.',
  ],
  database: 'company',
  tables: ['orders', 'customers', 'countries', 'regions', 'employees', 'departments'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name,\n       CONCAT(e.first_name, ' ', e.last_name) AS sales_rep, d.department_name\nFROM orders o\n",
    oracle: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name,\n       e.first_name || ' ' || e.last_name AS sales_rep, d.department_name\nFROM orders o\n",
  },
  solution: {
    mysql: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name,\n       CONCAT(e.first_name, ' ', e.last_name) AS sales_rep, d.department_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN countries co ON c.country_id = co.country_id\nINNER JOIN regions r ON co.region_id = r.region_id\nLEFT JOIN employees e ON o.sales_rep_id = e.employee_id\nLEFT JOIN departments d ON e.department_id = d.department_id\nWHERE o.order_date >= '2026-01-01'\nORDER BY o.order_id;",
    oracle: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name,\n       e.first_name || ' ' || e.last_name AS sales_rep, d.department_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.customer_id\nINNER JOIN countries co ON c.country_id = co.country_id\nINNER JOIN regions r ON co.region_id = r.region_id\nLEFT JOIN employees e ON o.sales_rep_id = e.employee_id\nLEFT JOIN departments d ON e.department_id = d.department_id\nWHERE o.order_date >= DATE '2026-01-01'\nORDER BY o.order_id",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Khách, quốc gia, vùng luôn có, nên dùng INNER JOIN. Nhân viên và phòng có thể thiếu, nên dùng LEFT JOIN, và LEFT JOIN thứ hai nối tiếp từ `e` để đơn không có nhân viên vẫn được giữ.',
  hints: {
    light: 'Đi từ `orders` theo từng foreign key. Phần nào luôn có thì INNER JOIN. Phần nào có thể thiếu thì LEFT JOIN.',
    specific: 'Ba JOIN đầu nối khách, quốc gia, vùng. Hai JOIN sau nối nhân viên (`o.sales_rep_id = e.employee_id`) và phòng (`e.department_id = d.department_id`), cả hai là LEFT JOIN.',
    skeleton: {
      mysql: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name,\n       CONCAT(e.first_name, ' ', e.last_name) AS sales_rep, d.department_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.____\nINNER JOIN countries co ON c.country_id = co.____\nINNER JOIN regions r ON co.region_id = r.____\n____ JOIN employees e ON o.sales_rep_id = e.____\n____ JOIN departments d ON e.department_id = d.____\nWHERE o.order_date >= '2026-01-01'\nORDER BY o.order_id;",
      oracle: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name,\n       e.first_name || ' ' || e.last_name AS sales_rep, d.department_name\nFROM orders o\nINNER JOIN customers c ON o.customer_id = c.____\nINNER JOIN countries co ON c.country_id = co.____\nINNER JOIN regions r ON co.region_id = r.____\n____ JOIN employees e ON o.sales_rep_id = e.____\n____ JOIN departments d ON e.department_id = d.____\nWHERE o.order_date >= DATE '2026-01-01'\nORDER BY o.order_id",
    },
  },
  wrong: [
    {
      id: 'inner-employees',
      sql: {
        mysql: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name, CONCAT(e.first_name, ' ', e.last_name) AS sales_rep, d.department_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id INNER JOIN employees e ON o.sales_rep_id = e.employee_id LEFT JOIN departments d ON e.department_id = d.department_id WHERE o.order_date >= '2026-01-01' ORDER BY o.order_id",
        oracle: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name, e.first_name || ' ' || e.last_name AS sales_rep, d.department_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id INNER JOIN employees e ON o.sales_rep_id = e.employee_id LEFT JOIN departments d ON e.department_id = d.department_id WHERE o.order_date >= DATE '2026-01-01' ORDER BY o.order_id",
      },
      hint: 'INNER JOIN với `employees` bỏ mất đơn không có nhân viên bán. Đổi JOIN đó sang LEFT JOIN.',
    },
    {
      id: 'no-date',
      sql: {
        mysql: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name, CONCAT(e.first_name, ' ', e.last_name) AS sales_rep, d.department_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id LEFT JOIN employees e ON o.sales_rep_id = e.employee_id LEFT JOIN departments d ON e.department_id = d.department_id ORDER BY o.order_id",
        oracle: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name, e.first_name || ' ' || e.last_name AS sales_rep, d.department_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id LEFT JOIN employees e ON o.sales_rep_id = e.employee_id LEFT JOIN departments d ON e.department_id = d.department_id ORDER BY o.order_id",
      },
      hint: 'Các JOIN đã đúng. Query còn thiếu WHERE, nên đang hiện mọi đơn. Chỉ lấy đơn có `order_date` từ 2026-01-01.',
    },
    {
      id: 'last-name-only',
      sql: {
        mysql: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name, e.last_name AS sales_rep, d.department_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id LEFT JOIN employees e ON o.sales_rep_id = e.employee_id LEFT JOIN departments d ON e.department_id = d.department_id WHERE o.order_date >= '2026-01-01' ORDER BY o.order_id",
        oracle: "SELECT o.order_id, c.customer_name, co.country_name, r.region_name, e.last_name AS sales_rep, d.department_name FROM orders o INNER JOIN customers c ON o.customer_id = c.customer_id INNER JOIN countries co ON c.country_id = co.country_id INNER JOIN regions r ON co.region_id = r.region_id LEFT JOIN employees e ON o.sales_rep_id = e.employee_id LEFT JOIN departments d ON e.department_id = d.department_id WHERE o.order_date >= DATE '2026-01-01' ORDER BY o.order_id",
      },
      hint: 'Query này mới hiện tên gọi. Đề cần họ, tên đệm và tên gọi: ghép `first_name` với `last_name`, cách nhau một dấu cách.',
    },
  ],
};
