import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của bài c10-b7, c11-b1 và c11-b4. */
export const entries: Record<string, GlossaryEntry> = {
  backup: {
    term: 'backup',
    short: 'Bản chép dữ liệu giữ riêng để khôi phục khi sửa nhầm.',
    example: 'Trước khi sửa lương, Bi chép các row cũ sang một table khác.',
  },
  connection: {
    term: 'connection',
    short: 'Đường nối từ tool của bạn tới một database cụ thể, với một user cụ thể.',
    example: 'Mở kết nối "Chạy thật" rồi mới gõ lệnh.',
  },
  worksheet: {
    term: 'worksheet',
    short: 'Cửa sổ trong tool, nơi bạn gõ SQL và xem kết quả.',
    example: 'Bạn mở một worksheet, gõ SELECT, rồi chạy.',
  },
  script: {
    term: 'script',
    short: 'Nhiều lệnh SQL viết nối nhau để chạy lần lượt từ trên xuống.',
    example: 'Một script gồm SELECT đếm, UPDATE và COMMIT.',
  },
  'db-user': {
    term: 'user',
    short: 'Tài khoản đăng nhập vào database, có bộ quyền riêng.',
    example: 'Mỗi nhân viên IT có một user riêng.',
  },
  privilege: {
    term: 'privilege',
    short: 'Một việc database cho phép user làm trên một table, như đọc hay sửa.',
    example: 'Thẻ văn phòng của bạn chỉ mở được tầng của mình.',
  },
  grant: {
    term: 'GRANT',
    short: 'Lệnh SQL cấp quyền cho một user.',
    example: 'GRANT SELECT ON hr.employees TO an cho user an đọc table employees.',
  },
  revoke: {
    term: 'REVOKE',
    short: 'Lệnh SQL thu lại quyền đã cấp.',
    example: 'REVOKE UPDATE ON hr.employees FROM an thu quyền sửa của an.',
  },
};
