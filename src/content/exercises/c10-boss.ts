import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c10-boss',
  chapter: 10,
  kind: 'quiz',
  title: 'Boss: sáu bước sửa dữ liệu an toàn',
  prompt:
    'Chị trưởng phòng nhờ bạn chuyển 12 nhân viên sang phòng mới. Bạn đi theo sáu bước: đọc yêu cầu, SELECT đếm row, sao lưu, sửa trong transaction, SELECT kiểm lại, rồi COMMIT hoặc ROLLBACK. Bốn câu hỏi dưới đây xoay quanh từng bước.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Bạn đọc xong yêu cầu của chị. Bước tiếp theo là gì?',
      options: [
        { text: 'Chạy SELECT với điều kiện của yêu cầu để đếm row', correct: true, feedback: 'Đúng. Đếm trước cho biết điều kiện của bạn chọn bao nhiêu row, và bạn so với con số 12 chị nói.' },
        { text: 'Chạy UPDATE luôn cho nhanh', feedback: 'Chưa nên. Chưa đếm thì bạn chưa biết UPDATE sẽ đụng vào bao nhiêu row.' },
        { text: 'Sao lưu cả database của công ty', feedback: 'Chưa cần lớn như vậy. Bạn sao lưu đúng các row sẽ sửa, và chỉ sau khi đã đếm.' },
      ],
    },
    {
      kind: 'choice',
      question: 'SELECT đếm ra 15 row, trong khi chị nói 12 người. Bạn làm gì?',
      options: [
        { text: 'Dừng lại, xem lại điều kiện WHERE hoặc hỏi chị', correct: true, feedback: 'Đúng. Số row lệch nghĩa là điều kiện chưa khớp ý chị. Sửa điều kiện trước khi đụng vào dữ liệu.' },
        { text: 'Chạy UPDATE, rồi sửa 3 người dư sau', feedback: 'Chưa nên. Sửa nhầm 3 người rồi mới sửa lại dễ làm rối dữ liệu.' },
        { text: 'Bỏ qua, chênh 3 người không quan trọng', feedback: 'Chưa nên. Ba người đó có thể đang ở phòng khác và bị chuyển nhầm.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn nên sao lưu vào lúc nào?',
      options: [
        { text: 'Sau khi đếm đúng và trước khi UPDATE', correct: true, feedback: 'Đúng. Bản sao lưu chứa dữ liệu còn nguyên, nên bạn phải chép trước khi sửa.' },
        { text: 'Sau khi COMMIT', feedback: 'Chưa nên. COMMIT rồi thì dữ liệu cũ đã mất, nên chép lúc đó không còn ý nghĩa.' },
        { text: 'Không cần, vì đã có transaction', feedback: 'Chưa đủ. ROLLBACK chỉ giúp trước khi COMMIT. Bản sao lưu giúp cả khi bạn phát hiện lỗi muộn hơn.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn chạy UPDATE trong transaction, và database báo 15 row đã đổi. Yêu cầu là 12. Làm gì?',
      options: [
        { text: 'ROLLBACK, rồi xem lại điều kiện', correct: true, feedback: 'Đúng. Chưa COMMIT nên ROLLBACK đưa mọi thứ về như cũ. Không nên COMMIT khi số row chưa khớp.' },
        { text: 'COMMIT trước, rồi tính tiếp', feedback: 'Chưa nên. COMMIT lưu luôn 3 thay đổi nhầm, và lấy lại sẽ khó hơn nhiều.' },
        { text: 'Chạy thêm UPDATE để đổi 3 người về chỗ cũ', feedback: 'Chưa nên. Việc này dễ sai thêm. ROLLBACK gọn hơn, miễn là bạn chưa COMMIT.' },
      ],
    },
  ],
  why: 'Sáu bước giúp bạn dừng được ở mỗi chỗ lệch. Đếm trước, sao lưu, sửa trong transaction, kiểm lại, rồi mới COMMIT.',
};
