import type { Lesson } from '../types';

const mysqlMain = `CREATE TABLE employees (
  employee_id INT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  salary DECIMAL(12,2) NOT NULL CONSTRAINT ck_salary CHECK (salary > 0),
  status VARCHAR(20) DEFAULT 'active' NOT NULL
);
INSERT INTO employees (employee_id, full_name, email, salary)
VALUES (1, 'Lê Thu Hà', 'ha@saomai.vn', 15000000);
SELECT * FROM employees;`;

const oracleMain = `CREATE TABLE employees (
  employee_id NUMBER PRIMARY KEY,
  full_name VARCHAR2(100) NOT NULL,
  email VARCHAR2(100) NOT NULL UNIQUE,
  salary NUMBER(12,2) NOT NULL CONSTRAINT ck_salary CHECK (salary > 0),
  status VARCHAR2(20) DEFAULT 'active' NOT NULL
);
INSERT INTO employees (employee_id, full_name, email, salary)
VALUES (1, 'Lê Thu Hà', 'ha@saomai.vn', 15000000);
SELECT * FROM employees;`;

export const lesson: Lesson = {
  id: 'c3-b5',
  chapter: 3,
  order: 5,
  title: 'Đặt luật ngay lúc tạo: NOT NULL, UNIQUE, CHECK, DEFAULT',
  lead: 'Bạn gắn luật vào column ngay trong câu CREATE TABLE, và database canh luật cho bạn.',
  minutes: 15,
  goals: [
    'Gắn NOT NULL, UNIQUE, CHECK và DEFAULT vào một column',
    'Đặt tên cho constraint để đọc lỗi dễ hơn',
    'Đoán đúng row nào bị từ chối, và vì luật nào',
    'Biết DEFAULT chỉ chạy khi INSERT bỏ qua column',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ba ngày, ba row sai',
      paragraphs: [
        'Table employees của Sao Mai đã có. Ngày đầu, một bạn thực tập nhập một nhân viên không có tên.',
        'Ngày hai, bạn nhập hai nhân viên cùng một email. Ngày ba, lương của một người là -5.',
        'Mình không thể đứng cạnh canh từng row. Luật cần nằm ngay trong table, từ lúc tạo.',
        'Bốn luật hay dùng nhất đều viết ngay sau data type của column. Mình thử từng luật.',
      ],
    },
    {
      type: 'text',
      title: 'Bốn luật gắn vào column',
      paragraphs: [
        '[[not-null|NOT NULL]] bắt ô phải có giá trị. Column `full_name VARCHAR(100) NOT NULL` không nhận ô trống.',
        '[[unique|UNIQUE]] cấm hai row trùng giá trị ở column đó. Column `email` cần luật này, vì mỗi người một email.',
        '[[check|CHECK]] kiểm một điều kiện. `CHECK (salary > 0)` chỉ nhận lương lớn hơn 0.',
        '**[[default-value|DEFAULT]]** điền sẵn một giá trị khi INSERT bỏ qua column. `DEFAULT \'active\'` điền chữ active.',
        'DEFAULT không chặn gì. DEFAULT chỉ lấp chỗ trống.',
        'Gắn các luật sau data type, cách nhau một dấu cách: `email VARCHAR(100) NOT NULL UNIQUE`.',
        'Một column nhận được nhiều luật. Chọn đủ luật mà dữ liệu thật cần.',
      ],
    },
    {
      type: 'text',
      title: 'Đặt tên cho luật',
      paragraphs: [
        'Bạn đặt tên cho một luật bằng chữ `CONSTRAINT`: `salary DECIMAL(12,2) CONSTRAINT ck_salary CHECK (salary > 0)`.',
        'Tên `ck_salary` nói luật này là CHECK và nói về column salary.',
        'Khi row phạm luật, lỗi ghi tên luật. MySQL báo: Check constraint \'ck_salary\' is violated. Bạn đọc tên là biết luật nào bị phạm.',
        'Bạn không đặt tên thì database tự đặt. Oracle đặt tên kiểu `SYS_C008502`, không cho biết luật nói về column nào.',
        'Vì vậy bài này đặt tên cho CHECK. Hai luật còn lại đã có tên dễ đoán nhờ tên column.',
      ],
    },
    {
      type: 'text',
      title: 'DEFAULT chỉ chạy khi bỏ qua column',
      paragraphs: [
        'Column `status` có `DEFAULT \'active\' NOT NULL`. INSERT không nhắc tới `status` thì database điền active.',
        'INSERT ghi `status` là NULL rõ ràng thì DEFAULT không chạy. Luật NOT NULL chặn row đó.',
        'Bạn muốn dùng giá trị mặc định thì bỏ hẳn column đó khỏi câu INSERT.',
      ],
    },
    {
      type: 'workshop',
      title: 'Thử từng luật',
      intro: 'Bấm Chạy để dựng table employees có đủ bốn luật. Rồi bấm từng nút thử theo thứ tự.',
      start: 'empty',
      dialects: ['mysql', 'oracle'],
      sql: { mysql: mysqlMain, oracle: oracleMain },
      tries: [
        {
          label: 'Row thiếu full_name',
          expect: 'error',
          sql: {
            mysql: "INSERT INTO employees (employee_id, email, salary) VALUES (2, 'minh@saomai.vn', 12000000);",
            oracle: "INSERT INTO employees (employee_id, email, salary) VALUES (2, 'minh@saomai.vn', 12000000);",
          },
        },
        {
          label: 'Email trùng với Hà',
          expect: 'error',
          sql: {
            mysql: "INSERT INTO employees (employee_id, full_name, email, salary) VALUES (2, 'Bùi Minh', 'ha@saomai.vn', 12000000);",
            oracle: "INSERT INTO employees (employee_id, full_name, email, salary) VALUES (2, 'Bùi Minh', 'ha@saomai.vn', 12000000);",
          },
        },
        {
          label: 'Lương bằng -5',
          expect: 'error',
          sql: {
            mysql: "INSERT INTO employees (employee_id, full_name, email, salary) VALUES (2, 'Bùi Minh', 'minh@saomai.vn', -5);",
            oracle: "INSERT INTO employees (employee_id, full_name, email, salary) VALUES (2, 'Bùi Minh', 'minh@saomai.vn', -5);",
          },
        },
        {
          label: 'Ghi status rõ ràng',
          sql: {
            mysql:
              "INSERT INTO employees (employee_id, full_name, email, salary, status) VALUES (2, 'Bùi Minh', 'minh@saomai.vn', 12000000, 'on_leave');\nSELECT * FROM employees;",
            oracle:
              "INSERT INTO employees (employee_id, full_name, email, salary, status) VALUES (2, 'Bùi Minh', 'minh@saomai.vn', 12000000, 'on_leave');\nSELECT * FROM employees;",
          },
        },
        {
          label: 'Ghi status là NULL',
          expect: 'error',
          sql: {
            mysql: "INSERT INTO employees (employee_id, full_name, email, salary, status) VALUES (3, 'Phạm An', 'an@saomai.vn', 9000000, NULL);",
            oracle: "INSERT INTO employees (employee_id, full_name, email, salary, status) VALUES (3, 'Phạm An', 'an@saomai.vn', 9000000, NULL);",
          },
        },
      ],
      say: 'Hà không ghi status, nên table điền active. Bùi Minh ghi status rõ ràng, nên giữ on_leave. Ghi NULL thì DEFAULT không giúp được.',
    },
    {
      type: 'oracle',
      body: [
        'Oracle viết DEFAULT ngay sau data type, trước NOT NULL. Viết ngược lại thì Oracle báo ORA-00907.',
        'MySQL nhận cả hai thứ tự. Khóa học viết DEFAULT trước ở cả hai dialect cho giống nhau.',
        'MySQL chỉ kiểm CHECK thật từ bản 8.0.16. Bản cũ hơn đọc chữ CHECK rồi bỏ qua.',
        'Mã lỗi khi row phạm luật: NOT NULL là 1048 (hoặc 1364 khi bỏ qua column) ở MySQL, ORA-01400 ở Oracle. UNIQUE là 1062 và ORA-00001. CHECK là 3819 và ORA-02290.',
      ],
      mysql: "salary DECIMAL(12,2) NOT NULL CONSTRAINT ck_salary CHECK (salary > 0),\nstatus VARCHAR(20) DEFAULT 'active' NOT NULL",
      oracle: "salary NUMBER(12,2) NOT NULL CONSTRAINT ck_salary CHECK (salary > 0),\nstatus VARCHAR2(20) DEFAULT 'active' NOT NULL",
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi luật với chuyện nó xử lý.',
          pairs: [
            { left: 'NOT NULL', right: 'Row thiếu tên' },
            { left: 'UNIQUE', right: 'Hai row cùng email' },
            { left: 'CHECK (salary > 0)', right: 'Lương bằng -5' },
            { left: "DEFAULT 'active'", right: 'INSERT không nhắc tới status' },
          ],
          done: 'Đúng hết rồi. Ba luật đầu từ chối row. DEFAULT chỉ điền chỗ trống.',
        },
        {
          kind: 'choice',
          question: "INSERT ghi status là NULL vào column status VARCHAR(20) DEFAULT 'active' NOT NULL. Chuyện gì xảy ra?",
          options: [
            { text: 'Database điền active', feedback: 'DEFAULT chỉ chạy khi INSERT bỏ qua column. Ghi NULL rõ ràng thì DEFAULT không chạy.' },
            { text: 'Database báo lỗi: MySQL 1048, Oracle ORA-01400', correct: true, feedback: 'Đúng. Ô nhận NULL rõ ràng, và NOT NULL chặn row đó.' },
            { text: 'Database ghi NULL vào ô', feedback: 'Luật NOT NULL cấm ô trống, nên row bị từ chối.' },
          ],
        },
        {
          kind: 'choice',
          question: "MySQL báo: Check constraint 'ck_salary' is violated. Bạn biết điều gì?",
          options: [
            { text: 'Row phạm luật tên ck_salary, tức lương không lớn hơn 0', correct: true, feedback: 'Đúng. Tên luật cho bạn biết luật nào và column nào.' },
            { text: 'Table không có column ck_salary', feedback: 'ck_salary là tên của luật, không phải tên column.' },
            { text: 'Email của row bị trùng', feedback: 'Email trùng thì MySQL báo 1062 và nhắc tới column email.' },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c3-e1'] },
    {
      type: 'realworld',
      title: 'Ba chỗ cùng ghi vào một table',
      paragraphs: [
        'Table employees của một công ty có ba chỗ ghi vào: app nhân sự, file nhập hàng loạt và script của nhóm IT.',
        'Nếu luật lương lớn hơn 0 chỉ nằm trong app, hai chỗ còn lại vẫn ghi được lương âm.',
        'Luật đặt trong table thì cả ba chỗ đều bị chặn. Đây là lý do nhóm database đặt luật ngay lúc tạo table.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'NOT NULL, UNIQUE và CHECK từ chối row phạm luật. DEFAULT điền giá trị khi INSERT bỏ qua column.',
        'Gắn luật sau data type: email VARCHAR(100) NOT NULL UNIQUE.',
        'Đặt tên luật bằng CONSTRAINT ck_salary CHECK (...) để đọc lỗi dễ hơn.',
        'Ghi NULL rõ ràng thì DEFAULT không chạy. Oracle viết DEFAULT trước NOT NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, Lesson 16: Creating tables', url: 'https://sqlbolt.com/lesson/creating_tables' },
        { name: 'MySQL 8.0 Reference Manual: CREATE TABLE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table.html' },
        { name: 'MySQL 8.0 Reference Manual: CHECK Constraints', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html' },
        { name: 'Oracle Database 19c SQL Language Reference: CREATE TABLE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Constraints', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/constraint.html' },
      ],
    },
  ],
};
