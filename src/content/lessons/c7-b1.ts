import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b1',
  chapter: 7,
  order: 1,
  title: 'Đọc một database lạ: tìm đường nối giữa hai table',
  lead: 'Bạn tìm đường nối giữa hai table bằng foreign key, rồi viết JOIN đi theo đường đó.',
  minutes: 16,
  goals: [
    'Đọc foreign key để biết hai table nối với nhau bằng column nào',
    'Tìm đường từ table này sang table kia qua các table ở giữa',
    'Chọn đường ngắn nhất, và biết khi nào cần đường khác',
    'Hỏi database xem table nào trỏ tới table nào',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Doanh thu theo khu vực',
      paragraphs: [
        'Sáng thứ hai, chị Mai ở phòng kinh doanh nhắn Bi: "Cho chị doanh thu theo khu vực nhé."',
        'Bi mở database của công ty. Database có 11 table, tên nào cũng lạ.',
        'Table order_items có số lượng và đơn giá. Table regions có tên khu vực. Hai table này không có column nào chung.',
        'Bi không đoán. Bi tìm xem table nào trỏ tới table nào, rồi đi theo từng chặng.',
      ],
    },
    {
      type: 'text',
      title: 'Foreign key là biển chỉ đường',
      paragraphs: [
        'Mỗi **[[foreign-key]]** là một biển chỉ đường. Biển nói column này trỏ tới table nào.',
        'Column `customer_id` của orders trỏ tới `customer_id` của customers. Đó là một chặng đường.',
        'Hai table có foreign key trực tiếp thì nối bằng một JOIN. ON so foreign key với primary key mà nó trỏ tới.',
        'Hai table không có foreign key trực tiếp thì đi qua các table ở giữa. Mỗi table ở giữa thêm một JOIN.',
        'Chuỗi các chặng đó là **[[join-path]]**, tức đường nối. Từ order_items tới regions, đường nối đi qua orders, customers và countries. Đó là bốn chặng, bốn JOIN.',
        'Đừng đoán theo tên column. Cả employees lẫn customers đều có column `email`, và `email` không nối được hai table này.',
        'Bên dưới là sơ đồ database công ty. Chọn hai table và xem đường nối sáng lên.',
      ],
    },
    {
      type: 'scene',
      scene: 'schema-path',
      title: 'Tìm đường trên sơ đồ',
      intro: 'Chọn hai table bất kỳ. Đường nối giữa chúng sáng lên. Đếm số chặng, rồi thử chọn cặp khác.',
    },
    {
      type: 'text',
      title: 'Nhiều đường, chọn theo câu hỏi',
      paragraphs: [
        'Hai table có thể có nhiều đường nối. Bạn chọn đường ngắn nhất, trừ khi câu hỏi cần đường khác.',
        'Lấy orders và countries làm ví dụ. Đường qua customers hỏi "khách ở nước nào". Đường qua employees, departments và locations hỏi "nhân viên bán đơn ở nước nào".',
        'Hai đường cho hai câu trả lời. Đường đầu đếm được 52 đơn của khách Việt Nam. Đường sau đếm được 70 đơn, và nhân viên bán cả 70 đơn đều làm ở Việt Nam.',
        'Đường sau chỉ có 70 đơn, vì 10 đơn không có nhân viên bán. Những đơn ấy rơi ra ngoài khi nối.',
        'Bạn đã tìm được đường. Giờ nối thử hai table đầu tiên của đường: customers và countries.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nối hai table có foreign key trực tiếp',
      intro: 'Bấm Chạy. Query nối customers với countries bằng `country_id`, column trỏ từ khách sang quốc gia.',
      database: 'company',
      tables: ['customers', 'countries', 'regions'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT c.customer_name, co.country_name\nFROM customers c\nJOIN countries co\n  ON c.country_id = co.country_id\nORDER BY c.customer_id',
      ),
      tries: [
        {
          label: 'Đổi sang employees và departments',
          sql: both(
            'SELECT e.last_name, d.department_name\nFROM employees e\nJOIN departments d\n  ON e.department_id = d.department_id\nWHERE e.employee_id <= 110',
          ),
        },
        {
          label: 'Đổi sang countries và regions',
          sql: both(
            'SELECT co.country_name, r.region_name\nFROM countries co\nJOIN regions r\n  ON co.region_id = r.region_id\nORDER BY co.country_id',
          ),
        },
        {
          label: 'Thêm table thứ ba: regions',
          sql: both(
            'SELECT c.customer_name, co.country_name, r.region_name\nFROM customers c\nJOIN countries co\n  ON c.country_id = co.country_id\nJOIN regions r\n  ON co.region_id = r.region_id\nWHERE c.customer_id <= 1003',
          ),
        },
        {
          label: 'Đổi ON thành c.customer_id = co.region_id',
          sql: both(
            'SELECT c.customer_name, co.country_name\nFROM customers c\nJOIN countries co\n  ON c.customer_id = co.region_id\nORDER BY c.customer_id',
          ),
        },
      ],
      say: 'Mục cuối nối sai cặp column. Query vẫn chạy, nhưng ra 0 row. Luôn nối foreign key với primary key mà nó trỏ tới.',
    },
    {
      type: 'text',
      title: 'Nối sai thì database nói gì',
      paragraphs: [
        'Nối sai cặp column thường không báo lỗi. Query chạy xong và cho ra ít row, hoặc 0 row.',
        'Nếu bạn viết một column không tồn tại, database báo lỗi. MySQL báo 1054. Oracle báo ORA-00904.',
        'Vì vậy hãy xem kết quả trước khi tin nó. Hai table nối đúng thì số row hợp lý: 30 khách, 30 row.',
        'Từ order_items tới regions, bạn thêm từng JOIN theo đường nối. Bài "Nối ba, bốn, năm table" làm đúng chuyện đó.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Database ở công ty hiếm khi có sẵn sơ đồ. Bạn hỏi thẳng database.',
        'Oracle giữ foreign key trong các view hệ thống `USER_CONSTRAINTS` và `USER_CONS_COLUMNS`. Constraint loại `R` là foreign key.',
        'Column `R_CONSTRAINT_NAME` ghi tên constraint mà foreign key trỏ tới. Tên constraint ở công ty bạn có thể khác ví dụ này.',
        'Oracle lưu tên table bằng chữ hoa, nên bạn viết `\'ORDERS\'`.',
        'MySQL cho bạn xem cấu trúc table bằng `SHOW CREATE TABLE`. Tìm các chữ FOREIGN KEY và REFERENCES trong kết quả.',
        'Table của người dùng khác cần được cấp quyền đọc. Chương 11 nói tiếp về quyền.',
      ],
      mysql: 'SHOW CREATE TABLE orders;\n-- Trong kết quả có:\n-- CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`)\n--   REFERENCES `customers` (`customer_id`)\n-- CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`sales_rep_id`)\n--   REFERENCES `employees` (`employee_id`)',
      oracle:
        "SELECT c.CONSTRAINT_NAME, c.TABLE_NAME, cc.COLUMN_NAME, c.R_CONSTRAINT_NAME\nFROM USER_CONSTRAINTS c\nJOIN USER_CONS_COLUMNS cc\n  ON c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME\nWHERE c.CONSTRAINT_TYPE = 'R'\n  AND c.TABLE_NAME = 'ORDERS'\n\n-- Kết quả:\n-- ORDERS_CUSTOMER_ID_FK   ORDERS  CUSTOMER_ID   CUSTOMERS_PK\n-- ORDERS_SALES_REP_ID_FK  ORDERS  SALES_REP_ID  EMPLOYEES_PK",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn cần nối order_items với products. Có cần đi qua table orders không?',
          options: [
            {
              text: 'Không. order_items có foreign key `product_id` trỏ thẳng tới products',
              correct: true,
              feedback: 'Đúng. Hai table có foreign key trực tiếp thì nối bằng một JOIN.',
            },
            {
              text: 'Có. Mọi table đều phải đi qua orders',
              feedback: 'Chỉ cần đi qua table ở giữa khi hai table không có foreign key trực tiếp. Ở đây có rồi.',
            },
            {
              text: 'Không nối được hai table này',
              feedback: 'Nối được. `order_items.product_id` trỏ tới `products.product_id`.',
            },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn cần nối employees với regions. Đường nào đúng?',
          options: [
            {
              text: 'employees, departments, locations, countries, regions',
              correct: true,
              feedback: 'Đúng. Bốn foreign key nối năm table: department_id, location_id, country_id, region_id.',
            },
            {
              text: 'employees, jobs, regions',
              feedback: 'Table jobs không có foreign key trỏ tới regions. Đường này đứt giữa chừng.',
            },
            {
              text: 'employees, customers, regions',
              feedback: 'employees không có foreign key trỏ tới customers, và customers cũng không trỏ thẳng tới regions.',
            },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn nối customers với countries bằng `ON c.customer_id = co.region_id`. Chuyện gì xảy ra?',
          options: [
            {
              text: 'Query chạy được và ra 0 row',
              correct: true,
              feedback: 'Đúng. Hai column đều là số nên database vẫn so được. Không mã khách nào trùng mã khu vực của quốc gia, nên không row nào ghép được.',
            },
            {
              text: 'Database báo lỗi vì hai column khác tên',
              feedback: 'Tên khác nhau không gây lỗi. Database chỉ so giá trị.',
            },
            {
              text: 'Database tự đổi sang foreign key đúng',
              feedback: 'Database không đoán thay bạn. Bạn viết gì thì nó nối theo đó.',
            },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Tiếp quản database không có tài liệu',
      paragraphs: [
        'Một bạn mới vào công ty nhận database có vài trăm table và không có tài liệu. Bạn ấy cần số đơn theo tỉnh.',
        'Bạn ấy không đọc hết từng table. Bạn ấy bắt đầu từ table đơn, đi theo foreign key tới khách, rồi tới địa chỉ.',
        'Sau mỗi chặng, bạn ấy chạy thử và kiểm số row, rồi mới đi tiếp.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Foreign key là biển chỉ đường: column của table này trỏ tới primary key của table kia.',
        'Hai table không nối trực tiếp thì đi qua các table ở giữa. Mỗi chặng thêm một JOIN.',
        'Nhiều đường thì chọn đường ngắn nhất, trừ khi câu hỏi cần đường khác. Mỗi đường trả lời một câu hỏi.',
        'Nối sai cặp column thường không báo lỗi, chỉ ra ít row hoặc 0 row. Oracle cho bạn hỏi foreign key qua USER_CONSTRAINTS.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 6: Multi-table queries with JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_joins' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
        { name: 'oracle-samples/db-sample-schemas (schema HR)', url: 'https://github.com/oracle-samples/db-sample-schemas', note: 'MIT' },
      ],
    },
  ],
};
