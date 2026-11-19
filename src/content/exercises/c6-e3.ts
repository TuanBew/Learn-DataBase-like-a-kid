import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e3',
  chapter: 6,
  kind: 'write',
  title: 'Món chưa từng bán',
  prompt: 'Chủ tiệm nghi có món chưa ai gọi. Tìm các món trong `products` không xuất hiện trong `order_items`.',
  asks: [
    'Hiện `product_id` và `name`.',
    'Chỉ lấy món chưa có row nào trong `order_items`.',
    'Xếp theo `product_id` tăng dần.',
  ],
  database: 'teashop',
  tables: ['products', 'order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT p.product_id, p.name\nFROM products p\n',
    oracle: 'SELECT p.product_id, p.name\nFROM products p\n',
  },
  solution: {
    mysql: 'SELECT p.product_id, p.name\nFROM products p\nLEFT JOIN order_items oi ON p.product_id = oi.product_id\nWHERE oi.item_id IS NULL\nORDER BY p.product_id;',
    oracle: 'SELECT p.product_id, p.name\nFROM products p\nLEFT JOIN order_items oi ON p.product_id = oi.product_id\nWHERE oi.item_id IS NULL\nORDER BY p.product_id',
  },
  check: { orderMatters: true },
  why: 'LEFT JOIN giữ mọi món, món chưa bán có phần `order_items` là NULL. WHERE ... IS NULL giữ đúng các món đó.',
  hints: {
    light: 'Cần kiểu nối vẫn giữ lại row không có cặp. Row không có cặp sẽ mang NULL ở phía table bên phải.',
    specific: 'Nối `products` với `order_items` bằng LEFT JOIN. Sau đó lọc `oi.item_id IS NULL` để giữ các món không khớp.',
    skeleton: {
      mysql: 'SELECT p.product_id, p.name\nFROM products p\n____ JOIN order_items oi ON p.product_id = oi.product_id\nWHERE oi.item_id ____\nORDER BY p.product_id;',
      oracle: 'SELECT p.product_id, p.name\nFROM products p\n____ JOIN order_items oi ON p.product_id = oi.product_id\nWHERE oi.item_id ____\nORDER BY p.product_id',
    },
  },
  wrong: [
    {
      id: 'inner-join',
      sql: {
        mysql: 'SELECT p.product_id, p.name FROM products p INNER JOIN order_items oi ON p.product_id = oi.product_id WHERE oi.item_id IS NULL ORDER BY p.product_id',
        oracle: 'SELECT p.product_id, p.name FROM products p INNER JOIN order_items oi ON p.product_id = oi.product_id WHERE oi.item_id IS NULL ORDER BY p.product_id',
      },
      hint: 'INNER JOIN bỏ luôn các món không khớp, nên không còn món nào để kiểm. Đổi sang LEFT JOIN để giữ chúng lại.',
    },
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT p.product_id, p.name FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id ORDER BY p.product_id',
        oracle: 'SELECT p.product_id, p.name FROM products p LEFT JOIN order_items oi ON p.product_id = oi.product_id ORDER BY p.product_id',
      },
      hint: 'LEFT JOIN đã đúng. Bạn còn thiếu WHERE oi.item_id IS NULL để chỉ giữ món chưa bán.',
    },
  ],
};
