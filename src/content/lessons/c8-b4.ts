import type { Lesson } from '../types';

const emp = (cond: string, end: string, sub = 'AVG(salary)') =>
  `SELECT e.first_name, e.last_name, e.department_id, e.salary
FROM employees e
WHERE e.salary ${cond} (
  SELECT ${sub}
  FROM employees
  WHERE department_id = e.department_id
)
ORDER BY e.department_id, e.salary DESC${end}`;

const head = (agg: string, extra: string, outer: string, end: string) =>
  `SELECT d.department_id, d.department_name,
  (SELECT ${agg}
   FROM employees e
   WHERE e.department_id = d.department_id${extra}) AS result
FROM departments d${outer}
ORDER BY d.department_id${end}`;

export const lesson: Lesson = {
  id: 'c8-b4',
  chapter: 8,
  order: 4,
  title: 'Subquery phụ thuộc query bên ngoài',
  lead: 'Bạn cho subquery nhìn vào từng row của query ngoài, để mỗi row có một phép tính riêng.',
  minutes: 16,
  goals: [
    'Viết subquery nhắc tới column của query ngoài',
    'So lương từng người với trung bình phòng của chính người đó',
    'Đặt subquery phụ thuộc vào danh sách SELECT',
    'Tránh bẫy quên alias ở column của query ngoài',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ai lương cao hơn phòng của mình?',
      paragraphs: [
        'Chị Thu hỏi tiếp: "Ai lương cao hơn mức trung bình của chính phòng mình?"',
        'Lần này một con số trung bình không đủ. Phòng Kinh doanh trung bình khoảng 17,9 triệu. Phòng Công nghệ thông tin khoảng 23,8 triệu.',
        'Bi cầm từng người lên và xem người đó ở phòng nào. Rồi Bi tính trung bình của phòng ấy và so với lương người đó.',
        'Mỗi người cần một phép tính riêng. Subquery cũng tính riêng được, nếu biết người đang xét là ai.',
      ],
    },
    {
      type: 'text',
      title: 'Subquery nhắc tới query ngoài',
      paragraphs: [
        'Subquery ở các bài trước đứng riêng, không nhắc tới query ngoài.',
        '**[[correlated-subquery]]** nhắc tới column của query ngoài. Vì vậy database không tính nó một lần được.',
        'Database lấy từng row của query ngoài và đưa giá trị xuống subquery. Rồi subquery chạy cho row đó. Query ngoài có 40 row thì subquery được hỏi 40 lần.',
        'Để phân biệt column của hai query, bạn đặt alias cho table ngoài: `FROM employees e`. Trong subquery, `e.department_id` là phòng của người đang xét.',
        'Đọc query dưới đây từng chữ: lương của `e` lớn hơn lương trung bình của những người cùng phòng với `e`.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lương cao hơn trung bình phòng mình',
      intro: 'Bấm Chạy. Theater đưa từng row ngoài xuống subquery.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: emp('>', ';'), oracle: emp('>', '') },
      tries: [
        {
          label: 'Đổi > thành <',
          sql: { mysql: emp('<', ';'), oracle: emp('<', '') },
        },
        {
          label: 'Đổi > thành = và AVG thành MAX: người lương cao nhất mỗi phòng',
          sql: { mysql: emp('=', ';', 'MAX(salary)'), oracle: emp('=', '', 'MAX(salary)') },
        },
        {
          label: 'Bỏ e. trước department_id ở vế phải',
          sql: {
            mysql:
              'SELECT e.first_name, e.last_name, e.department_id, e.salary\nFROM employees e\nWHERE e.salary > (\n  SELECT AVG(salary)\n  FROM employees\n  WHERE department_id = department_id\n)\nORDER BY e.department_id, e.salary DESC;',
            oracle:
              'SELECT e.first_name, e.last_name, e.department_id, e.salary\nFROM employees e\nWHERE e.salary > (\n  SELECT AVG(salary)\n  FROM employees\n  WHERE department_id = department_id\n)\nORDER BY e.department_id, e.salary DESC',
          },
        },
        {
          label: 'Hiện trung bình phòng ở mỗi row bằng subquery trong SELECT',
          sql: {
            mysql:
              'SELECT e.first_name, e.last_name, e.department_id, e.salary,\n  (SELECT AVG(salary)\n   FROM employees\n   WHERE department_id = e.department_id) AS dept_avg\nFROM employees e\nORDER BY e.department_id, e.salary DESC;',
            oracle:
              'SELECT e.first_name, e.last_name, e.department_id, e.salary,\n  (SELECT AVG(salary)\n   FROM employees\n   WHERE department_id = e.department_id) AS dept_avg\nFROM employees e\nORDER BY e.department_id, e.salary DESC',
          },
        },
      ],
      say: 'Có 13 người lương trên mức phòng mình. Phòng 10 chỉ có Khoa vượt. Hai người chưa thuộc phòng nào không có mặt, vì phòng NULL thì subquery không tìm được row nào.',
    },
    {
      type: 'text',
      title: 'Bẫy quên alias, và subquery trong danh sách SELECT',
      paragraphs: [
        'Mục thứ ba ở khối thử tay bỏ `e.` và chỉ ra 10 người, không phải 13. Đây là bẫy hay gặp.',
        'Trong subquery, tên column không có alias được hiểu là column của table nằm trong subquery. Vì vậy `department_id = department_id` so một column với chính nó.',
        'Điều kiện đó đúng với mọi row có phòng. Subquery tính trung bình của mọi người có phòng và không còn theo phòng của `e`. Luôn viết alias cho column của query ngoài.',
        'Subquery phụ thuộc cũng đứng được trong danh sách SELECT, như mục cuối ở khối thử tay. Mỗi row ngoài nhận một giá trị tính riêng.',
        'Khối kế tiếp đếm nhân viên của từng phòng bằng cách đó. Phòng 80 chưa có ai.',
        'Với phòng trống, `COUNT(*)` cho 0, còn `MAX(salary)` cho NULL. COUNT đếm được 0 row, nhưng MAX không có số nào để chọn.',
      ],
    },
    {
      type: 'playground',
      title: 'Đếm nhân viên từng phòng',
      intro: 'Bấm Chạy. Mỗi phòng nhận một con số do subquery tính.',
      database: 'company',
      tables: ['departments', 'employees'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: head('COUNT(*)', '', '', ';'), oracle: head('COUNT(*)', '', '', '') },
      tries: [
        {
          label: 'Đổi COUNT(*) thành MAX(e.salary)',
          sql: { mysql: head('MAX(e.salary)', '', '', ';'), oracle: head('MAX(e.salary)', '', '', '') },
        },
        {
          label: 'Chỉ đếm người lương trên 20 triệu',
          sql: {
            mysql: head('COUNT(*)', '\n     AND e.salary > 20000000', '', ';'),
            oracle: head('COUNT(*)', '\n     AND e.salary > 20000000', '', ''),
          },
        },
        {
          label: 'Chỉ xem các phòng ở địa điểm 1000',
          sql: {
            mysql: head('COUNT(*)', '', '\nWHERE d.location_id = 1000', ';'),
            oracle: head('COUNT(*)', '', '\nWHERE d.location_id = 1000', ''),
          },
        },
      ],
      say: 'Phòng Nghiên cứu và phát triển chưa có ai: COUNT cho 0. Đổi sang MAX thì phòng đó hiện NULL, vì không có lương nào để chọn.',
    },
    {
      type: 'oracle',
      body: [
        'Subquery phụ thuộc chạy giống nhau ở cả hai dialect.',
        'Khác biệt nằm ở alias của table. MySQL cho viết `employees AS e`. Oracle cấm chữ AS trước alias của table và báo ORA-00933.',
        'Alias của column thì cả hai dialect đều cho viết AS, như `AS dept_avg`.',
        'Viết `employees e` không có AS chạy được ở cả hai dialect.',
      ],
      mysql:
        'SELECT e.first_name, e.salary\nFROM employees AS e\nWHERE e.salary > (\n  SELECT AVG(salary)\n  FROM employees\n  WHERE department_id = e.department_id\n);',
      oracle:
        'SELECT e.first_name, e.salary\nFROM employees e\nWHERE e.salary > (\n  SELECT AVG(salary)\n  FROM employees\n  WHERE department_id = e.department_id\n)',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Subquery nào là subquery phụ thuộc?',
          options: [
            { text: '`(SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)`', correct: true, feedback: 'Đúng. Subquery nhắc tới `e.department_id`, một column của query ngoài.' },
            { text: '`(SELECT AVG(salary) FROM employees)`', feedback: 'Subquery này đứng riêng. Không có column nào của query ngoài.' },
            { text: '`(SELECT MAX(order_id) FROM orders)`', feedback: 'Subquery này cũng đứng riêng, chỉ đọc table orders.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query ngoài có 40 row và dùng subquery phụ thuộc. Subquery được hỏi bao nhiêu lần?',
          options: [
            { text: '40 lần, mỗi row ngoài một lần', correct: true, feedback: 'Đúng. Mỗi row ngoài đưa một giá trị khác xuống subquery.' },
            { text: '1 lần', feedback: 'Một lần là của subquery đứng riêng. Subquery phụ thuộc cần giá trị của từng row ngoài.' },
            { text: '8 lần, mỗi phòng một lần', feedback: 'Subquery không gom theo phòng. Subquery trả lời cho từng row của query ngoài.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Trong subquery bạn viết `WHERE department_id = department_id`, không có alias. Chuyện gì xảy ra?',
          options: [
            { text: 'Cả hai vế đều là column của table trong subquery, nên điều kiện luôn đúng', correct: true, feedback: 'Đúng. Subquery không còn nhìn vào row ngoài, và kết quả sai mà không báo lỗi.' },
            { text: 'Database báo lỗi', feedback: 'Database không báo lỗi. Cú pháp hợp lệ, chỉ là nghĩa khác điều bạn muốn.' },
            { text: 'Database hiểu vế phải là phòng của query ngoài', feedback: 'Database không đoán. Tên không có alias thuộc table gần nhất, tức table trong subquery.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Khoản chi cao bất thường theo từng phòng',
      paragraphs: [
        'Một bộ phận kiểm toán muốn tìm các khoản chi cao hơn mức trung bình của chính phòng đã chi.',
        'Mỗi phòng có mức chi trung bình khác nhau, nên một ngưỡng chung không dùng được.',
        'Họ viết subquery phụ thuộc: mỗi khoản chi được so với trung bình của phòng chứa khoản chi đó.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Subquery phụ thuộc nhắc tới column của query ngoài, nên chạy lại với mỗi row ngoài.',
        'Đặt alias cho table ngoài (`FROM employees e`) và viết `e.department_id` trong subquery. Thiếu alias thì subquery so column với chính nó.',
        'Subquery phụ thuộc đứng được ở WHERE và ở danh sách SELECT.',
        'Oracle không cho viết AS trước alias của table. MySQL cho phép.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, Topic: Subqueries', url: 'https://sqlbolt.com/topic/subqueries' },
        { name: 'MySQL 8.0 Reference Manual, Correlated Subqueries', url: 'https://dev.mysql.com/doc/refman/8.0/en/correlated-subqueries.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Using Subqueries', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Using-Subqueries.html' },
      ],
    },
  ],
};
