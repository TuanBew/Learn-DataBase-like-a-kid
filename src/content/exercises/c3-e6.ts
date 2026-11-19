import type { SqlExercise } from '../types';

/** Bài mẫu của khuôn bài tập. Các bài khác viết theo đúng cấu trúc này. */
export const exercise: SqlExercise = {
  id: 'c3-e6',
  chapter: 3,
  kind: 'write',
  title: 'Ba món rẻ nhất trên 30.000 đồng',
  prompt:
    'Khách có hơn 30.000 đồng và muốn tiết kiệm. Tìm ba món rẻ nhất trong các món có giá **lớn hơn** 30.000 đồng.',
  asks: [
    'Chỉ hiện hai column: `name` và `price`.',
    'Chỉ lấy món có `price` lớn hơn 30000.',
    'Món rẻ hơn đứng trước.',
    'Chỉ lấy 3 row đầu.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT name, price\nFROM products\n',
    oracle: 'SELECT name, price\nFROM products\n',
  },
  solution: {
    mysql: 'SELECT name, price\nFROM products\nWHERE price > 30000\nORDER BY price\nLIMIT 3;',
    oracle: 'SELECT name, price\nFROM products\nWHERE price > 30000\nORDER BY price\nFETCH FIRST 3 ROWS ONLY;',
  },
  check: { orderMatters: true },
  why: 'WHERE loại các món từ 30.000 đồng trở xuống. ORDER BY xếp món rẻ lên trước. Bước cuối chỉ giữ 3 row đầu.',
  hints: {
    light: 'Bài này cần ba bước theo thứ tự: lọc row, sắp xếp, rồi lấy vài row đầu.',
    specific: 'Lọc bằng WHERE với dấu `>`. Sắp bằng ORDER BY price. MySQL lấy 3 row đầu bằng LIMIT, Oracle dùng FETCH FIRST.',
    skeleton: {
      mysql: 'SELECT name, price\nFROM products\nWHERE price > ____\nORDER BY ____\nLIMIT ____;',
      oracle: 'SELECT name, price\nFROM products\nWHERE price > ____\nORDER BY ____\nFETCH FIRST ____ ROWS ONLY;',
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT name, price FROM products ORDER BY price LIMIT 3',
        oracle: 'SELECT name, price FROM products ORDER BY price FETCH FIRST 3 ROWS ONLY',
      },
      hint: 'Kết quả đang có cả món dưới 30.000 đồng. Query còn thiếu WHERE để lọc giá.',
    },
    {
      id: 'gte',
      sql: {
        mysql: 'SELECT name, price FROM products WHERE price >= 30000 ORDER BY price LIMIT 3',
        oracle: 'SELECT name, price FROM products WHERE price >= 30000 ORDER BY price FETCH FIRST 3 ROWS ONLY',
      },
      hint: 'Cà phê muối giá đúng 30.000 đồng đang lọt vào. Đề bài cần giá lớn hơn 30.000, nên dùng `>` thay cho `>=`.',
    },
    {
      id: 'no-order',
      sql: {
        mysql: 'SELECT name, price FROM products WHERE price > 30000 LIMIT 3',
        oracle: 'SELECT name, price FROM products WHERE price > 30000 FETCH FIRST 3 ROWS ONLY',
      },
      hint: 'Bạn đã lọc đúng và lấy đúng 3 row. Nhưng chưa có ORDER BY, nên 3 row này chưa chắc là 3 món rẻ nhất.',
    },
    {
      id: 'desc',
      sql: {
        mysql: 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price DESC LIMIT 3',
        oracle: 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price DESC FETCH FIRST 3 ROWS ONLY',
      },
      hint: 'DESC xếp món đắt lên trước, nên bạn đang lấy 3 món đắt nhất. Bỏ DESC để món rẻ đứng trước.',
    },
    {
      id: 'no-limit',
      sql: {
        mysql: 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price',
        oracle: 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price',
      },
      hint: 'Lọc và sắp xếp đều đúng rồi. Chỉ còn thiếu bước lấy 3 row đầu.',
    },
  ],
};
