import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c3-b1',
  chapter: 3,
  order: 1,
  title: 'SELECT và FROM',
  lead: 'Bạn viết query đầu tiên: chọn column cần xem từ một table.',
  minutes: 12,
  goals: [
    'Viết query lấy vài column từ một table',
    'Dùng dấu * để lấy mọi column',
    'Tính toán ngay trong query',
    'Đặt tên mới cho column bằng AS',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tiệm nào, ở quận nào?',
      paragraphs: [
        'Một khách hỏi Bi: "Chuỗi trà sữa có những tiệm nào, ở quận nào?"',
        'Bi không đọc cả sổ cho khách nghe. Mình chỉ đọc hai thứ khách cần: tên tiệm và quận.',
        'Bạn cũng hỏi database theo cách đó. Bạn viết ra câu hỏi, database trả đúng phần bạn cần.',
        'Câu hỏi viết bằng **[[sql]]**. Mỗi câu hỏi gửi cho database gọi là một **[[query]]**.',
      ],
    },
    {
      type: 'text',
      title: 'Hai từ khóa đầu tiên',
      paragraphs: [
        '**[[select]]** nói bạn muốn xem column nào.',
        '**[[from]]** nói column đó nằm ở table nào.',
        'Mỗi từ khóa mở đầu một **[[clause]]**. Clause là một phần của query. Query là các clause xếp nối nhau.',
        'Query đầu tiên: `SELECT name, district FROM stores`. Đọc là: lấy name và district từ table stores.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay: danh sách tiệm',
      intro: 'Bấm Chạy. Query lấy tên và quận của mọi tiệm.',
      database: 'teashop',
      tables: ['stores'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, district\nFROM stores;',
        oracle: 'SELECT name, district\nFROM stores',
      },
      tries: [
        {
          label: 'Đổi danh sách column thành *',
          sql: { mysql: 'SELECT *\nFROM stores;', oracle: 'SELECT *\nFROM stores' },
        },
        {
          label: 'Thêm column city',
          sql: { mysql: 'SELECT name, district, city\nFROM stores;', oracle: 'SELECT name, district, city\nFROM stores' },
        },
        {
          label: 'Đổi chỗ name và district',
          sql: { mysql: 'SELECT district, name\nFROM stores;', oracle: 'SELECT district, name\nFROM stores' },
        },
      ],
      say: 'Table stores có 4 row, nên kết quả có 4 row. Column nào bạn không viết thì không hiện.',
    },
    {
      type: 'text',
      title: 'Điều bạn vừa thấy',
      paragraphs: [
        'Kết quả có đúng hai column, theo thứ tự bạn viết sau SELECT. Đổi thứ tự thì kết quả đổi theo.',
        'Muốn xem mọi column, viết dấu `*` thay cho danh sách. Dùng dấu `*` để nhìn nhanh một table lạ.',
        'Query này chưa có điều kiện nào, nên mọi row của table đều hiện ra.',
        'Query còn tính toán được. Một phép tính như `salary * 12` gọi là **[[expression]]**.',
        'Expression chưa có tên gọn. Đặt tên bằng AS. Tên đặt thêm gọi là **[[alias]]**.',
      ],
    },
    {
      type: 'playground',
      title: 'Lương cả năm của nhân viên',
      intro: 'Bấm Chạy. Mỗi nhân viên hiện lương tháng nhân 12.',
      database: 'teashop',
      tables: ['staff'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT full_name AS ho_ten, salary * 12 AS luong_nam\nFROM staff;',
        oracle: 'SELECT full_name AS ho_ten, salary * 12 AS luong_nam\nFROM staff',
      },
      tries: [
        {
          label: 'Đổi 12 thành 6',
          sql: {
            mysql: 'SELECT full_name AS ho_ten, salary * 6 AS luong_nam\nFROM staff;',
            oracle: 'SELECT full_name AS ho_ten, salary * 6 AS luong_nam\nFROM staff',
          },
        },
        {
          label: 'Đổi alias luong_nam thành tien_nam',
          sql: {
            mysql: 'SELECT full_name AS ho_ten, salary * 12 AS tien_nam\nFROM staff;',
            oracle: 'SELECT full_name AS ho_ten, salary * 12 AS tien_nam\nFROM staff',
          },
        },
        {
          label: 'Thêm column role',
          sql: {
            mysql: 'SELECT full_name AS ho_ten, role, salary * 12 AS luong_nam\nFROM staff;',
            oracle: 'SELECT full_name AS ho_ten, role, salary * 12 AS luong_nam\nFROM staff',
          },
        },
      ],
      say: 'AS chỉ đổi tên hiện trong kết quả. Table staff vẫn giữ nguyên tên column cũ.',
    },
    {
      type: 'text',
      paragraphs: [
        'AS đứng giữa expression và tên mới. Đặt tên mới liền một chữ, nối bằng dấu gạch dưới, như `luong_nam`.',
        'Alias chỉ sống trong query đó. Query sau không nhớ alias của query trước.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle in tiêu đề column bằng chữ hoa. Bạn gõ `name`, kết quả hiện NAME.',
        'Oracle hiểu tên không nằm trong nháy kép là chữ hoa. Dữ liệu trong row không đổi.',
        'Alias của table khác nhau ở một chỗ. MySQL cho viết AS trước alias của table. Oracle không có AS ở đó, và báo lỗi nếu bạn viết.',
      ],
      mysql: 'SELECT s.name AS ten_tiem\nFROM stores AS s;',
      oracle: 'SELECT s.name AS ten_tiem\nFROM stores s',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn chỉ cần tên và giá của các món. Query nào đúng?',
          options: [
            { text: '`SELECT name, price FROM products`', correct: true, feedback: 'Đúng. SELECT liệt kê column cần xem, FROM nói table.' },
            { text: '`SELECT * FROM products`', feedback: 'Query này chạy được, nhưng lấy mọi column. Bạn chỉ cần hai column.' },
            { text: '`FROM products SELECT name, price`', feedback: 'SELECT đứng trước FROM. Đổi chỗ hai clause thì query lỗi.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi từ khóa với điều nó làm.',
          pairs: [
            { left: 'SELECT', right: 'Chọn column cần xem' },
            { left: 'FROM', right: 'Chọn table để lấy dữ liệu' },
            { left: '*', right: 'Lấy mọi column' },
            { left: 'AS', right: 'Đặt alias' },
          ],
          done: 'Đúng hết rồi. Bốn thứ này đủ để bạn viết query đầu tiên.',
        },
        {
          kind: 'choice',
          question: 'Trên Oracle bạn gõ `name` và thấy tiêu đề NAME. Dữ liệu trong row có đổi thành chữ hoa không?',
          options: [
            { text: 'Không, chỉ tiêu đề column in hoa', correct: true, feedback: 'Đúng. Dữ liệu giữ nguyên như đã lưu.' },
            { text: 'Có, mọi chữ trong row đều thành chữ hoa', feedback: 'Dữ liệu không đổi. Chỉ tiêu đề column hiện chữ hoa.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Màn hình danh sách của app mua sắm',
      paragraphs: [
        'Màn hình danh sách món trong app mua sắm chỉ cần tên món, giá và ảnh.',
        'Lập trình viên viết SELECT với đúng ba column đó. Các column còn lại, như mô tả dài, để cho màn hình chi tiết.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Query bắt đầu bằng SELECT và FROM.',
        'SELECT nói column cần xem, FROM nói table.',
        'Dấu `*` nghĩa là mọi column.',
        'AS đặt alias cho column hoặc expression.',
        'Oracle in tiêu đề column bằng chữ hoa.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, bài 1: SELECT queries 101', url: 'https://sqlbolt.com/lesson/select_queries_introduction' },
      ],
    },
  ],
};
