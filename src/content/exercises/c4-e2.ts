import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c4-e2',
  chapter: 4,
  kind: 'fill',
  title: 'Mỗi calo tốn bao nhiêu đồng',
  prompt: 'Bi muốn so giá các món Trà sữa theo calo. Điền vào chỗ trống `____` để chia giá cho calo, làm tròn thành số nguyên.',
  asks: [
    'Chia `price` cho `calories`.',
    'Làm tròn kết quả, không giữ chữ số thập phân.',
    'Đặt tên column là `dong_per_calo`.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT name, calories, ROUND(price / ____, ____) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
    oracle: "SELECT name, calories, ROUND(price / ____, ____) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
  },
  solution: {
    mysql: "SELECT name, calories, ROUND(price / calories, 0) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
    oracle: "SELECT name, calories, ROUND(price / calories, 0) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'ROUND nhận hai thứ: phép tính cần làm tròn và số chữ số thập phân giữ lại. Số 0 nghĩa là chỉ giữ số nguyên.',
  hints: {
    light: 'ROUND(biểu thức, n) làm tròn biểu thức, giữ n chữ số sau dấu phẩy.',
    specific: 'Chỗ trống đầu là column đứng sau dấu chia: calories. Chỗ trống thứ hai là số chữ số thập phân cần giữ. Bài này giữ 0.',
    skeleton: {
      mysql: "SELECT name, calories, ROUND(price / ____, ____) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
      oracle: "SELECT name, calories, ROUND(price / ____, ____) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
    },
  },
  wrong: [
    {
      id: 'one-digit',
      sql: {
        mysql: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo FROM products WHERE category = 'Trà sữa'",
        oracle: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo FROM products WHERE category = 'Trà sữa'",
      },
      hint: 'Số 1 giữ lại một chữ số thập phân. Đề bài cần số nguyên, nên điền 0.',
    },
    {
      id: 'no-round',
      sql: {
        mysql: "SELECT name, calories, price / calories AS dong_per_calo FROM products WHERE category = 'Trà sữa'",
        oracle: "SELECT name, calories, price / calories AS dong_per_calo FROM products WHERE category = 'Trà sữa'",
      },
      hint: 'Phép chia đúng, nhưng kết quả còn dài chữ số thập phân. Bọc phép chia trong ROUND.',
    },
  ],
};
