import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c6-b1',
  chapter: 6,
  order: 1,
  title: 'COUNT, SUM, AVG, MIN, MAX',
  lead: 'Bạn gom nhiều row thành một con số.',
  minutes: 16,
  goals: [
    'Đếm, cộng, tính trung bình, tìm nhỏ nhất và lớn nhất',
    'Biết COUNT(*) khác COUNT(column) khi column có NULL',
    'Đếm giá trị khác nhau bằng COUNT(DISTINCT)',
    'Biết function gom bỏ qua row NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Thực đơn có bao nhiêu món?',
      paragraphs: [
        'Chủ tiệm hỏi Bi: "Thực đơn có bao nhiêu món? Món nào đắt nhất?"',
        'Bi không cần đọc từng món. Mình cần một con số cho mỗi câu hỏi.',
        'Đếm món, tìm giá cao nhất, tính giá trung bình: mỗi câu cho ra đúng một con số, lấy từ nhiều row.',
        'SQL có năm function cho kiểu câu hỏi này.',
      ],
    },
    {
      type: 'text',
      title: 'Năm function gom',
      paragraphs: [
        '**[[aggregate-function]]** nhận nhiều row và trả về một giá trị. Năm function hay gặp là:',
        '**[[count]]** đếm row.',
        '**[[sum]]** cộng các số.',
        '**[[avg]]** tính trung bình.',
        '**[[min]]** tìm giá trị nhỏ nhất, **[[max]]** tìm giá trị lớn nhất.',
        'Function gom trả đúng một row cho cả table. Nếu bạn viết WHERE, function chỉ gom các row còn lại.',
        '`COUNT(*)` đếm mọi row. `COUNT(column)` chỉ đếm row mà column có giá trị. Row NULL bị bỏ qua.',
        '`COUNT(DISTINCT column)` đếm số giá trị khác nhau.',
        'Table products có 14 món. Query dưới đây đếm món theo ba cách.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: ba cách đếm',
      intro: 'Bấm Chạy. So ba con số total_items, with_calories và categories.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          'SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(DISTINCT category) AS categories\nFROM products;',
        oracle:
          'SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(DISTINCT category) AS categories\nFROM products',
      },
      tries: [
        {
          label: "Thêm WHERE category = 'Topping'",
          sql: {
            mysql:
              "SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(DISTINCT category) AS categories\nFROM products\nWHERE category = 'Topping';",
            oracle:
              "SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(DISTINCT category) AS categories\nFROM products\nWHERE category = 'Topping'",
          },
        },
        {
          label: 'Bỏ DISTINCT ở COUNT(DISTINCT category)',
          sql: {
            mysql:
              'SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(category) AS categories\nFROM products;',
            oracle:
              'SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(category) AS categories\nFROM products',
          },
        },
        {
          label: 'Thêm COUNT(DISTINCT price) AS prices',
          sql: {
            mysql:
              'SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(DISTINCT category) AS categories,\n       COUNT(DISTINCT price) AS prices\nFROM products;',
            oracle:
              'SELECT COUNT(*) AS total_items,\n       COUNT(calories) AS with_calories,\n       COUNT(DISTINCT category) AS categories,\n       COUNT(DISTINCT price) AS prices\nFROM products',
          },
        },
      ],
      say: 'Có 14 món nhưng chỉ 11 món có calo, vì 3 món có calories là NULL. Bốn nhóm món khác nhau.',
    },
    {
      type: 'text',
      title: 'Cộng, trung bình, nhỏ nhất, lớn nhất',
      paragraphs: [
        'SUM, AVG, MIN và MAX đều bỏ qua row NULL.',
        'AVG chia tổng cho số row có giá trị, không chia cho số row của table.',
        'Nếu không row nào khớp WHERE, COUNT trả 0. SUM, AVG, MIN và MAX trả NULL.',
        'Query dưới đây tính giá của các món Cà phê.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: giá của nhóm Cà phê',
      intro: 'Bấm Chạy. Một row kết quả tóm tắt cả nhóm.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(price) AS avg_price,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Cà phê';",
        oracle:
          "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(price) AS avg_price,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Cà phê'",
      },
      tries: [
        {
          label: 'Đổi AVG(price) thành AVG(calories)',
          sql: {
            mysql:
              "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(calories) AS avg_calories,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Cà phê';",
            oracle:
              "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(calories) AS avg_calories,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Cà phê'",
          },
        },
        {
          label: "Đổi 'Cà phê' thành 'Topping'",
          sql: {
            mysql:
              "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(price) AS avg_price,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Topping';",
            oracle:
              "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(price) AS avg_price,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Topping'",
          },
        },
        {
          label: "Đổi 'Cà phê' thành 'Không có'",
          sql: {
            mysql:
              "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(price) AS avg_price,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Không có';",
            oracle:
              "SELECT COUNT(*) AS items,\n       SUM(price) AS total_price,\n       AVG(price) AS avg_price,\n       MIN(price) AS min_price,\n       MAX(price) AS max_price\nFROM products\nWHERE category = 'Không có'",
          },
        },
      ],
      say: 'Cà phê cacao đá xay chưa có calo. AVG(calories) chỉ chia cho 2 món có số, nên ra 180.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Table có 14 món, và 3 món có calories là NULL. `COUNT(calories)` ra bao nhiêu?',
          options: [
            { text: '14', feedback: 'COUNT(*) mới ra 14. COUNT(calories) bỏ các row NULL.' },
            { text: '11', correct: true, feedback: 'Đúng. 14 trừ 3 row NULL còn 11.' },
            { text: '3', feedback: '3 là số row NULL. COUNT(calories) đếm các row có giá trị.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn biết tiệm bán mấy nhóm món khác nhau. Viết gì?',
          options: [
            { text: '`COUNT(category)`', feedback: 'Cách này đếm mọi row có category, nên ra 14 thay vì 4.' },
            { text: '`COUNT(DISTINCT category)`', correct: true, feedback: 'Đúng. DISTINCT chỉ đếm mỗi giá trị một lần.' },
            { text: '`SUM(category)`', feedback: 'SUM cộng số. Category là chữ, không cộng được.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Ba món Cà phê có calories là 150, 210 và NULL. `AVG(calories)` ra bao nhiêu?',
          options: [
            { text: '120', feedback: '120 là 360 chia cho 3. AVG chia cho số row có giá trị, tức là 2.' },
            { text: '180', correct: true, feedback: 'Đúng. AVG bỏ row NULL: 360 chia cho 2.' },
            { text: 'NULL', feedback: 'AVG bỏ qua NULL và tính từ các số còn lại.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Số liệu đầu trang báo cáo',
      paragraphs: [
        'Báo cáo cuối ngày của một chuỗi cửa hàng thường mở đầu bằng vài con số: tổng đơn, tổng tiền, đơn lớn nhất.',
        'Mỗi con số là một function gom chạy trên cả table.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Function gom nhận nhiều row và trả một giá trị. Năm function: COUNT, SUM, AVG, MIN, MAX.',
        '`COUNT(*)` đếm mọi row. `COUNT(column)` bỏ row NULL.',
        '`COUNT(DISTINCT column)` đếm số giá trị khác nhau.',
        'SUM, AVG, MIN, MAX bỏ qua NULL. AVG chia cho số row có giá trị.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 10: Queries with aggregates (Pt. 1)', url: 'https://sqlbolt.com/lesson/select_queries_with_aggregates' },
        { name: 'MySQL 8.0 Reference Manual, Aggregate Function Descriptions', url: 'https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Aggregate Functions', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Aggregate-Functions.html' },
      ],
    },
  ],
};
