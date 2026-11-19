import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c4-boss',
  chapter: 4,
  kind: 'write',
  title: 'Boss: thẻ thực đơn cho Cà phê và Trà trái cây',
  prompt:
    'Mình in thẻ thực đơn cho các món Cà phê và Trà trái cây. Mỗi thẻ cần tên kèm nhóm, giá tính bằng nghìn đồng, nhãn giá và calo.',
  asks: [
    "Column `label`: tên món, dấu cách, rồi nhóm món trong ngoặc, ví dụ 'Cà phê muối (Cà phê)'.",
    'Column `price_k`: `price` chia 1000.',
    "Column `price_level`: dưới 30000 là 'Rẻ', dưới 45000 là 'Vừa', còn lại là 'Đắt'.",
    'Column `calo`: món chưa có `calories` thì hiện 0. MySQL dùng IFNULL, Oracle dùng NVL.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: "SELECT \nFROM products\nWHERE category IN ('Cà phê', 'Trà trái cây');",
    oracle: "SELECT \nFROM products\nWHERE category IN ('Cà phê', 'Trà trái cây')",
  },
  solution: {
    mysql:
      "SELECT CONCAT(name, ' (', category, ')') AS label,\n  price / 1000 AS price_k,\n  CASE WHEN price < 30000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level,\n  IFNULL(calories, 0) AS calo\nFROM products\nWHERE category IN ('Cà phê', 'Trà trái cây');",
    oracle:
      "SELECT name || ' (' || category || ')' AS label,\n  price / 1000 AS price_k,\n  CASE WHEN price < 30000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level,\n  NVL(calories, 0) AS calo\nFROM products\nWHERE category IN ('Cà phê', 'Trà trái cây')",
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'Nối chuỗi ghép tên với nhóm. Phép chia ra giá theo nghìn. CASE WHEN chia ba mức giá. IFNULL hoặc NVL thay NULL của calories bằng 0.',
  hints: {
    light: 'Bài này ghép bốn kỹ thuật: nối chuỗi, phép tính, CASE WHEN và thay NULL. Viết từng column một, chạy thử sau mỗi column.',
    specific:
      "Nối chuỗi: MySQL dùng CONCAT(name, ' (', category, ')'), Oracle dùng name || ' (' || category || ')'. Thay NULL: IFNULL(calories, 0) ở MySQL, NVL(calories, 0) ở Oracle.",
    skeleton: {
      mysql:
        "SELECT CONCAT(____, ' (', ____, ')') AS label,\n  price / ____ AS price_k,\n  CASE WHEN price < ____ THEN 'Rẻ'\n       WHEN price < ____ THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level,\n  IFNULL(____, 0) AS calo\nFROM products\nWHERE category IN ('Cà phê', 'Trà trái cây');",
      oracle:
        "SELECT ____ || ' (' || ____ || ')' AS label,\n  price / ____ AS price_k,\n  CASE WHEN price < ____ THEN 'Rẻ'\n       WHEN price < ____ THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level,\n  NVL(____, 0) AS calo\nFROM products\nWHERE category IN ('Cà phê', 'Trà trái cây')",
    },
  },
  wrong: [
    {
      id: 'raw-null',
      sql: {
        mysql:
          "SELECT CONCAT(name, ' (', category, ')') AS label, price / 1000 AS price_k, CASE WHEN price < 30000 THEN 'Rẻ' WHEN price < 45000 THEN 'Vừa' ELSE 'Đắt' END AS price_level, calories AS calo FROM products WHERE category IN ('Cà phê', 'Trà trái cây')",
        oracle:
          "SELECT name || ' (' || category || ')' AS label, price / 1000 AS price_k, CASE WHEN price < 30000 THEN 'Rẻ' WHEN price < 45000 THEN 'Vừa' ELSE 'Đắt' END AS price_level, calories AS calo FROM products WHERE category IN ('Cà phê', 'Trà trái cây')",
      },
      hint: 'Ba column đầu đúng rồi. Column calo vẫn còn NULL ở món chưa có calo. Bọc calories trong IFNULL (MySQL) hoặc NVL (Oracle).',
    },
    {
      id: 'no-else',
      sql: {
        mysql:
          "SELECT CONCAT(name, ' (', category, ')') AS label, price / 1000 AS price_k, CASE WHEN price < 30000 THEN 'Rẻ' WHEN price < 45000 THEN 'Vừa' END AS price_level, IFNULL(calories, 0) AS calo FROM products WHERE category IN ('Cà phê', 'Trà trái cây')",
        oracle:
          "SELECT name || ' (' || category || ')' AS label, price / 1000 AS price_k, CASE WHEN price < 30000 THEN 'Rẻ' WHEN price < 45000 THEN 'Vừa' END AS price_level, NVL(calories, 0) AS calo FROM products WHERE category IN ('Cà phê', 'Trà trái cây')",
      },
      hint: "Món từ 45000 đồng trở lên đang ra NULL ở price_level. Thêm ELSE 'Đắt' trước END.",
    },
    {
      id: 'no-space',
      sql: {
        mysql:
          "SELECT CONCAT(name, category) AS label, price / 1000 AS price_k, CASE WHEN price < 30000 THEN 'Rẻ' WHEN price < 45000 THEN 'Vừa' ELSE 'Đắt' END AS price_level, IFNULL(calories, 0) AS calo FROM products WHERE category IN ('Cà phê', 'Trà trái cây')",
        oracle:
          "SELECT name || category AS label, price / 1000 AS price_k, CASE WHEN price < 30000 THEN 'Rẻ' WHEN price < 45000 THEN 'Vừa' ELSE 'Đắt' END AS price_level, NVL(calories, 0) AS calo FROM products WHERE category IN ('Cà phê', 'Trà trái cây')",
      },
      hint: "Tên và nhóm đang dính liền nhau. Nối thêm chuỗi ' (' ở giữa và chuỗi ')' ở cuối.",
    },
  ],
};
