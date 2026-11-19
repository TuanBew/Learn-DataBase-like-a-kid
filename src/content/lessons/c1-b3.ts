import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c1-b3',
  chapter: 1,
  order: 3,
  title: 'table, row, column',
  lead: 'Một table giống tờ giấy kẻ ô. Bài này chỉ bạn từng phần của nó.',
  minutes: 12,
  goals: [
    'Chỉ ra table, row, column và một ô trong một table',
    'Kể ba data type cơ bản: số, chữ, ngày',
    'Hiểu vì sao mỗi column chỉ nhận một data type',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Sổ điểm của lớp',
      paragraphs: [
        'Cô giáo có một cuốn sổ điểm. Mỗi học sinh một đường kẻ ngang, ghi tên, môn học và điểm.',
        'Cuối kỳ cô lật sổ tìm điểm của Lan. Cô lướt xuống tìm tên Lan, rồi nhìn sang ô điểm.',
        'Ai nhìn vào cũng đọc được sổ này, vì nó kẻ ô ngay ngắn.',
        'Table trong database cũng kẻ ô như vậy. Mình là Bi, và mình sẽ chỉ bạn từng phần của một table.',
      ],
    },
    {
      type: 'scene',
      scene: 'table-anatomy',
      title: 'Mổ xẻ một table',
      intro: 'Bấm lần lượt table, row, column và một ô để thấy mỗi phần nằm ở đâu. Rồi thử ghi một giá trị sai data type.',
    },
    {
      type: 'text',
      title: 'Các phần của một table',
      paragraphs: [
        'Một **[[table]]** giữ một loại dữ liệu. Tiệm trà sữa có table `products` giữ các món.',
        'Mỗi **[[row]]** là một món. Ly trà đào là một row, ly trà vải là một row khác.',
        'Mỗi **[[column]]** là một loại thông tin. Table `products` có column tên món, column giá và column ngày ra mắt.',
        'Row và column gặp nhau ở một ô. Ô này giữ một giá trị, ví dụ giá của ly trà đào.',
        'Mỗi column có một **[[data-type]]**. Có ba data type cơ bản: số, chữ và ngày.',
        'Column giá nhận số. Column tên nhận chữ. Column ngày ra mắt nhận ngày.',
        'Một column chỉ nhận một data type. Nếu bạn ghi chữ vào column số, database từ chối.',
      ],
    },
    {
      type: 'quiz',
      title: 'Bài tập',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi phần của table với ví dụ ở sổ điểm.',
          pairs: [
            { left: 'row', right: 'Điểm của một học sinh' },
            { left: 'column', right: 'Điểm toán của cả lớp' },
            { left: 'ô', right: 'Điểm toán của Lan' },
          ],
          done: 'Đúng hết rồi. Row đi ngang, column đi dọc, ô nằm chỗ hai đường gặp nhau.',
        },
        {
          kind: 'choice',
          question: 'Giá ly trà lưu dưới dạng chữ "45.000đ". Chuyện gì xảy ra khi cộng giá hai ly?',
          options: [
            { text: 'Database không cộng được vì đó là chữ', correct: true, feedback: 'Đúng. Muốn cộng, giá phải nằm trong column kiểu số.' },
            { text: 'Database tự đoán và cộng đúng', feedback: 'Database không đoán. Chữ là chữ, nên giá phải ghi dưới dạng số để cộng được.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Column ngày ra mắt nhận một data type. Bạn ghi "mai" vào đó. Database làm gì?',
          options: [
            { text: 'Từ chối vì "mai" không phải ngày', correct: true, feedback: 'Đúng. Column ngày chỉ nhận ngày hợp lệ.' },
            { text: 'Nhận vào, vì chữ nào cũng được', feedback: 'Column đã chọn data type ngày thì chỉ nhận ngày. "mai" bị từ chối.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'App ngân hàng và column số tiền',
      paragraphs: [
        'App ngân hàng ghi mỗi lần chuyển tiền thành một row.',
        'Column số tiền chỉ nhận số. Ai gõ chữ vào đó thì app báo lỗi.',
        'Nhờ vậy, tổng tiền trong ngày luôn cộng được.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Table giữ một loại dữ liệu.',
        'Mỗi row là một món, một người hay một đơn.',
        'Mỗi column là một loại thông tin, và nhận đúng một data type.',
        'Ba data type cơ bản: số, chữ và ngày.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Harvard CS50 SQL, Lecture 2', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
