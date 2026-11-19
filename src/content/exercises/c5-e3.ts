import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e3',
  chapter: 5,
  kind: 'write',
  title: 'Mỗi tiệm bán được mấy đơn?',
  prompt: 'Quản lý vùng muốn so các tiệm với nhau. Đếm số đơn đã hoàn tất của từng tiệm. Đơn `cancelled` không tính.',
  asks: [
    'Hiện `store_id` và số đơn, đặt tên column số đơn là `total_orders`.',
    'Chỉ đếm đơn có `status` là `done`.',
    'Mỗi tiệm một row, xếp theo `store_id` tăng dần.',
  ],
  database: 'teashop',
  tables: ['orders'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT store_id, COUNT(*) AS total_orders\nFROM orders\n',
    oracle: 'SELECT store_id, COUNT(*) AS total_orders\nFROM orders\n',
  },
  solution: {
    mysql: "SELECT store_id, COUNT(*) AS total_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nORDER BY store_id;",
    oracle: "SELECT store_id, COUNT(*) AS total_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nORDER BY store_id;",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'WHERE bỏ đơn cancelled trước khi gom. GROUP BY store_id chia các row còn lại thành từng tiệm, và COUNT(*) đếm trong mỗi nhóm.',
  hints: {
    light: 'Muốn mỗi tiệm một kết quả, bạn cần gom các row cùng tiệm vào một nhóm. Đơn cancelled phải bỏ ra trước khi gom.',
    specific: "Dùng WHERE status = 'done' để lọc. Dùng GROUP BY store_id để gom nhóm. Cuối cùng xếp bằng ORDER BY store_id.",
    skeleton: {
      mysql: "SELECT store_id, COUNT(*) AS total_orders\nFROM orders\nWHERE status = ____\nGROUP BY ____\nORDER BY ____;",
      oracle: "SELECT store_id, COUNT(*) AS total_orders\nFROM orders\nWHERE status = ____\nGROUP BY ____\nORDER BY ____;",
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'SELECT store_id, COUNT(*) AS total_orders FROM orders GROUP BY store_id ORDER BY store_id',
        oracle: 'SELECT store_id, COUNT(*) AS total_orders FROM orders GROUP BY store_id ORDER BY store_id',
      },
      hint: "Bạn đã gom đúng theo tiệm. Số đơn đang cao hơn vì còn đếm cả đơn cancelled. Thêm WHERE status = 'done' trước GROUP BY.",
    },
    {
      id: 'no-group',
      sql: {
        mysql: "SELECT COUNT(*) AS total_orders FROM orders WHERE status = 'done'",
        oracle: "SELECT COUNT(*) AS total_orders FROM orders WHERE status = 'done'",
      },
      hint: 'Query này đếm đúng đơn done nhưng gộp mọi tiệm thành một số. Thêm `store_id` vào SELECT và GROUP BY store_id để chia theo tiệm.',
    },
  ],
};
