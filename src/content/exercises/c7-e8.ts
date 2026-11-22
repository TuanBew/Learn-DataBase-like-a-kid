import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e8',
  chapter: 7,
  kind: 'write',
  title: 'Phòng chưa có nhân viên',
  prompt: 'Chị Hạnh ở phòng nhân sự nhờ mình tìm phòng nào chưa có nhân viên. Bạn tìm giúp mình, từ `departments` và `employees`.',
  asks: [
    'Hiện `department_id` và `department_name`.',
    'Chỉ lấy phòng không có row nào trong `employees`.',
  ],
  database: 'company',
  tables: ['departments', 'employees'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT d.department_id, d.department_name\nFROM departments d\n',
    oracle: 'SELECT d.department_id, d.department_name\nFROM departments d\n',
  },
  solution: {
    mysql: 'SELECT d.department_id, d.department_name\nFROM departments d\nLEFT JOIN employees e ON d.department_id = e.department_id\nWHERE e.employee_id IS NULL;',
    oracle: 'SELECT d.department_id, d.department_name\nFROM departments d\nLEFT JOIN employees e ON d.department_id = e.department_id\nWHERE e.employee_id IS NULL',
  },
  check: { orderMatters: false },
  why: 'LEFT JOIN giữ mọi phòng. Phòng chưa có nhân viên mang NULL ở phía `employees`, và WHERE ... IS NULL giữ đúng các phòng đó.',
  hints: {
    light: 'Table cần giữ đủ row phải đứng bên trái. Row không có cặp sẽ mang NULL ở table bên phải.',
    specific: 'Viết `departments` LEFT JOIN `employees` theo `department_id`. Rồi lọc `e.employee_id IS NULL`.',
    skeleton: {
      mysql: 'SELECT d.department_id, d.department_name\nFROM departments d\n____ JOIN employees e ON d.department_id = e.department_id\nWHERE e.employee_id ____;',
      oracle: 'SELECT d.department_id, d.department_name\nFROM departments d\n____ JOIN employees e ON d.department_id = e.department_id\nWHERE e.employee_id ____',
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT d.department_id, d.department_name FROM departments d LEFT JOIN employees e ON d.department_id = e.department_id',
        oracle: 'SELECT d.department_id, d.department_name FROM departments d LEFT JOIN employees e ON d.department_id = e.department_id',
      },
      hint: 'LEFT JOIN đã đúng. Query còn thiếu WHERE e.employee_id IS NULL, nên đang hiện cả phòng có người.',
    },
    {
      id: 'wrong-side',
      sql: {
        mysql: 'SELECT d.department_id, d.department_name FROM employees e LEFT JOIN departments d ON d.department_id = e.department_id WHERE d.department_id IS NULL',
        oracle: 'SELECT d.department_id, d.department_name FROM employees e LEFT JOIN departments d ON d.department_id = e.department_id WHERE d.department_id IS NULL',
      },
      hint: 'Query này giữ mọi nhân viên, nên tìm ra nhân viên chưa có phòng. Bạn cần giữ mọi phòng: đổi chỗ hai table.',
    },
    {
      id: 'inner-join',
      sql: {
        mysql: 'SELECT d.department_id, d.department_name FROM departments d INNER JOIN employees e ON d.department_id = e.department_id WHERE e.employee_id IS NULL',
        oracle: 'SELECT d.department_id, d.department_name FROM departments d INNER JOIN employees e ON d.department_id = e.department_id WHERE e.employee_id IS NULL',
      },
      hint: 'INNER JOIN bỏ luôn phòng không có nhân viên, nên không còn gì để lọc. Đổi sang LEFT JOIN.',
    },
  ],
};
