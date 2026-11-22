import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b4',
  chapter: 7,
  order: 4,
  title: 'RIGHT JOIN và FULL OUTER JOIN',
  lead: 'Bạn giữ row không ghép được ở bên phải, hoặc ở cả hai bên, để đối soát hai danh sách.',
  minutes: 16,
  goals: [
    'Viết RIGHT JOIN và biết nó là LEFT JOIN đảo bên',
    'Dùng FULL OUTER JOIN để giữ row không ghép được của cả hai bên',
    'Đối soát hai danh sách bằng cách đếm row của từng kiểu JOIN',
    'Biết MySQL không có FULL OUTER JOIN và Oracle thì có',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hai danh sách không khớp nhau',
      paragraphs: [
        'Chị Hạnh ở phòng nhân sự giữ hai danh sách. Danh sách thứ nhất là 40 nhân viên. Danh sách thứ hai là 8 phòng ban.',
        'Cuối tháng chị hỏi Bi: "Có nhân viên nào chưa được xếp vào phòng không? Có phòng nào chưa có ai không?"',
        'Bi dùng LEFT JOIN và tìm được nhân viên chưa có phòng. Nhưng một câu hỏi chỉ nhìn được một phía.',
        'Muốn nhìn cả hai phía cùng lúc, Bi cần một kiểu JOIN mới.',
      ],
    },
    {
      type: 'text',
      title: 'RIGHT JOIN: LEFT JOIN đảo bên',
      paragraphs: [
        '**[[right-join]]** giữ mọi row của table bên phải. Row nào không ghép được thì column bên trái là NULL.',
        'Table bên phải là table đứng sau chữ JOIN. Đó là cách đọc ngược của LEFT JOIN.',
        '`a LEFT JOIN b` và `b RIGHT JOIN a` cho cùng kết quả. Bạn chỉ đổi chỗ hai table.',
        'Nhiều người chỉ viết LEFT JOIN và xếp table cần giữ lên trước. Bạn vẫn cần đọc được RIGHT JOIN, vì code của người khác có nó.',
        'Query dưới đây đếm row của một cặp table, qua từng kiểu JOIN. Bắt đầu từ INNER JOIN.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đếm row qua từng kiểu JOIN',
      intro: 'Bấm Chạy. Query nối employees với departments và đếm row. Rồi bấm từng mục bên dưới để đổi kiểu JOIN.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT COUNT(*) AS so_row\nFROM employees e\nINNER JOIN departments d\n  ON e.department_id = d.department_id',
      ),
      tries: [
        {
          label: 'Đổi INNER JOIN thành LEFT JOIN',
          sql: both(
            'SELECT COUNT(*) AS so_row\nFROM employees e\nLEFT JOIN departments d\n  ON e.department_id = d.department_id',
          ),
        },
        {
          label: 'Đổi INNER JOIN thành RIGHT JOIN',
          sql: both(
            'SELECT COUNT(*) AS so_row\nFROM employees e\nRIGHT JOIN departments d\n  ON e.department_id = d.department_id',
          ),
        },
        {
          label: 'RIGHT JOIN, thêm WHERE e.employee_id IS NULL, và chọn tên phòng',
          sql: both(
            'SELECT d.department_id, d.department_name\nFROM employees e\nRIGHT JOIN departments d\n  ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL',
          ),
        },
        {
          label: 'Đảo bên: departments LEFT JOIN employees',
          sql: both(
            'SELECT d.department_id, d.department_name\nFROM departments d\nLEFT JOIN employees e\n  ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL',
          ),
        },
      ],
      say: 'INNER ra 38 row. LEFT thêm 2 nhân viên chưa có phòng, thành 40. RIGHT thêm 1 phòng chưa có ai, thành 39. Mục cuối đảo bên và tìm ra đúng phòng ấy.',
    },
    {
      type: 'text',
      title: 'FULL OUTER JOIN: giữ cả hai bên',
      paragraphs: [
        '**[[full-outer-join]]** giữ mọi row của cả hai table. Row nào không ghép được thì column của bên kia là NULL.',
        'Số row của FULL OUTER JOIN gồm ba phần: row ghép được, row lẻ bên trái, row lẻ bên phải. Ở đây là 38 + 2 + 1 = 41.',
        'Một query FULL OUTER JOIN trả lời cả hai câu hỏi của chị Hạnh. Lọc các row có NULL ở một trong hai bên là ra các điểm không khớp.',
        'Cách làm này gọi là đối soát. Bạn đặt hai danh sách cạnh nhau, rồi tìm chỗ lệch.',
        'FULL OUTER JOIN chỉ chạy ở Oracle. Khối bên dưới chỉ có Oracle.',
      ],
    },
    {
      type: 'playground',
      title: 'Đối soát nhân viên và phòng ban',
      intro: 'Bấm Chạy. Query giữ cả hai bên, rồi chỉ hiện row có NULL ở một bên.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['oracle'],
      sql: {
        oracle:
          'SELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nFULL OUTER JOIN departments d\n  ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL\n   OR d.department_id IS NULL\nORDER BY e.employee_id',
      },
      tries: [
        {
          label: 'Đổi SELECT thành COUNT(*) và bỏ WHERE, ORDER BY',
          sql: {
            oracle:
              'SELECT COUNT(*) AS so_row\nFROM employees e\nFULL OUTER JOIN departments d\n  ON e.department_id = d.department_id',
          },
        },
        {
          label: 'Bỏ chữ OUTER, chỉ viết FULL JOIN',
          sql: {
            oracle:
              'SELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nFULL JOIN departments d\n  ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL\n   OR d.department_id IS NULL\nORDER BY e.employee_id',
          },
        },
        {
          label: 'Chỉ giữ phòng chưa có ai: bỏ OR, đổi thành WHERE e.employee_id IS NULL',
          sql: {
            oracle:
              'SELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nFULL OUTER JOIN departments d\n  ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL',
          },
        },
        {
          label: 'Chỉ giữ nhân viên chưa có phòng: WHERE d.department_id IS NULL',
          sql: {
            oracle:
              'SELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nFULL OUTER JOIN departments d\n  ON e.department_id = d.department_id\nWHERE d.department_id IS NULL',
          },
        },
      ],
      say: 'Ba row lẻ: nhân viên 138 và 139 chưa có phòng, và phòng 80 chưa có nhân viên. Một query tìm được cả hai loại.',
    },
    {
      type: 'oracle',
      body: [
        'Oracle viết `FULL OUTER JOIN`, hoặc ngắn hơn là `FULL JOIN`. Hai cách cho cùng kết quả.',
        'MySQL không có FULL OUTER JOIN. Bạn viết nó ra thì MySQL báo lỗi 1064.',
        'Ở MySQL, bạn ghép LEFT JOIN và RIGHT JOIN bằng **[[union]]**. LEFT JOIN giữ row bên trái. RIGHT JOIN giữ row bên phải. UNION gộp hai kết quả rồi bỏ row trùng.',
        'Kết quả giống FULL OUTER JOIN của Oracle. Chương 8 dạy UNION, nên bài này chỉ cho bạn xem câu mẫu.',
        'RIGHT JOIN và LEFT JOIN thì chạy giống nhau ở cả hai dialect, như khối đầu bài.',
      ],
      mysql:
        '-- Chương 8 dạy UNION\nSELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nLEFT JOIN departments d\n  ON e.department_id = d.department_id\nUNION\nSELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nRIGHT JOIN departments d\n  ON e.department_id = d.department_id;',
      oracle:
        'SELECT e.employee_id, e.last_name, d.department_id, d.department_name\nFROM employees e\nFULL OUTER JOIN departments d\n  ON e.department_id = d.department_id',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: '`employees e RIGHT JOIN departments d ON ...` giữ mọi row của table nào?',
          options: [
            { text: 'departments, đứng bên phải', correct: true, feedback: 'Đúng. RIGHT JOIN giữ table đứng sau chữ JOIN.' },
            { text: 'employees, đứng bên trái', feedback: 'Giữ bên trái là LEFT JOIN. RIGHT JOIN giữ bên phải, tức departments.' },
            { text: 'Cả hai table', feedback: 'Giữ cả hai bên là FULL OUTER JOIN.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Một cặp table có 38 row ghép được, 2 row lẻ bên trái và 1 row lẻ bên phải. FULL OUTER JOIN ra bao nhiêu row?',
          options: [
            { text: '41', correct: true, feedback: 'Đúng. 38 + 2 + 1 = 41.' },
            { text: '38', feedback: '38 là số row của INNER JOIN. FULL OUTER JOIN giữ thêm row lẻ của cả hai bên.' },
            { text: '40', feedback: '40 là kết quả của LEFT JOIN. Còn thiếu 1 row lẻ bên phải.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Công ty bạn dùng MySQL. Bạn cần giữ row không ghép được của cả hai bên. Làm thế nào?',
          options: [
            {
              text: 'Ghép LEFT JOIN và RIGHT JOIN bằng UNION',
              correct: true,
              feedback: 'Đúng. MySQL không có FULL OUTER JOIN, nên người ta ghép hai JOIN lại.',
            },
            { text: 'Viết FULL OUTER JOIN như Oracle', feedback: 'MySQL báo lỗi 1064. Chữ FULL ở đó không phải JOIN.' },
            { text: 'Viết INNER JOIN rồi thêm IS NULL', feedback: 'INNER JOIN đã bỏ row không ghép được từ đầu, nên không còn row nào để lọc.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Đối soát hai nguồn số liệu',
      paragraphs: [
        'Bộ phận kế toán có danh sách hóa đơn đã thu tiền. Phòng kinh doanh có danh sách đơn đã giao. Cuối tháng hai danh sách phải khớp nhau.',
        'Người làm báo cáo nối hai danh sách bằng FULL OUTER JOIN theo mã đơn. Đơn nào chỉ có ở một bên thì có NULL ở bên kia.',
        'Các row có NULL cho họ biết hai điều. Đơn nào đã giao mà chưa thu tiền. Hóa đơn nào chưa có đơn.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'RIGHT JOIN giữ mọi row bên phải. `a LEFT JOIN b` và `b RIGHT JOIN a` cho cùng kết quả.',
        'FULL OUTER JOIN giữ row không ghép được của cả hai bên. Đếm row: ghép được, cộng lẻ trái, cộng lẻ phải.',
        'Đối soát hai danh sách: FULL OUTER JOIN rồi lọc row có NULL ở một bên.',
        'Oracle có FULL OUTER JOIN. MySQL không có, nên ghép LEFT JOIN và RIGHT JOIN bằng UNION.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 7: OUTER JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_outer_joins' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
      ],
    },
  ],
};
