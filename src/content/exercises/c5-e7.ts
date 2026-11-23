import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  "chapter": 5,
  "dialects": [
    "mysql",
    "oracle"
  ],
  "check": {
    "orderMatters": true,
    "aliasMatters": true
  },
  "id": "c5-e7",
  "kind": "write",
  "title": "Mã nhân viên NV và vị trí dấu @",
  "prompt": "Phòng nhân sự chuyển nhân viên phòng 60 sang hệ thống mới. Hệ thống cần mã dạng NV kèm số năm chữ số có 0 đứng đầu, và vị trí dấu @ trong email để cắt tên đăng nhập.",
  "asks": [
    "Hiện `employee_id`, `code`, `email` và `at_pos`.",
    "`code` ghép chữ NV với `employee_id` đệm số 0 cho đủ 5 chữ số.",
    "`at_pos` là vị trí dấu @ trong `email`.",
    "Chỉ lấy phòng 60, sắp theo `employee_id` tăng dần."
  ],
  "database": "company",
  "tables": [
    "employees"
  ],
  "starter": {
    "mysql": "SELECT employee_id,\n  ",
    "oracle": "SELECT employee_id,\n  "
  },
  "solution": {
    "mysql": "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 5, '0')) AS code,\n  email,\n  INSTR(email, '@') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id;",
    "oracle": "SELECT employee_id,\n  'NV' || LPAD(employee_id, 5, '0') AS code,\n  email,\n  INSTR(email, '@') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id"
  },
  "why": "LPAD thêm số 0 bên trái cho đủ 5 ký tự, và INSTR trả vị trí đầu tiên của dấu @. MySQL nối chuỗi bằng CONCAT, Oracle bằng `||`.",
  "hints": {
    "light": "LPAD(chuỗi, độ dài, ký tự đệm) thêm ký tự vào bên trái. INSTR(chuỗi, mẩu cần tìm) trả vị trí của mẩu đó.",
    "specific": "Đệm `employee_id` bằng ký tự `'0'` tới độ dài 5, rồi ghép chữ NV phía trước. Tìm `'@'` trong `email` bằng INSTR.",
    "skeleton": {
      "mysql": "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, ____, '0')) AS code,\n  email,\n  INSTR(email, '____') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id;",
      "oracle": "SELECT employee_id,\n  'NV' || LPAD(employee_id, ____, '0') AS code,\n  email,\n  INSTR(email, '____') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id"
    }
  },
  "wrong": [
    {
      "id": "no-pad",
      "sql": {
        "mysql": "SELECT employee_id,\n  CONCAT('NV', employee_id) AS code,\n  email,\n  INSTR(email, '@') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id;",
        "oracle": "SELECT employee_id,\n  'NV' || employee_id AS code,\n  email,\n  INSTR(email, '@') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id"
      },
      "hint": "Mã đang là NV131 mà chưa có số 0. Bọc `employee_id` trong LPAD với độ dài 5 và ký tự đệm `'0'`."
    },
    {
      "id": "pad-4",
      "sql": {
        "mysql": "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 4, '0')) AS code,\n  email,\n  INSTR(email, '@') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id;",
        "oracle": "SELECT employee_id,\n  'NV' || LPAD(employee_id, 4, '0') AS code,\n  email,\n  INSTR(email, '@') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id"
      },
      "hint": "Số trong LPAD là độ dài cuối cùng của phần số. Đề cần 5 chữ số, nên đổi 4 thành 5."
    },
    {
      "id": "dot",
      "sql": {
        "mysql": "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 5, '0')) AS code,\n  email,\n  INSTR(email, '.') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id;",
        "oracle": "SELECT employee_id,\n  'NV' || LPAD(employee_id, 5, '0') AS code,\n  email,\n  INSTR(email, '.') AS at_pos\nFROM employees\nWHERE department_id = 60\nORDER BY employee_id"
      },
      "hint": "INSTR đang tìm dấu chấm. Đổi mẩu cần tìm thành `'@'`."
    }
  ]
};
