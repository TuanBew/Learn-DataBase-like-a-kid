import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c7-e2',
  chapter: 7,
  kind: 'rehearsal',
  title: 'Xóa các món trong đơn bị hủy',
  prompt:
    'Đơn 1012 bị hủy, tiệm muốn xóa các món trong đơn này khỏi `order_items`. Lệnh DELETE trong editor đang thiếu WHERE. Thêm WHERE để chỉ xóa đúng đơn 1012.',
  asks: [
    'Chỉ sửa table `order_items`.',
    'Chỉ xóa row có `order_id` bằng 1012.',
    'Các đơn khác giữ nguyên.',
  ],
  database: 'teashop',
  tables: ['order_items'],
  target: 'order_items',
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'DELETE FROM order_items',
    oracle: 'DELETE FROM order_items',
  },
  solution: {
    mysql: 'DELETE FROM order_items\nWHERE order_id = 1012;',
    oracle: 'DELETE FROM order_items\nWHERE order_id = 1012;',
  },
  check: { orderMatters: false },
  why: 'WHERE order_id = 1012 giữ lại đúng các món trong đơn bị hủy. DELETE chỉ xóa các row đó.',
  hints: {
    light: 'DELETE không có WHERE xóa mọi row. Chạy SELECT với đúng WHERE đó trước, rồi mới đổi thành DELETE.',
    specific: 'Thêm WHERE sau tên table. So sánh column `order_id` với 1012.',
    skeleton: {
      mysql: 'DELETE FROM order_items\nWHERE ____ = ____;',
      oracle: 'DELETE FROM order_items\nWHERE ____ = ____;',
    },
  },
  wrong: [
    {
      id: 'no-where',
      sql: {
        mysql: 'DELETE FROM order_items',
        oracle: 'DELETE FROM order_items',
      },
      hint: 'Lệnh này xóa sạch mọi món của mọi đơn. Chỉ cần thêm WHERE order_id = 1012. Chạy SELECT với WHERE đó trước sẽ cho bạn thấy đúng 2 row.',
    },
    {
      id: 'wrong-order',
      sql: {
        mysql: 'DELETE FROM order_items WHERE order_id = 1006',
        oracle: 'DELETE FROM order_items WHERE order_id = 1006',
      },
      hint: 'WHERE của bạn đúng cú pháp nhưng đang chọn đơn 1006. Đề bài nói đơn 1012. Kiểm lại số đơn trước khi xóa nhé.',
    },
  ],
};
