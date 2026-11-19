import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c1-b5',
  chapter: 1,
  order: 5,
  title: 'client, server và câu SELECT đầu tiên',
  lead: 'Yêu cầu của bạn đi qua đâu trước khi dữ liệu về tới màn hình?',
  minutes: 12,
  goals: [
    'Biết client gửi yêu cầu và server nhận yêu cầu',
    'Kể đường đi của một yêu cầu từ điện thoại tới database',
    'Chạy câu SELECT đầu tiên và đọc kết quả',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Gọi món ở quán',
      paragraphs: [
        'Bạn ngồi ở quán và gọi một ly trà. Bạn không vào bếp. Bạn nói với nhân viên, nhân viên chuyển phiếu vào bếp.',
        'Bếp làm xong, nhân viên mang ly ra cho bạn.',
        'Điện thoại của bạn cũng làm đúng như vậy với database. Nó gửi yêu cầu đi, rồi chờ kết quả về.',
        'Mình là Bi. Xem một yêu cầu đi qua từng chặng nhé.',
      ],
    },
    {
      type: 'scene',
      scene: 'client-server',
      title: 'Yêu cầu đi đâu',
      intro: 'Bấm từng bước. Xem chấm yêu cầu đi từ điện thoại tới server, tới database và quay về.',
    },
    {
      type: 'text',
      title: 'Hai bên của một cuộc gọi',
      paragraphs: [
        '**[[client]]** là chương trình của bạn. Điện thoại, trình duyệt và app đều là client.',
        '**[[server]]** là máy giữ database và trả lời client. Server luôn mở và chờ yêu cầu.',
        'Client gửi yêu cầu tới server. Server hỏi DBMS. DBMS lấy dữ liệu và trả về cho server.',
        'Server gửi kết quả ngược về client. Client hiện kết quả lên màn hình.',
        'Câu lệnh client gửi đi là một **[[query]]**. Query viết bằng SQL.',
        'Query đầu tiên của bạn dùng **[[select]]**. Từ khóa này chọn dữ liệu cần xem.',
        'Trong `SELECT * FROM products;`, dấu `*` nghĩa là mọi column. `FROM products` nghĩa là lấy từ table products. Dấu chấm phẩy kết thúc câu.',
      ],
    },
    {
      type: 'playground',
      title: 'Thử tay ngay',
      intro: 'Bấm Chạy, chưa cần hiểu hết câu này. Xem các row của table products hiện ra.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql'],
      sql: { mysql: 'SELECT * FROM products;' },
      say: 'Bạn vừa gửi query đầu tiên. Mỗi row là một món của tiệm.',
    },
    {
      type: 'quiz',
      title: 'Bài tập',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi bên với việc của nó.',
          pairs: [
            { left: 'client', right: 'Gửi yêu cầu đi' },
            { left: 'server', right: 'Nhận yêu cầu và hỏi database' },
            { left: 'Kết quả', right: 'Đi ngược về client' },
          ],
          done: 'Đúng hết rồi. Yêu cầu đi một chiều, kết quả quay về theo đường cũ.',
        },
        {
          kind: 'choice',
          question: 'Trong `SELECT * FROM products;`, dấu `*` nghĩa là gì?',
          options: [
            { text: 'Lấy mọi column', correct: true, feedback: 'Đúng. Dấu * thay cho tên mọi column của table.' },
            { text: 'Lấy một row đầu tiên', feedback: 'Dấu * nói về column, không nói về row. Nó nghĩa là lấy mọi column.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Mỗi lần mở app là một yêu cầu',
      paragraphs: [
        'Mở app gọi xe, app gửi yêu cầu tới server của hãng.',
        'Server hỏi database xem tài xế nào ở gần bạn. Kết quả quay về và hiện lên bản đồ.',
        'Mỗi lần bạn bấm trong app là một vòng gửi và nhận như vậy.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Client gửi yêu cầu. Server nhận và hỏi database.',
        'Kết quả đi ngược về client và hiện trên màn hình.',
        'Câu lệnh client gửi đi gọi là query.',
        '`SELECT * FROM products;` lấy mọi column của table products.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
