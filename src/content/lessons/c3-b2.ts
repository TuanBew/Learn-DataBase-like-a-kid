import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c3-b2',
  chapter: 3,
  order: 2,
  title: 'Lọc row bằng WHERE',
  lead: 'Bạn giữ lại những row thỏa điều kiện và bỏ các row còn lại.',
  minutes: 18,
  goals: [
    'Lọc row bằng các dấu so sánh',
    'Ghép điều kiện bằng AND, OR, NOT',
    'Lọc chữ bằng LIKE, và biết chữ nằm trong nháy đơn',
    'Tìm row thiếu giá trị bằng IS NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Món nào trên 40.000 đồng?',
      paragraphs: [
        'Một khách hỏi Bi: "Món nào giá trên 40.000 đồng?"',
        'Bi không đọc lại cả thực đơn. Mình xem giá từng món. Món đắt thì giữ, món rẻ thì bỏ.',
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
        'Điều kiện so một column với một giá trị. Các dấu so sánh gồm `=` (bằng), `<>` (khác), `<` (nhỏ hơn), `<=` (nhỏ hơn hoặc bằng), `>` (lớn hơn), `>=` (lớn hơn hoặc bằng).',
        'Query dưới đây giữ món có price lớn hơn 40000.',
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
          label: 'Đổi > 40000 thành BETWEEN 30000 AND 40000',
          sql: {
            mysql: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 30000 AND 40000;',
            oracle: 'SELECT name, price\nFROM products\nWHERE price BETWEEN 30000 AND 40000',
          },
        },
      ],
      say: 'Đổi > thành >= mà kết quả vẫn thế, vì không món nào có giá đúng 40000.',
    },
    {
      type: 'text',
      title: 'Ghép nhiều điều kiện',
      paragraphs: [
        'Một điều kiện chưa đủ thì ghép thêm. AND giữ row khi cả hai điều kiện đúng. OR giữ row khi một trong hai điều kiện đúng. NOT đảo điều kiện.',
        'AND chạy trước OR. Muốn đổi thứ tự thì đặt điều kiện trong dấu ngoặc.',
        '`BETWEEN 30000 AND 40000` giữ giá từ 30000 đến 40000, gồm cả hai đầu. `IN (...)` giữ giá trị có trong danh sách.',
        'Khi lọc chữ, đặt chữ trong nháy đơn, như `\'Trà sữa\'`. Số thì không cần nháy.',
        '**[[like]]** tìm chữ theo mẫu. Dấu `%` thay cho một đoạn chữ bất kỳ, kể cả đoạn rỗng. Dấu `_` thay cho đúng một ký tự.',
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
        mysql: "SELECT name, category\nFROM products\nWHERE category = 'Trà sữa';",
        oracle: "SELECT name, category\nFROM products\nWHERE category = 'Trà sữa'",
      },
      tries: [
        {
          label: "Đổi = thành IN ('Cà phê', 'Topping')",
          sql: {
            mysql: "SELECT name, category\nFROM products\nWHERE category IN ('Cà phê', 'Topping');",
            oracle: "SELECT name, category\nFROM products\nWHERE category IN ('Cà phê', 'Topping')",
          },
        },
        {
          label: "Đổi = 'Trà sữa' thành LIKE 'Trà%'",
          sql: {
            mysql: "SELECT name, category\nFROM products\nWHERE category LIKE 'Trà%';",
            oracle: "SELECT name, category\nFROM products\nWHERE category LIKE 'Trà%'",
          },
        },
        {
          label: 'Thêm AND price < 40000',
          sql: {
            mysql: "SELECT name, category\nFROM products\nWHERE category = 'Trà sữa' AND price < 40000;",
            oracle: "SELECT name, category\nFROM products\nWHERE category = 'Trà sữa' AND price < 40000",
          },
        },
        {
          label: "Đổi 'Trà sữa' thành 'tra sua'",
          sql: {
            mysql: "SELECT name, category\nFROM products\nWHERE category = 'tra sua';",
            oracle: "SELECT name, category\nFROM products\nWHERE category = 'tra sua'",
          },
        },
      ],
      say: "Thử mục cuối ở cả hai dialect. 'tra sua' khớp ở MySQL nhưng không khớp ở Oracle.",
    },
    {
      type: 'oracle',
      body: [
        "Khi so chữ, MySQL không phân biệt hoa thường và dấu theo mặc định. `'tra sua'` khớp với 'Trà sữa'.",
        'Oracle so từng ký tự đúng như bạn gõ. Khác hoa thường hoặc khác dấu là khác chữ.',
        'Cách so chữ do **[[collation]]** quyết định. Cả hai nơi đều cho đổi collation. Bài này dùng mặc định.',
        "Chữ luôn nằm trong nháy đơn, vì nháy kép khác nhau ở hai nơi. MySQL nhận cả nháy đơn lẫn nháy kép cho chữ. Oracle dùng nháy kép để bao tên column.",
        'Gõ `category = "Topping"` trên Oracle, database tìm column tên Topping. Nó không thấy column đó và báo ORA-00904.',
      ],
      mysql: "WHERE category = 'tra sua'\n-- 4 row",
      oracle: "WHERE category = 'tra sua'\n-- 0 row",
    },
    {
      type: 'text',
      title: 'Row thiếu giá trị',
      paragraphs: [
        'Vài món chưa có số calo. Ở những row đó, column calories là **[[null]]**, nghĩa là chưa có giá trị.',
        'NULL không bằng gì cả, kể cả chính NULL. Vì vậy `calories = NULL` không bao giờ đúng.',
        'Muốn tìm NULL, viết `IS NULL`. Muốn loại NULL, viết `IS NOT NULL`.',
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
            { text: '`price > 30000 AND price < 40000`', feedback: 'Cách này bỏ món giá đúng 30000 và đúng 40000.' },
            { text: '`price BETWEEN 40000 AND 30000`', feedback: 'BETWEEN cần số nhỏ trước, số lớn sau. Đổi chỗ thì không row nào đạt.' },
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
        {
          kind: 'choice',
          question: 'Bạn chạy `WHERE category = "Topping"` trên Oracle. Chuyện gì xảy ra?',
          options: [
            { text: 'Oracle báo lỗi, vì nháy kép bao tên column', correct: true, feedback: 'Đúng. Ở Oracle, chữ phải nằm trong nháy đơn.' },
            { text: 'Oracle trả đúng các món Topping', feedback: 'MySQL làm được, nhưng Oracle thì không. Nháy kép ở Oracle không bao chữ.' },
            { text: 'Oracle trả 0 row', feedback: 'Oracle không chạy được query này. Nó báo lỗi thay vì trả 0 row.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Sao kê của app ngân hàng',
      paragraphs: [
        'Bạn bấm "Tháng này" trong app ngân hàng và thấy danh sách giao dịch.',
        'App gửi cho database một query có WHERE. Điều kiện giữ các giao dịch nằm giữa ngày đầu và ngày cuối tháng.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'WHERE giữ row thỏa điều kiện.',
        'AND cần cả hai điều kiện đúng, OR cần một trong hai.',
        'Chữ nằm trong nháy đơn. Oracle không nhận nháy kép cho chữ.',
        'MySQL so chữ không phân biệt hoa thường và dấu. Oracle có phân biệt.',
        'Tìm NULL bằng IS NULL, không bằng dấu =.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 2: Queries with constraints (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_constraints' },
        { name: 'SQLBolt, bài 3: Queries with constraints (Pt. 2)', url: 'https://sqlbolt.com/lesson/select_queries_with_constraints_pt_2' },
      ],
    },
  ],
};
