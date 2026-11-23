import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE staff (
  staff_id INT PRIMARY KEY,
  full_name VARCHAR(50) NOT NULL,
  dept_name VARCHAR(30) NOT NULL,
  salary DECIMAL(12,2) NOT NULL
);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES
  (1, 'Trần Văn An', 'Kinh doanh', 20000000),
  (2, 'Lê Thị Bình', 'Kinh doanh', 18000000),
  (3, 'Phạm Quốc Cường', 'Kỹ thuật', 28000000),
  (4, 'Đỗ Thu Dung', 'Kỹ thuật', 16000000),
  (5, 'Vũ Minh Em', 'Kinh doanh', 15000000),
  (6, 'Hoàng Gia Phúc', 'Kế toán', 17000000);`;

const setupOracle = `CREATE TABLE staff (
  staff_id NUMBER PRIMARY KEY,
  full_name VARCHAR2(50) NOT NULL,
  dept_name VARCHAR2(30) NOT NULL,
  salary NUMBER(12,2) NOT NULL
);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES (1, 'Trần Văn An', 'Kinh doanh', 20000000);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES (2, 'Lê Thị Bình', 'Kinh doanh', 18000000);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES (3, 'Phạm Quốc Cường', 'Kỹ thuật', 28000000);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES (4, 'Đỗ Thu Dung', 'Kỹ thuật', 16000000);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES (5, 'Vũ Minh Em', 'Kinh doanh', 15000000);
INSERT INTO staff (staff_id, full_name, dept_name, salary) VALUES (6, 'Hoàng Gia Phúc', 'Kế toán', 17000000);
COMMIT;`;

const readSteps = `-- Bước 2: đếm row theo đúng WHERE. Phải ra 3.
SELECT COUNT(*) AS so_row FROM staff
WHERE dept_name = 'Kinh doanh';

-- Bước 3: ghi lại giá trị cũ của các row sắp sửa.
SELECT staff_id, full_name, salary AS luong_cu FROM staff
WHERE dept_name = 'Kinh doanh'
ORDER BY staff_id;`;

export const lesson: Lesson = {
  id: 'c10-b7',
  chapter: 10,
  order: 7,
  title: 'Sáu bước sửa dữ liệu ở công ty',
  lead: 'Bạn học một quy trình cố định cho mọi lần sửa dữ liệu thật, từ đọc yêu cầu tới COMMIT.',
  minutes: 14,
  goals: [
    'Nhớ và làm theo sáu bước sửa dữ liệu',
    'So số row lệnh sửa đã đổi với số row đã đếm',
    'Biết cách sao lưu các row sắp sửa',
    'Quyết định COMMIT hay ROLLBACK dựa vào số liệu',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Yêu cầu lúc năm giờ chiều',
      paragraphs: [
        'Năm giờ chiều, trưởng phòng nhắn: "Tăng lương hai triệu cho phòng Kinh doanh. Làm ngay giúp anh."',
        'Bạn đã biết viết UPDATE. Bạn mở tool, gõ lệnh, và bấm chạy chỉ mất một phút.',
        'Nhưng đây là table lương thật. Một lệnh sai là hai trăm người nhận sai lương.',
        'Người đi làm lâu năm không gõ lệnh ngay. Họ làm theo một quy trình sáu bước, lần nào cũng thế.',
      ],
    },
    {
      type: 'text',
      title: 'Sáu bước',
      paragraphs: [
        '**Bước 1: đọc kỹ yêu cầu.** Tìm table nào, row nào, column nào, đổi thành gì. Chỗ nào chưa rõ thì hỏi lại. "Phòng Kinh doanh" gồm những ai? Tăng hai triệu là cộng thêm hay đặt thành hai triệu?',
        '**Bước 2: viết SELECT với đúng WHERE và đếm row.** Chạy SELECT và ghi lại số row. Số này là số bạn dự tính sửa.',
        '**Bước 3: sao lưu các row sắp sửa.** Lưu giá trị cũ ở chỗ bạn tìm lại được, để quay về khi cần.',
        '**Bước 4: chạy lệnh sửa.** Giữ nguyên WHERE của bước 2. Database báo số row đã đổi. So số đó với số ở bước 2.',
        '**Bước 5: kiểm lại bằng SELECT.** Đọc giá trị mới và xem có đúng như yêu cầu không.',
        '**Bước 6: COMMIT hoặc ROLLBACK.** Số khớp và giá trị đúng thì COMMIT. Số lệch hoặc giá trị sai thì ROLLBACK.',
        'Sau khi xong, ghi lại ai sửa, sửa gì, lúc nào. Đồng nghiệp sẽ hỏi bạn khi có chuyện lạ.',
      ],
    },
    {
      type: 'text',
      title: 'Vì sao sao lưu trước khi sửa',
      paragraphs: [
        'ROLLBACK chỉ cứu được thay đổi chưa COMMIT. COMMIT xong thì ROLLBACK không đòi lại được gì.',
        'Một **[[backup]]** nhỏ là bản chép các row sắp sửa, giữ ở một table riêng. Có bản chép, bạn còn khôi phục được giá trị cũ khi phát hiện lỗi muộn.',
        'Cách thường dùng là `CREATE TABLE ... AS SELECT`. Lệnh này tạo table mới từ kết quả của một SELECT. Tên table sao lưu nên có ngày, như `staff_bak_20261123`.',
        'Ở nhiều công ty, người quản trị không cho tạo table tùy ý. Khi đó hỏi họ chỗ lưu bản sao lưu, hoặc xuất kết quả SELECT ra file.',
      ],
    },
    {
      type: 'code',
      title: 'Sáu bước trong một lần sửa',
      intro: 'Đây là mẫu cho Oracle. Ở MySQL, thêm `START TRANSACTION;` trước bước 4 để có thể ROLLBACK.',
      code:
        "-- Bước 2: đếm. Giả sử ra 120 row.\nSELECT COUNT(*) FROM staff WHERE dept_name = 'Kinh doanh';\n\n-- Bước 3: sao lưu.\nCREATE TABLE staff_bak_20261123 AS\nSELECT * FROM staff WHERE dept_name = 'Kinh doanh';\n\n-- Bước 4: sửa. Database báo \"120 rows updated\" thì khớp.\nUPDATE staff\nSET salary = salary + 2000000\nWHERE dept_name = 'Kinh doanh';\n\n-- Bước 5: kiểm lại.\nSELECT staff_id, full_name, salary FROM staff\nWHERE dept_name = 'Kinh doanh';\n\n-- Bước 6: khớp thì lưu hẳn.\nCOMMIT;",
      notes: [
        { find: 'SELECT COUNT(*) FROM staff', text: 'Bước 2 chỉ đọc dữ liệu. Ghi lại con số này.' },
        { find: 'CREATE TABLE staff_bak_20261123 AS', text: 'Bước 3 chép các row sắp sửa sang table mới. Cùng WHERE với bước 2.' },
        { find: 'SET salary = salary + 2000000', text: 'Bước 4 dùng đúng WHERE của bước 2. Đừng gõ lại WHERE từ trí nhớ.' },
        { find: 'COMMIT;', text: 'Bước 6 chỉ chạy khi số row khớp và giá trị đã kiểm đúng.' },
      ],
    },
    {
      type: 'text',
      title: 'Khi số row không khớp',
      paragraphs: [
        'Bước 2 đếm 3 row mà bước 4 báo 6 row đã đổi? Dừng lại và chạy ROLLBACK.',
        'Đừng nghĩ "chắc không sao". Số lệch nghĩa là WHERE ở bước 4 khác WHERE ở bước 2, hoặc dữ liệu vừa đổi giữa hai bước.',
        'Sau ROLLBACK, chạy lại SELECT ở bước 2 để chắc dữ liệu đã về như cũ. Rồi tìm chỗ lệch.',
        'Cùng lúc, đừng để transaction mở lâu. Người khác có thể bị chờ khi họ muốn sửa các row bạn đang giữ.',
      ],
    },
    {
      type: 'workshop',
      title: 'Xưởng: đi đủ sáu bước',
      intro: 'Table staff có 6 người, 3 người ở phòng Kinh doanh. Bấm Chạy để làm bước 2 và bước 3. Rồi bấm từng nút thử, theo thứ tự từ trên xuống. Ở nút cuối bạn cố ý làm sai rồi ROLLBACK.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: { mysql: readSteps, oracle: readSteps },
      tries: [
        {
          label: 'Bước 4: sửa',
          sql: {
            mysql: `START TRANSACTION;

UPDATE staff
SET salary = salary + 2000000
WHERE dept_name = 'Kinh doanh';`,
            oracle: `UPDATE staff
SET salary = salary + 2000000
WHERE dept_name = 'Kinh doanh';`,
          },
        },
        {
          label: 'Bước 5: kiểm lại',
          sql: {
            mysql: `SELECT staff_id, full_name, salary FROM staff
WHERE dept_name = 'Kinh doanh'
ORDER BY staff_id;`,
            oracle: `SELECT staff_id, full_name, salary FROM staff
WHERE dept_name = 'Kinh doanh'
ORDER BY staff_id;`,
          },
        },
        {
          label: 'Bước 6: COMMIT',
          sql: { mysql: 'COMMIT;', oracle: 'COMMIT;' },
        },
        {
          label: 'Làm sai: quên WHERE',
          sql: {
            mysql: `START TRANSACTION;

UPDATE staff
SET salary = salary + 2000000;`,
            oracle: `UPDATE staff
SET salary = salary + 2000000;`,
          },
        },
        {
          label: 'Số row lệch, ROLLBACK',
          sql: {
            mysql: `ROLLBACK;

SELECT staff_id, full_name, dept_name, salary FROM staff ORDER BY staff_id;`,
            oracle: `ROLLBACK;

SELECT staff_id, full_name, dept_name, salary FROM staff ORDER BY staff_id;`,
          },
        },
      ],
      say: 'Ở nút "Làm sai", database báo 6 row đã đổi, trong khi bước 2 đếm 3. Hai số lệch nhau, nên bạn ROLLBACK.',
    },
    {
      type: 'oracle',
      body: [
        'Oracle: nhớ COMMIT. Nhiều tool Oracle chờ bạn gõ COMMIT mới lưu hẳn. Chưa COMMIT thì phiên của người khác chưa thấy thay đổi.',
        'MySQL: nhớ `START TRANSACTION`. MySQL tự COMMIT sau mỗi lệnh, nên không có START TRANSACTION thì ROLLBACK không còn gì để gỡ.',
        'Ở Oracle, lệnh DDL như CREATE TABLE tự COMMIT. Chạy CREATE TABLE ở bước 3 trước khi UPDATE thì không sao. Chạy nó giữa UPDATE và ROLLBACK thì UPDATE đã được lưu.',
      ],
      mysql:
        "START TRANSACTION;\nUPDATE staff SET salary = salary + 2000000 WHERE dept_name = 'Kinh doanh';\n-- kiểm lại, rồi COMMIT hoặc ROLLBACK",
      oracle:
        "UPDATE staff SET salary = salary + 2000000 WHERE dept_name = 'Kinh doanh';\n-- kiểm lại, rồi COMMIT hoặc ROLLBACK",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bước 2 đếm được 40 row. Bước 4 báo 400 row đã đổi. Bạn làm gì?',
          options: [
            { text: 'ROLLBACK, rồi tìm chỗ lệch giữa hai WHERE', correct: true, feedback: 'Đúng. Số lệch là dấu hiệu dừng. Thay đổi chưa COMMIT nên ROLLBACK cứu được hết.' },
            { text: 'COMMIT, rồi sửa lại sau', feedback: 'COMMIT xong thì ROLLBACK không gỡ được. Sửa lại sau là sửa trên dữ liệu đã sai.' },
            { text: 'Chạy lại UPDATE để chắc chắn', feedback: 'Chạy lại làm số row đổi tiếp. Dừng lại và ROLLBACK trước.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bước nào đứng ngay trước bước chạy lệnh sửa?',
          options: [
            { text: 'Sao lưu các row sắp sửa', correct: true, feedback: 'Đúng. Có bản sao lưu thì khi sai bạn còn khôi phục được giá trị cũ.' },
            { text: 'Kiểm lại bằng SELECT', feedback: 'Kiểm lại là bước sau khi sửa, để đọc giá trị mới.' },
            { text: 'COMMIT', feedback: 'COMMIT là bước cuối, sau khi bạn đã kiểm.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi bước với việc bạn làm.',
          pairs: [
            { left: 'Bước 2', right: 'SELECT với đúng WHERE và đếm row' },
            { left: 'Bước 3', right: 'Sao lưu các row sắp sửa' },
            { left: 'Bước 4', right: 'Chạy lệnh sửa và so số row' },
            { left: 'Bước 5', right: 'Kiểm lại bằng SELECT' },
            { left: 'Bước 6', right: 'COMMIT hoặc ROLLBACK' },
          ],
          done: 'Đúng hết. Cộng với bước 1 đọc yêu cầu, bạn có đủ sáu bước.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Cuốn sổ ghi lại mỗi lần sửa',
      paragraphs: [
        'Nhiều công ty yêu cầu phiếu thay đổi cho mỗi lần sửa dữ liệu thật. Phiếu ghi ai sửa, sửa gì, WHERE nào, bao nhiêu row, lúc nào.',
        'Sáu bước cho bạn đủ thông tin để điền phiếu. Số row ở bước 2 và bước 4 vào phiếu. Bản sao lưu cho người khác một đường quay về.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Sáu bước: đọc yêu cầu, SELECT đếm row, sao lưu, sửa, kiểm lại, COMMIT hoặc ROLLBACK.',
        'Số row lệnh sửa đã đổi phải bằng số row bạn đếm ở bước 2.',
        'Số lệch thì ROLLBACK trước khi làm tiếp.',
        'Sao lưu bằng CREATE TABLE ... AS SELECT, rồi kiểm tra với người quản trị chỗ lưu.',
        'Oracle nhớ COMMIT. MySQL nhớ START TRANSACTION.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 5 (phần Transactions)', url: 'https://cs50.harvard.edu/sql/notes/5/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, START TRANSACTION, COMMIT, and ROLLBACK', url: 'https://dev.mysql.com/doc/refman/8.0/en/commit.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COMMIT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, ROLLBACK', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROLLBACK.html' },
      ],
    },
  ],
};
