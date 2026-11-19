import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-boss',
  chapter: 7,
  kind: 'write',
  title: 'Boss: báo cáo lương theo phòng ban',
  prompt:
    'Giám đốc nhân sự cần báo cáo lương theo phòng ban. Viết một query Oracle gom mọi bước bạn đã học.',
  asks: [
    'Mỗi phòng hiện: `department_name`, `city`, số nhân viên, lương trung bình làm tròn, lương cao nhất.',
    'Chỉ lấy phòng có từ 2 nhân viên trở lên.',
    'Phòng có lương trung bình cao đứng trước. Hai phòng bằng nhau thì xếp theo tên phòng.',
    'Lấy 5 phòng đầu.',
  ],
  database: 'hr',
  tables: ['employees', 'departments', 'locations'],
  dialects: ['oracle'],
  starter: {
    oracle: 'SELECT d.department_name, l.city\nFROM employees e\n',
  },
  solution: {
    oracle:
      'SELECT d.department_name, l.city,\n       COUNT(*) AS employee_count,\n       ROUND(AVG(e.salary)) AS avg_salary,\n       MAX(e.salary) AS max_salary\nFROM employees e\nJOIN departments d ON e.department_id = d.department_id\nJOIN locations l ON d.location_id = l.location_id\nGROUP BY d.department_name, l.city\nHAVING COUNT(*) >= 2\nORDER BY AVG(e.salary) DESC, d.department_name\nFETCH FIRST 5 ROWS ONLY;',
  },
  check: { orderMatters: true },
  why: 'JOIN nối nhân viên với phòng và địa điểm. GROUP BY gom theo phòng, HAVING giữ phòng từ 2 người, ORDER BY xếp lương trung bình giảm dần, FETCH FIRST lấy 5 phòng đầu.',
  hints: {
    light: 'Đi theo thứ tự viết của query: SELECT, FROM với hai JOIN, GROUP BY, HAVING, ORDER BY, rồi FETCH FIRST.',
    specific: 'Lọc phòng theo số nhân viên cần HAVING COUNT(*) >= 2, vì WHERE chạy trước khi gom. Column không nằm trong function gom phải có mặt trong GROUP BY. Sắp giảm dần theo AVG(e.salary).',
    skeleton: {
      oracle:
        'SELECT d.department_name, l.city,\n       COUNT(*) AS employee_count,\n       ROUND(AVG(e.salary)) AS avg_salary,\n       MAX(e.salary) AS max_salary\nFROM employees e\nJOIN departments d ON ____\nJOIN locations l ON ____\nGROUP BY ____, ____\nHAVING COUNT(*) >= ____\nORDER BY AVG(e.salary) ____, d.department_name\nFETCH FIRST ____ ROWS ONLY;',
    },
  },
  wrong: [
    {
      id: 'asc',
      sql: {
        oracle:
          'SELECT d.department_name, l.city, COUNT(*) AS employee_count, ROUND(AVG(e.salary)) AS avg_salary, MAX(e.salary) AS max_salary FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id GROUP BY d.department_name, l.city HAVING COUNT(*) >= 2 ORDER BY AVG(e.salary), d.department_name FETCH FIRST 5 ROWS ONLY',
      },
      hint: 'Mọi bước đúng, chỉ thứ tự ngược. ORDER BY mặc định tăng dần, nên đang lấy 5 phòng lương thấp nhất. Thêm DESC sau AVG(e.salary).',
    },
    {
      id: 'having-gt-2',
      sql: {
        oracle:
          'SELECT d.department_name, l.city, COUNT(*) AS employee_count, ROUND(AVG(e.salary)) AS avg_salary, MAX(e.salary) AS max_salary FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id GROUP BY d.department_name, l.city HAVING COUNT(*) > 2 ORDER BY AVG(e.salary) DESC, d.department_name FETCH FIRST 5 ROWS ONLY',
      },
      hint: 'Phòng có đúng 2 nhân viên đang bị loại. "Từ 2 trở lên" nghĩa là `>= 2`.',
    },
    {
      id: 'no-fetch',
      sql: {
        oracle:
          'SELECT d.department_name, l.city, COUNT(*) AS employee_count, ROUND(AVG(e.salary)) AS avg_salary, MAX(e.salary) AS max_salary FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id GROUP BY d.department_name, l.city HAVING COUNT(*) >= 2 ORDER BY AVG(e.salary) DESC, d.department_name',
      },
      hint: 'Lọc và sắp xếp đều đúng rồi. Còn thiếu FETCH FIRST 5 ROWS ONLY ở cuối để giữ 5 phòng đầu.',
    },
    {
      id: 'no-having',
      sql: {
        oracle:
          'SELECT d.department_name, l.city, COUNT(*) AS employee_count, ROUND(AVG(e.salary)) AS avg_salary, MAX(e.salary) AS max_salary FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id GROUP BY d.department_name, l.city ORDER BY AVG(e.salary) DESC, d.department_name',
      },
      hint: 'Phòng chỉ có 1 nhân viên đang lọt vào, và còn thiếu FETCH FIRST. Thêm HAVING COUNT(*) >= 2 sau GROUP BY để lọc phòng, rồi lấy 5 row đầu.',
    },
    {
      id: 'no-round',
      sql: {
        oracle:
          'SELECT d.department_name, l.city, COUNT(*) AS employee_count, AVG(e.salary) AS avg_salary, MAX(e.salary) AS max_salary FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id GROUP BY d.department_name, l.city HAVING COUNT(*) >= 2 ORDER BY AVG(e.salary) DESC, d.department_name FETCH FIRST 5 ROWS ONLY',
      },
      hint: 'Gần xong rồi. Lương trung bình còn số lẻ. Bọc AVG(e.salary) trong ROUND ở SELECT.',
    },
  ],
};
