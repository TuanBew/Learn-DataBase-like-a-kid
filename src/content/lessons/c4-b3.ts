import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c4-b3',
  chapter: 4,
  order: 3,
  title: 'WHERE: IN, BETWEEN, LIKE, IS NULL',
  lead: 'Bạn lọc theo danh sách, theo khoảng, theo mẫu chữ, và tìm row thiếu giá trị.',
  minutes: 16,
  goals: [
    'Lọc theo danh sách bằng IN và NOT IN',
    'Lọc theo khoảng bằng BETWEEN, gồm cả hai đầu',
    'Lọc chữ theo mẫu bằng LIKE với % và _',
    'Tìm row thiếu giá trị bằng IS NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Cho mình xem Cà phê và Topping',
      paragraphs: [
        'Một khách nói với mình: "Cho tôi xem các món Cà phê và Topping."',
        'Bạn đã biết cách viết: `category = \'Cà phê\' OR category = \'Topping\'`. Khách thêm "Trà sữa" thì bạn thêm một OR nữa. Query dài ra theo từng nhóm.',
        'Khách lại hỏi: "Món nào từ 30.000 đến 40.000 đồng?" rồi "Món nào có chữ sữa trong tên?"',
        'Mỗi câu hỏi này có một cách viết gọn trong SQL. Bài này đi qua bốn cách.',
      ],
    },
    {
      type: 'text',
      title: 'IN giữ giá trị nằm trong danh sách',
      paragraphs: [
        '**[[in]]** giữ row khi giá trị nằm trong một danh sách.',
        'Viết danh sách trong ngoặc, ngăn các giá trị bằng dấu phẩy. `category IN (\'Cà phê\', \'Topping\')` cho kết quả giống hai điều kiện nối bằng OR.',
        '**[[not-in]]** làm ngược lại. NOT IN giữ row có giá trị nằm ngoài danh sách.',
        'Danh sách dài thêm thì query chỉ dài thêm một giá trị.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: Cà phê và Topping',
      intro: 'Bấm Chạy. Query giữ món thuộc Cà phê hoặc Topping.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, category\nFROM products\nWHERE category IN ('Cà phê', 'Topping');",
        oracle: "SELECT name, category\nFROM products\nWHERE category IN ('Cà phê', 'Topping')",
      },
      tries: [
        {
          label: 'Đổi IN thành NOT IN',
          sql: {
            mysql: "SELECT name, category\nFROM products\nWHERE category NOT IN ('Cà phê', 'Topping');",
            oracle: "SELECT name, category\nFROM products\nWHERE category NOT IN ('Cà phê', 'Topping')",
          },
        },
        {
          label: "Thêm 'Trà sữa' vào danh sách",
          sql: {
            mysql: "SELECT name, category\nFROM products\nWHERE category IN ('Cà phê', 'Topping', 'Trà sữa');",
            oracle: "SELECT name, category\nFROM products\nWHERE category IN ('Cà phê', 'Topping', 'Trà sữa')",
          },
        },
        {
          label: 'Đổi sang lọc số: price IN (8000, 10000, 15000)',
          sql: {
            mysql: 'SELECT name, category\nFROM products\nWHERE price IN (8000, 10000, 15000);',
            oracle: 'SELECT name, category\nFROM products\nWHERE price IN (8000, 10000, 15000)',
          },
        },
      ],
      say: 'IN và NOT IN chia 14 món làm hai phần. Cà phê và Topping có 7 món, phần còn lại cũng 7 món.',
    },
    {
      type: 'text',
      title: 'BETWEEN giữ giá trị trong một khoảng',
      paragraphs: [
        '**[[between]]** giữ giá trị nằm trong một khoảng, gồm cả hai đầu.',
        '`price BETWEEN 30000 AND 40000` giống `price >= 30000 AND price <= 40000`.',
        'Viết số nhỏ trước, số lớn sau. Viết ngược thì không row nào đạt.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: món từ 30.000 đến 40.000 đồng',
      intro: 'Bấm Chạy. Có một món giá đúng 30000. Xem món đó còn trong kết quả không.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 30000 AND 40000;',
        oracle: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 30000 AND 40000',
      },
      tries: [
        {
          label: 'Đổi BETWEEN thành price > 30000 AND price < 40000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price > 30000 AND price < 40000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price > 30000 AND price < 40000',
          },
        },
        {
          label: 'Đổi thứ tự thành BETWEEN 40000 AND 30000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 40000 AND 30000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 40000 AND 30000',
          },
        },
        {
          label: 'Đổi BETWEEN thành NOT BETWEEN',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price NOT BETWEEN 30000 AND 40000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price NOT BETWEEN 30000 AND 40000',
          },
        },
        {
          label: 'Đổi khoảng thành 25000 đến 35000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 25000 AND 35000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 25000 AND 35000',
          },
        },
      ],
      say: 'Cà phê muối giá đúng 30000. BETWEEN giữ món này, còn dấu > thì bỏ. Viết ngược thứ tự thì 0 row, và database không báo lỗi.',
    },
    {
      type: 'text',
      title: 'LIKE lọc chữ theo mẫu',
      paragraphs: [
        '**[[like]]** lọc chữ theo mẫu. Mẫu có hai ký tự đặc biệt, gọi là **[[wildcard]]**.',
        'Dấu `%` thay cho một đoạn chữ bất kỳ, kể cả đoạn rỗng. Dấu `_` thay cho đúng một ký tự.',
        '`LIKE \'Trà%\'` giữ tên bắt đầu bằng Trà. `LIKE \'%sữa%\'` giữ tên có chữ sữa ở bất kỳ chỗ nào. `LIKE \'%đá\'` giữ tên kết thúc bằng đá.',
        'Mẫu không có dấu đặc biệt thì LIKE chỉ khớp chữ y hệt, giống dấu `=`. `NOT LIKE` giữ row không khớp mẫu.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tên món có chữ sữa',
      intro: 'Bấm Chạy. Dấu % ở hai đầu mẫu cho phép chữ sữa nằm ở bất kỳ chỗ nào.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name\nFROM products\nWHERE name LIKE '%sữa%';",
        oracle: "SELECT name\nFROM products\nWHERE name LIKE '%sữa%'",
      },
      tries: [
        {
          label: "Đổi mẫu thành 'Trà sữa%'",
          sql: {
            mysql: "SELECT name\nFROM products\nWHERE name LIKE 'Trà sữa%';",
            oracle: "SELECT name\nFROM products\nWHERE name LIKE 'Trà sữa%'",
          },
        },
        {
          label: "Đổi mẫu thành '%đá'",
          sql: {
            mysql: "SELECT name\nFROM products\nWHERE name LIKE '%đá';",
            oracle: "SELECT name\nFROM products\nWHERE name LIKE '%đá'",
          },
        },
        {
          label: 'Đổi LIKE thành NOT LIKE',
          sql: {
            mysql: "SELECT name\nFROM products\nWHERE name NOT LIKE '%sữa%';",
            oracle: "SELECT name\nFROM products\nWHERE name NOT LIKE '%sữa%'",
          },
        },
        {
          label: "Đổi mẫu thành 'Trà ___ %' (ba dấu _)",
          sql: {
            mysql: "SELECT name\nFROM products\nWHERE name LIKE 'Trà ___ %';",
            oracle: "SELECT name\nFROM products\nWHERE name LIKE 'Trà ___ %'",
          },
        },
      ],
      say: 'Mỗi dấu _ là đúng một ký tự. Ba dấu _ khớp các từ ba chữ cái: sữa, đào, vải.',
    },
    {
      type: 'oracle',
      body: [
        'LIKE so chữ theo cùng luật với dấu `=`. MySQL không phân biệt hoa thường và dấu theo mặc định. Oracle phân biệt cả hai. Bài trước đã nói về **[[collation]]**.',
        "`name LIKE 'Trà%'` cho 8 row ở MySQL và 7 row ở Oracle. MySQL coi â và à là cùng một chữ, nên 'Trân châu đen' cũng khớp.",
        "`name LIKE 'trà%'` cho 8 row ở MySQL và 0 row ở Oracle. Oracle thấy t thường khác T hoa.",
        "Muốn Oracle bỏ qua hoa thường, bọc column trong UPPER và viết mẫu bằng chữ hoa: `UPPER(name) LIKE 'TRÀ%'`. Cách này cho 7 row. Dấu vẫn được giữ nguyên.",
      ],
      mysql: "WHERE name LIKE 'trà%'\n-- 8 row",
      oracle: "WHERE UPPER(name) LIKE 'TRÀ%'\n-- 7 row",
    },
    {
      type: 'text',
      title: 'Row thiếu giá trị',
      paragraphs: [
        'Vài món chưa có số calo. Ở những row đó, column calories là **[[null]]**, nghĩa là chưa có giá trị.',
        'NULL không bằng gì cả, kể cả chính NULL. Vì vậy `calories = NULL` không bao giờ đúng.',
        'Muốn tìm NULL, viết **[[is-null]]**. Muốn loại NULL, viết `IS NOT NULL`.',
        'Row NULL cũng không qua các phép so sánh khác. Món chưa có calories không nằm trong `calories < 200`, cũng không nằm trong `calories >= 200`.',
      ],
    },
    {
      type: 'playground',
      title: 'Tìm món chưa có calo',
      intro: 'Bấm Chạy. Query giữ các món có calories là NULL.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, calories\nFROM products\nWHERE calories IS NULL;',
        oracle: 'SELECT name, calories\nFROM products\nWHERE calories IS NULL',
      },
      tries: [
        {
          label: 'Đổi IS NULL thành = NULL',
          sql: {
            mysql: 'SELECT name, calories\nFROM products\nWHERE calories = NULL;',
            oracle: 'SELECT name, calories\nFROM products\nWHERE calories = NULL',
          },
        },
        {
          label: 'Đổi IS NULL thành IS NOT NULL',
          sql: {
            mysql: 'SELECT name, calories\nFROM products\nWHERE calories IS NOT NULL;',
            oracle: 'SELECT name, calories\nFROM products\nWHERE calories IS NOT NULL',
          },
        },
        {
          label: 'Thêm AND price > 40000',
          sql: {
            mysql: 'SELECT name, calories\nFROM products\nWHERE calories IS NULL AND price > 40000;',
            oracle: 'SELECT name, calories\nFROM products\nWHERE calories IS NULL AND price > 40000',
          },
        },
        {
          label: 'Đổi điều kiện thành calories < 200 OR calories IS NULL',
          sql: {
            mysql: 'SELECT name, calories\nFROM products\nWHERE calories < 200 OR calories IS NULL;',
            oracle: 'SELECT name, calories\nFROM products\nWHERE calories < 200 OR calories IS NULL',
          },
        },
      ],
      say: 'Query với = NULL vẫn chạy, nhưng trả 0 row. Database không báo lỗi, nên dễ bỏ sót.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn muốn món có giá từ 30000 đến 40000, gồm cả hai đầu. Cách nào đúng?',
          options: [
            { text: '`price BETWEEN 30000 AND 40000`', correct: true, feedback: 'Đúng. BETWEEN gồm cả hai đầu.' },
            { text: '`price > 30000 AND price < 40000`', feedback: 'Cách này bỏ món giá đúng 30000, và bỏ cả món giá đúng 40000 nếu có.' },
            { text: '`price BETWEEN 40000 AND 30000`', feedback: 'BETWEEN cần số nhỏ trước, số lớn sau. Đổi chỗ thì không row nào đạt.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Mẫu LIKE nào giữ mọi món có chữ sữa trong tên?',
          options: [
            { text: "`'%sữa%'`", correct: true, feedback: 'Đúng. Mỗi dấu % thay cho một đoạn chữ bất kỳ, kể cả đoạn rỗng.' },
            { text: "`'sữa%'`", feedback: 'Mẫu này chỉ giữ tên bắt đầu bằng chữ sữa. Trà sữa matcha không khớp.' },
            { text: "`'_sữa_'`", feedback: 'Mỗi dấu _ thay cho đúng một ký tự. Mẫu này chỉ khớp tên có năm ký tự.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Điều kiện nào tìm món chưa có calories?',
          options: [
            { text: '`calories IS NULL`', correct: true, feedback: 'Đúng. IS NULL là cách duy nhất để tìm NULL.' },
            { text: '`calories = NULL`', feedback: 'Query chạy được nhưng trả 0 row. NULL không bằng gì cả.' },
            { text: '`calories = 0`', feedback: 'Số 0 là một giá trị có thật. Row thiếu giá trị thì không có số nào.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Tìm khách chưa có số điện thoại',
      paragraphs: [
        'Bộ phận chăm sóc khách muốn gọi bổ sung thông tin cho khách chưa để lại số điện thoại.',
        'Một câu WHERE với `phone IS NULL` cho ra đúng danh sách khách đó.',
        'Ô tìm kiếm trong một app nhỏ cũng thường dùng LIKE với mẫu như `\'%cafe%\'`.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'IN giữ giá trị nằm trong danh sách. NOT IN giữ giá trị nằm ngoài.',
        'BETWEEN gồm cả hai đầu, và cần số nhỏ trước.',
        'LIKE dùng % cho một đoạn chữ bất kỳ và _ cho đúng một ký tự.',
        'MySQL cho LIKE không phân biệt hoa thường và dấu. Oracle có phân biệt.',
        'Tìm NULL bằng IS NULL, không bằng dấu =.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 2: Queries with constraints (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_constraints' },
        { name: 'SQLBolt, bài 3: Queries with constraints (Pt. 2)', url: 'https://sqlbolt.com/lesson/select_queries_with_constraints_pt_2' },
        { name: 'MySQL 8.0 Reference Manual, Pattern Matching', url: 'https://dev.mysql.com/doc/refman/8.0/en/pattern-matching.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Pattern-matching Conditions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Pattern-matching-Conditions.html' },
      ],
    },
  ],
};
