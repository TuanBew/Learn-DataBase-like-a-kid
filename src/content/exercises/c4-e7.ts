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
  "id": "c4-e7",
  "kind": "write",
  "title": "Trà sữa hoặc Cà phê dưới 30.000 đồng",
  "prompt": "Chị thu ngân nhờ mình tìm các món thuộc nhóm Trà sữa hoặc Cà phê mà giá dưới 30.000 đồng, để in vào tờ khuyến mãi.",
  "asks": [
    "Hiện `name`, `category` và `price`.",
    "Chỉ lấy món thuộc nhóm Trà sữa hoặc Cà phê.",
    "Chỉ lấy món có `price` nhỏ hơn 30000.",
    "Đặt ngoặc quanh phần OR."
  ],
  "database": "teashop",
  "tables": [
    "products"
  ],
  "starter": {
    "mysql": "SELECT name, category, price\nFROM products\nWHERE ",
    "oracle": "SELECT name, category, price\nFROM products\nWHERE "
  },
  "solution": {
    "mysql": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Cà phê')\n  AND price < 30000;",
    "oracle": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Cà phê')\n  AND price < 30000"
  },
  "why": "Ngoặc ép database xét nhóm món trước. Sau đó AND giữ các món có giá dưới 30000 trong số đó.",
  "hints": {
    "light": "AND chạy trước OR. Khi một query có cả hai, bạn dùng ngoặc để chọn phần chạy trước.",
    "specific": "Đặt hai điều kiện `category` vào chung một cặp ngoặc, rồi nối `AND price < 30000` ở ngoài.",
    "skeleton": {
      "mysql": "SELECT name, category, price\nFROM products\nWHERE (category = ____ OR category = ____)\n  AND price ____ 30000;",
      "oracle": "SELECT name, category, price\nFROM products\nWHERE (category = ____ OR category = ____)\n  AND price ____ 30000"
    }
  },
  "wrong": [
    {
      "id": "no-parens",
      "sql": {
        "mysql": "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR category = 'Cà phê' AND price < 30000;",
        "oracle": "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR category = 'Cà phê' AND price < 30000"
      },
      "hint": "Không có ngoặc nên AND chạy trước, và mọi món Trà sữa đều lọt vào. Bọc `category = 'Trà sữa' OR category = 'Cà phê'` trong ngoặc là xong."
    },
    {
      "id": "lte",
      "sql": {
        "mysql": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Cà phê')\n  AND price <= 30000;",
        "oracle": "SELECT name, category, price\nFROM products\nWHERE (category = 'Trà sữa' OR category = 'Cà phê')\n  AND price <= 30000"
      },
      "hint": "Bạn gần đúng rồi. Dấu `<=` giữ cả món giá đúng 30000. Đề nói dưới 30.000 đồng, nên đổi thành `<`."
    },
    {
      "id": "one-category",
      "sql": {
        "mysql": "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n  AND price < 30000;",
        "oracle": "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n  AND price < 30000"
      },
      "hint": "Query này mới lấy nhóm Cà phê. Thêm nhóm Trà sữa bằng OR, và đặt hai nhóm trong ngoặc."
    }
  ]
};
