import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c5-b1',
  chapter: 5,
  order: 1,
  title: 'Phép tính trong SELECT',
  lead: 'Bạn nhờ database tính giá mới ngay trong kết quả, không cần máy tính.',
  minutes: 12,
  goals: [
    'Tính toán bằng + - * / trong SELECT',
    'Đặt tên cho column vừa tính bằng AS',
    'Làm tròn số lẻ bằng ROUND',
    'Biết một số NULL làm cả phép tính thành NULL',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Giảm 10% thì còn bao nhiêu?',
      paragraphs: [
        'Tiệm đang giảm 10% cho nhóm Trà sữa. Một khách hỏi Bi: "Ly trà sữa trân châu giờ còn bao nhiêu?"',
        'Bi không bấm máy tính. Giá gốc là 35.000 đồng. Mình lấy 35.000 nhân `0.9` và ra 31.500 đồng.',
        'Nhóm Trà sữa có bốn món. Bi phải nhân bốn lần, mỗi món một lần.',
        'Database làm cả bốn phép nhân cùng lúc, ngay trong query.',
      ],
    },
    {
      type: 'text',
      title: 'Phép tính đứng ở chỗ column',
      paragraphs: [
        '**[[expression]]** là một phép tính đứng trong query. Bạn viết nó ở chỗ column thường đứng.',
        'Có bốn phép tính: `+` (cộng), `-` (trừ), `*` (nhân), `/` (chia).',
        'Database tính phép tính cho từng row, mỗi row một lần. Kết quả là một column mới.',
        'Column mới chỉ có trong kết quả. Table products không đổi.',
        'Muốn đặt tên cho column mới, viết `AS` rồi gõ tên. Tên này là **[[alias]]**.',
        'Query dưới đây tính giá sau khi giảm 10%.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: giá sau khi giảm 10%',
      intro: 'Bấm Chạy. Column sale_price do query tính ra, không có sẵn trong table.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, price, price * 0.9 AS sale_price\nFROM products\nWHERE category = 'Trà sữa';",
        oracle: "SELECT name, price, price * 0.9 AS sale_price\nFROM products\nWHERE category = 'Trà sữa'",
      },
      tries: [
        {
          label: 'Đổi * 0.9 thành - 5000',
          sql: {
            mysql: "SELECT name, price, price - 5000 AS sale_price\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, price, price - 5000 AS sale_price\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: 'Đổi 0.9 thành 0.8',
          sql: {
            mysql: "SELECT name, price, price * 0.8 AS sale_price\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, price, price * 0.8 AS sale_price\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: 'Đổi tên sale_price thành new_price',
          sql: {
            mysql: "SELECT name, price, price * 0.9 AS new_price\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, price, price * 0.9 AS new_price\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
      ],
      say: 'Bạn đổi con số thì giá mới đổi theo. Column price gốc vẫn nằm yên bên cạnh.',
    },
    {
      type: 'text',
      title: 'Làm tròn số lẻ',
      paragraphs: [
        'Phép chia hay cho số lẻ rất dài. Giá chia cho calo là một ví dụ.',
        '**[[round]]** làm tròn số. Viết `ROUND(số, n)`, với n là số chữ số giữ lại sau dấu thập phân.',
        'Nếu n bằng 0, ROUND làm tròn thành số nguyên.',
        'Nếu một số trong phép tính là NULL, kết quả cũng là NULL. Món chưa có calo thì không chia được.',
        'Query dưới đây tính số đồng cho mỗi calo của các món Trà sữa.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: đồng cho mỗi calo',
      intro: 'Bấm Chạy. `ROUND(..., 1)` giữ một chữ số sau dấu thập phân.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
        oracle: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
      },
      tries: [
        {
          label: 'Đổi ROUND(..., 1) thành ROUND(..., 0)',
          sql: {
            mysql: "SELECT name, calories, ROUND(price / calories, 0) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, calories, ROUND(price / calories, 0) AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: 'Bỏ ROUND',
          sql: {
            mysql: "SELECT name, calories, price / calories AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa';",
            oracle: "SELECT name, calories, price / calories AS dong_per_calo\nFROM products\nWHERE category = 'Trà sữa'",
          },
        },
        {
          label: "Đổi 'Trà sữa' thành 'Cà phê'",
          sql: {
            mysql: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Cà phê';",
            oracle: "SELECT name, calories, ROUND(price / calories, 1) AS dong_per_calo\nFROM products\nWHERE category = 'Cà phê'",
          },
        },
      ],
      say: 'Thử mục cuối. Món Cà phê cacao đá xay chưa có calo, nên kết quả của món đó là NULL.',
    },
    {
      type: 'oracle',
      body: [
        'Bốn phép tính và ROUND chạy giống nhau ở cả hai dialect. Hai điểm khác nằm ở phép chia lấy dư và phép chia cho 0.',
        'MySQL có dấu `%` để lấy phần dư. Oracle không có dấu này, dùng function `MOD(a, b)`.',
        'Chia cho 0 thì MySQL ra NULL. Oracle báo lỗi ORA-01476.',
      ],
      mysql: 'price % 1000\nprice / 0   -- ra NULL',
      oracle: 'MOD(price, 1000)\nprice / 0   -- lỗi ORA-01476',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn muốn xem giá của mỗi món sau khi trừ 5.000 đồng, và đặt tên column là new_price. Query nào đúng?',
          options: [
            { text: '`SELECT name, price - 5000 AS new_price FROM products`', correct: true, feedback: 'Đúng. Phép trừ đứng ở chỗ column, AS đặt tên cho kết quả.' },
            { text: '`SELECT name, price = price - 5000 FROM products`', feedback: 'Dấu = chỉ so sánh hai vế. Kết quả ra đúng hoặc sai, không ra giá mới.' },
            { text: '`SET price = price - 5000`', feedback: 'SET thuộc lệnh UPDATE, dùng để sửa data. Bài này chỉ xem giá, không sửa.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `price / calories` cho món chưa có calo. Kết quả là gì?',
          options: [
            { text: '0', feedback: 'Số 0 là một giá trị có thật. Chưa có calo nghĩa là chưa biết, nên kết quả cũng chưa biết.' },
            { text: 'NULL', correct: true, feedback: 'Đúng. Một số NULL làm cả phép tính thành NULL.' },
            { text: 'Lỗi chia cho 0', feedback: 'NULL khác 0. Calo chưa có nên kết quả là NULL, và query không báo lỗi.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn lấy phần dư của price chia cho 1000 trên Oracle. Viết thế nào?',
          options: [
            { text: '`price % 1000`', feedback: 'MySQL nhận dấu %, Oracle thì không.' },
            { text: '`price MOD 1000`', feedback: 'Oracle dùng MOD như một function, có ngoặc và dấu phẩy.' },
            { text: '`MOD(price, 1000)`', correct: true, feedback: 'Đúng. Oracle lấy phần dư bằng MOD(a, b).' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Giá sau khuyến mãi trong app mua sắm',
      paragraphs: [
        'Bạn mở một app mua sắm vào ngày giảm giá. Giá gốc và giá sau giảm hiện cạnh nhau.',
        'App có thể không lưu sẵn giá sau giảm. Query tính nó bằng một phép nhân, ngay lúc bạn mở trang.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Phép tính đứng trong SELECT, ở chỗ column. Database tính cho từng row.',
        'Đặt tên column mới bằng AS. Table gốc không đổi.',
        'ROUND làm tròn số lẻ. `ROUND(số, 1)` giữ một chữ số sau dấu thập phân.',
        'Một số NULL trong phép tính làm kết quả thành NULL.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 9: Queries with expressions', url: 'https://sqlbolt.com/lesson/select_queries_with_expressions' },
      ],
    },
  ],
};
