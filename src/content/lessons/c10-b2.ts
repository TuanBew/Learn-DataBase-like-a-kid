import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  full_name VARCHAR(50) NOT NULL,
  status VARCHAR(10) NOT NULL,
  total_spent DECIMAL(12,2)
);
CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR(10) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);
INSERT INTO customers (customer_id, full_name, status, total_spent) VALUES
  (1, 'Trần Văn An', 'active', NULL),
  (2, 'Lê Thị Bình', 'blocked', NULL),
  (3, 'Phạm Quốc Cường', 'active', NULL),
  (4, 'Đỗ Thu Dung', 'blocked', NULL);
INSERT INTO orders (order_id, customer_id, total, status) VALUES
  (101, 1, 120000, 'paid'),
  (102, 1, 80000, 'pending'),
  (103, 2, 200000, 'pending'),
  (104, 2, 150000, 'paid'),
  (105, 3, 60000, 'pending'),
  (106, 4, 90000, 'pending');`;

const setupOracle = `CREATE TABLE customers (
  customer_id NUMBER PRIMARY KEY,
  full_name VARCHAR2(50) NOT NULL,
  status VARCHAR2(10) NOT NULL,
  total_spent NUMBER(12,2)
);
CREATE TABLE orders (
  order_id NUMBER PRIMARY KEY,
  customer_id NUMBER NOT NULL,
  total NUMBER(12,2) NOT NULL,
  status VARCHAR2(10) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);
INSERT INTO customers (customer_id, full_name, status, total_spent) VALUES (1, 'Trần Văn An', 'active', NULL);
INSERT INTO customers (customer_id, full_name, status, total_spent) VALUES (2, 'Lê Thị Bình', 'blocked', NULL);
INSERT INTO customers (customer_id, full_name, status, total_spent) VALUES (3, 'Phạm Quốc Cường', 'active', NULL);
INSERT INTO customers (customer_id, full_name, status, total_spent) VALUES (4, 'Đỗ Thu Dung', 'blocked', NULL);
INSERT INTO orders (order_id, customer_id, total, status) VALUES (101, 1, 120000, 'paid');
INSERT INTO orders (order_id, customer_id, total, status) VALUES (102, 1, 80000, 'pending');
INSERT INTO orders (order_id, customer_id, total, status) VALUES (103, 2, 200000, 'pending');
INSERT INTO orders (order_id, customer_id, total, status) VALUES (104, 2, 150000, 'paid');
INSERT INTO orders (order_id, customer_id, total, status) VALUES (105, 3, 60000, 'pending');
INSERT INTO orders (order_id, customer_id, total, status) VALUES (106, 4, 90000, 'pending');
COMMIT;`;

const whereBlocked = `status = 'pending'
  AND customer_id IN (SELECT customer_id FROM customers WHERE status = 'blocked')`;

const deleteWhere = `status = 'cancelled'
  AND EXISTS (SELECT 1 FROM customers c
              WHERE c.customer_id = orders.customer_id AND c.status = 'blocked')`;

const setTotal = `UPDATE customers
SET total_spent = COALESCE(
  (SELECT SUM(total) FROM orders
   WHERE orders.customer_id = customers.customer_id AND orders.status = 'paid'), 0)`;

export const lesson: Lesson = {
  id: 'c10-b2',
  chapter: 10,
  order: 2,
  title: 'UPDATE và DELETE dựa vào table khác',
  lead: 'Bạn sửa hoặc xóa row theo điều kiện nằm ở table khác, và đếm row trước khi sửa.',
  minutes: 15,
  goals: [
    'Viết UPDATE và DELETE có subquery trong WHERE',
    'Lấy giá trị mới từ table khác bằng subquery trong SET',
    'Chạy SELECT với cùng WHERE để đếm row trước khi sửa',
    'Biết MySQL báo lỗi 1093 khi subquery đọc chính table đang sửa',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hủy đơn của khách bị khóa',
      paragraphs: [
        'Chị Hạnh ở bộ phận chăm sóc khách hàng nhắn cho Bi: "Hủy hết đơn chưa giao của khách đã bị khóa."',
        'Bi mở table orders. Table này chỉ có mã khách, không có trạng thái của khách.',
        'Trạng thái khách nằm ở table customers. Bi cần nhìn sang table đó để biết khách nào bị khóa.',
        'Bi không muốn tra từng khách bằng tay. Bi nhờ SQL tra giúp trong cùng một lệnh.',
      ],
    },
    {
      type: 'text',
      title: 'Subquery trong WHERE của UPDATE',
      paragraphs: [
        'Bạn đã biết **[[subquery]]**: một query nằm trong query khác. Subquery dùng được trong WHERE của UPDATE và DELETE.',
        '`WHERE customer_id IN (SELECT customer_id FROM customers WHERE status = \'blocked\')` nghĩa là: mã khách nằm trong danh sách khách bị khóa.',
        'Subquery chạy trước và ra danh sách mã khách. Rồi UPDATE sửa những row của orders có mã khách trong danh sách.',
        'Với **[[exists]]**, bạn hỏi: có row nào ở table kia khớp với row này không? Có thì row này bị sửa hoặc bị xóa.',
        'Subquery trong WHERE chỉ lọc row. Giá trị mới của UPDATE vẫn do SET quyết định.',
      ],
    },
    {
      type: 'code',
      title: 'Ba cách dùng subquery khi sửa dữ liệu',
      intro: 'Đọc từng lệnh. Phần diễn tập ngay bên dưới sẽ cho bạn chạy.',
      code:
        "UPDATE orders\nSET status = 'cancelled'\nWHERE status = 'pending'\n  AND customer_id IN (SELECT customer_id FROM customers WHERE status = 'blocked');\n\nDELETE FROM orders\nWHERE status = 'cancelled'\n  AND EXISTS (SELECT 1 FROM customers c\n              WHERE c.customer_id = orders.customer_id AND c.status = 'blocked');\n\nUPDATE customers\nSET total_spent = (SELECT SUM(total) FROM orders\n                   WHERE orders.customer_id = customers.customer_id);",
      notes: [
        { find: 'customer_id IN (SELECT customer_id FROM customers WHERE status = \'blocked\')', text: 'Subquery ra danh sách khách bị khóa. UPDATE chỉ sửa đơn của những khách trong danh sách.' },
        { find: 'EXISTS (SELECT 1 FROM customers c', text: 'EXISTS hỏi: khách của đơn này có bị khóa không? Có thì DELETE xóa đơn.' },
        { find: 'c.customer_id = orders.customer_id', text: 'Subquery nhắc tới row của orders đang xét. Nhờ vậy mỗi đơn được hỏi về khách của chính nó.' },
        { find: 'SET total_spent = (SELECT SUM(total)', text: 'Subquery ở vế phải của SET tính giá trị mới. Subquery này chỉ được ra một giá trị cho mỗi row.' },
      ],
    },
    {
      type: 'text',
      title: 'Subquery ở vế phải của SET',
      paragraphs: [
        'Đôi khi giá trị mới nằm ở table khác. Khi đó bạn đặt một subquery sau dấu `=` trong SET.',
        'Subquery phải ra đúng một giá trị cho mỗi row được sửa. Ra nhiều hơn một giá trị thì database báo lỗi và không sửa gì.',
        'Subquery không ra row nào thì giá trị là NULL. Khách chưa có đơn nào sẽ nhận NULL, không phải 0.',
        'Muốn 0 thay cho NULL, bọc subquery trong `COALESCE(..., 0)`.',
      ],
    },
    {
      type: 'text',
      title: 'Thói quen: đếm trước khi sửa',
      paragraphs: [
        'Bài trước bạn học chạy SELECT trước khi sửa. Với subquery, thói quen này càng cần.',
        'Chép đúng phần WHERE sang một câu SELECT COUNT(*). Chạy câu đó và ghi lại số row.',
        'Chạy UPDATE hoặc DELETE xong, database báo số row đã đổi. Hai số phải bằng nhau.',
        'Hai số lệch nhau thì dừng lại. Ở Oracle, gõ ROLLBACK trước khi làm tiếp.',
      ],
    },
    {
      type: 'text',
      title: 'MySQL không cho đọc chính table đang sửa',
      paragraphs: [
        'MySQL báo lỗi 1093 khi subquery đọc chính table mà UPDATE hoặc DELETE đang sửa.',
        'Ví dụ: `UPDATE orders ... WHERE order_id IN (SELECT order_id FROM orders ...)`. Table orders vừa bị sửa vừa bị đọc.',
        'Cách gỡ: bọc phần đọc trong một subquery nữa ở FROM, và đặt tên cho nó. MySQL chép kết quả ra chỗ riêng trước, rồi mới sửa.',
        'Oracle không có luật này. Subquery đọc chính table đang sửa vẫn chạy được.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: hủy đơn của khách bị khóa',
      intro: 'Có hai table nhỏ: customers với 4 khách và orders với 6 đơn. Bấm Chạy để đếm đơn cần hủy, hủy chúng, rồi xem kết quả. Sau đó bấm từng nút thử, theo thứ tự từ trên xuống.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: `-- Bước 1: đếm. Phải ra 2 đơn.
SELECT COUNT(*) AS so_don FROM orders
WHERE ${whereBlocked};

-- Bước 2: giữ nguyên WHERE, đổi sang UPDATE.
UPDATE orders
SET status = 'cancelled'
WHERE ${whereBlocked};

SELECT order_id, customer_id, status FROM orders ORDER BY order_id;`,
        oracle: `-- Bước 1: đếm. Phải ra 2 đơn.
SELECT COUNT(*) AS so_don FROM orders
WHERE ${whereBlocked};

-- Bước 2: giữ nguyên WHERE, đổi sang UPDATE.
UPDATE orders
SET status = 'cancelled'
WHERE ${whereBlocked};

SELECT order_id, customer_id, status FROM orders ORDER BY order_id;

COMMIT;`,
      },
      tries: [
        {
          label: 'Xóa đơn đã hủy bằng EXISTS',
          sql: {
            mysql: `SELECT COUNT(*) AS so_don FROM orders
WHERE ${deleteWhere};

DELETE FROM orders
WHERE ${deleteWhere};

SELECT order_id, customer_id, status FROM orders ORDER BY order_id;`,
            oracle: `SELECT COUNT(*) AS so_don FROM orders
WHERE ${deleteWhere};

DELETE FROM orders
WHERE ${deleteWhere};

SELECT order_id, customer_id, status FROM orders ORDER BY order_id;

COMMIT;`,
          },
        },
        {
          label: 'Tính total_spent bằng subquery trong SET',
          sql: {
            mysql: `${setTotal};

SELECT customer_id, full_name, total_spent FROM customers ORDER BY customer_id;`,
            oracle: `${setTotal};

SELECT customer_id, full_name, total_spent FROM customers ORDER BY customer_id;

COMMIT;`,
          },
        },
        {
          label: 'Subquery ra nhiều giá trị',
          expect: 'error',
          sql: {
            mysql: `UPDATE customers
SET total_spent = (SELECT total FROM orders WHERE orders.customer_id = customers.customer_id);`,
            oracle: `UPDATE customers
SET total_spent = (SELECT total FROM orders WHERE orders.customer_id = customers.customer_id);`,
          },
        },
        {
          label: 'Subquery đọc chính table đang sửa',
          expect: { mysql: 'error', oracle: 'ok' },
          sql: {
            mysql: `-- MySQL báo lỗi 1093: orders vừa bị sửa vừa bị đọc.
UPDATE orders
SET status = 'paid'
WHERE order_id IN (SELECT order_id FROM orders WHERE status = 'pending' AND total > 70000);`,
            oracle: `-- Oracle chạy được. ROLLBACK ở cuối để bỏ thay đổi này.
UPDATE orders
SET status = 'paid'
WHERE order_id IN (SELECT order_id FROM orders WHERE status = 'pending' AND total > 70000);

ROLLBACK;`,
          },
        },
        {
          label: 'Bọc subquery trong FROM để gỡ lỗi 1093',
          sql: {
            mysql: `UPDATE orders
SET status = 'paid'
WHERE order_id IN (
  SELECT order_id FROM (
    SELECT order_id FROM orders WHERE status = 'pending' AND total > 70000
  ) t
);

SELECT order_id, status FROM orders ORDER BY order_id;`,
            oracle: `UPDATE orders
SET status = 'paid'
WHERE order_id IN (
  SELECT order_id FROM (
    SELECT order_id FROM orders WHERE status = 'pending' AND total > 70000
  ) t
);

SELECT order_id, status FROM orders ORDER BY order_id;

COMMIT;`,
          },
        },
      ],
      say: 'Hai nút cuối cùng đi cùng nhau. Nút "Subquery đọc chính table đang sửa" báo lỗi 1093 trên MySQL, còn nút kế tiếp là cách gỡ.',
    },
    {
      type: 'oracle',
      body: [
        'MySQL có cú pháp UPDATE JOIN: viết `UPDATE a JOIN b ON ... SET ...`. Oracle không có cú pháp này.',
        'Ở Oracle, dùng subquery như bài này. Oracle còn có lệnh MERGE để sửa nhiều column từ table khác.',
        'Mỗi UPDATE hoặc DELETE ở Oracle xong, nhớ COMMIT để lưu hẳn. Chưa COMMIT thì phiên của người khác chưa thấy thay đổi.',
        'Lỗi 1093 chỉ có ở MySQL. Cùng câu lệnh đó, Oracle chạy bình thường.',
      ],
      mysql:
        "UPDATE orders o\nJOIN customers c ON c.customer_id = o.customer_id\nSET o.status = 'cancelled'\nWHERE c.status = 'blocked' AND o.status = 'pending';",
      oracle:
        "UPDATE orders\nSET status = 'cancelled'\nWHERE status = 'pending'\n  AND customer_id IN (SELECT customer_id FROM customers WHERE status = 'blocked');\nCOMMIT;",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn sắp chạy `DELETE FROM orders WHERE customer_id IN (SELECT customer_id FROM customers WHERE status = \'blocked\')`. Bạn nên làm gì đầu tiên?',
          options: [
            { text: 'Chạy SELECT COUNT(*) FROM orders với đúng WHERE đó', correct: true, feedback: 'Đúng. Số row đếm được là số row bạn dự tính xóa. Lát nữa so với số row DELETE báo.' },
            { text: 'Chạy DELETE luôn, sai thì tính sau', feedback: 'Xóa xong mới biết sai thì phải nhờ ROLLBACK hoặc bản sao lưu. Đếm trước rẻ hơn nhiều.' },
            { text: 'Đổi IN thành EXISTS cho nhanh', feedback: 'IN và EXISTS cho cùng kết quả ở câu này. Đổi không giúp bạn biết bao nhiêu row sẽ bị xóa.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Trên MySQL, bạn viết `UPDATE orders SET status = \'paid\' WHERE order_id IN (SELECT order_id FROM orders WHERE total > 70000)`. Chuyện gì xảy ra?',
          options: [
            { text: 'MySQL báo lỗi 1093 vì subquery đọc chính table đang sửa', correct: true, feedback: 'Đúng. Bọc phần đọc trong một subquery ở FROM và đặt tên cho nó là cách gỡ.' },
            { text: 'MySQL sửa các row và báo số row đã đổi', feedback: 'MySQL không cho table vừa bị sửa vừa bị đọc trong cùng lệnh.' },
            { text: 'MySQL bỏ qua subquery và sửa mọi row', feedback: 'MySQL không bỏ qua gì cả. MySQL báo lỗi và không sửa row nào.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Trong `SET total_spent = (SELECT SUM(total) FROM orders WHERE ...)`, một khách chưa có đơn nào. Giá trị mới của khách đó là gì?',
          options: [
            { text: 'NULL', correct: true, feedback: 'Đúng. Subquery không có row để cộng nên SUM ra NULL. Bọc COALESCE(..., 0) nếu bạn muốn 0.' },
            { text: '0', feedback: 'SUM của tập rỗng ra NULL, không phải 0.' },
            { text: 'Database báo lỗi', feedback: 'Không lỗi. Subquery ra một giá trị, và giá trị đó là NULL.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Cập nhật số liệu cuối tháng',
      paragraphs: [
        'Cuối tháng, bộ phận kế toán cần số tổng chi của từng khách để gửi quà tri ân.',
        'Một lệnh UPDATE với subquery trong SET tính tổng từ table đơn hàng và ghi vào table khách. Người làm chạy SELECT cùng điều kiện trước để đếm khách, rồi mới chạy UPDATE.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'UPDATE và DELETE nhận subquery trong WHERE, dùng IN hoặc EXISTS.',
        'Subquery ở vế phải của SET phải ra đúng một giá trị cho mỗi row. Không có row thì ra NULL.',
        'Chép WHERE sang SELECT COUNT(*), đếm, rồi so với số row UPDATE hoặc DELETE báo.',
        'MySQL báo 1093 khi subquery đọc chính table đang sửa. Bọc nó trong subquery ở FROM để gỡ.',
        'Oracle không có UPDATE JOIN và nhớ COMMIT sau khi sửa.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, UPDATE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/update.html' },
        { name: 'MySQL 8.0 Reference Manual, DELETE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/delete.html' },
        { name: 'MySQL 8.0 Reference Manual, Restrictions on Subqueries', url: 'https://dev.mysql.com/doc/refman/8.0/en/subquery-restrictions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, UPDATE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/UPDATE.html' },
        { name: 'Oracle Database 19c SQL Language Reference, DELETE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/DELETE.html' },
      ],
    },
  ],
};
