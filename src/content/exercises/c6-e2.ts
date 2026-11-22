import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e2',
  chapter: 6,
  kind: 'fill',
  title: 'Giá của nhóm Cà phê',
  prompt: 'Chủ tiệm muốn xem giá thấp nhất, cao nhất và trung bình của nhóm Cà phê. Điền các chỗ trống `____` để query chạy đúng.',
  asks: ['Giá thấp nhất, giá cao nhất và giá trung bình, mỗi giá một column.', 'Chỉ tính các món thuộc nhóm `Cà phê`.'],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT MIN(____) AS cheapest, ____(price) AS priciest, AVG(price) AS average\nFROM products\nWHERE category = ____;",
    oracle: "SELECT MIN(____) AS cheapest, ____(price) AS priciest, AVG(price) AS average\nFROM products\nWHERE category = ____;",
  },
  solution: {
    mysql: "SELECT MIN(price) AS cheapest, MAX(price) AS priciest, AVG(price) AS average\nFROM products\nWHERE category = 'Cà phê';",
    oracle: "SELECT MIN(price) AS cheapest, MAX(price) AS priciest, AVG(price) AS average\nFROM products\nWHERE category = 'Cà phê';",
  },
  check: { orderMatters: false },
  why: 'WHERE giữ lại các món Cà phê trước. Sau đó MIN, MAX, AVG tính trên các row còn lại.',
  hints: {
    light: 'MIN lấy giá trị nhỏ nhất, MAX lấy giá trị lớn nhất. Cả hai nhận một column làm đầu vào.',
    specific: 'Chỗ trống đầu là column `price`. Chỗ trống thứ hai là function lấy giá lớn nhất. Chỗ trống cuối là chữ `Cà phê` trong dấu nháy đơn.',
    skeleton: {
      mysql: "SELECT MIN(____) AS cheapest, ____(price) AS priciest, AVG(price) AS average\nFROM products\nWHERE category = ____;",
      oracle: "SELECT MIN(____) AS cheapest, ____(price) AS priciest, AVG(price) AS average\nFROM products\nWHERE category = ____;",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT MIN(price) AS cheapest, MAX(price) AS priciest, AVG(price) AS average FROM products',
        oracle: 'SELECT MIN(price) AS cheapest, MAX(price) AS priciest, AVG(price) AS average FROM products',
      },
      hint: 'Query đang tính trên cả thực đơn. Thêm WHERE category = \'Cà phê\' để chỉ tính nhóm Cà phê.',
    },
    {
      id: 'sum-not-avg',
      sql: {
        mysql: "SELECT MIN(price) AS cheapest, MAX(price) AS priciest, SUM(price) AS average FROM products WHERE category = 'Cà phê'",
        oracle: "SELECT MIN(price) AS cheapest, MAX(price) AS priciest, SUM(price) AS average FROM products WHERE category = 'Cà phê'",
      },
      hint: 'Column thứ ba đang là tổng giá. Giá trung bình cần AVG thay cho SUM.',
    },
  ],
};
