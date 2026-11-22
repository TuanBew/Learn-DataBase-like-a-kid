import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false },
  id: 'c8-e2',
  kind: 'write',
  title: 'Lương cao hơn trung bình cả công ty',
  prompt: 'Phòng nhân sự nhờ mình tìm những người đang có lương cao hơn mức lương trung bình của cả công ty. Hãy tính mức trung bình đó bằng một subquery.',
  asks: [
    'Hiện `employee_id`, `first_name`, `last_name` và `salary`.',
    'Chỉ lấy nhân viên có `salary` lớn hơn trung bình `salary` của toàn table `employees`.'
  ],
  database: 'company',
  tables: [ 'employees' ],
  starter: {
    mysql: 'SELECT employee_id, first_name, last_name, salary\nFROM employees\nWHERE ',
    oracle: 'SELECT employee_id, first_name, last_name, salary\nFROM employees\nWHERE '
  },
  solution: {
    mysql: 'SELECT employee_id, first_name, last_name, salary\n' +
      'FROM employees\n' +
      'WHERE salary > (SELECT AVG(salary) FROM employees);',
    oracle: 'SELECT employee_id, first_name, last_name, salary\n' +
      'FROM employees\n' +
      'WHERE salary > (SELECT AVG(salary) FROM employees)'
  },
  why: 'Subquery tính một con số duy nhất là lương trung bình. Query ngoài giữ các row có `salary` lớn hơn con số đó.',
  hints: {
    light: 'Subquery trả về một giá trị, nên bạn so sánh nó bằng `>` như một con số bình thường.',
    specific: 'Đặt trong ngoặc một query tính `AVG(salary)` trên `employees`, rồi so `salary` với nó trong WHERE.',
    skeleton: {
      mysql: 'SELECT employee_id, first_name, last_name, salary\n' +
        'FROM employees\n' +
        'WHERE salary > (SELECT ____(salary) FROM employees);',
      oracle: 'SELECT employee_id, first_name, last_name, salary\n' +
        'FROM employees\n' +
        'WHERE salary > (SELECT ____(salary) FROM employees)'
    }
  },
  wrong: [
    {
      id: 'lower',
      sql: {
        mysql: 'SELECT employee_id, first_name, last_name, salary\n' +
          'FROM employees\n' +
          'WHERE salary < (SELECT AVG(salary) FROM employees)',
        oracle: 'SELECT employee_id, first_name, last_name, salary\n' +
          'FROM employees\n' +
          'WHERE salary < (SELECT AVG(salary) FROM employees)'
      },
      hint: 'Dấu `<` giữ người có lương thấp hơn trung bình. Đổi thành `>` để lấy người cao hơn.'
    },
    {
      id: 'min',
      sql: {
        mysql: 'SELECT employee_id, first_name, last_name, salary\n' +
          'FROM employees\n' +
          'WHERE salary > (SELECT MIN(salary) FROM employees)',
        oracle: 'SELECT employee_id, first_name, last_name, salary\n' +
          'FROM employees\n' +
          'WHERE salary > (SELECT MIN(salary) FROM employees)'
      },
      hint: '`MIN` trả về lương thấp nhất, nên gần như ai cũng lớn hơn. Đổi `MIN` thành `AVG`.'
    }
  ]
};
