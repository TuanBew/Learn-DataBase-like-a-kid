import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c4-b7',
  chapter: 4,
  order: 7,
  title: 'Viết query cho dễ đọc: xuống dòng, alias, comment',
  lead: 'Bạn trình bày query sao cho người khác đọc xong trong vài giây.',
  minutes: 12,
  goals: [
    'Đặt mỗi clause trên một dòng và thụt lề điều kiện phụ',
    'Đặt alias có nghĩa cho column và table',
    'Ghi chú bằng --, /* */ và tắt tạm một điều kiện bằng comment',
    'Nhận ra hai cách viết cho cùng một kết quả',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Query của người đi trước',
      paragraphs: [
        'Một đồng nghiệp rời công ty và để lại file SQL cho bạn.',
        'Cả query nằm trên một dòng dài. Kết quả có các column tên a, b và c.',
        'Bạn đọc ba lần mà vẫn chưa biết query lọc cái gì.',
        'Tuần sau, chính bạn mở lại query mình viết hôm nay. Bạn cũng không nhớ nó làm gì.',
        'Bài này dạy ba thói quen để người đọc sau hiểu query ngay, kể cả bạn của tuần sau.',
      ],
    },
    {
      type: 'text',
      title: 'Database bỏ qua cách trình bày',
      paragraphs: [
        'Database bỏ qua dấu cách thừa, chỗ xuống dòng, và chữ hoa hay chữ thường của từ khóa.',
        'Hai query cùng nội dung mà trình bày khác nhau thì cho cùng kết quả. Người đọc thì thấy khác biệt lớn.',
        'Bốn quy tắc trình bày giúp query dễ đọc.',
        '1. Mỗi clause bắt đầu ở một dòng mới: SELECT, FROM, WHERE, ORDER BY.',
        '2. Điều kiện thứ hai của WHERE xuống dòng và thụt vào hai dấu cách. AND hoặc OR đứng đầu dòng.',
        '3. Từ khóa SQL viết hoa. Tên table và column viết thường.',
        '4. Danh sách column dài thì mỗi column một dòng.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: cùng một query, nhiều cách viết',
      intro: 'Bấm Chạy. Rồi bấm từng mục thử. Mỗi mục đổi cách trình bày, kết quả vẫn là 3 row.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT p.name, p.price FROM products p WHERE p.category = 'Trà sữa' AND p.price < 40000 ORDER BY p.price DESC;",
        oracle:
          "SELECT p.name, p.price FROM products p WHERE p.category = 'Trà sữa' AND p.price < 40000 ORDER BY p.price DESC",
      },
      tries: [
        {
          label: 'Đổi từ khóa thành chữ thường',
          sql: {
            mysql:
              "select p.name, p.price from products p where p.category = 'Trà sữa' and p.price < 40000 order by p.price desc;",
            oracle:
              "select p.name, p.price from products p where p.category = 'Trà sữa' and p.price < 40000 order by p.price desc",
          },
        },
        {
          label: 'Xuống dòng và thụt lề',
          sql: {
            mysql:
              "SELECT p.name, p.price\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC;",
            oracle:
              "SELECT p.name, p.price\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC",
          },
        },
        {
          label: 'Thêm alias product_name và price_vnd',
          sql: {
            mysql:
              "SELECT p.name AS product_name, p.price AS price_vnd FROM products p WHERE p.category = 'Trà sữa' AND p.price < 40000 ORDER BY p.price DESC;",
            oracle:
              "SELECT p.name AS product_name, p.price AS price_vnd FROM products p WHERE p.category = 'Trà sữa' AND p.price < 40000 ORDER BY p.price DESC",
          },
        },
        {
          label: 'Thêm một dòng comment ở đầu',
          sql: {
            mysql:
              "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name, p.price FROM products p WHERE p.category = 'Trà sữa' AND p.price < 40000 ORDER BY p.price DESC;",
            oracle:
              "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name, p.price FROM products p WHERE p.category = 'Trà sữa' AND p.price < 40000 ORDER BY p.price DESC",
          },
        },
      ],
      say: 'Cả năm bản cho cùng ba row. Bản xuống dòng dễ đọc nhất, vì bạn thấy ngay query có bốn phần.',
    },
    {
      type: 'text',
      title: 'Alias có nghĩa',
      paragraphs: [
        '[[alias]] là tên tạm bạn đặt cho column hoặc table. Alias chỉ sống trong query đó.',
        'Đặt alias có nghĩa cho column. `p.price AS price_vnd` nói luôn đơn vị. Tên như `a` hay `col1` không nói gì.',
        'Đặt alias ngắn cho table: `FROM products p`. Sau đó viết `p.price` thay cho `products.price`.',
        'Query một table chưa cần alias table. Ở Chương 7 bạn nối nhiều table, và alias ngắn cho biết column nào thuộc table nào.',
        'Đã đặt alias cho table thì chỉ dùng alias. `products.price` báo lỗi 1054 ở MySQL và ORA-00904 ở Oracle.',
        'Alias của column dùng được trong ORDER BY. WHERE chạy trước SELECT nên chưa biết alias đó, và báo cùng hai lỗi trên.',
      ],
    },
    {
      type: 'text',
      title: 'Comment ghi chú cho người đọc',
      paragraphs: [
        '**[[comment]]** là phần chữ database bỏ qua. Bạn viết comment để ghi chú cho người đọc.',
        'Comment ngắn bắt đầu bằng `--` và kết thúc ở cuối dòng. Comment dài nằm giữa `/*` và `*/`, và được xuống dòng thoải mái.',
        'Comment trả lời câu hỏi "tại sao", như "báo cáo cho phòng kinh doanh". Code đã nói "cái gì" rồi.',
        'Comment cũng tắt tạm một điều kiện. Thêm `--` trước điều kiện và chạy lại. Xóa `--` khi muốn bật lại.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: tắt tạm một điều kiện',
      intro: 'Bấm Chạy. Query đã trình bày gọn và có comment ở đầu. Kết quả có 3 row.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name  AS product_name,\n       p.price AS price_vnd\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC;",
        oracle:
          "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name  AS product_name,\n       p.price AS price_vnd\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC",
      },
      tries: [
        {
          label: 'Thêm -- trước AND p.price < 40000',
          sql: {
            mysql:
              "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name  AS product_name,\n       p.price AS price_vnd\nFROM products p\nWHERE p.category = 'Trà sữa'\n  -- AND p.price < 40000\nORDER BY p.price DESC;",
            oracle:
              "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name  AS product_name,\n       p.price AS price_vnd\nFROM products p\nWHERE p.category = 'Trà sữa'\n  -- AND p.price < 40000\nORDER BY p.price DESC",
          },
        },
        {
          label: 'Thêm /* */ cạnh price_vnd',
          sql: {
            mysql:
              "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name  AS product_name,\n       p.price AS price_vnd /* giá bán lẻ, đơn vị đồng */\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC;",
            oracle:
              "-- Món Trà sữa dưới 40.000 đồng, món đắt xếp trước\nSELECT p.name  AS product_name,\n       p.price AS price_vnd /* giá bán lẻ, đơn vị đồng */\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC",
          },
        },
        {
          label: 'Đổi comment đầu thành khối /* */ hai dòng',
          sql: {
            mysql:
              "/* Báo cáo tuần\n   Món Trà sữa dưới 40.000 đồng */\nSELECT p.name  AS product_name,\n       p.price AS price_vnd\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC;",
            oracle:
              "/* Báo cáo tuần\n   Món Trà sữa dưới 40.000 đồng */\nSELECT p.name  AS product_name,\n       p.price AS price_vnd\nFROM products p\nWHERE p.category = 'Trà sữa'\n  AND p.price < 40000\nORDER BY p.price DESC",
          },
        },
      ],
      say: 'Tắt điều kiện giá bằng -- thì kết quả lên 4 row, vì món Trà sữa matcha 42000 đồng quay lại.',
    },
    {
      type: 'oracle',
      body: [
        'Cả hai dialect nhận `--` và `/* */`.',
        'MySQL chỉ coi `--` là comment khi sau nó có dấu cách. Viết `--ghi chu` dính liền thì MySQL báo lỗi 1064. Oracle không cần dấu cách.',
        'MySQL có thêm comment bắt đầu bằng `#`. Oracle báo ORA-00911 với dấu `#`.',
        'MySQL nhận `FROM products AS p`. Oracle không nhận AS trước alias của table, và báo ORA-00933. Viết `FROM products p` thì chạy ở cả hai nơi.',
        'Cuối query MySQL có dấu `;`. Công cụ Oracle như SQL*Plus cũng dùng `;`. Khung chạy trong bài này không cần dấu đó ở Oracle.',
      ],
      mysql: 'SELECT p.name\nFROM products AS p -- chú thích\nWHERE p.price > 40000; # chú thích kiểu MySQL',
      oracle: 'SELECT p.name\nFROM products p -- chú thích\nWHERE p.price > 40000',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Hai query chỉ khác cách xuống dòng và chữ hoa của từ khóa. Kết quả ra sao?',
          options: [
            { text: 'Giống nhau', correct: true, feedback: 'Đúng. Database bỏ qua cách trình bày.' },
            { text: 'Khác nhau, vì mỗi dòng mới là một query mới', feedback: 'Database chỉ kết thúc query ở dấu `;`, không phải ở dòng mới.' },
            { text: 'Bản viết hoa chạy nhanh hơn', feedback: 'Database không phân biệt hoa thường của từ khóa, và tốc độ không đổi.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn viết `FROM products p`. Cách nào gọi column price đúng?',
          options: [
            { text: '`p.price`', correct: true, feedback: 'Đúng. Đã có alias thì dùng alias.' },
            { text: '`products.price`', feedback: 'Table đã có alias p, nên tên products không còn dùng được. MySQL báo 1054, Oracle báo ORA-00904.' },
            { text: '`price.p`', feedback: 'Thứ tự là tên table đứng trước, dấu chấm, rồi tên column.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn muốn tắt tạm điều kiện `AND p.price < 40000` mà không xóa nó. Làm gì?',
          options: [
            { text: 'Thêm `-- ` đứng trước điều kiện', correct: true, feedback: 'Đúng. Phần sau `--` tới cuối dòng bị bỏ qua. Xóa `--` là bật lại.' },
            { text: 'Đặt điều kiện trong nháy đơn', feedback: 'Nháy đơn biến điều kiện thành một đoạn chữ, và query sai cú pháp.' },
            { text: 'Xóa điều kiện và nhớ viết lại sau', feedback: 'Cách này chạy được, nhưng bạn dễ quên điều kiện cũ. Comment giữ điều kiện ở đúng chỗ.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Query trong kho code của công ty',
      paragraphs: [
        'Công ty thường lưu query của báo cáo trong kho code chung, như Git. Đồng nghiệp mở từng query để duyệt trước khi chạy trên database thật.',
        'Query có xuống dòng gọn, tên column rõ và comment ghi mục đích được duyệt nhanh. Query một dòng dài thì người duyệt phải đoán.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Database bỏ qua xuống dòng, dấu cách thừa và chữ hoa thường của từ khóa.',
        'Mỗi clause một dòng, điều kiện phụ thụt hai dấu cách, từ khóa viết hoa.',
        'Alias có nghĩa cho column. Alias ngắn cho table, và đã có alias thì chỉ dùng alias.',
        'Comment dùng `--` hoặc `/* */`. MySQL thêm `#`, và cần dấu cách sau `--`.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Comments', url: 'https://dev.mysql.com/doc/refman/8.0/en/comments.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Comments', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Comments.html' },
        { name: 'Oracle Database 19c SQL Language Reference, SELECT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html' },
      ],
    },
  ],
};
