import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-boss',
  chapter: 6,
  kind: 'write',
  title: 'Boss: ba món bán chạy ở Quận 1',
  prompt: 'Chủ chuỗi muốn biết ba món có doanh thu cao nhất ở tiệm Quận 1 (`store_id` là 3). Chỉ tính đơn đã hoàn tất. Cần nối `orders`, `order_items` và `products`.',
  asks: [
    'Hiện tên món `name` và doanh thu, đặt tên column doanh thu là `revenue`.',
    'Chỉ tính đơn `done` của tiệm có `store_id` bằng 3.',
    'Doanh thu là tổng `quantity * unit_price`, mỗi món một row, doanh thu cao đứng trước.',
    'Chỉ lấy 3 row đầu.',
  ],
  database: 'teashop-big',
  tables: ['orders', 'order_items', 'products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\n',
    oracle: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\n',
  },
  solution: {
    mysql: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = 'done' AND o.store_id = 3\nGROUP BY p.name\nORDER BY revenue DESC, p.name\nLIMIT 3;",
    oracle: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = 'done' AND o.store_id = 3\nGROUP BY p.name\nORDER BY revenue DESC, p.name\nFETCH FIRST 3 ROWS ONLY;",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Hai JOIN đưa tên món vào cạnh từng row món. WHERE chọn đơn done của tiệm 3, GROUP BY gom theo món, rồi ORDER BY và LIMIT (hoặc FETCH FIRST) giữ ba món đứng đầu.',
  hints: {
    light: 'Làm theo thứ tự: nối ba table, lọc row, gom theo món, sắp xếp, rồi lấy 3 row đầu.',
    specific: "Nối `order_items` bằng `o.order_id = oi.order_id`, nối `products` bằng `oi.product_id = p.product_id`. WHERE có hai điều kiện nối bằng AND: `o.status = 'done'` và `o.store_id = 3`. MySQL lấy 3 row bằng LIMIT, Oracle dùng FETCH FIRST.",
    skeleton: {
      mysql: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.____\nINNER JOIN products p ON oi.product_id = p.____\nWHERE o.status = ____ AND o.store_id = ____\nGROUP BY ____\nORDER BY revenue DESC, p.name\nLIMIT ____;",
      oracle: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.____\nINNER JOIN products p ON oi.product_id = p.____\nWHERE o.status = ____ AND o.store_id = ____\nGROUP BY ____\nORDER BY revenue DESC, p.name\nFETCH FIRST ____ ROWS ONLY;",
    },
  },
  wrong: [
    {
      id: 'no-status',
      sql: {
        mysql: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.store_id = 3 GROUP BY p.name ORDER BY revenue DESC, p.name LIMIT 3',
        oracle: 'SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.store_id = 3 GROUP BY p.name ORDER BY revenue DESC, p.name FETCH FIRST 3 ROWS ONLY',
      },
      hint: "Ba món đã đúng, nhưng doanh thu đang cộng cả đơn cancelled. Thêm điều kiện o.status = 'done' vào WHERE.",
    },
    {
      id: 'no-store',
      sql: {
        mysql: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.status = 'done' GROUP BY p.name ORDER BY revenue DESC, p.name LIMIT 3",
        oracle: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.status = 'done' GROUP BY p.name ORDER BY revenue DESC, p.name FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'Query đang tính cho cả chuỗi tiệm. Thêm AND o.store_id = 3 vào WHERE để chỉ tính tiệm Quận 1.',
    },
    {
      id: 'asc',
      sql: {
        mysql: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.status = 'done' AND o.store_id = 3 GROUP BY p.name ORDER BY revenue, p.name LIMIT 3",
        oracle: "SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.status = 'done' AND o.store_id = 3 GROUP BY p.name ORDER BY revenue, p.name FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'ORDER BY mặc định xếp từ nhỏ lên lớn, nên bạn đang lấy ba món thấp nhất. Thêm DESC sau `revenue`.',
    },
  ],
};
