import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c3-e8',
  chapter: 3,
  title: 'DROP, TRUNCATE, DELETE: chọn đúng lệnh',
  kind: 'quiz',
  prompt: 'Chọn đúng lệnh xóa cho từng tình huống ở Sao Mai. Chọn nhầm lệnh là mất dữ liệu, nên bạn thử ở đây trước.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Chị Hạnh nhập nhầm đơn nghỉ phép số 7 và muốn xóa đúng đơn đó. Các đơn khác giữ nguyên. Lệnh nào hợp?',
      options: [
        { text: 'DELETE FROM leave_requests WHERE request_id = 7', correct: true, feedback: 'Đúng. DELETE có WHERE để chọn row cần xóa.' },
        { text: 'TRUNCATE TABLE leave_requests', feedback: 'TRUNCATE xóa mọi row và không có WHERE. Các đơn đúng cũng mất.' },
        { text: 'DROP TABLE leave_requests', feedback: 'DROP xóa cả table. Bạn chỉ cần xóa một row.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn chạy TRUNCATE TABLE assignments để nạp lại danh sách mới. Chuyện gì xảy ra với table?',
      options: [
        { text: 'Table còn nguyên cấu trúc và có 0 row', correct: true, feedback: 'Đúng. TRUNCATE xóa mọi row và giữ column, constraint. ROLLBACK không hoàn lại.' },
        { text: 'Table biến mất khỏi database', feedback: 'Chỉ DROP làm table biến mất. TRUNCATE giữ lại cấu trúc.' },
        { text: 'Chỉ những row cũ nhất bị xóa', feedback: 'TRUNCATE không chọn row. Lệnh xóa mọi row.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn chạy DROP TABLE projects. Database xóa những gì?',
      options: [
        { text: 'Row, column và constraint: cả table projects', correct: true, feedback: 'Đúng. DROP xóa cả table. Muốn có lại, bạn phải CREATE TABLE từ đầu.' },
        { text: 'Chỉ row, còn column và constraint giữ nguyên', feedback: 'Đó là TRUNCATE. DROP xóa cả cấu trúc.' },
        { text: 'Chỉ các row chọn bằng WHERE', feedback: 'DROP không có WHERE. Lệnh xóa cả table.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn dọn leave_requests, employees và departments. leave_requests trỏ tới employees, employees trỏ tới departments. Thứ tự DROP nào chạy được?',
      options: [
        { text: 'leave_requests, rồi employees, rồi departments', correct: true, feedback: 'Đúng. Xóa table con trước, table cha sau.' },
        { text: 'departments, rồi employees, rồi leave_requests', feedback: 'Lệnh đầu bị chặn vì employees còn trỏ tới departments.' },
        { text: 'employees, rồi leave_requests, rồi departments', feedback: 'Lệnh đầu bị chặn vì leave_requests còn trỏ tới employees.' },
      ],
    },
  ],
  why: 'Bạn nhớ: DELETE chọn row, TRUNCATE xóa mọi row và giữ table, DROP xóa cả table. Khi có foreign key, dọn table con trước, table cha sau.',
};
