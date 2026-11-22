import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của các bài c3-b6 tới c3-b10. */
export const entries: Record<string, GlossaryEntry> = {
  'parent-table': {
    term: 'parent table',
    short: 'Table được table khác trỏ tới bằng foreign key. Row của nó phải có trước.',
    example: 'departments là table cha của employees, vì mỗi nhân viên trỏ về một phòng.',
  },
  'child-table': {
    term: 'child table',
    short: 'Table giữ foreign key trỏ sang table khác. Row của nó chỉ vào được khi row cha đã có.',
    example: 'employees là table con của departments, vì nó giữ mã phòng.',
  },
  'self-reference': {
    term: 'self-reference',
    short: 'Foreign key trỏ về primary key của chính table chứa nó.',
    example: 'manager_id trỏ về employee_id, vì sếp cũng là một nhân viên.',
  },
  'on-delete': {
    term: 'ON DELETE',
    short: 'Phần của foreign key nói database làm gì với row con khi row cha bị xóa. CASCADE xóa luôn row con. Không khai thì database chặn lệnh xóa.',
    example: 'Xóa một đơn hàng thì các món trong đơn đó đi theo.',
  },
  'alter-table': {
    term: 'ALTER TABLE',
    short: 'Lệnh SQL sửa cấu trúc của table đã có: thêm, đổi, xóa column hoặc constraint.',
    example: 'Kẻ thêm một ô số điện thoại vào cuốn sổ nhân viên mà không chép lại các trang cũ.',
  },
  truncate: {
    term: 'TRUNCATE',
    short: 'Lệnh xóa mọi row của một table và giữ nguyên cấu trúc. Database lưu ngay, ROLLBACK không hoàn lại.',
    example: 'Xé hết trang trong cuốn sổ nhưng giữ bìa và các ô kẻ sẵn.',
  },
  'drop-table': {
    term: 'DROP TABLE',
    short: 'Lệnh xóa cả table: row, column và constraint. Không hoàn lại bằng ROLLBACK.',
    example: 'Vứt cả cuốn sổ đi.',
  },
  'recycle-bin': {
    term: 'recycle bin',
    short: 'Thùng rác của Oracle. Table bị DROP nằm ở đây cho tới khi bị dọn, trừ khi lệnh có PURGE.',
    example: 'Table vừa xóa vẫn còn trong thùng rác cho tới khi bị dọn, hoặc nếu lệnh có PURGE thì xóa hẳn ngay.',
  },
};
