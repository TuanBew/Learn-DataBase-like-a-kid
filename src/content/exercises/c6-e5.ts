import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e5',
  chapter: 6,
  kind: 'write',
  title: 'Số ly bán ra theo nhóm món',
  prompt: 'Chủ tiệm muốn so các nhóm món với nhau. Cộng số lượng đã bán của mỗi nhóm, chỉ tính đơn hoàn tất. Cần nối ba table, phần FROM và JOIN đã có sẵn.',
  asks: [
    'Hiện `category` và tổng số lượng, đặt tên column tổng là `qty`.',
    'Chỉ tính đơn có `status` là `done`.',
    'Mỗi nhóm món một row, nhóm bán nhiều nhất đứng trước.',
  ],
  database: 'teashop',
  tables: ['orders', 'order_items', 'products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT p.category, SUM(oi.quantity) AS qty\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\n',
    oracle: 'SELECT p.category, SUM(oi.quantity) AS qty\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\n',
  },
  solution: {
    mysql: "SELECT p.category, SUM(oi.quantity) AS qty\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = 'done'\nGROUP BY p.category\nORDER BY qty DESC;",
    oracle: "SELECT p.category, SUM(oi.quantity) AS qty\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = 'done'\nGROUP BY p.category\nORDER BY qty DESC;",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Hai JOIN nối đơn, row món và món vào một chuỗi row. WHERE bỏ đơn cancelled, rồi GROUP BY gom theo nhóm món và SUM cộng số lượng.',
  hints: {
    light: 'Nối xong ba table thì mới gom nhóm. Thứ tự trong query: FROM và JOIN, WHERE, GROUP BY, ORDER BY.',
    specific: "Lọc đơn cancelled bằng WHERE o.status = 'done'. Gom theo column `p.category`. Xếp bằng ORDER BY qty DESC.",
    skeleton: {
      mysql: "SELECT p.category, SUM(oi.quantity) AS qty\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = ____\nGROUP BY ____\nORDER BY ____ DESC;",
      oracle: "SELECT p.category, SUM(oi.quantity) AS qty\nFROM orders o\nINNER JOIN order_items oi ON o.order_id = oi.order_id\nINNER JOIN products p ON oi.product_id = p.product_id\nWHERE o.status = ____\nGROUP BY ____\nORDER BY ____ DESC;",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT p.category, SUM(oi.quantity) AS qty FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id GROUP BY p.category ORDER BY qty DESC',
        oracle: 'SELECT p.category, SUM(oi.quantity) AS qty FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id GROUP BY p.category ORDER BY qty DESC',
      },
      hint: "Số lượng đang cộng cả đơn cancelled. Thêm WHERE o.status = 'done' trước GROUP BY.",
    },
    {
      id: 'count-not-sum',
      sql: {
        mysql: "SELECT p.category, COUNT(*) AS qty FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.status = 'done' GROUP BY p.category ORDER BY qty DESC",
        oracle: "SELECT p.category, COUNT(*) AS qty FROM orders o INNER JOIN order_items oi ON o.order_id = oi.order_id INNER JOIN products p ON oi.product_id = p.product_id WHERE o.status = 'done' GROUP BY p.category ORDER BY qty DESC",
      },
      hint: '`COUNT(*)` đếm số row món, không đếm số ly. Một row có thể gọi 2 hoặc 3 ly, nên dùng `SUM(oi.quantity)`.',
    },
  ],
};
