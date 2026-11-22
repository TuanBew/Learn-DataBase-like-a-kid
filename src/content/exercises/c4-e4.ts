import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c4-e4',
  chapter: 4,
  kind: 'order',
  title: 'Xếp query theo đúng thứ tự viết',
  prompt: 'Mình cần danh sách món giá từ 25.000 tới 40.000 đồng, món đắt đứng trước. Bấm các mẩu theo đúng thứ tự viết của query.',
  asks: [
    'Hiện `name` và `price`.',
    'Giữ món có `price` từ 25000 tới 40000.',
    'Món đắt hơn đứng trước, giá bằng nhau thì xếp theo `name`.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: '', oracle: '' },
  pieces: {
    mysql: ['SELECT name, price', 'FROM products', 'WHERE price BETWEEN 25000 AND 40000', 'ORDER BY price DESC, name'],
    oracle: ['SELECT name, price', 'FROM products', 'WHERE price BETWEEN 25000 AND 40000', 'ORDER BY price DESC, name'],
  },
  solution: {
    mysql: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 25000 AND 40000\nORDER BY price DESC, name',
    oracle: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 25000 AND 40000\nORDER BY price DESC, name',
  },
  check: { orderMatters: true },
  why: 'Thứ tự viết là SELECT, FROM, WHERE, ORDER BY. WHERE lọc row trước, ORDER BY xếp những row còn lại.',
  hints: {
    light: 'Query luôn bắt đầu bằng SELECT. Clause lọc đứng trước clause sắp xếp.',
    specific: 'Thứ tự đúng: SELECT, FROM, WHERE, ORDER BY. ORDER BY luôn đứng cuối.',
    skeleton: {
      mysql: 'SELECT ____\nFROM ____\nWHERE ____\nORDER BY ____',
      oracle: 'SELECT ____\nFROM ____\nWHERE ____\nORDER BY ____',
    },
  },
  wrong: [
    {
      id: 'no-order',
      sql: {
        mysql: 'SELECT name, price FROM products WHERE price BETWEEN 25000 AND 40000',
        oracle: 'SELECT name, price FROM products WHERE price BETWEEN 25000 AND 40000',
      },
      hint: 'Thiếu ORDER BY, nên món chưa được xếp theo giá. Thêm mẩu ORDER BY vào cuối.',
    },
    {
      id: 'asc',
      sql: {
        mysql: 'SELECT name, price FROM products WHERE price BETWEEN 25000 AND 40000 ORDER BY price, name',
        oracle: 'SELECT name, price FROM products WHERE price BETWEEN 25000 AND 40000 ORDER BY price, name',
      },
      hint: 'Mặc định ORDER BY xếp giá nhỏ lên trước. Thêm DESC sau price để món đắt đứng trước.',
    },
  ],
};
