import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b8',
  chapter: 7,
  order: 8,
  title: 'Bẫy nhân bội row: nối xong SUM ra số quá lớn',
  lead: 'Nối một table với hai table khác làm tổng tiền phình to, mà query không báo lỗi.',
  minutes: 18,
  goals: [
    'Nhận ra khi nào row bị nhân lên sau khi nối',
    'Phát hiện bằng cách đếm row trước và sau khi nối',
    'Dùng COUNT(DISTINCT) để so với số row thật',
    'Sửa bằng hai query riêng, hoặc gom trước rồi mới nối',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tổng lương lớn gấp bốn lần',
      paragraphs: [
        'Anh Long, chủ chuỗi Trà Mây, nhờ Bi làm một báo cáo nhỏ. Mỗi tiệm cần hai số: tổng lương nhân viên và số đơn đã bán.',
        'Bi nối table stores với table staff và table orders. Bi cộng lương bằng SUM. Query chạy xong, không báo lỗi nào.',
        'Tiệm Hoàn Kiếm ra tổng lương 82.000.000. Anh Long nhìn số đó và hỏi: "Tiệm này có hai người. Một người 12.500.000, một người 8.000.000. Sao ra 82 triệu?"',
        'Bi cộng lại bằng tay. Hai người cộng lại đúng 20.500.000.',
        'Query không sai cú pháp. Query sai ý. Bạn sẽ thấy số liệu nở ra từ đâu.',
      ],
    },
    {
      type: 'text',
      title: 'Một tiệm, nhiều nhân viên, nhiều đơn',
      paragraphs: [
        'Một tiệm có nhiều nhân viên. Một tiệm cũng có nhiều đơn. Tiệm là phía "một" của cả hai quan hệ.',
        'Nối tiệm với nhân viên ra đúng 10 row, vì mỗi nhân viên thuộc một tiệm.',
        'Nối thêm orders thì mỗi nhân viên ghép với từng đơn của cùng tiệm. Hoàn Kiếm có 2 nhân viên và 4 đơn, nên ra 2 × 4 = 8 row.',
        '**[[row-fan-out]]** là hiện tượng một row bị chép thành nhiều row sau khi nối. Bài này gọi tắt là nhân bội row.',
        'Row không mất đi. Row chỉ bị chép thêm, và các column của nó lặp lại ở mỗi bản.',
        'SUM cộng mọi bản, nên lương của một người bị cộng nhiều lần. COUNT(*) cũng đếm mọi bản.',
        'MIN và MAX không đổi, vì giá trị lớn nhất hay nhỏ nhất vẫn là giá trị đó.',
        'AVG trong ví dụ này tình cờ ra đúng, vì mỗi nhân viên bị chép số lần bằng nhau. Đừng dựa vào chuyện này.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tổng lương phình to',
      intro: 'Bấm Chạy. Query nối stores, staff và orders, rồi cộng lương mỗi tiệm. Xem tổng lương có đúng không.',
      database: 'teashop',
      tables: ['stores', 'staff', 'orders'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT st.store_id, st.name,\n       COUNT(*) AS so_row,\n       SUM(sf.salary) AS tong_luong\nFROM stores st\nINNER JOIN staff sf\n  ON sf.store_id = st.store_id\nINNER JOIN orders o\n  ON o.store_id = st.store_id\nGROUP BY st.store_id, st.name\nORDER BY st.store_id',
      ),
      tries: [
        {
          label: 'Thêm hai phép đếm COUNT(DISTINCT) cạnh COUNT(*)',
          sql: both(
            'SELECT st.store_id, st.name,\n       COUNT(*) AS so_row,\n       COUNT(DISTINCT sf.staff_id) AS so_nhan_vien,\n       COUNT(DISTINCT o.order_id) AS so_don\nFROM stores st\nINNER JOIN staff sf\n  ON sf.store_id = st.store_id\nINNER JOIN orders o\n  ON o.store_id = st.store_id\nGROUP BY st.store_id, st.name\nORDER BY st.store_id',
          ),
        },
        {
          label: 'Bỏ GROUP BY để xem tổng cả chuỗi',
          sql: both(
            'SELECT COUNT(*) AS so_row,\n       SUM(sf.salary) AS tong_luong\nFROM stores st\nINNER JOIN staff sf\n  ON sf.store_id = st.store_id\nINNER JOIN orders o\n  ON o.store_id = st.store_id',
          ),
        },
        {
          label: 'Thử chữa bằng SUM(DISTINCT sf.salary)',
          sql: both(
            'SELECT SUM(DISTINCT sf.salary) AS tong_luong\nFROM stores st\nINNER JOIN staff sf\n  ON sf.store_id = st.store_id\nINNER JOIN orders o\n  ON o.store_id = st.store_id',
          ),
        },
        {
          label: 'Bỏ JOIN orders, chỉ nối stores với staff',
          sql: both(
            'SELECT st.store_id, st.name,\n       COUNT(*) AS so_row,\n       SUM(sf.salary) AS tong_luong\nFROM stores st\nINNER JOIN staff sf\n  ON sf.store_id = st.store_id\nGROUP BY st.store_id, st.name\nORDER BY st.store_id',
          ),
        },
      ],
      say: 'Hoàn Kiếm có 2 nhân viên và 4 đơn, nên row nhân thành 8. Tổng lương đúng là 20.500.000, nhưng query ra 82.000.000. Mục cuối bỏ orders và cho số đúng.',
    },
    {
      type: 'text',
      title: 'Cách phát hiện',
      paragraphs: [
        'Cách thứ nhất: đếm row trước khi nối, rồi đếm sau khi nối. Table staff có 10 row, table orders có 20 row. Nối cả ba table ra 52 row, lớn hơn cả hai.',
        'Quy tắc kiểm nhanh: nối xong mà số row lớn hơn mọi table đã nối, hãy dừng lại và xem lại.',
        'Cách thứ hai: đặt COUNT(*) cạnh COUNT(DISTINCT) của primary key từng table. Ở query nối cả chuỗi, COUNT(*) là 52. COUNT(DISTINCT sf.staff_id) là 10, và COUNT(DISTINCT o.order_id) là 20.',
        'COUNT(*) lớn hơn cả hai số kia nghĩa là row đã bị nhân.',
        'Cách thứ ba: so tổng với tổng chạy trên table gốc. `SELECT SUM(salary) FROM staff` ra 97.500.000. Query nối ra 503.000.000.',
        'Đừng chữa bằng `SUM(DISTINCT salary)`. DISTINCT bỏ các giá trị trùng, nên nhiều người cùng mức lương bị gộp thành một.',
        'Tổng cả chuỗi khi đó ra 61.500.000, trong khi số đúng là 97.500.000.',
      ],
    },
    {
      type: 'playground',
      title: 'Sửa bằng hai query riêng',
      intro: 'Bấm Chạy. Query A tính tổng lương mỗi tiệm, chỉ từ table staff. Rồi bấm các mục bên dưới để xem query đếm đơn.',
      database: 'teashop',
      tables: ['staff', 'orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: both('SELECT store_id, SUM(salary) AS tong_luong\nFROM staff\nGROUP BY store_id\nORDER BY store_id'),
      tries: [
        {
          label: 'Query B: số đơn mỗi tiệm, chỉ từ table orders',
          sql: both('SELECT store_id, COUNT(*) AS so_don\nFROM orders\nGROUP BY store_id\nORDER BY store_id'),
        },
        {
          label: 'Nối orders với order_items và đếm bằng COUNT(*)',
          sql: both(
            'SELECT o.store_id, COUNT(*) AS so_mon\nFROM orders o\nINNER JOIN order_items i\n  ON i.order_id = o.order_id\nGROUP BY o.store_id\nORDER BY o.store_id',
          ),
        },
        {
          label: 'Đổi COUNT(*) thành COUNT(DISTINCT o.order_id)',
          sql: both(
            'SELECT o.store_id, COUNT(DISTINCT o.order_id) AS so_don\nFROM orders o\nINNER JOIN order_items i\n  ON i.order_id = o.order_id\nGROUP BY o.store_id\nORDER BY o.store_id',
          ),
        },
        {
          label: 'Gom trước rồi mới nối: hai kết quả đã gom, mỗi tiệm một row',
          sql: {
            mysql:
              'SELECT st.store_id, st.name, l.tong_luong, d.so_don\nFROM stores AS st\nINNER JOIN (\n  SELECT store_id, SUM(salary) AS tong_luong\n  FROM staff\n  GROUP BY store_id\n) AS l ON l.store_id = st.store_id\nINNER JOIN (\n  SELECT store_id, COUNT(*) AS so_don\n  FROM orders\n  GROUP BY store_id\n) AS d ON d.store_id = st.store_id\nORDER BY st.store_id;',
            oracle:
              'SELECT st.store_id, st.name, l.tong_luong, d.so_don\nFROM stores st\nINNER JOIN (\n  SELECT store_id, SUM(salary) AS tong_luong\n  FROM staff\n  GROUP BY store_id\n) l ON l.store_id = st.store_id\nINNER JOIN (\n  SELECT store_id, COUNT(*) AS so_don\n  FROM orders\n  GROUP BY store_id\n) d ON d.store_id = st.store_id\nORDER BY st.store_id',
          },
        },
      ],
      say: 'Query A và query B đều đúng, vì mỗi query chỉ nối một phía "nhiều". Mục nối order_items đếm món chứ không đếm đơn: tiệm 1 có 12 món trên 6 đơn. Mục cuối gom từng phía trước, rồi nối: mỗi tiệm một row, hai số đều đúng.',
    },
    {
      type: 'text',
      title: 'Gom trước rồi mới nối',
      paragraphs: [
        'Cách sửa thứ hai là gom trước rồi mới nối. Bạn gom mỗi table "nhiều" về một row cho mỗi tiệm bằng GROUP BY.',
        'Sau đó bạn nối các kết quả đã gom với table stores. Nối một row với một row thì không có gì để nhân.',
        'Cách này dùng subquery nằm trong FROM. Mục thử cuối của khối trên chạy được nó. Chương 8 dạy subquery kỹ hơn.',
        'Trước đó, hai query riêng là cách đơn giản và ít sai nhất. Bạn đặt hai kết quả cạnh nhau là xong.',
        'Nhớ quy tắc: một table "một" nối với hai table "nhiều" thì hỏi ngay xem row có bị nhân không.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Logic của bẫy giống hệt. Oracle cũng nhân row, và cũng ra 52 row, 503.000.000.',
        'Chỗ khác là alias. Oracle không nhận AS trước alias của table. Với subquery trong FROM cũng vậy: alias viết liền sau dấu ngoặc đóng.',
        'Tên column trong kết quả của Oracle hiện chữ hoa: `TONG_LUONG`, `SO_ROW`.',
      ],
      mysql:
        'FROM stores AS st\nINNER JOIN staff AS sf ON sf.store_id = st.store_id\nINNER JOIN orders AS o ON o.store_id = st.store_id',
      oracle:
        'FROM stores st\nINNER JOIN staff sf ON sf.store_id = st.store_id\nINNER JOIN orders o ON o.store_id = st.store_id',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Tiệm 1 (Cầu Giấy) có 3 nhân viên và 6 đơn. Bạn nối stores với staff và orders, chỉ lấy tiệm 1. Có bao nhiêu row?',
          options: [
            { text: '9', feedback: '9 là 3 cộng 6. Nối là ghép từng cặp, nên phải nhân, không cộng.' },
            { text: '18', correct: true, feedback: 'Đúng. Mỗi nhân viên ghép với cả 6 đơn, nên ra 3 × 6 = 18.' },
            { text: '6', feedback: '6 là số đơn. Nhưng mỗi đơn ghép với cả 3 nhân viên, nên row nhiều hơn 6.' },
            { text: '3', feedback: '3 là số nhân viên. Nối thêm orders làm mỗi nhân viên bị chép thêm.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn nối orders với order_items, rồi COUNT(*) ra 48. COUNT(DISTINCT o.order_id) ra 20. Số đơn thật là bao nhiêu?',
          options: [
            { text: '48', feedback: '48 là số món đã gọi. Mỗi đơn có nhiều món nên đơn bị đếm nhiều lần.' },
            { text: '20', correct: true, feedback: 'Đúng. COUNT(DISTINCT) đếm mỗi đơn một lần, và table orders có 20 row.' },
            { text: '68', feedback: 'Đừng cộng hai số này. 48 đếm cả các bản bị chép, 20 đếm đơn khác nhau.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chữa query lương bằng `SUM(DISTINCT sf.salary)` cho cả chuỗi và ra 61.500.000. Tổng đúng là 97.500.000. Vì sao số thấp hơn?',
          options: [
            { text: 'Table staff thiếu row', feedback: 'Table staff có đủ 10 row. Số thấp hơn vì DISTINCT bỏ giá trị trùng.' },
            {
              text: 'Nhiều người cùng mức lương, và DISTINCT gộp họ thành một',
              correct: true,
              feedback: 'Đúng. Ba người cùng lương 8.000.000 chỉ được tính một lần, và các cặp cùng lương khác cũng vậy.',
            },
            { text: 'Do nối sai điều kiện', feedback: 'Điều kiện nối vẫn đúng. Lỗi nằm ở DISTINCT bỏ các giá trị trùng.' },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c7-e12'] },
    {
      type: 'realworld',
      title: 'Doanh thu gấp ba lần số của kế toán',
      paragraphs: [
        'Một bạn phân tích dữ liệu nối table khách với table đơn và table phiếu hỗ trợ. Bạn ấy cộng doanh thu mỗi khách.',
        'Doanh thu cả công ty ra gấp ba lần số của phòng kế toán. Khách nào có nhiều phiếu hỗ trợ thì doanh thu bị cộng nhiều lần.',
        'Bạn ấy đếm row trước và sau mỗi lần nối, rồi thấy chỗ row phình ra. Bạn ấy tách doanh thu và phiếu thành hai query, và số khớp với kế toán.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Nối một table "một" với hai table "nhiều" thì row ghép chéo nhau và bị nhân lên.',
        'SUM và COUNT(*) cộng cả các bản bị chép, nên ra số quá lớn.',
        'Phát hiện: đếm row trước và sau khi nối, so với COUNT(DISTINCT) và với tổng trên table gốc.',
        'Sửa: tách thành hai query, hoặc gom trước rồi mới nối. SUM(DISTINCT) không sửa được.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 7: OUTER JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_outer_joins' },
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
      ],
    },
  ],
};
