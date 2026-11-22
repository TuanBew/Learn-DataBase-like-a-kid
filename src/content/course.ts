import type { Chapter } from './types';

/**
 * Mục lục của khóa học theo dàn ý 12 chương (`docs/outline-v2.md`).
 * Chỉ liệt kê bài đã có file trong `lessons/`. Chương chưa có bài nào thì chưa đưa vào.
 * Số chương hiển thị là `id`, nên id có thể nhảy cóc cho tới khi viết đủ.
 */
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
      { id: 'c2-b5', title: 'NULL' },
      { id: 'c2-b6', title: 'constraint' },
      { id: 'c2-b7', title: 'Đọc ERD và CREATE TABLE' },
    ],
  },
  {
    id: 4,
    title: 'Query một table',
    about: 'Chọn column, lọc row, sắp xếp, và lấy vài row đầu.',
    lessons: [
      { id: 'c4-b1', title: 'SELECT và FROM' },
      { id: 'c4-b2', title: 'Lọc row bằng WHERE' },
      { id: 'c4-b4', title: 'ORDER BY và DISTINCT' },
      { id: 'c4-b5', title: 'LIMIT và FETCH FIRST' },
      { id: 'c4-b6', title: 'Thứ tự query chạy thật' },
    ],
  },
  {
    id: 5,
    title: 'Function và biểu thức',
    about: 'Phép tính, function chuỗi, ngày giờ, NULL và CASE WHEN.',
    lessons: [
      { id: 'c5-b1', title: 'Phép tính trong SELECT' },
      { id: 'c5-b2', title: 'function chuỗi' },
      { id: 'c5-b4', title: 'Ngày giờ' },
      { id: 'c5-b7', title: 'Xử lý NULL và CASE WHEN' },
    ],
  },
  {
    id: 6,
    title: 'Gom nhóm và báo cáo',
    about: 'Đếm, cộng, tính trung bình theo từng nhóm.',
    lessons: [
      { id: 'c6-b1', title: 'COUNT, SUM, AVG, MIN, MAX' },
      { id: 'c6-b2', title: 'GROUP BY' },
      { id: 'c6-b4', title: 'HAVING' },
      { id: 'c6-b7', title: 'Báo cáo doanh thu' },
    ],
  },
  {
    id: 7,
    title: 'Nối table',
    about: 'Lấy dữ liệu từ nhiều table trong cùng một query.',
    lessons: [
      { id: 'c7-b2', title: 'INNER JOIN' },
      { id: 'c7-b3', title: 'LEFT JOIN' },
      { id: 'c7-b5', title: 'Nối ba table' },
    ],
  },
  {
    id: 8,
    title: 'Subquery và ghép kết quả',
    about: 'Đặt một query trong query khác để lọc row theo một danh sách.',
    lessons: [{ id: 'c8-b2', title: 'subquery với IN' }],
  },
  {
    id: 10,
    title: 'Sửa dữ liệu',
    about: 'Thêm, sửa, xóa row, rồi giữ hoặc hủy thay đổi bằng transaction.',
    lessons: [
      { id: 'c10-b1', title: 'INSERT, UPDATE, DELETE' },
      { id: 'c10-b3', title: 'transaction, COMMIT, ROLLBACK' },
    ],
  },
  {
    id: 11,
    title: 'Oracle ở công ty',
    about: 'Index làm query nhanh hơn, và MySQL với Oracle khác nhau ở vài chỗ.',
    lessons: [
      { id: 'c11-b5', title: 'index' },
      { id: 'c11-b7', title: 'MySQL và Oracle khác nhau ở đâu' },
    ],
  },
  {
    id: 12,
    title: 'Dự án cuối',
    about: 'Một báo cáo hoàn chỉnh bằng Oracle SQL trên database hr.',
    lessons: [{ id: 'c12-b1', title: 'Nhiệm vụ cuối: báo cáo bằng Oracle SQL' }],
  },
];
