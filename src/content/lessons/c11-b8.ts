import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

/** Query dài trên database công ty, nối bốn table. Chạy được ở cả hai dialect. */
const LONG = `SELECT
  c.customer_name,
  p.category,
  COUNT(DISTINCT o.order_id)          AS so_don,
  SUM(oi.quantity)                    AS so_luong,
  SUM(oi.quantity * oi.unit_price)    AS doanh_thu
FROM customers c
JOIN orders o
  ON o.customer_id = c.customer_id
JOIN order_items oi
  ON oi.order_id = o.order_id
JOIN products p
  ON p.product_id = oi.product_id
WHERE o.status = 'delivered'
  AND o.order_date >= DATE '2025-01-01'
  AND o.order_date <  DATE '2026-01-01'
  AND p.category = 'Thiết bị điện tử'
GROUP BY
  c.customer_name,
  p.category
HAVING SUM(oi.quantity * oi.unit_price) >= 15000000
ORDER BY doanh_thu DESC, c.customer_name`;

export const lesson: Lesson = {
  id: 'c11-b8',
  chapter: 11,
  order: 8,
  title: 'Đọc một query dài của người khác',
  lead: 'Bạn đọc một query dài theo năm bước, và nói được nó trả lời câu hỏi nào.',
  minutes: 16,
  goals: [
    'Đọc query theo thứ tự năm bước, không đọc từ trên xuống',
    'Tách điều kiện nối với điều kiện lọc',
    'Đọc GROUP BY và HAVING để biết mỗi row kết quả là gì',
    'Đọc kiểu Oracle cũ: dấu phẩy, (+), NVL, DECODE, TO_CHAR',
    'Viết một câu tóm tắt cho query',
  ],
  blocks: [
    {
      type: 'story',
      title: 'File query dài hai chục dòng code',
      paragraphs: [
        'Chị Mai gửi Bi một query. "Báo cáo này chạy mỗi tháng. Người viết đã nghỉ. Em xem nó làm gì giúp chị."',
        'Query dài hai mươi mấy dòng code, nối bốn table. Bi đọc từ chữ SELECT và thấy rối ngay.',
        'Bi đổi cách. Bi đọc theo thứ tự database chạy, từng bước một.',
        'Sau năm bước, Bi viết được một câu: query này trả lời câu hỏi gì.',
      ],
    },
    {
      type: 'text',
      title: 'Đừng đọc từ trên xuống',
      paragraphs: [
        'SELECT nằm ở đầu, nhưng database chạy nó gần cuối. Đọc từ trên xuống, bạn thấy kết quả trước khi biết dữ liệu từ đâu ra.',
        'Hãy đọc theo thứ tự database làm. Dùng năm bước dưới đây cho mọi query dài.',
        'Bước một: tìm FROM và các **[[join]]**. Bạn biết dữ liệu lấy từ table nào.',
        'Bước hai: đọc từng ON. Bạn biết các table nối với nhau bằng column nào.',
        'Bước ba: đọc WHERE. Bạn biết database giữ row nào.',
        'Bước bốn: đọc **[[group-by]]** và **[[having]]**. Bạn biết mỗi row của kết quả đại diện cho gì.',
        'Bước năm: đọc SELECT và ORDER BY. Bạn biết kết quả hiện column nào, theo thứ tự nào.',
      ],
    },
    {
      type: 'code',
      title: 'Query dài trên database công ty',
      intro: 'Đọc query này theo năm bước. Mỗi chú thích dưới đây ứng với một bước.',
      code: LONG,
      notes: [
        { find: 'FROM customers c', text: 'Bước một. Dữ liệu đến từ bốn table: customers, orders, order_items và products. Mỗi table có một alias ngắn.' },
        { find: 'ON o.customer_id = c.customer_id', text: 'Bước hai. Đơn nối với khách bằng customer_id. Đây là cặp foreign key và primary key.' },
        { find: 'ON oi.order_id = o.order_id', text: 'Bước hai. Mỗi món trong đơn nối với đơn bằng order_id.' },
        { find: 'ON p.product_id = oi.product_id', text: 'Bước hai. Mỗi món nối với sản phẩm bằng product_id. Qua đó bạn biết nhóm sản phẩm.' },
        { find: "WHERE o.status = 'delivered'", text: 'Bước ba. Chỉ giữ đơn đã giao.' },
        { find: "AND o.order_date >= DATE '2025-01-01'", text: 'Bước ba. Hai điều kiện ngày này cùng giữ các đơn đặt trong năm 2025.' },
        { find: "AND p.category = 'Thiết bị điện tử'", text: 'Bước ba. Chỉ giữ món thuộc nhóm thiết bị điện tử.' },
        { find: 'GROUP BY\n  c.customer_name', text: 'Bước bốn. Gom các row thành từng nhóm theo khách. Mỗi row kết quả là một khách.' },
        { find: 'HAVING SUM(oi.quantity * oi.unit_price) >= 15000000', text: 'Bước bốn. Giữ khách có doanh thu từ 15 triệu đồng trở lên. HAVING lọc nhóm, không lọc row.' },
        { find: 'SUM(oi.quantity * oi.unit_price)    AS doanh_thu', text: 'Bước năm. Doanh thu của khách là tổng của số lượng nhân đơn giá.' },
        { find: 'ORDER BY doanh_thu DESC', text: 'Bước năm. Khách doanh thu cao nhất hiện đầu tiên. Nếu hai khách bằng nhau, sắp theo tên.' },
      ],
    },
    {
      type: 'text',
      title: 'Viết một câu tóm tắt',
      paragraphs: [
        'Sau năm bước, hãy viết một câu nói query trả lời câu hỏi nào.',
        'Query trên trả lời: "Khách nào đã mua thiết bị điện tử với doanh thu từ 15 triệu đồng trở lên trong năm 2025, tính các đơn đã giao?"',
        'Nếu bạn không viết được câu đó, bạn chưa hiểu query. Hãy đọc lại bước còn mơ hồ.',
        'Muốn kiểm, hãy chạy từng khúc. Chạy riêng FROM với các JOIN và đếm row. Rồi thêm WHERE và đếm lại. Rồi thêm GROUP BY.',
        'Mỗi bước thêm vào, số row đổi theo cách bạn đoán được. Chỗ nào số row lạ là chỗ cần xem kỹ.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: chạy query dài và kiểm từng khúc',
      intro: 'Bấm Chạy. Rồi bấm từng mục để chạy một khúc riêng và xem số row đổi.',
      database: 'company',
      tables: ['customers', 'orders', 'order_items', 'products'],
      dialects: ['mysql', 'oracle'],
      sql: both(LONG),
      tries: [
        {
          label: 'Bỏ HAVING để xem mọi nhóm',
          sql: both(LONG.replace('HAVING SUM(oi.quantity * oi.unit_price) >= 15000000\n', '')),
        },
        {
          label: 'Chỉ FROM và JOIN: đếm row sau khi nối',
          sql: both(
            'SELECT COUNT(*) AS so_row_sau_khi_noi\nFROM customers c\nJOIN orders o\n  ON o.customer_id = c.customer_id\nJOIN order_items oi\n  ON oi.order_id = o.order_id\nJOIN products p\n  ON p.product_id = oi.product_id',
          ),
        },
        {
          label: 'Thêm WHERE: đếm row sau khi lọc',
          sql: both(
            "SELECT COUNT(*) AS so_row_sau_where\nFROM customers c\nJOIN orders o\n  ON o.customer_id = c.customer_id\nJOIN order_items oi\n  ON oi.order_id = o.order_id\nJOIN products p\n  ON p.product_id = oi.product_id\nWHERE o.status = 'delivered'\n  AND o.order_date >= DATE '2025-01-01'\n  AND o.order_date <  DATE '2026-01-01'\n  AND p.category = 'Thiết bị điện tử'",
          ),
        },
        {
          label: 'Đổi nhóm sang Nội thất và hạ mức xuống 5 triệu',
          sql: both(
            LONG.replace("'Thiết bị điện tử'", "'Nội thất'").replace('>= 15000000', '>= 5000000'),
          ),
        },
      ],
      say: 'Nối xong có 190 row. WHERE giữ 54 row. GROUP BY gom 54 row thành 25 khách. HAVING giữ 5 khách.',
    },
    {
      type: 'text',
      title: 'Query kiểu Oracle cũ',
      paragraphs: [
        'Ở công ty, bạn gặp cả query viết kiểu cũ. Năm bước vẫn dùng được, chỉ cần biết vài cách viết khác.',
        'FROM có nhiều table ngăn bằng dấu phẩy. Bước hai chuyển sang WHERE, vì điều kiện nối nằm ở đó.',
        'Điều kiện có hai alias, như `d.department_id = e.department_id`, là điều kiện nối. Điều kiện có một alias là điều kiện lọc.',
        'Dấu `(+)` cạnh một column nghĩa là table đó có thể thiếu row. Bên kia được giữ đủ, giống LEFT JOIN.',
        '**[[nvl]]**`(x, 0)` thay NULL bằng 0. MySQL gọi IFNULL.',
        '**[[decode]]**`(x, a, ra, b, rb, mặc định)` là một CASE viết gọn: x bằng a thì ra `ra`, bằng b thì ra `rb`, không bằng gì thì ra giá trị mặc định.',
        '`TO_CHAR(ngày, \'DD/MM/YYYY\')` đổi ngày thành chữ theo khuôn.',
      ],
    },
    {
      type: 'code',
      title: 'Query kiểu Oracle cũ',
      intro: 'Query này liệt kê nhân viên theo phòng, kèm phòng chưa có ai. Đọc nó theo năm bước.',
      code: "SELECT d.department_name,\n       j.job_title,\n       e.last_name,\n       DECODE(e.job_id, 'PU_CLERK', 'Mua sắm', 'MK_REP', 'Marketing', 'Khác') AS nhom,\n       NVL(e.commission_pct, 0) AS hoa_hong,\n       TO_CHAR(e.hire_date, 'DD/MM/YYYY') AS vao_lam\nFROM departments d, employees e, jobs j\nWHERE d.department_id = e.department_id(+)\n  AND e.job_id = j.job_id(+)\n  AND d.department_id >= 60\nORDER BY d.department_id, e.last_name",
      notes: [
        { find: 'FROM departments d, employees e, jobs j', text: 'Bước một. Ba table ngăn bằng dấu phẩy: departments, employees và jobs.' },
        { find: 'd.department_id = e.department_id(+)', text: 'Bước hai. Nối phòng với nhân viên. Dấu (+) ở bên e, nên mọi phòng được giữ, kể cả phòng chưa có nhân viên.' },
        { find: 'e.job_id = j.job_id(+)', text: 'Bước hai. Nối nhân viên với chức danh. Dấu (+) ở bên j, nên nhân viên thiếu chức danh vẫn được giữ.' },
        { find: 'd.department_id >= 60', text: 'Bước ba. Điều kiện chỉ có một alias, nên đây là điều kiện lọc. Giữ phòng từ mã 60 trở lên.' },
        { find: "DECODE(e.job_id, 'PU_CLERK'", text: 'Bước năm. Chức danh PU_CLERK ra "Mua sắm", MK_REP ra "Marketing", còn lại ra "Khác". Phòng chưa có nhân viên có job_id là NULL, nên cũng ra "Khác".' },
        { find: 'NVL(e.commission_pct, 0)', text: 'Bước năm. Hoa hồng NULL hiện 0.' },
        { find: "TO_CHAR(e.hire_date, 'DD/MM/YYYY')", text: 'Bước năm. Ngày vào làm hiện theo kiểu ngày/tháng/năm.' },
      ],
    },
    {
      type: 'oracle',
      body: [
        'Query kiểu Oracle cũ chạy được ở Oracle 19c. Oracle khuyên viết LEFT JOIN thay cho dấu (+) trong query mới.',
        'Bên dưới là query cũ viết lại cho MySQL và cho Oracle hiện đại. Kết quả giống nhau.',
        'MySQL không có DECODE và NVL. Hãy dùng CASE và IFNULL. Ngày thì dùng DATE_FORMAT.',
      ],
      mysql:
        "SELECT d.department_name,\n       j.job_title,\n       e.last_name,\n       CASE e.job_id WHEN 'PU_CLERK' THEN 'Mua sắm' WHEN 'MK_REP' THEN 'Marketing' ELSE 'Khác' END AS nhom,\n       IFNULL(e.commission_pct, 0) AS hoa_hong,\n       DATE_FORMAT(e.hire_date, '%d/%m/%Y') AS vao_lam\nFROM departments d\nLEFT JOIN employees e ON e.department_id = d.department_id\nLEFT JOIN jobs j ON j.job_id = e.job_id\nWHERE d.department_id >= 60\nORDER BY d.department_id, e.last_name;",
      oracle:
        "SELECT d.department_name,\n       j.job_title,\n       e.last_name,\n       CASE e.job_id WHEN 'PU_CLERK' THEN 'Mua sắm' WHEN 'MK_REP' THEN 'Marketing' ELSE 'Khác' END AS nhom,\n       NVL(e.commission_pct, 0) AS hoa_hong,\n       TO_CHAR(e.hire_date, 'DD/MM/YYYY') AS vao_lam\nFROM departments d\nLEFT JOIN employees e ON e.department_id = d.department_id\nLEFT JOIN jobs j ON j.job_id = e.job_id\nWHERE d.department_id >= 60\nORDER BY d.department_id, e.last_name",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query dài trên có GROUP BY c.customer_name và HAVING doanh thu từ 15 triệu. Query này trả lời câu hỏi nào?',
          options: [
            { text: 'Khách nào mua thiết bị điện tử đã giao trong 2025 với doanh thu từ 15 triệu trở lên?', correct: true, feedback: 'Đúng. WHERE chọn đơn đã giao, năm 2025, nhóm thiết bị điện tử. GROUP BY gom theo khách. HAVING giữ khách đủ doanh thu.' },
            { text: 'Mỗi đơn hàng có doanh thu bao nhiêu?', feedback: 'Mỗi row kết quả là một khách, không phải một đơn. GROUP BY gom theo customer_name.' },
            { text: 'Sản phẩm nào bán chạy nhất năm 2025?', feedback: 'Query gom theo khách, không gom theo sản phẩm. Nhóm sản phẩm chỉ dùng để lọc.' },
          ],
        },
        {
          kind: 'choice',
          question: "Trong query cũ, điều kiện nào là điều kiện nối: `d.department_id = e.department_id(+)` hay `d.department_id >= 60`?",
          options: [
            { text: 'd.department_id = e.department_id(+), vì có hai alias', correct: true, feedback: 'Đúng. Điều kiện nối ghép column của hai table. Điều kiện có một alias là điều kiện lọc.' },
            { text: 'd.department_id >= 60, vì có dấu so sánh', feedback: 'Điều kiện này chỉ nhắc tới d. Điều kiện này lọc phòng, không nối table.' },
            { text: 'Cả hai đều là điều kiện nối', feedback: 'Chỉ điều kiện đầu ghép hai table. Điều kiện sau chỉ lọc.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi bước đọc với câu hỏi nó trả lời.',
          pairs: [
            { left: 'Bước 1: FROM và JOIN', right: 'Dữ liệu lấy từ table nào?' },
            { left: 'Bước 2: ON', right: 'Các table nối bằng column nào?' },
            { left: 'Bước 3: WHERE', right: 'Database giữ row nào?' },
            { left: 'Bước 4: GROUP BY và HAVING', right: 'Mỗi row kết quả là gì?' },
            { left: 'Bước 5: SELECT và ORDER BY', right: 'Hiện column nào, thứ tự nào?' },
          ],
          done: 'Đúng hết. Năm bước này dùng được cho mọi query dài.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Bàn giao query khi đồng nghiệp chuyển team',
      paragraphs: [
        'Khi một người rời team, query của họ còn ở lại. Người nhận phải hiểu nó trước khi sửa.',
        'Người làm tốt thường ghi câu tóm tắt ở đầu file, rồi mỗi khúc một dòng chú thích bằng dấu `--`. Query sau đó dễ đọc cho người kế tiếp.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Đọc query dài theo năm bước: FROM và JOIN, ON, WHERE, GROUP BY và HAVING, cuối cùng SELECT và ORDER BY.',
        'Điều kiện có hai alias là điều kiện nối. Điều kiện có một alias là điều kiện lọc.',
        'Sau khi đọc, viết một câu nói query trả lời câu hỏi nào.',
        'Muốn kiểm, chạy từng khúc và đếm row sau mỗi bước.',
        'Query Oracle cũ dùng dấu phẩy, (+), NVL, DECODE và TO_CHAR. Năm bước vẫn đọc được chúng.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c SQL Language Reference, SELECT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, DECODE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/DECODE.html' },
        { name: 'Oracle Database 19c SQL Language Reference, NVL', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NVL.html' },
        { name: 'MySQL 8.0 Reference Manual, JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
      ],
    },
  ],
};
