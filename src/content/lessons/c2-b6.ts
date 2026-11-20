import type { Lesson } from '../types';

const mysqlOrders = `CREATE TABLE orders (
  order_id INT AUTO_INCREMENT,
  customer_id INT,
  store_id INT NOT NULL,
  staff_id INT NOT NULL,
  ordered_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment VARCHAR(20) NOT NULL,
  PRIMARY KEY (order_id),
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  FOREIGN KEY (store_id) REFERENCES stores (store_id),
  FOREIGN KEY (staff_id) REFERENCES staff (staff_id)
);`;

const oracleOrders = `CREATE TABLE orders (
  order_id NUMBER GENERATED AS IDENTITY,
  customer_id NUMBER,
  store_id NUMBER NOT NULL,
  staff_id NUMBER NOT NULL,
  ordered_at DATE NOT NULL,
  status VARCHAR2(20) NOT NULL,
  payment VARCHAR2(20) NOT NULL,
  PRIMARY KEY (order_id),
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  FOREIGN KEY (store_id) REFERENCES stores (store_id),
  FOREIGN KEY (staff_id) REFERENCES staff (staff_id)
);`;

export const lesson: Lesson = {
  id: 'c2-b6',
  chapter: 2,
  order: 6,
  title: 'Đọc ERD và CREATE TABLE',
  lead: 'Sơ đồ cho bạn thấy các table nối nhau ra sao. CREATE TABLE cho thấy cách dựng từng table.',
  minutes: 16,
  goals: [
    'Đọc sơ đồ 6 table của tiệm trà sữa',
    'Chỉ ra table nào nối với table nào',
    'Đọc một câu CREATE TABLE: tên column, data type, constraint',
    'Nói được MySQL và Oracle viết CREATE TABLE khác ở đâu',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Bản đồ của kho',
      paragraphs: [
        'Kho của mình có sáu table. Người mới vào kho thường lạc, vì không biết table nào cất gì.',
        'Mình vẽ một tấm bản đồ treo ở cửa. Mỗi table là một hộp. Hai hộp có quan hệ thì mình kẻ một đường nối.',
        'Nhìn bản đồ, ai cũng biết đơn nằm ở đâu, khách nằm ở đâu, và hai chỗ đó nối với nhau thế nào.',
        'Bấm vào từng hộp để xem nó nối với ai.',
      ],
    },
    {
      type: 'scene',
      scene: 'erd',
      title: 'Bản đồ 6 table',
      intro: 'Bấm vào một table. Xem table đó nối với những table nào.',
    },
    {
      type: 'code',
      title: 'Câu CREATE TABLE của orders',
      intro: 'Đọc từ trên xuống. Mỗi cụm là một column hoặc một luật.',
      code: mysqlOrders,
      notes: [
        { find: 'CREATE TABLE orders', text: 'Lệnh dựng một table mới tên orders.' },
        { find: 'order_id INT AUTO_INCREMENT', text: 'Column mã đơn chứa số nguyên, và MySQL tự đánh số tăng dần khi thêm row.' },
        { find: 'customer_id INT,', text: 'Không có NOT NULL, nên ô này được để NULL, như đơn của khách vãng lai.' },
        { find: 'ordered_at DATETIME NOT NULL', text: 'DATETIME chứa cả ngày lẫn giờ, và NOT NULL bắt đơn nào cũng có giờ đặt.' },
        { find: 'status VARCHAR(20) NOT NULL', text: 'VARCHAR(20) chứa chữ dài tối đa 20 ký tự, và đơn nào cũng phải có trạng thái.' },
        { find: 'PRIMARY KEY (order_id)', text: 'Column order_id là primary key của orders: không trùng và không trống.' },
        { find: 'FOREIGN KEY (customer_id) REFERENCES customers (customer_id)', text: 'Mã khách trên đơn phải có sẵn trong column customer_id của table customers.' },
      ],
    },
    {
      type: 'text',
      title: 'Cách đọc một câu CREATE TABLE',
      paragraphs: [
        '**[[erd]]** là tên của tấm bản đồ ở trên. Hộp là table, đường nối là foreign key.',
        'Phía "nhiều" của đường nối thường vẽ ba nhánh, giống chân gà.',
        'Trong sơ đồ này, orders nối với customers, stores và staff. order_items nối với orders và products.',
        '**[[create-table]]** dựng một table. Sau tên table là các column, cách nhau bằng dấu phẩy.',
        'Mỗi column có ba phần: tên, **[[data-type]]**, rồi các constraint nếu có. `INT` là số nguyên, `VARCHAR(20)` là chữ, `DATETIME` là ngày giờ.',
        'Cuối câu là các luật của cả table: PRIMARY KEY và FOREIGN KEY. Foreign key viết thêm REFERENCES để chỉ table và column cần trỏ tới.',
        'Lệnh như CREATE TABLE thuộc nhóm **[[ddl]]**: nhóm lệnh dựng và đổi cấu trúc của database.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle viết cùng table này hơi khác. Số nguyên là NUMBER, chữ là VARCHAR2.',
        'DATE của Oracle lưu cả ngày lẫn giờ, nên không cần DATETIME.',
        'Oracle dùng GENERATED AS IDENTITY thay cho AUTO_INCREMENT. Với cách viết này, Oracle tự cấp số và INSERT không được gán id bằng tay.',
        'Ở Oracle, lệnh như CREATE TABLE tự COMMIT. Các thay đổi đang chờ COMMIT trước đó cũng được lưu theo.',
      ],
      mysql: mysqlOrders,
      oracle: oracleOrders,
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Trong câu CREATE TABLE ở trên, column nào cho phép để NULL?',
          options: [
            { text: 'customer_id', correct: true, feedback: 'Đúng. Column này không có NOT NULL, nên đơn của khách vãng lai để trống được.' },
            { text: 'ordered_at', feedback: 'Column này có NOT NULL, nên đơn nào cũng phải có giờ đặt.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi phần của câu CREATE TABLE với tác dụng của nó.',
          pairs: [
            { left: 'INT', right: 'Chỉ định data type số nguyên' },
            { left: 'NOT NULL', right: 'Bắt ô phải có giá trị' },
            { left: 'PRIMARY KEY (order_id)', right: 'Mã riêng của mỗi đơn' },
            { left: 'REFERENCES customers', right: 'Trỏ sang table khách' },
          ],
          done: 'Đúng hết. Bạn đã đọc được một câu CREATE TABLE.',
        },
        {
          kind: 'choice',
          question: 'Bạn chạy CREATE TABLE ở Oracle. Cần gõ COMMIT để lưu table không?',
          options: [
            { text: 'Không, lệnh này tự COMMIT', correct: true, feedback: 'Đúng. Lệnh DDL như CREATE TABLE tự COMMIT ở Oracle.' },
            { text: 'Có, nếu không table sẽ mất', feedback: 'Ở Oracle, CREATE TABLE đã tự COMMIT, nên table được lưu ngay.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'GitHub cất dữ liệu trong MySQL',
      paragraphs: [
        'GitHub dùng MySQL làm kho dữ liệu chính cho mọi thứ ngoài git.',
        'Câu CREATE TABLE bạn vừa đọc viết theo cú pháp của MySQL.',
      ],
      source: {
        name: 'GitHub Blog: MySQL High Availability at GitHub',
        url: 'https://github.blog/engineering/infrastructure/mysql-high-availability-at-github/',
      },
    },
    {
      type: 'keypoints',
      items: [
        'ERD vẽ table thành hộp và foreign key thành đường nối.',
        'CREATE TABLE khai tên column, data type và constraint.',
        'MySQL viết INT, DATETIME, AUTO_INCREMENT. Oracle viết NUMBER, DATE, GENERATED AS IDENTITY.',
        'Ở Oracle, lệnh DDL như CREATE TABLE tự COMMIT.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual: CREATE TABLE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table.html' },
        { name: 'MySQL 8.0 Reference Manual: The CHAR and VARCHAR Types', url: 'https://dev.mysql.com/doc/refman/8.0/en/char.html' },
        { name: 'MySQL 8.0 Reference Manual: The DATE, DATETIME, and TIMESTAMP Types', url: 'https://dev.mysql.com/doc/refman/8.0/en/datetime.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Data Types', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html' },
        { name: 'Oracle Database 19c SQL Language Reference: CREATE TABLE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html' },
        { name: 'Oracle Database 19c SQL Language Reference: COMMIT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html' },
      ],
    },
  ],
};
