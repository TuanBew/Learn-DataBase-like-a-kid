import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của các bài 3, 5 và 6 trong Chương 11. */
export const entries: Record<string, GlossaryEntry> = {
  'data-dictionary': {
    term: 'data dictionary',
    short: 'Tập các view Oracle dựng sẵn, ghi lại mọi table, column và constraint của database. Bạn đọc chúng bằng SELECT.',
    example: 'Hỏi USER_TABLES để biết database có những table nào.',
  },
  'desc-command': {
    term: 'DESC',
    short: 'Lệnh của tool cho xem tên column, data type và NOT NULL của một table. Đây không phải câu SQL.',
    example: 'Gõ DESC employees để xem các column của table employees.',
  },
  'nls-date-format': {
    term: 'NLS_DATE_FORMAT',
    short: 'Tham số của Oracle quy định định dạng mặc định khi đổi ngày thành chữ và ngược lại. Người quản trị đặt được giá trị khác.',
    example: 'Hai máy có thể hiện cùng một ngày theo hai kiểu khác nhau.',
  },
  'explain-plan': {
    term: 'EXPLAIN PLAN',
    short: 'Lệnh cho biết database định chạy một query bằng cách nào, ví dụ scan hay dùng index. MySQL viết EXPLAIN.',
    example: 'Người quản trị xem kế hoạch chạy để biết vì sao query chậm.',
  },
};
