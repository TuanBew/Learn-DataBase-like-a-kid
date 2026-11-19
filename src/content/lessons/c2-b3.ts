import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c2-b3',
  chapter: 2,
  order: 3,
  title: 'Vì sao phải tách table',
  lead: 'Một thông tin chép ở nhiều chỗ thì sớm muộn sẽ lệch nhau.',
  minutes: 12,
  goals: [
    'Nhận ra thông tin bị chép trùng trong một table to',
    'Nói được vì sao sửa một chỗ lại sai ở chỗ khác',
    'Mô tả cách tách table và nối lại bằng key',
    'Chọn đúng table cho từng loại thông tin',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hai số điện thoại của một khách',
      paragraphs: [
        'Lúc đầu mình ghi tất cả vào một cuốn sổ. Mỗi đơn ghi giờ đặt, món, tên khách và số điện thoại của khách.',
        'Chị Hường đặt mười đơn. Số điện thoại của chị nằm ở cả mười đơn.',
        'Hôm nay chị Hường đổi số. Mình sửa số ở đơn mới nhất, rồi mình nghỉ.',
        'Hôm sau có người tra đơn cũ của chị. Đơn cũ ghi số cũ. Cùng một khách, nhưng sổ có hai số điện thoại.',
        'Mình nên sửa gì để chuyện này không xảy ra nữa? Cùng thử nhé.',
      ],
    },
    {
      type: 'scene',
      scene: 'split-table',
      title: 'Một table to, hay hai table nhỏ',
      intro: 'Sửa số điện thoại của một khách ở một row. Xem các row còn lại, rồi bấm Tách table và sửa lại.',
    },
    {
      type: 'text',
      title: 'Mỗi thông tin một chỗ',
      paragraphs: [
        'Table to ở trên chép số điện thoại của khách vào từng đơn. Cùng một thông tin nằm ở nhiều row.',
        'Khi bạn sửa một row, các row còn lại vẫn giữ số cũ. Dữ liệu tự mâu thuẫn với chính nó.',
        'Chép trùng cũng dễ gây lỗi gõ. Một đơn ghi "Hường", đơn khác ghi "Huong", và database coi đó là hai khách.',
        'Cách chữa là **[[normalizing]]**. Mỗi loại thông tin vào một table riêng.',
        'Họ tên và số điện thoại của khách nằm ở table customers, mỗi khách một row. Table orders chỉ giữ customer_id.',
        'Giờ số điện thoại chỉ nằm ở một chỗ. Sửa một lần ở customers, mọi đơn đều thấy số mới.',
        'Tách table không làm mất thông tin. Từ customer_id trên đơn, bạn nối về khách bằng foreign key. Chương 6 dạy lệnh [[join]] để nối.',
      ],
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Số điện thoại của một khách nằm ở mười đơn. Khách đổi số, bạn sửa một đơn. Chuyện gì xảy ra?',
          options: [
            { text: 'Chín đơn còn lại vẫn giữ số cũ', correct: true, feedback: 'Đúng. Mỗi row giữ một bản chép riêng, nên chỉ row bạn sửa đổi theo.' },
            { text: 'Cả mười đơn tự đổi sang số mới', feedback: 'Các row không tự theo nhau. Chỉ row bạn sửa mới đổi.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi thông tin với table nên giữ nó.',
          pairs: [
            { left: 'Họ tên và số điện thoại khách', right: 'customers' },
            { left: 'Giờ đặt và trạng thái đơn', right: 'orders' },
            { left: 'Tên món và giá', right: 'products' },
          ],
          done: 'Đúng hết. Mỗi loại thông tin nằm ở một table, và chỉ ghi một lần.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Danh sách lớp',
      paragraphs: [
        'Giả sử sổ lớp ghi tên giáo viên chủ nhiệm vào row của từng học sinh. Lớp có bốn mươi em, nên tên đó nằm ở bốn mươi row.',
        'Cô giáo mới nhận lớp thì phải sửa bốn mươi chỗ. Chỉ cần sót một chỗ là sổ có hai giáo viên chủ nhiệm.',
        'Tách table lớp ra riêng thì chỉ sửa một row.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Một thông tin chép ở nhiều row sẽ lệch nhau khi sửa.',
        'Mỗi loại thông tin nên nằm ở một table riêng.',
        'Các table nối với nhau bằng key.',
        'Tách table không làm mất thông tin, vì nối lại được.',
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
