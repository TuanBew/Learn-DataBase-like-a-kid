import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e4',
  chapter: 5,
  kind: 'debug',
  title: 'Sửa query đếm món theo nhóm',
  prompt: 'Query này muốn đếm số món của từng nhóm món, nhưng báo lỗi. Bấm Chạy để đọc lỗi, rồi sửa.',
  asks: ['Mỗi nhóm món một row.', 'Hiện `category` và số món, đặt tên column số món là `items`.'],
  database: 'teashop',
  tables: ['products'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT category, name, COUNT(*) AS items\nFROM products\nGROUP BY category;',
    oracle: 'SELECT category, name, COUNT(*) AS items\nFROM products\nGROUP BY category;',
  },
  solution: {
    mysql: 'SELECT category, COUNT(*) AS items\nFROM products\nGROUP BY category;',
    oracle: 'SELECT category, COUNT(*) AS items\nFROM products\nGROUP BY category;',
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'Mỗi nhóm chỉ ra một row, nên SELECT chỉ được có column nằm trong GROUP BY hoặc function gom. Bỏ `name` thì lỗi biến mất.',
  hints: {
    light: 'Khi có GROUP BY, mỗi nhóm chỉ ra một row. Một nhóm có nhiều tên món thì chọn tên nào?',
    specific: 'Column `name` không nằm trong GROUP BY và không nằm trong function gom. Bỏ `name` khỏi SELECT.',
    skeleton: {
      mysql: 'SELECT category, ____(*) AS items\nFROM products\nGROUP BY ____;',
      oracle: 'SELECT category, ____(*) AS items\nFROM products\nGROUP BY ____;',
    },
  },
  wrong: [
    {
      id: 'group-by-name',
      sql: {
        mysql: 'SELECT category, name, COUNT(*) AS items FROM products GROUP BY category, name',
        oracle: 'SELECT category, name, COUNT(*) AS items FROM products GROUP BY category, name',
      },
      hint: 'Thêm `name` vào GROUP BY làm lỗi biến mất, nhưng mỗi món thành một nhóm riêng. Đề bài cần mỗi nhóm món một row, nên bỏ `name` khỏi SELECT.',
    },
    {
      id: 'no-group',
      sql: {
        mysql: 'SELECT COUNT(*) AS items FROM products',
        oracle: 'SELECT COUNT(*) AS items FROM products',
      },
      hint: 'Query này chạy được nhưng chỉ ra tổng số món. Giữ `category` trong SELECT và GROUP BY category để chia theo nhóm.',
    },
  ],
};
