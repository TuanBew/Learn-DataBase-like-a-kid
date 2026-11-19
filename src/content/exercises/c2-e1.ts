import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c2-e1',
  chapter: 2,
  kind: 'quiz',
  title: 'Tìm primary key',
  prompt: 'Ba câu hỏi về mã riêng của row, dựa trên table học sinh của lớp.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question:
        'Table học sinh được dựng bằng `CREATE TABLE students (student_no INT, full_name VARCHAR(50), class_name VARCHAR(10), PRIMARY KEY (student_no))`. Column nào là primary key?',
      options: [
        { text: 'student_no', correct: true, feedback: 'Đúng. Phần PRIMARY KEY (student_no) nói rõ column này là mã riêng của mỗi row.' },
        { text: 'full_name', feedback: 'Hai bạn có thể trùng tên, nên tên không làm mã riêng được. Hãy nhìn phần PRIMARY KEY ở cuối.' },
        { text: 'class_name', feedback: 'Cả lớp chung một tên lớp, nên nó không chỉ ra một bạn nào. Hãy nhìn phần PRIMARY KEY ở cuối.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Table students đang có hai row: số báo danh 17 tên Minh, số báo danh 18 tên Lan. Row mới nào bị từ chối?',
      options: [
        { text: 'Số báo danh 17, tên Hà', correct: true, feedback: 'Đúng. Số 17 đã thuộc về bạn Minh. Primary key không được trùng.' },
        { text: 'Số báo danh 19, tên Minh', feedback: 'Row này vẫn qua được. Trùng tên thì không sao, vì primary key nằm ở số báo danh.' },
        { text: 'Số báo danh 20, tên Lan', feedback: 'Row này vẫn qua được. Số 20 chưa ai dùng, còn trùng tên thì không sao.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn thêm một row vào table students nhưng để trống ô student_no. Database làm gì?',
      options: [
        { text: 'Từ chối row, vì primary key không được để trống', correct: true, feedback: 'Đúng. Row thiếu mã thì không còn cách tìm lại, nên database từ chối.' },
        { text: 'Ghi row vào bình thường', feedback: 'Nếu ghi vào, row này mất mã và không ai chỉ ra nó được. Vì vậy database từ chối.' },
        { text: 'Tự điền số 0 vào ô trống', feedback: 'Database không tự đoán mã cho bạn. Row thiếu mã bị từ chối.' },
      ],
    },
  ],
  why: 'Bạn đọc được primary key và biết row nào bị chặn. Mình canh hai luật này ở cổng kho: không trùng và không trống.',
};
