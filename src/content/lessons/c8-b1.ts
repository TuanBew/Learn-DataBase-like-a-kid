import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c8-b1',
  chapter: 8,
  order: 1,
  title: 'Subquery trả một giá trị',
  lead: 'Bạn tính một con số trước, rồi dùng chính con số đó để lọc row.',
  minutes: 14,
  goals: [
    'Viết subquery trả một giá trị trong WHERE',
    'Đặt scalar subquery vào danh sách SELECT',
    'Đọc lỗi khi subquery trả hơn một row',
    'Biết subquery không ra row nào thì giá trị là NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ai lương cao hơn mức trung bình?',
      paragraphs: [
        'Chị Thu ở phòng Nhân sự hỏi Bi: "Ai đang nhận lương cao hơn mức trung bình của công ty?"',
        'Bi chưa biết mức trung bình là bao nhiêu. Muốn so lương từng người, mình cần con số đó trước.',
        'Bi tính lương trung bình ra giấy nháp. Rồi mình đi từng người trong table employees và so với con số trên tờ nháp.',
        'SQL cho bạn viết cả hai bước trong một query. Phép tính nháp nằm trong dấu ngoặc.',
      ],
    },
    {
      type: 'text',
      title: 'Query nhỏ nằm trong dấu ngoặc',
      paragraphs: [
        '**[[subquery]]** là query nhỏ nằm trong dấu ngoặc của một query lớn.',
        'Database chạy subquery trước. Kết quả của subquery thế chỗ dấu ngoặc, rồi query ngoài chạy tiếp.',
        'Subquery chỉ ra một giá trị gọi là **[[scalar-subquery]]**. Bạn dùng nó như một con số viết sẵn.',
        'Ví dụ: `AVG(salary)` cho ra một con số. Bạn đặt nó vào ngoặc: `WHERE salary > (SELECT AVG(salary) FROM employees)`.',
        'Lương trung bình của công ty là 22.350.000 đồng. Database tính con số này một lần, rồi so lương từng người với nó.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lương cao hơn trung bình',
      intro: 'Bấm Chạy. Theater tính lương trung bình trước, rồi mới lọc table employees.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC;',
        oracle:
          'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC',
      },
      tries: [
        {
          label: 'Đổi > thành <',
          sql: {
            mysql:
              'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary < (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC;',
            oracle:
              'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary < (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC',
          },
        },
        {
          label: 'Thêm WHERE department_id = 20 vào subquery',
          sql: {
            mysql:
              'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = 20)\nORDER BY salary DESC;',
            oracle:
              'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = 20)\nORDER BY salary DESC',
          },
        },
        {
          label: 'Đổi department_id trong subquery thành 99',
          sql: {
            mysql:
              'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = 99)\nORDER BY salary DESC;',
            oracle:
              'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = 99)\nORDER BY salary DESC',
          },
        },
        {
          label: 'Đưa subquery vào danh sách SELECT, chỉ xem phòng 30',
          sql: {
            mysql:
              'SELECT first_name, last_name, salary,\n  salary - (SELECT AVG(salary) FROM employees) AS diff_vs_avg\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT first_name, last_name, salary,\n  salary - (SELECT AVG(salary) FROM employees) AS diff_vs_avg\nFROM employees\nWHERE department_id = 30',
          },
        },
      ],
      say: 'Mình thấy 10 người trên mức 22.350.000 đồng, Khoa đứng đầu với 100 triệu. Đổi sang phòng 99 thì ra 0 row, vì phòng 99 không có ai.',
    },
    {
      type: 'text',
      title: 'Subquery phải trả đúng một giá trị',
      paragraphs: [
        'Dấu `>` cần một con số ở vế phải. Vì vậy subquery phải ra đúng một row và một column.',
        'Giả sử bạn viết `WHERE salary > (SELECT salary FROM employees WHERE department_id = 30)`. Phòng 30 có 6 người, nên subquery ra 6 con số.',
        'Database không biết chọn con số nào, nên báo lỗi. MySQL báo 1242. Oracle báo ORA-01427.',
        'Muốn sửa, gom 6 con số thành một con số. Dùng `MAX(salary)`, `MIN(salary)` hoặc `AVG(salary)`.',
        'Subquery không ra row nào thì giá trị của nó là NULL. So sánh với NULL không bao giờ đúng, nên query ngoài ra 0 row và không báo lỗi.',
        'Bạn cũng dùng được scalar subquery trong danh sách SELECT, như mục cuối ở khối thử tay. Mỗi row hiện thêm một column, giá trị luôn như nhau.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Hai dialect báo cùng một lỗi với mã khác nhau: MySQL 1242, Oracle ORA-01427.',
        'Subquery ra hơn một column cũng báo lỗi: MySQL 1241, Oracle ORA-00913.',
        'Muốn ép subquery về đúng một row, MySQL viết `LIMIT 1`. Oracle 19c viết `FETCH FIRST 1 ROW ONLY`.',
        'Hai query dưới đây tìm người lương cao nhất bằng cách đó.',
      ],
      mysql:
        'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary = (\n  SELECT salary FROM employees\n  ORDER BY salary DESC\n  LIMIT 1\n);',
      oracle:
        'SELECT first_name, last_name, salary\nFROM employees\nWHERE salary = (\n  SELECT salary FROM employees\n  ORDER BY salary DESC\n  FETCH FIRST 1 ROW ONLY\n)',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn muốn tìm người có lương cao nhất công ty. Điều kiện nào đúng?',
          options: [
            { text: '`WHERE salary = (SELECT MAX(salary) FROM employees)`', correct: true, feedback: 'Đúng. Subquery ra đúng một con số, là lương cao nhất.' },
            { text: '`WHERE salary = (SELECT salary FROM employees)`', feedback: 'Subquery này ra 40 con số, mỗi người một số. Database báo lỗi vì vế phải của dấu = cần một giá trị.' },
            { text: '`WHERE salary = MAX(salary)`', feedback: 'Hàm gom như MAX không đứng trực tiếp trong WHERE. Đặt nó vào subquery như đáp án đầu.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn viết `salary > (subquery)` và subquery ra 6 row. Chuyện gì xảy ra?',
          options: [
            { text: 'Database báo lỗi: MySQL 1242, Oracle ORA-01427', correct: true, feedback: 'Đúng. Vế phải của `>` chỉ nhận một giá trị.' },
            { text: 'Database lấy row đầu tiên', feedback: 'Database không đoán thay bạn. Muốn lấy một row, bạn phải viết rõ như MAX hay LIMIT 1.' },
            { text: 'Database so với cả 6 giá trị', feedback: 'So với cả danh sách là việc của IN, ANY, ALL. Bài sau sẽ dạy.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Subquery không ra row nào. Query ngoài viết `salary > (subquery)`. Kết quả là gì?',
          options: [
            { text: '0 row, không có lỗi', correct: true, feedback: 'Đúng. Subquery rỗng cho giá trị NULL, và so sánh với NULL không bao giờ đúng.' },
            { text: 'Mọi row của table', feedback: 'Điều kiện không đúng với row nào, nên không row nào được giữ.' },
            { text: 'Database báo lỗi', feedback: 'Lỗi chỉ xuất hiện khi subquery ra nhiều hơn một row. Ra 0 row thì chỉ thành NULL.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Tìm đơn hàng bất thường',
      paragraphs: [
        'Một nhóm kiểm soát chất lượng muốn tìm các đơn có giá trị cao hơn hai lần giá trị đơn trung bình.',
        'Họ viết scalar subquery tính giá trị đơn trung bình, rồi so từng đơn với `2 * (subquery)`.',
        'Khi đơn mới vào, con số trung bình tự đổi. Không ai phải sửa query.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Subquery nằm trong dấu ngoặc và chạy trước query ngoài.',
        'Scalar subquery ra đúng một row và một column, nên dùng như một con số: `salary > (SELECT AVG(salary) ...)`.',
        'Ra hơn một row thì báo lỗi: MySQL 1242, Oracle ORA-01427. Gom lại bằng MAX, MIN, AVG hoặc ép về một row.',
        'Ra 0 row thì giá trị là NULL, và điều kiện so sánh với nó không giữ row nào.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, Topic: Subqueries', url: 'https://sqlbolt.com/topic/subqueries' },
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, Subqueries', url: 'https://dev.mysql.com/doc/refman/8.0/en/subqueries.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Using Subqueries', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Using-Subqueries.html' },
      ],
    },
  ],
};
