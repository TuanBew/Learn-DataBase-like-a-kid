import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c10-e4',
  chapter: 10,
  kind: 'write',
  title: 'Xem trước các món sắp bị đổi giá',
  prompt:
    "Đồng nghiệp gửi bạn lệnh `UPDATE products SET price = price - 5000 WHERE category = 'Trà trái cây' AND price >= 45000;`. Đừng chạy nó. Viết một SELECT với đúng WHERE đó để xem các món sẽ bị đổi giá.",
  asks: [
    'Chỉ đọc dữ liệu, không sửa gì.',
    'Hiện mọi column của `products`.',
    'Dùng đúng điều kiện WHERE của lệnh UPDATE.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT *\nFROM products\n',
    oracle: 'SELECT *\nFROM products\n',
  },
  solution: {
    mysql: "SELECT *\nFROM products\nWHERE category = 'Trà trái cây' AND price >= 45000;",
    oracle: "SELECT *\nFROM products\nWHERE category = 'Trà trái cây' AND price >= 45000;",
  },
  check: { orderMatters: false },
  why: 'SELECT dùng đúng WHERE của UPDATE nên cho thấy chính xác các row sẽ đổi. Số row đúng như bạn nghĩ thì mới đổi SELECT thành UPDATE.',
  hints: {
    light: 'Chép nguyên WHERE từ lệnh UPDATE sang SELECT. Không đổi gì trong điều kiện.',
    specific: 'Cần hai điều kiện nối bằng AND: `category` bằng Trà trái cây, và `price` từ 45000 trở lên.',
    skeleton: {
      mysql: "SELECT *\nFROM products\nWHERE category = '____' AND price >= ____;",
      oracle: "SELECT *\nFROM products\nWHERE category = '____' AND price >= ____;",
    },
  },
  wrong: [
    {
      id: 'no-category',
      sql: {
        mysql: 'SELECT * FROM products WHERE price >= 45000',
        oracle: 'SELECT * FROM products WHERE price >= 45000',
      },
      hint: 'Kết quả có cả Cà phê cacao đá xay, món không thuộc nhóm Trà trái cây. Thêm điều kiện category bằng AND.',
    },
    {
      id: 'strict-gt',
      sql: {
        mysql: "SELECT * FROM products WHERE category = 'Trà trái cây' AND price > 45000",
        oracle: "SELECT * FROM products WHERE category = 'Trà trái cây' AND price > 45000",
      },
      hint: 'Trà đào cam sả giá đúng 45000 đang bị bỏ sót. UPDATE dùng `>=`, nên SELECT cũng phải dùng `>=`.',
    },
    {
      id: 'or-instead',
      sql: {
        mysql: "SELECT * FROM products WHERE category = 'Trà trái cây' OR price >= 45000",
        oracle: "SELECT * FROM products WHERE category = 'Trà trái cây' OR price >= 45000",
      },
      hint: 'OR lấy row thỏa một trong hai điều kiện, nên kết quả nhiều hơn. UPDATE dùng AND, nên đổi OR thành AND.',
    },
  ],
};
