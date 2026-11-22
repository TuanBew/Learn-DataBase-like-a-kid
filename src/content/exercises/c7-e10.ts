import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e10',
  chapter: 7,
  kind: 'write',
  title: 'Nhân viên kèm tên sếp',
  prompt: 'Đây là database Sao Mai bạn đã dựng ở Chương 3, giờ có đủ dữ liệu. Chị Hạnh nhờ mình lập danh sách nhân viên kèm tên người quản lý. Người không có sếp vẫn phải hiện.',
  asks: [
    'Hiện `employee_id`, tên nhân viên `full_name`, và tên sếp đặt là `manager_name`.',
    'Nhân viên không có sếp vẫn hiện, `manager_name` để NULL.',
    'Xếp theo `employee_id` tăng dần.',
  ],
  database: 'saomai',
  tables: ['employees'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name\nFROM employees e\n',
    oracle: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name\nFROM employees e\n',
  },
  solution: {
    mysql: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.employee_id\nORDER BY e.employee_id;',
    oracle: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.employee_id\nORDER BY e.employee_id',
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Một table đóng hai vai nhờ hai alias: `e` là nhân viên, `m` là sếp. LEFT JOIN giữ cả người không có sếp.',
  hints: {
    light: 'Bạn nối `employees` với chính nó, nên mỗi lần dùng cần một alias riêng. Người không có sếp cần kiểu JOIN giữ row.',
    specific: 'Viết `employees e LEFT JOIN employees m`. Điều kiện nối: `e.manager_id = m.employee_id`.',
    skeleton: {
      mysql: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name\nFROM employees e\n____ JOIN employees m ON e.____ = m.____\nORDER BY e.employee_id;',
      oracle: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name\nFROM employees e\n____ JOIN employees m ON e.____ = m.____\nORDER BY e.employee_id',
    },
  },
  wrong: [
    {
      id: 'inner-join',
      sql: {
        mysql: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name FROM employees e INNER JOIN employees m ON e.manager_id = m.employee_id ORDER BY e.employee_id',
        oracle: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name FROM employees e INNER JOIN employees m ON e.manager_id = m.employee_id ORDER BY e.employee_id',
      },
      hint: 'INNER JOIN bỏ mất người không có sếp. Đổi sang LEFT JOIN để giữ họ lại.',
    },
    {
      id: 'reversed-on',
      sql: {
        mysql: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name FROM employees e LEFT JOIN employees m ON e.employee_id = m.manager_id ORDER BY e.employee_id, m.employee_id',
        oracle: 'SELECT e.employee_id, e.full_name, m.full_name AS manager_name FROM employees e LEFT JOIN employees m ON e.employee_id = m.manager_id ORDER BY e.employee_id, m.employee_id',
      },
      hint: 'Điều kiện nối đang đi ngược: `m` thành người dưới quyền của `e`. Sếp của `e` có `employee_id` bằng `e.manager_id`.',
    },
  ],
};
