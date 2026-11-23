import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  "chapter": 5,
  "dialects": [
    "mysql",
    "oracle"
  ],
  "check": {
    "orderMatters": true
  },
  "id": "c5-e8",
  "kind": "write",
  "title": "Nhân viên vào làm trong 12 tháng qua",
  "prompt": "Trưởng phòng nhân sự cần danh sách nhân viên vào làm trong 12 tháng tính tới hôm nay, kèm số tháng mỗi người đã làm.",
  "asks": [
    "Hiện `employee_id`, `last_name`, `hire_date` và `months_worked`.",
    "`months_worked` là số tháng tròn từ `hire_date` tới hôm nay.",
    "Chỉ lấy người có `hire_date` trong 12 tháng gần nhất.",
    "Sắp theo `hire_date` tăng dần."
  ],
  "database": "company",
  "tables": [
    "employees"
  ],
  "starter": {
    "mysql": "SELECT employee_id, last_name, hire_date,\n  ",
    "oracle": "SELECT employee_id, last_name, hire_date,\n  "
  },
  "solution": {
    "mysql": "SELECT employee_id, last_name, hire_date,\n  TIMESTAMPDIFF(MONTH, hire_date, CURDATE()) AS months_worked\nFROM employees\nWHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)\nORDER BY hire_date;",
    "oracle": "SELECT employee_id, last_name, hire_date,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date)) AS months_worked\nFROM employees\nWHERE hire_date >= ADD_MONTHS(SYSDATE, -12)\nORDER BY hire_date"
  },
  "why": "Mốc 12 tháng trước là một ngày cụ thể. WHERE giữ người vào làm từ mốc đó, và function tính khoảng cách cho ra số tháng tròn.",
  "hints": {
    "light": "Tính mốc ngày bằng cách lùi 12 tháng từ hôm nay. Khoảng cách tháng tính từ ngày vào làm tới hôm nay.",
    "specific": "Ở WHERE, so `hire_date` với mốc lùi 12 tháng. Ở SELECT, tính số tháng giữa `hire_date` và hôm nay, ngày cũ đứng trước.",
    "skeleton": {
      "mysql": "SELECT employee_id, last_name, hire_date,\n  TIMESTAMPDIFF(MONTH, ____, CURDATE()) AS months_worked\nFROM employees\nWHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL ____ MONTH)\nORDER BY hire_date;",
      "oracle": "SELECT employee_id, last_name, hire_date,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, ____)) AS months_worked\nFROM employees\nWHERE hire_date >= ADD_MONTHS(SYSDATE, -____)\nORDER BY hire_date"
    }
  },
  "wrong": [
    {
      "id": "swapped",
      "sql": {
        "mysql": "SELECT employee_id, last_name, hire_date,\n  TIMESTAMPDIFF(MONTH, CURDATE(), hire_date) AS months_worked\nFROM employees\nWHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)\nORDER BY hire_date;",
        "oracle": "SELECT employee_id, last_name, hire_date,\n  TRUNC(MONTHS_BETWEEN(hire_date, SYSDATE)) AS months_worked\nFROM employees\nWHERE hire_date >= ADD_MONTHS(SYSDATE, -12)\nORDER BY hire_date"
      },
      "hint": "Số tháng ra âm vì hai ngày đang đứng ngược chỗ. Đặt ngày cũ (`hire_date`) trước, hôm nay sau."
    },
    {
      "id": "six-months",
      "sql": {
        "mysql": "SELECT employee_id, last_name, hire_date,\n  TIMESTAMPDIFF(MONTH, hire_date, CURDATE()) AS months_worked\nFROM employees\nWHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)\nORDER BY hire_date;",
        "oracle": "SELECT employee_id, last_name, hire_date,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date)) AS months_worked\nFROM employees\nWHERE hire_date >= ADD_MONTHS(SYSDATE, -6)\nORDER BY hire_date"
      },
      "hint": "Query này chỉ lùi 6 tháng. Đề cần 12 tháng, nên đổi con số trong mốc ngày."
    },
    {
      "id": "no-filter",
      "sql": {
        "mysql": "SELECT employee_id, last_name, hire_date,\n  TIMESTAMPDIFF(MONTH, hire_date, CURDATE()) AS months_worked\nFROM employees\nORDER BY hire_date;",
        "oracle": "SELECT employee_id, last_name, hire_date,\n  TRUNC(MONTHS_BETWEEN(SYSDATE, hire_date)) AS months_worked\nFROM employees\nORDER BY hire_date"
      },
      "hint": "Phần tính số tháng đúng rồi. Bạn còn thiếu WHERE để chỉ giữ người vào làm trong 12 tháng gần nhất."
    }
  ]
};
