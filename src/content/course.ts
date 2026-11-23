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
      { id: 'c1-b1', title: 'Dữ liệu ở quanh ta', minutes: 12 },
      { id: 'c1-b2', title: 'Excel và database', minutes: 12 },
      { id: 'c1-b3', title: 'table, row, column', minutes: 12 },
      { id: 'c1-b4', title: 'DBMS và SQL', minutes: 12 },
      { id: 'c1-b5', title: 'client, server và câu SELECT đầu tiên', minutes: 12 },
    ],
  },
  {
    id: 2,
    title: 'Table được thiết kế ra sao',
    about: 'Mỗi row có mã riêng, các table nối với nhau, và có ô được phép để trống.',
    lessons: [
      { id: 'c2-b1', title: 'primary key', minutes: 12 },
      { id: 'c2-b2', title: 'foreign key', minutes: 12 },
      { id: 'c2-b3', title: 'Vì sao phải tách table', minutes: 12 },
      { id: 'c2-b4', title: 'Ba kiểu quan hệ', minutes: 12 },
      { id: 'c2-b5', title: 'NULL', minutes: 14 },
      { id: 'c2-b6', title: 'constraint', minutes: 14 },
      { id: 'c2-b7', title: 'Đọc ERD và CREATE TABLE', minutes: 16 },
    ],
  },
  {
    id: 3,
    title: 'Tạo table từ A đến Z',
    about: 'Từ tờ ghi chép tới câu CREATE TABLE: chọn data type, đặt primary key và các luật.',
    lessons: [
      { id: 'c3-b1', title: 'Từ tờ ghi chép tới bản thiết kế', minutes: 12 },
      { id: 'c3-b2', title: 'Chọn data type cho từng column', minutes: 14 },
      { id: 'c3-b3', title: 'Câu CREATE TABLE đầu tiên', minutes: 15 },
      { id: 'c3-b4', title: 'primary key và mã tự tăng', minutes: 15 },
      { id: 'c3-b5', title: 'Đặt luật ngay lúc tạo', minutes: 15 },
      { id: 'c3-b6', title: 'Table thứ hai và foreign key', minutes: 15 },
      { id: 'c3-b7', title: 'Quan hệ nhiều với nhiều: table trung gian', minutes: 15 },
      { id: 'c3-b8', title: 'Đưa dữ liệu vào bằng INSERT', minutes: 15 },
      { id: 'c3-b9', title: 'Sửa cấu trúc bằng ALTER TABLE', minutes: 15 },
      { id: 'c3-b10', title: 'DROP, TRUNCATE, và xem lại database của mình', minutes: 16 },
    ],
  },
  {
    id: 4,
    title: 'Query một table',
    about: 'Chọn column, lọc row, sắp xếp, và lấy vài row đầu.',
    lessons: [
      { id: 'c4-b1', title: 'SELECT và FROM', minutes: 12 },
      { id: 'c4-b2', title: 'WHERE: so sánh, AND, OR, NOT', minutes: 14 },
      { id: 'c4-b3', title: 'WHERE: IN, BETWEEN, LIKE, IS NULL', minutes: 16 },
      { id: 'c4-b4', title: 'ORDER BY và DISTINCT', minutes: 15 },
      { id: 'c4-b5', title: 'LIMIT và FETCH FIRST', minutes: 15 },
      { id: 'c4-b6', title: 'Thứ tự query chạy thật', minutes: 12 },
      { id: 'c4-b7', title: 'Viết query cho dễ đọc: xuống dòng, alias, comment', minutes: 12 },
    ],
  },
  {
    id: 5,
    title: 'Function và biểu thức',
    about: 'Phép tính, function chuỗi, ngày giờ, đổi data type, NULL và CASE WHEN.',
    lessons: [
      { id: 'c5-b1', title: 'Phép tính và function số', minutes: 17 },
      { id: 'c5-b2', title: 'function chuỗi', minutes: 16 },
      { id: 'c5-b3', title: 'function chuỗi nâng cao', minutes: 15 },
      { id: 'c5-b4', title: 'Ngày giờ', minutes: 18 },
      { id: 'c5-b5', title: 'Ngày giờ: cộng trừ và khoảng cách', minutes: 18 },
      { id: 'c5-b6', title: 'Đổi data type', minutes: 17 },
      { id: 'c5-b7', title: 'Xử lý NULL', minutes: 16 },
      { id: 'c5-b8', title: 'CASE WHEN và DECODE', minutes: 16 },
    ],
  },
  {
    id: 6,
    title: 'Gom nhóm và báo cáo',
    about: 'Đếm, cộng, tính trung bình theo từng nhóm.',
    lessons: [
      { id: 'c6-b1', title: 'COUNT, SUM, AVG, MIN, MAX', minutes: 16 },
      { id: 'c6-b2', title: 'GROUP BY', minutes: 16 },
      { id: 'c6-b3', title: 'GROUP BY nhiều column và theo tháng', minutes: 16 },
      { id: 'c6-b4', title: 'HAVING', minutes: 14 },
      { id: 'c6-b5', title: 'Đếm có điều kiện và xoay ngang bằng CASE', minutes: 16 },
      { id: 'c6-b6', title: 'Gộp chữ trong nhóm và row tổng cộng: LISTAGG, GROUP_CONCAT, ROLLUP', minutes: 18 },
      { id: 'c6-b7', title: 'Báo cáo doanh thu', minutes: 20 },
    ],
  },
  {
    id: 7,
    title: 'Nối table',
    about: 'Lấy dữ liệu từ nhiều table trong cùng một query.',
    lessons: [
      { id: 'c7-b1', title: 'Đọc một database lạ: tìm đường nối giữa hai table', minutes: 16 },
      { id: 'c7-b2', title: 'INNER JOIN', minutes: 16 },
      { id: 'c7-b3', title: 'LEFT JOIN', minutes: 16 },
      { id: 'c7-b4', title: 'RIGHT JOIN và FULL OUTER JOIN', minutes: 16 },
      { id: 'c7-b5', title: 'Nối ba, bốn, năm table', minutes: 22 },
      { id: 'c7-b6', title: 'Self join: nhân viên và người quản lý', minutes: 16 },
      { id: 'c7-b7', title: 'Nối theo nhiều điều kiện, nối theo khoảng, CROSS JOIN', minutes: 18 },
      { id: 'c7-b8', title: 'Bẫy nhân bội row: nối xong SUM ra số quá lớn', minutes: 18 },
      { id: 'c7-b9', title: 'Đọc code Oracle cũ: dấu phẩy, dấu (+), USING, NATURAL JOIN', minutes: 18 },
    ],
  },
  {
    id: 8,
    title: 'Subquery và ghép kết quả',
    about: 'Đặt một query trong query khác, và ghép kết quả của nhiều query lại.',
    lessons: [
      { id: 'c8-b1', title: 'subquery trả một giá trị', minutes: 14 },
      { id: 'c8-b2', title: 'subquery trả một danh sách: IN, NOT IN và bẫy NULL', minutes: 16 },
      { id: 'c8-b3', title: 'subquery trong FROM: gom trước, nối sau', minutes: 16 },
      { id: 'c8-b4', title: 'subquery phụ thuộc query bên ngoài', minutes: 16 },
      { id: 'c8-b5', title: 'EXISTS và NOT EXISTS', minutes: 15 },
      { id: 'c8-b6', title: 'UNION, UNION ALL, INTERSECT, MINUS', minutes: 15 },
      { id: 'c8-b7', title: 'WITH: đặt tên cho từng bước của query', minutes: 16 },
    ],
  },
  {
    id: 10,
    title: 'Sửa dữ liệu',
    about: 'Thêm, sửa, xóa row, rồi giữ hoặc hủy thay đổi bằng transaction.',
    lessons: [
      { id: 'c10-b1', title: 'INSERT, UPDATE, DELETE', minutes: 16 },
      { id: 'c10-b2', title: 'UPDATE và DELETE dựa vào table khác', minutes: 15 },
      { id: 'c10-b3', title: 'transaction, COMMIT, ROLLBACK', minutes: 16 },
      { id: 'c10-b7', title: 'Sáu bước sửa dữ liệu ở công ty', minutes: 14 },
    ],
  },
  {
    id: 11,
    title: 'Oracle ở công ty',
    about: 'Index làm query nhanh hơn, và MySQL với Oracle khác nhau ở vài chỗ.',
    lessons: [
      { id: 'c11-b1', title: 'Tool và kết nối: SQL Developer, DBeaver, worksheet, nút COMMIT', minutes: 13 },
      { id: 'c11-b3', title: 'Tìm table và column trong database lạ: data dictionary, DESC', minutes: 15 },
      { id: 'c11-b4', title: 'Quyền: vì sao mình chỉ đọc được', minutes: 12 },
      { id: 'c11-b5', title: 'index và query chậm', minutes: 17 },
      { id: 'c11-b6', title: 'Ngày giờ ở Oracle thật: DATE có giờ, định dạng mặc định, so ngày cho đúng', minutes: 14 },
      { id: 'c11-b7', title: 'MySQL và Oracle khác nhau ở đâu', minutes: 18 },
      { id: 'c11-b8', title: 'Đọc một query dài của người khác', minutes: 16 },
    ],
  },
  {
    id: 12,
    title: 'Dự án cuối',
    about: 'Một báo cáo hoàn chỉnh bằng Oracle SQL trên database hr.',
    lessons: [{ id: 'c12-b1', title: 'Nhiệm vụ cuối: báo cáo bằng Oracle SQL', minutes: 18 }],
  },
];

/** Tổng số phút của mọi bài đang có trong mục lục (không tính bài tập). */
export const totalMinutes = chapters.reduce((n, c) => n + c.lessons.filter((l) => !l.exercise).reduce((m, l) => m + l.minutes, 0), 0);

/** Số giờ học làm tròn, ít nhất 1. Trang chủ ghi "khoảng N giờ học". */
export const totalHours = Math.max(1, Math.round(totalMinutes / 60));
