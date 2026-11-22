import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c4-e1',
  chapter: 4,
  kind: 'write',
  title: 'Tên và thành phố của khách',
  prompt: 'Mình muốn gửi thiệp cảm ơn tới khách thành viên. Lấy tên và thành phố của mọi khách.',
  asks: ['Chỉ hiện hai column: `full_name` và `city`.', 'Lấy mọi row của table customers.'],
  database: 'teashop',
  tables: ['customers'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT \nFROM customers\n',
    oracle: 'SELECT \nFROM customers\n',
  },
  solution: {
    mysql: 'SELECT full_name, city\nFROM customers;',
    oracle: 'SELECT full_name, city\nFROM customers',
  },
  check: { orderMatters: false },
  why: 'SELECT liệt kê đúng hai column cần xem. FROM nói table customers. Query không có điều kiện nên mọi row đều hiện.',
  hints: {
    light: 'SELECT nói bạn muốn xem column nào. FROM nói column đó nằm ở table nào.',
    specific: 'Sau SELECT, viết hai tên column cách nhau bằng dấu phẩy: full_name và city. Sau FROM, viết customers.',
    skeleton: {
      mysql: 'SELECT ____, ____\nFROM ____;',
      oracle: 'SELECT ____, ____\nFROM ____',
    },
  },
  wrong: [
    {
      id: 'star',
      sql: { mysql: 'SELECT * FROM customers', oracle: 'SELECT * FROM customers' },
      hint: 'Dấu `*` lấy mọi column, nên kết quả dư vài column. Thay `*` bằng hai tên column bạn cần.',
    },
    {
      id: 'phone',
      sql: { mysql: 'SELECT full_name, phone FROM customers', oracle: 'SELECT full_name, phone FROM customers' },
      hint: 'Bạn lấy đúng tên khách rồi. Column thứ hai đang là phone, còn đề bài cần city.',
    },
  ],
};
