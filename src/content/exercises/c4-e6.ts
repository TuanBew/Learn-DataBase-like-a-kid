import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c4-e6',
  chapter: 4,
  kind: 'debug',
  title: 'Sửa CASE WHEN thiếu một từ',
  prompt:
    'Query đang báo lỗi. Mình muốn gắn nhãn giá cho các món Topping và Trà sữa. Sửa query cho chạy đúng.',
  asks: [
    "Dưới 20000 là 'Rẻ', từ 20000 tới dưới 40000 là 'Vừa', còn lại là 'Đắt'.",
    'Đặt tên column nhãn là `price_level`.',
    "Chỉ lấy món thuộc nhóm 'Topping' và 'Trà sữa'.",
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql:
      "SELECT name, price,\n  CASE WHEN price < 20000 THEN 'Rẻ'\n       WHEN price < 40000 THEN 'Vừa'\n       ELSE 'Đắt' AS price_level\nFROM products\nWHERE category IN ('Topping', 'Trà sữa');",
    oracle:
      "SELECT name, price,\n  CASE WHEN price < 20000 THEN 'Rẻ'\n       WHEN price < 40000 THEN 'Vừa'\n       ELSE 'Đắt' AS price_level\nFROM products\nWHERE category IN ('Topping', 'Trà sữa')",
  },
  solution: {
    mysql:
      "SELECT name, price,\n  CASE WHEN price < 20000 THEN 'Rẻ'\n       WHEN price < 40000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Topping', 'Trà sữa');",
    oracle:
      "SELECT name, price,\n  CASE WHEN price < 20000 THEN 'Rẻ'\n       WHEN price < 40000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Topping', 'Trà sữa')",
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'Mỗi CASE phải kết thúc bằng END. Sau END mới tới alias price_level.',
  hints: {
    light: 'CASE WHEN là một khối có điểm bắt đầu và điểm kết thúc. Kiểm tra khối đó đã đóng chưa.',
    specific: 'Sau ELSE thiếu từ END. Thêm END ngay trước AS price_level.',
    skeleton: {
      mysql:
        "SELECT name, price,\n  CASE WHEN price < 20000 THEN 'Rẻ'\n       WHEN price < 40000 THEN 'Vừa'\n       ELSE 'Đắt' ____ AS price_level\nFROM products\nWHERE category IN ('Topping', 'Trà sữa');",
      oracle:
        "SELECT name, price,\n  CASE WHEN price < 20000 THEN 'Rẻ'\n       WHEN price < 40000 THEN 'Vừa'\n       ELSE 'Đắt' ____ AS price_level\nFROM products\nWHERE category IN ('Topping', 'Trà sữa')",
    },
  },
  wrong: [
    {
      id: 'no-else',
      sql: {
        mysql:
          "SELECT name, price, CASE WHEN price < 20000 THEN 'Rẻ' WHEN price < 40000 THEN 'Vừa' END AS price_level FROM products WHERE category IN ('Topping', 'Trà sữa')",
        oracle:
          "SELECT name, price, CASE WHEN price < 20000 THEN 'Rẻ' WHEN price < 40000 THEN 'Vừa' END AS price_level FROM products WHERE category IN ('Topping', 'Trà sữa')",
      },
      hint: "Query chạy được rồi. Món 42000 đồng đang ra NULL, vì CASE không có ELSE. Thêm ELSE 'Đắt' trước END.",
    },
    {
      id: 'wrong-order',
      sql: {
        mysql:
          "SELECT name, price, CASE WHEN price < 40000 THEN 'Vừa' WHEN price < 20000 THEN 'Rẻ' ELSE 'Đắt' END AS price_level FROM products WHERE category IN ('Topping', 'Trà sữa')",
        oracle:
          "SELECT name, price, CASE WHEN price < 40000 THEN 'Vừa' WHEN price < 20000 THEN 'Rẻ' ELSE 'Đắt' END AS price_level FROM products WHERE category IN ('Topping', 'Trà sữa')",
      },
      hint: 'CASE dừng ở nhánh WHEN đầu tiên đúng. Món rẻ cũng nhỏ hơn 40000, nên đang bị gắn Vừa. Đặt nhánh nhỏ nhất lên đầu.',
    },
  ],
};
