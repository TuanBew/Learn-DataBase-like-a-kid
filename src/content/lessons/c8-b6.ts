import type { Lesson } from '../types';

const two = (op: string, end: string) =>
  `SELECT country_id FROM locations
${op}
SELECT country_id FROM customers
ORDER BY country_id${end}`;

const flip = (op: string, end: string) =>
  `SELECT country_id FROM customers
${op}
SELECT country_id FROM locations
ORDER BY country_id${end}`;

export const lesson: Lesson = {
  id: 'c8-b6',
  chapter: 8,
  order: 6,
  title: 'UNION, UNION ALL, INTERSECT, MINUS',
  lead: 'Bạn xếp kết quả của hai query chồng lên nhau, rồi chọn giữ phần nào.',
  minutes: 15,
  goals: [
    'Ghép hai danh sách bằng UNION và UNION ALL',
    'Lấy phần chung bằng INTERSECT',
    'Lấy phần chỉ có bên trái bằng MINUS (Oracle) hoặc EXCEPT (MySQL)',
    'Biết các luật về số column, data type và ORDER BY',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Công ty có mặt ở những nước nào?',
      paragraphs: [
        'Giám đốc hỏi Bi: "Công ty đang có mặt ở những nước nào?"',
        'Câu trả lời nằm ở hai nơi. Table locations ghi nước của các văn phòng. Table customers ghi nước của khách.',
        'Bi viết hai query nhỏ, mỗi query ra một danh sách mã nước. Rồi Bi muốn dán hai danh sách thành một.',
        'Phép ghép này xếp hai danh sách chồng lên nhau, không nối row theo column như JOIN.',
      ],
    },
    {
      type: 'text',
      title: 'Bốn phép ghép kết quả',
      paragraphs: [
        'JOIN thêm column cho mỗi row. Phép ghép kết quả xếp row của query này nối tiếp row của query kia.',
        '**[[union]]** ghép hai danh sách và bỏ row trùng. **[[union-all]]** ghép và giữ mọi row, kể cả row trùng.',
        '**[[intersect]]** chỉ giữ row có mặt ở cả hai danh sách.',
        '**[[minus]]** chỉ giữ row có ở danh sách bên trái mà không có ở bên phải. MySQL gọi phép này là **[[except]]**.',
        'Với dữ liệu công ty, locations có 6 văn phòng và customers có 30 khách. UNION ra 8 nước. UNION ALL ra 36 row. INTERSECT ra 4 nước.',
        'MINUS và EXCEPT có thứ tự. Đổi hai bên thì kết quả khác.',
        'Ba luật cần nhớ. Hai query phải cùng số column. Column cùng vị trí phải cùng nhóm data type, như số với số và chữ với chữ. Tên column của kết quả lấy từ query đầu.',
        '`ORDER BY` chỉ đứng ở cuối cả chuỗi và sắp xếp cả kết quả ghép. Không đặt ORDER BY ở giữa.',
        'Muốn biết row đến từ query nào, thêm một column nhãn vào cả hai query, ví dụ `\'Văn phòng\' AS loai` và `\'Khách\' AS loai`.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nước có văn phòng hoặc có khách',
      intro: 'Bấm Chạy. Rồi đổi phép ghép và đếm row.',
      database: 'company',
      tables: ['locations', 'customers'],
      dialects: ['mysql', 'oracle'],
      sql: { mysql: two('UNION', ';'), oracle: two('UNION', '') },
      tries: [
        {
          label: 'Đổi UNION thành UNION ALL',
          sql: { mysql: two('UNION ALL', ';'), oracle: two('UNION ALL', '') },
        },
        {
          label: 'Đổi UNION thành INTERSECT',
          sql: { mysql: two('INTERSECT', ';'), oracle: two('INTERSECT', '') },
        },
        {
          label: 'Nước có khách mà chưa có văn phòng: customers MINUS (Oracle) hoặc EXCEPT (MySQL) locations',
          sql: { mysql: flip('EXCEPT', ';'), oracle: flip('MINUS', '') },
        },
        {
          label: 'Đảo hai bên: locations MINUS (Oracle) hoặc EXCEPT (MySQL) customers',
          sql: { mysql: two('EXCEPT', ';'), oracle: two('MINUS', '') },
        },
      ],
      say: 'UNION ra 8 nước, UNION ALL ra 36 row. INTERSECT giữ 4 nước: DE, JP, SG và VN. Khách có ở FR, US, CA và AE nhưng công ty chưa có văn phòng ở đó. Đảo hai bên thì ra 0 row, vì nước nào có văn phòng cũng có khách.',
    },
    {
      type: 'text',
      title: 'Khi hai query không hợp nhau',
      paragraphs: [
        'Hai query lệch số column thì database báo lỗi. MySQL báo 1222. Oracle báo ORA-01789.',
        'Lệch data type thì hai dialect xử lý khác nhau. Oracle báo ORA-01790 khi một bên là chữ và một bên là số.',
        'MySQL tự đổi hai bên sang chữ và vẫn chạy. Vì vậy MySQL dễ cho kết quả lạ mà không báo lỗi. Ví dụ ghép country_id với credit_limit ra 34 row lẫn chữ và số.',
        'NULL không làm lệch data type. Bạn ghép NULL với số hay chữ đều được.',
        'Khi bạn biết hai query không có row trùng, dùng UNION ALL. Database khỏi phải so row để loại trùng.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Phép "chỉ có ở bên trái" tên khác nhau. Oracle viết MINUS. MySQL viết EXCEPT.',
        'Viết nhầm dialect thì báo lỗi. MySQL gặp MINUS báo 1064. Oracle 19c gặp EXCEPT báo ORA-00933.',
        'MySQL chỉ có INTERSECT và EXCEPT từ bản 8.0.31. MySQL 5.7 không có hai phép này.',
        'UNION và UNION ALL chạy ở mọi bản của cả hai dialect. Query dưới đây lấy nước có khách mà chưa có văn phòng.',
      ],
      mysql:
        'SELECT country_id FROM customers\nEXCEPT\nSELECT country_id FROM locations\nORDER BY country_id;',
      oracle:
        'SELECT country_id FROM customers\nMINUS\nSELECT country_id FROM locations\nORDER BY country_id',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Hai danh sách có chung vài nước. Bạn muốn mỗi nước chỉ hiện một lần. Chọn phép nào?',
          options: [
            { text: 'UNION', correct: true, feedback: 'Đúng. UNION ghép hai danh sách và bỏ row trùng.' },
            { text: 'UNION ALL', feedback: 'UNION ALL giữ mọi row. Nước nào có ở cả hai danh sách sẽ hiện hai lần.' },
            { text: 'INTERSECT', feedback: 'INTERSECT chỉ giữ nước có ở cả hai danh sách. Nước chỉ có một bên sẽ mất.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Trên Oracle, bạn muốn các nước có khách mà chưa có văn phòng. Query nào đúng?',
          options: [
            { text: '`SELECT country_id FROM customers MINUS SELECT country_id FROM locations`', correct: true, feedback: 'Đúng. MINUS giữ row chỉ có ở bên trái, và bên trái là customers.' },
            { text: '`SELECT country_id FROM customers EXCEPT SELECT country_id FROM locations`', feedback: 'EXCEPT là chữ của MySQL. Oracle 19c báo ORA-00933.' },
            { text: '`SELECT country_id FROM locations MINUS SELECT country_id FROM customers`', feedback: 'Query này đảo hai bên. Kết quả là nước có văn phòng mà không có khách, và ở đây ra 0 row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query bên trái có 2 column, query bên phải có 1 column. Bạn ghép bằng UNION. Chuyện gì xảy ra?',
          options: [
            { text: 'Database báo lỗi: MySQL 1222, Oracle ORA-01789', correct: true, feedback: 'Đúng. Hai query phải cùng số column.' },
            { text: 'Database tự thêm NULL cho bên thiếu', feedback: 'Database không tự thêm gì. Bạn phải viết NULL vào query ngắn hơn.' },
            { text: 'Database chỉ giữ column đầu tiên', feedback: 'Database không cắt column. Lệch số column là lỗi.' },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c8-e8', 'c8-e9'] },
    {
      type: 'realworld',
      title: 'Đối soát hai danh sách khách',
      paragraphs: [
        'Một đội vận hành có hai danh sách khách: một từ hệ thống kinh doanh, một từ hệ thống kế toán.',
        'Họ muốn biết khách nào có ở bên này mà bên kia chưa có.',
        'Họ viết hai query MINUS, mỗi query một chiều, rồi ghép hai kết quả bằng UNION ALL. Danh sách ra là các khách cần kiểm lại.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'UNION bỏ row trùng. UNION ALL giữ hết. INTERSECT lấy phần chung. MINUS (Oracle) hoặc EXCEPT (MySQL) lấy phần chỉ có ở bên trái.',
        'Hai query phải cùng số column, và column cùng vị trí phải cùng nhóm data type. ORDER BY chỉ đứng ở cuối.',
        'Lệch số column: MySQL 1222, Oracle ORA-01789. Lệch data type: Oracle ORA-01790, MySQL tự đổi sang chữ.',
        'MySQL có INTERSECT và EXCEPT từ bản 8.0.31. Viết nhầm MINUS hay EXCEPT thì báo lỗi.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'SQLBolt, Topic: Unions, Intersections & Exceptions', url: 'https://sqlbolt.com/topic/set_operations' },
        { name: 'Harvard CS50 SQL, Lecture 1', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, UNION Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/union.html' },
        { name: 'MySQL 8.0 Reference Manual, INTERSECT Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/intersect.html' },
        { name: 'MySQL 8.0 Reference Manual, EXCEPT Clause', url: 'https://dev.mysql.com/doc/refman/8.0/en/except.html' },
        { name: 'Oracle Database 19c SQL Language Reference, The UNION [ALL], INTERSECT, MINUS Operators', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/The-UNION-ALL-INTERSECT-MINUS-Operators.html' },
      ],
    },
  ],
};
