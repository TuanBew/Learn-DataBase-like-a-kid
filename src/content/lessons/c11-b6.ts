import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c11-b6',
  chapter: 11,
  order: 6,
  title: 'Ngày giờ ở Oracle thật: DATE có giờ, định dạng mặc định, so ngày cho đúng',
  lead: 'Bạn lọc đủ row theo ngày, và luôn viết rõ định dạng ngày thay vì dựa vào mặc định.',
  minutes: 14,
  goals: [
    'Biết column DATE của Oracle luôn chứa cả giờ',
    'Biết vì sao so bằng dấu = có thể sót row',
    'Lọc theo khoảng hoặc bằng TRUNC để lấy đủ row của một ngày',
    'Viết rõ định dạng bằng TO_DATE và TO_CHAR',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Đơn ngày 9 tháng 3 đi đâu mất',
      paragraphs: [
        'Chị Mai ở phòng Kinh doanh nhắn Bi: "Em lấy giúp chị các đơn đặt ngày 9 tháng 3 năm 2025."',
        'Bi viết `WHERE order_date = DATE \'2025-03-09\'` và bấm Chạy. Kết quả trống.',
        'Chị Mai nhớ rõ có một đơn chiều hôm đó. Bi đọc lại query và không thấy chỗ nào sai.',
        'Lỗi nằm ở một điều ít người để ý: ngày trong Oracle có kèm giờ.',
      ],
    },
    {
      type: 'text',
      title: 'DATE của Oracle luôn có giờ',
      paragraphs: [
        'Column kiểu DATE của Oracle lưu năm, tháng, ngày, giờ, phút và giây.',
        'Đơn của chị Mai đặt lúc 13:09:32 ngày 9 tháng 3. Giá trị trong `order_date` là `2025-03-09 13:09:32`.',
        '`DATE \'2025-03-09\'` không có giờ, nên Oracle hiểu là 00:00:00 của ngày đó.',
        'Dấu `=` so từng giây. 13:09:32 không bằng 00:00:00, nên row không được giữ.',
        'Row nào chỉ có giờ 00:00:00 mới khớp. Vì thế query của Bi chạy đúng cú pháp nhưng sót row.',
        'MySQL tách hai kiểu. DATE chỉ có ngày. DATETIME có cả giờ. Column DATETIME gặp đúng lỗi này.',
        'TIMESTAMP của Oracle giống DATE, và có thêm phần lẻ giây.',
      ],
    },
    {
      type: 'text',
      title: 'Tool chỉ hiện theo định dạng mặc định',
      paragraphs: [
        'Bạn nhìn một column DATE và thấy `09-MAR-25`. Bạn tưởng column không có giờ. Giờ vẫn nằm trong đó.',
        '**[[nls-date-format]]** là tham số quy định định dạng mặc định khi Oracle đổi giữa ngày và chữ.',
        'Theo tài liệu Oracle 19c, giá trị mặc định của tham số này lấy từ NLS_TERRITORY. Người quản trị đặt được giá trị khác.',
        'Vì vậy cùng một ngày có thể hiện theo kiểu khác nhau ở hai nơi. Có tool chỉ hiện phần ngày.',
        'Đừng đoán giờ bằng mắt. Muốn thấy giờ, hãy tự viết định dạng bằng `TO_CHAR`.',
        "Mặc định cũng làm query lỗi. `WHERE order_date = '2025-03-09'` báo ORA-01861 khi chữ không khớp định dạng mặc định.",
        'Cùng query ấy có thể chạy được ở máy khác, nếu máy đó đặt định dạng khác. Hãy dùng `DATE \'2025-03-09\'` hoặc `TO_DATE`.',
      ],
    },
    {
      type: 'text',
      title: 'Hai cách so ngày cho đúng',
      paragraphs: [
        'Cách một: lọc theo khoảng. Lấy từ đầu ngày, tới trước đầu ngày hôm sau.',
        '`order_date >= DATE \'2025-03-09\' AND order_date < DATE \'2025-03-10\'` giữ mọi giờ của ngày 9 tháng 3.',
        'Dùng `<` với ngày hôm sau, không dùng `<=` với 23:59:59. Cách này không bỏ sót những giây lẻ.',
        'Cách hai: **[[trunc]]**. `TRUNC(order_date)` cắt giờ về 00:00:00. Rồi bạn so bằng dấu `=` như thường.',
        'TRUNC gọn hơn. Khoảng thường nhanh hơn, vì column không bị bọc trong function. Một function bọc column thường làm index không dùng được.',
        'Ở MySQL, `DATE(order_date) = \'2025-03-09\'` làm việc giống TRUNC.',
        'Cả hai cách đều cho cùng kết quả. Với table lớn, hãy chọn khoảng.',
      ],
    },
    {
      type: 'code',
      title: 'Ba cách viết, một kết quả',
      intro: 'Cả ba query đều trả về đơn 5013 của chị Mai. Cách đầu sai nên không ra row nào.',
      code: "-- sai: chỉ khớp row có giờ 00:00:00\nSELECT order_id FROM orders\nWHERE order_date = DATE '2025-03-09';\n\n-- đúng: khoảng\nSELECT order_id FROM orders\nWHERE order_date >= DATE '2025-03-09'\n  AND order_date <  DATE '2025-03-10';\n\n-- đúng: cắt giờ\nSELECT order_id FROM orders\nWHERE TRUNC(order_date) = DATE '2025-03-09';",
      notes: [
        { find: "WHERE order_date = DATE '2025-03-09';", text: 'So từng giây với 00:00:00. Đơn lúc 13:09:32 bị bỏ.' },
        { find: "order_date <  DATE '2025-03-10'", text: 'Nhỏ hơn đầu ngày hôm sau. Dấu < giữ ngày 9 trọn vẹn và loại ngày 10.' },
        { find: 'TRUNC(order_date)', text: 'Cắt giờ, phút, giây. Ngày 9 lúc 13:09:32 thành ngày 9 lúc 00:00:00.' },
      ],
    },
    {
      type: 'text',
      title: 'Viết rõ định dạng, đừng dựa vào mặc định',
      paragraphs: [
        '`TO_DATE` đổi chữ thành ngày. `TO_CHAR` đổi ngày thành chữ. Cả hai nhận một khuôn định dạng.',
        "`TO_DATE('09/03/2025', 'DD/MM/YYYY')` luôn là ngày 9 tháng 3, dù tool đặt định dạng nào.",
        "`TO_CHAR(order_date, 'DD/MM/YYYY HH24:MI')` luôn hiện ngày và giờ theo kiểu 24 giờ, như `09/03/2025 13:09`.",
        'Chú ý hai chữ gần giống: `MM` là tháng, `MI` là phút. `HH24` là giờ từ 0 tới 23.',
        'Thiếu định dạng thì kết quả đổi theo máy. Có định dạng thì ai chạy cũng ra một kết quả.',
        'MySQL làm điều tương tự bằng `STR_TO_DATE` và `DATE_FORMAT`, với khuôn viết kiểu `%d/%m/%Y %H:%i`.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: lọc đơn ngày 9 tháng 3',
      intro: 'Bấm Chạy. Query gốc dùng dấu =, và ra 0 row. Rồi bấm từng mục để thấy đơn 5013 hiện ra.',
      database: 'company',
      tables: ['orders'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT order_id, order_date FROM orders WHERE order_date = '2025-03-09';",
        oracle: "SELECT order_id, order_date FROM orders WHERE order_date = DATE '2025-03-09'",
      },
      tries: [
        {
          label: 'Lọc theo khoảng: từ đầu ngày 9 tới trước ngày 10',
          sql: {
            mysql: "SELECT order_id, order_date FROM orders WHERE order_date >= '2025-03-09' AND order_date < '2025-03-10';",
            oracle: "SELECT order_id, order_date FROM orders WHERE order_date >= DATE '2025-03-09' AND order_date < DATE '2025-03-10'",
          },
        },
        {
          label: 'Cắt giờ bằng TRUNC (MySQL: DATE)',
          sql: {
            mysql: "SELECT order_id, order_date FROM orders WHERE DATE(order_date) = '2025-03-09';",
            oracle: "SELECT order_id, order_date FROM orders WHERE TRUNC(order_date) = DATE '2025-03-09'",
          },
        },
        {
          label: 'Hiện ngày và giờ bằng định dạng rõ ràng',
          sql: {
            mysql:
              "SELECT order_id, DATE_FORMAT(order_date, '%d/%m/%Y %H:%i') AS gio_dat FROM orders WHERE order_id IN (5013, 5033, 5045);",
            oracle:
              "SELECT order_id, TO_CHAR(order_date, 'DD/MM/YYYY HH24:MI') AS gio_dat FROM orders WHERE order_id IN (5013, 5033, 5045)",
          },
        },
        {
          label: 'Viết ngày bằng kiểu DD/MM/YYYY',
          sql: {
            mysql:
              "SELECT order_id, DATE_FORMAT(order_date, '%d/%m/%Y %H:%i') AS gio_dat FROM orders WHERE order_date >= STR_TO_DATE('09/03/2025', '%d/%m/%Y') AND order_date < STR_TO_DATE('10/03/2025', '%d/%m/%Y');",
            oracle:
              "SELECT order_id, TO_CHAR(order_date, 'DD/MM/YYYY HH24:MI') AS gio_dat FROM orders WHERE order_date >= TO_DATE('09/03/2025', 'DD/MM/YYYY') AND order_date < TO_DATE('10/03/2025', 'DD/MM/YYYY')",
          },
        },
      ],
      say: 'Mục thứ ba cho thấy đơn 5013 lúc 13:09, đơn 5033 lúc 11:12 và đơn 5045 lúc 10:45. Cả ba đều có giờ khác 00:00.',
    },
    {
      type: 'oracle',
      body: [
        'Oracle: DATE có giờ. MySQL: DATE chỉ có ngày, DATETIME có giờ.',
        'Cả hai dialect đều bỏ sót row khi so bằng dấu = với một ngày không giờ. Cách sửa giống nhau: lọc theo khoảng.',
        "So ngày với chuỗi: Oracle báo ORA-01861 khi chuỗi không khớp định dạng mặc định. MySQL tự đọc chuỗi `'2025-03-09'`.",
        'Với Oracle, hãy viết `DATE \'2025-03-09\'` hoặc `TO_DATE`. Với MySQL, `STR_TO_DATE` cho định dạng khác kiểu ISO.',
      ],
      mysql:
        "SELECT order_id\nFROM orders\nWHERE order_date >= '2025-03-09'\n  AND order_date <  '2025-03-10';",
      oracle:
        "SELECT order_id\nFROM orders\nWHERE order_date >= DATE '2025-03-09'\n  AND order_date <  DATE '2025-03-10';",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: "`WHERE order_date = DATE '2025-03-09'` trả 0 row, dù có đơn lúc 13:09 ngày đó. Vì sao?",
          options: [
            { text: 'DATE có giờ, và 13:09 không bằng 00:00:00', correct: true, feedback: 'Đúng. Dấu = so cả giờ. Chỉ row có giờ đúng 00:00:00 mới khớp.' },
            { text: 'Oracle không nhận DATE viết kiểu ISO', feedback: "Oracle nhận `DATE '2025-03-09'` bình thường. Query chạy được, chỉ sót row." },
            { text: 'Table orders chưa có row nào ngày 9', feedback: 'Có một đơn, là đơn 5013. Hãy lọc theo khoảng để thấy nó.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Cách nào lấy đủ mọi đơn của ngày 9 tháng 3 năm 2025?',
          options: [
            { text: "order_date >= DATE '2025-03-09' AND order_date < DATE '2025-03-10'", correct: true, feedback: 'Đúng. Từ đầu ngày 9 tới trước đầu ngày 10, nên mọi giờ của ngày 9 đều vào.' },
            { text: "order_date = DATE '2025-03-09'", feedback: 'Cách này chỉ giữ row lúc 00:00:00.' },
            { text: "order_date BETWEEN DATE '2025-03-09' AND DATE '2025-03-09'", feedback: 'BETWEEN gồm hai đầu, nhưng hai đầu đều là 00:00:00. Đơn lúc 13:09 vẫn bị sót.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi mẩu với ý nghĩa của nó.',
          pairs: [
            { left: 'TO_DATE', right: 'Đổi chữ thành ngày' },
            { left: 'TO_CHAR', right: 'Đổi ngày thành chữ' },
            { left: 'TRUNC', right: 'Cắt giờ, giữ ngày' },
            { left: 'HH24', right: 'Giờ từ 0 tới 23' },
          ],
          done: 'Đúng hết. Viết rõ định dạng thì ai chạy query cũng ra cùng kết quả.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Báo cáo tháng 3 thiếu một đơn',
      paragraphs: [
        'Kế toán chạy báo cáo tháng 3 với `BETWEEN DATE \'2025-03-01\' AND DATE \'2025-03-31\'`. Kết quả có 6 đơn.',
        'Đơn 5017 đặt lúc 12:34 ngày 31 tháng 3 bị sót, vì 12:34 lớn hơn 00:00 của ngày 31. Lọc theo khoảng với `< DATE \'2025-04-01\'` cho 7 đơn.',
        'Số tiền báo cáo thiếu một đơn mà không ai thấy lỗi. Vì thế người làm báo cáo luôn lọc ngày theo khoảng.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'DATE của Oracle luôn chứa cả giờ. `DATE \'2025-03-09\'` là 00:00:00 ngày đó.',
        'So bằng dấu = sót row có giờ khác 00:00. Hãy lọc theo khoảng: `>= đầu ngày AND < đầu ngày hôm sau`.',
        '`TRUNC(column)` cắt giờ để so bằng dấu =. Khoảng thường tốt hơn trên table lớn.',
        "Luôn viết rõ định dạng: `TO_DATE(..., 'DD/MM/YYYY')` và `TO_CHAR(..., 'DD/MM/YYYY HH24:MI')`.",
        'Định dạng mặc định do NLS_DATE_FORMAT quy định, và người quản trị đặt được. Đừng dựa vào nó.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c Reference, NLS_DATE_FORMAT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/NLS_DATE_FORMAT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Datetime Data Types', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html' },
        { name: 'Oracle Database 19c SQL Language Reference, TO_DATE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TO_DATE.html' },
        { name: 'Oracle Database 19c SQL Language Reference, TRUNC (date)', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/TRUNC-date.html' },
        { name: 'MySQL 8.0 Reference Manual, The DATE, DATETIME, and TIMESTAMP Types', url: 'https://dev.mysql.com/doc/refman/8.0/en/datetime.html' },
      ],
    },
  ],
};
