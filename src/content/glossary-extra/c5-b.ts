import type { GlossaryEntry } from '../types';

/** Thuật ngữ bổ sung cho các bài c5-b1, c5-b3, c5-b5, c5-b6, c5-b7, c5-b8. */
export const entries: Record<string, GlossaryEntry> = {
  'trunc-number': {
    term: 'TRUNC và TRUNCATE',
    short: 'Function cắt bớt phần lẻ của một số, không làm tròn. Oracle gọi TRUNC, MySQL gọi TRUNCATE.',
    example: '1.272.727 đồng cắt tới nghìn còn 1.272.000, không lên 1.273.000.',
  },
  'ceil-floor': {
    term: 'CEIL và FLOOR',
    short: 'CEIL làm tròn một số lên số nguyên kế tiếp. FLOOR làm tròn xuống.',
    example: 'Số 2,1 qua CEIL ra 3, qua FLOOR ra 2.',
  },
  mod: {
    term: 'MOD',
    short: 'Function cho phần dư của phép chia.',
    example: '17 chia 5 được 3 và dư 2, nên MOD(17, 5) ra 2.',
  },
  abs: {
    term: 'ABS',
    short: 'Function bỏ dấu âm của một số, chỉ giữ độ lớn.',
    example: 'Lương lệch -2 triệu so với mức chuẩn, ABS ra 2 triệu.',
  },
  power: {
    term: 'POWER',
    short: 'Function lũy thừa. POWER(a, n) nhân a với chính nó n lần.',
    example: 'POWER(2, 10) ra 1024.',
  },
  trim: {
    term: 'TRIM',
    short: 'Function bỏ dấu cách ở hai đầu một chuỗi. LTRIM bỏ đầu trái, RTRIM bỏ đầu phải.',
    example: 'Mã "  NV-7 " qua TRIM còn "NV-7".',
  },
  replace: {
    term: 'REPLACE',
    short: 'Function thay mọi đoạn chữ này trong chuỗi bằng đoạn chữ khác.',
    example: 'REPLACE("NV_007", "_", "-") ra "NV-007".',
  },
  instr: {
    term: 'INSTR',
    short: 'Function cho vị trí của một đoạn chữ trong chuỗi, hoặc 0 nếu không thấy. MySQL còn có LOCATE, đổi chỗ hai giá trị.',
    example: 'Dấu @ trong "khoa.dq@congty.vn" nằm ở vị trí 8.',
  },
  lpad: {
    term: 'LPAD',
    short: 'Function thêm ký tự vào bên trái chuỗi cho tới khi đủ độ dài. RPAD thêm vào bên phải.',
    example: 'LPAD("7", 3, "0") ra "007".',
  },
  'add-months': {
    term: 'ADD_MONTHS',
    short: 'Function của Oracle cộng một số tháng vào ngày. MySQL dùng DATE_ADD với INTERVAL.',
    example: 'Ngày vào làm cộng hai tháng ra ngày đánh giá đầu.',
  },
  'date-add': {
    term: 'DATE_ADD',
    short: 'Function của MySQL cộng một khoảng thời gian vào ngày. DATE_SUB trừ đi.',
    example: 'DATE_ADD(hire_date, INTERVAL 7 DAY) là bảy ngày sau ngày vào làm.',
  },
  datediff: {
    term: 'DATEDIFF và TIMESTAMPDIFF',
    short: 'Function của MySQL tính khoảng cách giữa hai ngày. DATEDIFF ra số ngày, TIMESTAMPDIFF ra số đơn vị trọn vẹn bạn chọn.',
    example: 'TIMESTAMPDIFF(MONTH, ngày vào làm, hôm nay) ra số tháng đã làm.',
  },
  'months-between': {
    term: 'MONTHS_BETWEEN',
    short: 'Function của Oracle tính số tháng giữa hai ngày, có phần lẻ.',
    example: 'MONTHS_BETWEEN(hôm nay, ngày vào làm) ra 12,98 tháng.',
  },
  'last-day': {
    term: 'LAST_DAY',
    short: 'Function cho ngày cuối cùng của tháng chứa một ngày.',
    example: 'LAST_DAY của một ngày trong tháng 2 năm 2026 ra ngày 28.',
  },
  cast: {
    term: 'CAST',
    short: 'Function đổi một giá trị sang data type khác. Viết CAST(giá trị AS data type).',
    example: 'CAST("123" AS SIGNED) đổi chữ 123 thành số 123.',
  },
  'to-number': {
    term: 'TO_NUMBER',
    short: 'Function của Oracle đổi một chuỗi thành số. MySQL dùng CAST hoặc CONVERT.',
    example: 'TO_NUMBER("0910000137") ra số 910000137.',
  },
  'format-number': {
    term: 'FORMAT và TO_CHAR cho số',
    short: 'Function đổi số thành chữ có dấu phẩy nghìn. MySQL gọi FORMAT, Oracle gọi TO_CHAR kèm một mẫu.',
    example: 'Lương 38000000 thành chữ 38,000,000.',
  },
  'implicit-conversion': {
    term: 'đổi ngầm',
    short: 'Lúc database tự đổi data type khi bạn so hoặc tính giữa chữ và số, không cần bạn viết CAST.',
    example: 'MySQL đọc "12abc" là 12. Oracle báo lỗi ORA-01722.',
  },
  nvl2: {
    term: 'NVL2',
    short: 'Function của Oracle chọn kết quả tùy một giá trị có NULL hay không. MySQL dùng IF.',
    example: 'NVL2(commission_pct, "Có", "Không") ra Không khi hoa hồng là NULL.',
  },
  nullif: {
    term: 'NULLIF',
    short: 'Function biến một giá trị thành NULL khi nó bằng giá trị thứ hai. Chạy ở cả hai dialect.',
    example: 'NULLIF(y, 0) ra NULL khi y là 0, nên phép chia không báo lỗi.',
  },
  decode: {
    term: 'DECODE',
    short: 'Function của Oracle đổi một giá trị thành kết quả theo từng cặp giá trị và kết quả. Code Oracle cũ dùng nhiều.',
    example: 'DECODE(department_id, 30, "IT", "Khác") đổi mã phòng 30 thành chữ IT.',
  },
  'greatest-least': {
    term: 'GREATEST và LEAST',
    short: 'Function chọn giá trị lớn nhất hoặc nhỏ nhất trong danh sách bạn đưa vào.',
    example: 'GREATEST(salary, 15000000) không bao giờ nhỏ hơn 15 triệu.',
  },
};
