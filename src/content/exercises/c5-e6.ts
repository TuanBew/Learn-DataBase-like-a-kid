import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e6',
  chapter: 5,
  kind: 'write',
  title: 'Món bán được trên 1 triệu đồng',
  prompt: 'Cuối tháng 3, chủ tiệm muốn biết món nào mang về từ 1.000.000 đồng doanh thu. Chỉ tính đơn đã hoàn tất, bỏ đơn `cancelled`. Phần FROM và JOIN đã có sẵn.',
  asks: [
    'Hiện `product_id` và doanh thu, đặt tên column doanh thu là `revenue`.',
    'Doanh thu là tổng `quantity * unit_price`, chỉ tính đơn `done`.',
    'Chỉ giữ món có doanh thu từ 1000000 trở lên.',
    'Món doanh thu cao đứng trước.',
  ],
  database: 'teashop-big',
  tables: ['orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\n',
    oracle: 'SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\n',
  },
  solution: {
    mysql: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = 'done'\nGROUP BY oi.product_id\nHAVING SUM(oi.quantity * oi.unit_price) >= 1000000\nORDER BY revenue DESC;",
    oracle: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = 'done'\nGROUP BY oi.product_id\nHAVING SUM(oi.quantity * oi.unit_price) >= 1000000\nORDER BY revenue DESC;",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'WHERE bỏ đơn cancelled trước khi gom. HAVING giữ các món có tổng từ 1 triệu, vì chỉ sau khi gom mới biết tổng của mỗi món.',
  hints: {
    light: 'Có hai bước lọc khác nhau. Một bước lọc row trước khi gom, một bước lọc nhóm sau khi gom.',
    specific: "Bỏ đơn cancelled bằng WHERE o.status = 'done'. Lọc theo tổng doanh thu cần HAVING, vì function gom không đứng được trong WHERE.",
    skeleton: {
      mysql: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = ____\nGROUP BY ____\nHAVING SUM(oi.quantity * oi.unit_price) >= ____\nORDER BY ____ DESC;",
      oracle: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = ____\nGROUP BY ____\nHAVING SUM(oi.quantity * oi.unit_price) >= ____\nORDER BY ____ DESC;",
    },
  },
  wrong: [
    {
      id: 'no-having',
      sql: {
        mysql: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' GROUP BY oi.product_id ORDER BY revenue DESC",
        oracle: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' GROUP BY oi.product_id ORDER BY revenue DESC",
      },
      hint: 'Doanh thu từng món đã đúng. Query còn thiếu HAVING để chỉ giữ món từ 1.000.000 đồng.',
    },
    {
      id: 'no-status',
      sql: {
        mysql: 'SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id GROUP BY oi.product_id HAVING SUM(oi.quantity * oi.unit_price) >= 1000000 ORDER BY revenue DESC',
        oracle: 'SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id GROUP BY oi.product_id HAVING SUM(oi.quantity * oi.unit_price) >= 1000000 ORDER BY revenue DESC',
      },
      hint: "Doanh thu đang tính cả đơn cancelled nên cao hơn thực tế. Thêm WHERE o.status = 'done' trước GROUP BY.",
    },
    {
      id: 'where-on-row',
      sql: {
        mysql: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' AND oi.quantity * oi.unit_price >= 100000 GROUP BY oi.product_id ORDER BY revenue DESC",
        oracle: "SELECT oi.product_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' AND oi.quantity * oi.unit_price >= 100000 GROUP BY oi.product_id ORDER BY revenue DESC",
      },
      hint: 'WHERE lọc từng row trước khi gom, nên nó cắt bớt các row nhỏ chứ chưa lọc theo tổng. Lọc theo tổng doanh thu của món cần HAVING.',
    },
  ],
};
