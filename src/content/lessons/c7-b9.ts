import type { Lesson } from '../types';

/** Cùng một query cho hai dialect: MySQL có dấu chấm phẩy cuối, Oracle thì không. */
const both = (q: string) => ({ mysql: `${q};`, oracle: q });

export const lesson: Lesson = {
  id: 'c7-b9',
  chapter: 7,
  order: 9,
  title: 'Đọc code Oracle cũ: dấu phẩy, dấu (+), USING, NATURAL JOIN',
  lead: 'Bạn đọc được các kiểu nối cũ ở công ty, và biết viết lại chúng thành JOIN ... ON.',
  minutes: 18,
  goals: [
    'Đọc kiểu nối bằng dấu phẩy, với điều kiện ghép nằm trong WHERE',
    'Đọc dấu (+) của Oracle để biết bên nào được giữ',
    'Dùng USING khi hai column cùng tên',
    'Biết vì sao nên tránh NATURAL JOIN',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Query của người đi trước',
      paragraphs: [
        'Bi nhận một báo cáo cũ ở công ty. Người viết nó đã nghỉ từ lâu.',
        'Query trong báo cáo không có chữ JOIN nào. FROM có hai table ngăn bằng dấu phẩy, và WHERE có một dấu cộng trong ngoặc.',
        'Oracle vẫn chạy được kiểu viết này. Công ty có hàng trăm query như vậy.',
        'Bi cần đọc hiểu từng kiểu, rồi quyết định giữ nguyên hay viết lại.',
      ],
    },
    {
      type: 'text',
      title: 'Nối bằng dấu phẩy',
      paragraphs: [
        'Kiểu cũ nhất liệt kê các table ở FROM, ngăn bằng dấu phẩy. Điều kiện ghép nằm trong WHERE.',
        '`FROM employees e, departments d WHERE e.department_id = d.department_id` cho cùng kết quả với INNER JOIN.',
        'Điều kiện ghép và điều kiện lọc nằm lẫn trong một WHERE. Query dài thì khó thấy cặp table nào ghép với nhau.',
        'Quên điều kiện ghép thì database ghép mọi cặp. Đó là tích Descartes, giống CROSS JOIN. Nhân viên và phòng ban: 40 × 8 = 320 row.',
        'Khi đọc query cũ, hãy đếm. Nối n table cần ít nhất n − 1 điều kiện ghép.',
      ],
    },
    {
      type: 'text',
      title: 'USING và NATURAL JOIN',
      paragraphs: [
        '**[[using]]** thay cho ON khi hai table có column cùng tên: `JOIN departments d USING (department_id)`.',
        'USING gọn hơn ON. Với `SELECT *`, column trong USING chỉ hiện một lần.',
        '**[[natural-join]]** còn gọn hơn: bạn không viết gì cả. Database tự nối theo mọi column cùng tên ở hai table.',
        'NATURAL JOIN gây lỗi âm thầm. Hai table có thể trùng thêm column mà bạn không để ý.',
        'employees và departments trùng cả `department_id` lẫn `manager_id`. NATURAL JOIN đòi cả hai cùng bằng nhau.',
        'Kết quả chỉ có 29 row, thay vì 38 row của INNER JOIN. Database không báo lỗi nào.',
        'Thêm một column mới vào table có thể đổi kết quả của query NATURAL JOIN đã chạy nhiều năm.',
        'Vì vậy hãy tránh NATURAL JOIN. Khi đọc code cũ có nó, kiểm xem hai table trùng những column nào.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: một cặp table, nhiều cách viết',
      intro: 'Bấm Chạy. Query nối kiểu dấu phẩy, ra ba nhân viên cuối. Rồi bấm từng mục để xem các cách viết khác.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['mysql', 'oracle'],
      sql: both(
        'SELECT e.employee_id, e.last_name, d.department_name\nFROM employees e, departments d\nWHERE e.department_id = d.department_id\n  AND e.employee_id >= 135\nORDER BY e.employee_id',
      ),
      tries: [
        {
          label: 'Viết lại bằng JOIN ... ON',
          sql: both(
            'SELECT e.employee_id, e.last_name, d.department_name\nFROM employees e\nJOIN departments d\n  ON e.department_id = d.department_id\nWHERE e.employee_id >= 135\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Quên điều kiện ghép: chỉ giữ WHERE e.employee_id = 135',
          sql: both(
            'SELECT e.employee_id, e.last_name, d.department_name\nFROM employees e, departments d\nWHERE e.employee_id = 135\nORDER BY d.department_id',
          ),
        },
        {
          label: 'Viết lại bằng USING',
          sql: both(
            'SELECT department_id, e.employee_id, e.last_name, d.department_name\nFROM employees e\nJOIN departments d USING (department_id)\nWHERE e.employee_id >= 135\nORDER BY e.employee_id',
          ),
        },
        {
          label: 'Viết lại bằng NATURAL JOIN',
          sql: both(
            'SELECT employee_id, last_name, department_name\nFROM employees e\nNATURAL JOIN departments d\nWHERE employee_id >= 135\nORDER BY employee_id',
          ),
        },
      ],
      say: 'Mục NATURAL JOIN ra 0 row. Nhân viên 135 có sếp 102, còn phòng 70 chưa có trưởng phòng, nên manager_id không bằng nhau.',
    },
    {
      type: 'text',
      title: 'Dấu (+) của Oracle',
      paragraphs: [
        'Trước khi Oracle có LEFT JOIN, người ta viết nối ngoài bằng dấu `(+)` trong WHERE.',
        'Dấu (+) đứng cạnh column của table có thể thiếu row. Bên còn lại được giữ đủ.',
        '`WHERE d.department_id = e.department_id(+)` đọc là: giữ mọi phòng d, và ghép nhân viên e nếu có. Đó là `departments d LEFT JOIN employees e`.',
        'Điều kiện lọc trên table có dấu (+) cũng phải mang dấu (+). Viết `e.salary(+) > 20000000` thì phòng không có người lương cao vẫn được giữ.',
        'Quên dấu (+) ở điều kiện lọc thì điều kiện ấy chạy sau khi nối. Row của bên được giữ sẽ mất.',
        'Oracle khuyên dùng LEFT JOIN thay cho (+). Query mới nên viết LEFT JOIN.',
        'Dấu (+) có nhiều luật cấm. Bạn không dùng nó chung query với JOIN ... ON (ORA-25156). Bạn cũng không đặt (+) ở cả hai table trong một điều kiện (ORA-01468).',
      ],
    },
    {
      type: 'playground',
      title: 'Dấu (+) giữ phòng chưa có ai',
      intro: 'Bấm Chạy. Khối này chỉ chạy ở Oracle, vì MySQL không có dấu (+).',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['oracle'],
      sql: {
        oracle:
          'SELECT d.department_id, d.department_name, e.employee_id\nFROM departments d, employees e\nWHERE d.department_id = e.department_id(+)\n  AND d.department_id >= 70\nORDER BY d.department_id, e.employee_id',
      },
      tries: [
        {
          label: 'Đổi (+) sang d.department_id, và giữ nhân viên từ 138 trở đi',
          sql: {
            oracle:
              'SELECT d.department_id, d.department_name, e.employee_id\nFROM departments d, employees e\nWHERE d.department_id(+) = e.department_id\n  AND e.employee_id >= 138\nORDER BY e.employee_id',
          },
        },
        {
          label: 'Thêm AND e.employee_id IS NULL để tìm phòng chưa có ai',
          sql: {
            oracle:
              'SELECT d.department_id, d.department_name, e.employee_id\nFROM departments d, employees e\nWHERE d.department_id = e.department_id(+)\n  AND d.department_id >= 70\n  AND e.employee_id IS NULL\nORDER BY d.department_id, e.employee_id',
          },
        },
        {
          label: 'Thêm AND e.salary(+) > 20000000',
          sql: {
            oracle:
              'SELECT d.department_id, d.department_name, e.employee_id\nFROM departments d, employees e\nWHERE d.department_id = e.department_id(+)\n  AND e.salary(+) > 20000000\n  AND d.department_id >= 70\nORDER BY d.department_id, e.employee_id',
          },
        },
        {
          label: 'Thêm AND e.salary > 20000000, quên dấu (+)',
          sql: {
            oracle:
              'SELECT d.department_id, d.department_name, e.employee_id\nFROM departments d, employees e\nWHERE d.department_id = e.department_id(+)\n  AND e.salary > 20000000\n  AND d.department_id >= 70\nORDER BY d.department_id, e.employee_id',
          },
        },
      ],
      say: 'Mục lương có (+) giữ cả hai phòng 70 và 80, kèm NULL. Mục quên (+) ra 0 row: điều kiện lương chạy sau khi nối và xóa hết.',
    },
    {
      type: 'oracle',
      body: [
        'Dấu `(+)` chỉ có ở Oracle. MySQL báo lỗi 1064 khi gặp nó.',
        'USING và NATURAL JOIN có ở cả hai dialect. Chỗ khác nằm ở cách viết tên column.',
        'Oracle không cho viết `alias.column` với column trong USING. Viết `d.department_id` thì Oracle báo ORA-25154. Hãy viết `department_id` một mình.',
        'NATURAL JOIN cũng vậy: column dùng để nối không được có alias đứng trước. Oracle báo ORA-25155. MySQL cho phép.',
        'Oracle không nhận AS trước alias của table, kể cả trong kiểu nối cũ: `FROM employees e, departments d`.',
        'Code mới ở công ty nên viết LEFT JOIN ... ON. Kiểu này chạy được ở cả hai dialect.',
      ],
      mysql: 'SELECT d.department_name, e.employee_id\nFROM departments d\nLEFT JOIN employees e\n  ON d.department_id = e.department_id;',
      oracle:
        '-- Kiểu cũ, chỉ Oracle:\nSELECT d.department_name, e.employee_id\nFROM departments d, employees e\nWHERE d.department_id = e.department_id(+)\n\n-- Kiểu mới, kết quả giống hệt:\nSELECT d.department_name, e.employee_id\nFROM departments d\nLEFT JOIN employees e\n  ON d.department_id = e.department_id',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Query có `FROM a, b WHERE a.id = b.a_id`. Đây là kiểu JOIN nào?',
          options: [
            { text: 'INNER JOIN', correct: true, feedback: 'Đúng. Dấu phẩy kèm điều kiện ghép trong WHERE cho kết quả như INNER JOIN.' },
            { text: 'LEFT JOIN', feedback: 'LEFT JOIN kiểu cũ cần dấu (+) trong điều kiện. Ở đây không có.' },
            { text: 'CROSS JOIN', feedback: 'CROSS JOIN ghép mọi cặp. Ở đây WHERE đã có điều kiện ghép, nên không phải.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn gặp `WHERE x.id = y.id(+)`. Table nào được giữ đủ row?',
          options: [
            { text: 'x', correct: true, feedback: 'Đúng. Dấu (+) nằm ở y, nên y là bên có thể thiếu row. x được giữ đủ.' },
            { text: 'y', feedback: 'Dấu (+) đánh dấu bên có thể thiếu row, không phải bên được giữ.' },
            { text: 'Cả hai', feedback: 'Một điều kiện chỉ cho phép dấu (+) ở một table. Giữ cả hai bên cần FULL OUTER JOIN.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Vì sao nên tránh NATURAL JOIN?',
          options: [
            {
              text: 'Database nối theo mọi column trùng tên, kể cả column bạn không định nối',
              correct: true,
              feedback: 'Đúng. Kết quả đổi âm thầm, và database không báo lỗi.',
            },
            { text: 'Vì MySQL không có NATURAL JOIN', feedback: 'MySQL có NATURAL JOIN. Lý do nằm ở kết quả dễ sai.' },
            { text: 'Vì nó chạy chậm hơn JOIN ... ON', feedback: 'Tốc độ không phải lý do. Lý do là kết quả đổi âm thầm khi hai table trùng thêm column.' },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c7-e13', 'c7-boss'] },
    {
      type: 'realworld',
      title: 'Sửa một báo cáo mười năm tuổi',
      paragraphs: [
        'Một công ty dùng báo cáo viết từ mười năm trước. Query có sáu table ngăn bằng dấu phẩy và ba dấu (+).',
        'Bạn nhận báo cáo và cần thêm một điều kiện lọc. Bạn viết lại thành JOIN ... ON, chạy cả hai bản và so số row.',
        'Hai bản ra cùng số row thì bạn mới thay bản cũ. Kết quả giữ nguyên, còn báo cáo dễ đọc hơn.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        '`FROM a, b WHERE a.x = b.x` là INNER JOIN. Quên điều kiện ghép thì ra tích Descartes.',
        '`WHERE a.x = b.x(+)` là LEFT JOIN: dấu (+) nằm ở bên có thể thiếu row. Dấu (+) chỉ có ở Oracle.',
        'USING nối theo column cùng tên. NATURAL JOIN nối theo mọi column trùng tên, nên dễ sai âm thầm.',
        'Oracle không cho viết alias trước column của USING hoặc NATURAL JOIN. Code mới nên viết JOIN ... ON.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c SQL Language Reference: Joins', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Joins.html' },
        { name: 'MySQL 8.0 Reference Manual: JOIN Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/join.html' },
        { name: 'oracle-samples/db-sample-schemas (schema HR)', url: 'https://github.com/oracle-samples/db-sample-schemas', note: 'MIT' },
      ],
    },
  ],
};
