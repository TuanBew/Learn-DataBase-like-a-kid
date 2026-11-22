import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  chapter: 8,
  dialects: [ 'mysql', 'oracle' ],
  check: { orderMatters: true, aliasMatters: true },
  id: 'c8-e8',
  kind: 'write',
  title: 'Danh bạ gộp nhân viên và khách',
  prompt: 'Lễ tân cần một danh bạ email chung cho cuộc gọi chào năm mới. Danh bạ gồm nhân viên phòng 30 và khách ở Đức (`DE`) hoặc Singapore (`SG`), kèm một column nói row đó là nhân viên hay khách.',
  asks: [
    'Hiện `email` và `contact_type`. `contact_type` là chữ `nhân viên` hoặc `khách`.',
    'Lấy nhân viên có `department_id` bằng 30 và khách có `country_id` là `DE` hoặc `SG`.',
    'Ghép hai nhóm bằng UNION ALL, xếp theo `email` tăng dần.'
  ],
  database: 'company',
  tables: [ 'employees', 'customers' ],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: "SELECT email, 'nhân viên' AS contact_type\n" +
      'FROM employees\n' +
      'WHERE department_id = 30\n' +
      'UNION ALL\n' +
      "SELECT email, 'khách'\n" +
      'FROM customers\n' +
      "WHERE country_id IN ('DE', 'SG')\n" +
      'ORDER BY email;',
    oracle: "SELECT email, 'nhân viên' AS contact_type\n" +
      'FROM employees\n' +
      'WHERE department_id = 30\n' +
      'UNION ALL\n' +
      "SELECT email, 'khách'\n" +
      'FROM customers\n' +
      "WHERE country_id IN ('DE', 'SG')\n" +
      'ORDER BY email'
  },
  why: 'Mỗi query lấy một nhóm người và gắn sẵn chữ `nhân viên` hoặc `khách`. UNION ALL xếp hai kết quả chồng lên nhau, rồi ORDER BY xếp chung theo email.',
  hints: {
    light: 'Mỗi nhóm một query, hai query có cùng số column. Column thứ hai là một chữ cố định cho biết nhóm.',
    specific: "Query đầu lấy `email` và `'nhân viên' AS contact_type` từ `employees`. Query sau lấy `email` và `'khách'` từ `customers`. ORDER BY đứng cuối cùng.",
    skeleton: {
      mysql: "SELECT email, 'nhân viên' AS contact_type\n" +
        'FROM employees\n' +
        'WHERE department_id = 30\n' +
        '____\n' +
        "SELECT email, 'khách'\n" +
        'FROM customers\n' +
        "WHERE country_id IN ('DE', 'SG')\n" +
        'ORDER BY ____',
      oracle: "SELECT email, 'nhân viên' AS contact_type\n" +
        'FROM employees\n' +
        'WHERE department_id = 30\n' +
        '____\n' +
        "SELECT email, 'khách'\n" +
        'FROM customers\n' +
        "WHERE country_id IN ('DE', 'SG')\n" +
        'ORDER BY ____'
    }
  },
  wrong: [
    {
      id: 'all-customers',
      sql: {
        mysql: "SELECT email, 'nhân viên' AS contact_type\n" +
          'FROM employees\n' +
          'WHERE department_id = 30\n' +
          'UNION ALL\n' +
          "SELECT email, 'khách'\n" +
          'FROM customers\n' +
          'ORDER BY email',
        oracle: "SELECT email, 'nhân viên' AS contact_type\n" +
          'FROM employees\n' +
          'WHERE department_id = 30\n' +
          'UNION ALL\n' +
          "SELECT email, 'khách'\n" +
          'FROM customers\n' +
          'ORDER BY email'
      },
      hint: "Query đang lấy khách của mọi quốc gia. Thêm `WHERE country_id IN ('DE', 'SG')` cho query thứ hai."
    },
    {
      id: 'no-type',
      sql: {
        mysql: 'SELECT email\n' +
          'FROM employees\n' +
          'WHERE department_id = 30\n' +
          'UNION ALL\n' +
          'SELECT email\n' +
          'FROM customers\n' +
          "WHERE country_id IN ('DE', 'SG')\n" +
          'ORDER BY email',
        oracle: 'SELECT email\n' +
          'FROM employees\n' +
          'WHERE department_id = 30\n' +
          'UNION ALL\n' +
          'SELECT email\n' +
          'FROM customers\n' +
          "WHERE country_id IN ('DE', 'SG')\n" +
          'ORDER BY email'
      },
      hint: "Danh bạ còn thiếu column nói row là nhân viên hay khách. Thêm `'nhân viên' AS contact_type` và `'khách'` vào hai SELECT."
    },
    {
      id: 'desc',
      sql: {
        mysql: "SELECT email, 'nhân viên' AS contact_type\n" +
          'FROM employees\n' +
          'WHERE department_id = 30\n' +
          'UNION ALL\n' +
          "SELECT email, 'khách'\n" +
          'FROM customers\n' +
          "WHERE country_id IN ('DE', 'SG')\n" +
          'ORDER BY email DESC',
        oracle: "SELECT email, 'nhân viên' AS contact_type\n" +
          'FROM employees\n' +
          'WHERE department_id = 30\n' +
          'UNION ALL\n' +
          "SELECT email, 'khách'\n" +
          'FROM customers\n' +
          "WHERE country_id IN ('DE', 'SG')\n" +
          'ORDER BY email DESC'
      },
      hint: 'DESC xếp email từ Z về A. Bỏ DESC để xếp tăng dần.'
    }
  ]
};
