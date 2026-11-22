import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c5-e4',
  chapter: 5,
  kind: 'translate',
  title: 'Nối chuỗi: từ CONCAT sang Oracle',
  prompt:
    'Query này chạy ở MySQL và nối chức vụ với tên nhân viên. Viết lại cho chạy ở Oracle, ra cùng kết quả.',
  asks: [
    'Nối chuỗi bằng `||`, không dùng CONCAT.',
    'Giữ column `badge`, dấu hai chấm và dấu cách giữa chức vụ và tên.',
    'Giữ điều kiện chỉ lấy tiệm số 3.',
  ],
  database: 'teashop',
  tables: ['staff'],
  dialects: ['oracle'],
  from: "SELECT staff_id, CONCAT(role, ': ', full_name) AS badge\nFROM staff\nWHERE store_id = 3;",
  starter: {
    oracle: "SELECT staff_id, CONCAT(role, ': ', full_name) AS badge\nFROM staff\nWHERE store_id = 3;",
  },
  solution: {
    oracle: "SELECT staff_id, role || ': ' || full_name AS badge\nFROM staff\nWHERE store_id = 3",
  },
  check: { orderMatters: false },
  why: 'Oracle nối chuỗi bằng `||`. CONCAT ở Oracle chỉ nhận hai tham số, nên query ba phần cần `||`.',
  hints: {
    light: 'MySQL nối bằng CONCAT. Oracle nối bằng dấu `||` đặt giữa các phần.',
    specific: "Bỏ CONCAT và dấu ngoặc. Viết role, dấu `||`, chuỗi ': ', dấu `||`, rồi full_name. Bỏ luôn dấu chấm phẩy cuối.",
    skeleton: {
      oracle: "SELECT staff_id, ____ || ': ' || ____ AS badge\nFROM staff\nWHERE store_id = 3",
    },
  },
  wrong: [
    {
      id: 'swap',
      sql: {
        oracle: "SELECT staff_id, full_name || ': ' || role AS badge FROM staff WHERE store_id = 3",
      },
      hint: 'Query chạy được rồi. Thứ tự nối đang là tên trước, chức vụ sau. Đổi chỗ để chức vụ đứng trước.',
    },
    {
      id: 'no-separator',
      sql: {
        oracle: 'SELECT staff_id, role || full_name AS badge FROM staff WHERE store_id = 3',
      },
      hint: "Chức vụ và tên đang dính liền nhau. Thêm chuỗi ': ' vào giữa, nối bằng `||`.",
    },
    {
      id: 'no-where',
      sql: {
        oracle: "SELECT staff_id, role || ': ' || full_name AS badge FROM staff",
      },
      hint: 'Cách nối đúng rồi. Kết quả đang có nhân viên của mọi tiệm. Giữ lại WHERE store_id = 3.',
    },
  ],
};
