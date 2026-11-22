import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false },
  id: 'c8-e5',
  kind: 'write',
  title: 'Lương cao hơn trung bình của chính phòng mình',
  prompt: 'Trưởng phòng nhân sự muốn so mỗi người với phòng của họ. Hãy tìm những nhân viên có lương cao hơn lương trung bình của chính phòng mình, bằng subquery phụ thuộc.',
  asks: [
    'Hiện `employee_id`, `last_name`, `department_id` và `salary`.',
    'Subquery tính `AVG(salary)` của các nhân viên cùng `department_id` với row đang xét.',
    'Chỉ lấy nhân viên có `salary` lớn hơn con số đó.'
  ],
  database: 'company',
  tables: [ 'employees' ],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
      'FROM employees AS e\n' +
      'WHERE e.salary > (SELECT AVG(x.salary) FROM employees AS x WHERE x.department_id = e.department_id);',
    oracle: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
      'FROM employees e\n' +
      'WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.department_id = e.department_id)'
  },
  why: 'Subquery chạy lại cho từng nhân viên và chỉ nhìn phòng của người đó. Mỗi người được so với trung bình phòng mình. Người chưa có phòng không có con số để so, nên không hiện.',
  hints: {
    light: 'Subquery phụ thuộc nhìn được row của query ngoài. Dùng alias để chỉ đúng table nào.',
    specific: 'Cho `employees` hai alias, `e` ở ngoài và `x` ở trong. Trong subquery, đặt `x.department_id = e.department_id`.',
    skeleton: {
      mysql: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
        'FROM employees AS e\n' +
        'WHERE e.salary > (SELECT AVG(x.salary) FROM employees AS x WHERE x.department_id = ____.department_id)',
      oracle: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
        'FROM employees e\n' +
        'WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.department_id = ____.department_id)'
    }
  },
  wrong: [
    {
      id: 'global',
      sql: {
        mysql: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
          'FROM employees AS e\n' +
          'WHERE e.salary > (SELECT AVG(salary) FROM employees)',
        oracle: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
          'FROM employees e\n' +
          'WHERE e.salary > (SELECT AVG(salary) FROM employees)'
      },
      hint: 'Subquery này tính trung bình cả công ty, chưa nhìn từng phòng. Thêm `WHERE x.department_id = e.department_id` vào subquery.'
    },
    {
      id: 'lower',
      sql: {
        mysql: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
          'FROM employees AS e\n' +
          'WHERE e.salary < (SELECT AVG(x.salary) FROM employees AS x WHERE x.department_id = e.department_id)',
        oracle: 'SELECT e.employee_id, e.last_name, e.department_id, e.salary\n' +
          'FROM employees e\n' +
          'WHERE e.salary < (SELECT AVG(x.salary) FROM employees x WHERE x.department_id = e.department_id)'
      },
      hint: 'Dấu `<` giữ người thấp hơn trung bình phòng. Đổi thành `>`.'
    }
  ]
};
