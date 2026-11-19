import type { Lesson } from '../types';

/** Chương 1, bài 1. Sửa chữ ngay trong file này, giữ nguyên các khóa `id`, `scene`, `type`. */
export const lesson: Lesson = {
  id: 'c1-b1',
  chapter: 1,
  order: 1,
  title: 'Dữ liệu ở quanh ta',
  lead: 'Đơn trà sữa, chuyến xe, điểm thi đều có nơi cất, và bài này chỉ bạn nơi đó.',
  minutes: 12,
  goals: [
    'Kể tên bốn nơi quanh bạn đang ghi dữ liệu',
    'Nhận ra database là nơi cất dữ liệu',
    'Phân biệt row và table',
    'Đặt một ly trà sữa và xem row mới xuất hiện',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Đơn hôm qua vẫn còn',
      paragraphs: [
        'Sáng nay bạn đặt một ly trà sữa qua app. Bạn chọn món, bấm đặt, rồi đi làm.',
        'Hôm sau bạn mở lại app. Đơn hôm qua vẫn nằm đó, đủ món, giá và giờ đặt.',
        'App tắt cả đêm mà vẫn nhớ. Lý do là app đã ghi đơn lại ngay lúc bạn bấm.',
        'Mình là Châu, người giữ kho của tiệm. Mình ghi mọi thứ vào sổ, để hôm sau còn tìm lại.',
        'Thứ được ghi lại gọi là dữ liệu. Quanh bạn có nhiều nơi đang ghi dữ liệu. Ra phố xem thử nhé.',
      ],
    },
    {
      type: 'scene',
      scene: 'data-street',
      title: 'Phố dữ liệu',
      intro: 'Bốn nơi này đang mở cửa. Chạm vào từng nơi để xem họ ghi gì vào sổ.',
      copy: {
        hint: 'Chạm vào một nơi.',
        counterLabel: 'row đã ghi',
        places: [
          {
            id: 'tea',
            name: 'Tiệm trà sữa',
            action: 'Đặt một ly',
            ledger: 'orders',
            columns: ['order_id', 'drink', 'price', 'time'],
            rows: [
              ['101', 'Trà đào', '45.000', '08:15'],
              ['102', 'Cà phê sữa', '25.000', '08:20'],
              ['103', 'Trà matcha', '42.000', '08:31'],
            ],
            caption: 'Tiệm vừa ghi một đơn: mã đơn, món, giá và giờ đặt.',
          },
          {
            id: 'ride',
            name: 'App gọi xe',
            action: 'Gọi một chuyến',
            ledger: 'trips',
            columns: ['trip_id', 'driver', 'pickup', 'fare'],
            rows: [
              ['T501', 'Minh', 'Quận 1', '38.000'],
              ['T502', 'Hạnh', 'Quận 3', '52.000'],
              ['T503', 'Tuấn', 'Thủ Đức', '95.000'],
            ],
            caption: 'App vừa ghi một chuyến: mã chuyến, tài xế, nơi đón và cước.',
          },
          {
            id: 'bank',
            name: 'Ngân hàng',
            action: 'Chuyển tiền',
            ledger: 'transfers',
            columns: ['transfer_id', 'sender', 'amount', 'sent_at'],
            rows: [
              ['9001', 'Lan', '500.000', '09:02'],
              ['9002', 'Bảo', '1.200.000', '09:10'],
              ['9003', 'Thu', '250.000', '09:45'],
            ],
            caption: 'Ngân hàng vừa ghi một lần chuyển: người gửi, số tiền và giờ gửi.',
          },
          {
            id: 'school',
            name: 'Trường học',
            action: 'Vào điểm',
            ledger: 'scores',
            columns: ['student_id', 'student', 'subject', 'score'],
            rows: [
              ['S01', 'Nguyễn An', 'Toán', '9.0'],
              ['S02', 'Lê Bình', 'Văn', '7.5'],
              ['S03', 'Trần Chi', 'Anh', '8.5'],
            ],
            caption: 'Trường vừa ghi một điểm: học sinh, môn và số điểm.',
          },
        ],
        done: 'Bạn thấy chưa? Nơi nào cũng ghi dữ liệu, và nơi nào cũng ghi theo cùng một kiểu: mỗi lần một row, mỗi row đủ các ô.',
      },
    },
    {
      type: 'text',
      title: 'Sổ của bốn nơi có tên gọi',
      paragraphs: [
        'Bốn nơi vừa rồi đều cất dữ liệu trong một **[[database]]**.',
        'Database là nơi cất dữ liệu có sắp xếp, để nhiều người cùng ghi và tìm lại nhanh.',
        'Mỗi lần ghi là một **[[row]]**. Row là một lần ghi, gồm đủ các ô cần thiết.',
        'Các row cùng loại nằm chung một **[[table]]**. Đơn trà sữa nằm ở một table, chuyến xe nằm ở table khác.',
        'Bài sau mình nói kỹ hơn về table.',
      ],
    },
    {
      type: 'scene',
      scene: 'order-phone',
      title: 'Thử tay ngay: đặt một ly',
      intro: 'Chọn một món trên điện thoại, rồi bấm Đặt món. Một row sẽ bay vào table orders.',
      copy: {
        phoneTitle: 'Tiệm trà sữa',
        orderButton: 'Đặt món',
        drinks: [
          { id: 'p1', name: 'Trà sữa trân châu', price: 35000 },
          { id: 'p2', name: 'Trà đào cam sả', price: 45000 },
          { id: 'p3', name: 'Cà phê sữa đá', price: 25000 },
          { id: 'p4', name: 'Trà sữa matcha', price: 42000 },
        ],
        tableName: 'orders',
        empty: 'Table orders còn trống. Chọn một món rồi bấm Đặt món.',
        afterEach: [
          'Row đầu tiên đã vào table orders. Mỗi ô giữ một thông tin của đơn: mã, món, giá, giờ.',
          'Row thứ hai nằm ngay dưới row đầu. Row mới luôn thêm vào cuối table.',
          'Nhìn column order_id: mã tự tăng 1, 2, 3, nên không đơn nào trùng mã.',
          'Bốn đơn, bốn row, row nào cũng đủ các ô giống nhau. Table giữ mọi đơn theo cùng một khuôn.',
        ],
      },
    },
    {
      type: 'quiz',
      title: 'Bài tập',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi nơi với dữ liệu nơi đó ghi.',
          pairs: [
            { left: 'Tiệm trà sữa', right: 'Món và giá' },
            { left: 'App gọi xe', right: 'Nơi đón và cước' },
            { left: 'Ngân hàng', right: 'Người gửi và số tiền' },
            { left: 'Trường học', right: 'Tên học sinh và điểm' },
          ],
          done: 'Đúng hết rồi. Mỗi nơi ghi một loại dữ liệu riêng, nhưng cách ghi giống nhau.',
        },
        {
          kind: 'choice',
          question: 'Bạn đặt một ly trà sữa trong app, app ghi lại đơn. Thứ được ghi lại gọi là gì?',
          options: [
            { text: 'Dữ liệu', correct: true, feedback: 'Đúng. Thứ app ghi lại để hôm sau còn tìm thấy gọi là dữ liệu.' },
            { text: 'Màn hình', feedback: 'Màn hình chỉ là chỗ bạn nhìn thấy đơn. Thứ được ghi lại phía sau mới là dữ liệu.' },
            { text: 'Điện thoại', feedback: 'Điện thoại là máy bạn cầm. Đơn được ghi lại là dữ liệu, và dữ liệu cất ở database.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Ba đơn trà sữa cùng loại nằm chung một chỗ. Gọi đúng tên thì mỗi đơn và chỗ chung là gì?',
          options: [
            { text: 'Mỗi đơn là một row, chỗ chung là một table', correct: true, feedback: 'Đúng. Một lần ghi là một row, các row cùng loại nằm chung một table.' },
            { text: 'Mỗi đơn là một table, chỗ chung là một row', feedback: 'Hai tên này đang đổi chỗ nhau. Một đơn là một row, còn chỗ chung là table.' },
            { text: 'Mỗi đơn là một database, chỗ chung là một table', feedback: 'Database lớn hơn nhiều, vì database chứa cả các table. Một đơn chỉ là một row.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'GitHub cất dữ liệu trong MySQL',
      paragraphs: [
        'GitHub dùng MySQL làm kho dữ liệu chính cho mọi thứ ngoài git.',
        'Website, API và phần đăng nhập của GitHub đều lưu dữ liệu ở đó.',
        'MySQL là một phần mềm database. Khóa này dùng chính MySQL để học nền.',
      ],
      source: {
        name: 'GitHub Blog: MySQL High Availability at GitHub',
        url: 'https://github.blog/engineering/infrastructure/mysql-high-availability-at-github/',
      },
    },
    {
      type: 'keypoints',
      items: [
        'App nhớ được đơn của bạn vì đã ghi dữ liệu lại.',
        'Database là nơi cất dữ liệu có sắp xếp.',
        'Một lần ghi là một row.',
        'Các row cùng loại nằm chung một table.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL', url: 'https://cs50.harvard.edu/sql', note: 'CC BY-NC-SA 4.0' },
        { name: 'Khan Academy: Intro to SQL', url: 'https://www.khanacademy.org/computing/computer-programming/sql' },
      ],
    },
  ],
};
