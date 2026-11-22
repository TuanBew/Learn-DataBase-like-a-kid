import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e3',
  chapter: 5,
  kind: 'write',
  title: 'Tên tiệm viết hoa và độ dài',
  prompt:
    'Mình làm biển hiệu cho các tiệm. Mình cần tên tiệm viết hoa và số ký tự của tên. MySQL và Oracle đếm ký tự bằng hai function khác nhau.',
  asks: [
    'Hiện `name`, tên viết hoa đặt là `upper_name`, và số ký tự đặt là `chars`.',
    'Đếm ký tự, không đếm byte. MySQL dùng CHAR_LENGTH, Oracle dùng LENGTH.',
    'Lấy mọi tiệm trong table stores.',
  ],
  database: 'teashop',
  tables: ['stores'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT name\nFROM stores\n',
    oracle: 'SELECT name\nFROM stores\n',
  },
  solution: {
    mysql: 'SELECT name, UPPER(name) AS upper_name, CHAR_LENGTH(name) AS chars\nFROM stores;',
    oracle: 'SELECT name, UPPER(name) AS upper_name, LENGTH(name) AS chars\nFROM stores',
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'UPPER đổi chữ thành chữ hoa. Function đếm ký tự cho ra độ dài của tên: CHAR_LENGTH ở MySQL, LENGTH ở Oracle.',
  hints: {
    light: 'Function nhận một giá trị và trả về giá trị mới. Viết tên column trong ngoặc.',
    specific:
      'Dùng UPPER(name) cho chữ hoa. MySQL: LENGTH đếm byte nên dùng CHAR_LENGTH(name). Oracle: LENGTH(name) đã đếm ký tự.',
    skeleton: {
      mysql: 'SELECT name, ____(name) AS upper_name, ____(name) AS chars\nFROM stores;',
      oracle: 'SELECT name, ____(name) AS upper_name, ____(name) AS chars\nFROM stores',
    },
  },
  wrong: [
    {
      id: 'lower',
      sql: {
        mysql: 'SELECT name, LOWER(name) AS upper_name, CHAR_LENGTH(name) AS chars FROM stores',
        oracle: 'SELECT name, LOWER(name) AS upper_name, LENGTH(name) AS chars FROM stores',
      },
      hint: 'LOWER đổi sang chữ thường. Đổi thành UPPER để ra chữ hoa.',
    },
    {
      id: 'no-length',
      sql: {
        mysql: 'SELECT name, UPPER(name) AS upper_name, UPPER(name) AS chars FROM stores',
        oracle: 'SELECT name, UPPER(name) AS upper_name, UPPER(name) AS chars FROM stores',
      },
      hint: 'Column chars đang chứa tên viết hoa, không phải số ký tự. Dùng function đếm độ dài cho column này.',
    },
  ],
};
