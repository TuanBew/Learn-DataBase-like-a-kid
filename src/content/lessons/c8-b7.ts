import type { Lesson } from '../types';

/** Doanh thu từng khách, viết lồng nhau. `pad` là số dấu cách thụt vào. */
const REV = (pad: string, where = '') =>
  `SELECT o.customer_id, SUM(i.quantity * i.unit_price) AS revenue
${pad}FROM orders o
${pad}JOIN order_items i ON i.order_id = o.order_id${where}
${pad}GROUP BY o.customer_id`;

const nested = (cmp: string, end: string) =>
  `SELECT c.customer_name, t.revenue
FROM customers c
JOIN (
  ${REV('  ')}
) t ON t.customer_id = c.customer_id
WHERE t.revenue ${cmp} (
  SELECT AVG(revenue)
  FROM (
    ${REV('    ')}
  ) x
)
ORDER BY t.revenue DESC${end}`;

const withSteps = (where: string, cmp: string, tail: string, end: string) =>
  `WITH customer_total AS (
  ${REV('  ', where)}
),
avg_total AS (
  SELECT AVG(revenue) AS avg_revenue
  FROM customer_total
)
${tail.replace('CMP', cmp)}${end}`;

const FINAL = `SELECT c.customer_name, t.revenue
FROM customer_total t
JOIN customers c ON c.customer_id = t.customer_id
WHERE t.revenue CMP (SELECT avg_revenue FROM avg_total)
ORDER BY t.revenue DESC`;

export const lesson: Lesson = {
  id: 'c8-b7',
  chapter: 8,
  order: 7,
  title: 'WITH: đặt tên cho từng bước của query',
  lead: 'Bạn chia một query dài thành các bước có tên, rồi đọc từ trên xuống.',
  minutes: 16,
  goals: [
    'Viết WITH với một và nhiều khối',
    'Đọc query WITH từ trên xuống, từng bước một',
    'Dùng lại một khối nhiều lần mà chỉ viết một lần',
    'Biết MySQL 5.7 không có WITH',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Query dài đọc không nổi',
      paragraphs: [
        'Bi gửi chị Hạnh query tìm khách chi nhiều hơn mức trung bình. Chị nhìn một lúc rồi hỏi: "Chỗ nào tính doanh thu của từng khách vậy?"',
        'Query dùng subquery lồng nhau. Đoạn tính doanh thu từng khách xuất hiện hai lần, một lần ở giữa và một lần trong ngoặc sâu hơn.',
        'Bi muốn viết lại như một công thức nấu ăn. Bước 1 tính doanh thu từng khách. Bước 2 tính trung bình. Bước 3 chọn khách trên mức trung bình.',
        'Mỗi bước có một cái tên, và bước sau gọi bước trước bằng tên đó.',
      ],
    },
    {
      type: 'text',
      title: 'WITH đặt tên cho một query nhỏ',
      paragraphs: [
        '**[[with]]** đặt tên cho một query nhỏ ở đầu query lớn. Mỗi khối có tên như vậy gọi là **[[cte]]**.',
        'Cú pháp: `WITH ten AS (SELECT ...) SELECT ... FROM ten`. Query chính gọi khối bằng tên, như gọi một table.',
        'Bạn viết được nhiều khối, ngăn nhau bằng dấu phẩy. Khối sau gọi được khối viết trước nó.',
        'Đọc từ trên xuống: mỗi khối là một bước, và query cuối ghép các bước lại.',
        'Khối nào cần dùng nhiều lần thì chỉ viết một lần. Với subquery lồng nhau, bạn phải chép đoạn đó nhiều lần.',
        'Tên khối chỉ sống trong một query. Chạy xong, tên biến mất và database không lưu gì.',
        'Khối thử tay đầu tiên là query lồng nhau. Hãy đọc nó trước, rồi so với bản WITH ở khối sau.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: query viết lồng nhau',
      intro: 'Bấm Chạy. Tìm đoạn tính doanh thu từng khách. Đoạn này xuất hiện mấy lần?',
      database: 'company',
      tables: ['customers', 'orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: nested('>', ';'), oracle: nested('>', '') },
      tries: [
        {
          label: 'Chạy riêng subquery doanh thu từng khách',
          sql: {
            mysql: `${REV('')}\nORDER BY revenue DESC;`,
            oracle: `${REV('')}\nORDER BY revenue DESC`,
          },
        },
        {
          label: 'Chạy riêng phép tính trung bình',
          sql: {
            mysql: `SELECT AVG(revenue) AS avg_revenue\nFROM (\n  ${REV('  ')}\n) x;`,
            oracle: `SELECT AVG(revenue) AS avg_revenue\nFROM (\n  ${REV('  ')}\n) x`,
          },
        },
        {
          label: 'Đổi > thành <',
          sql: { mysql: nested('<', ';'), oracle: nested('<', '') },
        },
      ],
      say: 'Có 13 khách trên mức trung bình, khoảng 19,87 triệu đồng. Đoạn doanh thu từng khách phải viết hai lần.',
    },
    {
      type: 'playground',
      title: 'Cùng query, viết bằng WITH',
      intro: 'Bấm Chạy. Rồi thử từng mục để xem kết quả trung gian của mỗi khối.',
      database: 'company',
      tables: ['customers', 'orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: withSteps('', '>', FINAL, ';'), oracle: withSteps('', '>', FINAL, '') },
      tries: [
        {
          label: 'Xem riêng khối customer_total',
          sql: {
            mysql: withSteps('', '>', 'SELECT *\nFROM customer_total\nORDER BY revenue DESC', ';'),
            oracle: withSteps('', '>', 'SELECT *\nFROM customer_total\nORDER BY revenue DESC', ''),
          },
        },
        {
          label: 'Xem riêng khối avg_total',
          sql: {
            mysql: withSteps('', '>', 'SELECT *\nFROM avg_total', ';'),
            oracle: withSteps('', '>', 'SELECT *\nFROM avg_total', ''),
          },
        },
        {
          label: 'Đổi > thành <',
          sql: { mysql: withSteps('', '<', FINAL, ';'), oracle: withSteps('', '<', FINAL, '') },
        },
        {
          label: "Chỉ tính đơn chưa hủy: thêm WHERE o.status <> 'cancelled' vào khối customer_total",
          sql: {
            mysql: withSteps("\n  WHERE o.status <> 'cancelled'", '>', FINAL, ';'),
            oracle: withSteps("\n  WHERE o.status <> 'cancelled'", '>', FINAL, ''),
          },
        },
      ],
      say: 'Kết quả giống query lồng nhau: 13 khách. Mục cuối chỉ sửa một chỗ, nhưng cả mức trung bình lẫn danh sách khách cùng đổi, vì cả hai đều đọc khối customer_total. Còn 12 khách.',
    },
    {
      type: 'text',
      title: 'Đọc và sửa query WITH',
      paragraphs: [
        'Muốn xem kết quả trung gian, giữ phần WITH và đổi query cuối thành `SELECT * FROM ten_khối`. Hai mục đầu ở khối trên làm như vậy.',
        'Khi cần sửa, bạn sửa đúng một khối. Mọi chỗ gọi khối đó tự dùng bản mới.',
        'Bạn đặt tên column cho khối ngay sau tên khối: `WITH dept_avg (department_id, avg_salary) AS (...)`.',
        'Số tên trong ngoặc phải bằng số column mà SELECT của khối trả về. Lệch thì database báo lỗi: MySQL 1353, Oracle ORA-32038.',
        'WITH không làm query nhanh hơn hay chậm đi. Lợi ích là query dễ đọc, dễ kiểm, và dễ sửa.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'WITH thường viết giống nhau ở cả hai dialect.',
        'Khác biệt lớn nhất là phiên bản. MySQL 8.0 trở lên có WITH. MySQL 5.7 không có, và gặp WITH sẽ báo lỗi cú pháp. Oracle 19c có WITH.',
        'Khối gọi lại chính nó, tức đệ quy, cần cú pháp riêng. MySQL bắt buộc viết `WITH RECURSIVE`. Oracle không cần chữ RECURSIVE. Khóa học này chưa dạy đệ quy.',
        'Query dưới đây đặt tên column ngay sau tên khối. Cả hai dialect đọc giống nhau.',
      ],
      mysql:
        'WITH dept_avg (department_id, avg_salary) AS (\n  SELECT department_id, AVG(salary)\n  FROM employees\n  GROUP BY department_id\n)\nSELECT e.first_name, e.last_name, e.salary, d.avg_salary\nFROM employees e\nJOIN dept_avg d ON d.department_id = e.department_id\nWHERE e.salary > d.avg_salary\nORDER BY e.department_id, e.salary DESC;',
      oracle:
        'WITH dept_avg (department_id, avg_salary) AS (\n  SELECT department_id, AVG(salary)\n  FROM employees\n  GROUP BY department_id\n)\nSELECT e.first_name, e.last_name, e.salary, d.avg_salary\nFROM employees e\nJOIN dept_avg d ON d.department_id = e.department_id\nWHERE e.salary > d.avg_salary\nORDER BY e.department_id, e.salary DESC',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query viết `WITH a AS (...), b AS (...) SELECT ...`. Khối b gọi được khối nào?',
          options: [
            { text: 'Khối a, vì a viết trước b', correct: true, feedback: 'Đúng. Khối sau gọi được khối viết trước nó.' },
            { text: 'Chỉ các table gốc, không gọi được khối nào', feedback: 'Khối b gọi được khối a. Đó là lý do WITH chia query thành các bước nối tiếp.' },
            { text: 'Khối a và cả khối viết sau b', feedback: 'Khối chỉ nhìn thấy các khối viết trước nó. Thứ tự từ trên xuống quyết định.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query WITH chạy xong. Chuyện gì xảy ra với tên khối?',
          options: [
            { text: 'Tên khối biến mất, database không lưu gì', correct: true, feedback: 'Đúng. Tên khối chỉ sống trong một query.' },
            { text: 'Database lưu khối thành table để dùng lại', feedback: 'WITH không tạo table. Muốn dùng lại ở query khác, bạn phải viết lại khối.' },
            { text: 'Database giữ tên khối đến hết phiên làm việc', feedback: 'Tên khối không tồn tại ngoài query đã khai nó.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Server dùng MySQL 5.7. Bạn chạy query có WITH. Chuyện gì xảy ra?',
          options: [
            { text: 'Server báo lỗi cú pháp, vì 5.7 chưa có WITH', correct: true, feedback: 'Đúng. WITH có từ MySQL 8.0. Trên 5.7 bạn dùng subquery trong FROM.' },
            { text: 'Query chạy bình thường', feedback: 'MySQL 5.7 không biết chữ WITH ở đầu query.' },
            { text: 'Server tự đổi WITH thành subquery', feedback: 'Server không tự viết lại query. Bạn phải tự đổi.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo cuối tháng đọc không nổi',
      paragraphs: [
        'Một nhóm báo cáo có query cuối tháng dài vài trang, toàn subquery lồng nhau. Người mới vào nhóm đọc không nổi.',
        'Chị trưởng nhóm viết lại bằng WITH. Mỗi bước một khối có tên: orders_clean, revenue_by_customer, top_customers.',
        'Người mới đọc từ trên xuống và hiểu từng bước. Khi số sai, họ chạy riêng từng khối để tìm bước nào lệch.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'WITH đặt tên cho từng bước ở đầu query. Query cuối gọi bước đó bằng tên.',
        'Nhiều khối ngăn nhau bằng dấu phẩy. Khối sau gọi được khối trước. Đọc từ trên xuống.',
        'Khối dùng nhiều lần chỉ viết một lần. Muốn xem kết quả trung gian, chạy riêng khối đó bằng `SELECT * FROM ten_khối`.',
        'MySQL 8.0 trở lên có WITH, MySQL 5.7 thì không. Oracle 19c có WITH.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 4', url: 'https://cs50.harvard.edu/sql/notes/4/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, WITH (Common Table Expressions)', url: 'https://dev.mysql.com/doc/refman/8.0/en/with.html' },
        { name: 'Oracle Database 19c SQL Language Reference, SELECT (subquery factoring)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html' },
      ],
    },
  ],
};
