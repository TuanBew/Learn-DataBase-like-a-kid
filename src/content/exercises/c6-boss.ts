import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-boss',
  chapter: 6,
  kind: 'write',
  title: 'Boss: ba nhóm doanh thu lớn nhất',
  prompt: 'Chủ chuỗi muốn biết ba cặp (tiệm, cách trả tiền) có doanh thu cao nhất tháng 3. Chỉ tính đơn đã hoàn tất. Phần FROM và JOIN đã có sẵn.',
  asks: [
    'Hiện `store_id`, `payment` và doanh thu, đặt tên column doanh thu là `revenue`.',
    'Doanh thu là tổng `quantity * unit_price`, chỉ tính đơn `done`.',
    'Mỗi cặp tiệm và cách trả tiền một row, doanh thu cao đứng trước. Doanh thu bằng nhau thì `store_id` nhỏ đứng trước.',
    'Chỉ lấy 3 row đầu.',
  ],
  database: 'teashop-big',
  tables: ['orders', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\n',
    oracle: 'SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\n',
  },
  solution: {
    mysql: "SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = 'done'\nGROUP BY o.store_id, o.payment\nORDER BY revenue DESC, o.store_id\nLIMIT 3;",
    oracle: "SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = 'done'\nGROUP BY o.store_id, o.payment\nORDER BY revenue DESC, o.store_id\nFETCH FIRST 3 ROWS ONLY;",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'WHERE bỏ đơn cancelled, GROUP BY chia theo hai column, SUM cộng doanh thu từng nhóm. ORDER BY và LIMIT (hoặc FETCH FIRST) giữ ba nhóm đứng đầu.',
  hints: {
    light: 'Bài này dùng đủ các bước: lọc row, gom nhóm, sắp xếp rồi lấy vài row đầu. Mỗi nhóm là một cặp tiệm và cách trả tiền.',
    specific: "WHERE o.status = 'done' bỏ đơn cancelled. GROUP BY cần cả hai column `o.store_id` và `o.payment`. Doanh thu cao đứng trước nên ORDER BY revenue DESC. MySQL lấy 3 row bằng LIMIT, Oracle dùng FETCH FIRST.",
    skeleton: {
      mysql: "SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = ____\nGROUP BY ____, ____\nORDER BY ____ DESC, o.store_id\nLIMIT ____;",
      oracle: "SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue\nFROM order_items oi\nINNER JOIN orders o ON oi.order_id = o.order_id\nWHERE o.status = ____\nGROUP BY ____, ____\nORDER BY ____ DESC, o.store_id\nFETCH FIRST ____ ROWS ONLY;",
    },
  },
  wrong: [
    {
      id: 'no-status',
      sql: {
        mysql: 'SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id GROUP BY o.store_id, o.payment ORDER BY revenue DESC, o.store_id LIMIT 3',
        oracle: 'SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id GROUP BY o.store_id, o.payment ORDER BY revenue DESC, o.store_id FETCH FIRST 3 ROWS ONLY',
      },
      hint: "Ba nhóm đã đúng, nhưng doanh thu đang cộng cả đơn cancelled. Thêm WHERE o.status = 'done' trước GROUP BY.",
    },
    {
      id: 'asc',
      sql: {
        mysql: "SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' GROUP BY o.store_id, o.payment ORDER BY revenue, o.store_id LIMIT 3",
        oracle: "SELECT o.store_id, o.payment, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' GROUP BY o.store_id, o.payment ORDER BY revenue, o.store_id FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'ORDER BY mặc định xếp từ nhỏ lên lớn, nên bạn đang lấy ba nhóm thấp nhất. Thêm DESC sau `revenue`.',
    },
    {
      id: 'group-store-only',
      sql: {
        mysql: "SELECT o.store_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' GROUP BY o.store_id ORDER BY revenue DESC LIMIT 3",
        oracle: "SELECT o.store_id, SUM(oi.quantity * oi.unit_price) AS revenue FROM order_items oi INNER JOIN orders o ON oi.order_id = o.order_id WHERE o.status = 'done' GROUP BY o.store_id ORDER BY revenue DESC FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'Query này gom theo tiệm, chưa tách theo cách trả tiền. Thêm `o.payment` vào SELECT và GROUP BY.',
    },
  ],
};
