import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  "chapter": 4,
  "dialects": [
    "mysql",
    "oracle"
  ],
  "check": {
    "orderMatters": false
  },
  "id": "c4-e8",
  "kind": "debug",
  "title": "Sửa query món Trà sữa hoặc Topping",
  "prompt": "Query này muốn tìm món thuộc nhóm Trà sữa hoặc Topping mà giá dưới 30.000 đồng. Query đang ra thừa row. Bấm Chạy để xem, rồi sửa query.",
  "asks": [
    "Hiện `name`, `category` và `price`.",
    "Món phải thuộc nhóm Trà sữa hoặc Topping.",
    "Món phải có `price` nhỏ hơn 30000.",
    "Kết quả không còn món Trà sữa nào từ 30000 trở lên."
  ],
  "database": "teashop",
  "tables": [
    "products"
  ],
  "starter": {
    "mysql": "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR category = 'Topping' AND price < 30000;",
    "oracle": "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR category = 'Topping' AND price < 30000"
  },
  "solution": {
    "mysql": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Topping')\n  AND price < 30000;",
    "oracle": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Topping')\n  AND price < 30000"
  },
  "why": "AND chạy trước OR. Ngoặc quanh hai nhóm ép database xét nhóm trước, rồi mới áp điều kiện giá cho cả hai.",
  "hints": {
    "light": "Hãy xem các món Trà sữa giá 35000 hay 42000 trong kết quả. Điều kiện giá chưa áp cho nhóm đó.",
    "specific": "Database chạy `Topping AND price < 30000` trước. Thêm ngoặc quanh phần OR để điều kiện giá áp cho cả hai nhóm.",
    "skeleton": {
      "mysql": "SELECT name, category, price\nFROM products\nWHERE ____ category = 'Trà sữa' OR category = 'Topping' ____\n  AND price < 30000;",
      "oracle": "SELECT name, category, price\nFROM products\nWHERE ____ category = 'Trà sữa' OR category = 'Topping' ____\n  AND price < 30000"
    }
  },
  "wrong": [
    {
      "id": "only-topping",
      "sql": {
        "mysql": "SELECT name, category, price\nFROM products\nWHERE category = 'Topping'\n  AND price < 30000;",
        "oracle": "SELECT name, category, price\nFROM products\nWHERE category = 'Topping'\n  AND price < 30000"
      },
      "hint": "Query này bỏ mất nhóm Trà sữa. Giữ cả hai nhóm bằng OR trong một cặp ngoặc."
    },
    {
      "id": "or-price",
      "sql": {
        "mysql": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Topping')\n   OR price < 30000;",
        "oracle": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Topping')\n   OR price < 30000"
      },
      "hint": "Nối bằng OR thì món nào rẻ cũng lọt vào, kể cả Cà phê. Nối điều kiện giá bằng AND."
    },
    {
      "id": "wrong-parens",
      "sql": {
        "mysql": "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR (category = 'Topping' AND price < 30000);",
        "oracle": "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR (category = 'Topping' AND price < 30000)"
      },
      "hint": "Ngoặc đang bọc nhầm chỗ. Bọc hai điều kiện `category` với nhau, để điều kiện giá áp cho cả hai nhóm."
    }
  ]
};
