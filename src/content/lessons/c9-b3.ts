import type { Lesson } from '../types';

/** Top N mỗi phòng. `fn` là ROW_NUMBER hoặc RANK, `n` là N, `part` là column chia nhóm. */
const topN = (fn: string, n: number, part: string, end: string) =>
  `SELECT ${part}, first_name, last_name, salary, rn
FROM (
  SELECT ${part}, first_name, last_name, salary,
    ${fn}() OVER (PARTITION BY ${part} ORDER BY salary DESC) AS rn
  FROM employees
  WHERE ${part} IS NOT NULL
) t
WHERE rn <= ${n}
ORDER BY ${part}, rn, last_name${end}`;

const topNRow = (n: number, part: string, end: string) =>
  topN('ROW_NUMBER', n, part, end).replace('DESC)', 'DESC, employee_id)');

const withVersion = (end: string) =>
  `WITH ranked AS (
  SELECT department_id, first_name, last_name, salary,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC, employee_id) AS rn
  FROM employees
  WHERE department_id IS NOT NULL
)
SELECT department_id, first_name, last_name, salary, rn
FROM ranked
WHERE rn <= 3
ORDER BY department_id, rn${end}`;

export const lesson: Lesson = {
  id: 'c9-b3',
  chapter: 9,
  order: 3,
  title: 'Top N của mỗi nhóm',
  lead: 'Bạn lấy ba người lương cao nhất của từng phòng bằng window function và subquery.',
  minutes: 15,
  goals: [
    'Viết query "top N của mỗi nhóm"',
    'Hiểu vì sao window function không viết trong WHERE được',
    'Bọc window function trong subquery ở FROM rồi lọc ở ngoài',
    'Viết cùng query bằng WITH',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ba người lương cao nhất mỗi phòng',
      paragraphs: [
        'Giám đốc nhân sự hỏi Bi: "Cho tôi ba người lương cao nhất của từng phòng."',
        'Bi nhớ cách xếp hạng trong từng nhóm: `ROW_NUMBER() OVER (PARTITION BY ...)`. Mỗi phòng đã có hạng 1, 2, 3.',
        'Bi viết thêm `WHERE hạng <= 3` vào cùng query. Database báo lỗi ngay.',
        'Lỗi này có lý do, và cách sửa gồm đúng một bước: thêm một lớp query bọc bên ngoài.',
      ],
    },
    {
      type: 'text',
      title: 'Vì sao WHERE không thấy được hạng',
      paragraphs: [
        'Database chạy query theo thứ tự: FROM, WHERE, GROUP BY, HAVING, rồi mới tới SELECT. Window function nằm trong SELECT.',
        'Khi WHERE chạy, hạng chưa tồn tại. Database không có gì để so với 3.',
        'Chạy `SELECT first_name, salary FROM employees WHERE RANK() OVER (ORDER BY salary DESC) <= 3` thì MySQL báo lỗi 3593 và Oracle báo ORA-30483. Cả hai đều nói window function không dùng được ở WHERE.',
        'Cách sửa: tính hạng trong một query bên trong, rồi lọc ở query bên ngoài. Query bên trong đặt ở FROM.',
        'Dạng đề này tên là **[[top-n]]**: giữ N row đầu tiên của từng nhóm.',
        'Query trong ngoặc phải có tên, ví dụ `t`. Query ngoài lọc `WHERE rn <= 3`, và rn lúc này là column bình thường.',
        'Thứ tự trong ORDER BY của OVER quyết định ai vào top. Muốn lương cao nhất thì viết DESC.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: ba người lương cao nhất mỗi phòng',
      intro: 'Bấm Chạy. Query trong ngoặc tính hạng rn cho mọi nhân viên. Query ngoài giữ các row có rn từ 1 đến 3.',
      database: 'company',
      tables: ['employees', 'departments'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: topNRow(3, 'department_id', ';'), oracle: topNRow(3, 'department_id', '') },
      tries: [
        {
          label: 'Đổi 3 thành 1: người lương cao nhất mỗi phòng',
          sql: { mysql: topNRow(1, 'department_id', ';'), oracle: topNRow(1, 'department_id', '') },
        },
        {
          label: 'Đổi 3 thành 7 và ROW_NUMBER thành RANK: đồng hạng cùng vào',
          sql: { mysql: topN('RANK', 7, 'department_id', ';'), oracle: topN('RANK', 7, 'department_id', '') },
        },
        {
          label: 'Viết lại bằng WITH',
          sql: { mysql: withVersion(';'), oracle: withVersion('') },
        },
        {
          label: 'Đổi nhóm: hai người lương cao nhất mỗi chức danh (job_id)',
          sql: { mysql: topNRow(2, 'job_id', ';'), oracle: topNRow(2, 'job_id', '') },
        },
      ],
      say: 'Mỗi phòng cho ra đúng ba người, hoặc ít hơn nếu phòng có ít người. Mục thứ hai dùng RANK: phòng Kinh doanh có hai người cùng lương 16 triệu ở hạng 7, nên cả hai cùng vào và phòng đó cho ra 8 row.',
    },
    {
      type: 'text',
      title: 'Chọn ROW_NUMBER hay RANK',
      paragraphs: [
        'ROW_NUMBER cho đúng N row mỗi nhóm. Hai người bằng nhau ở ranh giới thì một người bị loại, nên bạn thêm column phụ như `employee_id` vào ORDER BY để kết quả cố định.',
        'RANK giữ cả hai người bằng nhau, nên một nhóm có thể cho ra nhiều hơn N row.',
        'Hỏi người cần báo cáo: "Hai người bằng điểm ở hạng cuối thì sao?" Câu trả lời quyết định function.',
        'WITH làm query dễ đọc hơn: bước một tính hạng, bước hai lọc. Kết quả giống hệt bản subquery.',
        'Bạn cũng đổi được nhóm. Muốn top mỗi chức danh, đổi PARTITION BY sang `job_id`.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Subquery ở FROM viết giống nhau ở cả hai dialect. Oracle không cho viết AS trước tên của subquery, nên hãy bỏ AS: viết `) t`.',
        'MySQL 8 và Oracle 19c đều có WITH. MySQL 5.7 không có window function, nên dạng đề này phải viết bằng cách khác.',
        'Cả hai dialect báo lỗi khi window function nằm trong WHERE: MySQL 3593, Oracle ORA-30483.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn viết `WHERE ROW_NUMBER() OVER (...) <= 3`. Vì sao database báo lỗi?',
          options: [
            { text: 'WHERE chạy trước SELECT, lúc đó window function chưa được tính', correct: true, feedback: 'Đúng. Hạng chỉ có sau khi SELECT chạy.' },
            { text: 'ROW_NUMBER không so sánh được với số', feedback: 'So sánh với số thì không sao. Vấn đề là vị trí: WHERE chạy trước khi hạng tồn tại.' },
            { text: 'WHERE chỉ nhận column của table, không nhận function nào', feedback: 'WHERE nhận function thường như UPPER hoặc ROUND. Riêng window function bị chặn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Cách sửa nào đúng?',
          options: [
            { text: 'Tính hạng trong subquery ở FROM, rồi lọc `WHERE rn <= 3` ở query ngoài', correct: true, feedback: 'Đúng. Với query ngoài, rn là một column bình thường.' },
            { text: 'Đổi WHERE thành HAVING', feedback: 'HAVING cũng chạy trước SELECT, nên vẫn không thấy window function.' },
            { text: 'Đặt ORDER BY rn trong WHERE', feedback: 'ORDER BY chỉ sắp xếp, không lọc row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Báo cáo cần top 3 mỗi phòng, và hai người bằng lương ở hạng 3 phải cùng vào. Dùng function nào?',
          options: [
            { text: 'RANK hoặc DENSE_RANK', correct: true, feedback: 'Đúng. Hai người bằng nhau cùng hạng, nên cùng qua điều kiện rn <= 3.' },
            { text: 'ROW_NUMBER', feedback: 'ROW_NUMBER luôn cho hai số khác nhau, nên một người bị loại.' },
            { text: 'Function nào cũng cho kết quả giống nhau', feedback: 'Chúng khác nhau đúng ở chỗ này: xử lý giá trị bằng nhau.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Top khách hàng mỗi vùng',
      paragraphs: [
        'Bộ phận kinh doanh cần danh sách 5 khách mua nhiều nhất của mỗi vùng để gọi chăm sóc.',
        'Anh làm báo cáo viết đúng dạng này: tính hạng trong WITH, lọc `rn <= 5` ở query cuối. Anh thêm `customer_id` vào ORDER BY của OVER để danh sách không đổi giữa các lần chạy.',
        'Dạng query này lặp lại ở nhiều báo cáo: sản phẩm bán chạy mỗi nhóm hàng, đơn lớn nhất mỗi tháng, người chấm công nhiều nhất mỗi phòng.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Window function không viết được trong WHERE: MySQL 3593, Oracle ORA-30483. WHERE chạy trước khi hạng tồn tại.',
        'Cách sửa: tính hạng trong subquery ở FROM (hoặc trong WITH), rồi lọc `rn <= N` ở query ngoài.',
        'ROW_NUMBER cho đúng N row mỗi nhóm. RANK giữ cả các row bằng nhau, nên có thể nhiều hơn N.',
        'Thêm column phụ như `employee_id` vào ORDER BY để kết quả cố định.',
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
