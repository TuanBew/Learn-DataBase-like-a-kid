import type { Chapter } from './types';

/** Mục lục của khóa học. Bài nào đã có file trong `lessons/` hoặc `exercises/` thì tự mở. */
export const chapters: Chapter[] = [
  {
    id: 1,
    title: 'Database là gì',
    about: 'Dữ liệu nằm ở đâu, ai giữ, và bạn nói chuyện với người giữ bằng cách nào.',
    lessons: [
      { id: 'c1-b1', title: 'Dữ liệu ở quanh ta' },
      { id: 'c1-b2', title: 'Excel và database' },
      { id: 'c1-b3', title: 'table, row, column' },
      { id: 'c1-b4', title: 'DBMS và SQL' },
      { id: 'c1-b5', title: 'client, server và câu SELECT đầu tiên' },
    ],
  },
  {
    id: 2,
    title: 'Table được thiết kế ra sao',
    about: 'Mỗi row có mã riêng, các table nối với nhau, và có ô được phép để trống.',
    lessons: [
      { id: 'c2-b1', title: 'primary key' },
      { id: 'c2-b2', title: 'foreign key' },
      { id: 'c2-b3', title: 'Vì sao phải tách table' },
      { id: 'c2-b4', title: 'NULL' },
      { id: 'c2-b5', title: 'constraint' },
      { id: 'c2-b6', title: 'Đọc ERD và CREATE TABLE' },
    ],
  },
  {
    id: 3,
    title: 'Hỏi database bằng SELECT',
    about: 'Chọn column, lọc row, sắp xếp, và lấy vài row đầu.',
    lessons: [
      { id: 'c3-b1', title: 'SELECT và FROM' },
      { id: 'c3-b2', title: 'Lọc row bằng WHERE' },
      { id: 'c3-b3', title: 'ORDER BY và DISTINCT' },
      { id: 'c3-b4', title: 'LIMIT và FETCH FIRST' },
      { id: 'c3-b5', title: 'Thứ tự query chạy thật' },
    ],
  },
  {
    id: 4,
    title: 'Tính toán và làm sạch dữ liệu',
    about: 'Phép tính, function chuỗi, ngày giờ, NULL và CASE WHEN.',
    lessons: [
      { id: 'c4-b1', title: 'Phép tính trong SELECT' },
      { id: 'c4-b2', title: 'function chuỗi' },
      { id: 'c4-b3', title: 'Ngày giờ' },
      { id: 'c4-b4', title: 'Xử lý NULL và CASE WHEN' },
    ],
  },
  {
    id: 5,
    title: 'Gom nhóm để làm báo cáo',
    about: 'Đếm, cộng, tính trung bình theo từng nhóm.',
    lessons: [
      { id: 'c5-b1', title: 'COUNT, SUM, AVG, MIN, MAX' },
      { id: 'c5-b2', title: 'GROUP BY' },
      { id: 'c5-b3', title: 'HAVING' },
      { id: 'c5-b4', title: 'Báo cáo doanh thu' },
    ],
  },
  {
    id: 6,
    title: 'Nối table bằng JOIN',
    about: 'Lấy dữ liệu từ nhiều table trong cùng một query.',
    lessons: [
      { id: 'c6-b1', title: 'INNER JOIN' },
      { id: 'c6-b2', title: 'LEFT JOIN' },
      { id: 'c6-b3', title: 'Nối ba table' },
      { id: 'c6-b4', title: 'subquery với IN' },
    ],
  },
  {
    id: 7,
    title: 'Sửa dữ liệu an toàn, rồi mang về Oracle',
    about: 'INSERT, UPDATE, DELETE, transaction, và một báo cáo hoàn chỉnh bằng Oracle SQL.',
    lessons: [
      { id: 'c7-b1', title: 'INSERT, UPDATE, DELETE' },
      { id: 'c7-b2', title: 'transaction, COMMIT, ROLLBACK' },
      { id: 'c7-b3', title: 'index' },
      { id: 'c7-b4', title: 'MySQL và Oracle khác nhau ở đâu' },
      { id: 'c7-b5', title: 'Nhiệm vụ cuối: báo cáo bằng Oracle SQL' },
    ],
  },
];
