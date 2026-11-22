import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b6',
  chapter: 5,
  order: 6,
  title: 'Đổi data type: TO_CHAR, TO_NUMBER, CAST, và đổi ngầm',
  lead: 'Bạn đổi số thành chữ có dấu phẩy nghìn, đổi chữ thành số, và biết lúc nào database tự đổi thay bạn.',
  minutes: 17,
  goals: [
    'Đổi data type bằng CAST ở cả hai dialect',
    'Đổi số thành chữ có dấu phẩy nghìn bằng FORMAT (MySQL) và TO_CHAR (Oracle)',
    'Đổi chữ thành số bằng TO_NUMBER, CONVERT hoặc CAST',
    'Biết MySQL đổi ngầm lặng lẽ còn Oracle báo lỗi ORA-01722',
    'Biết so chuỗi số với nhau thì chuỗi 10 đứng trước chuỗi 9',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ba lỗi trong file Excel của kế toán',
      paragraphs: [
        'Kế toán xuất danh sách lương từ database ra file Excel và gửi bạn xem. Bạn thấy ba chuyện lạ.',
        'Lương hiện là 38000000, không có dấu phẩy. Kế toán muốn đọc là 38,000,000.',
        'Số điện thoại 0910000137 hiện thành 910000137. Số 0 ở đầu biến mất.',
        'Cuối cùng, khi sắp xếp, mã 10 đứng trước mã 9. Bạn tưởng database sắp sai.',
        'Cả ba chuyện cùng một gốc: data type. Bi nói: "Mình xem từng chuyện một."',
      ],
    },
    {
      type: 'text',
      title: 'CAST đổi data type',
      paragraphs: [
        'Mỗi giá trị có một **[[data-type]]**: số, chữ hoặc ngày. Database xử lý mỗi data type một kiểu.',
        '**[[cast]]** đổi một giá trị sang data type khác. Viết `CAST(giá trị AS data type)`. CAST chuẩn ở cả hai dialect.',
        'Tên data type khác nhau. MySQL dùng SIGNED cho số nguyên, `DECIMAL(p, s)` cho số có lẻ, CHAR cho chữ. Oracle dùng NUMBER, `NUMBER(p, s)` và `VARCHAR2(n)`.',
        'Trong `DECIMAL(12, 2)`, số 12 là tổng số chữ số và số 2 là số chữ số sau dấu thập phân.',
        'MySQL còn có `CONVERT(giá trị, data type)`. CONVERT cho kết quả giống CAST.',
        'Oracle còn có **[[to-number]]**: `TO_NUMBER(chuỗi)` đổi chuỗi thành số.',
        'Khi đổi chuỗi `0910000137` thành số, số 0 ở đầu mất đi. Số không có số 0 đứng đầu.',
        'Query dưới đây đổi số điện thoại của phòng IT thành số, và tính lương ngày có hai chữ số lẻ.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đổi chữ thành số',
      intro: 'Bấm Chạy. Các column sau phone_number đổi số điện thoại thành số. Nhìn số 0 ở đầu.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT last_name, phone_number,\n  CAST(phone_number AS SIGNED) AS cast_num,\n  CONVERT(phone_number, SIGNED) AS convert_num,\n  CAST(salary / 22 AS DECIMAL(12, 2)) AS per_day\nFROM employees\nWHERE department_id = 30;',
        oracle:
          'SELECT last_name, phone_number,\n  CAST(phone_number AS NUMBER) AS cast_num,\n  TO_NUMBER(phone_number) AS to_num,\n  CAST(salary / 22 AS NUMBER(12, 2)) AS per_day\nFROM employees\nWHERE department_id = 30',
      },
      tries: [
        {
          label: 'Đổi (12, 2) thành (12, 0)',
          sql: {
            mysql:
              'SELECT last_name, phone_number,\n  CAST(phone_number AS SIGNED) AS cast_num,\n  CONVERT(phone_number, SIGNED) AS convert_num,\n  CAST(salary / 22 AS DECIMAL(12, 0)) AS per_day\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, phone_number,\n  CAST(phone_number AS NUMBER) AS cast_num,\n  TO_NUMBER(phone_number) AS to_num,\n  CAST(salary / 22 AS NUMBER(12, 0)) AS per_day\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi số thành chữ: CAST(employee_id AS CHAR)',
          sql: {
            mysql:
              'SELECT last_name, phone_number,\n  CAST(phone_number AS SIGNED) AS cast_num,\n  CAST(employee_id AS CHAR) AS id_text,\n  CAST(salary / 22 AS DECIMAL(12, 2)) AS per_day\nFROM employees\nWHERE department_id = 30;',
            oracle:
              'SELECT last_name, phone_number,\n  CAST(phone_number AS NUMBER) AS cast_num,\n  CAST(employee_id AS VARCHAR2(10)) AS id_text,\n  CAST(salary / 22 AS NUMBER(12, 2)) AS per_day\nFROM employees\nWHERE department_id = 30',
          },
        },
        {
          label: 'Đổi phòng 30 thành phòng 70',
          sql: {
            mysql:
              'SELECT last_name, phone_number,\n  CAST(phone_number AS SIGNED) AS cast_num,\n  CONVERT(phone_number, SIGNED) AS convert_num,\n  CAST(salary / 22 AS DECIMAL(12, 2)) AS per_day\nFROM employees\nWHERE department_id = 70;',
            oracle:
              'SELECT last_name, phone_number,\n  CAST(phone_number AS NUMBER) AS cast_num,\n  TO_NUMBER(phone_number) AS to_num,\n  CAST(salary / 22 AS NUMBER(12, 2)) AS per_day\nFROM employees\nWHERE department_id = 70',
          },
        },
      ],
      say: 'Số điện thoại 0910000137 thành 910000137 khi đổi sang số. Bạn muốn giữ số 0 thì giữ nó ở dạng chữ. Phòng 70 có người chưa có số, và NULL qua CAST vẫn là NULL.',
    },
    {
      type: 'text',
      title: 'Đổi số thành chữ có dấu phẩy nghìn',
      paragraphs: [
        'MySQL có **[[format-number]]**: `FORMAT(số, n)`. n là số chữ số sau dấu thập phân. `FORMAT(38000000, 0)` ra `38,000,000`.',
        'Oracle dùng `TO_CHAR(số, \'mẫu\')`. Mẫu là một chuỗi mô tả hình dạng của kết quả.',
        'Trong mẫu, mỗi số 9 là một chữ số. Dấu phẩy là dấu phẩy nghìn. Mẫu `999,999,999` chứa được số có tới chín chữ số.',
        'Số 0 trong mẫu là chữ số bắt buộc. `TO_CHAR(104, \'FM000000\')` ra `000104`.',
        'Tiền tố FM bỏ khoảng trắng thừa. Thiếu FM thì Oracle đệm khoảng trắng ở đầu, kể cả chỗ dành cho dấu âm.',
        'Số có nhiều chữ số hơn mẫu thì Oracle ra một dãy dấu `#`. Mẫu phải đủ dài.',
        'Query dưới đây in lương của phòng IT với dấu phẩy nghìn.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lương có dấu phẩy nghìn',
      intro: 'Bấm Chạy. Column label ghép chữ Lương, số có dấu phẩy và chữ đ.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT last_name, salary,\n  FORMAT(salary, 0) AS with_comma,\n  CONCAT('Lương: ', FORMAT(salary, 0), ' đ') AS label\nFROM employees\nWHERE department_id = 30;",
        oracle:
          "SELECT last_name, salary,\n  TO_CHAR(salary, 'FM999,999,999') AS with_comma,\n  'Lương: ' || TO_CHAR(salary, 'FM999,999,999') || ' đ' AS label\nFROM employees\nWHERE department_id = 30",
      },
      tries: [
        {
          label: "Bỏ FM khỏi mẫu (MySQL không đổi)",
          sql: {
            mysql:
              "SELECT last_name, salary,\n  FORMAT(salary, 0) AS with_comma,\n  CONCAT('Lương: ', FORMAT(salary, 0), ' đ') AS label\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT last_name, salary,\n  TO_CHAR(salary, '999,999,999') AS with_comma,\n  'Lương: ' || TO_CHAR(salary, '999,999,999') || ' đ' AS label\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: 'Thêm hai số lẻ',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  FORMAT(salary, 2) AS with_comma,\n  CONCAT('Lương: ', FORMAT(salary, 2), ' đ') AS label\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT last_name, salary,\n  TO_CHAR(salary, 'FM999,999,999.00') AS with_comma,\n  'Lương: ' || TO_CHAR(salary, 'FM999,999,999.00') || ' đ' AS label\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: 'Rút mẫu còn FM999,999',
          sql: {
            mysql:
              "SELECT last_name, salary,\n  FORMAT(salary, 0) AS with_comma,\n  CONCAT('Lương: ', FORMAT(salary, 0), ' đ') AS label\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT last_name, salary,\n  TO_CHAR(salary, 'FM999,999') AS with_comma,\n  'Lương: ' || TO_CHAR(salary, 'FM999,999') || ' đ' AS label\nFROM employees\nWHERE department_id = 30",
          },
        },
      ],
      say: 'Mục cuối chỉ đổi ở Oracle. Mẫu FM999,999 chỉ chứa sáu chữ số, mà lương có tám chữ số, nên kết quả là một dãy dấu #.',
    },
    {
      type: 'text',
      title: 'Database tự đổi: đổi ngầm',
      paragraphs: [
        '**[[implicit-conversion]]** là lúc database tự đổi data type khi bạn so hoặc tính giữa chữ và số. Bạn không viết CAST.',
        'Khi chuỗi sạch, hai dialect cùng đổi đúng. `salary = \'38000000\'` chạy bình thường: database đổi chuỗi thành số rồi so.',
        'Khi chuỗi không sạch, hai dialect xử lý khác nhau. MySQL đổi tới chỗ đổi được và bỏ phần còn lại. Oracle dừng và báo lỗi ORA-01722.',
        '`\'12abc\' + 0` ở MySQL ra 12, kèm một cảnh báo 1292. Cùng phép tính ở Oracle báo ORA-01722.',
        'Một chuỗi không bắt đầu bằng số thì MySQL đổi thành 0. Nên `email = 0` đúng với mọi email là chữ.',
        'Query dưới đây chạy ở MySQL. Nhìn column kết quả và các cảnh báo.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: MySQL đổi ngầm lặng lẽ',
      intro: 'Bấm Chạy. Khối này chỉ có MySQL, vì Oracle báo ORA-01722 ở query đầu và ở mục email = 0.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql'],
      sql: {
        mysql: "SELECT '12abc' + 0 AS a,\n  'abc' + 0 AS b,\n  '5' + '5' AS c;",
      },
      tries: [
        {
          label: 'Lọc email = 0 ở phòng IT',
          sql: {
            mysql: 'SELECT employee_id, email\nFROM employees\nWHERE department_id = 30\n  AND email = 0;',
          },
        },
        {
          label: 'So số điện thoại với một con số',
          sql: {
            mysql: 'SELECT employee_id, phone_number\nFROM employees\nWHERE phone_number = 910000137;',
          },
        },
        {
          label: "Đổi tường minh: CAST('12abc' AS SIGNED)",
          sql: {
            mysql: "SELECT CAST('12abc' AS SIGNED) AS a;",
          },
        },
      ],
      say: 'Mục email = 0 trả cả sáu người của phòng IT, dù email không có con số nào. Oracle chặn chuyện này bằng ORA-01722.',
    },
    {
      type: 'text',
      title: 'Chuỗi số so với nhau',
      paragraphs: [
        'Khi hai bên đều là chuỗi, database so từng ký tự từ trái sang phải. Database không đọc chuỗi như một con số.',
        'So `\'10\'` với `\'9\'`: ký tự đầu là 1 và 9. Số 1 nhỏ hơn 9, nên `\'10\' < \'9\'` đúng, ở cả hai dialect.',
        'Sắp xếp một column chuỗi số cũng đi theo luật đó. Chuỗi 10 đứng trước chuỗi 9, và chuỗi 100 đứng ngay sau chuỗi 10.',
        'Cách chữa: lưu số ở column kiểu số. Nếu chưa được, đổi chuỗi thành số trước khi so hoặc sắp xếp.',
        'Query dưới đây sắp xếp lương như chuỗi. Anh Khoa có lương 100 triệu, và anh ấy không đứng cuối.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lương sắp xếp như chuỗi',
      intro: 'Bấm Chạy. Column as_text là lương ở dạng chuỗi. Query sắp xếp theo column đó.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT employee_id, salary, CAST(salary AS CHAR) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\nORDER BY CAST(salary AS CHAR);',
        oracle:
          'SELECT employee_id, salary, CAST(salary AS VARCHAR2(20)) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\nORDER BY CAST(salary AS VARCHAR2(20))',
      },
      tries: [
        {
          label: 'Sắp xếp theo salary (số)',
          sql: {
            mysql:
              'SELECT employee_id, salary, CAST(salary AS CHAR) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\nORDER BY salary;',
            oracle:
              'SELECT employee_id, salary, CAST(salary AS VARCHAR2(20)) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\nORDER BY salary',
          },
        },
        {
          label: 'Sắp xếp chuỗi giảm dần',
          sql: {
            mysql:
              'SELECT employee_id, salary, CAST(salary AS CHAR) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\nORDER BY CAST(salary AS CHAR) DESC;',
            oracle:
              'SELECT employee_id, salary, CAST(salary AS VARCHAR2(20)) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\nORDER BY CAST(salary AS VARCHAR2(20)) DESC',
          },
        },
        {
          label: "Lọc chuỗi nhỏ hơn '2'",
          sql: {
            mysql:
              "SELECT employee_id, salary, CAST(salary AS CHAR) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\n  AND CAST(salary AS CHAR) < '2';",
            oracle:
              "SELECT employee_id, salary, CAST(salary AS VARCHAR2(20)) AS as_text\nFROM employees\nWHERE employee_id IN (100, 101, 104, 122, 137)\n  AND CAST(salary AS VARCHAR2(20)) < '2'",
          },
        },
      ],
      say: 'Sắp xếp như chuỗi, lương 100 triệu của anh Khoa đứng thứ hai, ngay sau lương 10 triệu. Sắp xếp theo số thì anh ấy đứng cuối.',
    },
    {
      type: 'oracle',
      body: [
        'CAST viết giống nhau, nhưng tên data type khác. MySQL báo lỗi 1064 khi gặp `CAST(5 AS INT)`. Oracle báo ORA-00902 khi gặp `CAST(5 AS SIGNED)`.',
        'FORMAT và CONVERT chỉ có ở MySQL. TO_CHAR cho số và TO_NUMBER chỉ có ở Oracle. Gọi nhầm thì MySQL báo lỗi 1305 và Oracle báo ORA-00904.',
        'Oracle đọc chuỗi ngày theo một dạng mặc định. `CAST(\'2026-03-09\' AS DATE)` báo ORA-01861. Dùng `DATE \'2026-03-09\'` hoặc TO_DATE. MySQL đọc chuỗi này bình thường.',
        'Đổi ngầm chuỗi không sạch: MySQL ra 12 cho `\'12abc\' + 0`, cảnh báo 1292. Oracle báo ORA-01722 cho `\'12abc\' + 0`, `TO_NUMBER(\'12abc\')` và `CAST(\'12abc\' AS NUMBER)`.',
        'Oracle cũng báo ORA-01722 với `email = 0`, vì không đổi được email thành số. Chuỗi có dấu phẩy nghìn như `1,234,567` cũng báo lỗi này.',
        'Ghép số vào chuỗi thì cả hai tự đổi. `CONCAT(\'Lương: \', salary)` ở MySQL và `\'Lương: \' || salary` ở Oracle đều chạy được.',
      ],
      mysql: "FORMAT(salary, 0)\nCAST(x AS SIGNED)\nCAST(x AS DECIMAL(12, 2))\nCONVERT(x, SIGNED)\n'12abc' + 0   -- ra 12, cảnh báo 1292",
      oracle: "TO_CHAR(salary, 'FM999,999,999')\nCAST(x AS NUMBER)\nCAST(x AS NUMBER(12, 2))\nTO_NUMBER(x)\n'12abc' + 0   -- lỗi ORA-01722",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn dùng Oracle và cần in lương 38000000 thành `38,000,000`, không có khoảng trắng thừa. Viết thế nào?',
          options: [
            { text: "`TO_CHAR(salary, 'FM999,999,999')`", correct: true, feedback: 'Đúng. FM bỏ khoảng trắng đệm, mẫu đủ chín chữ số.' },
            { text: "`TO_CHAR(salary, '999,999,999')`", feedback: 'Thiếu FM, kết quả có hai khoảng trắng ở đầu: `  38,000,000`.' },
            { text: '`FORMAT(salary, 0)`', feedback: 'FORMAT là function của MySQL. Oracle báo ORA-00904.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `WHERE email = 0` trên MySQL, với column email chứa chữ. Kết quả là gì?',
          options: [
            { text: 'Trả mọi row có email', correct: true, feedback: 'Đúng. MySQL đổi mỗi email thành 0, nên phép so luôn đúng. Query chỉ kèm cảnh báo 1292.' },
            { text: 'Không trả row nào', feedback: 'MySQL đổi email thành 0, và 0 bằng 0. Mọi row đều qua.' },
            { text: 'Báo lỗi', feedback: 'Oracle mới báo lỗi, với mã ORA-01722. MySQL cứ chạy tiếp.' },
          ],
        },
        {
          kind: 'choice',
          question: "Một column lưu mã dưới dạng chuỗi: `'9'`, `'10'`, `'100'`. Bạn sắp xếp tăng dần theo column đó. Thứ tự nào đúng?",
          options: [
            { text: "`'9'`, `'10'`, `'100'`", feedback: 'Đó là thứ tự theo số. Với chuỗi, ký tự đầu của 9 lớn hơn ký tự đầu của 10.' },
            { text: "`'10'`, `'100'`, `'9'`", correct: true, feedback: 'Đúng. Database so từng ký tự. 1 nhỏ hơn 9, nên cả 10 và 100 đứng trước 9.' },
            { text: "`'100'`, `'10'`, `'9'`", feedback: 'Chuỗi `10` là phần đầu của chuỗi `100`, và chuỗi ngắn hơn đứng trước.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Số điện thoại và mã đơn là chữ, không phải số',
      paragraphs: [
        'Người làm data có một quy tắc: nếu bạn không cộng trừ nhân chia một giá trị, hãy lưu nó dạng chữ. Số điện thoại, mã đơn và mã bưu chính thuộc loại này.',
        'Lưu dạng chữ thì số 0 ở đầu được giữ nguyên. Khi cần sắp xếp theo số, bạn dùng CAST trong query.',
        'Khi nạp file vào Oracle, một row có chữ lẫn trong column số làm cả lệnh dừng với ORA-01722. Bạn sửa row đó rồi chạy lại.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'CAST(giá trị AS data type) chạy ở cả hai dialect, nhưng tên data type khác: SIGNED, DECIMAL, CHAR ở MySQL; NUMBER, VARCHAR2 ở Oracle.',
        'Số thành chữ có dấu phẩy nghìn: `FORMAT(n, 0)` ở MySQL, `TO_CHAR(n, \'FM999,999,999\')` ở Oracle. Mẫu ngắn hơn số thì Oracle ra một dãy dấu #.',
        'Đổi ngầm chuỗi không sạch: MySQL im lặng ra số đã đổi được, Oracle báo ORA-01722. Hãy đổi tường minh bằng CAST.',
        'Chuỗi số so từng ký tự, nên `\'10\' < \'9\'`. Đổi sang số trước khi so hoặc sắp xếp.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Cast Functions and Operators', url: 'https://dev.mysql.com/doc/refman/8.0/en/cast-functions.html' },
        { name: 'MySQL 8.0 Reference Manual, Type Conversion in Expression Evaluation', url: 'https://dev.mysql.com/doc/refman/8.0/en/type-conversion.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Format Models', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Format-Models.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Single-Row Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Single-Row-Functions.html' },
      ],
    },
  ],
};
