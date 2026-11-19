import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của Chương 7. */
export const entries: Record<string, GlossaryEntry> = {
  insert: {
    term: 'INSERT',
    short: 'Lệnh SQL thêm row mới vào table.',
    example: 'Quán ra món mới, Bi ghi thêm một món vào sổ thực đơn.',
  },
  update: {
    term: 'UPDATE',
    short: 'Lệnh SQL sửa giá trị trong những row có sẵn.',
    example: 'Món tăng giá, Bi sửa số giá của đúng món đó.',
  },
  delete: {
    term: 'DELETE',
    short: 'Lệnh SQL xóa row khỏi table.',
    example: 'Quán bỏ một món, Bi gạch tên món khỏi sổ thực đơn.',
  },
  dml: {
    term: 'DML',
    short: 'Nhóm lệnh SQL sửa dữ liệu trong table: INSERT, UPDATE, DELETE.',
    example: 'Sửa số liệu trong sổ là DML. Đóng một cuốn sổ mới là DDL.',
  },
  autocommit: {
    term: 'autocommit',
    short: 'Chế độ database tự COMMIT ngay sau mỗi lệnh. MySQL bật chế độ này theo mặc định.',
    example: 'Bi ghi câu nào là câu đó vào sổ chính luôn, không qua giấy nháp.',
  },
  scan: {
    term: 'scan',
    short: 'Cách tìm row: đọc table từ row đầu tới row cuối.',
    example: 'Lật từng trang sách để tìm một chữ.',
  },
  'error-code': {
    term: 'error code',
    short: 'Mã mà database báo khi query lỗi. Oracle viết ORA, dấu gạch ngang và năm chữ số. MySQL báo một con số.',
    example: 'ORA-00942 báo table không tồn tại.',
  },
};
