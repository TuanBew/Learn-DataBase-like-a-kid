import type { SqlExercise } from '../types';

const inner = (order: string, avg: string) =>
  '  SELECT e.employee_id, e.last_name, d.department_name, e.salary,\n' +
  `         ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary${order}) AS rn,\n` +
  `         e.salary - ${avg} AS diff\n` +
  '  FROM employees e\n' +
  '  JOIN departments d ON d.department_id = e.department_id\n' +
  '  WHERE e.department_id IN (30, 40, 50, 60)\n';

const AVG = 'AVG(e.salary) OVER (PARTITION BY e.department_id)';

const full = (order: string, avg: string, limit: string, end: string) =>
  'SELECT employee_id, last_name, department_name, salary, diff\n' +
  'FROM (\n' +
  inner(order, avg) +
  ') t\n' +
  `WHERE rn <= ${limit}\n` +
  `ORDER BY department_name, rn${end}`;

export const exercise: SqlExercise = {
  id: 'c9-boss',
  chapter: 9,
  kind: 'write',
  title: 'Boss: hai người lương cao nhất mỗi phòng',
  prompt:
    'Giám đốc nhân sự muốn danh sách hai người lương cao nhất của mỗi phòng 30, 40, 50 và 60. Mỗi người kèm số tiền lương của họ hơn hay kém mức trung bình của phòng. Bạn ghép window function, subquery và JOIN.',
  asks: [
    'Hiện `employee_id`, `last_name`, `department_name`, `salary` và `diff`.',
    '`diff` là `salary` trừ lương trung bình của cả phòng, tính trước khi lọc.',
    'Mỗi phòng giữ hai người có `salary` cao nhất.',
    'Chỉ lấy phòng 30, 40, 50 và 60. Sắp theo `department_name`, rồi theo thứ hạng.',
  ],
  database: 'company',
  tables: ['employees', 'departments'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: '-- Tính hạng và diff trong subquery, rồi lọc ở query ngoài\nSELECT employee_id, last_name, department_name, salary, diff\nFROM (\n  \n) t\nWHERE rn <= 2\nORDER BY department_name, rn;',
    oracle: '-- Tính hạng và diff trong subquery, rồi lọc ở query ngoài\nSELECT employee_id, last_name, department_name, salary, diff\nFROM (\n  \n) t\nWHERE rn <= 2\nORDER BY department_name, rn',
  },
  solution: {
    mysql: full(' DESC', AVG, '2', ';'),
    oracle: full(' DESC', AVG, '2', ''),
  },
  check: { orderMatters: true },
  why: 'Subquery tính `rn` và `diff` khi cả phòng còn đủ row, nên trung bình đúng. Query ngoài mới giữ `rn <= 2`.',
  hints: {
    light: 'Window function tính trước khi lọc `rn`. Vậy hãy tính `rn` và `diff` trong subquery, rồi lọc ở query ngoài.',
    specific: 'Trong subquery, dùng ROW_NUMBER() OVER (PARTITION BY ... ORDER BY salary DESC) cho `rn`, và `salary` trừ AVG(salary) OVER (PARTITION BY ...) cho `diff`. JOIN `departments` để có tên phòng.',
    skeleton: {
      mysql: full(' DESC', AVG, '2', ';').replace('ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC)', 'ROW_NUMBER() OVER (PARTITION BY ____ ORDER BY ____ DESC)').replace(AVG, 'AVG(e.salary) OVER (PARTITION BY ____)'),
      oracle: full(' DESC', AVG, '2', '').replace('ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC)', 'ROW_NUMBER() OVER (PARTITION BY ____ ORDER BY ____ DESC)').replace(AVG, 'AVG(e.salary) OVER (PARTITION BY ____)'),
    },
  },
  wrong: [
    {
      id: 'ascending',
      sql: {
        mysql: full('', AVG, '2', ''),
        oracle: full('', AVG, '2', ''),
      },
      hint: 'ORDER BY mặc định xếp tăng dần, nên query lấy hai người lương thấp nhất. Thêm DESC sau `e.salary`.',
    },
    {
      id: 'company-avg',
      sql: {
        mysql: full(' DESC', 'AVG(e.salary) OVER ()', '2', ''),
        oracle: full(' DESC', 'AVG(e.salary) OVER ()', '2', ''),
      },
      hint: '`diff` đang so với trung bình chung của bốn phòng. Thêm PARTITION BY `e.department_id` vào OVER của AVG để so với phòng của từng người.',
    },
    {
      id: 'only-one',
      sql: {
        mysql: full(' DESC', AVG, '1', ''),
        oracle: full(' DESC', AVG, '1', ''),
      },
      hint: 'Mỗi phòng mới có một người. Đề cần hai, nên đổi `rn <= 1` thành `rn <= 2`.',
    },
  ],
};
