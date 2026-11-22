import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e5',
  chapter: 5,
  kind: 'translate',
  title: 'Ngày giờ: từ DATE_FORMAT sang Oracle',
  prompt:
    'Query này chạy ở MySQL và lấy các đơn của ngày 2 tháng 3. Viết lại cho chạy ở Oracle, ra cùng kết quả.',
  asks: [
    'Đổi DATE_FORMAT thành TO_CHAR với khuôn `DD/MM/YYYY`.',
    'Đổi DATE(ordered_at) thành TRUNC(ordered_at).',
    'So sánh với `DATE \'2026-03-02\'`, không so với chuỗi trơn.',
  ],
  database: 'teashop',
  tables: ['orders'],
  dialects: ['oracle'],
  from: "SELECT order_id, DATE_FORMAT(ordered_at, '%d/%m/%Y') AS order_day, status\nFROM orders\nWHERE DATE(ordered_at) = '2026-03-02';",
  starter: {
    oracle:
      "SELECT order_id, DATE_FORMAT(ordered_at, '%d/%m/%Y') AS order_day, status\nFROM orders\nWHERE DATE(ordered_at) = '2026-03-02';",
  },
  solution: {
    oracle:
      "SELECT order_id, TO_CHAR(ordered_at, 'DD/MM/YYYY') AS order_day, status\nFROM orders\nWHERE TRUNC(ordered_at) = DATE '2026-03-02'",
  },
  check: { orderMatters: false },
  why: 'TO_CHAR thay DATE_FORMAT để đổi ngày thành chữ. TRUNC cắt phần giờ, và DATE viết trước chuỗi ngày để Oracle hiểu đó là ngày.',
  hints: {
    light: 'Mỗi function ngày của MySQL có một function tương ứng ở Oracle. Khuôn ngày cũng viết khác.',
    specific:
      "DATE_FORMAT thành TO_CHAR, khuôn '%d/%m/%Y' thành 'DD/MM/YYYY'. DATE(ordered_at) thành TRUNC(ordered_at). Chuỗi ngày cần chữ DATE đứng trước.",
    skeleton: {
      oracle: "SELECT order_id, ____(ordered_at, 'DD/MM/YYYY') AS order_day, status\nFROM orders\nWHERE ____(ordered_at) = ____ '2026-03-02'",
    },
  },
  wrong: [
    {
      id: 'no-trunc',
      sql: {
        oracle:
          "SELECT order_id, TO_CHAR(ordered_at, 'DD/MM/YYYY') AS order_day, status FROM orders WHERE ordered_at = DATE '2026-03-02'",
      },
      hint: 'Giờ đặt có cả giờ và phút, nên không đơn nào bằng đúng nửa đêm. Bọc ordered_at trong TRUNC để cắt phần giờ.',
    },
    {
      id: 'wrong-day',
      sql: {
        oracle:
          "SELECT order_id, TO_CHAR(ordered_at, 'DD/MM/YYYY') AS order_day, status FROM orders WHERE TRUNC(ordered_at) = DATE '2026-03-03'",
      },
      hint: 'Query chạy được, nhưng đang lấy ngày 3 tháng 3. Đổi ngày trong DATE thành 2026-03-02.',
    },
    {
      id: 'dash-format',
      sql: {
        oracle:
          "SELECT order_id, TO_CHAR(ordered_at, 'DD-MM-YYYY') AS order_day, status FROM orders WHERE TRUNC(ordered_at) = DATE '2026-03-02'",
      },
      hint: 'Ngày đang hiện với dấu gạch. MySQL hiện dấu gạch chéo, nên đổi khuôn thành DD/MM/YYYY.',
    },
  ],
};
