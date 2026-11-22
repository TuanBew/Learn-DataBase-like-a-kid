import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e1',
  chapter: 5,
  kind: 'write',
  title: 'Thành tiền của từng món trong đơn 1009',
  prompt: 'Thu ngân cần biết mỗi món trong đơn 1009 thu về bao nhiêu tiền. Tính thành tiền bằng số lượng nhân đơn giá.',
  asks: [
    'Hiện bốn column: `product_id`, `quantity`, `unit_price` và `line_total`.',
    'Column `line_total` bằng `quantity` nhân `unit_price`.',
    'Chỉ lấy row của đơn có `order_id` là 1009.',
  ],
  database: 'teashop',
  tables: ['order_items'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT product_id, quantity, unit_price\nFROM order_items\n',
    oracle: 'SELECT product_id, quantity, unit_price\nFROM order_items\n',
  },
  solution: {
    mysql:
      'SELECT product_id, quantity, unit_price, quantity * unit_price AS line_total\nFROM order_items\nWHERE order_id = 1009;',
    oracle:
      'SELECT product_id, quantity, unit_price, quantity * unit_price AS line_total\nFROM order_items\nWHERE order_id = 1009',
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'Phép nhân chạy trên từng row của đơn 1009. AS đặt tên line_total cho column mới. WHERE giữ đúng đơn cần xem.',
  hints: {
    light: 'Một phép tính đứng được cạnh các column trong SELECT. AS đặt tên cho kết quả.',
    specific: 'Thêm `quantity * unit_price AS line_total` vào cuối danh sách SELECT. Rồi thêm WHERE order_id = 1009.',
    skeleton: {
      mysql: 'SELECT product_id, quantity, unit_price, ____ * ____ AS ____\nFROM order_items\nWHERE ____ = 1009;',
      oracle: 'SELECT product_id, quantity, unit_price, ____ * ____ AS ____\nFROM order_items\nWHERE ____ = 1009',
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT product_id, quantity, unit_price, quantity * unit_price AS line_total FROM order_items',
        oracle: 'SELECT product_id, quantity, unit_price, quantity * unit_price AS line_total FROM order_items',
      },
      hint: 'Phép tính đúng rồi. Kết quả đang có món của mọi đơn, vì chưa có WHERE order_id = 1009.',
    },
    {
      id: 'plus',
      sql: {
        mysql:
          'SELECT product_id, quantity, unit_price, quantity + unit_price AS line_total FROM order_items WHERE order_id = 1009',
        oracle:
          'SELECT product_id, quantity, unit_price, quantity + unit_price AS line_total FROM order_items WHERE order_id = 1009',
      },
      hint: 'Dấu `+` đang cộng số lượng với đơn giá. Thành tiền là phép nhân, đổi thành dấu `*`.',
    },
    {
      id: 'price-only',
      sql: {
        mysql: 'SELECT product_id, quantity, unit_price, unit_price AS line_total FROM order_items WHERE order_id = 1009',
        oracle: 'SELECT product_id, quantity, unit_price, unit_price AS line_total FROM order_items WHERE order_id = 1009',
      },
      hint: 'Column line_total đang chỉ là đơn giá. Món nào mua hai ly thì thiếu một nửa. Nhân thêm với quantity.',
    },
  ],
};
