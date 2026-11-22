import type { Lesson } from '../types';

const mysqlSetup = `CREATE TABLE employees (
  employee_id INT,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  salary DECIMAL(12,2),
  hire_date DATE
);
INSERT INTO employees VALUES (1, 'Lê Thu Hà', '0912345678', 15000000.50, '2024-03-01');
SELECT * FROM employees;`;

const oracleSetup = `CREATE TABLE employees (
  employee_id NUMBER,
  full_name VARCHAR2(100),
  phone VARCHAR2(20),
  salary NUMBER(12,2),
  hire_date DATE
);
INSERT INTO employees VALUES (1, 'Lê Thu Hà', '0912345678', 15000000.50, DATE '2024-03-01');
SELECT * FROM employees;`;

export const lesson: Lesson = {
  id: 'c3-b2',
  chapter: 3,
  order: 2,
  title: 'Chọn data type cho từng column',
  lead: 'Mỗi column chỉ nhận một loại giá trị, nên bạn chọn loại đó trước khi tạo table.',
  minutes: 14,
  goals: [
    'Chọn data type cho số nguyên, số có phần lẻ, chữ và ngày',
    'Nói được vì sao số điện thoại là chữ',
    'Đọc lỗi khi giá trị không hợp data type',
    'Biết Oracle dùng NUMBER và VARCHAR2, và không có BOOLEAN',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Số 0 biến mất',
      paragraphs: [
        'Mình ghi số điện thoại của anh Nam vào một ô số: 0912345678. Sáng hôm sau mình mở lại, ô ghi 912345678.',
        'Số 0 đứng đầu đã biến mất. Với một con số, số 0 đứng đầu không có giá trị, nên ô số bỏ nó đi.',
        'Nhưng số điện thoại không phải để cộng trừ. Số điện thoại là một dãy ký tự, và số 0 là một phần của dãy đó.',
        'Mỗi column cần biết trước nó nhận loại giá trị nào. Chọn sai loại, dữ liệu sai theo. Mình thử vài loại cho column của table employees.',
      ],
    },
    {
      type: 'text',
      title: 'Mỗi column có một data type',
      paragraphs: [
        'Mỗi column có một [[data-type]]. Data type nói column nhận số, chữ hay ngày.',
        'Database kiểm từng giá trị theo data type trước khi ghi. Giá trị sai loại thì bị từ chối.',
        'Bài này dạy bốn nhóm: số nguyên, số có phần lẻ, chữ và ngày.',
      ],
    },
    {
      type: 'text',
      title: 'Số nguyên và số có phần lẻ',
      paragraphs: [
        'Dùng `INT` cho số đếm: mã nhân viên, tuổi, số giờ mỗi tuần.',
        'Dùng **[[decimal]]** cho tiền và các số có phần lẻ. Bạn viết `DECIMAL(12,2)`.',
        'Số 12 là tổng số chữ số. Số 2 là số chữ số sau dấu phẩy. Vậy còn 10 chữ số cho phần trước dấu phẩy.',
        'Số có quá nhiều chữ số lẻ thì bị làm tròn: 15000000.456 thành 15000000.46.',
        'Số có quá nhiều chữ số ở phần nguyên thì bị từ chối.',
      ],
    },
    {
      type: 'text',
      title: 'Chữ',
      paragraphs: [
        'Dùng **[[varchar]]** cho chữ. Bạn viết `VARCHAR(100)`. Số 100 là limit số ký tự của column.',
        'Chọn limit đủ rộng cho giá trị dài nhất, nhưng đừng chọn bừa một số rất lớn.',
        'Giá trị dài hơn limit thì bị từ chối. Database không tự cắt bớt.',
        'Số điện thoại, mã số thuế và mã bưu chính đều là chữ. Bạn không cộng trừ chúng, và chúng có thể bắt đầu bằng số 0.',
        'Lương là số. Bạn cộng được và so sánh được theo độ lớn.',
      ],
    },
    {
      type: 'text',
      title: 'Ngày',
      paragraphs: [
        'Dùng `DATE` cho ngày. Một giá trị `DATE` gồm năm, tháng và ngày.',
        'MySQL viết ngày trong dấu nháy đơn theo dạng năm-tháng-ngày: `\'2024-03-01\'`.',
        'MySQL có thêm `DATETIME` để giữ cả giờ. Oracle thì `DATE` đã giữ cả giờ.',
      ],
    },
    {
      type: 'workshop',
      title: 'Thử data type trên table employees',
      intro: 'Bấm Chạy để dựng table, rồi bấm từng nút thử để xem database nhận hay từ chối.',
      start: 'empty',
      dialects: ['mysql', 'oracle'],
      sql: { mysql: mysqlSetup, oracle: oracleSetup },
      tries: [
        {
          label: 'Số điện thoại gõ như số',
          sql: {
            mysql: `INSERT INTO employees VALUES (2, 'Bùi Minh', 0912345678, 12000000, '2024-04-15');\nSELECT * FROM employees;`,
            oracle: `INSERT INTO employees VALUES (2, 'Bùi Minh', 0912345678, 12000000, DATE '2024-04-15');\nSELECT * FROM employees;`,
          },
        },
        {
          label: 'Lương viết bằng chữ',
          expect: 'error',
          sql: {
            mysql: `INSERT INTO employees VALUES (3, 'Phạm An', '0987654321', 'mười lăm triệu', '2024-05-01');`,
            oracle: `INSERT INTO employees VALUES (3, 'Phạm An', '0987654321', 'mười lăm triệu', DATE '2024-05-01');`,
          },
        },
        {
          label: 'Số điện thoại dài 26 ký tự',
          expect: 'error',
          sql: {
            mysql: `INSERT INTO employees VALUES (3, 'Phạm An', '09876543210987654321098765', 9000000, '2024-05-01');`,
            oracle: `INSERT INTO employees VALUES (3, 'Phạm An', '09876543210987654321098765', 9000000, DATE '2024-05-01');`,
          },
        },
        {
          label: 'Lương có 11 chữ số ở phần nguyên',
          expect: 'error',
          sql: {
            mysql: `INSERT INTO employees VALUES (3, 'Phạm An', '0987654321', 12345678901.50, '2024-05-01');`,
            oracle: `INSERT INTO employees VALUES (3, 'Phạm An', '0987654321', 12345678901.50, DATE '2024-05-01');`,
          },
        },
        {
          label: 'Lương có ba chữ số lẻ',
          sql: {
            mysql: `INSERT INTO employees VALUES (3, 'Phạm An', '0987654321', 15000000.456, '2024-05-01');\nSELECT * FROM employees;`,
            oracle: `INSERT INTO employees VALUES (3, 'Phạm An', '0987654321', 15000000.456, DATE '2024-05-01');\nSELECT * FROM employees;`,
          },
        },
      ],
      say: 'Nút đầu cho thấy số 0 mất đi. Ba nút lỗi cho thấy database từ chối giá trị sai loại, quá dài hoặc quá lớn. Nút cuối cho thấy số lẻ thừa bị làm tròn.',
    },
    {
      type: 'text',
      title: 'Chọn data type bằng ba câu hỏi',
      paragraphs: [
        'Hỏi câu đầu: bạn có cộng trừ hay so sánh theo độ lớn giá trị này không? Nếu có, dùng số. Nếu không, dùng chữ.',
        'Hỏi câu thứ hai: số này có phần lẻ không? Nếu có, dùng `DECIMAL`. Nếu không, dùng `INT`.',
        'Hỏi câu thứ ba: giá trị này là ngày không? Nếu đúng, dùng `DATE`.',
        'Áp dụng cho employees: `employee_id` là `INT`. `full_name` và `phone` là `VARCHAR`. `salary` là `DECIMAL(12,2)`. `hire_date` là `DATE`.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle dùng NUMBER cho cả số nguyên lẫn số có phần lẻ. Bạn viết `NUMBER` hoặc `NUMBER(12,2)`.',
        'Oracle dùng VARCHAR2 cho chữ. Oracle chấp nhận cả `VARCHAR`, nhưng code ở công ty viết VARCHAR2.',
        'VARCHAR2(50) mặc định đếm theo byte, không đếm theo ký tự. Chữ tiếng Việt có dấu tốn 2 hay 3 byte mỗi ký tự.',
        'Viết `VARCHAR2(50 CHAR)` để đếm theo ký tự.',
        'Oracle 19c không có BOOLEAN trong table. Dùng `CHAR(1)` và ghi hai giá trị Y hoặc N.',
        'Khi ghi ngày, Oracle cần chữ DATE đứng trước chuỗi: `DATE \'2024-03-01\'`. Viết riêng chuỗi thì Oracle báo ORA-01861.',
      ],
      mysql: 'employee_id INT,\nfull_name VARCHAR(100),\nsalary DECIMAL(12,2),\nhire_date DATE,\nclock_in DATETIME,\nis_active CHAR(1)',
      oracle:
        'employee_id NUMBER,\nfull_name VARCHAR2(100 CHAR),\nsalary NUMBER(12,2),\nhire_date DATE,\nclock_in TIMESTAMP,\nis_active CHAR(1)',
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi column với data type hợp nhất.',
          pairs: [
            { left: 'Số điện thoại', right: 'VARCHAR(20)' },
            { left: 'Lương theo tháng', right: 'DECIMAL(12,2)' },
            { left: 'Ngày vào làm', right: 'DATE' },
            { left: 'Số dự án đang làm', right: 'INT' },
          ],
          done: 'Đúng hết rồi. Số để cộng trừ thì dùng số. Số để gọi, để tra thì dùng chữ.',
        },
        {
          kind: 'choice',
          question: 'Column phone nhận 0912345678. Data type nào giữ đúng số 0 đầu?',
          options: [
            { text: 'INT', feedback: 'INT cắt số 0 đầu, và bạn thấy 912345678 khi bấm nút đầu tiên.' },
            { text: 'VARCHAR(20)', correct: true, feedback: 'Đúng. Chữ giữ nguyên từng ký tự, gồm cả số 0 đầu.' },
            { text: 'DECIMAL(12,2)', feedback: 'DECIMAL cũng là số, nên cũng bỏ số 0 đầu và thêm phần lẻ.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Column salary là DECIMAL(12,2). Bạn ghi 15000000.456. Database làm gì?',
          options: [
            { text: 'Từ chối và báo lỗi', feedback: 'Chữ số lẻ thừa chỉ bị làm tròn. Database từ chối khi phần nguyên quá lớn.' },
            { text: 'Làm tròn thành 15000000.46', correct: true, feedback: 'Đúng. Database giữ 2 chữ số lẻ và làm tròn chữ số cuối.' },
            { text: 'Cắt bỏ thành 15000000.45', feedback: 'Database làm tròn chứ không cắt. Chữ số 6 làm tròn lên thành .46.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Mã nhân viên 00123',
      paragraphs: [
        'Một công ty nhập danh sách nhân viên từ file Excel vào database. Mã nhân viên có dạng 00123, mà column mã được khai là số.',
        'Sau khi nhập, mã 00123 thành 123. Hai mã khác nhau là 00123 và 0123 cùng thành 123, nên chúng trùng nhau.',
        'Người phụ trách đổi column sang chữ và nhập lại. Từ đó mỗi mã giữ nguyên từng ký tự.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Mỗi column có một data type. Giá trị sai loại bị từ chối.',
        'INT cho số đếm, DECIMAL(12,2) cho tiền, VARCHAR(n) cho chữ, DATE cho ngày.',
        'Số điện thoại là chữ, vì có số 0 đầu và không để cộng trừ.',
        'Oracle dùng NUMBER và VARCHAR2, và không có BOOLEAN trong table.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, Lesson 16: Creating tables', url: 'https://sqlbolt.com/lesson/creating_tables' },
        { name: 'MySQL 8.0 Reference Manual: Data Types', url: 'https://dev.mysql.com/doc/refman/8.0/en/data-types.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Data Types', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html' },
      ],
    },
  ],
};
