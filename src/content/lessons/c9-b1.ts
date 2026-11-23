import type { Lesson } from '../types';

const BASE_COLS = `first_name, last_name, department_id, salary`;

const win = (extra: string, end: string) =>
  `SELECT ${BASE_COLS},
  ${extra}
FROM employees
WHERE department_id IN (30, 40)
ORDER BY department_id, salary DESC${end}`;

const AVG_DEPT = 'ROUND(AVG(salary) OVER (PARTITION BY department_id), 0) AS dept_avg';

const grouped = (end: string) =>
  `SELECT department_id, ROUND(AVG(salary), 0) AS dept_avg
FROM employees
WHERE department_id IN (30, 40)
GROUP BY department_id
ORDER BY department_id${end}`;

export const lesson: Lesson = {
  id: 'c9-b1',
  chapter: 9,
  order: 1,
  title: 'Window function: tính trên nhóm mà vẫn giữ từng row',
  lead: 'Bạn đặt con số của cả nhóm cạnh từng row, mà không làm mất row nào.',
  minutes: 15,
  goals: [
    'Phân biệt GROUP BY với window function',
    'Viết OVER () và OVER (PARTITION BY ...)',
    'Đặt trung bình của phòng cạnh lương từng người',
    'Biết window function tính sau WHERE',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Lương của tôi so với phòng thì sao?',
      paragraphs: [
        'Chị Hạnh ở phòng Tài chính hỏi Bi: "Lương của chị so với trung bình phòng thế nào?"',
        'Bi chạy GROUP BY và có ngay con số trung bình của phòng. Nhưng kết quả chỉ còn một row cho mỗi phòng, và tên chị Hạnh biến mất.',
        'Chị cần thấy cả hai: lương của chị và trung bình phòng, nằm cạnh nhau trên cùng một dòng.',
        'Bi cần một cách tính trên nhóm mà không gộp row. Cách đó là window function.',
      ],
    },
    {
      type: 'text',
      title: 'GROUP BY gộp row, window function giữ row',
      paragraphs: [
        '**[[group-by]]** gộp mỗi nhóm còn đúng một row. Tên từng người không còn trong kết quả.',
        '**[[window-function]]** cũng tính trên nhóm. Nhưng nó giữ nguyên từng row và thêm kết quả tính vào một column mới.',
        'Window function luôn đi kèm **[[over]]**. OVER cho database biết nhóm nào cần tính.',
        '`OVER ()` để trống nghĩa là cả kết quả là một nhóm. Mọi row nhận cùng một con số.',
        '**[[partition-by]]** chia row thành nhóm, như GROUP BY. Viết `OVER (PARTITION BY department_id)` thì mỗi phòng là một nhóm.',
        'Function trước OVER có thể là `AVG`, `SUM`, `COUNT`, `MIN` hoặc `MAX`. Bạn đã biết các function này từ Chương 6.',
        'Window function chạy sau WHERE. Row bị WHERE loại thì không tham gia tính.',
        'Khối thử tay đầu tiên dùng hai phòng: Công nghệ thông tin (mã 30) và Tài chính (mã 40).',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lương cạnh trung bình phòng',
      intro: 'Bấm Chạy. Kết quả có 11 row, mỗi người một row. Column dept_avg lặp lại trong cùng phòng.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: win(AVG_DEPT, ';'), oracle: win(AVG_DEPT, '') },
      tries: [
        {
          label: 'Xem bản GROUP BY để so sánh',
          sql: { mysql: grouped(';'), oracle: grouped('') },
        },
        {
          label: 'Đổi sang OVER (): trung bình của cả 11 người',
          sql: {
            mysql: win('ROUND(AVG(salary) OVER (), 0) AS avg_all', ';'),
            oracle: win('ROUND(AVG(salary) OVER (), 0) AS avg_all', ''),
          },
        },
        {
          label: 'Tính chênh lệch so với trung bình phòng',
          sql: {
            mysql: win('salary - ROUND(AVG(salary) OVER (PARTITION BY department_id), 0) AS diff', ';'),
            oracle: win('salary - ROUND(AVG(salary) OVER (PARTITION BY department_id), 0) AS diff', ''),
          },
        },
        {
          label: 'Đổi AVG thành COUNT(*): số người mỗi phòng',
          sql: {
            mysql: win('COUNT(*) OVER (PARTITION BY department_id) AS dept_size', ';'),
            oracle: win('COUNT(*) OVER (PARTITION BY department_id) AS dept_size', ''),
          },
        },
      ],
      say: 'Phòng 30 trung bình 23.833.333 đồng, phòng 40 trung bình 19.000.000 đồng. Chị Hạnh lương 33.000.000, cao hơn trung bình phòng 14.000.000. Với OVER (), mọi người nhận cùng một con số: 21.636.364, trung bình của cả 11 row.',
    },
    {
      type: 'text',
      title: 'Cách viết',
      paragraphs: [
        'Window function nằm trong danh sách SELECT, như một column tính toán. Đặt tên cho nó bằng AS.',
        'PARTITION BY chỉ chia nhóm để tính. Nó không gộp row, nên bạn không cần GROUP BY.',
        'Muốn thấy column nào cạnh con số của nhóm, viết column đó trong SELECT. Với GROUP BY, bạn không làm được vậy.',
        'Thiếu OVER thì database báo lỗi. Ví dụ `SELECT first_name, ROW_NUMBER() FROM employees` báo lỗi 1064 ở MySQL và ORA-30484 ở Oracle.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Với AVG, SUM, COUNT, MIN, MAX kèm OVER, MySQL 8 và Oracle 19c viết giống nhau.',
        'Oracle gọi nhóm function này là analytic function. MySQL gọi là window function. Cả hai là một thứ.',
        'MySQL 5.7 không có window function. Gặp OVER sẽ báo lỗi cú pháp.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bảng có 40 nhân viên. Bạn chạy `SELECT first_name, AVG(salary) OVER () FROM employees`. Kết quả có mấy row?',
          options: [
            { text: '40 row, mỗi người một row', correct: true, feedback: 'Đúng. Window function giữ nguyên từng row.' },
            { text: '1 row', feedback: '1 row là kết quả của GROUP BY hoặc function gom không có OVER. Window function giữ từng row.' },
            { text: '8 row, mỗi phòng một row', feedback: 'Không có PARTITION BY hay GROUP BY nào chia theo phòng. Và window function không gộp row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn mỗi nhân viên có thêm số người trong phòng của họ. Bạn viết gì?',
          options: [
            { text: '`COUNT(*) OVER (PARTITION BY department_id)`', correct: true, feedback: 'Đúng. PARTITION BY chia theo phòng, COUNT đếm trong từng phòng.' },
            { text: '`COUNT(*) OVER ()`', feedback: 'OVER () đếm cả kết quả, mọi người nhận cùng một số. Bạn cần chia theo phòng.' },
            { text: '`COUNT(*) GROUP BY department_id`', feedback: 'GROUP BY gộp row và không đứng trong danh sách SELECT. Bạn cần OVER.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query có `WHERE department_id IN (30, 40)` và `AVG(salary) OVER ()`. Trung bình tính trên bao nhiêu row?',
          options: [
            { text: 'Chỉ các row của phòng 30 và 40', correct: true, feedback: 'Đúng. WHERE chạy trước, window function chỉ thấy row còn lại.' },
            { text: 'Cả 40 row của table', feedback: 'WHERE đã loại các phòng khác trước khi window function tính.' },
            { text: 'Chỉ row đầu tiên', feedback: 'OVER () tính trên mọi row còn lại sau WHERE.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo lương theo phòng',
      paragraphs: [
        'Phòng nhân sự gửi sếp một bảng lương. Sếp muốn thấy từng người, kèm trung bình của phòng người đó.',
        'Chị làm báo cáo viết một query với `AVG(salary) OVER (PARTITION BY department_id)`. Query ngắn, mỗi người một dòng, không phải nối thêm table nào.',
        'Trước khi có window function, chị phải viết một query GROUP BY riêng rồi JOIN lại. Query dài gấp đôi và dễ sai.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'GROUP BY gộp mỗi nhóm còn một row. Window function tính trên nhóm nhưng giữ nguyên từng row.',
        'Window function luôn có OVER. `OVER ()` tính trên cả kết quả, `OVER (PARTITION BY ...)` tính riêng từng nhóm.',
        'Window function chạy sau WHERE và nằm trong danh sách SELECT.',
        'MySQL 8 và Oracle 19c viết giống nhau. MySQL 5.7 không có window function.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Window Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/window-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Analytic Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html' },
      ],
    },
  ],
};
