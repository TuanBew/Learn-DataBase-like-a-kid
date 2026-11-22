import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b1',
  chapter: 5,
  order: 1,
  title: 'Phép tính và function số',
  lead: 'Bạn nhờ database tính giá mới, làm tròn tiền lương và chia lấy dư ngay trong kết quả.',
  minutes: 17,
  goals: [
    'Tính toán bằng + - * / trong SELECT',
    'Đặt tên cho column vừa tính bằng AS',
    'Làm tròn tới chục, trăm, nghìn bằng ROUND, và cắt bớt bằng TRUNC hoặc TRUNCATE',
    'Dùng CEIL, FLOOR, MOD, ABS và POWER',
    'Biết MySQL và Oracle viết khác nhau ở đâu, và một số NULL làm cả phép tính thành NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Giảm 10% thì còn bao nhiêu?',
      paragraphs: [
        'Tiệm đang giảm 10% cho nhóm Trà sữa. Một khách hỏi Bi: "Ly trà sữa trân châu giờ còn bao nhiêu?"',
        'Bi không bấm máy tính. Giá gốc là 35.000 đồng. Mình lấy 35.000 nhân `0.9` và ra 31.500 đồng.',
        'Nhóm Trà sữa có bốn món. Bi phải nhân bốn lần, mỗi món một lần.',
        'Database làm cả bốn phép nhân cùng lúc, ngay trong query.',
      ],
    },
    {
      type: 'text',
      title: 'Phép tính đứng ở chỗ column',
      paragraphs: [
        '**[[expression]]** là một phép tính đứng trong query. Bạn viết nó ở chỗ column thường đứng.',
        'Có bốn phép tính: `+` (cộng), `-` (trừ), `*` (nhân), `/` (chia).',
        'Database tính phép tính cho từng row, mỗi row một lần. Kết quả là một column mới.',
        'Column mới chỉ có trong kết quả. Table products không đổi.',
        'Muốn đặt tên cho column mới, viết `AS` rồi gõ tên. Tên này là **[[alias]]**.',
        'Query dưới đây tính giá sau khi giảm 10%.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: giá sau khi giảm 10%',
      intro: 'Bấm Chạy. Column sale_price do query tính ra, không có sẵn trong table.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, price, price * 0.9 AS sale_price\nFROM products\nWHERE category = 'Trà sữa';",
        oracle: "SELECT name, price, price * 0.9 AS sale_price\nFROM products\nWHERE category = 'Trà sữa'",
      },
      tries: [
        {
          label: 'Đổi * 0.9 thành - 5000',
          sql: {
            mysql: "SELECT name, price, price - 5000 AS sale_price\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, price, price - 5000 AS sale_price\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: 'Đổi 0.9 thành 0.8',
          sql: {
            mysql: "SELECT name, price, price * 0.8 AS sale_price\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, price, price * 0.8 AS sale_price\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: 'Đổi tên sale_price thành new_price',
          sql: {
            mysql: "SELECT name, price, price * 0.9 AS new_price\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, price, price * 0.9 AS new_price\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
      ],
      say: 'Bạn đổi con số thì giá mới đổi theo. Column price gốc vẫn nằm yên bên cạnh.',
    },
    {
      type: 'text',
      title: 'Làm tròn số lẻ',
      paragraphs: [
        'Phép chia hay cho số lẻ rất dài. Giá chia cho calo là một ví dụ.',
        '**[[round]]** làm tròn số. Viết `ROUND(số, n)`, với n là số chữ số giữ lại sau dấu thập phân.',
        'Nếu n bằng 0, ROUND làm tròn thành số nguyên.',
        'Nếu một số trong phép tính là NULL, kết quả cũng là NULL. Món chưa có calo thì không chia được.',
        'Query dưới đây tính số đồng cho mỗi calo của các món Trà sữa.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đồng cho mỗi calo',
      intro: 'Bấm Chạy. `ROUND(..., 1)` giữ một chữ số sau dấu thập phân.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
        oracle: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
      },
      tries: [
        {
          label: 'Đổi ROUND(..., 1) thành ROUND(..., 0)',
          sql: {
            mysql: "SELECT name, calories, ROUND(price / calories, 0) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, calories, ROUND(price / calories, 0) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: 'Bỏ ROUND',
          sql: {
            mysql: "SELECT name, calories, price / calories AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, calories, price / calories AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: "Đổi 'Trà sữa' thành 'Cà phê'",
          sql: {
            mysql: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Cà phê';",
            oracle: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Cà phê'",
          },
        },
      ],
      say: 'Thử mục cuối. Món Cà phê cacao đá xay chưa có calo, nên kết quả của món đó là NULL.',
    },
    {
      type: 'text',
      title: 'Làm tròn tới chục, trăm, nghìn',
      paragraphs: [
        'Kế toán chia lương tháng cho 22 ngày công để ra lương ngày. Kết quả hiếm khi tròn, và phiếu lương không ghi số lẻ.',
        'Số n trong `ROUND(số, n)` được phép âm. Số âm đếm sang bên trái dấu thập phân.',
        '`ROUND(x, -1)` làm tròn tới chục. `ROUND(x, -2)` tới trăm. `ROUND(x, -3)` tới nghìn.',
        'Phần bỏ đi từ nửa trở lên thì ROUND làm tròn lên. Dưới nửa thì làm tròn xuống.',
        '**[[trunc-number]]** cắt bớt, không làm tròn. Oracle viết `TRUNC(số, n)`, MySQL viết `TRUNCATE(số, n)`. Luật của n giống ROUND.',
        '**[[ceil-floor]]** đưa số về số nguyên. `CEIL(x)` làm tròn lên, `FLOOR(x)` làm tròn xuống. Số 2,1 qua CEIL ra 3, qua FLOOR ra 2.',
        'Muốn CEIL hay FLOOR tới nghìn, chia cho 1000 trước, rồi nhân 1000 sau.',
        'Query dưới đây tính lương ngày của phòng IT theo bốn cách.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lương ngày của phòng IT',
      intro: 'Bấm Chạy. Bốn column cùng xuất phát từ `salary / 22`, mỗi column làm tròn một kiểu.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT last_name, salary,\n  ROUND(salary / 22, -3) AS rounded,\n  TRUNCATE(salary / 22, -3) AS cut,\n  CEIL(salary / 22 / 1000) * 1000 AS up,\n  FLOOR(salary / 22 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 30;',
        oracle:
          'SELECT last_name, salary,\n  ROUND(salary / 22, -3) AS rounded,\n  TRUNC(salary / 22, -3) AS cut,\n  CEIL(salary / 22 / 1000) * 1000 AS up,\n  FLOOR(salary / 22 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 30',
      },
      tries: [
        {
          label: 'Đổi -3 thành -4 ở column rounded và cut',
          sql: {
            mysql:
              'SELECT last_name, salary,\n  ROUND(salary / 22, -4) AS rounded,\n  TRUNCATE(salary / 22, -4) AS cut,\n  CEIL(salary / 22 / 1000) * 1000 AS up,\n  FLOOR(salary / 22 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, salary,\n  ROUND(salary / 22, -4) AS rounded,\n  TRUNC(salary / 22, -4) AS cut,\n  CEIL(salary / 22 / 1000) * 1000 AS up,\n  FLOOR(salary / 22 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi 22 thành 26',
          sql: {
            mysql:
              'SELECT last_name, salary,\n  ROUND(salary / 26, -3) AS rounded,\n  TRUNCATE(salary / 26, -3) AS cut,\n  CEIL(salary / 26 / 1000) * 1000 AS up,\n  FLOOR(salary / 26 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, salary,\n  ROUND(salary / 26, -3) AS rounded,\n  TRUNC(salary / 26, -3) AS cut,\n  CEIL(salary / 26 / 1000) * 1000 AS up,\n  FLOOR(salary / 26 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi phòng 30 thành phòng 40',
          sql: {
            mysql:
              'SELECT last_name, salary,\n  ROUND(salary / 22, -3) AS rounded,\n  TRUNCATE(salary / 22, -3) AS cut,\n  CEIL(salary / 22 / 1000) * 1000 AS up,\n  FLOOR(salary / 22 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 40;',
            oracle:
              'SELECT last_name, salary,\n  ROUND(salary / 22, -3) AS rounded,\n  TRUNC(salary / 22, -3) AS cut,\n  CEIL(salary / 22 / 1000) * 1000 AS up,\n  FLOOR(salary / 22 / 1000) * 1000 AS down\nFROM employees\nWHERE department_id = 40',
          },
        },
      ],
      say: 'Nhìn kết quả của Đạt. Lương ngày là 1.272.727 đồng. ROUND ra 1.273.000, còn cut ra 1.272.000. Hai kiểu chỉ khác nhau khi phần bỏ đi từ nửa trở lên.',
    },
    {
      type: 'text',
      title: 'Số dư, giá trị tuyệt đối và lũy thừa',
      paragraphs: [
        '**[[mod]]** cho phần dư của phép chia. `MOD(17, 5)` ra 2, vì 17 chia 5 được 3 và dư 2.',
        'Người đi làm dùng MOD để chia chẵn lẻ. `MOD(mã, 2)` ra 0 là số chẵn, ra 1 là số lẻ.',
        '**[[abs]]** bỏ dấu âm. `ABS(-8)` ra 8. Bạn dùng ABS khi chỉ quan tâm khoảng lệch, không quan tâm lệch lên hay xuống.',
        '**[[power]]** là lũy thừa. `POWER(a, n)` nhân a với chính nó n lần. `POWER(2, 10)` ra 1024.',
        'Tiền lãi kép cũng dùng POWER. Tăng 5% mỗi năm trong hai năm thì nhân với `POWER(1.05, 2)`.',
        'Query dưới đây so lương phòng IT với mức 20 triệu, và tính lương sau hai năm tăng 5%.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: chênh lệch và lương sau hai năm',
      intro: 'Bấm Chạy. Column gap là khoảng lệch so với 20 triệu, luôn là số dương.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT employee_id, salary,\n  MOD(employee_id, 2) AS odd_even,\n  ABS(salary - 20000000) AS gap,\n  ROUND(salary * POWER(1.05, 2)) AS after_2y\nFROM employees\nWHERE department_id = 30;',
        oracle:
          'SELECT employee_id, salary,\n  MOD(employee_id, 2) AS odd_even,\n  ABS(salary - 20000000) AS gap,\n  ROUND(salary * POWER(1.05, 2)) AS after_2y\nFROM employees\nWHERE department_id = 30',
      },
      tries: [
        {
          label: 'Bỏ ABS, chỉ giữ salary - 20000000',
          sql: {
            mysql:
              'SELECT employee_id, salary,\n  MOD(employee_id, 2) AS odd_even,\n  salary - 20000000 AS gap,\n  ROUND(salary * POWER(1.05, 2)) AS after_2y\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT employee_id, salary,\n  MOD(employee_id, 2) AS odd_even,\n  salary - 20000000 AS gap,\n  ROUND(salary * POWER(1.05, 2)) AS after_2y\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi POWER(1.05, 2) thành POWER(1.05, 5)',
          sql: {
            mysql:
              'SELECT employee_id, salary,\n  MOD(employee_id, 2) AS odd_even,\n  ABS(salary - 20000000) AS gap,\n  ROUND(salary * POWER(1.05, 5)) AS after_2y\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT employee_id, salary,\n  MOD(employee_id, 2) AS odd_even,\n  ABS(salary - 20000000) AS gap,\n  ROUND(salary * POWER(1.05, 5)) AS after_2y\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi MOD(employee_id, 2) thành MOD(employee_id, 3)',
          sql: {
            mysql:
              'SELECT employee_id, salary,\n  MOD(employee_id, 3) AS odd_even,\n  ABS(salary - 20000000) AS gap,\n  ROUND(salary * POWER(1.05, 2)) AS after_2y\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT employee_id, salary,\n  MOD(employee_id, 3) AS odd_even,\n  ABS(salary - 20000000) AS gap,\n  ROUND(salary * POWER(1.05, 2)) AS after_2y\nFROM employees\nWHERE department_id = 30',
          },
        },
      ],
      say: 'Bỏ ABS thì lương dưới 20 triệu ra số âm. Có ABS thì chỉ còn độ lệch.',
    },
    {
      type: 'oracle',
      body: [
        'Phép tính, ROUND, CEIL, FLOOR, MOD, ABS và POWER viết giống nhau ở cả hai dialect. Bốn điểm khác nằm ở dưới.',
        'Lấy phần dư: MySQL có dấu `%`. Oracle không có dấu này và báo ORA-00911. Oracle chỉ dùng `MOD(a, b)`.',
        'Cắt bớt số: MySQL gọi `TRUNCATE(số, n)`. Oracle gọi `TRUNC(số, n)`. Gọi nhầm tên thì MySQL báo lỗi 1305, Oracle báo ORA-00904.',
        'Chia cho 0: MySQL ra NULL. Oracle báo lỗi ORA-01476.',
        'Query không có table: MySQL cho chạy `SELECT 1 + 1`. Oracle luôn cần FROM, nên viết `SELECT 1 + 1 FROM DUAL`. DUAL là table có sẵn, chỉ có một row, dùng để thử phép tính.',
      ],
      mysql: 'salary % 1000000\nTRUNCATE(salary / 22, -3)\nsalary / 0   -- ra NULL\nSELECT 1 + 1;',
      oracle: 'MOD(salary, 1000000)\nTRUNC(salary / 22, -3)\nsalary / 0   -- lỗi ORA-01476\nSELECT 1 + 1 FROM DUAL',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Lương ngày của một người là 1.272.727 đồng. Bạn muốn làm tròn tới nghìn đồng, ra 1.273.000. Viết thế nào?',
          options: [
            { text: '`ROUND(salary / 22, -3)`', correct: true, feedback: 'Đúng. Số -3 đếm ba chữ số sang trái dấu thập phân, tức là tới nghìn.' },
            { text: '`ROUND(salary / 22, 3)`', feedback: 'Số 3 dương giữ ba chữ số sau dấu thập phân. Kết quả vẫn còn phần lẻ.' },
            { text: '`TRUNC(salary / 22, -3)`', feedback: 'TRUNC cắt bớt, không làm tròn. Kết quả là 1.272.000, không phải 1.273.000.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn cắt bớt phần lẻ của một số, không làm tròn. Bạn đang dùng Oracle. Viết thế nào?',
          options: [
            { text: '`TRUNCATE(x, 0)`', feedback: 'TRUNCATE là function của MySQL. Oracle báo ORA-00904.' },
            { text: '`TRUNC(x, 0)`', correct: true, feedback: 'Đúng. Oracle cắt bớt số bằng TRUNC. MySQL gọi function này là TRUNCATE.' },
            { text: '`ROUND(x, 0)`', feedback: 'ROUND làm tròn. 2,7 qua ROUND ra 3, còn qua TRUNC ra 2.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `price / calories` cho món chưa có calo. Kết quả là gì?',
          options: [
            { text: '0', feedback: 'Số 0 là một giá trị có thật. Chưa có calo nghĩa là chưa biết, nên kết quả cũng chưa biết.' },
            { text: 'NULL', correct: true, feedback: 'Đúng. Một số NULL làm cả phép tính thành NULL.' },
            { text: 'Lỗi chia cho 0', feedback: 'NULL khác 0. Calo chưa có nên kết quả là NULL, và query không báo lỗi.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Giá sau khuyến mãi trong app mua sắm',
      paragraphs: [
        'Bạn mở một app mua sắm vào ngày giảm giá. Giá gốc và giá sau giảm hiện cạnh nhau.',
        'App có thể không lưu sẵn giá sau giảm. Query tính nó bằng một phép nhân, ngay lúc bạn mở trang.',
        'Ở công ty, phòng kế toán làm tròn lương ngày, thuế và phụ cấp bằng ROUND và TRUNC trước khi in phiếu lương. Mỗi công ty quy định làm tròn lên, xuống hay cắt bớt, nên bạn hỏi quy định trước khi viết query.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Phép tính đứng trong SELECT, ở chỗ column. Đặt tên column mới bằng AS. Table gốc không đổi.',
        '`ROUND(số, -3)` làm tròn tới nghìn. TRUNC (Oracle) và TRUNCATE (MySQL) cắt bớt. CEIL làm tròn lên, FLOOR làm tròn xuống.',
        'MOD cho số dư, ABS bỏ dấu âm, POWER là lũy thừa. Oracle không có dấu `%`, không chia được cho 0, và cần `FROM DUAL` khi không có table.',
        'Một số NULL trong phép tính làm kết quả thành NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 9: Queries with expressions', url: 'https://sqlbolt.com/lesson/select_queries_with_expressions' },
        { name: 'MySQL 8.0 Reference Manual, Mathematical Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/mathematical-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Single-Row Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Single-Row-Functions.html' },
      ],
    },
  ],
};
