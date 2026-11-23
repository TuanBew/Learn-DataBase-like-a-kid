import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c9-e1',
  chapter: 9,
  kind: 'write',
  title: 'Lương từng người cạnh lương trung bình phòng',
  prompt:
    'Chị trưởng phòng nhân sự muốn so lương từng người với mức trung bình của phòng mình. Bạn làm danh sách cho phòng 30 và phòng 40, mỗi người kèm lương trung bình của phòng, tính bằng một window function.',
  asks: [
    'Hiện `employee_id`, `last_name`, `department_id` và `salary`.',
    'Thêm một column là `salary` trung bình của phòng người đó.',
    'Chỉ lấy nhân viên phòng 30 và phòng 40. Vẫn hiện từng người, không gộp row.',
  ],
  database: 'company',
  tables: ['employees'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT employee_id, last_name, department_id, salary,\n       \nFROM employees\nWHERE department_id IN (30, 40)\nORDER BY employee_id;',
    oracle: 'SELECT employee_id, last_name, department_id, salary,\n       \nFROM employees\nWHERE department_id IN (30, 40)\nORDER BY employee_id',
  },
  solution: {
    mysql:
      'SELECT employee_id, last_name, department_id, salary,\n' +
      '       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg\n' +
      'FROM employees\n' +
      'WHERE department_id IN (30, 40)\n' +
      'ORDER BY employee_id;',
    oracle:
      'SELECT employee_id, last_name, department_id, salary,\n' +
      '       AVG(salary) OVER (PARTITION BY department_id) AS dept_avg\n' +
      'FROM employees\n' +
      'WHERE department_id IN (30, 40)\n' +
      'ORDER BY employee_id',
  },
  check: { orderMatters: false },
  why: 'AVG với OVER giữ nguyên từng row và thêm một column. PARTITION BY department_id tính trung bình riêng cho từng phòng.',
  hints: {
    light: 'Window function tính trên một nhóm row nhưng không gộp chúng lại. Bạn cần AVG kèm OVER.',
    specific: 'Trong OVER, thêm PARTITION BY với column `department_id`. Nhờ đó mỗi phòng có một mức trung bình riêng.',
    skeleton: {
      mysql: 'SELECT employee_id, last_name, department_id, salary,\n       AVG(____) OVER (____ BY department_id) AS dept_avg\nFROM employees\nWHERE department_id IN (30, 40)\nORDER BY employee_id;',
      oracle: 'SELECT employee_id, last_name, department_id, salary,\n       AVG(____) OVER (____ BY department_id) AS dept_avg\nFROM employees\nWHERE department_id IN (30, 40)\nORDER BY employee_id',
    },
  },
  wrong: [
    {
      id: 'no-partition',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, AVG(salary) OVER () AS dept_avg FROM employees WHERE department_id IN (30, 40) ORDER BY employee_id',
        oracle: 'SELECT employee_id, last_name, department_id, salary, AVG(salary) OVER () AS dept_avg FROM employees WHERE department_id IN (30, 40) ORDER BY employee_id',
      },
      hint: 'OVER () trống tính trung bình cho cả danh sách, nên hai phòng có chung một con số. Thêm PARTITION BY department_id vào trong OVER.',
    },
    {
      id: 'running',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, AVG(salary) OVER (PARTITION BY department_id ORDER BY salary) AS dept_avg FROM employees WHERE department_id IN (30, 40) ORDER BY employee_id',
        oracle: 'SELECT employee_id, last_name, department_id, salary, AVG(salary) OVER (PARTITION BY department_id ORDER BY salary) AS dept_avg FROM employees WHERE department_id IN (30, 40) ORDER BY employee_id',
      },
      hint: 'Có ORDER BY trong OVER thì AVG tính dồn từng row một, nên con số đổi theo từng người. Bỏ ORDER BY trong OVER để lấy trung bình cả phòng.',
    },
    {
      id: 'max',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, MAX(salary) OVER (PARTITION BY department_id) AS dept_avg FROM employees WHERE department_id IN (30, 40) ORDER BY employee_id',
        oracle: 'SELECT employee_id, last_name, department_id, salary, MAX(salary) OVER (PARTITION BY department_id) AS dept_avg FROM employees WHERE department_id IN (30, 40) ORDER BY employee_id',
      },
      hint: 'MAX cho lương cao nhất của phòng, không phải mức trung bình. Đổi MAX thành AVG.',
    },
  ],
};
