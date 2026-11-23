import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c11-b3',
  chapter: 11,
  order: 3,
  title: 'Tìm table và column trong database lạ: data dictionary, DESC',
  lead: 'Bạn tự tìm ra có table nào, column nào, và table nào nối với table nào.',
  minutes: 15,
  goals: [
    'Hỏi ba câu khi vào một database lạ',
    'Đọc USER_TABLES và USER_TAB_COLUMNS để biết table và column',
    'Tìm mọi column có tên chứa một chữ',
    'Xem foreign key bằng USER_CONSTRAINTS và USER_CONS_COLUMNS',
    'Dùng DESC ở Oracle, DESCRIBE và SHOW TABLES ở MySQL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ngày đầu ở công ty mới',
      paragraphs: [
        'Bạn vào công ty mới. Anh IT gửi cho bạn một tài khoản Oracle và nói: "Dữ liệu bán hàng nằm trong đó rồi."',
        'Bạn đăng nhập. Không có tài liệu nào đi kèm. Người vẽ sơ đồ đã nghỉ từ lâu.',
        'Bi nói: "Database tự biết mình có gì. Bạn chỉ cần hỏi đúng chỗ."',
        'Bài này dạy bạn hỏi đúng chỗ, bằng ba câu hỏi.',
      ],
    },
    {
      type: 'text',
      title: 'Ba câu hỏi đầu tiên',
      paragraphs: [
        'Vào một database lạ, hãy hỏi ba câu theo thứ tự.',
        'Câu một: có những table nào?',
        'Câu hai: table này có những column nào, kiểu gì?',
        'Câu ba: table này nối với table nào?',
        'Ba câu trả lời cho bạn một tấm bản đồ. Có bản đồ rồi, bạn mới viết query được.',
      ],
    },
    {
      type: 'text',
      title: 'Oracle trả lời bằng data dictionary',
      paragraphs: [
        '**[[data-dictionary]]** là tập các view mà Oracle dựng sẵn. Chúng ghi lại mọi table, column và constraint của database.',
        'Bạn đọc các view này bằng SELECT thường, giống đọc một table.',
        'Bốn view bạn dùng nhiều nhất: `USER_TABLES`, `USER_TAB_COLUMNS`, `USER_CONSTRAINTS` và `USER_CONS_COLUMNS`.',
        'Tiền tố `USER_` nghĩa là "của user đang đăng nhập". Bạn thấy table của mình.',
        'Bản `ALL_TABLES` và `ALL_TAB_COLUMNS` thêm table của user khác mà bạn có quyền đọc. Chúng có thêm column `OWNER`, là tên chủ của table.',
        "Tên view, tên column và tên table trong data dictionary đều viết hoa. Gõ `'EMPLOYEES'`, không gõ `'employees'`.",
      ],
    },
    {
      type: 'code',
      title: 'Câu một và câu hai ở Oracle',
      intro: 'Hai query dưới đây trả lời câu một và câu hai. Bạn chạy chúng trong tool của công ty.',
      code: "SELECT table_name\nFROM user_tables\nORDER BY table_name;\n\nSELECT column_name, data_type\nFROM user_tab_columns\nWHERE table_name = 'EMPLOYEES'\nORDER BY column_id;",
      notes: [
        { find: 'FROM user_tables', text: 'Mỗi row là một table của bạn. Với database công ty, bạn nhận 11 row, từ COUNTRIES tới REGIONS.' },
        { find: "WHERE table_name = 'EMPLOYEES'", text: 'Chữ hoa, vì data dictionary lưu tên viết hoa. Viết thường thì không ra row nào.' },
        { find: 'ORDER BY column_id', text: 'column_id là thứ tự column lúc tạo table. Sắp theo nó thì bạn đọc column đúng thứ tự trong table.' },
      ],
    },
    {
      type: 'text',
      title: 'Tìm column theo tên',
      paragraphs: [
        'Sếp hỏi: "Lương nhân viên nằm ở đâu?" Bạn không biết table nào chứa lương.',
        'Hãy tìm mọi column có tên chứa chữ SALARY. Dùng LIKE trên `USER_TAB_COLUMNS`.',
        "`WHERE column_name LIKE '%SALARY%'` cho ba row: `EMPLOYEES.SALARY`, `JOBS.MIN_SALARY` và `JOBS.MAX_SALARY`.",
        "Dấu `%` thay cho mọi chữ đứng trước hoặc sau SALARY. Viết `'%salary%'` bằng chữ thường thì không ra row nào.",
        'Cách này nhanh hơn nhiều so với mở từng table để đọc.',
      ],
    },
    {
      type: 'code',
      title: 'Tìm column theo tên, và câu ba: foreign key',
      intro: 'Query đầu tìm column. Query sau liệt kê foreign key của table ORDERS và column nó dùng.',
      code: "SELECT table_name, column_name\nFROM user_tab_columns\nWHERE column_name LIKE '%SALARY%'\nORDER BY table_name, column_name;\n\nSELECT c.constraint_name, cc.column_name, c.r_constraint_name\nFROM user_constraints c\nJOIN user_cons_columns cc\n  ON cc.constraint_name = c.constraint_name\nWHERE c.constraint_type = 'R'\n  AND c.table_name = 'ORDERS';",
      notes: [
        { find: "LIKE '%SALARY%'", text: 'Giữ mọi column có chữ SALARY ở bất kỳ chỗ nào trong tên.' },
        { find: "constraint_type = 'R'", text: "R là foreign key. P là primary key, U là unique, C là check." },
        { find: 'JOIN user_cons_columns cc', text: 'USER_CONSTRAINTS cho tên constraint. USER_CONS_COLUMNS cho tên column của constraint đó. Bạn nối hai view bằng constraint_name.' },
        { find: 'c.r_constraint_name', text: 'Tên primary key mà foreign key này trỏ tới. Với ORDERS, bạn nhận CUSTOMERS_PK và EMPLOYEES_PK, nên ORDERS nối với CUSTOMERS và EMPLOYEES.' },
      ],
    },
    {
      type: 'text',
      title: 'DESC: lệnh của tool, không phải SQL',
      paragraphs: [
        '**[[desc-command]]** cho bạn xem column của một table chỉ bằng hai chữ: `DESC employees`.',
        'DESC không phải câu SQL. Đó là lệnh của tool như SQL*Plus và SQL Developer. Tool đọc data dictionary hộ bạn.',
        'Vì vậy bạn không cần chữ hoa, và tool nào không có lệnh này thì báo lỗi.',
        'Kết quả có ba column: tên column, `NOT NULL` nếu bắt buộc có giá trị, và data type như `NUMBER(38)` hay `VARCHAR2(255)`.',
        'Table không có thì Oracle báo ORA-04043.',
        'DESC cho bạn câu hai nhanh nhất. Câu một và câu ba vẫn cần data dictionary.',
      ],
    },
    {
      type: 'text',
      title: 'MySQL có lệnh riêng',
      paragraphs: [
        'MySQL không có `USER_TABLES`. Bạn dùng ba lệnh riêng.',
        '`SHOW TABLES` liệt kê table của database đang chọn. Đó là câu một.',
        '`DESCRIBE orders` hay `DESC orders` liệt kê column, data type, và ô Key. Ô Key ghi PRI cho primary key, MUL cho column dùng để nối.',
        '`SHOW CREATE TABLE orders` in nguyên câu CREATE TABLE của table, gồm cả primary key và foreign key. Đó là câu ba.',
        'Ba lệnh này cũng là lệnh của tool, không phải SELECT.',
        'MySQL còn có `information_schema`, một nơi chứa data dictionary đọc bằng SELECT. Bài này chưa dạy.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: xem row để kiểm bản đồ',
      intro: 'Bản đồ cho bạn tên table và column. Bước cuối là xem vài row thật. Bấm Chạy, rồi bấm từng mục.',
      database: 'company',
      tables: ['orders', 'customers'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT * FROM orders LIMIT 3;',
        oracle: 'SELECT * FROM orders FETCH FIRST 3 ROWS ONLY',
      },
      tries: [
        {
          label: 'Thử đường nối đoán được: orders.customer_id với customers.customer_id',
          sql: {
            mysql:
              'SELECT o.order_id, c.customer_name\nFROM orders o\nJOIN customers c\n  ON c.customer_id = o.customer_id\nLIMIT 3;',
            oracle:
              'SELECT o.order_id, c.customer_name\nFROM orders o\nJOIN customers c\n  ON c.customer_id = o.customer_id\nFETCH FIRST 3 ROWS ONLY',
          },
        },
        {
          label: 'Thử đường nối sai: orders.sales_rep_id với customers.customer_id',
          sql: both(
            'SELECT o.order_id, c.customer_name\nFROM orders o\nJOIN customers c\n  ON c.customer_id = o.sales_rep_id',
          ),
        },
        {
          label: 'Xem column lương ở table employees',
          sql: {
            mysql: 'SELECT employee_id, last_name, salary FROM employees LIMIT 3;',
            oracle: 'SELECT employee_id, last_name, salary FROM employees FETCH FIRST 3 ROWS ONLY',
          },
        },
      ],
      say: 'Đường nối sai ra 0 row, và database không báo lỗi. Sau khi đoán đường nối, hãy luôn nhìn kết quả.',
    },
    {
      type: 'oracle',
      body: [
        'Mỗi dialect dùng lệnh của riêng nó. Bảng dưới cho ba câu hỏi và lệnh trả lời.',
        'Khối Thử tay ở trên chạy SELECT thường. Các lệnh xem cấu trúc, bạn chạy trong SQL Developer hay DBeaver ở công ty.',
        'Ở Oracle, tên trong data dictionary luôn viết hoa. Ở MySQL, tên table viết thường như lúc tạo.',
      ],
      mysql:
        '-- câu một: có table nào\nSHOW TABLES;\n-- câu hai: có column nào\nDESCRIBE orders;\n-- câu ba: nối với table nào\nSHOW CREATE TABLE orders;',
      oracle:
        "-- câu một: có table nào\nSELECT table_name FROM user_tables;\n-- câu hai: có column nào\nDESC orders\n-- câu ba: nối với table nào\nSELECT c.constraint_name, cc.column_name, c.r_constraint_name\nFROM user_constraints c\nJOIN user_cons_columns cc ON cc.constraint_name = c.constraint_name\nWHERE c.constraint_type = 'R' AND c.table_name = 'ORDERS';",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: "Bạn chạy `SELECT column_name FROM user_tab_columns WHERE table_name = 'employees'` trên Oracle. Kết quả ra sao?",
          options: [
            { text: 'Không ra row nào, vì tên table trong data dictionary viết hoa', correct: true, feedback: "Đúng. Phải viết 'EMPLOYEES'. Oracle không báo lỗi, chỉ trả về 0 row." },
            { text: 'Oracle báo ORA-00942', feedback: 'View USER_TAB_COLUMNS có thật, nên query chạy được. Chữ thường làm điều kiện WHERE không khớp row nào.' },
            { text: 'Ra đủ column của EMPLOYEES', feedback: "Oracle phân biệt hoa thường khi so chữ trong nháy. 'employees' khác 'EMPLOYEES'." },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn cần biết table nào có column tên chứa DATE. Bạn dùng gì?',
          options: [
            { text: "USER_TAB_COLUMNS với WHERE column_name LIKE '%DATE%'", correct: true, feedback: 'Đúng. Query này trả về HIRE_DATE, END_DATE, START_DATE và ORDER_DATE cùng tên table của chúng.' },
            { text: 'DESC với tên column', feedback: 'DESC nhận tên table, không nhận tên column. Nó không tìm được trên nhiều table.' },
            { text: 'USER_TABLES', feedback: 'USER_TABLES chỉ có tên table. Tên column nằm ở USER_TAB_COLUMNS.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi nhu cầu với lệnh phù hợp.',
          pairs: [
            { left: 'Oracle: liệt kê table', right: 'SELECT table_name FROM user_tables' },
            { left: 'Oracle: xem column nhanh', right: 'DESC employees' },
            { left: 'MySQL: liệt kê table', right: 'SHOW TABLES' },
            { left: 'MySQL: xem câu tạo table', right: 'SHOW CREATE TABLE orders' },
          ],
          done: 'Đúng hết. Nhớ ba câu hỏi, lệnh nào cũng tra lại được.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo của người đi trước',
      paragraphs: [
        'Bạn nhận một báo cáo cũ có column tên CUST_CR_LMT. Không ai nhớ nó là gì.',
        'Bạn tìm tên đó trong USER_TAB_COLUMNS và thấy table chứa nó. Rồi bạn xem vài row để đoán nghĩa. Nếu vẫn chưa rõ, bạn hỏi người quản trị database.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Vào database lạ, hỏi ba câu: có table nào, table đó có column nào, nối với table nào.',
        'Oracle trả lời bằng data dictionary: USER_TABLES, USER_TAB_COLUMNS, USER_CONSTRAINTS, USER_CONS_COLUMNS.',
        'Tên trong data dictionary viết hoa. Bản ALL_ thêm column OWNER.',
        "Tìm column theo tên bằng WHERE column_name LIKE '%SALARY%'.",
        'DESC là lệnh của tool, không phải SQL. MySQL có SHOW TABLES, DESCRIBE và SHOW CREATE TABLE.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c Reference, USER_TAB_COLUMNS', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/USER_TAB_COLUMNS.html' },
        { name: 'Oracle Database 19c Reference, USER_CONSTRAINTS', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/USER_CONSTRAINTS.html' },
        { name: 'SQL*Plus User\'s Guide 19c, DESCRIBE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqpug/DESCRIBE.html' },
        { name: 'MySQL 8.0 Reference Manual, SHOW TABLES', url: 'https://dev.mysql.com/doc/refman/8.0/en/show-tables.html' },
        { name: 'MySQL 8.0 Reference Manual, SHOW CREATE TABLE', url: 'https://dev.mysql.com/doc/refman/8.0/en/show-create-table.html' },
        { name: 'MySQL 8.0 Reference Manual, DESCRIBE', url: 'https://dev.mysql.com/doc/refman/8.0/en/describe.html' },
      ],
    },
  ],
};
