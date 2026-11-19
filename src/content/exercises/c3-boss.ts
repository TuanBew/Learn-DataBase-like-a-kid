import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c3-boss',
  chapter: 3,
  kind: 'write',
  title: 'Boss: ba món đắt nhất ngoài Trà sữa',
  prompt:
    'Một khách không uống Trà sữa và chỉ có dưới 45.000 đồng. Tìm ba món đắt nhất hợp ý khách.',
  asks: [
    'Hiện ba column: `name`, `category`, `price`.',
    "Loại nhóm 'Trà sữa' và chỉ lấy món có `price` nhỏ hơn 45000.",
    'Món đắt hơn đứng trước, giá bằng nhau thì xếp theo `name`.',
    'Chỉ lấy 3 row đầu.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT name, category, price\nFROM products\n',
    oracle: 'SELECT name, category, price\nFROM products\n',
  },
  solution: {
    mysql:
      "SELECT name, category, price\nFROM products\nWHERE category <> 'Trà sữa'\n  AND price < 45000\nORDER BY price DESC, name\nLIMIT 3;",
    oracle:
      "SELECT name, category, price\nFROM products\nWHERE category <> 'Trà sữa'\n  AND price < 45000\nORDER BY price DESC, name\nFETCH FIRST 3 ROWS ONLY",
  },
  check: { orderMatters: true },
  why: 'WHERE giữ món ngoài Trà sữa và dưới 45.000 đồng. ORDER BY đặt món đắt lên trước. Bước cuối chỉ giữ 3 row đầu.',
  hints: {
    light: 'Bài này có bốn bước theo thứ tự viết. Chọn column, lọc row bằng hai điều kiện, sắp xếp, rồi lấy vài row đầu.',
    specific:
      "Nối hai điều kiện bằng AND: `category <> 'Trà sữa'` và `price < 45000`. Sắp bằng ORDER BY price DESC, name. MySQL lấy 3 row đầu bằng LIMIT, Oracle dùng FETCH FIRST.",
    skeleton: {
      mysql: "SELECT name, category, price\nFROM products\nWHERE category <> ____\n  AND price < ____\nORDER BY ____ DESC, name\nLIMIT ____;",
      oracle:
        "SELECT name, category, price\nFROM products\nWHERE category <> ____\n  AND price < ____\nORDER BY ____ DESC, name\nFETCH FIRST ____ ROWS ONLY",
    },
  },
  wrong: [
    {
      id: 'no-price',
      sql: {
        mysql: "SELECT name, category, price FROM products WHERE category <> 'Trà sữa' ORDER BY price DESC, name LIMIT 3",
        oracle:
          "SELECT name, category, price FROM products WHERE category <> 'Trà sữa' ORDER BY price DESC, name FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'Kết quả đang có món từ 45.000 đồng trở lên. Thêm điều kiện `price < 45000` bằng AND.',
    },
    {
      id: 'no-category',
      sql: {
        mysql: 'SELECT name, category, price FROM products WHERE price < 45000 ORDER BY price DESC, name LIMIT 3',
        oracle:
          'SELECT name, category, price FROM products WHERE price < 45000 ORDER BY price DESC, name FETCH FIRST 3 ROWS ONLY',
      },
      hint: "Giá lọc đúng rồi. Trà sữa vẫn còn trong kết quả. Thêm điều kiện `category <> 'Trà sữa'`.",
    },
    {
      id: 'lte',
      sql: {
        mysql:
          "SELECT name, category, price FROM products WHERE category <> 'Trà sữa' AND price <= 45000 ORDER BY price DESC, name LIMIT 3",
        oracle:
          "SELECT name, category, price FROM products WHERE category <> 'Trà sữa' AND price <= 45000 ORDER BY price DESC, name FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'Trà đào cam sả giá đúng 45.000 đồng đang lọt vào. Đề bài cần giá nhỏ hơn 45000, nên dùng `<` thay cho `<=`.',
    },
    {
      id: 'asc',
      sql: {
        mysql: "SELECT name, category, price FROM products WHERE category <> 'Trà sữa' AND price < 45000 ORDER BY price, name LIMIT 3",
        oracle:
          "SELECT name, category, price FROM products WHERE category <> 'Trà sữa' AND price < 45000 ORDER BY price, name FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'Query đang lấy ba món rẻ nhất. Thêm DESC sau price để món đắt đứng trước.',
    },
  ],
};
