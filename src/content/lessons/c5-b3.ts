import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b3',
  chapter: 5,
  order: 3,
  title: 'Function chuỗi nâng cao: TRIM, REPLACE, INSTR, LPAD',
  lead: 'Bạn làm sạch chuỗi gõ tay, tìm một ký tự trong chuỗi, cắt chuỗi theo vị trí và đệm số 0.',
  minutes: 15,
  goals: [
    'Bỏ dấu cách thừa bằng TRIM, LTRIM, RTRIM',
    'Thay một đoạn chữ bằng REPLACE',
    'Tìm vị trí của một ký tự bằng INSTR (LOCATE ở MySQL)',
    'Ghép INSTR với SUBSTR để tách một phần của chuỗi',
    'Đệm thêm ký tự cho đủ độ dài bằng LPAD và RPAD',
  ],
  blocks: [
    {
      type: 'story',
      title: 'File mã nhân viên gõ tay',
      paragraphs: [
        'Phòng nhân sự nhận file danh sách nhân viên mới từ ba chi nhánh. Mỗi chi nhánh gõ mã nhân viên theo thói quen riêng.',
        'Có mã gõ thừa dấu cách ở đầu. Có mã dùng dấu gạch dưới, có mã dùng dấu gạch ngang. Có mã chỉ gõ số 7, thay vì 000007.',
        'Bạn cần các mã cùng một kiểu trước khi nạp vào database. Một mã sai kiểu sẽ không khớp với mã đã có.',
        'Bi nói: "Bạn khỏi sửa tay từng mã. Mình dùng function chuỗi, sửa cả file bằng một query."',
      ],
    },
    {
      type: 'text',
      title: 'Bỏ dấu cách thừa và thay chữ',
      paragraphs: [
        'Bài trước bạn đã gặp UPPER, LOWER, SUBSTR và LENGTH. Bài này thêm bốn function nữa để làm sạch chuỗi.',
        '**[[trim]]** bỏ dấu cách ở hai đầu chuỗi. `TRIM(\'  nv 7  \')` ra `nv 7`. Dấu cách nằm giữa chuỗi vẫn còn.',
        '`LTRIM(x)` chỉ bỏ dấu cách bên trái. `RTRIM(x)` chỉ bỏ dấu cách bên phải.',
        'Dấu cách ở cuối chuỗi rất khó thấy bằng mắt. Bạn kiểm bằng LENGTH: mã `nv-7` dài 4, còn `nv-7 ` dài 5.',
        '**[[replace]]** thay mọi đoạn chữ này bằng đoạn chữ khác. `REPLACE(x, tìm, thay)` có ba giá trị trong ngoặc.',
        '`REPLACE(\'NV_007\', \'_\', \'-\')` ra `NV-007`. REPLACE phân biệt chữ hoa và chữ thường.',
        'Bạn xếp các function lồng nhau. Function ở trong chạy trước, function ở ngoài chạy sau.',
        'Query này làm sạch một mã gõ tay theo ba bước: TRIM, UPPER, rồi REPLACE.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: làm sạch một mã nhân viên',
      intro: 'Bấm Chạy. Column raw là mã gõ tay, column cleaned là mã đã làm sạch. Hai column len cho biết độ dài.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(TRIM('  nv_007 ')), '_', '-') AS cleaned,\n  LENGTH(REPLACE(UPPER(TRIM('  nv_007 ')), '_', '-')) AS len_cleaned;",
        oracle:
          "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(TRIM('  nv_007 ')), '_', '-') AS cleaned,\n  LENGTH(REPLACE(UPPER(TRIM('  nv_007 ')), '_', '-')) AS len_cleaned\nFROM DUAL",
      },
      tries: [
        {
          label: 'Đổi TRIM thành LTRIM',
          sql: {
            mysql:
              "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(LTRIM('  nv_007 ')), '_', '-') AS cleaned,\n  LENGTH(REPLACE(UPPER(LTRIM('  nv_007 ')), '_', '-')) AS len_cleaned;",
            oracle:
              "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(LTRIM('  nv_007 ')), '_', '-') AS cleaned,\n  LENGTH(REPLACE(UPPER(LTRIM('  nv_007 ')), '_', '-')) AS len_cleaned\nFROM DUAL",
          },
        },
        {
          label: 'Đổi TRIM thành RTRIM',
          sql: {
            mysql:
              "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(RTRIM('  nv_007 ')), '_', '-') AS cleaned,\n  LENGTH(REPLACE(UPPER(RTRIM('  nv_007 ')), '_', '-')) AS len_cleaned;",
            oracle:
              "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(RTRIM('  nv_007 ')), '_', '-') AS cleaned,\n  LENGTH(REPLACE(UPPER(RTRIM('  nv_007 ')), '_', '-')) AS len_cleaned\nFROM DUAL",
          },
        },
        {
          label: "Đổi '-' thành '/' trong REPLACE",
          sql: {
            mysql:
              "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(TRIM('  nv_007 ')), '_', '/') AS cleaned,\n  LENGTH(REPLACE(UPPER(TRIM('  nv_007 ')), '_', '/')) AS len_cleaned;",
            oracle:
              "SELECT '  nv_007 ' AS raw,\n  LENGTH('  nv_007 ') AS len_raw,\n  REPLACE(UPPER(TRIM('  nv_007 ')), '_', '/') AS cleaned,\n  LENGTH(REPLACE(UPPER(TRIM('  nv_007 ')), '_', '/')) AS len_cleaned\nFROM DUAL",
          },
        },
      ],
      say: 'Mã gốc dài 9 ký tự, mã sạch dài 6. Mục LTRIM cho thấy dấu cách bên phải vẫn còn: len_cleaned ra 7.',
    },
    {
      type: 'text',
      title: 'Tìm vị trí rồi cắt chuỗi',
      paragraphs: [
        '**[[instr]]** cho biết một đoạn chữ nằm ở vị trí thứ mấy trong chuỗi. `INSTR(x, tìm)` đếm từ ký tự đầu, ký tự đầu là số 1.',
        '`INSTR(\'khoa.dq@congty.vn\', \'@\')` ra 8, vì dấu `@` là ký tự thứ 8.',
        'Nếu không tìm thấy, INSTR ra 0.',
        'MySQL còn có `LOCATE(tìm, x)`. LOCATE cho cùng kết quả với INSTR, nhưng đổi chỗ hai giá trị. Oracle không có LOCATE.',
        'Bạn ghép INSTR với SUBSTR để cắt theo vị trí. Phần trước dấu `@` bắt đầu từ ký tự 1 và dài `INSTR(...) - 1` ký tự.',
        'Phần sau dấu `@` bắt đầu từ ký tự `INSTR(...) + 1`. Bạn bỏ giá trị độ dài thì SUBSTR lấy tới hết chuỗi.',
        'Query dưới đây tách email của phòng IT thành hai phần.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tách tên trước dấu @',
      intro: 'Bấm Chạy. Column pos là vị trí của dấu @. Hai column sau là phần trước và phần sau dấu đó.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT email,\n  INSTR(email, '@') AS pos,\n  SUBSTR(email, 1, INSTR(email, '@') - 1) AS name_part,\n  SUBSTR(email, INSTR(email, '@') + 1) AS domain\nFROM employees\nWHERE department_id = 30;",
        oracle:
          "SELECT email,\n  INSTR(email, '@') AS pos,\n  SUBSTR(email, 1, INSTR(email, '@') - 1) AS name_part,\n  SUBSTR(email, INSTR(email, '@') + 1) AS domain\nFROM employees\nWHERE department_id = 30",
      },
      tries: [
        {
          label: "Đổi '@' thành '.' ở mọi chỗ",
          sql: {
            mysql:
              "SELECT email,\n  INSTR(email, '.') AS pos,\n  SUBSTR(email, 1, INSTR(email, '.') - 1) AS name_part,\n  SUBSTR(email, INSTR(email, '.') + 1) AS domain\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT email,\n  INSTR(email, '.') AS pos,\n  SUBSTR(email, 1, INSTR(email, '.') - 1) AS name_part,\n  SUBSTR(email, INSTR(email, '.') + 1) AS domain\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: 'Bỏ - 1 ở name_part',
          sql: {
            mysql:
              "SELECT email,\n  INSTR(email, '@') AS pos,\n  SUBSTR(email, 1, INSTR(email, '@')) AS name_part,\n  SUBSTR(email, INSTR(email, '@') + 1) AS domain\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT email,\n  INSTR(email, '@') AS pos,\n  SUBSTR(email, 1, INSTR(email, '@')) AS name_part,\n  SUBSTR(email, INSTR(email, '@') + 1) AS domain\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: 'Tách họ khỏi first_name bằng dấu cách',
          sql: {
            mysql:
              "SELECT first_name,\n  INSTR(first_name, ' ') AS pos,\n  SUBSTR(first_name, 1, INSTR(first_name, ' ') - 1) AS ho,\n  SUBSTR(first_name, INSTR(first_name, ' ') + 1) AS dem\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT first_name,\n  INSTR(first_name, ' ') AS pos,\n  SUBSTR(first_name, 1, INSTR(first_name, ' ') - 1) AS ho,\n  SUBSTR(first_name, INSTR(first_name, ' ') + 1) AS dem\nFROM employees\nWHERE department_id = 30",
          },
        },
      ],
      say: 'Mục "Bỏ - 1" cho thấy name_part dính luôn dấu @ ở cuối. Hãy nhớ trừ 1, vì dấu @ nằm ở vị trí pos.',
    },
    {
      type: 'text',
      title: 'Đệm cho đủ độ dài',
      paragraphs: [
        '**[[lpad]]** thêm ký tự vào bên trái cho tới khi chuỗi đủ độ dài. `LPAD(x, n, pad)` cho chuỗi dài đúng n ký tự.',
        '`LPAD(\'7\', 3, \'0\')` ra `007`. Mã nhân viên dài sáu số thì bạn viết `LPAD(employee_id, 6, \'0\')`.',
        '`RPAD` ngược lại với LPAD: thêm ký tự vào bên phải.',
        'Nếu chuỗi dài hơn n, LPAD cắt chuỗi cho vừa n ký tự. `LPAD(\'12345\', 3, \'0\')` ra `123`, và bạn mất hai chữ số cuối.',
        'Muốn thêm chữ NV trước mã, nối chuỗi với LPAD. MySQL dùng CONCAT, Oracle dùng `||`.',
        'Query dưới đây tạo mã nhân viên sáu số cho phòng IT.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: mã nhân viên sáu số',
      intro: 'Bấm Chạy. Column code đệm số 0 cho đủ sáu số. Column pad_name đệm dấu chấm sau tên.',
      database: 'company',
      tables: ['employees'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 6, '0')) AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30;",
        oracle:
          "SELECT employee_id,\n  'NV' || LPAD(employee_id, 6, '0') AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30",
      },
      tries: [
        {
          label: 'Đổi 6 thành 4',
          sql: {
            mysql:
              "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 4, '0')) AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT employee_id,\n  'NV' || LPAD(employee_id, 4, '0') AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: 'Đổi 6 thành 2',
          sql: {
            mysql:
              "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 2, '0')) AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT employee_id,\n  'NV' || LPAD(employee_id, 2, '0') AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30",
          },
        },
        {
          label: "Đổi '0' thành '*'",
          sql: {
            mysql:
              "SELECT employee_id,\n  CONCAT('NV', LPAD(employee_id, 6, '*')) AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30;",
            oracle:
              "SELECT employee_id,\n  'NV' || LPAD(employee_id, 6, '*') AS code,\n  RPAD(last_name, 8, '.') AS pad_name\nFROM employees\nWHERE department_id = 30",
          },
        },
      ],
      say: 'Mục "Đổi 6 thành 2" là bẫy. Mã 104 chỉ còn 10, vì LPAD cắt bớt khi n nhỏ hơn độ dài chuỗi.',
    },
    {
      type: 'oracle',
      body: [
        'TRIM, LTRIM, RTRIM, REPLACE, INSTR và LPAD viết giống nhau ở cả hai dialect. Các điểm khác chỉ nằm ở chi tiết.',
        'LOCATE chỉ có ở MySQL. `LOCATE(\'@\', email)` cho cùng kết quả với `INSTR(email, \'@\')`. Oracle báo ORA-00904 khi gặp LOCATE.',
        'INSTR của MySQL không phân biệt chữ hoa, chữ thường: `INSTR(\'abc@Mail.com\', \'MAIL\')` ra 5. Oracle có phân biệt, nên cùng query ra 0.',
        'INSTR của Oracle nhận thêm hai giá trị: vị trí bắt đầu tìm, và lần xuất hiện thứ mấy. `INSTR(\'abc.def.com\', \'.\', 1, 2)` ra 8, là dấu chấm thứ hai.',
        'LPAD của Oracle chỉ cần hai giá trị. `LPAD(\'7\', 3)` đệm dấu cách. MySQL luôn cần đủ ba giá trị, thiếu thì báo lỗi 1582.',
        'Chuỗi toàn dấu cách qua TRIM thành chuỗi rỗng. MySQL giữ chuỗi rỗng. Oracle coi chuỗi rỗng là NULL.',
        'INITCAP chỉ có ở Oracle. `INITCAP(\'nguyen van a\')` ra `Nguyen Van A`. MySQL không có function này và báo lỗi 1305.',
      ],
      mysql: "LOCATE('@', email)\nINSTR(email, '@')\nLPAD(code, 6, '0')   -- cần đủ ba giá trị",
      oracle: "INSTR(email, '@')\nINSTR(email, '.', 1, 2)   -- dấu chấm thứ hai\nLPAD(code, 6)             -- đệm dấu cách\nINITCAP(name)",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: "Bạn chạy `TRIM('  nv 7  ')`. Kết quả là gì?",
          options: [
            { text: '`nv 7`', correct: true, feedback: 'Đúng. TRIM chỉ bỏ dấu cách ở hai đầu. Dấu cách giữa nv và 7 vẫn còn.' },
            { text: '`nv7`', feedback: 'TRIM không đụng tới dấu cách nằm giữa. Muốn bỏ dấu đó, dùng REPLACE.' },
            { text: '`  nv 7`', feedback: 'TRIM bỏ cả hai đầu. Muốn chỉ bỏ đầu phải, dùng RTRIM.' },
          ],
        },
        {
          kind: 'choice',
          question: "Email là `khoa.dq@congty.vn`. `SUBSTR(email, 1, INSTR(email, '@') - 1)` ra gì?",
          options: [
            { text: '`khoa.dq`', correct: true, feedback: 'Đúng. Dấu @ ở vị trí 8. Cắt 7 ký tự từ ký tự đầu thì lấy đủ phần tên.' },
            { text: '`khoa.dq@`', feedback: 'Đó là kết quả khi quên trừ 1. Dấu @ nằm ở vị trí 8, nên cắt 8 ký tự thì dính luôn dấu @.' },
            { text: '`congty.vn`', feedback: 'Đó là phần sau dấu @. Query này lấy phần trước.' },
          ],
        },
        {
          kind: 'choice',
          question: "Bạn chạy `LPAD('12345', 3, '0')`. Kết quả là gì?",
          options: [
            { text: '`00123`', feedback: 'LPAD cho chuỗi dài đúng 3 ký tự. Kết quả không thể có 5 ký tự.' },
            { text: '`123`', correct: true, feedback: 'Đúng. Chuỗi dài hơn n thì LPAD cắt bớt phần cuối. Hai chữ số cuối mất đi.' },
            { text: '`345`', feedback: 'LPAD giữ phần đầu của chuỗi, không giữ phần cuối.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Làm sạch trước khi nối hai nguồn data',
      paragraphs: [
        'Bạn nhận một file danh sách khách từ bộ phận kinh doanh và cần đối chiếu với danh sách của kế toán. Hai file ghi mã khách, nhưng vài mã có dấu cách thừa.',
        'Hai mã trông giống nhau nhưng có thể không khớp khi database so, nên không đối chiếu được. Người làm data chạy TRIM và UPPER lên column mã trước, rồi mới nối.',
        'Cùng cách đó áp dụng cho số điện thoại, email và mã đơn.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'TRIM bỏ dấu cách ở hai đầu, LTRIM bỏ đầu trái, RTRIM bỏ đầu phải. REPLACE thay mọi đoạn chữ bằng đoạn khác.',
        'INSTR cho vị trí của một đoạn chữ, và ra 0 nếu không thấy. MySQL có thêm LOCATE với hai giá trị đổi chỗ.',
        'Ghép INSTR với SUBSTR để cắt theo vị trí: phần trước dấu @ là `SUBSTR(x, 1, INSTR(x, \'@\') - 1)`.',
        'LPAD và RPAD đệm cho đủ độ dài. Chuỗi dài hơn n thì bị cắt bớt.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, String Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/string-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Single-Row Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Single-Row-Functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, INSTR', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/INSTR.html' },
      ],
    },
  ],
};
