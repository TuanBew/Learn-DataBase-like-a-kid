import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c2-e4',
  chapter: 2,
  kind: 'predict',
  title: 'Đoán khách chưa cho số điện thoại',
  prompt:
    'Mình chạy `WHERE phone IS NULL` trên table `customers`. Đoán các row còn lại, rồi xem Theater để kiểm.',
  asks: [
    'Chọn các row có ô `phone` đang trống.',
    'Bấm Chạy để xem row nào ở lại.',
  ],
  database: 'teashop',
  tables: ['customers'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT * FROM customers WHERE phone IS NULL;',
    oracle: 'SELECT * FROM customers WHERE phone IS NULL',
  },
  solution: {
    mysql: 'SELECT * FROM customers WHERE phone IS NULL;',
    oracle: 'SELECT * FROM customers WHERE phone IS NULL',
  },
  check: { orderMatters: false },
  why: '`IS NULL` giữ row có ô phone trống. Có ba khách chưa cho số: Lê Hoàng Nam, Đinh Bảo Ngọc và Mai Phương Thảo.',
  hints: {
    light: 'Ô trống trong database gọi là NULL. Hãy tìm các khách có ô phone không có giá trị.',
    specific: 'Chỉ row có ô phone trống mới qua được `IS NULL`. Row có số điện thoại thì bị bỏ.',
    skeleton: {
      mysql: 'SELECT * FROM customers WHERE phone ____ NULL;',
      oracle: 'SELECT * FROM customers WHERE phone ____ NULL',
    },
  },
  wrong: [
    {
      id: 'is-not-null',
      sql: {
        mysql: 'SELECT * FROM customers WHERE phone IS NOT NULL',
        oracle: 'SELECT * FROM customers WHERE phone IS NOT NULL',
      },
      hint: 'Query này giữ các khách có số điện thoại, tức là ngược với đề. Bỏ chữ NOT để giữ các khách chưa cho số.',
    },
    {
      id: 'equals-null',
      sql: {
        mysql: 'SELECT * FROM customers WHERE phone = NULL',
        oracle: 'SELECT * FROM customers WHERE phone = NULL',
      },
      hint: 'So sánh bằng `=` với NULL cho kết quả "không biết", nên không row nào ở lại. Hãy đổi `=` thành `IS`.',
    },
  ],
};
