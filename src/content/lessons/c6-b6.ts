import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b6',
  chapter: 6,
  order: 6,
  title: 'Gộp chữ trong nhóm và row tổng cộng: LISTAGG, GROUP_CONCAT, ROLLUP',
  lead: 'Bạn nối tên của cả nhóm vào một ô, và thêm row tổng vào báo cáo.',
  minutes: 18,
  goals: [
    'Nối giá trị của cả nhóm thành một chuỗi bằng GROUP_CONCAT và LISTAGG',
    'Thêm row tổng cộng bằng ROLLUP',
    'Nhận ra row tổng nhờ NULL và function GROUPING',
    'Biết MySQL và Oracle viết ROLLUP và nối chuỗi khác nhau',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Mỗi phòng có những ai, và tổng lương là bao nhiêu?',
      paragraphs: [
        'Trưởng phòng nhân sự nhờ bạn lập một báo cáo cho buổi họp.',
        '"Mỗi phòng có những ai? Tổng lương mỗi phòng là bao nhiêu? Cả công ty tổng cộng bao nhiêu?"',
        'COUNT đếm được số người. Ghép tên mọi người trong phòng vào một ô thì chưa làm được.',
        'Con số tổng của cả công ty cũng chưa có. Bạn không muốn cộng tay bằng máy tính.',
        'Bài này có hai công cụ cho hai nhu cầu đó.',
      ],
    },
    {
      type: 'text',
      title: 'Gộp chữ của cả nhóm vào một ô',
      paragraphs: [
        'Function gom thường cho ra một số. Có hai function gom cho ra một chuỗi chữ: chúng nối giá trị của mọi row trong nhóm.',
        'MySQL có **[[group-concat]]**. Oracle có **[[listagg]]**. Hai function có cùng mục đích nhưng viết khác nhau.',
        'MySQL viết `GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR \', \')`. Oracle viết `LISTAGG(last_name, \', \') WITHIN GROUP (ORDER BY last_name)`.',
        'Chuỗi trong nháy đơn là chuỗi ngăn giữa các tên. ORDER BY trong ngoặc quyết định thứ tự tên.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tên nhân viên của mỗi phòng',
      intro: 'Bấm Chạy. Query lấy ba phòng 40, 50 và 60, mỗi phòng một row.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT department_id,\n       COUNT(*) AS headcount,\n       GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ', ') AS members\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
        oracle:
          "SELECT department_id,\n       COUNT(*) AS headcount,\n       LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name) AS members\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id",
      },
      tries: [
        {
          label: 'Đổi ORDER BY last_name thành ORDER BY salary DESC',
          sql: {
            mysql:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       GROUP_CONCAT(last_name ORDER BY salary DESC SEPARATOR ', ') AS members\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
            oracle:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY salary DESC) AS members\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id",
          },
        },
        {
          label: "Đổi chuỗi ngăn ', ' thành ' / '",
          sql: {
            mysql:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ' / ') AS members\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
            oracle:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       LISTAGG(last_name, ' / ') WITHIN GROUP (ORDER BY last_name) AS members\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id",
          },
        },
        {
          label: 'Đổi last_name thành job_id',
          sql: {
            mysql:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       GROUP_CONCAT(job_id ORDER BY job_id SEPARATOR ', ') AS jobs\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
            oracle:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       LISTAGG(job_id, ', ') WITHIN GROUP (ORDER BY job_id) AS jobs\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id",
          },
        },
        {
          label: 'Đổi last_name thành job_id và thêm DISTINCT',
          sql: {
            mysql:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       GROUP_CONCAT(DISTINCT job_id ORDER BY job_id SEPARATOR ', ') AS jobs\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id;",
            oracle:
              "SELECT department_id,\n       COUNT(*) AS headcount,\n       LISTAGG(DISTINCT job_id, ', ') WITHIN GROUP (ORDER BY job_id) AS jobs\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id\nORDER BY department_id",
          },
        },
      ],
      say: 'Phòng 40 có 5 người nên có 5 tên. Với job_id, phòng 40 hiện FI_ACCOUNT bốn lần. DISTINCT bỏ các giá trị trùng. Với LISTAGG(DISTINCT ...), Oracle 18c báo ORA-30482. Oracle 21c chạy được và bỏ giá trị trùng. Tài liệu Oracle 19c có ghi DISTINCT. Mình không biết công ty bạn dùng Oracle bản nào. Hỏi công ty bản Oracle đang dùng trước khi chạy lệnh này.',
    },
    {
      type: 'text',
      title: 'ROLLUP thêm row tổng',
      paragraphs: [
        'Báo cáo thường cần một row tổng ở cuối. **[[rollup]]** bảo database gom thêm một vòng nữa: cộng mọi nhóm lại thành một row tổng cộng.',
        'Row tổng có NULL ở column nhóm, vì row đó thuộc về mọi nhóm.',
        'MySQL viết `GROUP BY department_id WITH ROLLUP`. Oracle viết `GROUP BY ROLLUP(department_id)`.',
        'Gom theo hai column, như phòng rồi chức danh, thì ROLLUP thêm cả tổng phụ. Mỗi phòng có một row tổng của phòng đó, rồi có một row tổng cộng cuối cùng.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tổng lương theo phòng, có row tổng cộng',
      intro: 'Bấm Chạy. Kết quả có 3 row phòng và 1 row tổng với department_id trống.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT department_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id WITH ROLLUP;',
        oracle:
          'SELECT department_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY ROLLUP(department_id)',
      },
      tries: [
        {
          label: 'Thêm job_id vào SELECT và vào ROLLUP',
          sql: {
            mysql:
              'SELECT department_id, job_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id, job_id WITH ROLLUP;',
            oracle:
              'SELECT department_id, job_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY ROLLUP(department_id, job_id)',
          },
        },
        {
          label: 'Thêm GROUPING(department_id) AS is_total',
          sql: {
            mysql:
              'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id WITH ROLLUP;',
            oracle:
              'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY ROLLUP(department_id)',
          },
        },
        {
          label: 'Bỏ ROLLUP',
          sql: {
            mysql:
              'SELECT department_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id;',
            oracle:
              'SELECT department_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id',
          },
        },
        {
          label: 'Thêm ORDER BY GROUPING(department_id), department_id',
          sql: {
            mysql:
              'SELECT department_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY department_id WITH ROLLUP\nORDER BY GROUPING(department_id), department_id;',
            oracle:
              'SELECT department_id,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IN (40, 50, 60)\nGROUP BY ROLLUP(department_id)\nORDER BY GROUPING(department_id), department_id',
          },
        },
      ],
      say: 'Tổng cộng 209.000.000 bằng 95.000.000 cộng 48.000.000 cộng 66.000.000. Thêm job_id thì kết quả có 8 row: 4 row chi tiết, 3 tổng phụ và 1 tổng cộng.',
    },
    {
      type: 'text',
      title: 'Nhận ra row tổng',
      paragraphs: [
        'Row tổng có NULL ở column nhóm. Nhưng dữ liệu cũng có thể có NULL thật.',
        'Hai nhân viên chưa có phòng nên department_id của họ là NULL. GROUP BY gom họ vào một nhóm riêng, và nhóm đó cũng hiện NULL.',
        '**[[grouping]]** phân biệt hai trường hợp. `GROUPING(department_id)` trả 1 ở row tổng, và trả 0 ở mọi row khác, kể cả nhóm NULL thật.',
        'Dùng GROUPING trong CASE để đổi NULL của row tổng thành chữ "Tổng cộng".',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: hai row NULL',
      intro: 'Bấm Chạy. Query chạy trên mọi nhân viên, kể cả hai người chưa có phòng.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nGROUP BY department_id WITH ROLLUP;',
        oracle:
          'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nGROUP BY ROLLUP(department_id)',
      },
      tries: [
        {
          label: "Đổi department_id thành CASE hiện 'Tổng cộng'",
          sql: {
            mysql:
              "SELECT CASE WHEN GROUPING(department_id) = 1 THEN 'Tổng cộng'\n            ELSE CAST(department_id AS CHAR) END AS department,\n       SUM(salary) AS total_salary\nFROM employees\nGROUP BY department_id WITH ROLLUP;",
            oracle:
              "SELECT CASE WHEN GROUPING(department_id) = 1 THEN 'Tổng cộng'\n            ELSE TO_CHAR(department_id) END AS department,\n       SUM(salary) AS total_salary\nFROM employees\nGROUP BY ROLLUP(department_id)",
          },
        },
        {
          label: 'Thêm WHERE department_id IS NOT NULL',
          sql: {
            mysql:
              'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id WITH ROLLUP;',
            oracle:
              'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY ROLLUP(department_id)',
          },
        },
        {
          label: 'Thêm HAVING GROUPING(department_id) = 0',
          sql: {
            mysql:
              'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nGROUP BY department_id WITH ROLLUP\nHAVING GROUPING(department_id) = 0;',
            oracle:
              'SELECT department_id,\n       SUM(salary) AS total_salary,\n       GROUPING(department_id) AS is_total\nFROM employees\nGROUP BY ROLLUP(department_id)\nHAVING GROUPING(department_id) = 0',
          },
        },
      ],
      say: 'Kết quả có hai row với department_id trống. Row có is_total bằng 1 là row tổng, 894.000.000. Row có is_total bằng 0 là hai người chưa có phòng, 32.000.000.',
    },
    {
      type: 'oracle',
      body: [
        '`GROUP_CONCAT` chỉ có ở MySQL, `LISTAGG` chỉ có ở Oracle. Gọi nhầm tên thì MySQL báo 1305 và Oracle báo ORA-00904.',
        'Viết LISTAGG kèm `WITHIN GROUP (ORDER BY ...)`. Thiếu phần này, Oracle vẫn chạy nhưng không hứa thứ tự các tên.',
        'MySQL ngăn các giá trị bằng dấu phẩy khi bạn không viết SEPARATOR. Oracle ngăn bằng chuỗi rỗng khi bạn không viết chuỗi ngăn, nên các tên dính liền nhau. Luôn viết chuỗi ngăn.',
        'Kết quả dài có giới hạn. MySQL cắt ở 1024 byte theo mặc định của `group_concat_max_len`. Oracle báo ORA-01489 khi kết quả dài quá 4000 byte.',
        'ROLLUP viết khác nhau. MySQL đặt `WITH ROLLUP` sau GROUP BY. Oracle bọc column trong `ROLLUP(...)`. Viết nhầm kiểu thì MySQL báo 1064 và Oracle báo ORA-00933.',
        'Muốn row tổng đứng cuối ở cả hai nơi, thêm `ORDER BY GROUPING(column), column`. MySQL cho dùng ORDER BY cùng ROLLUP từ bản 8.0.12.',
      ],
      mysql: "GROUP_CONCAT(last_name ORDER BY last_name SEPARATOR ', ')\n...\nGROUP BY department_id WITH ROLLUP",
      oracle: "LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name)\n...\nGROUP BY ROLLUP(department_id)",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn dùng Oracle và muốn nối tên nhân viên của mỗi phòng vào một ô. Viết gì?',
          options: [
            { text: "`LISTAGG(last_name, ', ') WITHIN GROUP (ORDER BY last_name)`", correct: true, feedback: 'Đúng. Oracle dùng LISTAGG. WITHIN GROUP chọn thứ tự nối.' },
            { text: "`GROUP_CONCAT(last_name SEPARATOR ', ')`", feedback: 'GROUP_CONCAT chỉ có ở MySQL. Oracle báo ORA-00904.' },
            { text: '`SUM(last_name)`', feedback: 'SUM chỉ cộng số. Chữ thì cần LISTAGG hoặc GROUP_CONCAT.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Kết quả ROLLUP có một row với department_id là NULL. Làm sao biết đó là row tổng?',
          options: [
            { text: 'Kiểm `GROUPING(department_id) = 1`', correct: true, feedback: 'Đúng. GROUPING trả 1 ở row tổng và 0 ở mọi row khác.' },
            { text: 'Row nào có NULL cũng là row tổng', feedback: 'Nhân viên chưa có phòng cũng tạo ra nhóm NULL. Nhóm đó là dữ liệu thật.' },
            { text: 'Row cuối cùng luôn là row tổng', feedback: 'Thứ tự row không được bảo đảm khi không có ORDER BY. Dùng GROUPING để chắc chắn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn gom theo `department_id, job_id` với ROLLUP. Ngoài row chi tiết, kết quả có thêm row nào?',
          options: [
            { text: 'Tổng của từng phòng và một tổng cộng', correct: true, feedback: 'Đúng. ROLLUP cuộn từ column cuối về column đầu, rồi về tổng cộng.' },
            { text: 'Chỉ một tổng cộng', feedback: 'ROLLUP còn thêm tổng phụ cho từng phòng.' },
            { text: 'Tổng của từng chức danh', feedback: 'Tổng riêng theo chức danh không nằm trong ROLLUP. ROLLUP chỉ cuộn từ column cuối ngược lên.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo cuối tháng của kế toán',
      paragraphs: [
        'Kế toán cần báo cáo chi phí theo phòng, với một row "Tổng cộng" ở cuối. Query dùng ROLLUP để database tự cộng.',
        'Danh sách người tham dự trong thư mời họp cũng dùng cách nối chữ. Mỗi cuộc họp một row, và một ô chứa các tên nối bằng dấu phẩy.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'GROUP_CONCAT (MySQL) và LISTAGG (Oracle) nối giá trị của cả nhóm thành một chuỗi.',
        'ROLLUP thêm row tổng cộng, và thêm tổng phụ khi gom theo nhiều column.',
        'Row tổng có NULL ở column nhóm. GROUPING(column) bằng 1 là dấu hiệu chắc chắn của row tổng.',
        'MySQL viết `WITH ROLLUP` sau GROUP BY. Oracle viết `ROLLUP(...)` trong GROUP BY.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, bài 11: Queries with aggregates (Pt. 2)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates_pt_2' },
        { name: 'MySQL 8.0 Reference Manual, GROUP BY Modifiers', url: 'https://dev.mysql.com/doc/refman/8.0/en/group-by-modifiers.html' },
        { name: 'MySQL 8.0 Reference Manual, Aggregate Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, LISTAGG', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/LISTAGG.html' },
        { name: 'Oracle Database 19c SQL Language Reference, GROUPING', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GROUPING.html' },
        { name: 'Oracle Database 19c SQL Language Reference, SELECT (mục GROUP BY ROLLUP)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html' },
      ],
    },
  ],
};
