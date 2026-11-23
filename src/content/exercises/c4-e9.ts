import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  chapter: 4,
  id: 'c4-e9',
  kind: 'quiz',
  title: 'Query dễ đọc và comment',
  prompt: 'Mình có ba câu hỏi nhanh về cách trình bày query và viết comment. Chọn đáp án bạn thấy đúng nhất.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Bạn xuống dòng và thụt đầu dòng cho một query dài. Database làm gì?',
      options: [
        { text: 'Chạy như cũ, vì database bỏ qua cách trình bày.', correct: true, feedback: 'Đúng. Xuống dòng và dấu cách chỉ giúp người đọc, kết quả không đổi.' },
        { text: 'Báo lỗi vì query không nằm trên một dòng.', feedback: 'Chưa đúng. Database đọc query như một chuỗi liền, xuống dòng ở đâu cũng được.' },
        { text: 'Chạy chậm hơn.', feedback: 'Chưa đúng. Cách trình bày không ảnh hưởng tốc độ chạy.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Cách nào viết comment ngắn chạy được ở cả MySQL và Oracle?',
      options: [
        { text: '`-- Món Trà sữa dưới 40.000 đồng`', correct: true, feedback: 'Đúng. Hai dấu gạch kèm một dấu cách là comment tới cuối dòng, và chạy ở cả hai dialect.' },
        { text: '`// Món Trà sữa dưới 40.000 đồng`', feedback: 'Chưa đúng. Hai dấu gạch chéo không phải comment trong SQL.' },
        { text: '`# Món Trà sữa dưới 40.000 đồng`', feedback: 'Gần đúng. MySQL nhận dấu `#`, nhưng Oracle báo lỗi. Dùng `--` để chạy được ở cả hai.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn muốn tắt tạm điều kiện `AND price < 40000` mà chưa muốn xóa. Làm gì?',
      options: [
        { text: 'Thêm `--` và một dấu cách trước điều kiện đó.', correct: true, feedback: 'Đúng. Database bỏ qua phần comment, và bạn xóa `--` khi muốn bật lại.' },
        { text: 'Thêm NOT trước điều kiện đó.', feedback: 'Chưa đúng. NOT đảo điều kiện, nó không tắt điều kiện.' },
        { text: 'Đổi AND thành OR.', feedback: 'Chưa đúng. OR làm kết quả nhiều lên, và điều kiện vẫn còn đó.' },
      ],
    },
  ],
  why: 'Bạn làm tốt lắm. Query dễ đọc giúp đồng nghiệp hiểu nhanh, và comment ghi lại lý do bạn viết như vậy.',
};
