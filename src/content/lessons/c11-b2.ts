import type { Lesson } from '../types';

const setupMysql = `CREATE TABLE menu_items (
  item_id INT PRIMARY KEY,
  item_name VARCHAR(40) NOT NULL,
  price DECIMAL(12,2) NOT NULL
);
INSERT INTO menu_items (item_id, item_name, price) VALUES
  (1, 'Cà phê sữa', 30000),
  (2, 'Trà đào', 45000),
  (3, 'Trà sữa', 48000);`;

const setupOracle = `CREATE TABLE menu_items (
  item_id NUMBER PRIMARY KEY,
  item_name VARCHAR2(40) NOT NULL,
  price NUMBER(12,2) NOT NULL
);
INSERT INTO menu_items (item_id, item_name, price) VALUES (1, 'Cà phê sữa', 30000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (2, 'Trà đào', 45000);
INSERT INTO menu_items (item_id, item_name, price) VALUES (3, 'Trà sữa', 48000);
COMMIT;`;

export const lesson: Lesson = {
  id: 'c11-b2',
  chapter: 11,
  order: 2,
  title: 'schema, user và tên đầy đủ HR.EMPLOYEES',
  lead: 'Bạn biết table nằm trong schema của ai, và gọi table của schema khác bằng tên đầy đủ.',
  minutes: 14,
  goals: [
    'Hiểu schema là ngăn chứa table của một user',
    'Gọi table bằng tên đầy đủ schema.table',
    'Hiểu vì sao quên tên schema gây ORA-00942 dù table có thật',
    'Biết cách hỏi Oracle bạn là ai và table nào thuộc schema nào',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Table có thật mà database nói không có',
      paragraphs: [
        'Ngày đầu đi làm, anh trưởng nhóm gửi Bi một câu: "Lấy danh sách nhân viên từ table EMPLOYEES."',
        'Bi mở tool Oracle, gõ `SELECT * FROM employees`. Database trả lời: ORA-00942, table or view does not exist.',
        'Bi hỏi lại anh trưởng nhóm. Anh nói table đó có thật, chính anh vừa mở nó sáng nay.',
        'Hóa ra table nằm ở một nơi khác. Bi chỉ cần biết gọi đúng địa chỉ.',
      ],
    },
    {
      type: 'text',
      title: 'Schema là ngăn của một user',
      paragraphs: [
        'Ở Oracle, mỗi **[[db-user]]** có một **[[schema-owner|schema]]** của riêng mình. Schema là cái ngăn chứa các table do user đó tạo.',
        'Hình dung một tòa nhà có nhiều phòng. Mỗi user có một phòng, và table nằm trong phòng của chủ nó.',
        'Schema mang tên của user. User HR có schema HR. Table EMPLOYEES do HR tạo nằm trong schema HR.',
        'Khi bạn đăng nhập bằng user của bạn, bạn đang đứng trong phòng của bạn.',
      ],
    },
    {
      type: 'text',
      title: 'Tên đầy đủ: schema.table',
      paragraphs: [
        'Gõ `employees` không kèm gì, Oracle chỉ tìm trong phòng của bạn. Không thấy thì báo ORA-00942.',
        'Muốn gọi table ở phòng khác, bạn viết **[[qualified-name]]**: tên schema, dấu chấm, tên table. Ví dụ `HR.EMPLOYEES`.',
        'Có tên đầy đủ, Oracle đi thẳng tới phòng HR và lấy table EMPLOYEES.',
        'Bạn còn cần quyền đọc. User của bạn chưa được cấp quyền SELECT trên table đó thì Oracle cũng báo ORA-00942.',
        'Hai schema có thể có cùng tên table. `HR.EMPLOYEES` và `TEST.EMPLOYEES` là hai table khác nhau.',
      ],
    },
    {
      type: 'text',
      title: 'MySQL gọi schema là database',
      paragraphs: [
        'MySQL dùng chữ schema và chữ database cho cùng một thứ. Một server MySQL chứa nhiều database, và mỗi database chứa table.',
        'Tên đầy đủ ở MySQL cũng là `ten_database.ten_table`, ví dụ `congty.employees`.',
        'Database không tồn tại thì MySQL báo lỗi 1049: Unknown database.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: gọi table bằng tên đầy đủ',
      intro:
        'Database của bài này có schema tên CONGTY (Oracle) hoặc congty (MySQL). Bấm Chạy để đọc table bằng tên đầy đủ. Rồi bấm từng mục để thử bỏ tên schema.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT employee_id, first_name, last_name\nFROM congty.employees\nLIMIT 3;',
        oracle: 'SELECT employee_id, first_name, last_name\nFROM CONGTY.EMPLOYEES\nFETCH FIRST 3 ROWS ONLY',
      },
      tries: [
        {
          label: 'Bỏ tên schema: bạn đang đứng trong schema này nên vẫn chạy',
          sql: {
            mysql: 'SELECT employee_id, first_name, last_name\nFROM employees\nLIMIT 3;',
            oracle: 'SELECT employee_id, first_name, last_name\nFROM EMPLOYEES\nFETCH FIRST 3 ROWS ONLY',
          },
        },
        {
          label: 'Đếm row bằng tên đầy đủ',
          sql: {
            mysql: 'SELECT COUNT(*) AS so_nhan_vien FROM congty.employees;',
            oracle: 'SELECT COUNT(*) AS so_nhan_vien FROM CONGTY.EMPLOYEES',
          },
        },
        {
          label: 'Dùng tên đầy đủ trong JOIN',
          sql: {
            mysql:
              'SELECT e.first_name, d.department_name\nFROM congty.employees e\nJOIN congty.departments d ON d.department_id = e.department_id\nLIMIT 3;',
            oracle:
              'SELECT e.first_name, d.department_name\nFROM CONGTY.EMPLOYEES e\nJOIN CONGTY.DEPARTMENTS d ON d.department_id = e.department_id\nFETCH FIRST 3 ROWS ONLY',
          },
        },
      ],
      say: 'Tên schema đứng trước dấu chấm. Bỏ nó đi thì database dùng schema của chính bạn.',
    },
    {
      type: 'text',
      title: 'Hỏi Oracle: mình là ai, table nào của ai',
      paragraphs: [
        '`SELECT USER FROM DUAL` cho bạn biết user đang đăng nhập, cũng là tên schema của bạn. **[[dual]]** là table nhỏ có sẵn của Oracle. Dùng nó khi bạn cần SELECT mà không đọc table nào.',
        '`USER_TABLES` liệt kê table trong schema của bạn.',
        '`ALL_TABLES` liệt kê mọi table bạn được phép đọc, kể cả của schema khác. Column `OWNER` cho biết schema chủ của từng table.',
        'Chạy `SELECT owner, table_name FROM all_tables` là cách nhanh để tìm `EMPLOYEES` nằm ở schema nào.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay: tra user và owner (Oracle)',
      intro: 'Bấm Chạy để xem mình là user nào. Rồi bấm mục thứ hai để xem OWNER của table.',
      database: 'company',
      tables: ['employees'],
      dialects: ['oracle'],
      session: true,
      sql: {
        oracle: 'SELECT USER FROM DUAL',
      },
      tries: [
        {
          label: 'Table EMPLOYEES thuộc schema nào',
          sql: {
            oracle: "SELECT owner, table_name\nFROM all_tables\nWHERE table_name = 'EMPLOYEES'",
          },
        },
        {
          label: 'Các table trong schema của mình',
          sql: {
            oracle: 'SELECT table_name\nFROM user_tables\nORDER BY table_name',
          },
        },
      ],
      say: 'Giá trị USER và column OWNER trùng nhau, vì table này nằm trong schema của bạn.',
    },
    {
      type: 'workshop',
      title: 'Xưởng: schema không có thì báo lỗi',
      intro:
        'Database trống này có schema SAOMAI (Oracle) hoặc saomai (MySQL), với một table menu_items. Bấm Chạy để đọc bằng tên đầy đủ. Rồi bấm từng nút để thử bỏ tên schema và gọi một schema khác.',
      start: 'empty',
      setup: { mysql: setupMysql, oracle: setupOracle },
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT * FROM saomai.menu_items;',
        oracle: 'SELECT * FROM SAOMAI.MENU_ITEMS;',
      },
      tries: [
        {
          label: 'Bỏ tên schema',
          sql: { mysql: 'SELECT * FROM menu_items;', oracle: 'SELECT * FROM menu_items;' },
        },
        {
          label: 'Gọi schema khác: hr',
          expect: 'error',
          sql: {
            mysql: '-- MySQL không có database hr: lỗi 1049.\nSELECT * FROM hr.menu_items;',
            oracle: '-- Oracle không thấy table nào ở schema HR: ORA-00942.\nSELECT * FROM hr.menu_items;',
          },
        },
        {
          label: 'Chỉ lấy tên món (Oracle: viết thường vẫn chạy)',
          sql: {
            mysql: 'SELECT item_name FROM saomai.menu_items;',
            oracle: 'SELECT item_name FROM saomai.menu_items;',
          },
        },
      ],
      say: 'Ở Oracle, ORA-00942 không nói table thiếu hay schema sai. Bạn phải tự kiểm hai thứ đó.',
    },
    {
      type: 'text',
      title: 'Synonym: tên gọi tắt',
      paragraphs: [
        'Viết `HR.EMPLOYEES` mỗi lần thì mỏi tay. Người quản trị có thể đặt một **[[synonym]]**: tên gọi tắt trỏ tới một table ở schema khác.',
        'Có synonym `EMP` trỏ tới `HR.EMPLOYEES`, bạn gõ `SELECT * FROM emp` là đủ.',
        'Bạn không cần tự tạo synonym lúc mới đi làm. Chỉ cần nhận ra khi thấy một tên table mà `USER_TABLES` không liệt kê.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle không phân biệt hoa thường với tên không có nháy kép. `hr.employees` và `HR.EMPLOYEES` là cùng một table.',
        'MySQL trên Linux phân biệt hoa thường ở tên database và tên table. `congty.employees` khác `CONGTY.employees`.',
        'Oracle: schema là user. MySQL: schema và database là một. Cả hai đều dùng dạng `schema.table`.',
        'Đoạn dưới chỉ để đọc, không chạy được trong bài này. Chỉ người quản trị có quyền tạo synonym.',
      ],
      mysql: 'SELECT * FROM congty.employees;',
      oracle: '-- DBA tạo synonym một lần:\nCREATE SYNONYM emp FOR hr.employees;\n\n-- Bạn dùng tên gọi tắt:\nSELECT * FROM emp;',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn gõ SELECT * FROM employees ở Oracle và gặp ORA-00942, dù đồng nghiệp nói table có thật. Nên thử gì trước?',
          options: [
            { text: 'Tìm schema chủ của table, rồi gõ lại bằng tên đầy đủ schema.table', correct: true, feedback: 'Đúng. Gõ tên table không kèm schema thì Oracle chỉ tìm trong schema của bạn.' },
            { text: 'Tạo lại table EMPLOYEES', feedback: 'Tạo lại là tạo thêm một table khác, và dữ liệu thật vẫn nằm ở chỗ cũ.' },
            { text: 'Gõ ROLLBACK', feedback: 'ROLLBACK không nói gì về schema chứa table.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn biết table EMPLOYEES thuộc schema nào ở Oracle. Câu nào trả lời được?',
          options: [
            { text: "SELECT owner, table_name FROM all_tables WHERE table_name = 'EMPLOYEES'", correct: true, feedback: 'Đúng. ALL_TABLES có column OWNER là schema chủ.' },
            { text: 'SELECT USER FROM DUAL', feedback: 'Câu này chỉ cho biết bạn là ai, không nói table nằm ở đâu.' },
            { text: 'SELECT * FROM DUAL', feedback: 'DUAL là table nhỏ của Oracle, không liệt kê table của người khác.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi thứ với ý của nó.',
          pairs: [
            { left: 'schema', right: 'Ngăn chứa table của một user' },
            { left: 'HR.EMPLOYEES', right: 'Tên đầy đủ: schema HR, table EMPLOYEES' },
            { left: 'ALL_TABLES', right: 'Mọi table bạn được đọc, có column OWNER' },
            { left: 'synonym', right: 'Tên gọi tắt do người quản trị đặt' },
          ],
          done: 'Đúng hết. Bốn thứ này đủ để tìm và gọi table ở schema khác.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Hai schema, cùng tên table',
      paragraphs: [
        'Nhiều công ty có hai schema giống nhau: một để chạy thật, một để thử. Cả hai đều có table CUSTOMERS.',
        'Bạn gõ `customers` không kèm schema, và database dùng schema của user bạn đang đăng nhập. Nếu bạn nhầm user, bạn sửa nhầm table.',
        'Vì vậy dân đi làm lâu năm luôn viết tên đầy đủ khi sửa dữ liệu thật. Họ cũng chạy `SELECT USER FROM DUAL` để kiểm trước.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Ở Oracle, mỗi user có một schema chứa table của mình.',
        'Table ở schema khác phải gọi bằng tên đầy đủ schema.table, và bạn cần quyền đọc.',
        'Quên tên schema thì gặp ORA-00942 dù table có thật.',
        'SELECT USER FROM DUAL cho biết bạn là ai. ALL_TABLES có column OWNER cho biết schema chủ.',
        'Synonym là tên gọi tắt do người quản trị đặt, trỏ tới table ở schema khác.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c SQL Language Reference, Database Object Names and Qualifiers', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Database-Object-Names-and-Qualifiers.html' },
        { name: 'Oracle Database 19c Reference, ALL_TABLES', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/ALL_TABLES.html' },
        { name: 'Oracle Database 19c SQL Language Reference, CREATE SYNONYM', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-SYNONYM.html' },
        { name: 'MySQL 8.0 Reference Manual, Schema Object Names', url: 'https://dev.mysql.com/doc/refman/8.0/en/identifiers.html' },
      ],
    },
  ],
};
