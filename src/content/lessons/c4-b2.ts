import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c4-b2',
  chapter: 4,
  order: 2,
  title: 'Function chuỗi',
  lead: 'Bạn đổi chữ hoa thường, cắt chữ, đếm chữ và ghép chữ ngay trong query.',
  minutes: 16,
  goals: [
    'Đổi chữ hoa, chữ thường bằng UPPER và LOWER',
    'Cắt chữ bằng SUBSTR, đếm chữ bằng LENGTH',
    'Ghép chữ bằng CONCAT ở MySQL và || ở Oracle',
    'Biết NULL và chuỗi rỗng làm kết quả đổi khác ở mỗi dialect',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Thẻ thành viên cần một câu liên hệ',
      paragraphs: [
        'Bi muốn in thẻ thành viên. Thẻ ghi tên khách, một dấu gạch, rồi số điện thoại.',
        'Trong database, tên nằm ở một column và số điện thoại nằm ở column khác.',
        'Bi cần ghép hai mẩu chữ thành một. Mình cũng muốn in tên tiệm bằng chữ hoa cho dễ nhìn.',
        'SQL có sẵn các function để xử lý chữ. Bạn đưa chữ vào, function trả chữ mới ra.',
      ],
    },
    {
      type: 'text',
      title: 'Đổi, cắt và đếm chữ',
      paragraphs: [
        '**[[function]]** là một công cụ nhỏ có tên riêng. Bạn đưa giá trị vào trong ngoặc, function trả kết quả ra.',
        'Một đoạn chữ trong SQL gọi là chuỗi. Các function chuỗi xử lý chuỗi.',
        '`UPPER(x)` đổi chữ thành chữ hoa. `LOWER(x)` đổi thành chữ thường.',
        '`SUBSTR(x, a, n)` cắt n ký tự, bắt đầu từ ký tự thứ a. Ký tự đầu tiên là số 1.',
        '`LENGTH(x)` đếm độ dài của chuỗi.',
        'Query dưới đây đổi tên tiệm sang chữ hoa và đếm chữ.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: chữ hoa và độ dài',
      intro: 'Bấm Chạy ở MySQL, rồi bấm Chạy ở Oracle. MySQL cho hai con số đếm, Oracle cho một con số.',
      database: 'teashop',
      tables: ['stores'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, UPPER(name) AS upper_name, CHAR_LENGTH(name) AS chars, LENGTH(name) AS bytes\nFROM stores;',
        oracle: 'SELECT name, UPPER(name) AS upper_name, LENGTH(name) AS chars\nFROM stores',
      },
      tries: [
        {
          label: 'Đổi UPPER thành LOWER',
          sql: {
            mysql: 'SELECT name, LOWER(name) AS lower_name, CHAR_LENGTH(name) AS chars, LENGTH(name) AS bytes\nFROM stores;',
            oracle: 'SELECT name, LOWER(name) AS lower_name, LENGTH(name) AS chars\nFROM stores',
          },
        },
        {
          label: 'Thêm SUBSTR(name, 1, 7) AS short_name',
          sql: {
            mysql:
              'SELECT name, UPPER(name) AS upper_name, SUBSTR(name, 1, 7) AS short_name, CHAR_LENGTH(name) AS chars, LENGTH(name) AS bytes\nFROM stores;',
            oracle: 'SELECT name, UPPER(name) AS upper_name, SUBSTR(name, 1, 7) AS short_name, LENGTH(name) AS chars\nFROM stores',
          },
        },
      ],
      say: 'Tên "Trà Mây Cầu Giấy" có 16 ký tự. LENGTH của MySQL ra 22, vì chữ có dấu chiếm nhiều byte.',
    },
    {
      type: 'text',
      title: 'Hai cách đếm ở MySQL',
      paragraphs: [
        'Máy lưu mỗi ký tự bằng một hoặc vài **[[byte]]**. Chữ a chiếm 1 byte. Chữ có dấu chiếm 2 hoặc 3 byte.',
        'LENGTH của MySQL đếm byte. Vì vậy chữ có dấu làm số đếm lớn hơn số ký tự.',
        'Muốn đếm ký tự ở MySQL, dùng `CHAR_LENGTH`. LENGTH của Oracle đã đếm ký tự rồi.',
      ],
    },
    {
      type: 'text',
      title: 'Ghép chữ',
      paragraphs: [
        'Ghép hai chuỗi thành một thì mỗi dialect viết một kiểu.',
        'MySQL dùng **[[concat]]**: `CONCAT(a, b, c)`. Bạn đưa vào bao nhiêu chuỗi cũng được.',
        'Oracle dùng hai dấu gạch đứng: `a || b || c`.',
        'Hai dialect xử lý NULL khác nhau. Nếu một chuỗi là NULL, CONCAT của MySQL trả NULL cho cả kết quả.',
        'Chuỗi không có chữ nào gọi là chuỗi rỗng, viết `\'\'`. Ở bài NULL, mình gọi nó là chữ trống.',
        'Oracle coi NULL như chuỗi rỗng. Phần còn lại vẫn hiện ra.',
        'Query dưới đây ghép tên khách và số điện thoại. Vài khách chưa có số.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: ghép tên và số điện thoại',
      intro: 'Bấm Chạy ở cả hai dialect. Nhìn các khách có phone trống.',
      database: 'teashop',
      tables: ['customers'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT full_name, phone, CONCAT(full_name, ' - ', phone) AS contact\nFROM customers\nWHERE city = 'Hà Nội';",
        oracle: "SELECT full_name, phone, full_name || ' - ' || phone AS contact\nFROM customers\nWHERE city = 'Hà Nội'",
      },
      tries: [
        {
          label: "Bỏ ' - ' giữa tên và số",
          sql: {
            mysql: "SELECT full_name, phone, CONCAT(full_name, phone) AS contact\nFROM customers\nWHERE city = 'Hà Nội';",
            oracle: "SELECT full_name, phone, full_name || phone AS contact\nFROM customers\nWHERE city = 'Hà Nội'",
          },
        },
        {
          label: 'Nối bằng || ở cả hai dialect',
          sql: {
            mysql: "SELECT full_name, phone, full_name || ' - ' || phone AS contact\nFROM customers\nWHERE city = 'Hà Nội';",
            oracle: "SELECT full_name, phone, full_name || ' - ' || phone AS contact\nFROM customers\nWHERE city = 'Hà Nội'",
          },
        },
        {
          label: "Thêm AND phone <> ''",
          sql: {
            mysql: "SELECT full_name, phone, CONCAT(full_name, ' - ', phone) AS contact\nFROM customers\nWHERE city = 'Hà Nội' AND phone <> '';",
            oracle: "SELECT full_name, phone, full_name || ' - ' || phone AS contact\nFROM customers\nWHERE city = 'Hà Nội' AND phone <> ''",
          },
        },
      ],
      say: 'Thử mục "Nối bằng ||". MySQL hiểu || là OR, nên kết quả ra số 1 hoặc NULL thay vì chữ.',
    },
    {
      type: 'oracle',
      body: [
        'Ở MySQL, `||` không nối chữ. MySQL hiểu nó là OR, nên kết quả là một con số hoặc NULL.',
        'CONCAT của Oracle 19c chỉ nhận đúng hai tham số. Gọi với ba tham số thì Oracle báo ORA-00909. Muốn nối ba mẩu, dùng `||` hoặc lồng hai CONCAT.',
        "Oracle coi chuỗi rỗng `''` là NULL. Vì vậy `phone <> ''` ở Oracle không giữ row nào: so sánh với NULL không bao giờ đúng.",
        'MySQL coi chuỗi rỗng là một giá trị có thật, khác NULL.',
      ],
      mysql: "CONCAT(full_name, ' - ', phone)\n-- phone là NULL: cả kết quả là NULL",
      oracle: "full_name || ' - ' || phone\n-- phone là NULL: vẫn ra 'Tên - '",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: "Một khách chưa có số điện thoại. MySQL chạy `CONCAT(full_name, ' - ', phone)`. Column contact của khách đó ra gì?",
          options: [
            { text: 'Chỉ có tên khách', feedback: 'Đó là cách Oracle xử lý với `||`. CONCAT của MySQL trả NULL.' },
            { text: 'NULL', correct: true, feedback: 'Đúng. CONCAT của MySQL trả NULL nếu một tham số là NULL.' },
            { text: 'Lỗi', feedback: 'Query vẫn chạy bình thường. NULL không gây lỗi.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Tên "Trà Mây Cầu Giấy" có 16 ký tự. MySQL chạy `LENGTH(name)` ra bao nhiêu?',
          options: [
            { text: '16', feedback: 'Đó là số ký tự. MySQL dùng CHAR_LENGTH để đếm ký tự.' },
            { text: '22', correct: true, feedback: 'Đúng. LENGTH của MySQL đếm byte. Chữ có dấu chiếm nhiều byte hơn chữ không dấu.' },
            { text: 'Lỗi vì tên có dấu', feedback: 'LENGTH chạy được với mọi chữ, có dấu hay không.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn ghép ba chuỗi trên Oracle 19c bằng `CONCAT(a, b, c)`. Chuyện gì xảy ra?',
          options: [
            { text: 'Oracle ghép đủ ba chuỗi', feedback: 'MySQL làm được. CONCAT của Oracle 19c chỉ nhận hai tham số.' },
            { text: 'Oracle báo ORA-00909', correct: true, feedback: 'Đúng. Số tham số sai thì Oracle báo ORA-00909. Dùng `||` cho gọn.' },
            { text: 'Oracle bỏ chuỗi thứ ba', feedback: 'Oracle không tự bỏ gì. Oracle báo lỗi.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Lời chào có tên bạn',
      paragraphs: [
        'Một app có thể lưu họ và tên ở hai column riêng.',
        'Khi gửi email chào, query ghép hai column thành một câu: "Xin chào, Nguyễn Thị Hường".',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'UPPER, LOWER, SUBSTR và LENGTH nhận một chuỗi và trả kết quả mới.',
        'MySQL nối chuỗi bằng CONCAT. Oracle nối bằng `||`. CONCAT của Oracle 19c chỉ nhận hai tham số.',
        'LENGTH của MySQL đếm byte, CHAR_LENGTH đếm ký tự. LENGTH của Oracle đếm ký tự.',
        'CONCAT của MySQL ra NULL khi có một chuỗi NULL. Oracle coi chuỗi rỗng là NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, String Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/string-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, CONCAT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CONCAT.html' },
        {
          name: 'Oracle Database 19c SQL Language Reference, Concatenation Operator',
          url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Concatenation-Operator.html',
        },
        { name: 'Oracle Database 19c SQL Language Reference, Nulls', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Nulls.html' },
      ],
    },
  ],
};
