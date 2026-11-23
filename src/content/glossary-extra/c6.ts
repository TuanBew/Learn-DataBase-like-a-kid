import type { GlossaryEntry } from '../types';

export const entries: Record<string, GlossaryEntry> = {
  'aggregate-function': {
    term: 'function gom',
    short: 'Function nhận nhiều row và trả về một giá trị. COUNT, SUM, AVG, MIN, MAX đều là function gom.',
    example: 'Cộng tiền của mọi ly trong ngày thành một tổng.',
  },
  count: {
    term: 'COUNT',
    short: 'Function gom đếm row. COUNT(*) đếm mọi row, COUNT(column) chỉ đếm row có giá trị.',
    example: 'Đếm có bao nhiêu món trong thực đơn.',
  },
  sum: {
    term: 'SUM',
    short: 'Function gom cộng các số trong một column.',
    example: 'Cộng tiền của mọi ly trong ngày.',
  },
  avg: {
    term: 'AVG',
    short: 'Function gom tính trung bình các số trong một column. AVG bỏ qua row NULL.',
    example: 'Giá trung bình của các món trà sữa.',
  },
  min: {
    term: 'MIN',
    short: 'Function gom tìm giá trị nhỏ nhất trong một column.',
    example: 'Món rẻ nhất trong thực đơn.',
  },
  max: {
    term: 'MAX',
    short: 'Function gom tìm giá trị lớn nhất trong một column.',
    example: 'Món đắt nhất trong thực đơn.',
  },
  'group-by': {
    term: 'GROUP BY',
    short: 'Từ khóa SQL chia row thành nhóm theo giá trị của column. Mỗi nhóm cho ra một row kết quả.',
    example: 'Xếp các món vào bốn hộp: Trà sữa, Cà phê, Trà trái cây, Topping.',
  },
  having: {
    term: 'HAVING',
    short: 'Từ khóa SQL giữ hoặc bỏ cả nhóm, sau khi GROUP BY đã gom xong.',
    example: 'Chỉ giữ những hộp có từ bốn món trở lên.',
  },
};
