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
  "id": "c6-e9",
  "kind": "write",
  "title": "Tên nhân viên của mỗi phòng trên một row",
  "prompt": "Chị trưởng phòng nhân sự cần danh sách để dán vào email: mỗi phòng một row, kèm tên nhân viên ngăn bằng dấu phẩy. Chị chỉ quan tâm phòng 40, 50 và 60.",
  "asks": [
    "Hiện `department_id` và `names`.",
    "`names` gộp `last_name` của cả phòng, ngăn bằng dấu phẩy và một dấu cách.",
    "Tên trong mỗi phòng xếp theo thứ tự chữ cái.",
    "Chỉ lấy phòng 40, 50, 60. Sắp theo `department_id`."
  ],
  "database": "company",
  "tables": [
    "employees"
  ],
  "starter": {
    "mysql": "SELECT department_id,\n  ",
    "oracle": "SELECT department_id,\n  "
  },
  "solution": {
    "mysql": "SELECT department_id,\n  GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ', ') AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
    "oracle": "SELECT department_id,\n  LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id"
  },
  "why": "GROUP_CONCAT (MySQL) và LISTAGG (Oracle) gộp `last_name` của cả nhóm thành một chuỗi. ORDER BY trong function xếp tên theo thứ tự chữ cái.",
  "hints": {
    "light": "Hãy gom theo phòng, rồi dùng function gộp chữ thay cho COUNT hay SUM.",
    "specific": "MySQL: GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ', '). Oracle: LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name).",
    "skeleton": {
      "mysql": "SELECT department_id,\n  GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR '____') AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
      "oracle": "SELECT department_id,\n  LISTAGG(last_name, '____') WITHIN GROUP (ORDER BY last_name) AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id"
    }
  },
  "wrong": [
    {
      "id": "no-space",
      "sql": {
        "mysql": "SELECT department_id,\n  GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ',') AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
        "oracle": "SELECT department_id,\n  LISTAGG(last_name, ',') WITHIN GROUP (ORDER BY last_name) AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id"
      },
      "hint": "Tên đang dính sát nhau sau dấu phẩy. Đề cần dấu phẩy và một dấu cách, nên đổi chuỗi ngăn thành `', '`."
    },
    {
      "id": "first-name",
      "sql": {
        "mysql": "SELECT department_id,\n  GROUP_CONCAT(first_name ORDER BY first_name SEPARATOR ', ') AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
        "oracle": "SELECT department_id,\n  LISTAGG(first_name, ', ') WITHIN GROUP (ORDER BY first_name) AS names\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id"
      },
      "hint": "Column `first_name` là họ và tên đệm. Tên gọi nằm ở `last_name`, nên đổi lại column cần gộp."
    },
    {
      "id": "all-departments",
      "sql": {
        "mysql": "SELECT department_id,\n  GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ', ') AS names\nFROM employees\nGROUP BY department_id\nORDER BY department_id;",
        "oracle": "SELECT department_id,\n  LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS names\nFROM employees\nGROUP BY department_id\nORDER BY department_id"
      },
      "hint": "Kết quả có thêm các phòng khác. Thêm `WHERE department_id IN (40, 50, 60)` trước GROUP BY."
    }
  ]
};
