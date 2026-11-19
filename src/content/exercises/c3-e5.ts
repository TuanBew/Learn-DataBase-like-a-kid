import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c3-e5',
  chapter: 3,
  kind: 'debug',
  title: 'Sửa clause đứng sai chỗ',
  prompt: 'Query đang báo lỗi. Mình muốn xem các món Cà phê, món đắt đứng trước. Sửa query cho chạy đúng.',
  asks: ['Chỉ hiện `name` và `price`.', "Chỉ lấy món có `category` là 'Cà phê'.", 'Món đắt hơn đứng trước.'],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT name, price\nFROM products\nORDER BY price DESC\nWHERE category = 'Cà phê';",
    oracle: "SELECT name, price\nFROM products\nORDER BY price DESC\nWHERE category = 'Cà phê'",
  },
  solution: {
    mysql: "SELECT name, price\nFROM products\nWHERE category = 'Cà phê'\nORDER BY price DESC;",
    oracle: "SELECT name, price\nFROM products\nWHERE category = 'Cà phê'\nORDER BY price DESC",
  },
  check: { orderMatters: true },
  why: 'WHERE phải đứng trước ORDER BY. Database lọc row trước, rồi mới sắp xếp những row còn lại.',
  hints: {
    light: 'Mỗi clause có chỗ đứng cố định. Thứ tự viết là SELECT, FROM, WHERE, ORDER BY.',
    specific: 'Clause WHERE đang đứng sau ORDER BY. Chuyển WHERE lên ngay dưới FROM.',
    skeleton: {
      mysql: "SELECT name, price\nFROM products\n____ category = 'Cà phê'\n____ price DESC;",
      oracle: "SELECT name, price\nFROM products\n____ category = 'Cà phê'\n____ price DESC",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT name, price FROM products ORDER BY price DESC',
        oracle: 'SELECT name, price FROM products ORDER BY price DESC',
      },
      hint: 'Query chạy được rồi. Kết quả còn lẫn món ngoài nhóm Cà phê, vì chưa có WHERE.',
    },
    {
      id: 'asc',
      sql: {
        mysql: "SELECT name, price FROM products WHERE category = 'Cà phê' ORDER BY price",
        oracle: "SELECT name, price FROM products WHERE category = 'Cà phê' ORDER BY price",
      },
      hint: 'Lọc đúng rồi. Thứ tự đang là rẻ trước, còn đề bài cần đắt trước. Thêm DESC sau price.',
    },
  ],
};
