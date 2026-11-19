import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c1-e6',
  chapter: 1,
  kind: 'write',
  title: 'Chạy câu SELECT đầu tiên',
  prompt: 'Câu SELECT đã có sẵn trong editor. Bấm Chạy để xem toàn bộ thực đơn của tiệm.',
  asks: [
    'Bấm Chạy, chưa cần sửa gì.',
    'Kết quả là mọi row của table `products`.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT * FROM products;',
    oracle: 'SELECT * FROM products;',
  },
  solution: {
    mysql: 'SELECT * FROM products;',
    oracle: 'SELECT * FROM products;',
  },
  check: { orderMatters: false },
  why: 'Dấu `*` lấy mọi column, và `FROM products` chọn table products. Bạn vừa gửi query đầu tiên.',
  hints: {
    light: 'Query đã viết sẵn cho bạn. Chỉ cần bấm Chạy.',
    specific: 'Nếu lỡ sửa, gõ lại đúng câu `SELECT * FROM products;`. Rồi bấm Chạy.',
    skeleton: {
      mysql: 'SELECT ____ FROM products;',
      oracle: 'SELECT ____ FROM products;',
    },
  },
  wrong: [
    {
      id: 'other-table',
      sql: {
        mysql: 'SELECT * FROM stores',
        oracle: 'SELECT * FROM stores',
      },
      hint: 'Query chạy tốt, nhưng table stores chứa các tiệm. Đề bài cần thực đơn. Đổi lại thành `FROM products`.',
    },
    {
      id: 'one-column',
      sql: {
        mysql: 'SELECT name FROM products',
        oracle: 'SELECT name FROM products',
      },
      hint: 'Bạn mới lấy một column là name. Muốn lấy mọi column, hãy thay `name` bằng dấu `*`.',
    },
  ],
};
