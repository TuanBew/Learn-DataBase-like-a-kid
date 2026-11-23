import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE sales (
  sale_id INT PRIMARY KEY,
  rep VARCHAR(30) NOT NULL,
  region VARCHAR(20) NOT NULL,
  amount INT NOT NULL
);
INSERT INTO sales (sale_id, rep, region, amount) VALUES
  (1, 'Lan', 'Bắc', 12000000),
  (2, 'Hùng', 'Bắc', 8000000),
  (3, 'Mai', 'Trung', 15000000),
  (4, 'Tùng', 'Trung', 5000000),
  (5, 'Anh', 'Nam', 20000000),
  (6, 'Châu', 'Nam', 7000000),
  (7, 'Lan', 'Bắc', 9000000),
  (8, 'Anh', 'Nam', 11000000);`;

const setupOracle = `CREATE TABLE sales (
  sale_id NUMBER PRIMARY KEY,
  rep VARCHAR2(30) NOT NULL,
  region VARCHAR2(20) NOT NULL,
  amount NUMBER NOT NULL
);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (1, 'Lan', 'Bắc', 12000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (2, 'Hùng', 'Bắc', 8000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (3, 'Mai', 'Trung', 15000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (4, 'Tùng', 'Trung', 5000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (5, 'Anh', 'Nam', 20000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (6, 'Châu', 'Nam', 7000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (7, 'Lan', 'Bắc', 9000000);
INSERT INTO sales (sale_id, rep, region, amount) VALUES (8, 'Anh', 'Nam', 11000000);
COMMIT;`;

const START = `-- Bước 1: tạo view. Lệnh này chỉ lưu câu SELECT.
CREATE VIEW v_region_total AS
SELECT region, SUM(amount) AS total, COUNT(*) AS sale_count
FROM sales
GROUP BY region;

-- Bước 2: đọc view như một table.
SELECT region, total, sale_count
FROM v_region_total
ORDER BY total DESC;`;

export const lesson: Lesson = {
  id: 'c9-b5',
  chapter: 9,
  order: 5,
  title: 'VIEW: một query có tên',
  lead: 'Bạn lưu một query dưới một cái tên, rồi đọc nó như đọc một table.',
  minutes: 14,
  goals: [
    'Tạo view bằng CREATE VIEW',
    'Đọc view bằng SELECT như một table',
    'Hiểu view không chứa dữ liệu riêng và chạy lại query mỗi lần đọc',
    'Dùng CREATE OR REPLACE VIEW và DROP VIEW',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Query dài mà ai cũng cần',
      paragraphs: [
        'Phòng kinh doanh có một query tính doanh số từng vùng. Query dài mười dòng, nối ba table.',
        'Mỗi lần ai đó cần con số này, họ chép query từ file cũ. Có người chép thiếu một dòng, và con số lệch.',
        'Bi đề nghị đặt cho query một cái tên. Từ nay mọi người chỉ viết `SELECT * FROM` và tên đó.',
        'Query có tên như vậy gọi là view.',
      ],
    },
    {
      type: 'text',
      title: 'View là query có tên',
      paragraphs: [
        '**[[view]]** là một câu SELECT được lưu lại dưới một cái tên. Bạn đọc view bằng SELECT, JOIN và WHERE như đọc một table.',
        'Cú pháp: `CREATE VIEW ten_view AS SELECT ...`. Sau chữ AS là câu SELECT bạn muốn lưu.',
        'View không chứa dữ liệu riêng. Mỗi lần bạn đọc view, database chạy lại câu SELECT đó trên các table gốc.',
        'Vì vậy view luôn thấy dữ liệu mới nhất. Table gốc thêm row thì lần đọc sau của view có row đó.',
        'View giấu phần phức tạp. Người đọc chỉ thấy các column của view, không cần biết phía sau có mấy lần JOIN.',
        'Ở công ty, bạn thường chỉ được đọc view do người khác tạo, ví dụ team dữ liệu. Bạn viết `SELECT` trên view và không cần quyền đụng vào table gốc.',
        'Xưởng dưới đây có table `sales` gồm 8 row. Hãy tạo một view tổng theo vùng, rồi đọc nó.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: tạo view rồi đọc nó',
      intro: 'Có sẵn table sales với 8 row. Bấm Chạy để tạo view v_region_total và đọc nó. Sau đó bấm từng nút thử, theo thứ tự từ trên xuống.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: { mysql: START, oracle: START },
      tries: [
        {
          label: 'Thêm một sale vào table gốc, rồi đọc lại view',
          sql: {
            mysql: `INSERT INTO sales (sale_id, rep, region, amount) VALUES (9, 'Mai', 'Trung', 30000000);

SELECT region, total, sale_count
FROM v_region_total
ORDER BY total DESC;`,
            oracle: `INSERT INTO sales (sale_id, rep, region, amount) VALUES (9, 'Mai', 'Trung', 30000000);

SELECT region, total, sale_count
FROM v_region_total
ORDER BY total DESC;`,
          },
        },
        {
          label: 'Lọc trên view bằng WHERE',
          sql: {
            mysql: `SELECT region, total
FROM v_region_total
WHERE total > 30000000;`,
            oracle: `SELECT region, total
FROM v_region_total
WHERE total > 30000000;`,
          },
        },
        {
          label: 'Tạo lại view cùng tên: báo lỗi vì tên đã có',
          expect: 'error',
          sql: {
            mysql: `CREATE VIEW v_region_total AS
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region;`,
            oracle: `CREATE VIEW v_region_total AS
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region;`,
          },
        },
        {
          label: 'Đổi định nghĩa bằng CREATE OR REPLACE VIEW',
          sql: {
            mysql: `CREATE OR REPLACE VIEW v_region_total AS
SELECT region, SUM(amount) AS total, MAX(amount) AS biggest_sale
FROM sales
GROUP BY region;

SELECT region, total, biggest_sale
FROM v_region_total
ORDER BY total DESC;`,
            oracle: `CREATE OR REPLACE VIEW v_region_total AS
SELECT region, SUM(amount) AS total, MAX(amount) AS biggest_sale
FROM sales
GROUP BY region;

SELECT region, total, biggest_sale
FROM v_region_total
ORDER BY total DESC;`,
          },
        },
        {
          label: 'Xóa view rồi đọc lại: báo lỗi vì view không còn',
          expect: 'error',
          sql: {
            mysql: `DROP VIEW v_region_total;

SELECT * FROM v_region_total;`,
            oracle: `DROP VIEW v_region_total;

SELECT * FROM v_region_total;`,
          },
        },
      ],
      say: 'Sau mục đầu, vùng Trung đã tăng thêm 30 triệu mà bạn không sửa gì ở view. View không lưu số liệu, nó chạy lại SELECT mỗi lần đọc. DROP VIEW chỉ xóa cái tên, 9 row của table sales vẫn còn nguyên.',
    },
    {
      type: 'text',
      title: 'Khi nào dùng view',
      paragraphs: [
        'Dùng view khi nhiều người cần cùng một query. Sửa một chỗ trong view thì mọi người thấy bản mới.',
        'Dùng view để giấu column không nên cho người khác thấy. View chỉ liệt kê các column cho phép.',
        'View không làm query chạy nhanh hơn. Database vẫn tính lại từ đầu mỗi lần đọc.',
        'Lệnh DROP VIEW chỉ xóa view. Dữ liệu trong các table gốc không mất.',
        'Query dùng window function cũng lưu được thành view. Ví dụ bảng top 3 mỗi phòng của bài trước.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'MySQL và Oracle đều có `CREATE OR REPLACE VIEW`. Hai dialect đều từ chối `CREATE VIEW` khi tên đã có: MySQL báo 1050, Oracle báo ORA-00955.',
        'Oracle còn có `WITH READ ONLY` ở cuối câu CREATE VIEW. Nó chặn mọi lệnh sửa dữ liệu qua view đó. Khóa học chưa chạy được cú pháp này nên ví dụ dưới chỉ để đọc.',
        'MySQL có `DROP VIEW IF EXISTS`. Oracle 19c không có IF EXISTS: xóa view không tồn tại thì báo ORA-00942.',
      ],
      mysql: 'CREATE OR REPLACE VIEW v_region_total AS\nSELECT region, SUM(amount) AS total\nFROM sales\nGROUP BY region;\n\nDROP VIEW IF EXISTS v_region_total;',
      oracle: 'CREATE OR REPLACE VIEW v_region_total AS\nSELECT region, SUM(amount) AS total\nFROM sales\nGROUP BY region\nWITH READ ONLY;\n\nDROP VIEW v_region_total;',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'View v_region_total đã tạo. Hôm sau table sales có thêm 5 row. Bạn đọc view. Chuyện gì xảy ra?',
          options: [
            { text: 'View thấy 5 row mới, vì nó chạy lại SELECT mỗi lần đọc', correct: true, feedback: 'Đúng. View không giữ dữ liệu cũ.' },
            { text: 'View vẫn là số liệu của hôm qua', feedback: 'View không lưu số liệu. Nó chỉ lưu câu SELECT và chạy lại mỗi lần.' },
            { text: 'Database báo lỗi cho tới khi bạn tạo lại view', feedback: 'View không cần tạo lại khi table gốc có thêm row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `DROP VIEW v_region_total`. Dữ liệu trong table sales thế nào?',
          options: [
            { text: 'Còn nguyên, vì DROP VIEW chỉ xóa câu SELECT đã lưu', correct: true, feedback: 'Đúng. View không chứa dữ liệu, nên xóa view không mất dữ liệu.' },
            { text: 'Mất hết', feedback: 'Dữ liệu nằm trong table sales, không nằm trong view.' },
            { text: 'Chỉ mất các row đã được view tính', feedback: 'View không sở hữu row nào. Các row vẫn thuộc table gốc.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Team dữ liệu tạo view báo cáo cho bạn. Bạn muốn dùng nó. Bạn làm gì?',
          options: [
            { text: 'Viết `SELECT ... FROM` tên view, như đọc một table', correct: true, feedback: 'Đúng. Bạn không cần biết view viết thế nào bên trong.' },
            { text: 'Chép lại câu SELECT trong view vào query của bạn', feedback: 'Cách này bỏ mất lợi ích của view. Gọi view bằng tên là đủ.' },
            { text: 'Xin quyền đọc từng table gốc của view', feedback: 'Bạn chỉ cần quyền đọc view. Đó là một lý do người ta dùng view.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'View báo cáo của team dữ liệu',
      paragraphs: [
        'Team dữ liệu của một công ty tạo view v_doanh_thu_thang. Bên trong là bốn lần JOIN và vài phép tính phức tạp.',
        'Các phòng khác chỉ được đọc view. Họ viết `SELECT * FROM v_doanh_thu_thang WHERE ...` và có số liệu ngay.',
        'Khi quy tắc tính doanh thu đổi, team dữ liệu sửa view một lần. Mọi báo cáo của mọi phòng dùng cách tính mới từ lần chạy sau.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'View là một câu SELECT có tên. Đọc view bằng SELECT như đọc một table.',
        'View không chứa dữ liệu riêng. Mỗi lần đọc, database chạy lại câu SELECT.',
        '`CREATE OR REPLACE VIEW` đổi định nghĩa. `DROP VIEW` xóa view và giữ nguyên table gốc.',
        'Oracle có `WITH READ ONLY`. Oracle 19c không có `DROP VIEW IF EXISTS`.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, CREATE VIEW Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-view.html' },
        { name: 'Oracle Database 19c SQL Language Reference, CREATE VIEW', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-VIEW.html' },
      ],
    },
  ],
};
