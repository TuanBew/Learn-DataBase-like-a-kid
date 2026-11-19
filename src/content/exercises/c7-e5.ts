import type { SqlExercise } from '../types';

const from =
  "SELECT CONCAT(c.full_name, ' - ', c.city) AS label,\n       IFNULL(c.phone, 'chưa có') AS phone\nFROM customers AS c\nORDER BY c.joined_on\nLIMIT 5;";

export const exercise: SqlExercise = {
  id: 'c7-e5',
  chapter: 7,
  kind: 'translate',
  title: 'Chuyển query khách hàng sang Oracle',
  prompt:
    'Đồng nghiệp gửi một query viết cho MySQL. Viết lại bằng Oracle để ra cùng kết quả. Query này có bốn chỗ cần đổi.',
  asks: [
    'Nối tên và thành phố bằng cách của Oracle.',
    'Thay số điện thoại NULL bằng chữ chưa có.',
    'Alias của table viết kiểu Oracle.',
    'Giữ 5 khách đăng ký sớm nhất.',
  ],
  database: 'teashop',
  tables: ['customers'],
  dialects: ['oracle'],
  from,
  starter: { oracle: from },
  solution: {
    oracle:
      "SELECT c.full_name || ' - ' || c.city AS label,\n       NVL(c.phone, 'chưa có') AS phone\nFROM customers c\nORDER BY c.joined_on\nFETCH FIRST 5 ROWS ONLY;",
  },
  check: { orderMatters: true, aliasMatters: true },
  why: 'Oracle nối chuỗi bằng `||`, thay NULL bằng NVL, bỏ AS ở alias của table và lấy row đầu bằng FETCH FIRST.',
  hints: {
    light: 'Bốn chỗ khác nhau: nối chuỗi, thay NULL, alias của table, và cách giới hạn số row.',
    specific: 'CONCAT đổi thành `||`. IFNULL đổi thành NVL. Bỏ AS trước c. LIMIT 5 đổi thành FETCH FIRST 5 ROWS ONLY.',
    skeleton: {
      oracle:
        "SELECT c.full_name ____ ' - ' ____ c.city AS label,\n       ____(c.phone, 'chưa có') AS phone\nFROM customers ____\nORDER BY c.joined_on\nFETCH FIRST ____ ROWS ONLY;",
    },
  },
  wrong: [
    {
      id: 'no-nvl',
      sql: {
        oracle:
          "SELECT c.full_name || ' - ' || c.city AS label, c.phone AS phone FROM customers c ORDER BY c.joined_on FETCH FIRST 5 ROWS ONLY",
      },
      hint: 'Query chạy được, nhưng khách chưa có số điện thoại hiện NULL. Bọc c.phone trong NVL để thay bằng chữ chưa có.',
    },
    {
      id: 'desc',
      sql: {
        oracle:
          "SELECT c.full_name || ' - ' || c.city AS label, NVL(c.phone, 'chưa có') AS phone FROM customers c ORDER BY c.joined_on DESC FETCH FIRST 5 ROWS ONLY",
      },
      hint: 'DESC đang lấy 5 khách đăng ký muộn nhất. MySQL gốc sắp tăng dần, nên bỏ DESC.',
    },
    {
      id: 'fetch-3',
      sql: {
        oracle:
          "SELECT c.full_name || ' - ' || c.city AS label, NVL(c.phone, 'chưa có') AS phone FROM customers c ORDER BY c.joined_on FETCH FIRST 3 ROWS ONLY",
      },
      hint: 'Bạn dịch đúng gần hết rồi. Query gốc lấy 5 row, còn FETCH FIRST của bạn chỉ lấy 3.',
    },
  ],
};
