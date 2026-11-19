import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b3',
  chapter: 5,
  order: 3,
  title: 'HAVING',
  lead: 'Bạn giữ hoặc bỏ cả nhóm, sau khi database gom xong.',
  minutes: 14,
  goals: [
    'Lọc nhóm bằng HAVING',
    'Phân biệt WHERE lọc row và HAVING lọc nhóm',
    'Dùng WHERE và HAVING trong cùng một query',
    'Biết function gom không đứng trong WHERE',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Nhóm món nào có giá trung bình trên 30.000 đồng?',
      paragraphs: [
        'Chủ tiệm hỏi Bi: "Nhóm món nào có giá trung bình trên 30.000 đồng?"',
        'Bi chia món vào bốn hộp theo nhóm, rồi tính giá trung bình của từng hộp. Hộp nào trung bình thấp thì mình cất đi.',
        'Bi lọc cả hộp, không lọc từng món. WHERE không làm được, vì WHERE chỉ nhìn từng row.',
        'SQL có một clause riêng để lọc nhóm.',
      ],
    },
    {
      type: 'text',
      title: 'HAVING lọc nhóm',
      paragraphs: [
        '**[[having]]** lọc nhóm sau khi GROUP BY đã gom xong.',
        'HAVING đứng sau GROUP BY. Điều kiện của HAVING thường dùng function gom, như `AVG(price) > 30000`.',
        'Nhớ thứ tự chạy ở Chương 3: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.',
        'WHERE chạy trước GROUP BY, nên chỉ thấy từng row. HAVING chạy sau, nên thấy kết quả của function gom.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nhóm có giá trung bình trên 30.000',
      intro: 'Bấm Chạy. Table có 4 nhóm. Nhóm Topping có giá trung bình thấp nên bị bỏ.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 30000;',
        oracle:
          'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 30000',
      },
      tries: [
        {
          label: 'Đổi 30000 thành 38000',
          sql: {
            mysql:
              'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 38000;',
            oracle:
              'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 38000',
          },
        },
        {
          label: 'Đổi AVG(price) > 30000 thành COUNT(*) >= 4',
          sql: {
            mysql:
              'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING COUNT(*) >= 4;',
            oracle:
              'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING COUNT(*) >= 4',
          },
        },
        {
          label: 'Đổi 30000 thành 20000',
          sql: {
            mysql:
              'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 20000;',
            oracle:
              'SELECT category, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category\nHAVING AVG(price) > 20000',
          },
        },
      ],
      say: 'HAVING giữ hoặc bỏ cả nhóm. Điều kiện COUNT(*) không liên quan tới giá, vẫn dùng được trong HAVING.',
    },
    {
      type: 'text',
      title: 'WHERE và HAVING trong cùng một query',
      paragraphs: [
        'Bạn dùng được cả hai. WHERE bỏ row trước khi gom. HAVING bỏ nhóm sau khi gom.',
        'Query dưới đây đếm đơn đã xong của từng tiệm, rồi giữ tiệm có từ 4 đơn trở lên.',
        'Đơn cancelled bị WHERE bỏ trước, nên không vào nhóm nào.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tiệm có từ 4 đơn đã xong',
      intro: 'Bấm Chạy. WHERE chạy trước, HAVING chạy sau.',
      database: 'teashop',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 4;",
        oracle:
          "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 4",
      },
      tries: [
        {
          label: 'Bỏ WHERE status = done',
          sql: {
            mysql: 'SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nGROUP BY store_id\nHAVING COUNT(*) >= 4;',
            oracle: 'SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nGROUP BY store_id\nHAVING COUNT(*) >= 4',
          },
        },
        {
          label: 'Đổi >= 4 thành >= 5',
          sql: {
            mysql:
              "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 5;",
            oracle:
              "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 5",
          },
        },
        {
          label: 'Đổi >= 4 thành >= 3',
          sql: {
            mysql:
              "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 3;",
            oracle:
              "SELECT store_id, COUNT(*) AS done_orders\nFROM orders\nWHERE status = 'done'\nGROUP BY store_id\nHAVING COUNT(*) >= 3",
          },
        },
      ],
      say: 'Bỏ WHERE thì tiệm số 2 có 4 đơn, tính cả đơn cancelled, và lọt vào kết quả.',
    },
    {
      type: 'oracle',
      body: [
        'Function gom không đứng được trong WHERE. Lúc WHERE chạy, database chưa gom nhóm.',
        'Viết `WHERE COUNT(*) > 3` thì MySQL báo lỗi 1111, Oracle báo ORA-00934 với lời "group function is not allowed here".',
        'Cách sửa ở cả hai dialect: chuyển điều kiện sang HAVING.',
      ],
      mysql: 'SELECT category, COUNT(*)\nFROM products\nWHERE COUNT(*) > 3\nGROUP BY category;\n-- lỗi 1111',
      oracle: 'SELECT category, COUNT(*)\nFROM products\nWHERE COUNT(*) > 3\nGROUP BY category\n-- lỗi ORA-00934',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn muốn giữ nhóm có `COUNT(*)` từ 4 trở lên. Đặt điều kiện ở đâu?',
          options: [
            { text: 'Trong WHERE', feedback: 'Lúc WHERE chạy, nhóm chưa có. Oracle báo ORA-00934, MySQL báo 1111.' },
            { text: 'Trong HAVING', correct: true, feedback: 'Đúng. HAVING lọc nhóm sau khi gom.' },
            { text: 'Trong ORDER BY', feedback: 'ORDER BY chỉ sắp xếp, không lọc.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn bỏ đơn cancelled trước khi đếm đơn của từng tiệm. Dùng gì?',
          options: [
            { text: 'WHERE', correct: true, feedback: 'Đúng. WHERE bỏ row trước khi gom, nên đơn cancelled không vào nhóm.' },
            { text: 'HAVING', feedback: 'Sau khi gom, database không còn thấy từng đơn. Đơn cancelled đã vào nhóm và đã được đếm.' },
            { text: 'Cả hai cho cùng kết quả', feedback: 'Hai clause chạy ở hai thời điểm khác nhau, nên kết quả khác nhau.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Thứ tự chạy nào đúng?',
          options: [
            { text: 'GROUP BY, WHERE, HAVING', feedback: 'GROUP BY cần các row đã lọc xong, nên WHERE phải chạy trước.' },
            { text: 'HAVING, GROUP BY, WHERE', feedback: 'HAVING lọc nhóm, nên phải chạy sau khi nhóm đã có.' },
            { text: 'WHERE, GROUP BY, HAVING', correct: true, feedback: 'Đúng. Lọc row, gom nhóm, rồi lọc nhóm.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Cảnh báo chi tiêu',
      paragraphs: [
        'Một app quản lý chi tiêu có thể báo khi danh mục nào vượt mức bạn đặt.',
        'Query gom chi tiêu theo danh mục. HAVING giữ danh mục có tổng tiền vượt mức.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'WHERE lọc row trước khi gom. HAVING lọc nhóm sau khi gom.',
        'Function gom đứng được trong HAVING, không đứng được trong WHERE.',
        'Dùng cả hai trong một query: WHERE bỏ row, rồi HAVING bỏ nhóm.',
        'Function gom trong WHERE gây lỗi 1111 ở MySQL và ORA-00934 ở Oracle.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 11: Queries with aggregates (Pt. 2)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates_pt_2' },
        { name: 'MySQL 8.0 Reference Manual, Aggregate Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Aggregate Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Aggregate-Functions.html' },
        { name: 'Oracle Database Error Messages, ORA-00934', url: 'https://docs.oracle.com/en/error-help/db/ora-00934/' },
      ],
    },
  ],
};
