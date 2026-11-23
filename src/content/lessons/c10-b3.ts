import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE orders_today (
  order_id INT PRIMARY KEY,
  item_name VARCHAR(40) NOT NULL,
  qty INT NOT NULL
);`;

const setupOracle = `CREATE TABLE orders_today (
  order_id NUMBER PRIMARY KEY,
  item_name VARCHAR2(40) NOT NULL,
  qty NUMBER NOT NULL
);`;

const countOrders = 'SELECT COUNT(*) AS so_don FROM orders_today;';

const firstSteps = (begin: string) => `${begin}INSERT INTO orders_today (order_id, item_name, qty) VALUES (1, 'Trà đào', 2);
SAVEPOINT sau_don_1;
INSERT INTO orders_today (order_id, item_name, qty) VALUES (2, 'Trà sữa', 1);
INSERT INTO orders_today (order_id, item_name, qty) VALUES (3, 'Cà phê sữa', 3);

${countOrders}`;

export const lesson: Lesson = {
  id: 'c10-b3',
  chapter: 10,
  order: 3,
  title: 'Transaction, COMMIT, ROLLBACK, SAVEPOINT',
  lead: 'Bạn gom nhiều thay đổi thành một gói, rồi lưu hẳn hoặc bỏ cả gói.',
  minutes: 18,
  goals: [
    'Hiểu transaction là một gói thay đổi làm trọn gói',
    'Dùng COMMIT để lưu và ROLLBACK để bỏ',
    'Đặt SAVEPOINT và quay về mốc đó bằng ROLLBACK TO',
    'Biết MySQL tự COMMIT sau mỗi lệnh còn tool Oracle thường chờ COMMIT',
    'Biết lệnh như CREATE TABLE tự COMMIT ở Oracle',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ghi đơn xong thì mất điện',
      paragraphs: [
        'Khách mua hai ly. Bi làm hai bước: ghi đơn vào sổ đơn, rồi trừ nguyên liệu trong sổ kho.',
        'Bi vừa ghi đơn xong thì mất điện. Sổ kho chưa kịp trừ.',
        'Hai sổ giờ lệch nhau. Đơn có, nhưng kho vẫn còn đủ nguyên liệu.',
        'Bi cần gộp hai bước thành một gói. Xong cả hai, hoặc không xong bước nào.',
      ],
    },
    {
      type: 'text',
      title: 'Transaction là một giỏ thay đổi',
      paragraphs: [
        '**[[transaction]]** là một gói thay đổi làm trọn gói: lưu hết hoặc bỏ hết.',
        'Hình dung một giỏ mua sắm. Mỗi lệnh sửa dữ liệu bỏ thêm một thay đổi vào giỏ.',
        'Khi giỏ chưa thanh toán, người khác chưa thấy các thay đổi trong đó. Bạn thì thấy.',
        '**[[commit]]** là thanh toán. Mọi thay đổi trong giỏ được lưu hẳn, và người khác thấy chúng.',
        '**[[rollback]]** là trả đồ về kệ. Mọi thay đổi trong giỏ bị bỏ, và database trở lại như lúc chưa bắt đầu.',
        'Cảnh dưới đây có một giỏ như vậy. Bạn bỏ thay đổi vào giỏ, rồi chọn COMMIT hoặc ROLLBACK.',
      ],
    },
    {
      type: 'scene',
      scene: 'tx-cart',
      title: 'Giỏ thay đổi',
      intro: 'Chạy vài lệnh để bỏ thay đổi vào giỏ. Bấm COMMIT để lưu hoặc ROLLBACK để bỏ. Đổi công tắc giữa MySQL và Oracle để xem khác biệt.',
    },
    {
      type: 'text',
      title: 'COMMIT là điểm không quay lại',
      paragraphs: [
        'ROLLBACK chỉ cứu được thay đổi chưa COMMIT. COMMIT xong thì ROLLBACK không đòi lại được gì.',
        'Thói quen tốt: sửa xong, chạy SELECT để kiểm kết quả. Kết quả đúng thì COMMIT. Kết quả sai thì ROLLBACK.',
        'Bài trước nói chuyện quên WHERE. Nếu bạn chưa COMMIT, ROLLBACK cứu được toàn bộ.',
        'Oracle khuyên bạn tự kết thúc mọi transaction bằng COMMIT hoặc ROLLBACK. Luật này áp dụng cả cho transaction cuối, trước khi ngắt kết nối.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'MySQL bật **[[autocommit]]** theo mặc định. Mỗi lệnh tự COMMIT ngay sau khi chạy xong, nên ROLLBACK sau đó không còn gì để gỡ.',
        'Muốn gom nhiều lệnh thành một transaction ở MySQL, gõ `START TRANSACTION` trước. Xong thì gõ COMMIT hoặc ROLLBACK.',
        'Ở Oracle, tool bạn dùng thường chờ bạn gõ COMMIT. Mỗi tool có cài đặt riêng, nên đọc cài đặt của tool trước khi sửa dữ liệu thật.',
        'Oracle còn một luật nữa. Lệnh **[[ddl]]** như CREATE TABLE tự COMMIT, cả ngay trước và ngay sau khi chạy.',
        'Vì vậy UPDATE đang chờ, rồi CREATE TABLE, rồi ROLLBACK: UPDATE đã được lưu từ lúc CREATE TABLE chạy.',
      ],
      mysql:
        'START TRANSACTION;\nUPDATE products SET price = 48000 WHERE product_id = 2;\nROLLBACK;\n-- giá về như cũ',
      oracle:
        'UPDATE products SET price = 48000 WHERE product_id = 2;\nROLLBACK;\n-- giá về như cũ',
    },
    {
      type: 'text',
      title: 'SAVEPOINT: một mốc giữa giỏ',
      paragraphs: [
        'ROLLBACK bỏ cả giỏ. Đôi khi bạn chỉ muốn bỏ vài thay đổi cuối và giữ phần trước.',
        '**[[savepoint]]** là một mốc bạn đặt giữa transaction. Lệnh là `SAVEPOINT ten_moc`.',
        '`ROLLBACK TO ten_moc` đưa dữ liệu về lúc đặt mốc. Mọi thay đổi sau mốc bị bỏ. Mọi thay đổi trước mốc còn nguyên.',
        'Transaction vẫn mở sau `ROLLBACK TO`. Bạn làm tiếp, rồi COMMIT hoặc ROLLBACK như thường.',
        'COMMIT và ROLLBACK (không có chữ TO) xóa mọi mốc. Lệnh DDL ở Oracle tự COMMIT nên cũng xóa mốc.',
        'MySQL chỉ giữ mốc sau khi bạn gõ `START TRANSACTION`. Oracle dùng được ngay.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: đặt mốc rồi quay về',
      intro:
        'Table orders_today còn trống. Bấm Chạy để ghi 3 đơn, với một mốc sau đơn đầu tiên. Rồi bấm từng nút thử, theo thứ tự từ trên xuống.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: { mysql: firstSteps('START TRANSACTION;\n'), oracle: firstSteps('') },
      tries: [
        {
          label: 'ROLLBACK TO: về mốc sau đơn 1',
          sql: {
            mysql: `ROLLBACK TO sau_don_1;\n\n${countOrders}`,
            oracle: `ROLLBACK TO sau_don_1;\n\n${countOrders}`,
          },
        },
        {
          label: 'Làm tiếp: đặt mốc thứ hai',
          sql: {
            mysql: `INSERT INTO orders_today (order_id, item_name, qty) VALUES (4, 'Bánh flan', 1);
SAVEPOINT sau_don_4;
INSERT INTO orders_today (order_id, item_name, qty) VALUES (5, 'Matcha đá xay', 2);
ROLLBACK TO sau_don_4;

SELECT order_id, item_name FROM orders_today ORDER BY order_id;`,
            oracle: `INSERT INTO orders_today (order_id, item_name, qty) VALUES (4, 'Bánh flan', 1);
SAVEPOINT sau_don_4;
INSERT INTO orders_today (order_id, item_name, qty) VALUES (5, 'Matcha đá xay', 2);
ROLLBACK TO sau_don_4;

SELECT order_id, item_name FROM orders_today ORDER BY order_id;`,
          },
        },
        {
          label: 'Quay về mốc chưa từng đặt',
          expect: 'error',
          sql: {
            mysql: '-- MySQL báo lỗi 1305: SAVEPOINT does not exist.\nROLLBACK TO moc_khong_co;',
            oracle: '-- Oracle báo ORA-01086: savepoint never established in this session.\nROLLBACK TO moc_khong_co;',
          },
        },
        {
          label: 'ROLLBACK cả giỏ',
          sql: {
            mysql: `ROLLBACK;\n\n${countOrders}`,
            oracle: `ROLLBACK;\n\n${countOrders}`,
          },
        },
        {
          label: 'COMMIT xong thì mốc mất',
          expect: 'error',
          sql: {
            mysql: `START TRANSACTION;
INSERT INTO orders_today (order_id, item_name, qty) VALUES (6, 'Trà đào', 1);
SAVEPOINT moc_a;
COMMIT;
-- COMMIT đã xóa mốc moc_a, nên lệnh dưới báo lỗi 1305.
ROLLBACK TO moc_a;`,
            oracle: `INSERT INTO orders_today (order_id, item_name, qty) VALUES (6, 'Trà đào', 1);
SAVEPOINT moc_a;
COMMIT;
-- COMMIT đã xóa mốc moc_a, nên lệnh dưới báo ORA-01086.
ROLLBACK TO moc_a;`,
          },
        },
      ],
      say: 'Sau ROLLBACK TO, còn 1 đơn. Đơn 2 và 3 nằm sau mốc nên bị bỏ.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'MySQL đang bật autocommit. Bạn chạy một lệnh UPDATE, rồi gõ ROLLBACK. Giá trị trong table ra sao?',
          options: [
            { text: 'Vẫn là giá trị mới, vì UPDATE đã tự COMMIT', correct: true, feedback: 'Đúng. Autocommit lưu thay đổi ngay sau lệnh, nên ROLLBACK không còn gì để gỡ.' },
            { text: 'Trở lại giá trị cũ', feedback: 'Chỉ đúng khi bạn mở transaction bằng START TRANSACTION trước lệnh UPDATE.' },
            { text: 'Database báo lỗi', feedback: 'ROLLBACK chạy được, chỉ là nó không gỡ được gì.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Ở Oracle, bạn chạy UPDATE, rồi CREATE TABLE, rồi ROLLBACK. UPDATE ra sao?',
          options: [
            { text: 'UPDATE đã được lưu, vì CREATE TABLE tự COMMIT', correct: true, feedback: 'Đúng. Lệnh DDL tự COMMIT mọi thay đổi đang chờ.' },
            { text: 'UPDATE bị bỏ', feedback: 'UPDATE đã được lưu trước khi ROLLBACK chạy.' },
            { text: 'UPDATE còn chờ, ROLLBACK sẽ bỏ nó', feedback: 'CREATE TABLE đã kết thúc transaction. Không còn gì chờ.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn ghi đơn 1, đặt SAVEPOINT a, ghi đơn 2, rồi gõ ROLLBACK TO a. Còn gì trong table?',
          options: [
            { text: 'Đơn 1, và transaction vẫn mở', correct: true, feedback: 'Đúng. Đơn 2 nằm sau mốc nên bị bỏ. Đơn 1 nằm trước mốc nên còn, chưa COMMIT.' },
            { text: 'Không còn đơn nào', feedback: 'Đó là kết quả của ROLLBACK không có chữ TO. ROLLBACK TO chỉ về mốc.' },
            { text: 'Cả hai đơn', feedback: 'Đơn 2 nằm sau mốc. ROLLBACK TO bỏ nó.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi thuật ngữ với ý của nó.',
          pairs: [
            { left: 'COMMIT', right: 'Lưu hẳn mọi thay đổi trong giỏ' },
            { left: 'ROLLBACK', right: 'Bỏ mọi thay đổi trong giỏ' },
            { left: 'autocommit', right: 'Mỗi lệnh tự COMMIT ngay' },
            { left: 'START TRANSACTION', right: 'MySQL: mở một giỏ mới' },
            { left: 'SAVEPOINT', right: 'Mốc giữa giỏ, để ROLLBACK TO quay về' },
          ],
          done: 'Đúng hết. Năm thuật ngữ này đủ để đọc mọi đoạn code về transaction.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Chuyển tiền trên app ngân hàng',
      paragraphs: [
        'Khi bạn chuyển tiền, app trừ tiền của bạn và cộng tiền cho người nhận.',
        'Hai thay đổi nằm trong cùng một transaction. Nếu bước thứ hai lỗi, ROLLBACK trả tiền về cho bạn, và tiền không biến mất giữa đường.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Transaction là một giỏ thay đổi. COMMIT lưu hẳn cả giỏ, ROLLBACK bỏ cả giỏ.',
        'ROLLBACK chỉ cứu được thay đổi chưa COMMIT.',
        'MySQL tự COMMIT sau mỗi lệnh. Tool Oracle thường chờ bạn gõ COMMIT.',
        'Ở Oracle, lệnh DDL như CREATE TABLE tự COMMIT.',
        'SAVEPOINT đặt một mốc giữa transaction. ROLLBACK TO mốc bỏ phần sau mốc, giữ phần trước, và transaction vẫn mở.',
        'COMMIT và ROLLBACK xóa mọi SAVEPOINT. MySQL chỉ giữ SAVEPOINT sau START TRANSACTION.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 5 (phần Transactions)', url: 'https://cs50.harvard.edu/sql/notes/5/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, START TRANSACTION, COMMIT, and ROLLBACK', url: 'https://dev.mysql.com/doc/refman/8.0/en/commit.html' },
        { name: 'MySQL 8.0 Reference Manual, autocommit, Commit, and Rollback', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-autocommit-commit-rollback.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COMMIT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html' },
        { name: 'MySQL 8.0 Reference Manual, SAVEPOINT, ROLLBACK TO SAVEPOINT, and RELEASE SAVEPOINT', url: 'https://dev.mysql.com/doc/refman/8.0/en/savepoint.html' },
        { name: 'Oracle Database 19c SQL Language Reference, SAVEPOINT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SAVEPOINT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, ROLLBACK', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROLLBACK.html' },
      ],
    },
  ],
};
