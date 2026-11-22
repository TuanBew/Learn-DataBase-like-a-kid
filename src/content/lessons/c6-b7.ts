import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b7',
  chapter: 6,
  order: 7,
  title: 'Báo cáo doanh thu',
  lead: 'Bạn dựng ba báo cáo doanh thu cho tháng 3: theo ngày, theo món và theo tiệm.',
  minutes: 20,
  goals: [
    'Tính doanh thu bằng SUM(quantity * unit_price)',
    'Bỏ đơn cancelled bằng WHERE',
    'Gom doanh thu theo ngày, theo món và theo tiệm',
    'Giữ báo cáo ngắn bằng ORDER BY cùng LIMIT hoặc FETCH FIRST',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tháng 3 tiệm thu được bao nhiêu?',
      paragraphs: [
        'Cuối tháng 3, chủ tiệm nhờ Bi làm ba báo cáo.',
        'Báo cáo một: mỗi ngày thu bao nhiêu. Báo cáo hai: món nào mang về nhiều tiền. Báo cáo ba: tiệm nào thu nhiều nhất.',
        'Bài này dùng database teashop-big, gồm 200 đơn của tháng 3 năm 2026.',
        'Bi chỉ cộng các đơn đã bán. Đơn cancelled không thu tiền, nên mình bỏ ra.',
      ],
    },
    {
      type: 'text',
      title: 'Doanh thu nằm ở order_items',
      paragraphs: [
        'Tiền của một đơn nằm ở table order_items. Mỗi row ghi một món trong đơn, kèm quantity và unit_price.',
        'Tiền của một row bằng `quantity * unit_price`. Doanh thu là tổng các row đó: `SUM(quantity * unit_price)`.',
        'Ngày đặt và trạng thái nằm ở table orders. Query cần ghép hai table.',
        '**[[join]]** ghép hai table theo key. Ở đây order_items nối với orders bằng order_id. Chương 7 sẽ dạy JOIN kỹ. Bây giờ bạn chỉ cần dùng khung có sẵn.',
        'Khung ghép: `FROM orders o JOIN order_items oi ON oi.order_id = o.order_id`. Chữ `o` và `oi` là alias của hai table.',
        '`WHERE o.status <> \'cancelled\'` bỏ các đơn đã hủy.',
        'Báo cáo một gom theo ngày. MySQL cắt giờ bằng `DATE(...)`, Oracle cắt giờ bằng `TRUNC(...)`. Query chỉ lấy 7 ngày đầu để dễ xem.',
      ],
    },
    {
      type: 'playground',
      title: 'Báo cáo 1: doanh thu theo ngày',
      intro: 'Bấm Chạy. Mỗi row là doanh thu của một ngày. Mở Query Theater để xem các row nối nhau rồi vào nhóm.',
      database: 'teashop-big',
      tables: ['orders', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT DATE(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY DATE(o.ordered_at)\nORDER BY order_date\nLIMIT 7;",
        oracle:
          "SELECT TRUNC(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY TRUNC(o.ordered_at)\nORDER BY order_date\nFETCH FIRST 7 ROWS ONLY",
      },
      tries: [
        {
          label: 'Đổi ORDER BY order_date thành ORDER BY revenue DESC',
          sql: {
            mysql:
              "SELECT DATE(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY DATE(o.ordered_at)\nORDER BY revenue DESC\nLIMIT 7;",
            oracle:
              "SELECT TRUNC(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY TRUNC(o.ordered_at)\nORDER BY revenue DESC\nFETCH FIRST 7 ROWS ONLY",
          },
        },
        {
          label: 'Bỏ WHERE, tính cả đơn cancelled',
          sql: {
            mysql:
              'SELECT DATE(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nGROUP BY DATE(o.ordered_at)\nORDER BY order_date\nLIMIT 7;',
            oracle:
              'SELECT TRUNC(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nGROUP BY TRUNC(o.ordered_at)\nORDER BY order_date\nFETCH FIRST 7 ROWS ONLY',
          },
        },
        {
          label: 'Thêm COUNT(DISTINCT o.order_id) AS orders_count',
          sql: {
            mysql:
              "SELECT DATE(o.ordered_at) AS order_date,\n       COUNT(DISTINCT o.order_id) AS orders_count,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY DATE(o.ordered_at)\nORDER BY order_date\nLIMIT 7;",
            oracle:
              "SELECT TRUNC(o.ordered_at) AS order_date,\n       COUNT(DISTINCT o.order_id) AS orders_count,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY TRUNC(o.ordered_at)\nORDER BY order_date\nFETCH FIRST 7 ROWS ONLY",
          },
        },
        {
          label: 'Thêm OFFSET 7 để xem 7 ngày kế tiếp',
          sql: {
            mysql:
              "SELECT DATE(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY DATE(o.ordered_at)\nORDER BY order_date\nLIMIT 7 OFFSET 7;",
            oracle:
              "SELECT TRUNC(o.ordered_at) AS order_date,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nWHERE o.status <> 'cancelled'\nGROUP BY TRUNC(o.ordered_at)\nORDER BY order_date\nOFFSET 7 ROWS FETCH NEXT 7 ROWS ONLY",
          },
        },
      ],
      say: 'Bỏ WHERE thì doanh thu tăng ở ngày nào có đơn cancelled, vì đơn đó cũng bị cộng vào.',
    },
    {
      type: 'text',
      title: 'Doanh thu theo món',
      paragraphs: [
        'Báo cáo hai cần tên món. Tên nằm ở table products, nên ghép thêm products bằng product_id.',
        'Query gom theo tên món, sắp theo doanh thu giảm dần, và giữ 5 món đầu.',
        'Muốn xem món bán nhiều ly nhất thay cho nhiều tiền nhất, đổi tổng tiền thành `SUM(quantity)`.',
      ],
    },
    {
      type: 'playground',
      title: 'Báo cáo 2: năm món mang về nhiều tiền nhất',
      intro: 'Bấm Chạy. Query nối ba table: orders, order_items và products.',
      database: 'teashop-big',
      tables: ['orders', 'order_items', 'products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT p.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY revenue DESC\nLIMIT 5;",
        oracle:
          "SELECT p.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY revenue DESC\nFETCH FIRST 5 ROWS ONLY",
      },
      tries: [
        {
          label: 'Đổi 5 thành 3',
          sql: {
            mysql:
              "SELECT p.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY revenue DESC\nLIMIT 3;",
            oracle:
              "SELECT p.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY revenue DESC\nFETCH FIRST 3 ROWS ONLY",
          },
        },
        {
          label: 'Đổi tổng tiền thành SUM(quantity) AS cups_sold',
          sql: {
            mysql:
              "SELECT p.name,\n       SUM(oi.quantity) AS cups_sold\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY cups_sold DESC\nLIMIT 5;",
            oracle:
              "SELECT p.name,\n       SUM(oi.quantity) AS cups_sold\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY cups_sold DESC\nFETCH FIRST 5 ROWS ONLY",
          },
        },
        {
          label: 'Bỏ DESC để xem năm món thấp nhất',
          sql: {
            mysql:
              "SELECT p.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY revenue\nLIMIT 5;",
            oracle:
              "SELECT p.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.name\nORDER BY revenue\nFETCH FIRST 5 ROWS ONLY",
          },
        },
        {
          label: 'Đổi p.name thành p.category',
          sql: {
            mysql:
              "SELECT p.category,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.category\nORDER BY revenue DESC\nLIMIT 5;",
            oracle:
              "SELECT p.category,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN products p ON p.product_id = oi.product_id\nWHERE o.status <> 'cancelled'\nGROUP BY p.category\nORDER BY revenue DESC\nFETCH FIRST 5 ROWS ONLY",
          },
        },
      ],
      say: 'Xếp theo tiền và xếp theo số ly cho hai danh sách khác nhau. Món rẻ bán nhiều ly vẫn mang về ít tiền.',
    },
    {
      type: 'text',
      title: 'Doanh thu theo tiệm',
      paragraphs: [
        'Báo cáo ba cần tên tiệm. Tên nằm ở table stores, nên ghép stores bằng store_id.',
        'Chỉ có 4 tiệm, nên không cần LIMIT.',
        'Sau khi nối, một đơn có nhiều row, mỗi món một row. `COUNT(*)` ra số row món. Số này thường lớn hơn số đơn.',
        'Muốn đếm đơn, viết `COUNT(DISTINCT o.order_id)`. DISTINCT đếm mỗi đơn một lần.',
      ],
    },
    {
      type: 'playground',
      title: 'Báo cáo 3: doanh thu theo tiệm',
      intro: 'Bấm Chạy. Mỗi tiệm một row, tiệm thu nhiều nhất đứng đầu.',
      database: 'teashop-big',
      tables: ['orders', 'order_items', 'stores'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nORDER BY revenue DESC;",
        oracle:
          "SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nORDER BY revenue DESC",
      },
      tries: [
        {
          label: 'Thêm COUNT(DISTINCT o.order_id) AS orders_count',
          sql: {
            mysql:
              "SELECT s.name,\n       COUNT(DISTINCT o.order_id) AS orders_count,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nORDER BY revenue DESC;",
            oracle:
              "SELECT s.name,\n       COUNT(DISTINCT o.order_id) AS orders_count,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nORDER BY revenue DESC",
          },
        },
        {
          label: 'Bỏ DESC để tiệm thu ít nhất đứng đầu',
          sql: {
            mysql:
              "SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nORDER BY revenue;",
            oracle:
              "SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nORDER BY revenue",
          },
        },
        {
          label: 'Bỏ WHERE, tính cả đơn cancelled',
          sql: {
            mysql:
              'SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nGROUP BY s.name\nORDER BY revenue DESC;',
            oracle:
              'SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nGROUP BY s.name\nORDER BY revenue DESC',
          },
        },
        {
          label: 'Thêm HAVING SUM(...) > 4000000',
          sql: {
            mysql:
              "SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nHAVING SUM(oi.quantity * oi.unit_price) > 4000000\nORDER BY revenue DESC;",
            oracle:
              "SELECT s.name,\n       SUM(oi.quantity * oi.unit_price) AS revenue\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.order_id\nJOIN stores s ON s.store_id = o.store_id\nWHERE o.status <> 'cancelled'\nGROUP BY s.name\nHAVING SUM(oi.quantity * oi.unit_price) > 4000000\nORDER BY revenue DESC",
          },
        },
      ],
      say: 'Ba báo cáo dùng chung một khung: nối table, bỏ đơn cancelled, gom nhóm, cộng tiền.',
    },
    {
      type: 'oracle',
      body: [
        'Ba báo cáo khác nhau giữa hai dialect ở ba chỗ.',
        'Cắt giờ ra ngày: MySQL dùng `DATE(...)`, Oracle dùng `TRUNC(...)`.',
        'Giữ n row đầu: MySQL dùng `LIMIT n`, Oracle dùng `FETCH FIRST n ROWS ONLY`.',
        'Alias của table: Oracle không nhận AS trước alias. Viết `FROM orders o`, không viết `FROM orders AS o`.',
      ],
      mysql: 'GROUP BY DATE(o.ordered_at)\nORDER BY order_date\nLIMIT 7',
      oracle: 'GROUP BY TRUNC(o.ordered_at)\nORDER BY order_date\nFETCH FIRST 7 ROWS ONLY',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Doanh thu của các row trong order_items tính bằng gì?',
          options: [
            { text: '`SUM(quantity)`', feedback: 'Cách này ra tổng số ly, không ra tiền.' },
            { text: '`SUM(unit_price)`', feedback: 'Cộng đơn giá mà bỏ quantity thì món mua 2 ly chỉ tính 1 ly.' },
            { text: '`SUM(quantity * unit_price)`', correct: true, feedback: 'Đúng. Mỗi row nhân quantity với unit_price trước, rồi cộng lại.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn doanh thu không tính đơn đã hủy. Thêm gì vào query?',
          options: [
            { text: "`WHERE o.status <> 'cancelled'`", correct: true, feedback: 'Đúng. WHERE bỏ row của đơn cancelled trước khi cộng tiền.' },
            { text: '`ORDER BY o.status`', feedback: 'ORDER BY chỉ sắp xếp. Đơn cancelled vẫn được cộng.' },
            { text: '`LIMIT 1`', feedback: 'LIMIT chỉ cắt số row của kết quả, không lọc đơn nào.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn nối orders với order_items rồi viết `COUNT(*)` cho từng tiệm. Con số đó là gì?',
          options: [
            { text: 'Số đơn của tiệm', feedback: 'Một đơn có nhiều món, nên chiếm nhiều row sau khi nối. Muốn đếm đơn, dùng `COUNT(DISTINCT o.order_id)`.' },
            { text: 'Số row món của tiệm, không phải số đơn', correct: true, feedback: 'Đúng. Mỗi món trong đơn là một row, và COUNT(*) đếm từng row.' },
            { text: 'Số khách của tiệm', feedback: 'Query không đụng tới table customers, nên không đếm được khách.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo doanh thu cuối ngày của một chuỗi cửa hàng',
      paragraphs: [
        'Cuối ngày, quản lý khu vực mở báo cáo doanh thu của từng cửa hàng.',
        'Query nối đơn với từng món, bỏ đơn đã hủy, gom theo cửa hàng và cộng tiền. Đó cũng là khung của báo cáo ba trong bài này.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Doanh thu là `SUM(quantity * unit_price)` trên order_items.',
        'WHERE bỏ đơn cancelled trước khi cộng tiền.',
        'Báo cáo theo ngày, theo món, theo tiệm chỉ khác nhau ở column đứng sau GROUP BY.',
        'ORDER BY kèm LIMIT hoặc FETCH FIRST giữ báo cáo ngắn và dễ đọc.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 10: Queries with aggregates (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates' },
        { name: 'SQLBolt, bài 11: Queries with aggregates (Pt. 2)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates_pt_2' },
        { name: 'MySQL 8.0 Reference Manual, Aggregate Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Aggregate Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Aggregate-Functions.html' },
      ],
    },
  ],
};
