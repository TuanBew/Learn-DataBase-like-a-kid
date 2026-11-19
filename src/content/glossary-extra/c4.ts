import type { GlossaryEntry } from '../types';

export const entries: Record<string, GlossaryEntry> = {
  round: {
    term: 'ROUND',
    short: 'function làm tròn một số tới số chữ số thập phân bạn chọn.',
    example: 'Giá 109,375 đồng mỗi calo làm tròn còn 109,4.',
  },
  concat: {
    term: 'CONCAT',
    short: 'function của MySQL nối nhiều đoạn chữ thành một đoạn. Oracle nối bằng dấu ||.',
    example: 'Ghép họ tên và số điện thoại thành một đoạn liên hệ.',
  },
  byte: {
    term: 'byte',
    short: 'Đơn vị máy dùng để đếm dung lượng. Chữ a chiếm 1 byte, chữ có dấu chiếm 2 hoặc 3 byte.',
    example: 'Chữ "a" chiếm 1 byte, còn chữ "ầ" chiếm 3 byte.',
  },
  datetime: {
    term: 'datetime',
    short: 'Giá trị có cả ngày lẫn giờ, ví dụ 2026-03-08 14:00:00.',
    example: 'Giờ đặt ly trà sữa gồm ngày hôm đó và lúc bấm nút.',
  },
  trunc: {
    term: 'TRUNC',
    short: 'function của Oracle cắt phần giờ của một ngày, chỉ giữ lại ngày.',
    example: '14:00 ngày 8 tháng 3 thành 00:00 ngày 8 tháng 3.',
  },
  'date-format': {
    term: 'DATE_FORMAT',
    short: 'function đổi ngày giờ thành chữ theo khuôn bạn chọn. MySQL gọi DATE_FORMAT, Oracle gọi TO_CHAR.',
    example: 'Hiện ngày kiểu 08/03/2026 thay cho 2026-03-08.',
  },
  'str-to-date': {
    term: 'STR_TO_DATE',
    short: 'function đổi một đoạn chữ thành ngày theo khuôn bạn nói. MySQL gọi STR_TO_DATE, Oracle gọi TO_DATE.',
    example: 'Đọc chữ "08/03/2026" thành ngày 8 tháng 3 năm 2026.',
  },
  coalesce: {
    term: 'COALESCE',
    short: 'function trả về giá trị đầu tiên khác NULL trong danh sách. MySQL và Oracle đều có.',
    example: 'Số điện thoại chính trống thì lấy số phụ.',
  },
  ifnull: {
    term: 'IFNULL',
    short: 'function của MySQL thay NULL bằng một giá trị bạn chọn.',
    example: 'Món chưa có calo thì ghi 0.',
  },
  nvl: {
    term: 'NVL',
    short: 'function của Oracle thay NULL bằng một giá trị bạn chọn. Làm giống IFNULL của MySQL.',
    example: 'Món chưa có calo thì ghi 0.',
  },
  'case-when': {
    term: 'CASE WHEN',
    short: 'Cách SQL chọn một giá trị theo điều kiện, giống câu "nếu... thì...".',
    example: 'Nếu giá dưới 30.000 thì ghi "Rẻ", nếu không thì xét tiếp.',
  },
};
