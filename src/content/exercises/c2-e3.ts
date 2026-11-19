import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c2-e3',
  chapter: 2,
  kind: 'quiz',
  title: 'Mỗi thông tin một chỗ',
  prompt: 'Ba câu hỏi về lý do tách table. Tưởng tượng sổ đơn của tiệm chép số điện thoại khách vào từng đơn.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Chị Hường có 10 đơn, và số điện thoại chị nằm ở cả 10 đơn. Chị đổi số. Sau khi tách số điện thoại ra table customers, bạn sửa mấy chỗ?',
      options: [
        { text: 'Một row ở table customers', correct: true, feedback: 'Đúng. Số điện thoại chỉ nằm một chỗ, nên sửa một lần là mọi đơn thấy số mới.' },
        { text: '10 row ở table orders', feedback: 'Đó là cách của sổ cũ. Sau khi tách, số điện thoại không còn nằm ở table orders.' },
        { text: 'Không phải sửa chỗ nào', feedback: 'Số của chị đã đổi thật, nên vẫn phải sửa. Nhưng chỉ sửa một chỗ ở table customers.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi thông tin với table nên giữ nó.',
      pairs: [
        { left: 'Số điện thoại của khách', right: 'customers' },
        { left: 'Giờ đặt và trạng thái của một đơn', right: 'orders' },
        { left: 'Giá của ly trà đào cam sả', right: 'products' },
        { left: 'Quận của tiệm Trà Mây Cầu Giấy', right: 'stores' },
      ],
      done: 'Đúng hết rồi. Mỗi loại thông tin nằm ở một table, và chỉ ghi một lần.',
    },
    {
      kind: 'choice',
      question: 'Sau khi tách table, mỗi đơn ở table orders chỉ giữ customer_id. Vì sao vẫn tìm ra tên khách?',
      options: [
        { text: 'Vì customer_id là foreign key, trỏ về đúng khách ở table customers', correct: true, feedback: 'Đúng. Từ mã trên đơn, bạn nối về khách bằng foreign key.' },
        { text: 'Vì database tự nhớ tên khách cho từng đơn', feedback: 'Database không nhớ thêm gì. Tên khách nằm ở table customers, và mã trên đơn chỉ đường tới đó.' },
        { text: 'Không tìm ra, và đó là cái giá của tách table', feedback: 'Tách table không làm mất thông tin. Foreign key nối hai table lại.' },
      ],
    },
  ],
  why: 'Bạn đã thấy vì sao mỗi thông tin chỉ nên nằm một chỗ. Sửa một lần là đúng ở mọi nơi.',
};
