import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b2',
  chapter: 5,
  order: 2,
  title: 'GROUP BY',
  lead: 'Bạn chia row vào từng nhóm, rồi tính một con số cho mỗi nhóm.',
  minutes: 16,
  goals: [
    'Chia row thành nhóm bằng GROUP BY',
    'Tính một con số cho mỗi nhóm bằng function gom',
    'Biết column trong SELECT phải nằm trong GROUP BY hoặc trong function gom',
    'Đọc lỗi ORA-00979',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Mỗi nhóm món có mấy món?',
      paragraphs: [
        'Chủ tiệm hỏi Bi: "Mỗi nhóm món có mấy món?"',
        'Bi chuẩn bị bốn hộp: Trà sữa, Trà trái cây, Cà phê và Topping. Mình bỏ từng món vào đúng hộp.',
        'Xong thì Bi đếm số món trong từng hộp.',
        'SQL làm đúng hai bước đó: chia row vào hộp, rồi tính trên từng hộp.',
      ],
    },
    {
      type: 'text',
      title: 'GROUP BY chia row thành nhóm',
      paragraphs: [
        '**[[group-by]]** chia row thành nhóm. Các row có cùng giá trị ở column đó vào cùng một nhóm.',
        'Function gom chạy trên từng nhóm. Mỗi nhóm cho ra đúng một row kết quả.',
        'Query dưới đây đếm món theo nhóm. Mở Query Theater để xem từng row bay vào hộp của nhóm mình.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đếm món theo nhóm',
      intro: 'Bấm Chạy. Table có 14 row, kết quả có 4 row, mỗi category một row.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT category, COUNT(*) AS items\nFROM products\nGROUP BY category;',
        oracle: 'SELECT category, COUNT(*) AS items\nFROM products\nGROUP BY category',
      },
      tries: [
        {
          label: 'Thêm ROUND(AVG(price), 0) AS avg_price',
          sql: {
            mysql: 'SELECT category, COUNT(*) AS items, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category;',
            oracle: 'SELECT category, COUNT(*) AS items, ROUND(AVG(price), 0) AS avg_price\nFROM products\nGROUP BY category',
          },
        },
        {
          label: 'Đổi COUNT(*) thành MAX(price)',
          sql: {
            mysql: 'SELECT category, MAX(price) AS max_price\nFROM products\nGROUP BY category;',
            oracle: 'SELECT category, MAX(price) AS max_price\nFROM products\nGROUP BY category',
          },
        },
        {
          label: 'Thêm ORDER BY items DESC',
          sql: {
            mysql: 'SELECT category, COUNT(*) AS items\nFROM products\nGROUP BY category\nORDER BY items DESC;',
            oracle: 'SELECT category, COUNT(*) AS items\nFROM products\nGROUP BY category\nORDER BY items DESC',
          },
        },
      ],
      say: 'Thứ tự các nhóm không cố định. Muốn xếp nhóm theo thứ tự, thêm ORDER BY.',
    },
    {
      type: 'text',
      title: 'Column trong SELECT',
      paragraphs: [
        'Column trong SELECT phải nằm trong GROUP BY, hoặc nằm trong một function gom.',
        'Lý do: mỗi nhóm có nhiều row. Database không biết lấy name của row nào để hiện cho cả nhóm.',
        '`SELECT category, name, COUNT(*) FROM products GROUP BY category` vi phạm luật này. Oracle báo ORA-00979.',
        'Gom theo hai column thì mỗi cặp giá trị là một nhóm.',
        'Query dưới đây đếm đơn theo cặp tiệm và trạng thái.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn theo tiệm và trạng thái',
      intro: 'Bấm Chạy. Mỗi cặp store_id và status là một nhóm.',
      database: 'teashop',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT store_id, status, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, status;',
        oracle: 'SELECT store_id, status, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, status',
      },
      tries: [
        {
          label: 'Thêm ORDER BY store_id, status',
          sql: {
            mysql: 'SELECT store_id, status, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, status\nORDER BY store_id, status;',
            oracle: 'SELECT store_id, status, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, status\nORDER BY store_id, status',
          },
        },
        {
          label: 'Bỏ status khỏi SELECT và GROUP BY',
          sql: {
            mysql: 'SELECT store_id, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id;',
            oracle: 'SELECT store_id, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id',
          },
        },
        {
          label: 'Đổi status thành payment',
          sql: {
            mysql: 'SELECT store_id, payment, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, payment;',
            oracle: 'SELECT store_id, payment, COUNT(*) AS orders_count\nFROM orders\nGROUP BY store_id, payment',
          },
        },
      ],
      say: 'Bỏ status thì còn 4 nhóm, mỗi tiệm một nhóm. Thêm status thì tiệm nào có đơn cancelled sẽ tách thêm nhóm.',
    },
    {
      type: 'oracle',
      body: [
        'Column trong SELECT không nằm trong GROUP BY và không nằm trong function gom thì Oracle báo ORA-00979. Lời báo cổ điển của lỗi này là "not a GROUP BY expression".',
        'Nếu query không có GROUP BY mà SELECT lẫn column với function gom, Oracle báo ORA-00937.',
        'MySQL 8 cũng chặn, với mã 1055. Riêng MySQL cho chọn thêm column của một table khi đã GROUP BY primary key của table đó.',
        'Cách sửa ở cả hai nơi: thêm column vào GROUP BY, hoặc bọc nó trong function gom như `MAX(name)`.',
      ],
      mysql: 'SELECT category, name, COUNT(*)\nFROM products\nGROUP BY category;\n-- lỗi 1055',
      oracle: 'SELECT category, name, COUNT(*)\nFROM products\nGROUP BY category\n-- lỗi ORA-00979',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query nào chạy được ở cả hai dialect?',
          options: [
            { text: '`SELECT category, name FROM products GROUP BY category`', feedback: 'name không nằm trong GROUP BY và không nằm trong function gom. Oracle báo ORA-00979.' },
            { text: '`SELECT category, COUNT(*) FROM products GROUP BY category`', correct: true, feedback: 'Đúng. category nằm trong GROUP BY, COUNT là function gom.' },
            { text: '`SELECT category, COUNT(*) FROM products`', feedback: 'Có function gom mà thiếu GROUP BY, nên category không biết lấy từ row nào. Oracle báo ORA-00937.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn gom orders theo `store_id, status`. Mỗi nhóm gồm những row nào?',
          options: [
            { text: 'Các row cùng store_id, bất kể status', feedback: 'Có hai column trong GROUP BY, nên cả hai đều phải trùng.' },
            { text: 'Các row trùng cả store_id lẫn status', correct: true, feedback: 'Đúng. Mỗi cặp giá trị khác nhau là một nhóm.' },
            { text: 'Các row cùng status, bất kể store_id', feedback: 'Có hai column trong GROUP BY, nên cả hai đều phải trùng.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Table products có 14 row và 4 giá trị category khác nhau. `GROUP BY category` cho ra bao nhiêu row?',
          options: [
            { text: '14', feedback: 'Mỗi nhóm cho ra đúng một row, không phải mỗi món.' },
            { text: '4', correct: true, feedback: 'Đúng. Mỗi category là một nhóm, mỗi nhóm một row.' },
            { text: '1', feedback: 'Một row chỉ ra khi không có GROUP BY và cả table là một nhóm.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Chi tiêu theo danh mục trong app ngân hàng',
      paragraphs: [
        'App ngân hàng cho bạn xem chi tiêu tháng này theo danh mục: ăn uống, đi lại, mua sắm.',
        'Mỗi danh mục là một nhóm. Query cộng tiền của từng nhóm và cho ra một row mỗi danh mục.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'GROUP BY chia row thành nhóm. Mỗi nhóm cho ra một row kết quả.',
        'Function gom chạy trên từng nhóm.',
        'Column trong SELECT phải nằm trong GROUP BY hoặc trong function gom. Vi phạm thì Oracle báo ORA-00979, MySQL báo 1055.',
        'Gom theo hai column thì mỗi cặp giá trị là một nhóm.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 10: Queries with aggregates (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates' },
        { name: 'MySQL 8.0 Reference Manual, MySQL Handling of GROUP BY', url: 'https://dev.mysql.com/doc/refman/8.0/en/group-by-handling.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Aggregate Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Aggregate-Functions.html' },
        { name: 'Oracle Database Error Messages, ORA-00979', url: 'https://docs.oracle.com/en/error-help/db/ora-00979/' },
      ],
    },
  ],
};
