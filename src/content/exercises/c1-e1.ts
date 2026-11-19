import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c1-e1',
  chapter: 1,
  kind: 'quiz',
  title: 'Dữ liệu quanh bạn',
  prompt: 'Ba câu hỏi nhanh về nơi cất dữ liệu, row và table. Chọn đáp án bạn thấy hợp nhất.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Bạn chuyển tiền qua app ngân hàng. Ngân hàng ghi lại lần chuyển đó. Mỗi lần ghi là một gì?',
      options: [
        { text: 'Một row', correct: true, feedback: 'Đúng. Mỗi lần ghi là một row, gồm đủ các ô như người gửi, người nhận và số tiền.' },
        { text: 'Một table', feedback: 'Table là chỗ chung chứa nhiều lần ghi cùng loại. Mỗi lần chuyển tiền chỉ là một row trong đó.' },
        { text: 'Một database', feedback: 'Database lớn hơn nhiều, vì nó cất cả các table. Một lần chuyển tiền chỉ là một row.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi thứ ở tiệm trà sữa với tên gọi của nó.',
      pairs: [
        { left: 'Một đơn trà sữa', right: 'row' },
        { left: 'Tất cả đơn của tiệm, xếp chung một chỗ', right: 'table' },
        { left: 'Nơi cất mọi sổ của tiệm: đơn, món, khách', right: 'database' },
      ],
      done: 'Đúng hết rồi. Row nhỏ nhất, table chứa các row, database chứa các table.',
    },
    {
      kind: 'choice',
      question: 'Sáng bạn đặt trà sữa trong app. Tối bạn mở lại và đơn vẫn còn. Vì sao đơn không mất?',
      options: [
        { text: 'App đã ghi đơn vào database ngay lúc bạn bấm đặt', correct: true, feedback: 'Đúng. Đơn nằm ở database nên app tắt cả đêm vẫn không mất.' },
        { text: 'Điện thoại của bạn tự nhớ đơn', feedback: 'Đổi sang điện thoại khác, bạn vẫn thấy đơn. Vậy đơn phải nằm ở nơi khác, đó là database.' },
        { text: 'Đơn nằm trên màn hình điện thoại', feedback: 'Màn hình chỉ là chỗ bạn nhìn thấy đơn. Đơn thật nằm trong database.' },
      ],
    },
  ],
  why: 'Bạn nhận ra row, table và database rồi. Mình ghi mỗi đơn thành một row và cất vào đúng table.',
};
