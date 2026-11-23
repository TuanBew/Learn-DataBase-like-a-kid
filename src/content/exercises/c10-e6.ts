import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c10-e6',
  chapter: 10,
  kind: 'quiz',
  title: 'Ba câu hỏi nhanh về lock',
  prompt: 'Ba câu hỏi nhanh về lock. Bạn đọc tình huống hai người cùng sửa một row và chọn việc nên làm.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Anh An chạy UPDATE lương của nhân viên 105 nhưng chưa COMMIT. Chị Bình chạy UPDATE cùng row đó. Chuyện gì xảy ra với chị Bình?',
      options: [
        { text: 'Query của chị Bình chờ, cho tới khi anh An COMMIT hoặc ROLLBACK', correct: true, feedback: 'Đúng. Anh An đang giữ lock trên row đó. Query của chị Bình đứng chờ nên trông như bị treo.' },
        { text: 'Query của chị Bình ghi đè luôn lên thay đổi của anh An', feedback: 'Chưa đúng. Row đang bị lock, nên database bắt chị Bình chờ để không ghi đè lên nhau.' },
        { text: 'Query của chị Bình tự báo xong và bỏ qua row đó', feedback: 'Chưa đúng. Database không tự bỏ qua row. Query đứng chờ tới khi lock được nhả.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Query của bạn treo đã năm phút vì một người khác giữ lock. Việc nào nên làm trước?',
      options: [
        { text: 'Nhắn người đang giữ lock COMMIT hoặc ROLLBACK, nếu không biết là ai thì báo DBA', correct: true, feedback: 'Đúng. Chỉ người giữ lock hoặc DBA nhả được lock một cách an toàn.' },
        { text: 'Chạy lại query liên tục cho tới khi qua', feedback: 'Chưa nên. Mỗi lần chạy lại thêm một query chờ cùng row, mà lock vẫn còn đó.' },
        { text: 'Tự tay xóa row đang bị khóa', feedback: 'Chưa nên. DELETE cũng phải chờ lock, và xóa row của người khác có thể làm mất dữ liệu.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn vừa UPDATE xong và SELECT kiểm lại thấy đúng. Làm gì tiếp để không làm người khác bị treo?',
      options: [
        { text: 'COMMIT ngay', correct: true, feedback: 'Đúng. COMMIT lưu thay đổi và nhả lock. Quên COMMIT là lý do thường gặp nhất khiến người khác bị treo.' },
        { text: 'Để nguyên, COMMIT sau khi ăn trưa', feedback: 'Chưa nên. Trong lúc bạn chưa COMMIT, lock vẫn được giữ và đồng nghiệp sửa cùng row sẽ phải chờ.' },
        { text: 'Đóng tool là xong', feedback: 'Chưa chắc. Tool có thể còn giữ transaction mở. Hãy COMMIT hoặc ROLLBACK rõ ràng trước khi rời đi.' },
      ],
    },
  ],
  why: 'Lock giữ tới khi COMMIT hoặc ROLLBACK. Vì vậy hãy COMMIT sớm, và khi bị treo thì nhắn người giữ lock hoặc báo DBA.',
};
