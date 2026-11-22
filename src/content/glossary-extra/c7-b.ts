import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của các bài 1, 4, 6, 7, 8 và 9 trong Chương 7. */
export const entries: Record<string, GlossaryEntry> = {
  'join-path': {
    term: 'join path',
    short: 'Chuỗi các table nối với nhau bằng foreign key, đi từ table này tới table kia.',
    example: 'Từ order_items tới regions, đường đi qua orders, customers và countries.',
  },
  'right-join': {
    term: 'RIGHT JOIN',
    short: 'Kiểu JOIN giữ mọi row của table bên phải. Row không ghép được thì column bên trái là NULL.',
    example: 'Đi từng phòng ban và ghi các nhân viên của phòng. Phòng chưa có ai vẫn có tên trong danh sách.',
  },
  'full-outer-join': {
    term: 'FULL OUTER JOIN',
    short: 'Kiểu JOIN giữ mọi row của cả hai table. Row không ghép được thì column của bên kia là NULL.',
    example: 'Đặt hai danh sách cạnh nhau và gạch nối các mục khớp. Mục lẻ ở bên nào cũng vẫn có mặt.',
  },
  union: {
    term: 'UNION',
    short: 'Từ khóa SQL gộp kết quả của hai query thành một và bỏ các row trùng nhau.',
    example: 'Gộp danh sách khách ở Hà Nội với danh sách khách ở Đà Nẵng, khách nào có ở cả hai thì chỉ ghi một lần.',
  },
  'self-join': {
    term: 'self join',
    short: 'Cách nối một table với chính nó, bằng hai alias khác nhau cho cùng một table.',
    example: 'Tra tên sếp của một nhân viên trong chính danh sách nhân viên.',
  },
  'non-equi-join': {
    term: 'non-equi join',
    short: 'JOIN mà điều kiện ON không dùng dấu bằng, ví dụ BETWEEN hoặc dấu lớn hơn.',
    example: 'Xếp mỗi đơn vào mức phí vận chuyển theo cân nặng nằm trong khoảng nào.',
  },
  'cross-join': {
    term: 'CROSS JOIN',
    short: 'Kiểu JOIN ghép mỗi row bên trái với mọi row bên phải. Không có ON.',
    example: 'Ghép mỗi khu vực với mỗi nhóm sản phẩm để dựng lưới báo cáo đủ ô.',
  },
  'cartesian-product': {
    term: 'cartesian product',
    short: 'Kết quả ghép mọi cặp row của hai table. Số row bằng số row bên này nhân số row bên kia.',
    example: '4 khu vực và 20 sản phẩm cho 80 cặp.',
  },
  using: {
    term: 'USING',
    short: 'Từ khóa SQL thay cho ON khi hai table có column cùng tên. Database nối theo column đó.',
    example: 'Hai tờ phiếu cùng có ô "mã phòng", nên bạn chỉ cần nói "ghép theo mã phòng".',
  },
  'natural-join': {
    term: 'NATURAL JOIN',
    short: 'Kiểu JOIN tự nối theo mọi column cùng tên ở hai table, không cần ON hay USING.',
    example: 'Ghép hai tờ phiếu theo mọi ô trùng tên, kể cả ô bạn không định dùng để ghép.',
  },
  'row-fan-out': {
    term: 'row fan-out',
    short: 'Hiện tượng một row bị chép thành nhiều row sau khi nối, làm SUM và COUNT ra số quá lớn.',
    example: 'Một đơn có 3 món bị đếm 3 lần khi nối với table món.',
  },
};
