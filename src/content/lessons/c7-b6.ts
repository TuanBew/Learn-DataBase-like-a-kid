import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b6',
  chapter: 7,
  order: 6,
  title: 'Self join: nhân viên và người quản lý',
  lead: 'Bạn nối một table với chính nó để ghép mỗi nhân viên với sếp của họ.',
  minutes: 16,
  goals: [
    'Đặt hai alias cho cùng một table',
    'Ghép nhân viên với sếp bằng ON e.manager_id = m.employee_id',
    'Giữ người không có sếp bằng LEFT JOIN',
    'Tìm người không có ai báo cáo',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Sơ đồ tổ chức',
      paragraphs: [
        'Anh Tuấn ở phòng hành chính cần in sơ đồ tổ chức. Mỗi nhân viên phải có tên sếp ở bên cạnh.',
        'Table employees có column `manager_id`. Column này ghi mã của sếp, không ghi tên.',
        'Tên sếp nằm ngay trong table employees, vì sếp cũng là một nhân viên.',
        'Bi cần tra tên trong chính table đang đọc. Bi dùng hai bản của table employees: một bản cho nhân viên, một bản cho sếp.',
      ],
    },
    {
      type: 'text',
      title: 'Một table, hai alias',
      paragraphs: [
        '**[[self-join]]** nối một table với chính nó. Bạn dùng self join khi table có column trỏ về primary key của chính table đó.',
        'Table employees là một **[[self-reference]]**: `manager_id` trỏ tới `employee_id`.',
        'Bạn gọi table employees hai lần, mỗi lần một alias. Ví dụ `e` là nhân viên, `m` là sếp.',
        'Database coi `e` và `m` là hai table riêng, dù cả hai đọc cùng dữ liệu.',
        'Điều kiện ghép là `ON e.manager_id = m.employee_id`. Đọc là: mã sếp của e bằng mã nhân viên của m.',
        'Alias là bắt buộc. Thiếu alias, database không biết `employees.last_name` thuộc bản nào. MySQL báo lỗi 1066. Oracle báo ORA-00918.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nhân viên và sếp',
      intro: 'Bấm Chạy. Query ghép 8 nhân viên đầu tiên với sếp của họ.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT e.employee_id, e.last_name AS nhan_vien,\n       m.employee_id AS ma_sep, m.last_name AS sep\nFROM employees e\nINNER JOIN employees m\n  ON e.manager_id = m.employee_id\nWHERE e.employee_id <= 108\nORDER BY e.employee_id',
      ),
      tries: [
        {
          label: 'Đổi INNER JOIN thành LEFT JOIN',
          sql: both(
            'SELECT e.employee_id, e.last_name AS nhan_vien,\n       m.employee_id AS ma_sep, m.last_name AS sep\nFROM employees e\nLEFT JOIN employees m\n  ON e.manager_id = m.employee_id\nWHERE e.employee_id <= 108\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'LEFT JOIN, đổi WHERE thành WHERE m.employee_id IS NULL',
          sql: both(
            'SELECT e.employee_id, e.last_name\nFROM employees e\nLEFT JOIN employees m\n  ON e.manager_id = m.employee_id\nWHERE m.employee_id IS NULL',
          ),
        },
        {
          label: 'Thêm một tầng: sếp của sếp, với alias g',
          sql: both(
            'SELECT e.last_name AS nhan_vien, m.last_name AS sep,\n       g.last_name AS sep_cua_sep\nFROM employees e\nINNER JOIN employees m\n  ON e.manager_id = m.employee_id\nINNER JOIN employees g\n  ON m.manager_id = g.employee_id\nWHERE e.employee_id IN (105, 118, 129)\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Đếm số người báo cáo của mỗi sếp',
          sql: both(
            'SELECT m.employee_id, m.last_name AS sep,\n       COUNT(e.employee_id) AS so_nguoi\nFROM employees m\nINNER JOIN employees e\n  ON e.manager_id = m.employee_id\nGROUP BY m.employee_id, m.last_name\nORDER BY so_nguoi DESC, m.employee_id',
          ),
        },
      ],
      say: 'Công ty có hai người tên Hùng, nên row của nhân viên 105 ghi sếp là Hùng. Nhìn mã để phân biệt họ.',
    },
    {
      type: 'text',
      title: 'Giữ người không có sếp',
      paragraphs: [
        'Nhân viên 100 đứng đầu công ty, nên `manager_id` của người đó là NULL.',
        'INNER JOIN làm người đó rơi mất: 39 row thay vì 40.',
        'LEFT JOIN giữ người đó lại, và để tên sếp là NULL.',
        'Muốn liệt kê người không có sếp, thêm `WHERE m.employee_id IS NULL`. Bạn đã dùng cách này ở bài LEFT JOIN.',
      ],
    },
    {
      type: 'text',
      title: 'Đảo chiều: ai không có ai báo cáo',
      paragraphs: [
        'Giờ đổi câu hỏi: người nào không là sếp của ai?',
        'Alias `r` là người báo cáo. Điều kiện ghép đảo lại: `ON r.manager_id = e.employee_id`.',
        'LEFT JOIN giữ mọi nhân viên `e`. Người nào không có ai báo cáo thì bên `r` là NULL.',
        'Trong công ty này, 32 trên 40 người không có ai báo cáo.',
      ],
    },
    {
      type: 'playground',
      title: 'Ai không có ai báo cáo trong phòng 30?',
      intro: 'Bấm Chạy. Query giữ mọi nhân viên phòng 30, rồi chỉ hiện người có `r` là NULL.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT e.employee_id, e.last_name, e.department_id\nFROM employees e\nLEFT JOIN employees r\n  ON r.manager_id = e.employee_id\nWHERE r.employee_id IS NULL\n  AND e.department_id = 30\nORDER BY e.employee_id',
      ),
      tries: [
        {
          label: 'Đổi 30 thành 40',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.department_id\nFROM employees e\nLEFT JOIN employees r\n  ON r.manager_id = e.employee_id\nWHERE r.employee_id IS NULL\n  AND e.department_id = 40\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Đổi IS NULL thành IS NOT NULL',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.department_id\nFROM employees e\nLEFT JOIN employees r\n  ON r.manager_id = e.employee_id\nWHERE r.employee_id IS NOT NULL\n  AND e.department_id = 30\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Bỏ điều kiện về phòng',
          sql: both(
            'SELECT e.employee_id, e.last_name, e.department_id\nFROM employees e\nLEFT JOIN employees r\n  ON r.manager_id = e.employee_id\nWHERE r.employee_id IS NULL\nORDER BY e.employee_id',
          ),
        },
      ],
      say: 'Mục IS NOT NULL ra 6 row của cùng một người, vì Bảo có sáu người báo cáo. Mỗi người báo cáo thêm một row. Bài "Bẫy nhân bội row" nói tiếp chuyện này.',
    },
    {
      type: 'oracle',
      body: [
        'Self join chạy giống nhau ở cả hai dialect.',
        'Oracle không nhận AS trước alias của table. Viết `employees m`, không viết `employees AS m`.',
        'Thiếu alias thì cả hai dialect báo lỗi. MySQL báo 1066, Oracle báo ORA-00918.',
        'Oracle còn có `CONNECT BY` để đi lên cả chuỗi sếp trong một query. Bài này chưa dạy.',
      ],
      mysql: 'FROM employees AS e\nINNER JOIN employees AS m\n  ON e.manager_id = m.employee_id',
      oracle: 'FROM employees e\nINNER JOIN employees m\n  ON e.manager_id = m.employee_id',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Vì sao self join bắt buộc phải có alias?',
          options: [
            {
              text: 'Để database phân biệt hai bản của cùng một table',
              correct: true,
              feedback: 'Đúng. Có `e` và `m`, mỗi column biết nó thuộc bản nào.',
            },
            { text: 'Để query chạy nhanh hơn', feedback: 'Alias chỉ đặt tên. Alias không làm query nhanh hơn.' },
            { text: 'Vì tên employees quá dài', feedback: 'Tên dài không bắt buộc alias. Alias bắt buộc vì hai bản trùng tên.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn INNER JOIN employees e với employees m bằng `e.manager_id = m.employee_id`. Người đứng đầu, có `manager_id` là NULL, ra sao?',
          options: [
            { text: 'Rơi khỏi kết quả', correct: true, feedback: 'Đúng. NULL không bằng mã nào, nên row không ghép được. Muốn giữ người đó, dùng LEFT JOIN.' },
            { text: 'Vẫn hiện, tên sếp để NULL', feedback: 'LEFT JOIN làm vậy. INNER JOIN bỏ row không ghép được.' },
            { text: 'Database báo lỗi', feedback: 'Không có lỗi. Row không ghép được chỉ rơi ra ngoài.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn LEFT JOIN `employees e` với `employees r ON r.manager_id = e.employee_id`. Điều kiện nào tìm người không có ai báo cáo?',
          options: [
            { text: '`WHERE r.employee_id IS NULL`', correct: true, feedback: 'Đúng. Không có người báo cáo thì bên r không ghép được, và mọi column của r là NULL.' },
            { text: '`WHERE e.manager_id IS NULL`', feedback: 'Điều kiện này tìm người không có sếp, không phải người không có ai báo cáo.' },
            { text: '`WHERE r.employee_id = NULL`', feedback: 'So bằng với NULL không bao giờ đúng. Dùng IS NULL.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Ai duyệt chi phí của ai',
      paragraphs: [
        'Hệ thống duyệt chi phí cần biết sếp của người gửi đơn. Table nhân viên có column mã quản lý.',
        'Hệ thống dùng self join để lấy tên và email của người duyệt. Cần duyệt thêm một cấp thì nối thêm một lần nữa.',
        'Nhân viên cấp cao nhất không có sếp. Query dùng LEFT JOIN để đơn của họ không biến mất.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Self join nối một table với chính nó. Bạn đặt hai alias, ví dụ `e` cho nhân viên và `m` cho sếp.',
        'Điều kiện ghép nhân viên với sếp: `ON e.manager_id = m.employee_id`.',
        'INNER JOIN làm người không có sếp rơi mất. LEFT JOIN giữ lại, kèm NULL ở bên sếp.',
        'Đảo điều kiện thành `ON r.manager_id = e.employee_id` rồi lọc `r` là NULL để tìm người không có ai báo cáo.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'oracle-samples/db-sample-schemas (schema HR)', url: 'https://github.com/oracle-samples/db-sample-schemas', note: 'MIT' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
      ],
    },
  ],
};
