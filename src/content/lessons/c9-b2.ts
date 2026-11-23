import type { Lesson } from '../types';

const top10 = (end: 'mysql' | 'oracle') =>
  `SELECT first_name, last_name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC, employee_id) AS row_num,
  RANK() OVER (ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees
ORDER BY salary DESC, employee_id
${end === 'mysql' ? 'LIMIT 10;' : 'FETCH FIRST 10 ROWS ONLY'}`;

const part = (where: string, order: string, end: string) =>
  `SELECT first_name, last_name, department_id, salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary ${order}, employee_id) AS row_num,
  RANK() OVER (PARTITION BY department_id ORDER BY salary ${order}) AS rnk,
  DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary ${order}) AS dense_rnk
FROM employees
WHERE ${where}
ORDER BY department_id, salary ${order}, employee_id${end}`;

const deptRank = (end: string) =>
  `SELECT department_id, SUM(salary) AS total_salary,
  RANK() OVER (ORDER BY SUM(salary) DESC) AS rnk
FROM employees
WHERE department_id IS NOT NULL
GROUP BY department_id
ORDER BY rnk${end}`;

export const lesson: Lesson = {
  id: 'c9-b2',
  chapter: 9,
  order: 2,
  title: 'Xếp hạng: ROW_NUMBER, RANK, DENSE_RANK',
  lead: 'Bạn đánh số thứ hạng cho từng row, và biết ba function xử lý đồng hạng khác nhau thế nào.',
  minutes: 14,
  goals: [
    'Đánh thứ hạng bằng ROW_NUMBER, RANK và DENSE_RANK',
    'Nói được ba function khác nhau ở chỗ nào khi có giá trị bằng nhau',
    'Viết OVER (ORDER BY ...) và OVER (PARTITION BY ... ORDER BY ...)',
    'Chọn function đúng cho từng kiểu báo cáo',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hai người cùng lương, ai hạng mấy?',
      paragraphs: [
        'Sếp nhờ Bi lập bảng xếp hạng lương của công ty. Bi sắp lương từ cao xuống thấp và đánh số 1, 2, 3.',
        'Đến hạng 4 có chuyện: anh Hùng và anh Bảo cùng lương 38 triệu. Ai hạng 4, ai hạng 5?',
        'Có ba cách trả lời. Mỗi cách là một function: ROW_NUMBER, RANK và DENSE_RANK.',
      ],
    },
    {
      type: 'text',
      title: 'Ba function, ba cách chia hạng',
      paragraphs: [
        '**[[row-number]]** đánh số 1, 2, 3 liên tục. Hai row bằng nhau vẫn nhận hai số khác nhau.',
        '**[[rank]]** cho hai row bằng nhau cùng một hạng. Hạng kế tiếp nhảy cách: 4, 4, 6.',
        '**[[dense-rank]]** cũng cho cùng hạng. Hạng kế tiếp không nhảy: 4, 4, 5.',
        'Cả ba viết cùng một dạng: `RANK() OVER (ORDER BY salary DESC)`. Dấu ngoặc sau tên function để trống.',
        'ORDER BY trong OVER quyết định thứ tự xếp hạng. DESC thì lương cao nhất được hạng 1.',
        'ROW_NUMBER không thể chia hai row bằng nhau. Bạn thêm một column phụ vào ORDER BY, như `employee_id`, để thứ tự luôn cố định.',
        'ORDER BY trong OVER chỉ dùng để tính hạng. Thứ tự row trên màn hình do ORDER BY ở cuối query quyết định.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: ba hạng cạnh nhau',
      intro: 'Bấm Chạy. Nhìn các row có lương bằng nhau: 38 triệu ở hạng 4 và 28 triệu ở hạng 7.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: top10('mysql'), oracle: top10('oracle') },
      tries: [
        {
          label: 'Xếp hạng riêng trong phòng Kinh doanh (mã 20)',
          sql: { mysql: part('department_id = 20', 'DESC', ';'), oracle: part('department_id = 20', 'DESC', '') },
        },
        {
          label: 'Xếp hạng trong phòng 20 và 30, mỗi phòng đếm lại từ 1',
          sql: { mysql: part('department_id IN (20, 30)', 'DESC', ';'), oracle: part('department_id IN (20, 30)', 'DESC', '') },
        },
        {
          label: 'Đổi DESC thành ASC: lương thấp nhất hạng 1',
          sql: { mysql: part('department_id = 20', 'ASC', ';'), oracle: part('department_id = 20', 'ASC', '') },
        },
        {
          label: 'Xếp hạng phòng theo tổng lương, kèm GROUP BY',
          sql: { mysql: deptRank(';'), oracle: deptRank('') },
        },
      ],
      say: 'Hai người lương 38 triệu: ROW_NUMBER cho 4 và 5, RANK cho 4 và 4 rồi nhảy tới 6, DENSE_RANK cho 4 và 4 rồi tiếp tục 5. Cùng một dữ liệu, ba kiểu đánh số.',
    },
    {
      type: 'text',
      title: 'PARTITION BY: xếp hạng riêng từng nhóm',
      paragraphs: [
        'Thêm PARTITION BY trước ORDER BY thì mỗi nhóm đánh số lại từ 1. Ví dụ `RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)`.',
        'Khi đó "hạng 1" nghĩa là người lương cao nhất của phòng mình, không phải của cả công ty.',
        'Window function chạy sau GROUP BY. Vì thế bạn xếp hạng được theo kết quả gom, như `RANK() OVER (ORDER BY SUM(salary) DESC)` ở mục thử cuối.',
        'Chọn function theo báo cáo cần gì. Cần đúng N dòng, không hơn không kém: ROW_NUMBER. Cần đồng hạng thật và chấp nhận nhảy số, như giải thể thao: RANK. Cần danh sách hạng liền nhau: DENSE_RANK.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'MySQL 8 và Oracle 19c viết ba function này giống nhau.',
        'Khác biệt: Oracle bắt buộc có ORDER BY trong OVER. Thiếu thì báo ORA-30485. MySQL cho qua, và coi mọi row cùng hạng 1.',
        'MySQL 5.7 không có ba function này.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Lương theo thứ tự giảm dần là 50, 40, 40, 30. Hạng của người lương 30 theo RANK là mấy?',
          options: [
            { text: '4', correct: true, feedback: 'Đúng. Hai người 40 cùng hạng 2, nên người kế tiếp nhảy tới hạng 4.' },
            { text: '3', feedback: 'Hạng 3 là của DENSE_RANK, vì nó không nhảy số. RANK nhảy.' },
            { text: '2', feedback: 'Hạng 2 là hạng chung của hai người lương 40. Người lương 30 đứng sau họ.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Cùng dữ liệu đó. Hạng của người lương 30 theo DENSE_RANK là mấy?',
          options: [
            { text: '3', correct: true, feedback: 'Đúng. DENSE_RANK không bỏ số: 1, 2, 2, 3.' },
            { text: '4', feedback: 'Hạng 4 là của RANK và ROW_NUMBER. DENSE_RANK không nhảy số.' },
            { text: '2', feedback: 'Hạng 2 đã thuộc về hai người lương 40.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn mỗi phòng đánh số lại từ 1 theo lương giảm dần. Bạn thêm gì vào OVER?',
          options: [
            { text: '`PARTITION BY department_id` trước `ORDER BY salary DESC`', correct: true, feedback: 'Đúng. PARTITION BY chia nhóm, ORDER BY xếp trong từng nhóm.' },
            { text: '`GROUP BY department_id` bên trong OVER', feedback: 'OVER không nhận GROUP BY. Chia nhóm trong OVER là việc của PARTITION BY.' },
            { text: 'Chỉ `ORDER BY department_id`', feedback: 'Cách này vẫn đánh số liên tục qua mọi phòng. Bạn cần PARTITION BY để đếm lại từ 1.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Bảng xếp hạng doanh số quý',
      paragraphs: [
        'Phòng kinh doanh công bố bảng xếp hạng doanh số cuối quý. Hai nhân viên bằng nhau thì cả hai cùng nhận hạng 2.',
        'Chị làm báo cáo chọn RANK vì giải thưởng chỉ trao cho hạng 1 đến 3. Nếu chọn ROW_NUMBER, một trong hai người bằng điểm sẽ mất hạng mà không ai giải thích được.',
        'Với danh sách "20 khách hàng lớn nhất" cần đúng 20 dòng, chị dùng ROW_NUMBER.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'ROW_NUMBER đánh số liên tục. RANK cho đồng hạng rồi nhảy số. DENSE_RANK cho đồng hạng và không nhảy.',
        '`OVER (ORDER BY ...)` quyết định thứ tự xếp hạng. Thêm PARTITION BY thì mỗi nhóm đếm lại từ 1.',
        'ROW_NUMBER cần thêm column phụ vào ORDER BY để thứ tự cố định khi có giá trị bằng nhau.',
        'Oracle bắt buộc ORDER BY trong OVER của hàm xếp hạng. MySQL 5.7 không có các function này.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Window Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/window-function-descriptions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Analytic Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html' },
      ],
    },
  ],
};
