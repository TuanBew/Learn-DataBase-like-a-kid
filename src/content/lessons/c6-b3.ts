import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b3',
  chapter: 6,
  order: 3,
  title: 'Nối ba table',
  lead: 'Bạn nối orders, order_items và products, rồi gom nhóm trên kết quả đã nối.',
  minutes: 18,
  goals: [
    'Nối ba table bằng hai JOIN',
    'Đọc hai điều kiện ON, mỗi cái nối một cặp table',
    'Nối xong mới gom nhóm',
    'Tính số ly bán được của từng món',
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
        'Bài Thứ tự query chạy thật đã nói: FROM chạy trước GROUP BY.',
        'JOIN nằm trong FROM. Vì vậy database nối table trước, rồi mới gom nhóm trên kết quả đã nối.',
        'Muốn biết mỗi món bán được bao nhiêu ly, bạn cần tên món và số lượng ở cùng một row. Nối ba table cho bạn điều đó.',
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
      type: 'oracle',
      body: [
        'Hai dialect nối ba table giống nhau. Chỉ có hai chỗ khác ở query trên.',
        'MySQL giữ năm row đầu bằng `LIMIT 5`. Oracle viết `FETCH FIRST 5 ROWS ONLY`.',
        'Alias của table không có AS ở Oracle: `orders o`, không phải `orders AS o`.',
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
      ],
    },
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
        'Nối ba table cần hai JOIN, mỗi JOIN có một ON.',
        'order_items là table cầu nối giữa orders và products.',
        'Database nối table xong mới gom nhóm.',
        'Mọi column trong SELECT phải nằm trong GROUP BY hoặc trong function gom.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 6: Multi-table queries with JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_joins' },
        { name: 'SQLBolt, bài 7: OUTER JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_outer_joins' },
      ],
    },
  ],
};
