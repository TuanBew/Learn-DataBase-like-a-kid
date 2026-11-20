import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của Chương 2. */
export const entries: Record<string, GlossaryEntry> = {
  'one-to-many': {
    term: 'one-to-many',
    short: 'Kiểu quan hệ: một row ở table này nối được với nhiều row ở table kia.',
    example: 'Một khách đặt nhiều đơn, còn mỗi đơn chỉ có một khách.',
  },
  normalizing: {
    term: 'normalizing',
    short: 'Tách dữ liệu ra các table nhỏ, mỗi table giữ một loại thông tin một lần.',
    example: 'Số điện thoại của khách chỉ ghi ở table khách quen, không chép vào từng đơn.',
  },
  'not-null': {
    term: 'NOT NULL',
    short: 'Constraint bắt ô phải có giá trị, không được để NULL.',
    example: 'Đơn nào cũng phải có giờ đặt.',
  },
  unique: {
    term: 'UNIQUE',
    short: 'Constraint cấm hai row có cùng giá trị ở một column.',
    example: 'Hai món trong thực đơn không được trùng tên.',
  },
  check: {
    term: 'CHECK',
    short: 'Constraint kiểm một điều kiện, row nào không thỏa thì bị từ chối.',
    example: 'Giá mỗi món phải lớn hơn 0.',
  },
  erd: {
    term: 'ERD',
    short: 'Sơ đồ vẽ các table thành hộp, và vẽ foreign key thành đường nối giữa các hộp.',
    example: 'Sơ đồ của tiệm trà sữa nối table đơn với table khách và table tiệm.',
  },
  'create-table': {
    term: 'CREATE TABLE',
    short: 'Lệnh SQL dựng một table mới, khai tên table, các column và constraint.',
    example: 'Dựng một cuốn sổ trống, kẻ sẵn các column, rồi mới ghi row vào.',
  },
  ddl: {
    term: 'DDL',
    short: 'Nhóm lệnh SQL dựng và đổi cấu trúc của database, như CREATE TABLE.',
    example: 'Kẻ thêm một column vào sổ là lệnh DDL. Ghi thêm một row thì không phải.',
  },
  'auto-increment': {
    term: 'AUTO_INCREMENT',
    short: 'Cách MySQL tự đánh số tăng dần cho một column mỗi khi thêm row.',
    example: 'Đơn mới tự nhận số 1001, 1002, 1003 mà không ai phải gõ.',
  },
};
