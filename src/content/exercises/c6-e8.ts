import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  "chapter": 6,
  "dialects": [
    "mysql",
    "oracle"
  ],
  "check": {
    "orderMatters": true
  },
  "id": "c6-e8",
  "kind": "write",
  "title": "Mỗi tháng một row, mỗi trạng thái một column",
  "prompt": "Chị trưởng phòng kinh doanh muốn một báo cáo gọn: mỗi tháng một row, và các trạng thái đơn nằm cạnh nhau thành column. Báo cáo bắt đầu từ tháng 12 năm 2025.",
  "asks": [
    "Hiện `order_month`, `delivered`, `cancelled` và `in_progress`.",
    "`delivered` và `cancelled` đếm đơn có trạng thái đó. `in_progress` đếm đơn `shipped` hoặc `processing`.",
    "Chỉ lấy đơn từ 2025-12-01.",
    "Sắp theo `order_month`."
  ],
  "database": "company",
  "tables": [
    "orders"
  ],
  "starter": {
    "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n  ",
    "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n  "
  },
  "solution": {
    "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n  SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
    "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n  SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month"
  },
  "why": "Mỗi CASE biến đơn thành 1 nếu đúng trạng thái và 0 nếu không. SUM cộng các số đó trong từng tháng.",
  "hints": {
    "light": "CASE cho mỗi đơn một con số, 1 hoặc 0. SUM cộng các con số đó trong từng nhóm tháng.",
    "specific": "Mỗi column là một `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`. Column `in_progress` dùng `status IN (...)`.",
    "skeleton": {
      "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE ____ END) AS delivered,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE ____ END) AS cancelled,\n  SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE ____ END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
      "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE ____ END) AS delivered,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE ____ END) AS cancelled,\n  SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE ____ END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month"
    }
  },
  "wrong": [
    {
      "id": "count-else-0",
      "sql": {
        "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n  COUNT(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  COUNT(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n  COUNT(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
        "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n  COUNT(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  COUNT(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n  COUNT(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month"
      },
      "hint": "COUNT đếm mọi giá trị khác NULL, kể cả số 0, nên column nào cũng ra tổng số đơn. Đổi COUNT thành SUM, hoặc để ELSE ra NULL."
    },
    {
      "id": "only-shipped",
      "sql": {
        "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n  SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
        "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,\n  SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month"
      },
      "hint": "Column `in_progress` đang bỏ sót đơn `processing`. Dùng `status IN ('shipped', 'processing')`."
    },
    {
      "id": "typo",
      "sql": {
        "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS cancelled,\n  SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
        "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS cancelled,\n  SUM(CASE WHEN status IN ('shipped', 'processing') THEN 1 ELSE 0 END) AS in_progress\nFROM orders\nWHERE order_date >= DATE '2025-12-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month"
      },
      "hint": "Column `cancelled` ra toàn 0. Hãy xem lại chính tả của trạng thái: trong data viết `cancelled` với hai chữ l."
    }
  ]
};
