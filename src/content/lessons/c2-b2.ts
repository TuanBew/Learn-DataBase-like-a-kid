import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c2-b2',
  chapter: 2,
  order: 2,
  title: 'foreign key: sợi dây nối hai table',
  lead: 'Mỗi đơn trà sữa ghi mã khách, và mã đó nối đơn về đúng người đặt.',
  minutes: 12,
  goals: [
    'Nói được foreign key nối hai table thế nào',
    'Nhận ra quan hệ một với nhiều',
    'Đọc được vì sao foreign key nằm ở table orders',
    'Đoán đúng chuyện xảy ra khi xóa khách đang có đơn',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Đơn của khách nào?',
      paragraphs: [
        'Hôm qua mình ghi một đơn và viết tên khách: "Hường". Hôm nay có một chị tên Hường đến hỏi đơn của chị.',
        'Mình có hai khách tên Hường. Mình không biết đơn này thuộc về ai.',
        'Mình sửa cách ghi. Mỗi khách quen có một mã khách, giống số báo danh. Mỗi đơn ghi mã khách thay cho tên.',
        'Giờ nhìn mã trên đơn, mình tìm đúng khách trong sổ khách quen. Mã trên đơn như một sợi dây nối về sổ khách.',
        'Sợi dây này có tên riêng. Thử kéo nó xem sao.',
      ],
    },
    {
      type: 'scene',
      scene: 'fk-rope',
      title: 'Sợi dây giữa đơn và khách',
      intro: 'Chọn một khách rồi bấm Xóa. Xem sợi dây phản ứng thế nào.',
    },
    {
      type: 'text',
      title: 'Mã khách trên mỗi đơn',
      paragraphs: [
        'Table orders có column customer_id. Column này giữ primary key của table customers.',
        'Column giữ primary key của table khác gọi là **[[foreign-key]]**. Foreign key nối row của hai table.',
        'Nhờ foreign key, từ một đơn bạn tìm ra khách đặt đơn đó.',
        'Một khách có thể đặt nhiều đơn, nhưng mỗi đơn chỉ có một khách. Kiểu quan hệ này gọi là **[[one-to-many]]**.',
        'Foreign key nằm ở phía "nhiều". Table orders ở phía nhiều, nên orders giữ customer_id.',
        'Database kiểm foreign key mỗi lần ghi. Mã khách trên đơn phải có trong table customers.',
        'Nếu bạn xóa một khách đang có đơn, các đơn đó mất chủ. Database chặn lệnh xóa và báo lỗi.',
      ],
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Table order_items có column order_id, giữ mã đơn của table orders. Column order_id là gì?',
          options: [
            { text: 'Foreign key', correct: true, feedback: 'Đúng. Column này giữ primary key của table orders.' },
            { text: 'Primary key của order_items', feedback: 'Primary key của order_items là item_id. Column order_id chỉ trỏ sang table khác.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Một khách có ba đơn. Quan hệ giữa customers và orders là gì?',
          options: [
            { text: 'Một với nhiều: một khách, nhiều đơn', correct: true, feedback: 'Đúng. Khách là phía một, đơn là phía nhiều.' },
            { text: 'Một với một: một khách, một đơn', feedback: 'Một khách đặt được nhiều đơn, nên đây là quan hệ một với nhiều.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn ghi một đơn với customer_id là 99, nhưng table customers không có khách nào mã 99. Database làm gì?',
          options: [
            { text: 'Từ chối đơn và báo lỗi', correct: true, feedback: 'Đúng. Mã trên foreign key phải có trong primary key của table kia.' },
            { text: 'Ghi đơn và tự thêm khách 99', feedback: 'Database không tự đoán dữ liệu. Đơn bị từ chối.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'App mua sắm',
      paragraphs: [
        'Một app mua sắm giữ đơn hàng và khách hàng ở hai table. Mỗi đơn ghi mã của khách đặt nó.',
        'Khách mua trăm đơn thì tên khách vẫn chỉ nằm ở một chỗ. Đơn nào cũng tìm về được khách bằng mã.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Foreign key là column giữ primary key của table khác.',
        'Foreign key nối row của hai table.',
        'Một khách, nhiều đơn: foreign key nằm ở table orders.',
        'Xóa row đang có row khác trỏ tới thì database chặn lại.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
