import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c10-e3',
  chapter: 10,
  kind: 'rehearsal',
  title: 'Thêm món Trà xoài vào thực đơn',
  prompt:
    'Tiệm ra mắt món mới. Dùng INSERT để thêm một row vào `products` với đủ 6 column.',
  asks: [
    'Mã món 15, tên Trà xoài, nhóm Trà trái cây.',
    'Giá 42000 đồng, 160 calo.',
    'Ngày ra mắt 2026-03-10.',
  ],
  database: 'teashop',
  tables: ['products'],
  target: 'products',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES ',
    oracle: 'INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES ',
  },
  solution: {
    mysql:
      "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà xoài', 'Trà trái cây', 42000, 160, '2026-03-10');",
    oracle:
      "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà xoài', 'Trà trái cây', 42000, 160, DATE '2026-03-10');",
  },
  check: { orderMatters: false },
  why: 'Danh sách column và danh sách giá trị khớp từng cặp, theo thứ tự. Chữ và ngày nằm trong dấu nháy đơn, số thì không.',
  hints: {
    light: 'INSERT cần hai danh sách cùng độ dài: tên column, rồi giá trị. Giá trị thứ nhất khớp column thứ nhất, và cứ thế tiếp.',
    specific: 'Điền 6 giá trị theo thứ tự product_id, name, category, price, calories, launched_on. Chữ đặt trong nháy đơn. Oracle viết ngày dạng DATE kèm chuỗi ngày.',
    skeleton: {
      mysql: "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (____, '____', '____', ____, ____, '____');",
      oracle: "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (____, '____', '____', ____, ____, DATE '____');",
    },
  },
  wrong: [
    {
      id: 'wrong-price',
      sql: {
        mysql: "INSERT INTO products (product_id, name, category, price, calories, launched_on) VALUES (15, 'Trà xoài', 'Trà trái cây', 4200, 160, '2026-03-10')",
        oracle: "INSERT INTO products (product_id, name, category, price, calories, launched_on) VALUES (15, 'Trà xoài', 'Trà trái cây', 4200, 160, DATE '2026-03-10')",
      },
      hint: 'Row đã vào table, nhưng giá là 4200. Đề bài cần 42000. Đếm lại số chữ số 0 nhé.',
    },
    {
      id: 'swapped',
      sql: {
        mysql: "INSERT INTO products (product_id, name, category, price, calories, launched_on) VALUES (15, 'Trà xoài', 'Trà trái cây', 160, 42000, '2026-03-10')",
        oracle: "INSERT INTO products (product_id, name, category, price, calories, launched_on) VALUES (15, 'Trà xoài', 'Trà trái cây', 160, 42000, DATE '2026-03-10')",
      },
      hint: 'Giá và calo đang đổi chỗ cho nhau. Giá trị phải đi đúng thứ tự column: price trước, calories sau.',
    },
  ],
};
