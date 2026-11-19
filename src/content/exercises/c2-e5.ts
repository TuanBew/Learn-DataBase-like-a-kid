import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c2-e5',
  chapter: 2,
  kind: 'predict',
  title: 'Đoán các món đã có calo',
  prompt:
    'Mình chạy `WHERE calories IS NOT NULL` trên table `products`. Đoán các row còn lại, rồi xem Theater để kiểm.',
  asks: [
    'Chọn các món có ô `calories` đã có số.',
    'Bấm Chạy để xem row nào ở lại.',
  ],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT * FROM products WHERE calories IS NOT NULL;',
    oracle: 'SELECT * FROM products WHERE calories IS NOT NULL',
  },
  solution: {
    mysql: 'SELECT * FROM products WHERE calories IS NOT NULL;',
    oracle: 'SELECT * FROM products WHERE calories IS NOT NULL',
  },
  check: { orderMatters: false },
  why: '`IS NOT NULL` giữ row có ô calories đã có số. Ba món chưa ghi calo bị bỏ: Trà vải hoa hồng, Pudding trứng và Cà phê cacao đá xay.',
  hints: {
    light: 'Ô chưa có giá trị là NULL. Hãy loại các món có ô calories trống.',
    specific: 'Chỉ món nào có số trong ô calories mới qua được `IS NOT NULL`. Món có ô trống thì bị bỏ.',
    skeleton: {
      mysql: 'SELECT * FROM products WHERE calories IS ____ NULL;',
      oracle: 'SELECT * FROM products WHERE calories IS ____ NULL',
    },
  },
  wrong: [
    {
      id: 'is-null',
      sql: {
        mysql: 'SELECT * FROM products WHERE calories IS NULL',
        oracle: 'SELECT * FROM products WHERE calories IS NULL',
      },
      hint: 'Query này giữ các món chưa có calo, tức là ngược với đề. Thêm chữ NOT để giữ các món đã có calo.',
    },
    {
      id: 'not-equals-null',
      sql: {
        mysql: 'SELECT * FROM products WHERE calories != NULL',
        oracle: 'SELECT * FROM products WHERE calories != NULL',
      },
      hint: 'So sánh với NULL bằng `!=` cũng cho kết quả "không biết", nên không row nào ở lại. Hãy dùng `IS NOT NULL`.',
    },
  ],
};
