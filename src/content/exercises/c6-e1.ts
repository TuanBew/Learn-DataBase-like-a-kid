import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e1',
  chapter: 6,
  kind: 'write',
  title: 'Thực đơn có bao nhiêu món?',
  prompt: 'Chủ tiệm muốn biết thực đơn đang có bao nhiêu món. Có món chưa ghi calo, và chủ tiệm vẫn muốn đếm các món đó.',
  asks: ['Kết quả chỉ có một row và một giá trị.', 'Đếm mọi món, kể cả món có `calories` là NULL.'],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: '', oracle: '' },
  solution: {
    mysql: 'SELECT COUNT(*)\nFROM products;',
    oracle: 'SELECT COUNT(*)\nFROM products;',
  },
  check: { orderMatters: false },
  why: '`COUNT(*)` đếm mọi row, không quan tâm column nào có NULL. Vì vậy mọi món đều được đếm.',
  hints: {
    light: 'Bài này cần một function gom để đếm row. Chọn dạng đếm cả row có NULL.',
    specific: 'Dùng `COUNT(*)`. Dạng `COUNT(column)` bỏ qua row có NULL ở column đó.',
    skeleton: {
      mysql: 'SELECT COUNT(____)\nFROM products;',
      oracle: 'SELECT COUNT(____)\nFROM products;',
    },
  },
  wrong: [
    {
      id: 'count-column',
      sql: {
        mysql: 'SELECT COUNT(calories) FROM products',
        oracle: 'SELECT COUNT(calories) FROM products',
      },
      hint: 'Gần đúng rồi. `COUNT(calories)` bỏ qua các món chưa ghi calo, nên kết quả thiếu vài món. Đổi sang `COUNT(*)` để đếm mọi row.',
    },
    {
      id: 'count-distinct',
      sql: {
        mysql: 'SELECT COUNT(DISTINCT category) FROM products',
        oracle: 'SELECT COUNT(DISTINCT category) FROM products',
      },
      hint: '`COUNT(DISTINCT category)` đếm số nhóm món khác nhau, không đếm món. Bỏ DISTINCT và đếm bằng `COUNT(*)`.',
    },
  ],
};
