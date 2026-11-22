import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c4-b2',
  chapter: 4,
  order: 2,
  title: 'WHERE: so sánh, AND, OR, NOT',
  lead: 'Bạn giữ lại những row thỏa điều kiện, và ghép nhiều điều kiện thành một.',
  minutes: 14,
  goals: [
    'Lọc row bằng các dấu so sánh',
    'Ghép điều kiện bằng AND, OR, NOT',
    'Biết AND chạy trước OR, và dùng ngoặc để đổi thứ tự',
    'Viết chữ trong nháy đơn và biết cách so chữ ở hai dialect',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Món nào trên 40.000 đồng?',
      paragraphs: [
        'Một khách hỏi mình: "Món nào giá trên 40.000 đồng?"',
        'Mình không đọc lại cả thực đơn. Mình xem giá từng món. Món đắt thì giữ, món rẻ thì bỏ.',
        'Với mỗi row, mình chỉ làm một bước: kiểm điều kiện. Đạt thì giữ, không đạt thì bỏ.',
        'SQL có một clause lo đúng phần này.',
      ],
    },
    {
      type: 'text',
      title: 'WHERE giữ row thỏa điều kiện',
      paragraphs: [
        '**[[where]]** giữ lại row thỏa điều kiện và bỏ các row còn lại.',
        'WHERE đứng sau FROM. Database kiểm điều kiện cho từng row, mỗi row một lần.',
        'Điều kiện so một column với một giá trị. Có sáu dấu so sánh: `=` (bằng), `<>` (khác), `<` (nhỏ hơn), `<=` (nhỏ hơn hoặc bằng), `>` (lớn hơn), `>=` (lớn hơn hoặc bằng).',
        'Query sau giữ món có price lớn hơn 40000.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: món trên 40.000 đồng',
      intro: 'Bấm Chạy. Số 40000 viết liền, không có dấu chấm.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, price\nFROM products\nWHERE price > 40000;',
        oracle: 'SELECT name, price\nFROM products\nWHERE price > 40000',
      },
      tries: [
        {
          label: 'Đổi > thành >=',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price >= 40000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price >= 40000',
          },
        },
        {
          label: 'Đổi 40000 thành 30000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price > 30000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price > 30000',
          },
        },
        {
          label: 'Đổi > 40000 thành < 15000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price < 15000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price < 15000',
          },
        },
        {
          label: 'Đổi > 40000 thành = 25000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price = 25000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price = 25000',
          },
        },
      ],
      say: 'Đổi > thành >= mà kết quả vẫn thế, vì không món nào có giá đúng 40000.',
    },
    {
      type: 'text',
      title: 'Lọc chữ và ghép điều kiện',
      paragraphs: [
        'Khi lọc chữ, đặt chữ trong nháy đơn, như `\'Trà sữa\'`. Số thì không cần nháy.',
        'Một điều kiện chưa đủ thì ghép thêm bằng ba từ khóa.',
        '**[[and]]** giữ row khi cả hai điều kiện đúng. **[[or]]** giữ row khi một trong hai điều kiện đúng.',
        '**[[not]]** đảo một điều kiện. `NOT category = \'Topping\'` giữ mọi món không thuộc Topping.',
        'AND làm kết quả ít đi, vì row phải qua cả hai cửa. OR làm kết quả nhiều lên, vì row chỉ cần qua một cửa.',
      ],
    },
    {
      type: 'playground',
      title: 'Lọc món theo nhóm',
      intro: 'Bấm Chạy. Query giữ các món thuộc nhóm Trà sữa.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa';",
        oracle: "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa'",
      },
      tries: [
        {
          label: 'Đổi = thành <>',
          sql: {
            mysql: "SELECT name, category, price\nFROM products\nWHERE category <> 'Trà sữa';",
            oracle: "SELECT name, category, price\nFROM products\nWHERE category <> 'Trà sữa'",
          },
        },
        {
          label: 'Thêm AND price < 40000',
          sql: {
            mysql: "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' AND price < 40000;",
            oracle: "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' AND price < 40000",
          },
        },
        {
          label: "Thêm OR category = 'Cà phê'",
          sql: {
            mysql: "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR category = 'Cà phê';",
            oracle: "SELECT name, category, price\nFROM products\nWHERE category = 'Trà sữa' OR category = 'Cà phê'",
          },
        },
        {
          label: "Đổi điều kiện thành NOT category = 'Topping'",
          sql: {
            mysql: "SELECT name, category, price\nFROM products\nWHERE NOT category = 'Topping';",
            oracle: "SELECT name, category, price\nFROM products\nWHERE NOT category = 'Topping'",
          },
        },
      ],
      say: 'Query gốc cho 4 row. Thêm AND còn 3 row. Thêm OR lên 7 row.',
    },
    {
      type: 'text',
      title: 'Bẫy: AND chạy trước OR',
      paragraphs: [
        'Query có cả AND lẫn OR thì database làm AND trước, rồi mới làm OR.',
        'Giả sử khách hỏi: "Cà phê hoặc Topping, và giá dưới 10.000 đồng."',
        'Bạn viết `category = \'Cà phê\' OR category = \'Topping\' AND price < 10000`. Database đọc thành: Cà phê ở mọi giá, hoặc Topping dưới 10.000 đồng.',
        'Kết quả có cả ly Cà phê 65.000 đồng. Khách không muốn món đó.',
        'Đặt ngoặc quanh phần OR để ép database làm phần đó trước. Ngoặc luôn chạy trước. Thấy AND và OR chung một query thì thêm ngoặc cho rõ ý.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: có ngoặc và không ngoặc',
      intro: 'Bấm Chạy. Query chưa có ngoặc. Đếm số row, rồi thêm ngoặc ở mục thử đầu tiên.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n   OR category = 'Topping'\n  AND price < 10000;",
        oracle:
          "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n   OR category = 'Topping'\n  AND price < 10000",
      },
      tries: [
        {
          label: 'Thêm ngoặc quanh hai điều kiện OR',
          sql: {
            mysql:
              "SELECT name, category, price\nFROM products\nWHERE (category = 'Cà phê'\n   OR category = 'Topping')\n  AND price < 10000;",
            oracle:
              "SELECT name, category, price\nFROM products\nWHERE (category = 'Cà phê'\n   OR category = 'Topping')\n  AND price < 10000",
          },
        },
        {
          label: 'Thêm ngoặc quanh Topping AND price',
          sql: {
            mysql:
              "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n   OR (category = 'Topping'\n  AND price < 10000);",
            oracle:
              "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n   OR (category = 'Topping'\n  AND price < 10000)",
          },
        },
        {
          label: 'Đổi < 10000 thành <= 10000',
          sql: {
            mysql:
              "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n   OR category = 'Topping'\n  AND price <= 10000;",
            oracle:
              "SELECT name, category, price\nFROM products\nWHERE category = 'Cà phê'\n   OR category = 'Topping'\n  AND price <= 10000",
          },
        },
      ],
      say: 'Không ngoặc: 4 row, có Cà phê 65.000 đồng. Ngoặc quanh OR: còn 1 row. Ngoặc quanh AND cho kết quả giống query gốc, vì AND vốn chạy trước.',
    },
    {
      type: 'oracle',
      body: [
        "Khi so chữ, MySQL không phân biệt hoa thường và dấu theo mặc định. `'tra sua'` khớp với 'Trà sữa'.",
        'Oracle so từng ký tự đúng như bạn gõ. Khác hoa thường hoặc khác dấu là khác chữ.',
        'Cách so chữ do **[[collation]]** quyết định. Cả hai nơi đều cho đổi collation. Bài này dùng mặc định.',
        'Chữ luôn nằm trong nháy đơn, vì nháy kép khác nhau ở hai nơi. MySQL nhận cả nháy đơn lẫn nháy kép cho chữ. Oracle dùng nháy kép để bao tên column.',
        'Gõ `category = "Topping"` trên Oracle, database tìm column tên Topping. Database không thấy column đó và báo ORA-00904.',
        '`<>` và `!=` đều chạy ở cả hai dialect. Bài này dùng `<>`.',
      ],
      mysql: "WHERE category = 'tra sua'\n-- 4 row",
      oracle: "WHERE category = 'tra sua'\n-- 0 row",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn muốn món Trà sữa có giá dưới 40000. Nối hai điều kiện bằng gì?',
          options: [
            { text: 'AND', correct: true, feedback: 'Đúng. Row phải thỏa cả hai điều kiện.' },
            { text: 'OR', feedback: 'OR giữ row khi một điều kiện đúng. Món nào dưới 40000 cũng lọt vào, kể cả Cà phê.' },
            { text: 'NOT', feedback: 'NOT đảo một điều kiện, không nối được hai điều kiện.' },
          ],
        },
        {
          kind: 'choice',
          question: "Database đọc `category = 'Cà phê' OR category = 'Topping' AND price < 10000` thế nào?",
          options: [
            { text: "Cà phê hoặc Topping, rồi chỉ giữ món dưới 10000", feedback: 'Đọc vậy thì phần OR phải nằm trong ngoặc. Query này chưa có ngoặc.' },
            { text: "Cà phê ở mọi giá, hoặc Topping dưới 10000", correct: true, feedback: 'Đúng. AND chạy trước, nên Topping và giá dưới 10000 thành một cặp.' },
            { text: 'Đọc từ phải sang trái', feedback: 'Database không đọc theo hướng. Độ ưu tiên quyết định: AND trước, OR sau.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `WHERE category = "Topping"` trên Oracle. Chuyện gì xảy ra?',
          options: [
            { text: 'Oracle báo lỗi, vì nháy kép bao tên column', correct: true, feedback: 'Đúng. Ở Oracle, chữ phải nằm trong nháy đơn.' },
            { text: 'Oracle trả đúng các món Topping', feedback: 'MySQL làm được, nhưng Oracle thì không. Nháy kép ở Oracle không bao chữ.' },
            { text: 'Oracle trả 0 row', feedback: 'Oracle không chạy được query này. Oracle báo lỗi thay vì trả 0 row.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Bộ lọc của sàn mua sắm',
      paragraphs: [
        'Bạn mở một sàn mua sắm và chọn "Giày", rồi chọn "Dưới 500.000 đồng". Hai lựa chọn nối nhau bằng AND.',
        'Bạn chọn thêm hãng Nike và Adidas. Hai hãng nối nhau bằng OR, và nằm trong một cặp ngoặc để AND không chạy lẫn vào.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'WHERE giữ row thỏa điều kiện. Điều kiện so column với giá trị bằng `=`, `<>`, `<`, `<=`, `>`, `>=`.',
        'AND cần cả hai điều kiện đúng. OR cần một trong hai. NOT đảo điều kiện.',
        'AND chạy trước OR. Có cả hai trong một query thì thêm ngoặc.',
        'Chữ nằm trong nháy đơn. MySQL so chữ không phân biệt hoa thường và dấu. Oracle có phân biệt.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 2: Queries with constraints (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_constraints' },
        { name: 'MySQL 8.0 Reference Manual, Operator Precedence', url: 'https://dev.mysql.com/doc/refman/8.0/en/operator-precedence.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Comparison Conditions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Comparison-Conditions.html' },
      ],
    },
  ],
};
