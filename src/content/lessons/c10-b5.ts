import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE menu_items (
  item_id INT PRIMARY KEY,
  item_name VARCHAR(40) NOT NULL,
  price DECIMAL(12,2) NOT NULL
);
INSERT INTO menu_items (item_id, item_name, price) VALUES
  (1, 'Cà phê sữa', 30000),
  (2, 'Trà đào', 45000),
  (3, 'Trà sữa', 48000),
  (4, 'Matcha đá xay', 55000),
  (5, 'Bánh flan', 25000);`;

const setupOracle = `CREATE TABLE menu_items (
  item_id NUMBER PRIMARY KEY,
  item_name VARCHAR2(40) NOT NULL,
  price NUMBER(12,2) NOT NULL
);
INSERT INTO menu_items (item_id, item_name, price) VALUES (1, 'Cà phê sữa', 30000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (2, 'Trà đào', 45000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (3, 'Trà sữa', 48000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (4, 'Matcha đá xay', 55000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (5, 'Bánh flan', 25000);
COMMIT;`;

const backupSteps = `-- Đếm row sắp sửa. Phải ra 3.
SELECT COUNT(*) AS truoc FROM menu_items
WHERE price >= 40000;

-- Chép đúng các row đó sang table mới.
CREATE TABLE menu_items_bak AS
SELECT * FROM menu_items
WHERE price >= 40000;

-- Đếm row ở table chép. Cũng phải ra 3.
SELECT COUNT(*) AS sau FROM menu_items_bak;`;

const badUpdate = `UPDATE menu_items
SET price = price * 10
WHERE price >= 40000;

SELECT item_id, item_name, price FROM menu_items ORDER BY item_id;`;

const dupBak = `INSERT INTO menu_items_bak (item_id, item_name, price)
VALUES (2, 'Trà đào bản trùng', 1);

SELECT item_id, item_name FROM menu_items_bak ORDER BY item_id;

DELETE FROM menu_items_bak WHERE item_name = 'Trà đào bản trùng';`;

const restore = `UPDATE menu_items
SET price = (SELECT b.price FROM menu_items_bak b
             WHERE b.item_id = menu_items.item_id)
WHERE item_id IN (SELECT item_id FROM menu_items_bak);

SELECT item_id, item_name, price FROM menu_items ORDER BY item_id;`;

export const lesson: Lesson = {
  id: 'c10-b5',
  chapter: 10,
  order: 5,
  title: 'Sao lưu trước khi sửa: CREATE TABLE AS SELECT',
  lead: 'Bạn chép các row sắp sửa sang một table mới, để lấy lại giá trị cũ khi sửa hỏng.',
  minutes: 13,
  goals: [
    'Chép row sang table mới bằng CREATE TABLE ... AS SELECT',
    'Đếm row trước và sau khi chép',
    'Biết table chép không mang theo primary key và foreign key',
    'Khôi phục giá trị cũ từ table chép, rồi DROP table chép',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Nhân mười thay vì nhân một phẩy một',
      paragraphs: [
        'Quản lý nhờ Bi tăng giá các món từ 40.000 đồng trở lên thêm mười phần trăm.',
        'Bi gõ UPDATE, chạy, rồi COMMIT. Một phút sau, quản lý hỏi: "Sao trà sữa giá 480.000 đồng?"',
        'Bi nhìn lại lệnh. Bi viết `price * 10` thay vì `price * 1.1`.',
        'Đã COMMIT thì ROLLBACK không cứu được. May là Bi chép giá cũ ra một table riêng từ trước.',
      ],
    },
    {
      type: 'text',
      title: 'Chép row ra table mới',
      paragraphs: [
        '**[[ctas]]** là lệnh `CREATE TABLE ... AS SELECT`. Lệnh này chạy một SELECT, rồi tạo table mới từ kết quả.',
        'Table mới có cùng tên column và cùng data type với kết quả SELECT. Các row của kết quả nằm sẵn trong đó.',
        'Bạn chỉ chép những row sắp sửa, nên đặt cùng WHERE với lệnh sửa.',
        'Ví dụ: `CREATE TABLE menu_items_bak AS SELECT * FROM menu_items WHERE price >= 40000`.',
        'Đặt tên table chép có ngày hoặc chữ `bak`, như `menu_items_bak` hoặc `staff_bak_20261123`. Sau này bạn nhìn tên là biết nó là bản chép.',
      ],
    },
    {
      type: 'text',
      title: 'Đếm trước, đếm sau',
      paragraphs: [
        'Chép xong, đếm row. Chạy `SELECT COUNT(*)` trên table gốc với cùng WHERE, rồi trên table chép.',
        'Hai số phải bằng nhau. Lệch nhau nghĩa là bản chép thiếu row, và bạn chưa được sửa.',
        'Chỉ sửa khi bản chép đủ row.',
      ],
    },
    {
      type: 'text',
      title: 'Bản chép không mang theo constraint',
      paragraphs: [
        'Table chép chỉ mang theo column và dữ liệu. **[[primary-key]]** và **[[foreign-key]]** của table gốc không đi theo.',
        'MySQL không tự tạo index hay primary key cho table mới. Oracle chỉ chép constraint NOT NULL. Các constraint khác thì cả hai database đều không chép.',
        'Vì vậy table chép chấp nhận hai row cùng mã. Table chép cũng không có index để tìm nhanh theo mã.',
        'Hãy coi table chép là tờ giấy ghi giá cũ. Đừng dùng nó thay cho table gốc.',
      ],
    },
    {
      type: 'text',
      title: 'Sửa hỏng thì lấy lại, xong thì dọn',
      paragraphs: [
        'Khi sửa sai, bạn lấy giá trị cũ từ table chép. Dùng UPDATE với subquery trong SET, ghép hai table theo mã.',
        'Khôi phục xong, SELECT kiểm lại và so với bản chép.',
        'Khi mọi người đã xác nhận dữ liệu đúng, `DROP TABLE` để xóa table chép. Đừng để table chép nằm mãi trong database của công ty.',
        'Ở nhiều công ty, người quản trị giữ bản chép vài ngày rồi mới cho xóa. Hỏi họ trước khi DROP.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: sao lưu, sửa nhầm, khôi phục',
      intro:
        'Table menu_items có 5 món, 3 món từ 40.000 đồng trở lên. Bấm Chạy để đếm và chép 3 món đó. Rồi bấm từng nút thử, theo thứ tự từ trên xuống. Nhìn khung cấu trúc để so menu_items với menu_items_bak.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: { mysql: backupSteps, oracle: backupSteps },
      tries: [
        {
          label: 'Sửa nhầm: nhân 10',
          sql: {
            mysql: badUpdate,
            oracle: `${badUpdate}\n\nCOMMIT;`,
          },
        },
        {
          label: 'Thêm row trùng mã vào bản chép',
          sql: {
            mysql: dupBak,
            oracle: `${dupBak}\n\nCOMMIT;`,
          },
        },
        {
          label: 'Thêm row trùng mã vào table gốc',
          expect: 'error',
          sql: {
            mysql: "-- Table gốc có primary key, nên MySQL báo lỗi 1062.\nINSERT INTO menu_items (item_id, item_name, price)\nVALUES (2, 'Trà đào bản trùng', 1);",
            oracle: "-- Table gốc có primary key, nên Oracle báo ORA-00001.\nINSERT INTO menu_items (item_id, item_name, price)\nVALUES (2, 'Trà đào bản trùng', 1);",
          },
        },
        {
          label: 'Khôi phục giá cũ từ bản chép',
          sql: {
            mysql: restore,
            oracle: `${restore}\n\nCOMMIT;`,
          },
        },
        {
          label: 'Xong rồi: DROP bản chép',
          sql: {
            mysql: 'DROP TABLE menu_items_bak;',
            oracle: 'DROP TABLE menu_items_bak;',
          },
        },
      ],
      say: 'Ở nút "Sửa nhầm", giá trà sữa thành 480000. Ở nút khôi phục, giá về lại 48000.',
    },
    {
      type: 'oracle',
      body: [
        'Cú pháp `CREATE TABLE ... AS SELECT` giống nhau ở MySQL và Oracle.',
        'Khác nhau nằm ở phần được chép. Oracle chỉ chép constraint NOT NULL của column bạn chọn. MySQL không tự tạo index, và tài liệu của nó nói rõ điều này.',
        'Ở Oracle, `CREATE TABLE` là lệnh DDL nên tự COMMIT. UPDATE đang chờ của bạn (nếu có) cũng được lưu hẳn. Hãy sao lưu trước khi UPDATE.',
      ],
      mysql: 'CREATE TABLE menu_items_bak AS\nSELECT * FROM menu_items WHERE price >= 40000;',
      oracle: 'CREATE TABLE menu_items_bak AS\nSELECT * FROM menu_items WHERE price >= 40000;',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn chép các row sắp sửa sang table mới. Bước nào nên làm ngay sau đó?',
          options: [
            { text: 'Đếm row ở cả hai table và so hai số', correct: true, feedback: 'Đúng. Hai số bằng nhau thì bản chép đủ row, và bạn mới sửa.' },
            { text: 'DROP table gốc cho gọn', feedback: 'Đừng xóa table gốc. Bản chép chỉ là tờ giấy ghi giá cũ.' },
            { text: 'COMMIT rồi sửa luôn', feedback: 'CREATE TABLE đã tự COMMIT ở Oracle. Bước cần làm là đếm row để chắc bản chép đủ.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Table menu_items có primary key item_id. Bạn thêm row trùng mã vào menu_items_bak. Chuyện gì xảy ra?',
          options: [
            { text: 'Chạy được, vì table chép không mang theo primary key', correct: true, feedback: 'Đúng. Table chép chỉ có column và dữ liệu.' },
            { text: 'Báo lỗi trùng mã', feedback: 'Lỗi trùng mã chỉ có khi table có primary key. Table chép thì không có.' },
            { text: 'Row mới thay row cũ', feedback: 'INSERT chỉ thêm row, không thay row nào.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn sửa sai và đã COMMIT. Bạn có bản chép. Cách nào lấy lại giá cũ?',
          options: [
            { text: 'UPDATE table gốc, lấy giá từ table chép theo mã', correct: true, feedback: 'Đúng. Subquery trong SET lấy giá cũ của đúng row.' },
            { text: 'Gõ ROLLBACK', feedback: 'COMMIT xong thì ROLLBACK không đòi lại được gì.' },
            { text: 'DROP table chép', feedback: 'DROP xóa luôn giá cũ. Bạn khôi phục xong mới DROP.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Bản chép nằm ở đâu?',
      paragraphs: [
        'Ở công ty lớn, bạn thường không được tạo table tùy ý. DBA chỉ cho bạn một schema riêng để chứa bản chép.',
        'Họ cũng hay dặn: đặt tên có ngày, ghi số phiếu thay đổi vào tên hoặc ghi chú, và xóa sau khi xong.',
        'Hỏi DBA chỗ lưu trước khi chạy CREATE TABLE. Không có chỗ thì xuất kết quả SELECT ra file.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'CREATE TABLE ... AS SELECT chép column và row của một SELECT sang table mới.',
        'Chép xong, đếm row ở cả hai table. Hai số phải bằng nhau.',
        'Table chép không mang theo primary key và foreign key. Oracle chỉ chép NOT NULL.',
        'Sửa hỏng thì UPDATE lấy giá cũ từ table chép. Xong thì DROP table chép.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, CREATE TABLE ... SELECT Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table-select.html' },
        { name: 'Oracle Database 19c SQL Language Reference, CREATE TABLE (AS subquery)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html' },
        { name: 'Harvard CS50 SQL, Lecture 5', url: 'https://cs50.harvard.edu/sql/notes/5/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
