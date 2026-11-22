import type { Lesson } from '../types';

const cust = (kw: string, extra: string, end: string) =>
  `SELECT c.customer_id, c.customer_name
FROM customers c
WHERE ${kw} (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.customer_id${extra}
)${end}`;

const rep = (head: string, end: string) =>
  `SELECT e.employee_id, e.first_name, e.last_name
FROM employees e
WHERE ${head}${end}`;

export const lesson: Lesson = {
  id: 'c8-b5',
  chapter: 8,
  order: 5,
  title: 'EXISTS và NOT EXISTS',
  lead: 'Bạn chỉ hỏi "có row nào không", và tìm được row không có mà không sợ NULL.',
  minutes: 15,
  goals: [
    'Viết EXISTS và NOT EXISTS với subquery phụ thuộc',
    'So EXISTS với IN và JOIN, và thấy JOIN lặp row',
    'Dùng NOT EXISTS thay NOT IN khi dữ liệu có NULL',
    'Hiện kết quả của EXISTS thành một column ở cả hai dialect',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Khách nào chưa có đơn?',
      paragraphs: [
        'Anh Long ở phòng Kinh doanh muốn gọi điện cho những khách chưa từng đặt đơn.',
        'Bi nhớ NOT IN từ bài trước. Bi cũng nhớ bẫy NULL của nó.',
        'Bi đổi cách hỏi. Với từng khách, Bi lật sổ đơn và chỉ hỏi một câu: có đơn nào mang mã khách này không?',
        'Bi không cần biết đó là đơn nào, cũng không cần danh sách mã. Bi chỉ cần câu trả lời có hoặc không.',
      ],
    },
    {
      type: 'text',
      title: 'EXISTS chỉ hỏi có hay không',
      paragraphs: [
        '**[[exists]]** nhận một subquery và hỏi: subquery ra ít nhất một row không?',
        'Có row thì điều kiện đúng. Không có row nào thì điều kiện sai.',
        'Subquery của EXISTS thường là subquery phụ thuộc. Subquery nhắc tới column của query ngoài, như ở bài trước.',
        'EXISTS chỉ quan tâm có row hay không, nên SELECT chọn gì cũng được. Người ta quen viết `SELECT 1`.',
        'Ví dụ: `WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)` giữ khách có ít nhất một đơn.',
        '`NOT EXISTS` đảo lại: giữ khách không có đơn nào.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: khách có đơn, và ba cách viết',
      intro: 'Bấm Chạy. Rồi thử đổi sang NOT EXISTS, IN và JOIN để so số row.',
      database: 'company',
      tables: ['customers', 'orders'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: cust('EXISTS', '', ';'), oracle: cust('EXISTS', '', '') },
      tries: [
        {
          label: 'Đổi EXISTS thành NOT EXISTS',
          sql: { mysql: cust('NOT EXISTS', '', ';'), oracle: cust('NOT EXISTS', '', '') },
        },
        {
          label: 'Viết lại bằng IN',
          sql: {
            mysql:
              'SELECT c.customer_id, c.customer_name\nFROM customers c\nWHERE c.customer_id IN (SELECT customer_id FROM orders);',
            oracle:
              'SELECT c.customer_id, c.customer_name\nFROM customers c\nWHERE c.customer_id IN (SELECT customer_id FROM orders)',
          },
        },
        {
          label: 'Viết lại bằng JOIN',
          sql: {
            mysql:
              'SELECT c.customer_id, c.customer_name\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id;',
            oracle:
              'SELECT c.customer_id, c.customer_name\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id',
          },
        },
        {
          label: "Thêm AND o.status = 'cancelled' vào subquery",
          sql: {
            mysql: cust('EXISTS', "\n    AND o.status = 'cancelled'", ';'),
            oracle: cust('EXISTS', "\n    AND o.status = 'cancelled'", ''),
          },
        },
      ],
      say: 'EXISTS và IN cùng ra 27 khách. JOIN ra 80 row, vì khách có 6 đơn thì hiện 6 lần. EXISTS chỉ hỏi có hay không, nên mỗi khách hiện đúng một lần.',
    },
    {
      type: 'text',
      title: 'NOT EXISTS không sợ NULL',
      paragraphs: [
        'Bài trước cho thấy NOT IN ra 0 row khi danh sách có NULL.',
        'NOT EXISTS không so một giá trị với cả danh sách. NOT EXISTS chỉ kiểm có row nào khớp hay không.',
        'Row có `sales_rep_id` là NULL không bao giờ khớp `e.employee_id`. Row đó chỉ là row không khớp, và không làm hỏng kết quả.',
        'Hai query ở khối kế tiếp hỏi cùng một câu: nhân viên nào chưa phụ trách đơn nào? Query mở đầu dùng NOT IN và ra sai.',
        'Khi bạn không chắc column có NULL hay không, chọn NOT EXISTS. IN và NOT IN vẫn dễ đọc khi danh sách nhỏ và không có NULL.',
      ],
    },
    {
      type: 'playground',
      title: 'NOT IN gặp NULL, NOT EXISTS thì không',
      intro: 'Bấm Chạy. Rồi đổi sang NOT EXISTS và so số row.',
      database: 'company',
      tables: ['employees', 'orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: rep('e.employee_id NOT IN (SELECT sales_rep_id FROM orders)', ';'),
        oracle: rep('e.employee_id NOT IN (SELECT sales_rep_id FROM orders)', ''),
      },
      tries: [
        {
          label: 'Đổi sang NOT EXISTS',
          sql: {
            mysql: rep('NOT EXISTS (\n  SELECT 1\n  FROM orders o\n  WHERE o.sales_rep_id = e.employee_id\n)', ';'),
            oracle: rep('NOT EXISTS (\n  SELECT 1\n  FROM orders o\n  WHERE o.sales_rep_id = e.employee_id\n)', ''),
          },
        },
        {
          label: 'Đổi sang EXISTS',
          sql: {
            mysql: rep('EXISTS (\n  SELECT 1\n  FROM orders o\n  WHERE o.sales_rep_id = e.employee_id\n)', ';'),
            oracle: rep('EXISTS (\n  SELECT 1\n  FROM orders o\n  WHERE o.sales_rep_id = e.employee_id\n)', ''),
          },
        },
        {
          label: 'NOT EXISTS, chỉ xem phòng 20',
          sql: {
            mysql: rep('e.department_id = 20\n  AND NOT EXISTS (\n    SELECT 1\n    FROM orders o\n    WHERE o.sales_rep_id = e.employee_id\n  )', ';'),
            oracle: rep('e.department_id = 20\n  AND NOT EXISTS (\n    SELECT 1\n    FROM orders o\n    WHERE o.sales_rep_id = e.employee_id\n  )', ''),
          },
        },
      ],
      say: 'NOT IN ra 0 row, còn NOT EXISTS ra đúng 27 người chưa phụ trách đơn nào. Trong phòng Kinh doanh chỉ còn trưởng phòng Hùng, vì 13 nhân viên kinh doanh đều có đơn.',
    },
    {
      type: 'oracle',
      body: [
        'EXISTS và NOT EXISTS trong WHERE chạy giống nhau ở cả hai dialect.',
        'Khác biệt chỉ xuất hiện khi bạn muốn hiện kết quả của EXISTS thành một column. MySQL cho viết `SELECT EXISTS (...)` và ra 1 hoặc 0. Oracle 19c báo ORA-00923.',
        'Viết `CASE WHEN EXISTS (...) THEN ... ELSE ... END` chạy ở cả hai dialect. Query Oracle dưới đây dùng cách đó.',
      ],
      mysql:
        'SELECT c.customer_name,\n  EXISTS (\n    SELECT 1 FROM orders o\n    WHERE o.customer_id = c.customer_id\n  ) AS has_order\nFROM customers c;',
      oracle:
        "SELECT c.customer_name,\n  CASE WHEN EXISTS (\n    SELECT 1 FROM orders o\n    WHERE o.customer_id = c.customer_id\n  ) THEN 'Có' ELSE 'Chưa' END AS has_order\nFROM customers c",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'EXISTS trả lời câu hỏi nào?',
          options: [
            { text: 'Subquery có ra ít nhất một row không?', correct: true, feedback: 'Đúng. Câu trả lời chỉ có "có" hoặc "không".' },
            { text: 'Subquery ra bao nhiêu row?', feedback: 'COUNT mới đếm row. EXISTS chỉ cần biết có hay không.' },
            { text: 'Subquery ra giá trị nào?', feedback: 'EXISTS không đọc giá trị. Vì vậy SELECT 1 hay SELECT NULL đều như nhau.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Danh sách của subquery có thể chứa NULL. Bạn cần tìm row không nằm trong danh sách. Chọn cách nào?',
          options: [
            { text: 'NOT EXISTS với subquery phụ thuộc', correct: true, feedback: 'Đúng. NOT EXISTS chỉ kiểm có row khớp hay không, nên NULL không làm hỏng.' },
            { text: 'NOT IN với subquery giữ nguyên', feedback: 'Gặp NULL, NOT IN không giữ row nào.' },
            { text: '`<> ALL` với subquery giữ nguyên', feedback: '`<> ALL` có nghĩa như NOT IN, nên dính cùng bẫy NULL.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Subquery của EXISTS viết `SELECT 1`. Vì sao con số 1 không quan trọng?',
          options: [
            { text: 'EXISTS chỉ kiểm có row hay không, không đọc giá trị', correct: true, feedback: 'Đúng. Bạn viết `SELECT 1`, `SELECT NULL` hay `SELECT c.customer_id`, kết quả đều như nhau.' },
            { text: '1 là mã của khách đầu tiên', feedback: 'Con số 1 không liên quan tới dữ liệu. Đó chỉ là chỗ điền cho đủ cú pháp.' },
            { text: 'Database tự bỏ subquery và chỉ giữ số 1', feedback: 'Database vẫn chạy subquery để biết có row hay không.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Dọn danh mục sản phẩm',
      paragraphs: [
        'Một đội vận hành muốn ẩn các sản phẩm chưa từng xuất hiện trong đơn nào.',
        'Lần đầu họ viết NOT IN và nhận về 0 sản phẩm. Vài row chi tiết đơn bị lỗi nhập có product_id là NULL.',
        'Họ đổi sang NOT EXISTS và nhận đủ danh sách cần ẩn.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'EXISTS đúng khi subquery ra ít nhất một row. NOT EXISTS đúng khi subquery không ra row nào.',
        'Subquery của EXISTS nhắc tới column của query ngoài. SELECT 1 là cách viết quen thuộc.',
        'JOIN lặp row của khách có nhiều đơn. EXISTS giữ mỗi khách một lần.',
        'NOT EXISTS an toàn với NULL hơn NOT IN. MySQL cho EXISTS trong danh sách SELECT, Oracle thì dùng CASE WHEN.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, Topic: Subqueries', url: 'https://sqlbolt.com/topic/subqueries' },
        { name: 'MySQL 8.0 Reference Manual, EXISTS and NOT EXISTS Subqueries', url: 'https://dev.mysql.com/doc/refman/8.0/en/exists-and-not-exists-subqueries.html' },
        { name: 'Oracle Database 19c SQL Language Reference, EXISTS Condition', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/EXISTS-Condition.html' },
      ],
    },
  ],
};
