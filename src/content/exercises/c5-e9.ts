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
  "id": "c5-e9",
  "kind": "write",
  "title": "Lương có dấu ngăn nghìn cho phòng 10",
  "prompt": "Kế toán cần danh sách lương của phòng 10 để dán vào email. Số tiền phải có dấu phẩy ngăn nghìn cho dễ đọc.",
  "asks": [
    "Hiện `last_name`, `salary` và `salary_text`.",
    "`salary_text` là `salary` đổi thành chữ, có dấu phẩy ngăn nghìn và không có số lẻ.",
    "Chỉ lấy phòng 10, sắp theo `salary` giảm dần."
  ],
  "database": "company",
  "tables": [
    "employees"
  ],
  "starter": {
    "mysql": "SELECT last_name, salary,\n  ",
    "oracle": "SELECT last_name, salary,\n  "
  },
  "solution": {
    "mysql": "SELECT last_name, salary,\n  FORMAT(salary, 0) AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC;",
    "oracle": "SELECT last_name, salary,\n  TO_CHAR(salary, 'FM999,999,999') AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC"
  },
  "why": "FORMAT ở MySQL và TO_CHAR ở Oracle đổi số thành chữ có dấu phẩy ngăn nghìn. Số 0 trong FORMAT là số chữ số lẻ.",
  "hints": {
    "light": "MySQL có FORMAT(số, số chữ số lẻ). Oracle có TO_CHAR(số, mẫu), trong mẫu dấu phẩy đánh dấu chỗ ngăn nghìn.",
    "specific": "MySQL: FORMAT(salary, 0). Oracle: TO_CHAR(salary, 'FM999,999,999'). Chữ FM bỏ dấu cách thừa ở đầu.",
    "skeleton": {
      "mysql": "SELECT last_name, salary,\n  FORMAT(salary, ____) AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC;",
      "oracle": "SELECT last_name, salary,\n  TO_CHAR(salary, '____') AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC"
    }
  },
  "wrong": [
    {
      "id": "two-decimals",
      "sql": {
        "mysql": "SELECT last_name, salary,\n  FORMAT(salary, 2) AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC;",
        "oracle": "SELECT last_name, salary,\n  TO_CHAR(salary, 'FM999,999,999.00') AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC"
      },
      "hint": "Kết quả đang có hai số lẻ. Đề không cần số lẻ, nên đổi 2 thành 0 (MySQL) hoặc bỏ phần `.00` trong mẫu (Oracle)."
    },
    {
      "id": "no-comma",
      "sql": {
        "mysql": "SELECT last_name, salary,\n  CAST(salary AS CHAR) AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC;",
        "oracle": "SELECT last_name, salary,\n  TO_CHAR(salary) AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC"
      },
      "hint": "Số đã thành chữ nhưng chưa có dấu phẩy. Dùng FORMAT (MySQL) hoặc TO_CHAR kèm mẫu có dấu phẩy (Oracle)."
    },
    {
      "id": "plain-number",
      "sql": {
        "mysql": "SELECT last_name, salary,\n  salary AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC;",
        "oracle": "SELECT last_name, salary,\n  salary AS salary_text\nFROM employees\nWHERE department_id = 10\nORDER BY salary DESC"
      },
      "hint": "Column này vẫn là số gốc. Bọc `salary` trong FORMAT (MySQL) hoặc TO_CHAR (Oracle) để đổi thành chữ có dấu phẩy."
    }
  ]
};
