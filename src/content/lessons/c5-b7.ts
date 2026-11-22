import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b7',
  chapter: 5,
  order: 7,
  title: 'Xử lý NULL và CASE WHEN',
  lead: 'Bạn thay NULL bằng giá trị rõ ràng và gắn nhãn cho row theo điều kiện.',
  minutes: 16,
  goals: [
    'Thay NULL bằng IFNULL, NVL hoặc COALESCE',
    'Biết function nào chạy ở dialect nào',
    'Gắn nhãn cho row bằng CASE WHEN',
    'Hiểu CASE WHEN dừng ở điều kiện đúng đầu tiên',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Món chưa có calo thì ghi gì?',
      paragraphs: [
        'Bi in thực đơn mới cho khách. Cạnh mỗi món có số calo.',
        'Ba món chưa đo calo, nên ô calories còn trống. Khách nhìn ô trống thì không biết đó là 0 hay chưa đo.',
        'Bi muốn ghi một con số rõ ràng. Mình cũng muốn thêm nhãn cạnh giá, như Rẻ hoặc Đắt.',
        'Query làm được cả hai.',
      ],
    },
    {
      type: 'text',
      title: 'Thay NULL bằng giá trị khác',
      paragraphs: [
        'Column calories có **[[null]]** ở các món chưa đo. NULL nghĩa là chưa có giá trị. Bạn thay NULL bằng một giá trị khác ngay trong kết quả.',
        'MySQL có **[[ifnull]]**: `IFNULL(calories, 0)`. Nếu calories khác NULL, kết quả giữ nguyên calories. Nếu là NULL, kết quả là 0.',
        'Oracle có **[[nvl]]**, dùng giống hệt: `NVL(calories, 0)`.',
        '**[[coalesce]]** chạy ở cả hai dialect. COALESCE nhận một danh sách và trả giá trị đầu tiên khác NULL.',
        'Cả ba chỉ đổi kết quả hiện ra. Table vẫn giữ NULL.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: thay NULL bằng 0',
      intro: 'Bấm Chạy. Hai món chưa có calo hiện số 0 ở column calories_filled.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT name, calories, IFNULL(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
        oracle:
          "SELECT name, calories, NVL(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
      },
      tries: [
        {
          label: 'Đổi IFNULL hoặc NVL thành COALESCE',
          sql: {
            mysql:
              "SELECT name, calories, COALESCE(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
            oracle:
              "SELECT name, calories, COALESCE(calories, 0) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
          },
        },
        {
          label: 'Đổi 0 thành 100',
          sql: {
            mysql:
              "SELECT name, calories, IFNULL(calories, 100) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
            oracle:
              "SELECT name, calories, NVL(calories, 100) AS calories_filled\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
          },
        },
        {
          label: 'Thêm column calories + 10',
          sql: {
            mysql:
              "SELECT name, calories, IFNULL(calories, 0) AS calories_filled, calories + 10 AS plus_ten\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping');",
            oracle:
              "SELECT name, calories, NVL(calories, 0) AS calories_filled, calories + 10 AS plus_ten\nFROM products\nWHERE category IN ('Trà trái cây', 'Topping')",
          },
        },
      ],
      say: 'Column plus_ten vẫn là NULL ở hai món đó, vì phép cộng dùng calories gốc, không dùng calories_filled.',
    },
    {
      type: 'oracle',
      body: [
        'IFNULL chỉ có ở MySQL. NVL chỉ có ở Oracle. Gõ nhầm thì database báo không biết function đó.',
        'MySQL báo lỗi 1305 khi gặp NVL. Oracle báo ORA-00904 khi gặp IFNULL.',
        'Muốn một query chạy ở cả hai dialect, dùng COALESCE. COALESCE của Oracle cần ít nhất hai tham số.',
      ],
      mysql: 'IFNULL(calories, 0)\n-- NVL(calories, 0) báo lỗi 1305',
      oracle: 'NVL(calories, 0)\n-- IFNULL(calories, 0) báo ORA-00904',
    },
    {
      type: 'text',
      title: 'CASE WHEN chia row thành nhóm',
      paragraphs: [
        '**[[case-when]]** chọn một giá trị theo điều kiện. Cách đọc giống câu "nếu... thì...".',
        'Khung viết: `CASE WHEN điều kiện THEN giá trị ... ELSE giá trị khác END`.',
        'Database xét các WHEN từ trên xuống. Gặp điều kiện đúng đầu tiên thì dừng và lấy giá trị của điều kiện đó.',
        'Nếu không điều kiện nào đúng, database lấy giá trị sau ELSE. Thiếu ELSE thì kết quả là NULL.',
        'Query dưới đây gắn nhãn giá cho các món Trà sữa và Cà phê.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: nhãn giá',
      intro: 'Bấm Chạy. Dưới 30000 là Rẻ, từ 30000 tới dưới 45000 là Vừa, còn lại là Đắt. CASE WHEN viết giống nhau ở hai dialect.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql:
          "SELECT name, price,\n  CASE WHEN price < 30000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê');",
        oracle:
          "SELECT name, price,\n  CASE WHEN price < 30000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê')",
      },
      tries: [
        {
          label: 'Đổi mốc 30000 thành 40000',
          sql: {
            mysql:
              "SELECT name, price,\n  CASE WHEN price < 40000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê');",
            oracle:
              "SELECT name, price,\n  CASE WHEN price < 40000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê')",
          },
        },
        {
          label: "Bỏ ELSE 'Đắt'",
          sql: {
            mysql:
              "SELECT name, price,\n  CASE WHEN price < 30000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê');",
            oracle:
              "SELECT name, price,\n  CASE WHEN price < 30000 THEN 'Rẻ'\n       WHEN price < 45000 THEN 'Vừa' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê')",
          },
        },
        {
          label: 'Đảo thứ tự hai WHEN',
          sql: {
            mysql:
              "SELECT name, price,\n  CASE WHEN price < 45000 THEN 'Vừa'\n       WHEN price < 30000 THEN 'Rẻ'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê');",
            oracle:
              "SELECT name, price,\n  CASE WHEN price < 45000 THEN 'Vừa'\n       WHEN price < 30000 THEN 'Rẻ'\n       ELSE 'Đắt' END AS price_level\nFROM products\nWHERE category IN ('Trà sữa', 'Cà phê')",
          },
        },
      ],
      say: 'Thử mục đảo thứ tự. Mọi món dưới 45000 dừng ở nhãn Vừa, nên nhãn Rẻ không bao giờ hiện.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn cần một query chạy được ở cả MySQL và Oracle. Dùng function nào để thay NULL?',
          options: [
            { text: '`IFNULL`', feedback: 'Chỉ MySQL biết IFNULL. Oracle báo ORA-00904.' },
            { text: '`NVL`', feedback: 'Chỉ Oracle biết NVL. MySQL báo lỗi 1305.' },
            { text: '`COALESCE`', correct: true, feedback: 'Đúng. COALESCE chạy ở cả hai dialect.' },
          ],
        },
        {
          kind: 'choice',
          question: "Query có `CASE WHEN price < 45000 THEN 'Vừa' WHEN price < 30000 THEN 'Rẻ' END`. Món giá 25000 nhận nhãn gì?",
          options: [
            { text: 'Rẻ', feedback: 'Database dừng ở WHEN đầu tiên đúng. 25000 nhỏ hơn 45000 nên dừng ngay ở đó.' },
            { text: 'Vừa', correct: true, feedback: 'Đúng. WHEN đầu tiên đã đúng, nên database không xét WHEN sau.' },
            { text: 'NULL', feedback: 'Điều kiện đầu đã đúng, nên đã có nhãn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Một CASE WHEN không có ELSE, và không điều kiện nào đúng. Kết quả là gì?',
          options: [
            { text: 'NULL', correct: true, feedback: 'Đúng. Thiếu ELSE thì kết quả là NULL.' },
            { text: 'Chuỗi rỗng', feedback: 'Database không tự điền chữ nào. Kết quả là NULL.' },
            { text: 'Lỗi', feedback: 'Query vẫn chạy bình thường. Kết quả là NULL.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Hạng khách thân thiết',
      paragraphs: [
        'Một app có thể chia khách thành hạng đồng, bạc và vàng theo số tiền đã chi.',
        'Query dùng CASE WHEN: chi trên mức thứ nhất là vàng, trên mức thứ hai là bạc, còn lại là đồng.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'IFNULL chỉ có ở MySQL. NVL chỉ có ở Oracle. COALESCE chạy ở cả hai.',
        'Các function này chỉ đổi kết quả hiện ra, table vẫn giữ NULL.',
        'CASE WHEN xét điều kiện từ trên xuống và dừng ở điều kiện đúng đầu tiên.',
        'Thiếu ELSE thì kết quả của CASE là NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, Flow Control Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/flow-control-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, NVL', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NVL.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COALESCE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COALESCE.html' },
      ],
    },
  ],
};
