import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e11',
  chapter: 7,
  kind: 'write',
  title: 'Lương nằm ngoài khoảng của chức danh',
  prompt: 'Chị Hạnh ở phòng nhân sự nhờ mình tìm nhân viên có lương thấp hơn mức thấp nhất hoặc cao hơn mức cao nhất của chức danh. Bạn nối `employees` với `jobs` để so.',
  asks: [
    'Hiện `employee_id`, `last_name`, `salary`, `min_salary` và `max_salary`.',
    'Chỉ lấy người có lương thấp hơn `min_salary` hoặc cao hơn `max_salary`.',
    'Xếp theo `employee_id` tăng dần.',
  ],
  database: 'company',
  tables: ['employees', 'jobs'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary\nFROM employees e\n',
    oracle: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary\nFROM employees e\n',
  },
  solution: {
    mysql: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary\nFROM employees e\nINNER JOIN jobs j ON e.job_id = j.job_id\nWHERE e.salary < j.min_salary OR e.salary > j.max_salary\nORDER BY e.employee_id;',
    oracle: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary\nFROM employees e\nINNER JOIN jobs j ON e.job_id = j.job_id\nWHERE e.salary < j.min_salary OR e.salary > j.max_salary\nORDER BY e.employee_id',
  },
  check: { orderMatters: true },
  why: 'JOIN đặt khoảng lương của chức danh cạnh lương của từng người. WHERE giữ người lệch về một trong hai phía.',
  hints: {
    light: 'Nối `employees` với `jobs` theo chức danh trước. Rồi so `salary` với hai column của khoảng lương.',
    specific: 'Nối bằng `e.job_id = j.job_id`. Trong WHERE, nối hai điều kiện bằng OR: thấp hơn `min_salary`, hoặc cao hơn `max_salary`.',
    skeleton: {
      mysql: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary\nFROM employees e\nINNER JOIN jobs j ON e.____ = j.____\nWHERE e.salary < j.____ ____ e.salary > j.____\nORDER BY e.employee_id;',
      oracle: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary\nFROM employees e\nINNER JOIN jobs j ON e.____ = j.____\nWHERE e.salary < j.____ ____ e.salary > j.____\nORDER BY e.employee_id',
    },
  },
  wrong: [
    {
      id: 'only-below',
      sql: {
        mysql: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary FROM employees e INNER JOIN jobs j ON e.job_id = j.job_id WHERE e.salary < j.min_salary ORDER BY e.employee_id',
        oracle: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary FROM employees e INNER JOIN jobs j ON e.job_id = j.job_id WHERE e.salary < j.min_salary ORDER BY e.employee_id',
      },
      hint: 'Query này mới tìm người thấp hơn mức thấp nhất. Thêm OR e.salary > j.max_salary để tìm cả người vượt mức cao nhất.',
    },
    {
      id: 'only-above',
      sql: {
        mysql: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary FROM employees e INNER JOIN jobs j ON e.job_id = j.job_id WHERE e.salary > j.max_salary ORDER BY e.employee_id',
        oracle: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary FROM employees e INNER JOIN jobs j ON e.job_id = j.job_id WHERE e.salary > j.max_salary ORDER BY e.employee_id',
      },
      hint: 'Query này mới tìm người vượt mức cao nhất. Thêm OR e.salary < j.min_salary để tìm cả người thấp hơn mức thấp nhất.',
    },
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary FROM employees e INNER JOIN jobs j ON e.job_id = j.job_id ORDER BY e.employee_id',
        oracle: 'SELECT e.employee_id, e.last_name, e.salary, j.min_salary, j.max_salary FROM employees e INNER JOIN jobs j ON e.job_id = j.job_id ORDER BY e.employee_id',
      },
      hint: 'JOIN đã đúng. Bạn còn thiếu WHERE để chỉ giữ người có lương nằm ngoài khoảng.',
    },
  ],
};
