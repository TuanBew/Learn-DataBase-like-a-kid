import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c9-e3',
  chapter: 9,
  kind: 'debug',
  title: 'Sửa query hai người lương cao nhất mỗi phòng',
  prompt:
    'Query này muốn lấy hai người lương cao nhất của mỗi phòng 30, 40 và 50, nhưng đang báo lỗi. Bấm Chạy để đọc lỗi, rồi sửa query.',
  asks: [
    'Hiện `employee_id`, `last_name`, `department_id`, `salary` và `rn`.',
    'Mỗi phòng chỉ giữ hai người có `salary` cao nhất.',
    'Sắp theo `department_id`, rồi theo `rn`.',
  ],
  database: 'company',
  tables: ['employees'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql:
      'SELECT employee_id, last_name, department_id, salary,\n' +
      '  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn\n' +
      'FROM employees\n' +
      'WHERE department_id IN (30, 40, 50) AND rn <= 2\n' +
      'ORDER BY department_id, rn;',
    oracle:
      'SELECT employee_id, last_name, department_id, salary,\n' +
      '  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn\n' +
      'FROM employees\n' +
      'WHERE department_id IN (30, 40, 50) AND rn <= 2\n' +
      'ORDER BY department_id, rn',
  },
  solution: {
    mysql:
      'SELECT employee_id, last_name, department_id, salary, rn\n' +
      'FROM (\n' +
      '  SELECT employee_id, last_name, department_id, salary,\n' +
      '    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn\n' +
      '  FROM employees\n' +
      '  WHERE department_id IN (30, 40, 50)\n' +
      ') t\n' +
      'WHERE rn <= 2\n' +
      'ORDER BY department_id, rn;',
    oracle:
      'SELECT employee_id, last_name, department_id, salary, rn\n' +
      'FROM (\n' +
      '  SELECT employee_id, last_name, department_id, salary,\n' +
      '    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn\n' +
      '  FROM employees\n' +
      '  WHERE department_id IN (30, 40, 50)\n' +
      ') t\n' +
      'WHERE rn <= 2\n' +
      'ORDER BY department_id, rn',
  },
  check: { orderMatters: true },
  why: 'WHERE chạy trước window function, nên lúc đó `rn` chưa tồn tại. Tính `rn` trong subquery ở FROM, rồi lọc `rn <= 2` ở query ngoài.',
  hints: {
    light: 'Database tính window function sau khi lọc WHERE. Vì vậy WHERE chưa nhìn thấy `rn`.',
    specific: 'Đặt query có `rn` vào trong ngoặc ở FROM, cho nó một alias. Query ngoài mới viết `WHERE rn <= 2`. Dùng WITH cũng được.',
    skeleton: {
      mysql: 'SELECT employee_id, last_name, department_id, salary, rn\nFROM (\n  SELECT ____ ... ROW_NUMBER() OVER (...) AS rn\n  FROM employees\n  WHERE department_id IN (30, 40, 50)\n) t\nWHERE ____ <= 2\nORDER BY department_id, rn;',
      oracle: 'SELECT employee_id, last_name, department_id, salary, rn\nFROM (\n  SELECT ____ ... ROW_NUMBER() OVER (...) AS rn\n  FROM employees\n  WHERE department_id IN (30, 40, 50)\n) t\nWHERE ____ <= 2\nORDER BY department_id, rn',
    },
  },
  wrong: [
    {
      id: 'no-filter',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, rn FROM (SELECT employee_id, last_name, department_id, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn FROM employees WHERE department_id IN (30, 40, 50)) t ORDER BY department_id, rn',
        oracle: 'SELECT employee_id, last_name, department_id, salary, rn FROM (SELECT employee_id, last_name, department_id, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn FROM employees WHERE department_id IN (30, 40, 50)) t ORDER BY department_id, rn',
      },
      hint: 'Subquery đã chạy tốt. Query ngoài còn thiếu `WHERE rn <= 2`, nên mọi người vẫn hiện ra.',
    },
    {
      id: 'asc',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, rn FROM (SELECT employee_id, last_name, department_id, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary) AS rn FROM employees WHERE department_id IN (30, 40, 50)) t WHERE rn <= 2 ORDER BY department_id, rn',
        oracle: 'SELECT employee_id, last_name, department_id, salary, rn FROM (SELECT employee_id, last_name, department_id, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary) AS rn FROM employees WHERE department_id IN (30, 40, 50)) t WHERE rn <= 2 ORDER BY department_id, rn',
      },
      hint: 'Bạn bọc subquery đúng rồi. Nhưng ORDER BY trong OVER đang xếp tăng dần, nên query lấy hai người lương thấp nhất. Thêm DESC sau `salary`.',
    },
    {
      id: 'three',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, rn FROM (SELECT employee_id, last_name, department_id, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn FROM employees WHERE department_id IN (30, 40, 50)) t WHERE rn <= 3 ORDER BY department_id, rn',
        oracle: 'SELECT employee_id, last_name, department_id, salary, rn FROM (SELECT employee_id, last_name, department_id, salary, ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn FROM employees WHERE department_id IN (30, 40, 50)) t WHERE rn <= 3 ORDER BY department_id, rn',
      },
      hint: 'Gần đúng rồi. Đề cần hai người mỗi phòng, nên đổi `rn <= 3` thành `rn <= 2`.',
    },
  ],
};
