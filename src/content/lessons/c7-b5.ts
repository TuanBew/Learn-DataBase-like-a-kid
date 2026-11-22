import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b5',
  chapter: 7,
  order: 5,
  title: 'Nối ba, bốn, năm table',
  lead: 'Bạn nối từ ba tới năm table, thêm từng JOIN một, rồi gom nhóm trên kết quả đã nối.',
  minutes: 22,
  goals: [
    'Nối ba table bằng hai JOIN, rồi nối tiếp tới bốn và năm table',
    'Đọc hai điều kiện ON, mỗi cái nối một cặp table',
    'Thêm từng JOIN một và đếm row sau mỗi lần chạy',
    'Nối xong mới gom nhóm, rồi tính số ly bán được của từng món',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Đơn 1004 gồm những món nào?',
      paragraphs: [
        'Một khách hỏi lại đơn 1004: "Hôm đó mình uống gì nhỉ?"',
        'Table orders chỉ ghi ngày giờ và tiệm bán. Tên món không nằm ở đó.',
        'Các món của đơn nằm ở order_items, mỗi món một row, kèm mã món. Tên món nằm ở products.',
        'Bi đi hai chặng: từ đơn sang các món của đơn, rồi từ mã món sang tên món.',
      ],
    },
    {
      type: 'text',
      title: 'Hai JOIN nối ba table',
      paragraphs: [
        'Muốn nối ba table, viết hai JOIN liền nhau.',
        'JOIN đầu nối orders với order_items qua `order_id`. Kết quả là một table tạm.',
        'JOIN thứ hai nối table tạm đó với products qua `product_id`.',
        'Mỗi JOIN có một `ON` riêng. Đếm table: có ba table thì có hai ON.',
        'Query Theater cho thấy từng chặng nối, từ cặp đầu tới cặp sau.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: các món của đơn 1004',
      intro: 'Bấm Chạy. Query nối ba table rồi giữ đơn 1004.',
      database: 'teashop',
      tables: ['orders', 'order_items', 'products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT o.order_id, p.name, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1004;',
        oracle:
          'SELECT o.order_id, p.name, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1004',
      },
      tries: [
        {
          label: 'Đổi 1004 thành 1011',
          sql: {
            mysql:
              'SELECT o.order_id, p.name, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1011;',
            oracle:
              'SELECT o.order_id, p.name, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1011',
          },
        },
        {
          label: 'Đổi p.name thành p.category',
          sql: {
            mysql:
              'SELECT o.order_id, p.category, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1004;',
            oracle:
              'SELECT o.order_id, p.category, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1004',
          },
        },
        {
          label: 'Thêm ORDER BY i.unit_price DESC',
          sql: {
            mysql:
              'SELECT o.order_id, p.name, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1004\nORDER BY i.unit_price DESC;',
            oracle:
              'SELECT o.order_id, p.name, i.quantity, i.unit_price\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.order_id = 1004\nORDER BY i.unit_price DESC',
          },
        },
      ],
      say: 'Đơn 1004 có bốn món. Bi dùng order_items làm cầu nối giữa đơn và món.',
    },
    {
      type: 'text',
      title: 'Nối xong mới gom nhóm',
      paragraphs: [
        'Bài "Thứ tự query chạy thật" đã nói: FROM chạy trước GROUP BY.',
        'JOIN nằm trong FROM. Vì vậy database nối table trước, rồi mới gom nhóm trên kết quả đã nối.',
        'Muốn đếm ly của từng món, bạn cần tên món và số lượng ở cùng một row. Nối ba table cho bạn điều đó.',
        'Rồi `GROUP BY p.name` gom các row cùng tên món, và `SUM(i.quantity)` cộng số ly trong mỗi nhóm.',
        'Query dưới đây chỉ tính đơn có status là done, và lấy năm món bán nhiều nhất.',
      ],
    },
    {
      type: 'playground',
      title: 'Năm món bán nhiều nhất',
      intro: 'Bấm Chạy. Xem Theater nối ba table trước, rồi mới gom nhóm.',
      database: 'teashop',
      tables: ['orders', 'order_items', 'products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT p.name, SUM(i.quantity) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'done'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nLIMIT 5;",
        oracle:
          "SELECT p.name, SUM(i.quantity) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'done'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nFETCH FIRST 5 ROWS ONLY",
      },
      tries: [
        {
          label: 'Đổi 5 thành 3',
          sql: {
            mysql:
              "SELECT p.name, SUM(i.quantity) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'done'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nLIMIT 3;",
            oracle:
              "SELECT p.name, SUM(i.quantity) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'done'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nFETCH FIRST 3 ROWS ONLY",
          },
        },
        {
          label: "Đổi o.status = 'done' thành o.status = 'cancelled'",
          sql: {
            mysql:
              "SELECT p.name, SUM(i.quantity) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'cancelled'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nLIMIT 5;",
            oracle:
              "SELECT p.name, SUM(i.quantity) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'cancelled'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nFETCH FIRST 5 ROWS ONLY",
          },
        },
        {
          label: 'Đổi SUM(i.quantity) thành COUNT(*)',
          sql: {
            mysql:
              "SELECT p.name, COUNT(*) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'done'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nLIMIT 5;",
            oracle:
              "SELECT p.name, COUNT(*) AS cups\nFROM orders o\nJOIN order_items i\n  ON i.order_id = o.order_id\nJOIN products p\n  ON p.product_id = i.product_id\nWHERE o.status = 'done'\nGROUP BY p.name\nORDER BY cups DESC, p.name\nFETCH FIRST 5 ROWS ONLY",
          },
        },
      ],
      say: 'Mục cuối đếm số lần món xuất hiện trong đơn, không đếm số ly. Hai số khác nhau khi một đơn gọi nhiều ly cùng món.',
    },
    {
      type: 'text',
      title: 'Thêm từng JOIN một, chạy lại sau mỗi lần',
      paragraphs: [
        'Query viết một lần cho năm table hay sai ở đâu đó. Bạn tránh điều này bằng cách thêm từng JOIN một.',
        'Bắt đầu với một table. Thêm JOIN đầu tiên, chạy, và nhìn kết quả. Rồi thêm JOIN kế tiếp và chạy lại.',
        'Sau mỗi lần chạy, đếm row. Row không đổi nghĩa là không row nào rơi ra hay bị nhân lên.',
        'Thử với database công ty. Table order_items có 190 row. Nối thêm orders, customers, countries rồi regions, số row vẫn là 190 sau mỗi lần.',
        'Số row giảm nghĩa là một JOIN làm rơi row. Số row tăng nghĩa là một JOIN nhân row lên. Cả hai trường hợp đều cần xem lại.',
        'Đường nối này là đường bạn tìm ở đầu chương: order_items, orders, customers, countries, regions. Năm table cần bốn JOIN, mỗi JOIN một ON.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nối bốn rồi năm table',
      intro: 'Bấm Chạy. Query nối bốn table để xem một đơn nằm ở nước nào. Rồi thêm JOIN thứ năm bằng các mục bên dưới.',
      database: 'company',
      tables: ['order_items', 'orders', 'customers', 'countries', 'regions'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT oi.order_id, oi.line_no, c.customer_name, co.country_name\nFROM order_items oi\nJOIN orders o\n  ON oi.order_id = o.order_id\nJOIN customers c\n  ON o.customer_id = c.customer_id\nJOIN countries co\n  ON c.country_id = co.country_id\nWHERE oi.order_id = 5001\nORDER BY oi.line_no',
      ),
      tries: [
        {
          label: 'Thêm JOIN thứ năm: regions, kèm region_name',
          sql: both(
            'SELECT oi.order_id, oi.line_no, c.customer_name, co.country_name, r.region_name\nFROM order_items oi\nJOIN orders o\n  ON oi.order_id = o.order_id\nJOIN customers c\n  ON o.customer_id = c.customer_id\nJOIN countries co\n  ON c.country_id = co.country_id\nJOIN regions r\n  ON co.region_id = r.region_id\nWHERE oi.order_id = 5001\nORDER BY oi.line_no',
          ),
        },
        {
          label: 'Đếm row sau khi nối bốn table',
          sql: both(
            'SELECT COUNT(*) AS so_row\nFROM order_items oi\nJOIN orders o\n  ON oi.order_id = o.order_id\nJOIN customers c\n  ON o.customer_id = c.customer_id\nJOIN countries co\n  ON c.country_id = co.country_id',
          ),
        },
        {
          label: 'Đếm row sau khi nối năm table',
          sql: both(
            'SELECT COUNT(*) AS so_row\nFROM order_items oi\nJOIN orders o\n  ON oi.order_id = o.order_id\nJOIN customers c\n  ON o.customer_id = c.customer_id\nJOIN countries co\n  ON c.country_id = co.country_id\nJOIN regions r\n  ON co.region_id = r.region_id',
          ),
        },
        {
          label: 'Doanh thu theo khu vực: nối năm table rồi GROUP BY',
          sql: both(
            'SELECT r.region_name, SUM(oi.quantity * oi.unit_price) AS doanh_thu\nFROM order_items oi\nJOIN orders o\n  ON oi.order_id = o.order_id\nJOIN customers c\n  ON o.customer_id = c.customer_id\nJOIN countries co\n  ON c.country_id = co.country_id\nJOIN regions r\n  ON co.region_id = r.region_id\nGROUP BY r.region_id, r.region_name\nORDER BY doanh_thu DESC',
          ),
        },
      ],
      say: 'Cả 190 row của order_items đều qua được năm table. Doanh thu ba khu vực cộng lại là 536.375.000, đúng bằng tổng của order_items.',
    },
    {
      type: 'oracle',
      body: [
        'Hai dialect nối ba table giống nhau. Chỉ có hai chỗ khác ở query trên.',
        'MySQL giữ năm row đầu bằng `LIMIT 5`. Oracle viết `FETCH FIRST 5 ROWS ONLY`.',
        'Alias của table không có AS ở Oracle: `orders o`, không phải `orders AS o`.',
        'Kết quả cũng khác ở row thứ năm. Bốn món cùng bán 5 ly, và MySQL xếp chữ đ như chữ d.',
        'Sau khi nối, mọi column trong SELECT phải nằm trong GROUP BY hoặc trong function gom. Thêm `p.category` vào SELECT mà quên GROUP BY, Oracle báo ORA-00979.',
      ],
      mysql: 'ORDER BY cups DESC, p.name\nLIMIT 5;',
      oracle: 'ORDER BY cups DESC, p.name\nFETCH FIRST 5 ROWS ONLY',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn nối bốn table. Cần mấy chữ ON?',
          options: [
            { text: 'Ba ON, mỗi JOIN một cái', correct: true, feedback: 'Đúng. Bốn table cần ba JOIN, mỗi JOIN một ON.' },
            { text: 'Bốn ON, mỗi table một cái', feedback: 'Table đầu tiên không cần ON. Mỗi JOIN thêm một table, nên có ba JOIN và ba ON.' },
            { text: 'Một ON cho cả query', feedback: 'Mỗi JOIN nói riêng cặp table của nó, nên mỗi JOIN có một ON.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query nối ba table rồi có GROUP BY. Database làm bước nào trước?',
          options: [
            { text: 'Nối table trước, gom nhóm sau', correct: true, feedback: 'Đúng. JOIN nằm trong FROM, và FROM chạy trước GROUP BY.' },
            { text: 'Gom nhóm trước, nối table sau', feedback: 'Thứ tự ngược lại. FROM chạy trước, kể cả phần JOIN trong nó.' },
            { text: 'Hai bước chạy cùng lúc', feedback: 'Hai bước chạy lần lượt. Nối xong mới tới gom nhóm.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn thêm một JOIN vào query và số row sau đó lớn hơn số row trước. Có thể chuyện gì xảy ra?',
          options: [
            {
              text: 'JOIN mới nhân row lên, vì một row ghép với nhiều row',
              correct: true,
              feedback: 'Đúng. Table mới ở phía "nhiều" chép row cũ ra nhiều bản. Hãy dừng lại và xem lại JOIN đó.',
            },
            {
              text: 'JOIN mới làm rơi row',
              feedback: 'Rơi row làm số row giảm, không làm số row tăng.',
            },
            {
              text: 'Database lỗi nhưng không báo',
              feedback: 'Database không lỗi. Số row tăng là kết quả hợp lệ của JOIN một với nhiều.',
            },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c7-e5', 'c7-e6', 'c7-e9'] },
    {
      type: 'realworld',
      title: 'Hóa đơn trong app mua sắm',
      paragraphs: [
        'Một hóa đơn có ngày mua, các món và giá từng món. Thường ba loại thông tin này nằm ở ba table khác nhau.',
        'App nối chúng bằng hai JOIN, giống query ở đầu bài. Còn tổng tiền cuối hóa đơn là kết quả của function gom.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Nối n table cần n − 1 JOIN, mỗi JOIN có một ON. Ba table cần hai JOIN, năm table cần bốn.',
        'Thêm từng JOIN một và đếm row sau mỗi lần chạy. Row đổi bất ngờ nghĩa là một JOIN làm rơi hoặc nhân row.',
        'order_items là table cầu nối giữa orders và products. Database nối table xong mới gom nhóm.',
        'Mọi column trong SELECT phải nằm trong GROUP BY hoặc trong function gom.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 6: Multi-table queries with JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_joins' },
        { name: 'SQLBolt, bài 7: OUTER JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_outer_joins' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
      ],
    },
  ],
};
