import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false },
  id: 'c8-e7',
  kind: 'write',
  title: 'Nhân viên Sao Mai chưa có dự án đang chạy',
  prompt: 'Đây là database Sao Mai bạn đã dựng ở Chương 3, giờ có đủ dữ liệu. Quản lý muốn biết ai chưa tham gia dự án nào đang chạy, để giao thêm dự án. Dự án đang chạy là dự án có `end_date` rỗng (NULL).',
  asks: [
    'Hiện `employee_id` và `full_name`.',
    'Dùng NOT EXISTS với subquery trên `assignments` nối `projects`.',
    'Chỉ tính dự án có `end_date` là NULL.'
  ],
  database: 'saomai',
  tables: [ 'employees', 'assignments', 'projects' ],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: 'SELECT e.employee_id, e.full_name\n' +
      'FROM employees AS e\n' +
      'WHERE NOT EXISTS (SELECT 1 FROM assignments a INNER JOIN projects AS p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date IS NULL);',
    oracle: 'SELECT e.employee_id, e.full_name\n' +
      'FROM employees e\n' +
      'WHERE NOT EXISTS (SELECT 1 FROM assignments a INNER JOIN projects p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date IS NULL)'
  },
  why: 'Subquery tìm các lần tham gia dự án đang chạy của từng nhân viên. NOT EXISTS giữ những người mà subquery không tìm thấy gì.',
  hints: {
    light: 'Với mỗi nhân viên, hỏi: có row nào trong `assignments` thuộc dự án đang chạy không? Không có thì giữ.',
    specific: 'Trong subquery, nối `assignments` với `projects` bằng `project_id`. Thêm `a.employee_id = e.employee_id` và `p.end_date IS NULL`.',
    skeleton: {
      mysql: 'SELECT e.employee_id, e.full_name\n' +
        'FROM employees AS e\n' +
        'WHERE NOT EXISTS (SELECT 1 FROM assignments a INNER JOIN projects AS p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date ____)',
      oracle: 'SELECT e.employee_id, e.full_name\n' +
        'FROM employees e\n' +
        'WHERE NOT EXISTS (SELECT 1 FROM assignments a INNER JOIN projects p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date ____)'
    }
  },
  wrong: [
    {
      id: 'exists',
      sql: {
        mysql: 'SELECT e.employee_id, e.full_name\n' +
          'FROM employees AS e\n' +
          'WHERE EXISTS (SELECT 1 FROM assignments a INNER JOIN projects AS p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date IS NULL)',
        oracle: 'SELECT e.employee_id, e.full_name\n' +
          'FROM employees e\n' +
          'WHERE EXISTS (SELECT 1 FROM assignments a INNER JOIN projects p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date IS NULL)'
      },
      hint: 'EXISTS giữ người đang có dự án, ngược với đề. Dùng NOT EXISTS.'
    },
    {
      id: 'no-filter',
      sql: {
        mysql: 'SELECT e.employee_id, e.full_name\n' +
          'FROM employees AS e\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM assignments a WHERE a.employee_id = e.employee_id)',
        oracle: 'SELECT e.employee_id, e.full_name\n' +
          'FROM employees e\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM assignments a WHERE a.employee_id = e.employee_id)'
      },
      hint: 'Query này tính mọi dự án, kể cả dự án đã xong. Nối `projects` và thêm `p.end_date IS NULL` vào subquery.'
    },
    {
      id: 'finished',
      sql: {
        mysql: 'SELECT e.employee_id, e.full_name\n' +
          'FROM employees AS e\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM assignments a INNER JOIN projects AS p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date IS NOT NULL)',
        oracle: 'SELECT e.employee_id, e.full_name\n' +
          'FROM employees e\n' +
          'WHERE NOT EXISTS (SELECT 1 FROM assignments a INNER JOIN projects p ON a.project_id = p.project_id WHERE a.employee_id = e.employee_id AND p.end_date IS NOT NULL)'
      },
      hint: '`IS NOT NULL` chọn dự án đã xong. Dự án đang chạy có `end_date` là NULL, nên dùng `IS NULL`.'
    }
  ]
};
