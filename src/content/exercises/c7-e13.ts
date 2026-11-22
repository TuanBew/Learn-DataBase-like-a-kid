import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e13',
  chapter: 7,
  kind: 'write',
  title: 'Viết lại query Oracle cũ bằng LEFT JOIN',
  prompt: 'Một báo cáo cũ đếm nhân viên của từng phòng, viết bằng dấu phẩy và `(+)`. Bấm Chạy để xem kết quả. Rồi viết lại bằng LEFT JOIN, kết quả giữ nguyên.',
  asks: [
    'Hiện `department_id`, `department_name` và số nhân viên đặt tên `so_nv`.',
    'Phòng chưa có nhân viên vẫn hiện, với `so_nv` bằng 0.',
    'Xếp theo `department_id` tăng dần.',
    'Không dùng dấu phẩy trong FROM và không dùng `(+)`.',
  ],
  database: 'company',
  tables: ['departments', 'employees'],
  dialects: ['oracle'],
  starter: {
    oracle: 'SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS so_nv\nFROM departments d, employees e\nWHERE d.department_id = e.department_id(+)\nGROUP BY d.department_id, d.department_name\nORDER BY d.department_id',
  },
  solution: {
    oracle: 'SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS so_nv\nFROM departments d\nLEFT JOIN employees e ON d.department_id = e.department_id\nGROUP BY d.department_id, d.department_name\nORDER BY d.department_id',
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Table có dấu (+) là table được nối ngoài, tức bên phải của LEFT JOIN. `departments` là bên được giữ đủ, nên đứng trước chữ LEFT JOIN.',
  hints: {
    light: 'Dấu (+) đứng cạnh table có thể thiếu row. Table còn lại được giữ đủ, và nó đứng bên trái LEFT JOIN.',
    specific: 'Viết `FROM departments d LEFT JOIN employees e ON ...`. Chuyển điều kiện trong WHERE sang ON, và bỏ `(+)`.',
    skeleton: {
      oracle: 'SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS so_nv\nFROM departments d\n____ JOIN employees e ON d.department_id = e.____\nGROUP BY d.department_id, d.department_name\nORDER BY d.department_id',
    },
  },
  wrong: [
    {
      id: 'inner-join',
      sql: {
        oracle: 'SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS so_nv FROM departments d INNER JOIN employees e ON d.department_id = e.department_id GROUP BY d.department_id, d.department_name ORDER BY d.department_id',
      },
      hint: 'INNER JOIN làm mất phòng chưa có nhân viên. Báo cáo cũ giữ phòng đó, nên đổi sang LEFT JOIN.',
    },
    {
      id: 'count-star',
      sql: {
        oracle: 'SELECT d.department_id, d.department_name, COUNT(*) AS so_nv FROM departments d LEFT JOIN employees e ON d.department_id = e.department_id GROUP BY d.department_id, d.department_name ORDER BY d.department_id',
      },
      hint: 'Phòng chưa có ai vẫn có một row sau khi nối, nên COUNT(*) ra 1 thay vì 0. Đếm `e.employee_id` để NULL không bị tính.',
    },
  ],
};
