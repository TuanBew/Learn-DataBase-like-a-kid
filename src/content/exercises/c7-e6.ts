import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e6',
  chapter: 7,
  kind: 'debug',
  title: 'Sửa lỗi ORA-00979',
  prompt:
    'Query Oracle này đếm số nhân viên của mỗi phòng. Khi bấm Chạy, bạn sẽ thấy lỗi ORA-00979. Sửa query để ra mỗi phòng một row.',
  asks: [
    'Mỗi `department_id` hiện một row.',
    'Kèm số nhân viên của phòng đó.',
    'Không hiện tên từng nhân viên.',
    'Nhân viên chưa có phòng vẫn tính thành một nhóm.',
  ],
  database: 'hr',
  tables: ['employees'],
  dialects: ['oracle'],
  starter: {
    oracle:
      'SELECT department_id, last_name, COUNT(*) AS staff_count\nFROM employees\nGROUP BY department_id\nORDER BY department_id;',
  },
  solution: {
    oracle:
      'SELECT department_id, COUNT(*) AS staff_count\nFROM employees\nGROUP BY department_id\nORDER BY department_id;',
  },
  check: { orderMatters: false },
  why: 'Khi có GROUP BY, mỗi column ở SELECT phải nằm trong GROUP BY hoặc nằm trong function gom. last_name không thuộc cả hai nên Oracle báo ORA-00979.',
  hints: {
    light: 'ORA-00979 nghĩa là SELECT có một column mà GROUP BY chưa nhắc tới. Mỗi phòng gom thành một row, nên không thể hiện thêm tên từng người.',
    specific: 'Bỏ `last_name` khỏi SELECT. Giữ `department_id` và COUNT(*).',
    skeleton: {
      oracle: 'SELECT ____, COUNT(*) AS staff_count\nFROM employees\nGROUP BY ____\nORDER BY ____;',
    },
  },
  wrong: [
    {
      id: 'no-null-group',
      sql: {
        oracle:
          'SELECT department_id, COUNT(*) AS staff_count FROM employees WHERE department_id IS NOT NULL GROUP BY department_id ORDER BY department_id',
      },
      hint: 'Query chạy được, nhưng bạn đã bỏ nhân viên chưa có phòng. Bỏ WHERE để nhóm NULL vẫn hiện.',
    },
    {
      id: 'group-by-name',
      sql: {
        oracle:
          'SELECT department_id, last_name, COUNT(*) AS staff_count FROM employees GROUP BY department_id, last_name ORDER BY department_id',
      },
      hint: 'Thêm last_name vào GROUP BY làm hết lỗi, nhưng mỗi người thành một nhóm riêng. Đề bài cần mỗi phòng một row, nên bỏ last_name.',
    },
    {
      id: 'count-column',
      sql: {
        oracle:
          'SELECT department_id, COUNT(department_id) AS staff_count FROM employees GROUP BY department_id ORDER BY department_id',
      },
      hint: 'COUNT(department_id) không đếm giá trị NULL, nên nhóm chưa có phòng ra 0. Dùng COUNT(*) để đếm mọi row.',
    },
  ],
};
