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
  "id": "c5-e10",
  "kind": "write",
  "title": "Thu nhập gồm lương và hoa hồng",
  "prompt": "Kế toán cần thu nhập mỗi tháng của nhân viên phòng 10 và 20 có lương từ 18.000.000 trở lên. Thu nhập bằng lương cộng tiền hoa hồng, và người không có hoa hồng vẫn phải có thu nhập.",
  "asks": [
    "Hiện `employee_id`, `last_name`, `salary`, `commission_pct` và `total_pay`.",
    "`total_pay` bằng `salary` cộng `salary` nhân `commission_pct`.",
    "Khi `commission_pct` là NULL, tính hoa hồng là 0.",
    "Chỉ lấy phòng 10 và 20, `salary` từ 18000000. Sắp theo `employee_id` tăng dần."
  ],
  "database": "company",
  "tables": [
    "employees"
  ],
  "starter": {
    "mysql": "SELECT employee_id, last_name, salary, commission_pct,\n  ",
    "oracle": "SELECT employee_id, last_name, salary, commission_pct,\n  "
  },
  "solution": {
    "mysql": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + salary * IFNULL(commission_pct, 0) AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id;",
    "oracle": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + salary * NVL(commission_pct, 0) AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id"
  },
  "why": "IFNULL (MySQL) và NVL (Oracle) đổi NULL thành 0 trước khi nhân. Nhờ vậy người không có hoa hồng vẫn có `total_pay`.",
  "hints": {
    "light": "Phép tính có NULL cho ra NULL. Thay NULL bằng 0 trước khi tính.",
    "specific": "Bọc `commission_pct` trong IFNULL (MySQL) hoặc NVL (Oracle) với giá trị thay là 0. COALESCE chạy ở cả hai.",
    "skeleton": {
      "mysql": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + salary * IFNULL(commission_pct, ____) AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id;",
      "oracle": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + salary * NVL(commission_pct, ____) AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id"
    }
  },
  "wrong": [
    {
      "id": "null-trap",
      "sql": {
        "mysql": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + salary * commission_pct AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id;",
        "oracle": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + salary * commission_pct AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id"
      },
      "hint": "Người không có hoa hồng đang ra NULL, vì phép tính có NULL cho ra NULL. Bọc `commission_pct` trong IFNULL hoặc NVL với giá trị 0."
    },
    {
      "id": "add-pct",
      "sql": {
        "mysql": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + IFNULL(commission_pct, 0) AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id;",
        "oracle": "SELECT employee_id, last_name, salary, commission_pct,\n  salary + NVL(commission_pct, 0) AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id"
      },
      "hint": "`commission_pct` là tỷ lệ như 0.15, chưa phải số tiền. Nhân nó với `salary` trước, rồi mới cộng."
    },
    {
      "id": "only-salary",
      "sql": {
        "mysql": "SELECT employee_id, last_name, salary, commission_pct,\n  salary AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id;",
        "oracle": "SELECT employee_id, last_name, salary, commission_pct,\n  salary AS total_pay\nFROM employees\nWHERE department_id IN (10, 20)\n  AND salary >= 18000000\nORDER BY employee_id"
      },
      "hint": "Column này mới là lương, chưa có hoa hồng. Cộng thêm `salary * commission_pct` và nhớ thay NULL bằng 0."
    }
  ]
};
