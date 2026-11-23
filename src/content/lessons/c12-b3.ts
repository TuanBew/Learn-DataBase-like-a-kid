import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE customers_new (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR(100),
  email VARCHAR(100)
);
CREATE TABLE orders_new (
  order_id INT PRIMARY KEY,
  customer_id INT,
  amount INT
);
INSERT INTO customers_new (customer_id, customer_name, email) VALUES
  (1, 'Công ty An Phát', 'anphat@example.vn'),
  (2, 'Công ty An Phát (nhập lại)', 'anphat@example.vn'),
  (3, 'Cửa hàng Bình Minh', 'binhminh@example.vn');
INSERT INTO orders_new (order_id, customer_id, amount) VALUES
  (101, 1, 500000),
  (102, 2, 300000),
  (103, 3, 200000),
  (104, 9, 150000),
  (105, 3, -80000);`;

const setupOracle = `CREATE TABLE customers_new (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR2(100),
  email VARCHAR2(100)
);
CREATE TABLE orders_new (
  order_id INT PRIMARY KEY,
  customer_id INT,
  amount INT
);
INSERT INTO customers_new (customer_id, customer_name, email) VALUES (1, 'Công ty An Phát', 'anphat@example.vn');
INSERT INTO customers_new (customer_id, customer_name, email) VALUES (2, 'Công ty An Phát (nhập lại)', 'anphat@example.vn');
INSERT INTO customers_new (customer_id, customer_name, email) VALUES (3, 'Cửa hàng Bình Minh', 'binhminh@example.vn');
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (101, 1, 500000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (102, 2, 300000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (103, 3, 200000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (104, 9, 150000);
INSERT INTO orders_new (order_id, customer_id, amount) VALUES (105, 3, -80000);
COMMIT;`;

const find = `SELECT o.order_id, o.customer_id, o.amount
FROM orders_new o
WHERE o.amount < 0
   OR NOT EXISTS (SELECT 1 FROM customers_new c WHERE c.customer_id = o.customer_id)
ORDER BY o.order_id;`;

const fixBody = `DELETE FROM orders_new
WHERE customer_id NOT IN (SELECT customer_id FROM customers_new);

UPDATE orders_new SET amount = 0 WHERE amount < 0;

UPDATE orders_new SET customer_id = 1 WHERE customer_id = 2;
DELETE FROM customers_new WHERE customer_id = 2;`;

export const lesson: Lesson = {
  id: 'c12-b3',
  chapter: 12,
  order: 3,
  title: 'Nhiệm vụ 3: đối soát và sửa dữ liệu lỗi, có transaction',
  lead: 'Bạn tìm dữ liệu lỗi, sao lưu, rồi sửa trong một transaction.',
  minutes: 12,
  goals: [
    'Tìm dữ liệu lỗi bằng SELECT',
    'Sao lưu table bằng CREATE TABLE AS SELECT',
    'Sửa trong transaction, có SAVEPOINT',
    'Kiểm lại rồi COMMIT',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Số liệu lệch',
      paragraphs: [
        'Cuối tháng, kế toán nhắn bạn: "Tổng doanh thu của hai báo cáo không bằng nhau."',
        'Bạn tìm ra ba loại lỗi. Có hai khách trùng email. Có một đơn trỏ tới khách không có thật. Có một đơn mang số tiền âm.',
        'Sửa dữ liệu thật rất dễ sai. Bạn đi từng bước, và mỗi bước đều có đường lui.',
      ],
    },
    {
      type: 'text',
      title: 'Sáu bước sửa dữ liệu an toàn',
      paragraphs: [
        'Bước 1: tìm row lỗi bằng SELECT. Chưa sửa gì.',
        'Bước 2: đếm số row lỗi và ghi lại. Con số này để so sau khi sửa.',
        'Bước 3: sao lưu. Chạy `CREATE TABLE orders_backup AS SELECT * FROM orders_new`. Lệnh này tự COMMIT, nên làm trước khi mở transaction.',
        'Bước 4: sửa trong một [[transaction]]. MySQL mở bằng `START TRANSACTION`. Oracle tự mở khi bạn chạy lệnh sửa đầu tiên.',
        'Đặt một **[[savepoint]]** trước khi sửa. Nếu một lệnh sai, `ROLLBACK TO` quay về điểm đó và các lệnh trước vẫn còn.',
        'Bước 5: kiểm lại. Chạy lại query ở bước 1. Query phải ra 0 row.',
        'Bước 6: nếu số đúng, chạy `COMMIT`. Nếu sai, chạy `ROLLBACK`. Oracle không lưu gì cho tới khi bạn COMMIT.',
        'Cuối cùng, viết hai dòng ghi chú cho người duyệt: đã sửa gì, bao nhiêu row, bản sao lưu nằm ở đâu.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: sửa dữ liệu lỗi của kế toán',
      intro:
        'Có hai table nhỏ, `customers_new` với 3 khách và `orders_new` với 5 đơn. Bấm Chạy để tìm các đơn lỗi. Sau đó bấm từng nút thử theo thứ tự từ trên xuống, và sau mỗi nút bấm Chạy.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: { mysql: `-- Bước 1: tìm đơn lỗi. Phải ra đơn 104 và 105.\n${find}`, oracle: `-- Bước 1: tìm đơn lỗi. Phải ra đơn 104 và 105.\n${find}` },
      tries: [
        {
          label: 'Tìm khách trùng email',
          sql: {
            mysql: 'SELECT email, COUNT(*) AS n\nFROM customers_new\nGROUP BY email\nHAVING COUNT(*) > 1;',
            oracle: 'SELECT email, COUNT(*) AS n\nFROM customers_new\nGROUP BY email\nHAVING COUNT(*) > 1;',
          },
        },
        {
          label: 'Sao lưu orders_new',
          sql: {
            mysql: 'CREATE TABLE orders_backup AS SELECT * FROM orders_new;',
            oracle: 'CREATE TABLE orders_backup AS SELECT * FROM orders_new;',
          },
        },
        {
          label: 'Sửa trong transaction, có SAVEPOINT',
          sql: {
            mysql: `START TRANSACTION;\nSAVEPOINT before_fix;\n${fixBody}`,
            oracle: `SAVEPOINT before_fix;\n${fixBody}`,
          },
        },
        {
          label: 'Kiểm lại: phải ra 0 row',
          sql: { mysql: find, oracle: find },
        },
        {
          label: 'Lưu hẳn bằng COMMIT',
          sql: { mysql: 'COMMIT;', oracle: 'COMMIT;' },
        },
        {
          label: 'Quay về SAVEPOINT sau COMMIT (báo lỗi)',
          sql: { mysql: 'ROLLBACK TO SAVEPOINT before_fix;', oracle: 'ROLLBACK TO SAVEPOINT before_fix;' },
          expect: 'error',
        },
      ],
      say: 'Sau lệnh sửa, query tìm lỗi ra 0 row. Sau COMMIT, savepoint mất, nên nút cuối báo lỗi. Table sao lưu vẫn giữ dữ liệu cũ.',
    },
    {
      type: 'text',
      title: 'Vì sao sửa từng bước',
      paragraphs: [
        'Bản sao lưu cho bạn đường lui sau khi COMMIT. Savepoint cho bạn đường lui ngay trong transaction.',
        'Khi sửa khách trùng, đổi các đơn sang khách giữ lại trước. Xóa khách trùng sau. Làm ngược lại thì đơn trỏ vào khách đã mất.',
        'Mỗi lệnh sửa dùng đúng một điều kiện WHERE. Chạy SELECT với điều kiện đó trước, đếm row, rồi mới đổi sang UPDATE hoặc DELETE.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Tìm lỗi bằng SELECT trước. Chưa sửa gì khi chưa đếm xong.',
        'Sao lưu bằng CREATE TABLE AS SELECT trước khi mở transaction, vì DDL tự COMMIT.',
        'MySQL mở transaction bằng START TRANSACTION. Oracle nhớ COMMIT.',
        'SAVEPOINT cho một điểm quay lại. ROLLBACK TO về điểm đó mà transaction vẫn mở.',
        'Kiểm lại bằng query tìm lỗi. Ra 0 row thì COMMIT. Ra khác thì ROLLBACK.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c SQL Language Reference, SAVEPOINT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SAVEPOINT.html' },
        { name: 'MySQL 8.0 Reference Manual, START TRANSACTION, COMMIT, ROLLBACK', url: 'https://dev.mysql.com/doc/refman/8.0/en/commit.html' },
        { name: 'Harvard CS50 SQL, Lecture 4', url: 'https://cs50.harvard.edu/sql/notes/4/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
