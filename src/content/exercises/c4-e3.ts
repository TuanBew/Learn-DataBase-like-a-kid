import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c4-e3',
  chapter: 4,
  kind: 'predict',
  title: 'Đoán món còn lại sau WHERE',
  prompt: 'Đọc query. Đoán món nào còn lại sau WHERE. Chọn các row đó, rồi xem Theater để kiểm.',
  asks: [
    'Chọn các row của table products sẽ còn lại.',
    'Nhớ rằng BETWEEN gồm cả hai đầu.',
    'Hai điều kiện nối bằng AND: row phải thỏa cả hai.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT *\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\n  AND price BETWEEN 10000 AND 30000;",
    oracle: "SELECT *\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\n  AND price BETWEEN 10000 AND 30000",
  },
  solution: {
    mysql: "SELECT *\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\n  AND price BETWEEN 10000 AND 30000;",
    oracle: "SELECT *\nFROM products\nWHERE category IN ('Cà phê', 'Topping')\n  AND price BETWEEN 10000 AND 30000",
  },
  check: { orderMatters: false },
  why: 'IN giữ món thuộc Cà phê hoặc Topping. BETWEEN giữ giá từ 10000 tới 30000, gồm cả hai đầu. AND bắt row thỏa cả hai điều kiện.',
  hints: {
    light: 'WHERE xét từng row một. Row thỏa điều kiện thì ở lại, row không thỏa thì bị loại.',
    specific: 'Lọc theo nhóm món trước: chỉ giữ Cà phê và Topping. Rồi xét giá: giữ món từ 10000 tới 30000, kể cả đúng 10000 và đúng 30000.',
    skeleton: {
      mysql: "SELECT *\nFROM products\nWHERE category IN (____, ____)\n  AND price BETWEEN ____ AND ____;",
      oracle: "SELECT *\nFROM products\nWHERE category IN (____, ____)\n  AND price BETWEEN ____ AND ____",
    },
  },
  wrong: [
    {
      id: 'open-range',
      sql: {
        mysql: "SELECT * FROM products WHERE category IN ('Cà phê', 'Topping') AND price > 10000 AND price < 30000",
        oracle: "SELECT * FROM products WHERE category IN ('Cà phê', 'Topping') AND price > 10000 AND price < 30000",
      },
      hint: 'BETWEEN gồm cả hai đầu, nên món giá đúng 10000 và đúng 30000 vẫn ở lại.',
    },
    {
      id: 'or',
      sql: {
        mysql: "SELECT * FROM products WHERE category IN ('Cà phê', 'Topping') OR price BETWEEN 10000 AND 30000",
        oracle: "SELECT * FROM products WHERE category IN ('Cà phê', 'Topping') OR price BETWEEN 10000 AND 30000",
      },
      hint: 'Query này dùng OR, nên chỉ cần thỏa một điều kiện. Query gốc dùng AND, row phải thỏa cả hai.',
    },
  ],
};
