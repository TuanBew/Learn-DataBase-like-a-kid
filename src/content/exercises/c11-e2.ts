import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c11-e2',
  chapter: 11,
  kind: 'write',
  title: 'Nhân viên phòng Tài chính, viết tên đầy đủ',
  prompt:
    'Đồng nghiệp ở team khác chạy query từ một schema khác nên phải viết tên đầy đủ. Hãy viết lại cho đúng kiểu đó: danh sách nhân viên phòng Tài chính kèm tên phòng, với mọi table viết dạng `CONGTY.tên_table`.',
  asks: [
    'Hiện `employee_id`, `last_name` và `department_name`.',
    'Viết `CONGTY.EMPLOYEES` và `CONGTY.DEPARTMENTS` trong FROM và JOIN.',
    'Chỉ lấy phòng có `department_name` là `Tài chính`.',
  ],
  database: 'company',
  tables: ['employees', 'departments'],
  dialects: ['oracle'],
  starter: {
    oracle: 'SELECT e.employee_id, e.last_name, d.department_name\nFROM CONGTY.EMPLOYEES e\n',
  },
  solution: {
    oracle:
      'SELECT e.employee_id, e.last_name, d.department_name\n' +
      'FROM CONGTY.EMPLOYEES e\n' +
      'JOIN CONGTY.DEPARTMENTS d ON e.department_id = d.department_id\n' +
      "WHERE d.department_name = 'Tài chính'",
  },
  check: { orderMatters: false },
  why: 'Tên đầy đủ `schema.table` chỉ rõ table nằm ở schema nào. JOIN nối hai table qua `department_id`, rồi WHERE giữ phòng Tài chính.',
  hints: {
    light: 'Tên đầy đủ viết `CONGTY.EMPLOYEES`, rồi alias đứng sau, không có AS. JOIN nối hai table như bình thường.',
    specific: 'Nối `CONGTY.DEPARTMENTS d` bằng ON, so `department_id` của hai table. Rồi WHERE lọc `department_name`.',
    skeleton: {
      oracle:
        'SELECT e.employee_id, e.last_name, d.department_name\n' +
        'FROM CONGTY.EMPLOYEES e\n' +
        'JOIN ____ d ON e.department_id = d.____\n' +
        "WHERE d.department_name = '____'",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        oracle:
          'SELECT e.employee_id, e.last_name, d.department_name\n' +
          'FROM CONGTY.EMPLOYEES e\n' +
          'JOIN CONGTY.DEPARTMENTS d ON e.department_id = d.department_id',
      },
      hint: 'Query đang hiện nhân viên của mọi phòng. Thêm WHERE để chỉ giữ phòng Tài chính.',
    },
    {
      id: 'join-manager',
      sql: {
        oracle:
          'SELECT e.employee_id, e.last_name, d.department_name\n' +
          'FROM CONGTY.EMPLOYEES e\n' +
          'JOIN CONGTY.DEPARTMENTS d ON e.employee_id = d.manager_id\n' +
          "WHERE d.department_name = 'Tài chính'",
      },
      hint: 'Điều kiện ON đang nối mã nhân viên với mã trưởng phòng, nên chỉ còn trưởng phòng. Nối `e.department_id` với `d.department_id` để lấy cả phòng.',
    },
  ],
};
