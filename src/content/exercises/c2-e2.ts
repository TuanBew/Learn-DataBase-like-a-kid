import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c2-e2',
  chapter: 2,
  kind: 'quiz',
  title: 'Foreign key nối đơn với khách',
  prompt: 'Ba câu hỏi về sợi dây giữa table orders và table customers. Table customers có khách mã từ 1 đến 12.',
  asks: [],
  items: [
    {
      kind: 'match',
      question: 'Nối mỗi mô tả với tên của nó.',
      pairs: [
        { left: 'Column customer_id của table orders', right: 'foreign key' },
        { left: 'Column customer_id của table customers', right: 'primary key' },
        { left: 'Một khách đặt nhiều đơn', right: 'quan hệ một với nhiều' },
      ],
      done: 'Đúng hết rồi. Primary key ở table customers, foreign key ở table orders, và hai bên nối nhau.',
    },
    {
      kind: 'choice',
      question: 'Bạn ghi ba đơn mới, mỗi đơn một customer_id khác nhau. Đơn nào bị database từ chối?',
      options: [
        { text: 'Đơn có customer_id là 15', correct: true, feedback: 'Đúng. Table customers chỉ có khách mã 1 đến 12, nên mã 15 không trỏ tới ai.' },
        { text: 'Đơn có customer_id là 7', feedback: 'Mã 7 có trong table customers, nên đơn này qua được.' },
        { text: 'Đơn có customer_id là 12', feedback: 'Mã 12 là khách cuối cùng của table customers, nên đơn này vẫn qua được.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Khách mã 1 đã có đơn 1001 và 1006. Bạn thử xóa khách mã 1 khỏi table customers. Database làm gì?',
      options: [
        { text: 'Chặn lệnh xóa và báo lỗi', correct: true, feedback: 'Đúng. Hai đơn đang trỏ tới khách này. Xóa khách thì các đơn mất chủ.' },
        { text: 'Xóa khách và để hai đơn lại', feedback: 'Hai đơn sẽ trỏ tới một khách không còn. Vì vậy database chặn lệnh xóa.' },
        { text: 'Xóa khách và xóa luôn hai đơn', feedback: 'Database không tự xóa thêm gì. Nó chặn lệnh xóa để bạn xử lý hai đơn trước.' },
      ],
    },
  ],
  why: 'Bạn thấy sợi dây giữa hai table rồi. Mã khách trên đơn phải có thật, và khách đang có đơn thì chưa xóa được.',
};
