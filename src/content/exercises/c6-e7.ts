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
  "id": "c6-e7",
  "kind": "write",
  "title": "Số đơn theo tháng và trạng thái quý 4",
  "prompt": "Chị trưởng phòng kinh doanh nhờ mình đếm số đơn của quý 4 năm 2025, chia theo tháng và theo trạng thái.",
  "asks": [
    "Hiện `order_month` (dạng 2025-10), `status` và `orders_count`.",
    "Chỉ lấy đơn từ 2025-10-01 tới hết 2025-12-31.",
    "Mỗi tổ hợp tháng và trạng thái một row.",
    "Sắp theo `order_month`, rồi `status`."
  ],
  "database": "company",
  "tables": [
    "orders"
  ],
  "starter": {
    "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, ",
    "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month, "
  },
  "solution": {
    "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), status\nORDER BY order_month, status;",
    "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), status\nORDER BY order_month, status"
  },
  "why": "GROUP BY có hai biểu thức nên mỗi cặp tháng và trạng thái thành một nhóm. COUNT(*) đếm đơn trong từng nhóm.",
  "hints": {
    "light": "Cần hai thứ để gom: tháng và trạng thái. Hai thứ này đều đứng trong GROUP BY.",
    "specific": "Viết biểu thức tháng giống hệt ở SELECT và GROUP BY, rồi thêm `status`. Lọc ngày ở WHERE.",
    "skeleton": {
      "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), ____\nORDER BY order_month, status;",
      "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), ____\nORDER BY order_month, status"
    }
  },
  "wrong": [
    {
      "id": "month-only",
      "sql": {
        "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
        "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month"
      },
      "hint": "Query này mới gom theo tháng. Thêm `status` vào cả SELECT và GROUP BY để tách theo trạng thái."
    },
    {
      "id": "wide-range",
      "sql": {
        "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-09-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), status\nORDER BY order_month, status;",
        "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-09-01'\n  AND order_date < DATE '2026-01-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), status\nORDER BY order_month, status"
      },
      "hint": "Kết quả có thêm tháng 9. Quý 4 bắt đầu từ 2025-10-01, nên sửa ngày ở WHERE."
    },
    {
      "id": "no-cancelled",
      "sql": {
        "mysql": "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND status <> 'cancelled'\n  AND order_date < DATE '2026-01-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), status\nORDER BY order_month, status;",
        "oracle": "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month, status, COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\n  AND status <> 'cancelled'\n  AND order_date < DATE '2026-01-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), status\nORDER BY order_month, status"
      },
      "hint": "Query này bỏ mất đơn cancelled. Đề cần mọi trạng thái, nên xóa điều kiện đó."
    }
  ]
};
