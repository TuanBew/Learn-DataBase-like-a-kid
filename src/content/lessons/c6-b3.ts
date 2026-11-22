import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b3',
  chapter: 6,
  order: 3,
  title: 'GROUP BY nhiều column và theo tháng',
  lead: 'Bạn gom row theo hai column, và gom đơn hàng theo tháng.',
  minutes: 16,
  goals: [
    'Gom theo hai column và đọc mỗi tổ hợp là một row',
    'Gom theo tháng bằng DATE_FORMAT ở MySQL và TO_CHAR ở Oracle',
    'Viết cùng một biểu thức ở SELECT và GROUP BY',
    'Biết Oracle không cho GROUP BY theo alias',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Mỗi tháng có bao nhiêu đơn?',
      paragraphs: [
        'Đầu tháng, phòng kinh doanh họp. Sếp hỏi: "Mỗi tháng công ty nhận bao nhiêu đơn? Trong đó bao nhiêu đơn bị hủy?"',
        'Table orders có 80 row, mỗi row một đơn. Column order_date ghi cả ngày lẫn giờ, phút, giây.',
        'Bạn chưa có column "tháng". Bạn tạo nó ngay trong query từ order_date, rồi gom theo nó.',
        'Trước khi gom theo tháng, bạn cần quen với gom theo hai column.',
      ],
    },
    {
      type: 'text',
      title: 'Gom theo hai column',
      paragraphs: [
        'Gom theo hai column thì mỗi tổ hợp hai giá trị là một nhóm. Mỗi nhóm cho ra một row.',
        'Số row kết quả bằng số tổ hợp có thật trong dữ liệu. Tổ hợp không có row nào thì không hiện.',
        'Query sau đếm nhân viên và tính lương trung bình theo cặp phòng và chức danh.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: phòng và chức danh',
      intro: 'Bấm Chạy. Mỗi cặp department_id và job_id là một nhóm.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT department_id, job_id,\n       COUNT(*) AS headcount,\n       ROUND(AVG(salary), 0) AS avg_salary\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id, job_id\nORDER BY department_id, job_id;',
        oracle:
          'SELECT department_id, job_id,\n       COUNT(*) AS headcount,\n       ROUND(AVG(salary), 0) AS avg_salary\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id, job_id\nORDER BY department_id, job_id',
      },
      tries: [
        {
          label: 'Bỏ job_id khỏi SELECT, GROUP BY và ORDER BY',
          sql: {
            mysql:
              'SELECT department_id,\n       COUNT(*) AS headcount,\n       ROUND(AVG(salary), 0) AS avg_salary\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id\nORDER BY department_id;',
            oracle:
              'SELECT department_id,\n       COUNT(*) AS headcount,\n       ROUND(AVG(salary), 0) AS avg_salary\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id\nORDER BY department_id',
          },
        },
        {
          label: 'Đổi AVG(salary) thành SUM(salary)',
          sql: {
            mysql:
              'SELECT department_id, job_id,\n       COUNT(*) AS headcount,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id, job_id\nORDER BY department_id, job_id;',
            oracle:
              'SELECT department_id, job_id,\n       COUNT(*) AS headcount,\n       SUM(salary) AS total_salary\nFROM employees\nWHERE department_id IS NOT NULL\nGROUP BY department_id, job_id\nORDER BY department_id, job_id',
          },
        },
        {
          label: 'Bỏ điều kiện WHERE department_id IS NOT NULL',
          sql: {
            mysql:
              'SELECT department_id, job_id,\n       COUNT(*) AS headcount,\n       ROUND(AVG(salary), 0) AS avg_salary\nFROM employees\nGROUP BY department_id, job_id\nORDER BY department_id, job_id;',
            oracle:
              'SELECT department_id, job_id,\n       COUNT(*) AS headcount,\n       ROUND(AVG(salary), 0) AS avg_salary\nFROM employees\nGROUP BY department_id, job_id\nORDER BY department_id, job_id',
          },
        },
      ],
      say: 'Có 10 cặp. Phòng 20 có hai cặp: SA_MAN và SA_REP. Bỏ WHERE thì hai nhân viên chưa có phòng thành hai nhóm NULL, thêm 2 row.',
    },
    {
      type: 'text',
      title: 'Gom theo tháng',
      paragraphs: [
        'order_date có cả giờ, phút, giây. Mỗi đơn đặt vào một giây khác nhau, nên gom thẳng theo order_date cho mỗi đơn một nhóm.',
        'Muốn gom theo tháng, cắt order_date thành chuỗi năm-tháng bằng function ngày giờ. Rồi viết GROUP BY chính biểu thức đó.',
        'MySQL dùng `DATE_FORMAT(order_date, \'%Y-%m\')`. Oracle dùng `TO_CHAR(order_date, \'YYYY-MM\')`. Cả hai cho chuỗi như `2025-03`.',
        'Viết biểu thức giống hệt ở SELECT và ở GROUP BY. Năm đứng trước tháng, nên ORDER BY xếp các chuỗi này đúng thứ tự thời gian.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đơn theo tháng',
      intro: 'Bấm Chạy. Table có 80 đơn trải trên 15 tháng, kết quả có 15 row.',
      database: 'company',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
        oracle:
          "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
      },
      tries: [
        {
          label: 'Đổi GROUP BY thành order_date',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY order_date\nORDER BY order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY order_date\nORDER BY order_month",
          },
        },
        {
          label: "Thêm WHERE status <> 'cancelled'",
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nWHERE status <> 'cancelled'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nWHERE status <> 'cancelled'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
          },
        },
        {
          label: "Đổi '%Y-%m' thành '%Y' (Oracle: 'YYYY-MM' thành 'YYYY')",
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y') AS order_year,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y')\nORDER BY order_year;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY') AS order_year,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY')\nORDER BY order_year",
          },
        },
        {
          label: 'Đổi ORDER BY thành orders_count DESC, order_month',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY orders_count DESC, order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY orders_count DESC, order_month",
          },
        },
      ],
      say: 'Gom theo order_date thì ra 80 row, mỗi đơn một nhóm. Gom theo năm thì ra 2 row: 68 đơn năm 2025 và 12 đơn năm 2026.',
    },
    {
      type: 'text',
      title: 'Tháng và trạng thái trong cùng một báo cáo',
      paragraphs: [
        'Sếp muốn biết số đơn hủy mỗi tháng. Gom theo hai thứ: tháng và status.',
        'Biểu thức tháng và column status đứng cạnh nhau trong GROUP BY. Mỗi cặp tháng và trạng thái là một nhóm.',
        'Tháng nào chỉ có một trạng thái thì chỉ có một row.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tháng và trạng thái',
      intro: 'Bấm Chạy. Kết quả có 22 row cho 15 tháng.',
      database: 'company',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       status,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), status\nORDER BY order_month, status;",
        oracle:
          "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       status,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), status\nORDER BY order_month, status",
      },
      tries: [
        {
          label: 'Chỉ lấy đơn từ tháng 2025-10',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       status,\n       COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), status\nORDER BY order_month, status;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       status,\n       COUNT(*) AS orders_count\nFROM orders\nWHERE order_date >= DATE '2025-10-01'\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), status\nORDER BY order_month, status",
          },
        },
        {
          label: 'Đổi ORDER BY thành status, order_month',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       status,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m'), status\nORDER BY status, order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       status,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY-MM'), status\nORDER BY status, order_month",
          },
        },
        {
          label: 'Bỏ status khỏi SELECT, GROUP BY và ORDER BY',
          sql: {
            mysql:
              "SELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m')\nORDER BY order_month;",
            oracle:
              "SELECT TO_CHAR(order_date, 'YYYY-MM') AS order_month,\n       COUNT(*) AS orders_count\nFROM orders\nGROUP BY TO_CHAR(order_date, 'YYYY-MM')\nORDER BY order_month",
          },
        },
      ],
      say: 'Tháng 2025-01 chỉ có đơn delivered, nên chỉ có một row. Tháng 2025-02 có thêm một đơn cancelled, nên có hai row.',
    },
    {
      type: 'oracle',
      body: [
        'MySQL cho GROUP BY theo alias của column: `GROUP BY order_month` chạy được.',
        'Oracle không cho. Lúc GROUP BY chạy, Oracle chưa biết alias đó, và báo ORA-00904.',
        'Cách viết chạy ở cả hai dialect: lặp lại biểu thức trong GROUP BY, như các query ở trên.',
        'ORDER BY thì dùng được alias ở cả hai nơi.',
        'Mẫu ngày giờ khác nhau. MySQL viết `%Y-%m`, trong đó %m là tháng và %i là phút. Oracle viết `YYYY-MM`, trong đó MM là tháng và MI là phút.',
      ],
      mysql: "GROUP BY order_month\n-- chạy được",
      oracle: "GROUP BY order_month\n-- lỗi ORA-00904",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn gom orders theo tháng và trạng thái. Tháng 2025-01 chỉ có đơn delivered. Tháng đó có mấy row?',
          options: [
            { text: '1', correct: true, feedback: 'Đúng. Nhóm chỉ có khi có row thuộc nhóm đó.' },
            { text: '2', feedback: 'Tổ hợp tháng 2025-01 và cancelled không có row nào, nên không thành nhóm.' },
            { text: '4', feedback: 'Table có 4 trạng thái, nhưng tháng 2025-01 chỉ dùng một trạng thái.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn dùng Oracle và muốn gom đơn theo tháng. Cách nào đúng?',
          options: [
            { text: "`GROUP BY TO_CHAR(order_date, 'YYYY-MM')`", correct: true, feedback: 'Đúng. Biểu thức ở GROUP BY giống hệt biểu thức ở SELECT.' },
            { text: '`GROUP BY order_date`', feedback: 'order_date có cả giờ, phút, giây. Mỗi đơn thành một nhóm, nên không có gì được gom.' },
            { text: '`GROUP BY order_month`', feedback: 'order_month là alias. Oracle báo ORA-00904 vì chưa biết alias lúc GROUP BY chạy.' },
          ],
        },
        {
          kind: 'choice',
          question: "Oracle chạy `SELECT DATE_FORMAT(order_date, '%Y-%m') FROM orders`. Chuyện gì xảy ra?",
          options: [
            { text: 'Oracle báo ORA-00904, vì không có function DATE_FORMAT', correct: true, feedback: 'Đúng. DATE_FORMAT chỉ có ở MySQL. Oracle dùng TO_CHAR.' },
            { text: 'Oracle trả chuỗi năm-tháng', feedback: 'Oracle không có DATE_FORMAT, nên không trả được gì.' },
            { text: 'Oracle trả 0 row', feedback: 'Query lỗi ngay từ đầu, và không có kết quả nào, kể cả 0 row.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo đầu tháng',
      paragraphs: [
        'Phòng kinh doanh nhận báo cáo đơn theo tháng vào mỗi đầu tháng. Mỗi tháng một row, và có thêm một column cho từng trạng thái.',
        'Phía sau là một query gom theo biểu thức tháng. Cuối quý, kế toán cộng ba row để ra số của quý.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Gom theo hai column thì mỗi tổ hợp có thật là một nhóm và một row.',
        'Gom theo tháng bằng `DATE_FORMAT(d, \'%Y-%m\')` ở MySQL và `TO_CHAR(d, \'YYYY-MM\')` ở Oracle.',
        'Biểu thức ở GROUP BY giống hệt biểu thức ở SELECT.',
        'Oracle không cho GROUP BY theo alias và báo ORA-00904. MySQL cho.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 10: Queries with aggregates (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates' },
        { name: 'MySQL 8.0 Reference Manual, Date and Time Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, TO_CHAR (datetime)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_CHAR-datetime.html' },
      ],
    },
  ],
};
