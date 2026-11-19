import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e1',
  chapter: 7,
  kind: 'rehearsal',
  title: 'Tăng giá topping thêm 1.000 đồng',
  prompt:
    'Tiệm tăng giá các món Topping thêm 1.000 đồng. Lệnh UPDATE trong editor đang thiếu WHERE. Thêm WHERE để chỉ đổi đúng các món Topping.',
  asks: [
    'Chỉ sửa table `products`.',
    'Column `price` tăng thêm 1000.',
    'Chỉ các món có `category` là Topping được đổi.',
  ],
  database: 'teashop',
  tables: ['products'],
  target: 'products',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'UPDATE products\nSET price = price + 1000',
    oracle: 'UPDATE products\nSET price = price + 1000',
  },
  solution: {
    mysql: "UPDATE products\nSET price = price + 1000\nWHERE category = 'Topping';",
    oracle: "UPDATE products\nSET price = price + 1000\nWHERE category = 'Topping';",
  },
  check: { orderMatters: false },
  why: "WHERE category = 'Topping' giữ lại các món Topping, nên chỉ những row đó được tăng giá. Các món khác giữ nguyên.",
  hints: {
    light: 'UPDATE không có WHERE sẽ đổi mọi row. Trước khi sửa, chạy SELECT với đúng WHERE đó để xem row nào sẽ đổi.',
    specific: 'Thêm WHERE sau SET. Điều kiện so sánh column `category` với chữ Topping, đặt trong dấu nháy đơn.',
    skeleton: {
      mysql: "UPDATE products\nSET price = price + 1000\nWHERE ____ = '____';",
      oracle: "UPDATE products\nSET price = price + 1000\nWHERE ____ = '____';",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'UPDATE products SET price = price + 1000',
        oracle: 'UPDATE products SET price = price + 1000',
      },
      hint: 'Mọi món đều bị tăng giá, kể cả Trà sữa và Cà phê. Lệnh còn thiếu WHERE. Chạy SELECT với WHERE đó trước, bạn sẽ thấy ngay số row nhiều hơn dự tính.',
    },
    {
      id: 'wrong-category',
      sql: {
        mysql: "UPDATE products SET price = price + 1000 WHERE category = 'Cà phê'",
        oracle: "UPDATE products SET price = price + 1000 WHERE category = 'Cà phê'",
      },
      hint: 'WHERE của bạn đúng cú pháp, nhưng đang chọn nhóm Cà phê. Đề bài cần nhóm Topping. Chạy SELECT với WHERE này trước sẽ cho bạn thấy các món sai ngay.',
    },
  ],
};
