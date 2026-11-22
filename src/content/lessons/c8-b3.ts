import type { Lesson } from '../types';

const INNER = `SELECT o.customer_id, SUM(i.quantity * i.unit_price) AS revenue
  FROM orders o
  JOIN order_items i ON i.order_id = o.order_id
  GROUP BY o.customer_id`;

const main = (extra: string, end: string) =>
  `SELECT t.customer_id, c.customer_name, c.country_id, t.revenue
FROM (
  ${INNER}
) t
JOIN customers c ON c.customer_id = t.customer_id${extra}
ORDER BY t.revenue DESC${end}`;

const wrong = (end: string) =>
  `SELECT c.country_id,
       SUM(c.credit_limit) AS total_credit,
       SUM(i.quantity * i.unit_price) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items i ON i.order_id = o.order_id
GROUP BY c.country_id
ORDER BY c.country_id${end}`;

const fixed = (end: string) =>
  `SELECT c.country_id,
       SUM(c.credit_limit) AS total_credit,
       SUM(t.revenue) AS revenue
FROM customers c
JOIN (
  ${INNER}
) t ON t.customer_id = c.customer_id
GROUP BY c.country_id
ORDER BY c.country_id${end}`;

const count = (end: string) =>
  `SELECT COUNT(*) AS joined_rows
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items i ON i.order_id = o.order_id${end}`;

export const lesson: Lesson = {
  id: 'c8-b3',
  chapter: 8,
  order: 3,
  title: 'Subquery trong FROM: gom trước, nối sau',
  lead: 'Bạn gom row thành danh sách ngắn trước, rồi mới nối với table khác.',
  minutes: 16,
  goals: [
    'Đặt subquery vào FROM và đặt alias cho nó',
    'Gom doanh thu theo khách trước, nối với customers sau',
    'Sửa bẫy nhân bội row bằng cách gom trước',
    'Biết MySQL và Oracle khác nhau ở alias của subquery',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hạn mức nước Đức lên tới 5,2 tỷ?',
      paragraphs: [
        'Chị Hạnh ở phòng Tài chính cần so hai con số theo từng nước: tổng hạn mức công nợ của khách, và tổng doanh thu họ đã mua.',
        'Bi nối customers với orders, rồi nối tiếp order_items. Sau đó Bi cộng hạn mức và doanh thu theo nước.',
        'Số của nước Đức làm Bi giật mình: tổng hạn mức là 5,2 tỷ đồng. Thật ra hai khách Đức chỉ có hạn mức 370 triệu và 280 triệu.',
        'Bài trước đã dạy chuyện này. Mỗi khách hiện nhiều lần sau khi nối, nên hạn mức bị cộng nhiều lần. Bi cần gom doanh thu theo khách trước, rồi mới nối với customers.',
      ],
    },
    {
      type: 'text',
      title: 'Subquery đứng ở chỗ của table',
      paragraphs: [
        'Bạn đã viết subquery trong WHERE. Bạn cũng đặt được subquery ở FROM, ngay chỗ của một table.',
        'Kết quả của subquery trở thành một table tạm. Query ngoài đọc hoặc nối table tạm đó như table thường. Cách viết này gọi là **[[from-subquery]]**.',
        'Ví dụ: gom doanh thu theo từng khách bằng GROUP BY. Kết quả có 27 row, mỗi khách một row.',
        'Rồi nối 27 row đó với customers để lấy tên và nước. Mỗi khách chỉ còn một row, nên không còn bị nhân bội.',
        'Subquery ở FROM cần một alias để query ngoài gọi tên nó. Query dưới đây dùng alias `t`.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: doanh thu của từng khách',
      intro: 'Bấm Chạy. Theater tạo table tạm từ subquery, rồi nối nó với customers.',
      database: 'company',
      tables: ['customers', 'orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: main('', ';'), oracle: main('', '') },
      tries: [
        {
          label: 'Chạy riêng phần subquery',
          sql: {
            mysql: `${INNER.replace(/^ {2}/gm, '')}\nORDER BY revenue DESC;`,
            oracle: `${INNER.replace(/^ {2}/gm, '')}\nORDER BY revenue DESC`,
          },
        },
        {
          label: 'Thêm WHERE t.revenue > 30000000',
          sql: { mysql: main('\nWHERE t.revenue > 30000000', ';'), oracle: main('\nWHERE t.revenue > 30000000', '') },
        },
        {
          label: 'Tìm khách chưa có doanh thu: customers LEFT JOIN subquery',
          sql: {
            mysql: `SELECT c.customer_id, c.customer_name, t.revenue
FROM customers c
LEFT JOIN (
  ${INNER}
) t ON t.customer_id = c.customer_id
WHERE t.revenue IS NULL;`,
            oracle: `SELECT c.customer_id, c.customer_name, t.revenue
FROM customers c
LEFT JOIN (
  ${INNER}
) t ON t.customer_id = c.customer_id
WHERE t.revenue IS NULL`,
          },
        },
      ],
      say: 'Subquery ra 27 row, mỗi khách một row. Khách 1005 dẫn đầu với 40.190.000 đồng. Ba khách chưa mua gì không có row nào trong subquery.',
    },
    {
      type: 'text',
      title: 'Sửa bẫy nhân bội: gom trước, nối sau',
      paragraphs: [
        'Quay lại câu hỏi của chị Hạnh. Nếu nối ba table rồi mới cộng, mỗi khách hiện một row cho mỗi món trong mỗi đơn.',
        'Query nối customers, orders và order_items ra 190 row, trong khi công ty chỉ có 30 khách.',
        'Hạn mức nằm ở table customers và mỗi khách chỉ có một giá trị. Cộng nó sau khi nối là cộng lặp.',
        'Cách kiểm nhanh: so `COUNT(*)` trước và sau khi nối, như bài trước đã dạy.',
        'Cách sửa: gom doanh thu theo khách trong subquery. Subquery cho mỗi khách một row. Bạn nối nó với customers rồi mới cộng hạn mức, nên mỗi khách chỉ được cộng một lần.',
        'Khối thử tay kế tiếp mở bằng query bị nhân bội. Mục đầu trong danh sách gợi ý là bản đã sửa.',
      ],
    },
    {
      type: 'playground',
      title: 'Hạn mức và doanh thu theo nước: sai và đúng',
      intro: 'Bấm Chạy. Xem total_credit của từng nước, rồi thử mục đầu để so.',
      database: 'company',
      tables: ['customers', 'orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: wrong(';'), oracle: wrong('') },
      tries: [
        {
          label: 'Gom doanh thu theo khách trong subquery rồi mới nối',
          sql: { mysql: fixed(';'), oracle: fixed('') },
        },
        {
          label: 'Đếm số row sau khi nối ba table',
          sql: { mysql: count(';'), oracle: count('') },
        },
        {
          label: 'Đếm số khách trong customers',
          sql: {
            mysql: 'SELECT COUNT(*) AS customers_total\nFROM customers;',
            oracle: 'SELECT COUNT(*) AS customers_total\nFROM customers',
          },
        },
      ],
      say: 'Hạn mức nước Đức hiện 5,2 tỷ, trong khi số đúng là 650 triệu. Doanh thu thì cả hai cách đều ra 59.745.000, vì doanh thu nằm ở order_items, nơi mỗi row chỉ có một lần.',
    },
    {
      type: 'oracle',
      body: [
        'MySQL bắt buộc subquery trong FROM có alias. Thiếu alias thì MySQL báo lỗi 1248.',
        'Oracle không bắt buộc alias. Nhưng khi bạn viết alias, Oracle cấm chữ AS và báo ORA-00933 nếu có AS.',
        'MySQL gọi subquery trong FROM là derived table. Oracle gọi nó là inline view.',
        'Viết `) t` không có AS chạy ở cả hai dialect. Bạn nên viết như vậy để một query dùng được cả hai nơi.',
      ],
      mysql:
        'SELECT t.customer_id, t.order_count\nFROM (\n  SELECT customer_id, COUNT(*) AS order_count\n  FROM orders\n  GROUP BY customer_id\n) AS t\nWHERE t.order_count >= 4;',
      oracle:
        'SELECT t.customer_id, t.order_count\nFROM (\n  SELECT customer_id, COUNT(*) AS order_count\n  FROM orders\n  GROUP BY customer_id\n) t\nWHERE t.order_count >= 4',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn đặt subquery vào FROM và quên alias. Chuyện gì xảy ra trên MySQL?',
          options: [
            { text: 'MySQL báo lỗi 1248', correct: true, feedback: 'Đúng. MySQL đòi mỗi subquery trong FROM có alias. Oracle thì không đòi.' },
            { text: 'MySQL tự đặt alias và chạy bình thường', feedback: 'MySQL không tự đặt alias. Bạn phải viết, ví dụ `) t`.' },
            { text: 'MySQL bỏ qua subquery', feedback: 'MySQL không bỏ qua subquery. MySQL dừng lại và báo lỗi.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn nối customers, orders, order_items rồi `SUM(c.credit_limit)` theo nước. Số ra thế nào?',
          options: [
            { text: 'Lớn hơn số thật, vì mỗi khách lặp nhiều lần', correct: true, feedback: 'Đúng. Hạn mức của một khách bị cộng bằng số món mà khách đó đã mua.' },
            { text: 'Đúng với số thật', feedback: 'Sau khi nối, 30 khách thành 190 row. Hạn mức bị cộng lặp nên số ra lớn hơn thật.' },
            { text: 'Nhỏ hơn số thật', feedback: 'Nối làm tăng số row của bên "một", nên tổng chỉ có thể lớn hơn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Muốn mỗi khách chỉ còn một row trước khi nối, bạn làm gì?',
          options: [
            { text: 'Gom bằng GROUP BY trong subquery ở FROM, rồi nối subquery với customers', correct: true, feedback: 'Đúng. Gom trước, nối sau.' },
            { text: 'Thêm DISTINCT vào `SUM(c.credit_limit)`', feedback: 'DISTINCT bỏ giá trị trùng. Hai khách cùng hạn mức sẽ chỉ được cộng một lần, nên tổng vẫn sai.' },
            { text: 'Đổi INNER JOIN thành LEFT JOIN', feedback: 'LEFT JOIN giữ thêm row không ghép được. Cách đó không làm giảm số row bị lặp.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo doanh thu không khớp sổ kế toán',
      paragraphs: [
        'Một nhóm phân tích làm báo cáo cho mỗi nhân viên kinh doanh: số đơn, tổng tiền và hạn mức khách phụ trách.',
        'Bản đầu nối thẳng ba table rồi cộng. Số tổng cao gấp mấy lần số của kế toán, và không ai biết vì sao.',
        'Họ so số row trước và sau khi nối, rồi thấy row nhân lên. Sau khi gom tiền theo khách trong subquery ở FROM, số khớp với sổ kế toán.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Subquery trong FROM tạo ra một table tạm. Query ngoài đọc hoặc nối nó như table thường.',
        'Gom trước, nối sau: GROUP BY trong subquery cho mỗi khách một row. Cách này tránh bẫy nhân bội row.',
        'Kiểm bẫy bằng cách so `COUNT(*)` trước và sau khi nối.',
        'MySQL bắt buộc alias cho subquery trong FROM (lỗi 1248). Oracle không bắt buộc, và cấm chữ AS trước alias.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, Derived Tables', url: 'https://dev.mysql.com/doc/refman/8.0/en/derived-tables.html' },
        { name: 'Oracle Database 19c SQL Language Reference, SELECT (inline view)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html' },
      ],
    },
  ],
};
