import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b8',
  chapter: 5,
  order: 8,
  title: 'CASE WHEN và DECODE',
  lead: 'Bạn gắn nhãn cho row theo điều kiện, đổi mã thành tên, và đặt mức tối thiểu hay mức tối đa cho một con số.',
  minutes: 16,
  goals: [
    'Gắn nhãn bằng CASE WHEN và hiểu CASE dừng ở điều kiện đúng đầu tiên',
    'Đổi một mã thành tên bằng CASE so giá trị, hoặc DECODE ở Oracle',
    'Dùng IF() ở MySQL cho trường hợp hai nhánh',
    'Đặt mức tối thiểu và mức tối đa cho một con số bằng GREATEST và LEAST',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Danh sách lương không ai muốn đọc',
      paragraphs: [
        'Phó giám đốc xin danh sách nhân viên của ba phòng. Anh không cần con số lương cụ thể. Anh muốn thấy ai ở mức Thấp, Vừa hay Cao.',
        'Anh cũng muốn đọc tên phòng, không đọc mã phòng. Mã 30 không nói gì với anh.',
        'Bạn có thể xuất ra Excel rồi gắn nhãn bằng tay. Danh sách có bốn mươi người, và tuần sau anh đòi lại.',
        'Bi nói: "Mình để query gắn nhãn. Lần sau bạn chỉ cần bấm Chạy."',
      ],
    },
    {
      type: 'text',
      title: 'CASE WHEN chia row thành nhóm',
      paragraphs: [
        '**[[case-when]]** chọn một giá trị theo điều kiện. Cách đọc giống câu "nếu... thì...".',
        'Khung viết: `CASE WHEN điều kiện THEN giá trị ... ELSE giá trị khác END`.',
        'Database xét các WHEN từ trên xuống. Gặp điều kiện đúng đầu tiên thì dừng và lấy giá trị của điều kiện đó.',
        'Nếu không điều kiện nào đúng, database lấy giá trị sau ELSE. Thiếu ELSE thì kết quả là NULL.',
        'Thứ tự các WHEN quyết định kết quả. Bạn đặt điều kiện hẹp trước, điều kiện rộng sau.',
        'Query dưới đây gắn nhãn lương cho ba phòng. Dưới 15 triệu là Thấp, dưới 30 triệu là Vừa, còn lại là Cao.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nhãn mức lương',
      intro: 'Bấm Chạy. CASE WHEN viết giống nhau ở hai dialect.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT last_name, salary,\n  CASE WHEN salary < 15000000 THEN 'Thấp'\n       WHEN salary < 30000000 THEN 'Vừa'\n       ELSE 'Cao' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50);",
        oracle:
          "SELECT last_name, salary,\n  CASE WHEN salary < 15000000 THEN 'Thấp'\n       WHEN salary < 30000000 THEN 'Vừa'\n       ELSE 'Cao' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50)",
      },
      tries: [
        {
          label: 'Đổi mốc 15000000 thành 20000000',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  CASE WHEN salary < 20000000 THEN 'Thấp'\n       WHEN salary < 30000000 THEN 'Vừa'\n       ELSE 'Cao' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50);",
            oracle:
              "SELECT last_name, salary,\n  CASE WHEN salary < 20000000 THEN 'Thấp'\n       WHEN salary < 30000000 THEN 'Vừa'\n       ELSE 'Cao' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50)",
          },
        },
        {
          label: "Bỏ ELSE 'Cao'",
          sql: {
            mysql:
              "SELECT last_name, salary,\n  CASE WHEN salary < 15000000 THEN 'Thấp'\n       WHEN salary < 30000000 THEN 'Vừa' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50);",
            oracle:
              "SELECT last_name, salary,\n  CASE WHEN salary < 15000000 THEN 'Thấp'\n       WHEN salary < 30000000 THEN 'Vừa' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50)",
          },
        },
        {
          label: 'Đảo thứ tự hai WHEN',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  CASE WHEN salary < 30000000 THEN 'Vừa'\n       WHEN salary < 15000000 THEN 'Thấp'\n       ELSE 'Cao' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50);",
            oracle:
              "SELECT last_name, salary,\n  CASE WHEN salary < 30000000 THEN 'Vừa'\n       WHEN salary < 15000000 THEN 'Thấp'\n       ELSE 'Cao' END AS band\nFROM employees\nWHERE department_id IN (30, 40, 50)",
          },
        },
      ],
      say: 'Thử mục đảo thứ tự. Mọi người dưới 30 triệu dừng ở nhãn Vừa, nên nhãn Thấp không bao giờ hiện.',
    },
    {
      type: 'text',
      title: 'CASE so giá trị và DECODE',
      paragraphs: [
        'Muốn đổi mã thành tên, bạn so một column với từng giá trị. CASE có dạng ngắn cho trường hợp này: `CASE column WHEN giá trị THEN kết quả ... ELSE kết quả khác END`.',
        'Database so column với từng giá trị theo thứ tự, và dừng ở giá trị khớp đầu tiên. Dạng này chỉ so bằng. Muốn so lớn hơn hay nhỏ hơn, dùng dạng có điều kiện ở trên.',
        '**[[decode]]** là function của Oracle có cùng mục đích: `DECODE(column, giá_trị_1, kết_quả_1, giá_trị_2, kết_quả_2, ..., mặc_định)`.',
        'Giá trị cuối cùng, đứng một mình, là kết quả mặc định. Thiếu giá trị này thì kết quả là NULL khi không khớp.',
        'Code Oracle cũ có rất nhiều DECODE. Bạn cần đọc được nó. Khi viết code mới, dùng CASE, vì CASE chạy ở cả hai dialect.',
        'Có một điểm khác: DECODE coi hai NULL là bằng nhau. CASE column WHEN NULL không khớp bao giờ, vì NULL không bằng gì cả.',
        'Query dưới đây đổi mã phòng thành tên. Anh Phúc chưa có phòng nên department_id là NULL.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đổi mã phòng thành tên',
      intro: 'Bấm Chạy. MySQL dùng CASE so giá trị. Oracle dùng DECODE.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT last_name, department_id,\n  CASE department_id\n    WHEN 20 THEN 'Kinh doanh'\n    WHEN 30 THEN 'IT'\n    WHEN 40 THEN 'Tài chính'\n    ELSE 'Khác' END AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138);",
        oracle:
          "SELECT last_name, department_id,\n  DECODE(department_id, 20, 'Kinh doanh',\n                        30, 'IT',\n                        40, 'Tài chính',\n                        'Khác') AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138)",
      },
      tries: [
        {
          label: "Bỏ giá trị mặc định 'Khác'",
          sql: {
            mysql:
              "SELECT last_name, department_id,\n  CASE department_id\n    WHEN 20 THEN 'Kinh doanh'\n    WHEN 30 THEN 'IT'\n    WHEN 40 THEN 'Tài chính' END AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138);",
            oracle:
              "SELECT last_name, department_id,\n  DECODE(department_id, 20, 'Kinh doanh',\n                        30, 'IT',\n                        40, 'Tài chính') AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138)",
          },
        },
        {
          label: "Thêm 50 là 'Nhân sự'",
          sql: {
            mysql:
              "SELECT last_name, department_id,\n  CASE department_id\n    WHEN 20 THEN 'Kinh doanh'\n    WHEN 30 THEN 'IT'\n    WHEN 40 THEN 'Tài chính'\n    WHEN 50 THEN 'Nhân sự'\n    ELSE 'Khác' END AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138);",
            oracle:
              "SELECT last_name, department_id,\n  DECODE(department_id, 20, 'Kinh doanh',\n                        30, 'IT',\n                        40, 'Tài chính',\n                        50, 'Nhân sự',\n                        'Khác') AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138)",
          },
        },
        {
          label: 'Viết lại bằng CASE có điều kiện, tách người chưa có phòng',
          sql: {
            mysql:
              "SELECT last_name, department_id,\n  CASE WHEN department_id IS NULL THEN 'Chưa xếp phòng'\n       WHEN department_id = 20 THEN 'Kinh doanh'\n       WHEN department_id = 30 THEN 'IT'\n       WHEN department_id = 40 THEN 'Tài chính'\n       ELSE 'Khác' END AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138);",
            oracle:
              "SELECT last_name, department_id,\n  CASE WHEN department_id IS NULL THEN 'Chưa xếp phòng'\n       WHEN department_id = 20 THEN 'Kinh doanh'\n       WHEN department_id = 30 THEN 'IT'\n       WHEN department_id = 40 THEN 'Tài chính'\n       ELSE 'Khác' END AS dept_label\nFROM employees\nWHERE employee_id IN (103, 104, 123, 128, 138)",
          },
        },
      ],
      say: 'Anh Phúc và chị Thu rơi vào nhánh Khác. Mục cuối tách anh Phúc ra bằng IS NULL, một điều kiện mà dạng so giá trị không viết được.',
    },
    {
      type: 'text',
      title: 'IF, GREATEST và LEAST',
      paragraphs: [
        'MySQL có `IF(điều kiện, a, b)` cho trường hợp chỉ có hai nhánh. Điều kiện đúng thì ra a, sai thì ra b. Oracle không có IF, dùng CASE.',
        '**[[greatest-least]]** chọn giá trị lớn nhất hoặc nhỏ nhất trong một danh sách bạn đưa. `GREATEST(a, b)` ra giá trị lớn hơn. `LEAST(a, b)` ra giá trị nhỏ hơn.',
        'Bạn dùng GREATEST để đặt mức tối thiểu. `GREATEST(salary, 15000000)` không bao giờ nhỏ hơn 15 triệu.',
        'Bạn dùng LEAST để đặt mức tối đa. `LEAST(salary, 30000000)` không bao giờ lớn hơn 30 triệu.',
        'Hai function này so các giá trị trong cùng một row. Chúng khác function gom MAX và MIN, những function gom nhiều row ở chương sau.',
        'Nếu một giá trị trong danh sách là NULL, kết quả là NULL. Thay NULL bằng COALESCE trước.',
        'Query dưới đây đặt mức tối thiểu 15 triệu và mức tối đa 30 triệu cho lương, và đánh dấu người dưới mức tối thiểu.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: mức tối thiểu và mức tối đa của lương',
      intro: 'Bấm Chạy. floor_pay nâng lương dưới 15 triệu lên 15 triệu. capped hạ lương trên 30 triệu xuống 30 triệu.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT last_name, salary,\n  GREATEST(salary, 15000000) AS floor_pay,\n  LEAST(salary, 30000000) AS capped,\n  IF(salary < 15000000, 'Dưới mức', 'Đủ mức') AS flag\nFROM employees\nWHERE department_id IN (30, 40);",
        oracle:
          "SELECT last_name, salary,\n  GREATEST(salary, 15000000) AS floor_pay,\n  LEAST(salary, 30000000) AS capped,\n  CASE WHEN salary < 15000000 THEN 'Dưới mức' ELSE 'Đủ mức' END AS flag\nFROM employees\nWHERE department_id IN (30, 40)",
      },
      tries: [
        {
          label: 'Đổi mức tối thiểu 15 triệu thành 20 triệu',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  GREATEST(salary, 20000000) AS floor_pay,\n  LEAST(salary, 30000000) AS capped,\n  IF(salary < 20000000, 'Dưới mức', 'Đủ mức') AS flag\nFROM employees\nWHERE department_id IN (30, 40);",
            oracle:
              "SELECT last_name, salary,\n  GREATEST(salary, 20000000) AS floor_pay,\n  LEAST(salary, 30000000) AS capped,\n  CASE WHEN salary < 20000000 THEN 'Dưới mức' ELSE 'Đủ mức' END AS flag\nFROM employees\nWHERE department_id IN (30, 40)",
          },
        },
        {
          label: 'Đổi mức tối đa 30 triệu thành 25 triệu',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  GREATEST(salary, 15000000) AS floor_pay,\n  LEAST(salary, 25000000) AS capped,\n  IF(salary < 15000000, 'Dưới mức', 'Đủ mức') AS flag\nFROM employees\nWHERE department_id IN (30, 40);",
            oracle:
              "SELECT last_name, salary,\n  GREATEST(salary, 15000000) AS floor_pay,\n  LEAST(salary, 25000000) AS capped,\n  CASE WHEN salary < 15000000 THEN 'Dưới mức' ELSE 'Đủ mức' END AS flag\nFROM employees\nWHERE department_id IN (30, 40)",
          },
        },
        {
          label: 'Thêm GREATEST(salary, commission_pct)',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  GREATEST(salary, 15000000) AS floor_pay,\n  GREATEST(salary, commission_pct) AS with_null,\n  IF(salary < 15000000, 'Dưới mức', 'Đủ mức') AS flag\nFROM employees\nWHERE department_id IN (30, 40);",
            oracle:
              "SELECT last_name, salary,\n  GREATEST(salary, 15000000) AS floor_pay,\n  GREATEST(salary, commission_pct) AS with_null,\n  CASE WHEN salary < 15000000 THEN 'Dưới mức' ELSE 'Đủ mức' END AS flag\nFROM employees\nWHERE department_id IN (30, 40)",
          },
        },
      ],
      say: 'Mục cuối cho thấy một NULL làm cả GREATEST thành NULL, dù lương có đủ lớn. Nhân viên phòng IT và Tài chính không có hoa hồng.',
    },
    {
      type: 'oracle',
      body: [
        'CASE WHEN viết giống nhau ở cả hai dialect. Các điểm khác nằm ở function đi kèm.',
        'DECODE chỉ có ở Oracle. MySQL báo lỗi 1305 khi gặp DECODE. Oracle báo ORA-00904 khi gặp IF.',
        'IF(điều kiện, a, b) chỉ có ở MySQL. Ở Oracle, viết `CASE WHEN điều kiện THEN a ELSE b END`.',
        'DECODE coi hai NULL là bằng nhau: `DECODE(NULL, NULL, \'là NULL\', \'khác\')` ra `là NULL`. `CASE NULL WHEN NULL THEN \'là NULL\' ELSE \'khác\' END` ra `khác`. Muốn bắt NULL trong CASE, viết `WHEN x IS NULL`.',
        'GREATEST và LEAST có ở cả hai dialect. Một giá trị NULL trong danh sách làm kết quả thành NULL ở cả hai.',
      ],
      mysql: "CASE department_id WHEN 30 THEN 'IT' ELSE 'Khác' END\nIF(salary < 15000000, 'Thấp', 'Cao')\nGREATEST(salary, 15000000)",
      oracle: "DECODE(department_id, 30, 'IT', 'Khác')\nCASE WHEN salary < 15000000 THEN 'Thấp' ELSE 'Cao' END\nGREATEST(salary, 15000000)",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: "Query có `CASE WHEN salary < 30000000 THEN 'Vừa' WHEN salary < 15000000 THEN 'Thấp' END`. Người có lương 12 triệu nhận nhãn gì?",
          options: [
            { text: 'Thấp', feedback: 'Database dừng ở WHEN đầu tiên đúng. 12 triệu nhỏ hơn 30 triệu nên dừng ngay ở đó.' },
            { text: 'Vừa', correct: true, feedback: 'Đúng. WHEN đầu tiên đã đúng, nên database không xét WHEN sau.' },
            { text: 'NULL', feedback: 'Điều kiện đầu đã đúng, nên đã có nhãn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Một CASE WHEN không có ELSE, và không điều kiện nào đúng. Kết quả là gì?',
          options: [
            { text: 'NULL', correct: true, feedback: 'Đúng. Thiếu ELSE thì kết quả là NULL.' },
            { text: 'Chuỗi rỗng', feedback: 'Database không tự điền chữ nào. Kết quả là NULL.' },
            { text: 'Lỗi', feedback: 'Query vẫn chạy bình thường. Kết quả là NULL.' },
          ],
        },
        {
          kind: 'choice',
          question: "Oracle: `DECODE(department_id, 20, 'Kinh doanh', 30, 'IT', 'Khác')`. Một người ở phòng 50 nhận kết quả gì?",
          options: [
            { text: 'Khác', correct: true, feedback: 'Đúng. Giá trị cuối đứng một mình là kết quả mặc định, khi không giá trị nào khớp.' },
            { text: 'NULL', feedback: 'DECODE chỉ ra NULL khi bạn bỏ giá trị mặc định. Ở đây có chữ Khác.' },
            { text: 'IT', feedback: 'Phòng 50 không bằng 20 và không bằng 30, nên không khớp cặp nào.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Hạng khách thân thiết và code cũ của công ty',
      paragraphs: [
        'Một app có thể chia khách thành hạng đồng, bạc và vàng theo số tiền đã chi.',
        'Query dùng CASE WHEN: chi trên mức thứ nhất là vàng, trên mức thứ hai là bạc, còn lại là đồng.',
        'Ở công ty dùng Oracle lâu năm, bạn sẽ gặp DECODE trong các query cũ. Bạn đọc từng cặp giá trị và kết quả, rồi viết lại bằng CASE khi cần sửa.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'CASE WHEN xét điều kiện từ trên xuống và dừng ở điều kiện đúng đầu tiên. Thiếu ELSE thì kết quả là NULL.',
        'CASE column WHEN giá trị chỉ so bằng. Oracle có DECODE cùng mục đích, và DECODE coi hai NULL là bằng nhau.',
        'IF(điều kiện, a, b) chỉ có ở MySQL. Ở Oracle viết CASE.',
        'GREATEST đặt mức tối thiểu, LEAST đặt mức tối đa. Một giá trị NULL trong danh sách làm kết quả thành NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Flow Control Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/flow-control-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, CASE Expressions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CASE-Expressions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, DECODE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/DECODE.html' },
        { name: 'Oracle Database 19c SQL Language Reference, GREATEST', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GREATEST.html' },
      ],
    },
  ],
};
