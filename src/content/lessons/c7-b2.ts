import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c7-b2',
  chapter: 7,
  order: 2,
  title: 'INNER JOIN',
  lead: 'Bạn ghép row của hai table thành một kết quả bằng column chung.',
  minutes: 16,
  goals: [
    'Ghép hai table bằng INNER JOIN và ON',
    'Đặt alias ngắn cho table',
    'Ghi rõ table đứng trước khi hai table có column trùng tên',
    'Biết Oracle không nhận AS trước alias của table',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ai đặt đơn 1001?',
      paragraphs: [
        'Bi mở table orders. Đơn 1001 ghi mã khách là 1.',
        'Mã 1 là ai? Table orders không nói.',
        'Tên khách nằm ở table customers. Bi tìm mã 1 bên đó và thấy tên Nguyễn Thị Hường.',
        'Bi ghép tên ấy vào đơn 1001. Mỗi đơn đều cần một lần ghép như vậy.',
        'SQL ghép hai table bằng một câu.',
      ],
    },
    {
      type: 'text',
      title: 'JOIN ghép row của hai table',
      paragraphs: [
        '**[[join]]** ghép row của hai table thành một kết quả.',
        'Table orders giữ `customer_id`. Table customers cũng có `customer_id`, kèm tên khách.',
        'Hai row có `customer_id` bằng nhau thì dính lại thành một row.',
        '**[[inner-join]]** chỉ giữ các row ghép được. Row không tìm thấy bạn đồng hành thì rơi ra ngoài.',
        'Điều kiện ghép viết sau **[[on]]**: `ON o.customer_id = c.customer_id`.',
        'Query Theater sẽ cho bạn thấy hai table ghép vào nhau. Row khớp thì dính lại.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn của tiệm 1 và tên khách',
      intro: 'Bấm Chạy. Query ghép orders với customers rồi chỉ giữ đơn của tiệm số 1.',
      database: 'teashop',
      tables: ['orders', 'customers'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT o.order_id, c.full_name, o.status\nFROM orders AS o\nINNER JOIN customers AS c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 1;',
        oracle:
          'SELECT o.order_id, c.full_name, o.status\nFROM orders o\nINNER JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 1',
      },
      tries: [
        {
          label: 'Đổi store_id = 1 thành store_id = 3',
          sql: {
            mysql:
              'SELECT o.order_id, c.full_name, o.status\nFROM orders AS o\nINNER JOIN customers AS c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 3;',
            oracle:
              'SELECT o.order_id, c.full_name, o.status\nFROM orders o\nINNER JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 3',
          },
        },
        {
          label: 'Đổi o.status thành c.city',
          sql: {
            mysql:
              'SELECT o.order_id, c.full_name, c.city\nFROM orders AS o\nINNER JOIN customers AS c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 1;',
            oracle:
              'SELECT o.order_id, c.full_name, c.city\nFROM orders o\nINNER JOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 1',
          },
        },
        {
          label: 'Bỏ chữ INNER, chỉ viết JOIN',
          sql: {
            mysql:
              'SELECT o.order_id, c.full_name, o.status\nFROM orders AS o\nJOIN customers AS c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 1;',
            oracle:
              'SELECT o.order_id, c.full_name, o.status\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.store_id = 1',
          },
        },
        {
          label: 'Nối kiểu cũ: dấu phẩy ở FROM, điều kiện ghép chuyển vào WHERE',
          sql: {
            mysql:
              'SELECT o.order_id, c.full_name, o.status\nFROM orders AS o, customers AS c\nWHERE o.customer_id = c.customer_id\n  AND o.store_id = 1;',
            oracle:
              'SELECT o.order_id, c.full_name, o.status\nFROM orders o, customers c\nWHERE o.customer_id = c.customer_id\n  AND o.store_id = 1',
          },
        },
      ],
      say: 'Tiệm 1 có 6 đơn, nhưng kết quả chỉ có 5. Đơn 1012 không có mã khách, nên không ghép được.',
    },
    {
      type: 'text',
      title: 'Alias và column trùng tên',
      paragraphs: [
        '**[[alias]]** của table là tên ngắn đặt ngay sau tên table. `orders AS o` nghĩa là gọi orders là o.',
        'Sau đó bạn viết `o.order_id` thay cho `orders.order_id`.',
        'Chữ đứng trước dấu chấm nói column thuộc table nào.',
        'Cả orders lẫn customers đều có `customer_id`. Nếu gõ `customer_id` trơn, Database không biết bạn muốn bên nào.',
        'MySQL báo lỗi 1052. Oracle báo ORA-00918.',
        'Xóa chữ `o.` trước `customer_id` ở query dưới. Bấm Chạy và xem lỗi. Rồi gõ lại cho đúng.',
      ],
    },
    {
      type: 'playground',
      title: 'Đơn trả bằng thẻ',
      intro: 'Bấm Chạy. Query ghi rõ o.customer_id, vì hai table đều có column này.',
      database: 'teashop',
      tables: ['orders', 'customers'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT o.order_id, o.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'thẻ';",
        oracle:
          "SELECT o.order_id, o.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'thẻ'",
      },
      tries: [
        {
          label: 'Đổi o.customer_id thành c.customer_id',
          sql: {
            mysql:
              "SELECT o.order_id, c.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'thẻ';",
            oracle:
              "SELECT o.order_id, c.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'thẻ'",
          },
        },
        {
          label: "Đổi 'thẻ' thành 'tiền mặt'",
          sql: {
            mysql:
              "SELECT o.order_id, o.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'tiền mặt';",
            oracle:
              "SELECT o.order_id, o.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'tiền mặt'",
          },
        },
        {
          label: 'Thêm ORDER BY c.full_name',
          sql: {
            mysql:
              "SELECT o.order_id, o.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'thẻ'\nORDER BY c.full_name;",
            oracle:
              "SELECT o.order_id, o.customer_id, c.full_name\nFROM orders o\nJOIN customers c\n  ON o.customer_id = c.customer_id\nWHERE o.payment = 'thẻ'\nORDER BY c.full_name",
          },
        },
      ],
      say: 'Hai column customer_id cho cùng một giá trị, vì ON đã bắt chúng bằng nhau. Chọn bên nào cũng được.',
    },
    {
      type: 'oracle',
      body: [
        'MySQL nhận `orders AS o` lẫn `orders o`. Oracle chỉ nhận `orders o`.',
        'Viết AS trước alias của table thì Oracle báo ORA-00933. Xóa chữ AS là xong.',
        'Alias của column thì khác. Cả hai dialect đều cho viết AS.',
        'Code Oracle cũ ở công ty hay nối bằng dấu phẩy ở FROM, còn điều kiện ghép nằm trong WHERE.',
        'Kết quả của kiểu cũ giống INNER JOIN. Bạn sẽ gặp kiểu này khi đọc code người khác viết. Khi tự viết, dùng JOIN ... ON cho dễ đọc.',
      ],
      mysql: 'FROM orders AS o\nINNER JOIN customers AS c\n  ON o.customer_id = c.customer_id',
      oracle:
        'FROM orders o\nINNER JOIN customers c\n  ON o.customer_id = c.customer_id\n\n-- Kiểu cũ, kết quả giống hệt:\nFROM orders o, customers c\nWHERE o.customer_id = c.customer_id',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Đơn 1003 có customer_id là NULL. Bạn INNER JOIN orders với customers. Đơn 1003 ra sao?',
          options: [
            { text: 'Đơn 1003 biến mất khỏi kết quả', correct: true, feedback: 'Đúng. NULL không bằng mã khách nào, nên đơn không ghép được.' },
            { text: 'Đơn 1003 vẫn hiện, tên khách để trống', feedback: 'LEFT JOIN làm vậy, bài sau sẽ học. INNER JOIN bỏ row không ghép được.' },
            { text: 'Database báo lỗi', feedback: 'Không có lỗi. Row không ghép được chỉ rơi ra ngoài.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chọn `customer_id` mà không ghi table đứng trước, trong query ghép orders và customers. Chuyện gì xảy ra?',
          options: [
            { text: 'Database báo lỗi vì không biết lấy column của table nào', correct: true, feedback: 'Đúng. MySQL báo 1052, Oracle báo ORA-00918.' },
            { text: 'Database tự lấy column của table đầu tiên', feedback: 'Database không đoán. Database dừng lại và báo lỗi.' },
            { text: 'Database trả mọi row của cả hai table', feedback: 'Lỗi xảy ra trước khi query chạy, nên không có row nào.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi mẩu với ý của nó.',
          pairs: [
            { left: 'ON o.customer_id = c.customer_id', right: 'Điều kiện để hai row dính nhau' },
            { left: 'FROM orders o, customers c', right: 'Cách nối kiểu cũ trong code Oracle' },
            { left: 'orders AS o', right: 'Oracle báo ORA-00933' },
            { left: 'ORA-00918', right: 'Column trùng tên ở hai table' },
          ],
          done: 'Đúng hết. Bốn mẩu này gặp nhiều nhất khi nối hai table.',
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c7-e1', 'c7-e2'] },
    {
      type: 'realworld',
      title: 'Lịch sử đơn trong app mua sắm',
      paragraphs: [
        'Bạn mở lịch sử đơn và thấy tên món, giá và tên người nhận trên cùng một màn hình.',
        'Những thông tin ấy thường nằm ở nhiều table khác nhau. App ghép chúng bằng JOIN rồi mới hiện lên.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'JOIN ghép row của hai table qua column chung. Điều kiện ghép viết sau ON.',
        'INNER JOIN giữ các row ghép được và bỏ các row còn lại.',
        'Alias làm tên table ngắn lại. Oracle không nhận AS trước alias của table.',
        'Hai table có column trùng tên thì ghi rõ table đứng trước, như `o.customer_id`.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 6: Multi-table queries with JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_joins' },
      ],
    },
  ],
};
