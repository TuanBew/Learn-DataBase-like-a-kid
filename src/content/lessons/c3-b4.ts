import type { Lesson } from '../types';

const q = (mysql: string, oracle: string) => ({ mysql: mysql + ';', oracle });

export const lesson: Lesson = {
  id: 'c3-b4',
  chapter: 3,
  order: 4,
  title: 'LIMIT và FETCH FIRST',
  lead: 'Bạn chỉ lấy vài row đầu của kết quả, và biết MySQL với Oracle viết khác nhau ra sao.',
  minutes: 15,
  goals: [
    'Lấy n row đầu bằng LIMIT (MySQL) và FETCH FIRST (Oracle)',
    'Bỏ qua row đầu bằng OFFSET để chia trang',
    'Nhận ra ROWNUM trong code Oracle cũ',
    'Biết vì sao ROWNUM và ORDER BY dễ gây nhầm',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ba món đắt nhất',
      paragraphs: [
        'Một khách hỏi mình: "Cho xem ba món đắt nhất thôi."',
        'Mình xếp thực đơn từ đắt đến rẻ. Rồi mình đọc đúng ba món đầu và dừng lại.',
        'Query cũng làm hai bước đó. Bước đầu là ORDER BY. Bước sau là cắt lấy vài row đầu.',
      ],
    },
    {
      type: 'text',
      title: 'Cắt lấy vài row đầu',
      paragraphs: [
        'MySQL cắt bằng **[[limit]]**. Oracle cắt bằng **[[fetch-first]]**. Hai cách làm cùng một điều, chỉ khác cách viết.',
        'Cả hai đứng ở cuối query, sau ORDER BY. Cắt xong thì database trả về, không còn bước nào nữa.',
        'Cần ba món đắt nhất thì xếp giá giảm dần trước, rồi lấy 3 row đầu.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: ba món đắt nhất',
      intro: 'Bấm Chạy. Hai dialect viết khác nhau ở cuối query.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 3;',
        oracle: 'SELECT name, price\nFROM products\nORDER BY price DESC\nFETCH FIRST 3 ROWS ONLY',
      },
      tries: [
        {
          label: 'Đổi 3 thành 5',
          sql: q(
            'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 5',
            'SELECT name, price\nFROM products\nORDER BY price DESC\nFETCH FIRST 5 ROWS ONLY',
          ),
        },
        {
          label: 'Đổi DESC thành ASC',
          sql: q(
            'SELECT name, price\nFROM products\nORDER BY price ASC\nLIMIT 3',
            'SELECT name, price\nFROM products\nORDER BY price ASC\nFETCH FIRST 3 ROWS ONLY',
          ),
        },
        {
          label: 'Bỏ ORDER BY',
          sql: q(
            'SELECT name, price\nFROM products\nLIMIT 3',
            'SELECT name, price\nFROM products\nFETCH FIRST 3 ROWS ONLY',
          ),
        },
      ],
      say: 'Bỏ ORDER BY thì 3 row đầu chỉ là 3 row database tình cờ gặp trước. Cần "đắt nhất" thì phải xếp trước.',
    },
    {
      type: 'oracle',
      body: [
        'Oracle 19c không có LIMIT. Gõ LIMIT ra lỗi ORA-00933: SQL command not properly ended.',
        'Oracle viết `FETCH FIRST n ROWS ONLY`. FIRST và NEXT dùng thay nhau được. ROW và ROWS cũng vậy.',
        'Bỏ số n thì Oracle lấy 1 row. Số n lớn hơn số row còn lại thì Oracle trả hết số row còn lại.',
      ],
      mysql: 'ORDER BY price DESC\nLIMIT 3',
      oracle: 'ORDER BY price DESC\nFETCH FIRST 3 ROWS ONLY',
    },
    {
      type: 'text',
      title: 'Bỏ qua row đầu để chia trang',
      paragraphs: [
        'Danh sách dài thường chia thành nhiều trang. Trang hai cần bỏ qua các row của trang một.',
        '**[[offset]]** nói database bỏ qua m row đầu. Sau đó mới đến lượt LIMIT hoặc FETCH.',
        'MySQL viết `LIMIT 4 OFFSET 4`: lấy 4 row, sau khi bỏ qua 4 row đầu. Oracle viết `OFFSET 4 ROWS FETCH NEXT 4 ROWS ONLY`.',
        'Khi chia trang, thêm một column duy nhất vào cuối ORDER BY. Hai món cùng giá khi đó không đổi chỗ giữa các trang.',
      ],
    },
    {
      type: 'playground',
      title: 'Trang thứ hai của thực đơn',
      intro: 'Bấm Chạy. Mỗi trang có 4 món. Query này lấy trang thứ hai.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, price\nFROM products\nORDER BY price DESC, product_id\nLIMIT 4 OFFSET 4;',
        oracle: 'SELECT name, price\nFROM products\nORDER BY price DESC, product_id\nOFFSET 4 ROWS FETCH NEXT 4 ROWS ONLY',
      },
      tries: [
        {
          label: 'Đổi OFFSET 4 thành OFFSET 0',
          sql: q(
            'SELECT name, price\nFROM products\nORDER BY price DESC, product_id\nLIMIT 4 OFFSET 0',
            'SELECT name, price\nFROM products\nORDER BY price DESC, product_id\nOFFSET 0 ROWS FETCH NEXT 4 ROWS ONLY',
          ),
        },
        {
          label: 'Đổi OFFSET 4 thành OFFSET 8',
          sql: q(
            'SELECT name, price\nFROM products\nORDER BY price DESC, product_id\nLIMIT 4 OFFSET 8',
            'SELECT name, price\nFROM products\nORDER BY price DESC, product_id\nOFFSET 8 ROWS FETCH NEXT 4 ROWS ONLY',
          ),
        },
        {
          label: 'Bỏ product_id khỏi ORDER BY',
          sql: q(
            'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 4 OFFSET 4',
            'SELECT name, price\nFROM products\nORDER BY price DESC\nOFFSET 4 ROWS FETCH NEXT 4 ROWS ONLY',
          ),
        },
      ],
      say: 'Trang một dùng OFFSET 0, trang hai OFFSET 4, trang ba OFFSET 8. Mỗi trang lùi thêm 4 row.',
    },
    {
      type: 'text',
      title: 'ROWNUM trong code Oracle cũ',
      paragraphs: [
        'Nếu bạn mở code Oracle viết từ lâu, bạn sẽ gặp **[[rownum]]**.',
        'ROWNUM là số thứ tự Oracle gán cho từng row lúc lấy ra: 1, 2, 3 và tiếp tục. Người viết code cũ dùng nó để lấy vài row đầu.',
        'Oracle gán ROWNUM trước khi ORDER BY chạy. Vì vậy `WHERE ROWNUM <= 3 ORDER BY price DESC` lấy 3 row đầu tiên database gặp. Sau đó mới xếp 3 row này, nên kết quả không phải ba món đắt nhất.',
        'Muốn đúng, người viết cũ xếp trước ở một **[[subquery]]**, tức một query nằm trong query khác. Sau đó họ mới giữ ROWNUM nhỏ.',
        'Code mới nên dùng FETCH FIRST. Tài liệu Oracle cũng khuyên cách này.',
      ],
    },
    {
      type: 'oracle',
      body: ['Hai cách lấy ba món đắt nhất trên Oracle. Cách đầu là cách cũ, cách sau là cách nên dùng.'],
      oracle:
        '-- Cách cũ: xếp trước trong query lồng, rồi giữ ROWNUM\nSELECT *\nFROM (SELECT name, price FROM products ORDER BY price DESC)\nWHERE ROWNUM <= 3\n\n-- Cách nên dùng\nSELECT name, price\nFROM products\nORDER BY price DESC\nFETCH FIRST 3 ROWS ONLY',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn viết `SELECT name FROM products LIMIT 3` trên Oracle. Chuyện gì xảy ra?',
          options: [
            { text: 'Oracle báo lỗi ORA-00933', correct: true, feedback: 'Đúng. Oracle 19c không có LIMIT. Dùng FETCH FIRST 3 ROWS ONLY.' },
            { text: 'Oracle trả 3 row', feedback: 'MySQL làm vậy, nhưng Oracle không hiểu LIMIT.' },
            { text: 'Oracle bỏ qua LIMIT và trả mọi row', feedback: 'Oracle không bỏ qua. Oracle báo lỗi vì không hiểu LIMIT.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chia thực đơn thành trang 4 món. Trang ba cần OFFSET bao nhiêu?',
          options: [
            { text: '8', correct: true, feedback: 'Đúng. Trang ba bỏ qua 8 món của hai trang đầu.' },
            { text: '4', feedback: 'OFFSET 4 là trang hai. Trang ba cần bỏ qua thêm 4 món nữa.' },
            { text: '12', feedback: 'OFFSET 12 bỏ qua ba trang đầu, nên đó là trang bốn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Vì sao `WHERE ROWNUM <= 3 ORDER BY price DESC` không cho ba món đắt nhất?',
          options: [
            { text: 'Oracle gán ROWNUM trước khi ORDER BY chạy', correct: true, feedback: 'Đúng. Database giữ 3 row đầu trước, rồi mới xếp 3 row đó.' },
            { text: 'ROWNUM chỉ chạy được với số lớn hơn 3', feedback: 'ROWNUM <= 3 chạy được. Vấn đề là thứ tự: ROWNUM đến trước ORDER BY.' },
            { text: 'ORDER BY không dùng được cùng WHERE', feedback: 'ORDER BY dùng được cùng WHERE. Vấn đề nằm ở thứ tự gán ROWNUM.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Trang kết quả tìm kiếm',
      paragraphs: [
        'Khi bạn tìm một món trong app mua sắm, app chỉ hiện vài chục món đầu. Bạn cuộn xuống thì app tải thêm.',
        'Mỗi lần tải là một query có ORDER BY, LIMIT và OFFSET. OFFSET tăng thêm mỗi lần bạn cuộn.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'MySQL lấy n row đầu bằng LIMIT n.',
        'Oracle lấy n row đầu bằng FETCH FIRST n ROWS ONLY. Gõ LIMIT ở Oracle ra ORA-00933.',
        'OFFSET bỏ qua row đầu để chia trang.',
        'Lấy "n row đầu" chỉ có nghĩa khi đã có ORDER BY.',
        'ROWNUM có trong code Oracle cũ. Oracle gán nó trước khi ORDER BY chạy.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 4: Filtering and sorting Query results', url: 'https://sqlbolt.com/lesson/filtering_sorting_query_results' },
        { name: 'Oracle Database 19c SQL Language Reference: ROWNUM Pseudocolumn', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROWNUM-Pseudocolumn.html' },
      ],
    },
  ],
};
