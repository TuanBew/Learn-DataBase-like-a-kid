import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c6-e5',
  chapter: 6,
  kind: 'order',
  title: 'Xếp query tiệm bán nhiều đơn',
  prompt: 'Tìm các tiệm có từ 4 đơn hoàn tất trở lên, tiệm bán nhiều đơn đứng trước. Bấm các mẩu theo thứ tự viết đúng của một query.',
  asks: [
    'Hiện `store_id` và số đơn `done_orders`.',
    'Chỉ đếm đơn `done`, chỉ giữ tiệm có từ 4 đơn trở lên.',
    'Tiệm nhiều đơn hơn đứng trước. Hai tiệm bằng nhau thì `store_id` nhỏ đứng trước.',
  ],
  database: 'teashop',
  tables: ['orders'],
  dialects: ['mysql', 'oracle'],
  starter: { mysql: '', oracle: '' },
  pieces: {
    mysql: [
      'SELECT store_id, COUNT(*) AS done_orders',
      'FROM orders',
      "WHERE status = 'done'",
      'GROUP BY store_id',
      'HAVING COUNT(*) >= 4',
      'ORDER BY done_orders DESC, store_id',
    ],
    oracle: [
      'SELECT store_id, COUNT(*) AS done_orders',
      'FROM orders',
      "WHERE status = 'done'",
      'GROUP BY store_id',
      'HAVING COUNT(*) >= 4',
      'ORDER BY done_orders DESC, store_id',
    ],
  },
  solution: {
    mysql: "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 4\nORDER BY done_orders DESC, store_id",
    oracle: "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 4\nORDER BY done_orders DESC, store_id",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'WHERE lọc row trước khi gom. GROUP BY chia nhóm, HAVING lọc nhóm, rồi ORDER BY xếp kết quả. Lúc chạy, chỉ SELECT đổi chỗ: database chạy SELECT sau HAVING.',
  hints: {
    light: 'Query chạy theo thứ tự: lấy table, lọc row, chia nhóm, lọc nhóm, rồi xếp. Mỗi clause đứng đúng chỗ đó.',
    specific: 'SELECT đứng đầu, FROM đứng ngay sau. WHERE đứng trước GROUP BY, còn HAVING đứng sau GROUP BY. ORDER BY đứng cuối.',
    skeleton: {
      mysql: '____\n____\n____\n____\n____\n____',
      oracle: '____\n____\n____\n____\n____\n____',
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT store_id, COUNT(*) AS done_orders FROM orders GROUP BY store_id HAVING COUNT(*) >= 4 ORDER BY done_orders DESC, store_id',
        oracle: 'SELECT store_id, COUNT(*) AS done_orders FROM orders GROUP BY store_id HAVING COUNT(*) >= 4 ORDER BY done_orders DESC, store_id',
      },
      hint: "Query này thiếu WHERE status = 'done', nên đơn cancelled vẫn được đếm. Thêm WHERE trước GROUP BY.",
    },
    {
      id: 'having-too-high',
      sql: {
        mysql: "SELECT store_id, COUNT(*) AS done_orders FROM orders WHERE status = 'done' GROUP BY store_id HAVING COUNT(*) > 4 ORDER BY done_orders DESC, store_id",
        oracle: "SELECT store_id, COUNT(*) AS done_orders FROM orders WHERE status = 'done' GROUP BY store_id HAVING COUNT(*) > 4 ORDER BY done_orders DESC, store_id",
      },
      hint: 'Đề bài cần từ 4 đơn trở lên, tức là `>= 4`. Dấu `> 4` làm mất các tiệm có đúng 4 đơn.',
    },
  ],
};
