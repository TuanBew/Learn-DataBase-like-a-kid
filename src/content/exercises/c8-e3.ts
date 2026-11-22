import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: false },
  id: 'c8-e3',
  kind: 'debug',
  title: 'Sửa query nhân viên không quản lý ai',
  prompt: 'Query này muốn tìm nhân viên không quản lý ai, nhưng đang ra 0 row dù công ty có nhiều người như vậy. Bấm Chạy để xem, rồi sửa query.',
  asks: [
    'Hiện `employee_id`, `first_name` và `last_name`.',
    'Chỉ lấy nhân viên có `employee_id` không xuất hiện trong column `manager_id`.',
    'Kết quả phải có row.'
  ],
  database: 'company',
  tables: [ 'employees' ],
  starter: {
    mysql: 'SELECT employee_id, first_name, last_name\n' +
      'FROM employees\n' +
      'WHERE employee_id NOT IN (SELECT manager_id FROM employees);',
    oracle: 'SELECT employee_id, first_name, last_name\n' +
      'FROM employees\n' +
      'WHERE employee_id NOT IN (SELECT manager_id FROM employees)'
  },
  solution: {
    mysql: 'SELECT employee_id, first_name, last_name\n' +
      'FROM employees\n' +
      'WHERE employee_id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL);',
    oracle: 'SELECT employee_id, first_name, last_name\n' +
      'FROM employees\n' +
      'WHERE employee_id NOT IN (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL)'
  },
  why: 'Giám đốc không có sếp, nên `manager_id` của người đó là NULL. Một NULL trong danh sách làm NOT IN không trả row nào. Thêm `WHERE manager_id IS NOT NULL` vào subquery là hết bẫy.',
  hints: {
    light: 'Khi danh sách của NOT IN có NULL, kết quả luôn rỗng. Hãy xem column `manager_id` có giá trị nào đặc biệt.',
    specific: 'Có người không có sếp, nên `manager_id` của họ là NULL. Lọc NULL ngay trong subquery.',
    skeleton: {
      mysql: 'SELECT employee_id, first_name, last_name\n' +
        'FROM employees\n' +
        'WHERE employee_id NOT IN (SELECT manager_id FROM employees WHERE manager_id ____);',
      oracle: 'SELECT employee_id, first_name, last_name\n' +
        'FROM employees\n' +
        'WHERE employee_id NOT IN (SELECT manager_id FROM employees WHERE manager_id ____)'
    }
  },
  wrong: [
    {
      id: 'in',
      sql: {
        mysql: 'SELECT employee_id, first_name, last_name\n' +
          'FROM employees\n' +
          'WHERE employee_id IN (SELECT manager_id FROM employees)',
        oracle: 'SELECT employee_id, first_name, last_name\n' +
          'FROM employees\n' +
          'WHERE employee_id IN (SELECT manager_id FROM employees)'
      },
      hint: 'IN giữ người có quản lý ai đó, ngược với đề. Đổi lại thành NOT IN và lọc NULL trong subquery.'
    },
    {
      id: 'is-null',
      sql: {
        mysql: 'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE manager_id IS NULL',
        oracle: 'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE manager_id IS NULL'
      },
      hint: 'Query này tìm người không có sếp, không phải người không quản lý ai. Giữ NOT IN và thêm lọc NULL vào subquery.'
    },
    {
      id: 'null-trap',
      sql: {
        mysql: 'SELECT employee_id, first_name, last_name\n' +
          'FROM employees\n' +
          'WHERE employee_id NOT IN (SELECT manager_id FROM employees)',
        oracle: 'SELECT employee_id, first_name, last_name\n' +
          'FROM employees\n' +
          'WHERE employee_id NOT IN (SELECT manager_id FROM employees)'
      },
      hint: 'Query vẫn ra 0 row vì danh sách có NULL. Thêm `WHERE manager_id IS NOT NULL` vào subquery.'
    }
  ]
};
