import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c9-e2',
  chapter: 9,
  kind: 'write',
  title: 'Xếp hạng lương trong từng phòng',
  prompt:
    'Phòng nhân sự muốn biết ai nhận lương cao nhất trong phòng của mình. Bạn xếp hạng nhân viên theo lương, mỗi phòng xếp riêng, cho ba phòng 50, 60 và 70.',
  asks: [
    'Hiện `employee_id`, `last_name`, `department_id`, `salary` và một column hạng, dùng RANK.',
    'Hạng 1 là người có `salary` cao nhất của phòng. Mỗi phòng đếm lại từ 1.',
    'Chỉ lấy phòng 50, 60 và 70.',
    'Sắp theo `department_id`, rồi theo hạng, rồi theo `employee_id`.',
  ],
  database: 'company',
  tables: ['employees'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT employee_id, last_name, department_id, salary,\n       \nFROM employees\nWHERE department_id IN (50, 60, 70)\n',
    oracle: 'SELECT employee_id, last_name, department_id, salary,\n       \nFROM employees\nWHERE department_id IN (50, 60, 70)\n',
  },
  solution: {
    mysql:
      'SELECT employee_id, last_name, department_id, salary,\n' +
      '       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank\n' +
      'FROM employees\n' +
      'WHERE department_id IN (50, 60, 70)\n' +
      'ORDER BY department_id, salary_rank, employee_id;',
    oracle:
      'SELECT employee_id, last_name, department_id, salary,\n' +
      '       RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank\n' +
      'FROM employees\n' +
      'WHERE department_id IN (50, 60, 70)\n' +
      'ORDER BY department_id, salary_rank, employee_id',
  },
  check: { orderMatters: true },
  why: 'PARTITION BY chia nhân viên theo phòng, ORDER BY salary DESC xếp người lương cao lên trước. RANK đếm lại từ 1 ở mỗi phòng.',
  hints: {
    light: 'RANK cũng là window function. Bạn cần chia theo phòng trước, rồi mới xếp theo lương.',
    specific: 'Trong OVER, viết PARTITION BY `department_id` rồi ORDER BY `salary` giảm dần. Giảm dần để người lương cao nhận hạng 1.',
    skeleton: {
      mysql: 'SELECT employee_id, last_name, department_id, salary,\n       RANK() OVER (PARTITION BY ____ ORDER BY ____ DESC) AS salary_rank\nFROM employees\nWHERE department_id IN (50, 60, 70)\nORDER BY department_id, salary_rank, employee_id;',
      oracle: 'SELECT employee_id, last_name, department_id, salary,\n       RANK() OVER (PARTITION BY ____ ORDER BY ____ DESC) AS salary_rank\nFROM employees\nWHERE department_id IN (50, 60, 70)\nORDER BY department_id, salary_rank, employee_id',
    },
  },
  wrong: [
    {
      id: 'no-partition',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees WHERE department_id IN (50, 60, 70) ORDER BY department_id, salary_rank, employee_id',
        oracle: 'SELECT employee_id, last_name, department_id, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees WHERE department_id IN (50, 60, 70) ORDER BY department_id, salary_rank, employee_id',
      },
      hint: 'Hạng của bạn đếm chung cho cả ba phòng, nên phòng sau không bắt đầu lại từ 1. Thêm PARTITION BY department_id trong OVER.',
    },
    {
      id: 'asc',
      sql: {
        mysql: 'SELECT employee_id, last_name, department_id, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary) AS salary_rank FROM employees WHERE department_id IN (50, 60, 70) ORDER BY department_id, salary_rank, employee_id',
        oracle: 'SELECT employee_id, last_name, department_id, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary) AS salary_rank FROM employees WHERE department_id IN (50, 60, 70) ORDER BY department_id, salary_rank, employee_id',
      },
      hint: 'ORDER BY mặc định xếp tăng dần, nên người lương thấp nhất nhận hạng 1. Thêm DESC sau `salary`.',
    },
  ],
};
