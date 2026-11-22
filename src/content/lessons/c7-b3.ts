import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c7-b3',
  chapter: 7,
  order: 3,
  title: 'LEFT JOIN',
  lead: 'Bạn giữ mọi row của table bên trái, kể cả row không ghép được.',
  minutes: 16,
  goals: [
    'Giữ mọi row bên trái bằng LEFT JOIN',
    'Đọc NULL ở column của table bên phải',
    'Tìm món chưa từng bán bằng LEFT JOIN và IS NULL',
    'Tìm đơn của khách vãng lai',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Món nào chưa ai mua?',
      paragraphs: [
        'Chủ tiệm hỏi Bi: "Món nào chưa bán được ly nào?"',
        'Bi không đi từng đơn để xem món nào xuất hiện. Mình đi từng món trong thực đơn.',
        'Với mỗi món, Bi tìm các đơn có món đó. Món nào không tìm thấy đơn nào thì ghi lại.',
        'Bi phải giữ mọi món trong danh sách, kể cả món không có đơn. INNER JOIN làm rơi mất các món này.',
      ],
    },
    {
      type: 'text',
      title: 'LEFT JOIN giữ mọi row bên trái',
      paragraphs: [
        '**[[left-join]]** giữ mọi row của table bên trái. Row nào không ghép được thì column của table bên phải là **[[null]]**.',
        'Table bên trái là table đứng trước chữ JOIN. Table bên phải đứng sau.',
        'Bạn cũng gặp cách viết `LEFT OUTER JOIN`. Hai cách có nghĩa như nhau.',
        'Query dưới đây lấy các đơn của tiệm 3, kèm tên khách. Table orders đứng bên trái.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn của tiệm 3, kèm tên khách',
      intro: 'Bấm Chạy. Tìm đơn nào có full_name là NULL.',
      database: 'teashop',
      tables: ['orders', 'customers'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nLEFT JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 3;',
        oracle:
          'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nLEFT JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 3',
      },
      tries: [
        {
          label: 'Đổi LEFT JOIN thành INNER JOIN',
          sql: {
            mysql:
              'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nINNER JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 3;',
            oracle:
              'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nINNER JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 3',
          },
        },
        {
          label: 'Đổi WHERE o.store_id = 3 thành WHERE c.customer_id IS NULL',
          sql: {
            mysql:
              'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nLEFT JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE c.customer_id IS NULL;',
            oracle:
              'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nLEFT JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE c.customer_id IS NULL',
          },
        },
        {
          label: 'Đổi store_id = 3 thành store_id = 4',
          sql: {
            mysql:
              'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nLEFT JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 4;',
            oracle:
              'SELECT o.order_id, o.store_id, c.full_name\nFROM orders o\nLEFT JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 4',
          },
        },
      ],
      say: 'Đơn 1017 vẫn có mặt, nhưng full_name là NULL. Đổi sang INNER JOIN thì đơn này biến mất.',
    },
    {
      type: 'text',
      title: 'Dùng NULL để tìm row không ghép được',
      paragraphs: [
        'Đơn 1017 là đơn của khách vãng lai. Column customer_id của đơn ấy là NULL, vì khách không đăng ký thành viên.',
        'LEFT JOIN giữ đơn này lại. Column bên phải của đơn ấy là NULL hết.',
        'Bạn tận dụng điều đó. Thêm `WHERE` kiểm một column bên phải có NULL. Kết quả chỉ còn các row không ghép được.',
        'Chọn column primary key của table bên phải để kiểm. Row thật luôn có primary key, nên NULL ở đó chỉ có nghĩa là không ghép được.',
        'Với món chưa từng bán, table products đứng bên trái và order_items đứng bên phải. Kiểm `i.item_id IS NULL`.',
      ],
    },
    {
      type: 'playground',
      title: 'Món chưa từng bán',
      intro: 'Bấm Chạy. Kết quả là các món không có trong đơn nào.',
      database: 'teashop',
      tables: ['products', 'order_items'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT p.name, p.category\nFROM products p\nLEFT JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NULL;',
        oracle:
          'SELECT p.name, p.category\nFROM products p\nLEFT JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NULL',
      },
      tries: [
        {
          label: 'Đổi LEFT JOIN thành INNER JOIN',
          sql: {
            mysql:
              'SELECT p.name, p.category\nFROM products p\nINNER JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NULL;',
            oracle:
              'SELECT p.name, p.category\nFROM products p\nINNER JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NULL',
          },
        },
        {
          label: "Thêm AND p.category = 'Topping'",
          sql: {
            mysql:
              "SELECT p.name, p.category\nFROM products p\nLEFT JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NULL AND p.category = 'Topping';",
            oracle:
              "SELECT p.name, p.category\nFROM products p\nLEFT JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NULL AND p.category = 'Topping'",
          },
        },
        {
          label: 'Đổi IS NULL thành IS NOT NULL',
          sql: {
            mysql:
              'SELECT p.name, p.category\nFROM products p\nLEFT JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NOT NULL;',
            oracle:
              'SELECT p.name, p.category\nFROM products p\nLEFT JOIN order_items i\n  ON p.product_id = i.product_id\nWHERE i.item_id IS NOT NULL',
          },
        },
      ],
      say: 'Có hai món chưa ai mua: Trà ô long sữa và Kem cheese. Cả hai ra mắt ngày 1 tháng 3.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query `FROM a LEFT JOIN b ON ...` giữ mọi row của table nào?',
          options: [
            { text: 'Table a, đứng bên trái', correct: true, feedback: 'Đúng. Table đứng trước chữ JOIN là table bên trái.' },
            { text: 'Table b, đứng bên phải', feedback: 'Bên phải là table b. LEFT JOIN giữ bên trái, tức table a.' },
            { text: 'Cả hai table', feedback: 'Giữ cả hai bên là FULL JOIN, khóa học này không dạy.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn LEFT JOIN products với order_items. Món chưa bán có giá trị nào ở column của order_items?',
          options: [
            { text: 'NULL', correct: true, feedback: 'Đúng. Không có row để ghép, nên mọi column bên phải để NULL.' },
            { text: 'Số 0', feedback: 'Số 0 là một giá trị thật. Ở đây không có giá trị nào cả.' },
            { text: 'Chuỗi rỗng', feedback: 'Chuỗi rỗng cũng là một giá trị. Ở đây column là NULL.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn tìm đơn của khách vãng lai bằng LEFT JOIN orders với customers. Điều kiện nào đúng?',
          options: [
            { text: '`WHERE c.customer_id IS NULL`', correct: true, feedback: 'Đúng. Đơn không ghép được có customer_id bên customers là NULL.' },
            { text: '`WHERE c.customer_id = NULL`', feedback: 'So bằng với NULL không bao giờ đúng. Dùng IS NULL.' },
            { text: '`WHERE c.customer_id = 0`', feedback: 'Không khách nào có mã 0. Query này trả 0 row.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo "chưa có ai"',
      paragraphs: [
        'Cửa hàng online muốn biết sản phẩm nào chưa có đơn nào trong tháng. Lớp học muốn biết bạn nào chưa nộp bài.',
        'Hai câu hỏi này cùng một dạng: giữ mọi row của danh sách gốc, rồi tìm row không ghép được. Dạng này hay dùng LEFT JOIN.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'LEFT JOIN giữ mọi row của table bên trái.',
        'Row không ghép được có NULL ở mọi column của table bên phải.',
        'Muốn tìm row không ghép được, thêm WHERE kiểm primary key bên phải bằng IS NULL.',
        'INNER JOIN bỏ các row này, LEFT JOIN giữ chúng.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 7: OUTER JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_outer_joins' },
      ],
    },
  ],
};
