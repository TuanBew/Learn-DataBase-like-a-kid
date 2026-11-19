import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c1-e4',
  chapter: 1,
  kind: 'quiz',
  title: 'Mỗi column một data type',
  prompt: 'Bốn câu hỏi về data type của các column trong table products.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Column price giữ giá của từng món, ví dụ 35000. Column này nên nhận data type nào?',
      options: [
        { text: 'Số', correct: true, feedback: 'Đúng. Giá cần cộng, so sánh và sắp xếp, nên lưu dưới dạng số.' },
        { text: 'Chữ', feedback: 'Chữ thì không cộng được. Giá nên lưu dưới dạng số.' },
        { text: 'Ngày', feedback: 'Ngày dành cho thứ như ngày ra mắt. Giá là một con số tiền.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi giá trị với data type của column giữ nó.',
      pairs: [
        { left: 'Trà sữa trân châu', right: 'Chữ' },
        { left: '35000', right: 'Số' },
        { left: '2026-01-02', right: 'Ngày' },
      ],
      done: 'Đúng hết rồi. Tên là chữ, giá là số, ngày ra mắt là ngày.',
    },
    {
      kind: 'choice',
      question: 'Một bạn mới gõ "ba mươi nghìn" vào column price. Database làm gì?',
      options: [
        { text: 'Từ chối vì column price chỉ nhận số', correct: true, feedback: 'Đúng. Column đã có data type số thì chỉ nhận số.' },
        { text: 'Tự đổi thành 30000', feedback: 'Database không đoán ý bạn. Chữ "ba mươi nghìn" không phải số nên bị từ chối.' },
        { text: 'Nhận vào và giữ nguyên chữ', feedback: 'Column price chỉ nhận số. Giá trị là chữ nên bị từ chối.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Cuối ngày chủ tiệm muốn cộng giá của hai ly. Giá nên nằm ở dạng nào?',
      options: [
        { text: 'Số 35000', correct: true, feedback: 'Đúng. Số thì cộng được.' },
        { text: 'Chữ "35.000đ"', feedback: 'Database coi đây là chữ, nên không cộng được. Hãy lưu giá dưới dạng số.' },
        { text: 'Ngày 35/000', feedback: 'Đây không phải ngày hợp lệ. Giá là số, nên lưu dưới dạng số.' },
      ],
    },
  ],
  why: 'Bạn chọn đúng data type cho từng column rồi. Nhờ data type, database từ chối giá trị sai ngay từ cửa.',
};
