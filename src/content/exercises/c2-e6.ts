import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c2-e6',
  chapter: 2,
  kind: 'rehearsal',
  title: 'Thêm một món hợp lệ',
  prompt:
    'Tiệm ra món mới và mình canh cổng. Điền giá trị vào khung INSERT để thêm đúng một row vào bản sao của `products`.',
  asks: [
    'Mã món là 15. Mã này chưa ai dùng, nên primary key cho qua.',
    'Tên món là Trà dâu tằm, nhóm Trà trái cây.',
    'Giá 46000 và calo 160.',
    'Ngày ra mắt là 2026-03-10.',
  ],
  database: 'teashop',
  tables: ['products'],
  target: 'products',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql:
      "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (____, ____, ____, ____, ____, ____);",
    oracle:
      "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (____, ____, ____, ____, ____, ____)",
  },
  solution: {
    mysql:
      "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà dâu tằm', 'Trà trái cây', 46000, 160, '2026-03-10');",
    oracle:
      "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà dâu tằm', 'Trà trái cây', 46000, 160, DATE '2026-03-10')",
  },
  check: { orderMatters: false },
  why: 'Row mới có mã 15 chưa trùng, giá là số, và ngày đúng data type. Vì vậy cổng cho qua.',
  hints: {
    light: 'Thứ tự giá trị trong VALUES khớp thứ tự column ở trên. Chữ đặt trong dấu nháy đơn, số thì không.',
    specific:
      'Giá trị đầu là mã món 15. Tiếp theo là tên và nhóm, đều là chữ. Rồi tới giá, calo, và cuối cùng là ngày ra mắt.',
    skeleton: {
      mysql: "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, '____', '____', ____, ____, '____');",
      oracle:
        "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, '____', '____', ____, ____, DATE '____')",
    },
  },
  wrong: [
    {
      id: 'swap-price-calories',
      sql: {
        mysql:
          "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà dâu tằm', 'Trà trái cây', 160, 46000, '2026-03-10');",
        oracle:
          "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà dâu tằm', 'Trà trái cây', 160, 46000, DATE '2026-03-10')",
      },
      hint: 'Row đã vào được, nhưng giá và calo đang đổi chỗ nhau. Giá là 46000 và calo là 160, theo đúng thứ tự column.',
    },
    {
      id: 'missing-zero',
      sql: {
        mysql:
          "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà dâu tằm', 'Trà trái cây', 4600, 160, '2026-03-10');",
        oracle:
          "INSERT INTO products (product_id, name, category, price, calories, launched_on)\nVALUES (15, 'Trà dâu tằm', 'Trà trái cây', 4600, 160, DATE '2026-03-10')",
      },
      hint: 'Giá đang là 4600, thiếu một số 0. Đề bài cần giá 46000.',
    },
  ],
};
