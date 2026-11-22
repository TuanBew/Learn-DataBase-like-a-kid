import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c8-b2',
  chapter: 8,
  order: 2,
  title: 'Subquery trả một danh sách: IN, NOT IN và bẫy NULL',
  lead: 'Bạn lọc row bằng danh sách do subquery trả về, và tránh bẫy NULL của NOT IN.',
  minutes: 16,
  goals: [
    'Lọc bằng IN với danh sách do subquery trả về',
    'Dùng NOT IN để tìm row không có trong danh sách',
    'Nhận ra bẫy NOT IN khi danh sách có NULL và tránh nó',
    'Đọc được = ANY và > ALL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Khách nào đã từng mua?',
      paragraphs: [
        'Chủ tiệm muốn gửi quà cho khách đã đặt ít nhất một đơn.',
        'Bi chưa thể mở danh sách khách ngay. Trước hết mình cần biết mã nào từng xuất hiện trong table orders.',
        'Bi chép các mã đó ra một tờ giấy nháp. Rồi mình mở danh sách khách, và giữ ai có mã nằm trên tờ nháp.',
        'Tờ nháp ấy là một query nhỏ. SQL cho bạn đặt nó ngay trong query lớn.',
      ],
    },
    {
      type: 'text',
      title: 'Subquery trả một danh sách cho IN',
      paragraphs: [
        'Ở bài trước, subquery trả về một con số. Giờ subquery trả về cả một danh sách.',
        '**[[in]]** giữ row khi giá trị nằm trong một danh sách. Danh sách có thể do subquery trả về.',
        'Subquery ở đây chỉ chọn một column, nên kết quả là một danh sách các mã.',
        'Query dưới đây lấy mã khách từ orders, rồi giữ các khách có mã nằm trong đó.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: khách đã từng đặt đơn',
      intro: 'Bấm Chạy. Theater chạy query nhỏ trước, rồi mới lọc table customers.',
      database: 'teashop',
      tables: ['customers', 'orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders);',
        oracle:
          'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders)',
      },
      tries: [
        {
          label: 'Thêm WHERE store_id = 1 vào subquery',
          sql: {
            mysql:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE store_id = 1);',
            oracle:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE store_id = 1)',
          },
        },
        {
          label: "Thêm WHERE status = 'cancelled' vào subquery",
          sql: {
            mysql:
              "SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled');",
            oracle:
              "SELECT customer_id, full_name\nFROM customers\nWHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled')",
          },
        },
        {
          label: 'Đổi IN thành NOT IN',
          sql: {
            mysql:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id NOT IN (SELECT customer_id FROM orders);',
            oracle:
              'SELECT customer_id, full_name\nFROM customers\nWHERE customer_id NOT IN (SELECT customer_id FROM orders)',
          },
        },
      ],
      say: 'Có 9 khách đã đặt đơn. Mục cuối trả 0 row, dù ba khách chưa đặt đơn nào. Phần sau giải thích vì sao.',
    },
    {
      type: 'text',
      title: 'NOT IN và bẫy NULL',
      paragraphs: [
        '**[[not-in]]** làm ngược lại IN: giữ row khi giá trị không nằm trong danh sách.',
        'Mục cuối của khối trước dùng NOT IN và ra 0 row. Tiệm có 12 khách, 9 người đã đặt đơn, nên lẽ ra phải ra 3 khách.',
        'Lý do nằm ở các đơn của khách vãng lai. Table orders có 20 đơn, nhưng chỉ 16 đơn có customer_id. Bốn đơn còn lại là NULL.',
        'Với NOT IN, database phải chắc giá trị khác mọi phần tử của danh sách. Gặp NULL, database không chắc được, nên không giữ row nào.',
        'Kết quả là 0 row và database không báo lỗi. Đây là bẫy khó thấy nhất của NOT IN.',
        'Cách tránh: thêm `WHERE customer_id IS NOT NULL` vào subquery. Danh sách hết NULL, và NOT IN chạy đúng.',
      ],
    },
    {
      type: 'playground',
      title: 'Nhân viên chưa phụ trách đơn nào',
      intro: 'Bấm Chạy. Table orders có 10 đơn chưa gán nhân viên, nên sales_rep_id có NULL.',
      database: 'company',
      tables: ['employees', 'orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE employee_id NOT IN (SELECT sales_rep_id FROM orders);',
        oracle:
          'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE employee_id NOT IN (SELECT sales_rep_id FROM orders)',
      },
      tries: [
        {
          label: 'Thêm WHERE sales_rep_id IS NOT NULL vào subquery',
          sql: {
            mysql:
              'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE employee_id NOT IN (SELECT sales_rep_id FROM orders WHERE sales_rep_id IS NOT NULL);',
            oracle:
              'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE employee_id NOT IN (SELECT sales_rep_id FROM orders WHERE sales_rep_id IS NOT NULL)',
          },
        },
        {
          label: 'Đổi NOT IN thành IN',
          sql: {
            mysql:
              'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE employee_id IN (SELECT sales_rep_id FROM orders);',
            oracle:
              'SELECT employee_id, first_name, last_name\nFROM employees\nWHERE employee_id IN (SELECT sales_rep_id FROM orders)',
          },
        },
        {
          label: 'Xem các đơn có sales_rep_id là NULL',
          sql: {
            mysql:
              'SELECT order_id, status, sales_rep_id\nFROM orders\nWHERE sales_rep_id IS NULL;',
            oracle:
              'SELECT order_id, status, sales_rep_id\nFROM orders\nWHERE sales_rep_id IS NULL',
          },
        },
      ],
      say: 'Kết quả đầu là 0 row, dù công ty có 40 nhân viên và chỉ 13 người từng phụ trách đơn. Thêm IS NOT NULL thì ra đúng 27 người. IN không dính bẫy này, vì NULL chỉ làm hỏng NOT IN.',
    },
    {
      type: 'text',
      title: 'So với cả danh sách: ANY và ALL',
      paragraphs: [
        'IN chỉ hỏi "bằng một trong các giá trị". Khi cần so lớn hơn hay nhỏ hơn, bạn dùng **[[any]]** và **[[all]]**.',
        '`= ANY (subquery)` đúng khi giá trị bằng ít nhất một phần tử. Kết quả giống hệt `IN`.',
        '`> ALL (subquery)` đúng khi giá trị lớn hơn mọi phần tử, tức lớn hơn giá trị cao nhất của danh sách.',
        'Ví dụ: `salary > ALL (SELECT salary FROM employees WHERE department_id = 30)` tìm người lương cao hơn cả người cao nhất phòng 30. Công ty có 3 người như vậy: Khoa, Mai và Nam.',
        '`> ANY (subquery)` chỉ cần lớn hơn một phần tử, tức lớn hơn giá trị thấp nhất. Với cùng danh sách phòng 30, kết quả là 32 người.',
        '`<> ALL` có nghĩa như `NOT IN` và dính cùng bẫy NULL. Ví dụ `employee_id <> ALL (SELECT manager_id FROM departments)` ra 0 row, vì có một phòng chưa có trưởng phòng, và manager_id của phòng đó là NULL.',
        'Bạn gặp IN và NOT IN nhiều hơn ANY và ALL. Biết hai từ này để đọc được query của người khác.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'IN, NOT IN, ANY, ALL chạy giống nhau ở cả hai dialect, kể cả luật NULL.',
        'Chỗ khác nằm ở LIMIT. MySQL không cho LIMIT trong subquery của IN, ANY, ALL và báo lỗi 1235. Oracle 19c cho viết FETCH FIRST ở đó.',
        'Hai query dưới đây tìm ba người lương cao nhất bằng IN. MySQL phải bọc LIMIT vào một subquery trong FROM.',
      ],
      mysql:
        'SELECT first_name, last_name, salary\nFROM employees\nWHERE employee_id IN (\n  SELECT employee_id FROM (\n    SELECT employee_id FROM employees\n    ORDER BY salary DESC\n    LIMIT 3\n  ) t\n);',
      oracle:
        'SELECT first_name, last_name, salary\nFROM employees\nWHERE employee_id IN (\n  SELECT employee_id FROM employees\n  ORDER BY salary DESC\n  FETCH FIRST 3 ROWS ONLY\n)',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Danh sách của subquery có một giá trị NULL. Bạn dùng `NOT IN`. Chuyện gì xảy ra?',
          options: [
            { text: 'Kết quả là 0 row, không có lỗi', correct: true, feedback: 'Đúng. Gặp NULL, database không chắc giá trị nào khác danh sách.' },
            { text: 'Database báo lỗi', feedback: 'Không có lỗi nào cả. Đó là điều làm bẫy này khó thấy.' },
            { text: 'Database bỏ qua NULL và chạy bình thường', feedback: 'Ngược lại. NULL làm NOT IN loại hết mọi row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn giữ NOT IN và tránh bẫy NULL. Cách nào đúng?',
          options: [
            { text: 'Thêm `WHERE ... IS NOT NULL` vào subquery', correct: true, feedback: 'Đúng. Danh sách hết NULL, nên NOT IN so sánh được.' },
            { text: 'Thêm `OR ... IS NULL` vào query ngoài', feedback: 'Query ngoài không sửa được danh sách. NULL vẫn nằm trong danh sách của subquery.' },
            { text: 'Đổi NOT IN thành IN', feedback: 'IN và NOT IN trả hai kết quả ngược nhau. Đổi như vậy là hỏi câu khác.' },
          ],
        },
        {
          kind: 'choice',
          question: '`salary > ALL (SELECT salary FROM employees WHERE department_id = 30)` giữ người nào?',
          options: [
            { text: 'Người lương cao hơn cả người cao nhất phòng 30', correct: true, feedback: 'Đúng. ALL đòi hỏi điều kiện đúng với mọi phần tử của danh sách.' },
            { text: 'Người lương cao hơn ít nhất một người phòng 30', feedback: 'Đó là ANY. ALL khắt khe hơn: phải hơn tất cả.' },
            { text: 'Người có lương bằng lương của một người phòng 30', feedback: 'Đó là `= ANY`, tức IN. Dấu `>` đòi lớn hơn.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Danh sách khách chưa từng mua',
      paragraphs: [
        'Một đội chăm sóc khách muốn gửi mã giảm giá cho những khách chưa mua lần nào.',
        'Anh phụ trách viết `NOT IN (SELECT customer_id FROM orders)` và nhận về 0 khách. Anh nghĩ ai cũng đã mua.',
        'Thật ra vài đơn của khách vãng lai có customer_id là NULL. Sau khi thêm `IS NOT NULL` vào subquery, danh sách hiện đủ khách cần gửi.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'IN (subquery) giữ row khi giá trị nằm trong danh sách mà subquery trả về.',
        'NOT IN gặp NULL trong danh sách thì không giữ row nào, và không báo lỗi. Thêm `IS NOT NULL` vào subquery để tránh.',
        '`= ANY` giống IN. `> ALL` nghĩa là lớn hơn mọi phần tử. `<> ALL` giống NOT IN và dính bẫy NULL.',
        'MySQL không cho LIMIT trong subquery của IN, ANY, ALL (lỗi 1235). Oracle 19c cho FETCH FIRST.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, Topic: Subqueries', url: 'https://sqlbolt.com/topic/subqueries' },
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, Subqueries with ANY, IN, or SOME', url: 'https://dev.mysql.com/doc/refman/8.0/en/any-in-some-subqueries.html' },
        { name: 'MySQL 8.0 Reference Manual, Subqueries with ALL', url: 'https://dev.mysql.com/doc/refman/8.0/en/all-subqueries.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Using Subqueries', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Using-Subqueries.html' },
      ],
    },
  ],
};
