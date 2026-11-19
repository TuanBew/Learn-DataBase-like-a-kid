import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c7-b5',
  chapter: 7,
  order: 5,
  title: 'Nhiệm vụ cuối: báo cáo bằng Oracle SQL',
  lead: 'Bạn làm một báo cáo nhân sự hoàn chỉnh bằng Oracle SQL, trên database hr.',
  minutes: 18,
  goals: [
    'Nối departments với employees bằng LEFT JOIN',
    'Gom nhóm để đếm người và tính lương trung bình',
    'Tránh bẫy COUNT(*) khi dùng LEFT JOIN',
    'Biết chạy lại các query này trên Oracle thật',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Sếp cần một báo cáo',
      paragraphs: [
        'Sáng thứ Hai, sếp nhắn bạn: "Cho mình số nhân viên và lương trung bình của từng phòng ban."',
        'Dữ liệu nằm ở hai table. Table employees giữ nhân viên. Table departments giữ tên phòng.',
        'Phòng nào chưa có ai cũng phải hiện trong báo cáo, với số người là 0.',
        'Bạn có đủ đồ nghề: JOIN, LEFT JOIN, GROUP BY và các function gom. Bi ngồi cạnh bạn, và lần này bạn viết bằng Oracle SQL.',
      ],
    },
    {
      type: 'text',
      title: 'Nhìn qua database hr',
      paragraphs: [
        'Database hr là một công ty nhỏ. Database này có bốn table: `employees`, `departments`, `jobs` và `locations`.',
        'Mỗi nhân viên có `department_id`, trỏ tới phòng của họ. Query dưới đây dùng hai table đầu.',
        'Khởi động bằng query mẫu. Đọc nó từ trên xuống dưới.',
      ],
    },
    {
      type: 'playground',
      title: 'Báo cáo nhân sự theo phòng ban',
      intro: 'Bấm Chạy. Query đếm người và tính lương trung bình của từng phòng, kể cả phòng chưa có ai.',
      database: 'hr',
      tables: ['employees', 'departments'],
      dialects: ['oracle'],
      sql: {
        oracle:
          'SELECT d.department_name,\n       COUNT(e.employee_id) AS headcount,\n       ROUND(AVG(e.salary)) AS avg_salary\nFROM departments d\nLEFT JOIN employees e\n  ON e.department_id = d.department_id\nGROUP BY d.department_name\nORDER BY d.department_name',
      },
      tries: [
        {
          label: 'Đổi LEFT JOIN thành JOIN',
          sql: {
            oracle:
              'SELECT d.department_name,\n       COUNT(e.employee_id) AS headcount,\n       ROUND(AVG(e.salary)) AS avg_salary\nFROM departments d\nJOIN employees e\n  ON e.department_id = d.department_id\nGROUP BY d.department_name\nORDER BY d.department_name',
          },
        },
        {
          label: 'Đổi COUNT(e.employee_id) thành COUNT(*)',
          sql: {
            oracle:
              'SELECT d.department_name,\n       COUNT(*) AS headcount,\n       ROUND(AVG(e.salary)) AS avg_salary\nFROM departments d\nLEFT JOIN employees e\n  ON e.department_id = d.department_id\nGROUP BY d.department_name\nORDER BY d.department_name',
          },
        },
        {
          label: 'Đổi ORDER BY d.department_name thành ORDER BY headcount DESC',
          sql: {
            oracle:
              'SELECT d.department_name,\n       COUNT(e.employee_id) AS headcount,\n       ROUND(AVG(e.salary)) AS avg_salary\nFROM departments d\nLEFT JOIN employees e\n  ON e.department_id = d.department_id\nGROUP BY d.department_name\nORDER BY headcount DESC',
          },
        },
      ],
      say: 'Phòng Treasury hiện với 0 người và lương trung bình NULL. Đổi sang JOIN thì phòng này biến mất.',
    },
    {
      type: 'text',
      title: 'Đọc kết quả',
      paragraphs: [
        'LEFT JOIN đi từ departments sang employees. Mọi phòng đều có mặt, kể cả phòng chưa có nhân viên.',
        'Dùng `COUNT(e.employee_id)` để đếm người. Function này bỏ qua NULL, nên phòng trống ra 0.',
        'Đổi sang `COUNT(*)` thì phòng trống ra 1. LEFT JOIN tạo một row có NULL cho phòng đó, và COUNT(*) đếm row này.',
        'Lương trung bình của phòng trống là NULL, vì không có số nào để lấy trung bình.',
        'Còn một người chưa thuộc phòng nào: Kimberely Grant, có department_id là NULL. LEFT JOIN giữ mọi phòng, không giữ mọi nhân viên, nên người này không xuất hiện trong báo cáo.',
        'Muốn thấy người này, đi từ employees sang departments. Viết thử query đó trong editor.',
      ],
    },
    {
      type: 'text',
      title: 'Chạy lại trên Oracle thật',
      paragraphs: [
        'Schema HR có sẵn trên Oracle FreeSQL, tại https://freesql.com. Các query này chạy lại được trên Oracle thật.',
        'Bộ dữ liệu trong khóa là bản rút gọn, chỉ có 25 nhân viên. Bản đầy đủ có nhiều nhân viên hơn, nên con số trong báo cáo sẽ khác.',
        'Cú pháp thì giữ nguyên. Nếu query chạy ở đây, nó chạy ở đó.',
        'Khóa này dạy theo Oracle 19c. FreeSQL cho chọn bản 19c hoặc 26ai.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Vì sao báo cáo bắt đầu từ departments và dùng LEFT JOIN sang employees?',
          options: [
            { text: 'Để phòng chưa có nhân viên vẫn hiện trong báo cáo', correct: true, feedback: 'Đúng. LEFT JOIN giữ mọi row của table bên trái, tức mọi phòng.' },
            { text: 'Để Oracle chạy nhanh hơn', feedback: 'Lý do là kết quả, không phải tốc độ. INNER JOIN sẽ làm mất phòng trống.' },
            { text: 'Vì Oracle không có INNER JOIN', feedback: 'Oracle có INNER JOIN. Ta chọn LEFT JOIN để giữ phòng trống.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Phòng Treasury chưa có ai. Bạn dùng `COUNT(*)` sau LEFT JOIN. Treasury ra bao nhiêu người?',
          options: [
            { text: '1, vì COUNT(*) đếm cả row NULL do LEFT JOIN tạo ra', correct: true, feedback: 'Đúng. Muốn ra 0, đếm một column của employees, như COUNT(e.employee_id).' },
            { text: '0', feedback: 'COUNT(e.employee_id) mới ra 0. COUNT(*) đếm mọi row, kể cả row toàn NULL.' },
            { text: 'NULL', feedback: 'COUNT không bao giờ trả NULL. COUNT trả một con số.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy lại query trên FreeSQL và thấy con số khác. Vì sao?',
          options: [
            { text: 'Bộ dữ liệu trong khóa là bản rút gọn 25 nhân viên', correct: true, feedback: 'Đúng. Cú pháp giống nhau, chỉ khác lượng dữ liệu.' },
            { text: 'Query của bạn viết sai', feedback: 'Query vẫn đúng. Hai nơi chỉ khác dữ liệu.' },
            { text: 'FreeSQL tính COUNT khác', feedback: 'COUNT làm đúng như nhau ở mọi nơi. Khác biệt nằm ở dữ liệu.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo cuối tháng của bộ phận nhân sự',
      paragraphs: [
        'Bộ phận nhân sự thường cần số người và mức lương theo từng phòng ban.',
        'Người viết báo cáo nối table nhân viên với table phòng ban, rồi gom nhóm. Đó chính là query bạn vừa chạy.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Báo cáo theo nhóm thường cần JOIN trước, GROUP BY sau.',
        'LEFT JOIN từ table danh sách giữ được cả phòng chưa có ai.',
        'COUNT(column) bỏ qua NULL. COUNT(*) đếm mọi row.',
        'Schema HR có trên Oracle FreeSQL, nên query ở đây chạy lại được trên Oracle thật.',
      ],
    },
    {
      type: 'text',
      title: 'Học tiếp',
      paragraphs: [
        'Bạn đã đi hết khóa này. Bạn biết đọc dữ liệu, ghép table, và sửa dữ liệu an toàn.',
        'Trang Học tiếp, ở đường dẫn /hoc-tiep, liệt kê nơi luyện thêm. Mỗi nơi kèm một câu nói khi nào nên tới.',
        'Mở trang đó và chọn nơi hợp với bạn.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 7: OUTER JOINs', url: 'https://sqlbolt.com/lesson/select_queries_with_outer_joins' },
        { name: 'oracle-samples/db-sample-schemas', url: 'https://github.com/oracle-samples/db-sample-schemas', note: 'MIT' },
      ],
    },
  ],
};
