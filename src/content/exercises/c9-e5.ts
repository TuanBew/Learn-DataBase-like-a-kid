import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c9-e5',
  chapter: 9,
  kind: 'quiz',
  title: 'Ba câu hỏi nhanh về VIEW',
  prompt: 'Ba câu hỏi nhanh về VIEW. Bạn nghĩ xem VIEW lưu gì, khi nào nó thấy dữ liệu mới, và xóa nó thì mất gì.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Bạn chạy `CREATE VIEW active_staff AS SELECT ... FROM employees WHERE ...`. VIEW này lưu gì?',
      options: [
        { text: 'Câu SELECT, và chạy lại câu đó mỗi lần bạn đọc VIEW', correct: true, feedback: 'Đúng. VIEW giống một câu SELECT được đặt tên. Nó không giữ bản sao của các row.' },
        { text: 'Một bản sao các row tại lúc tạo', feedback: 'Chưa đúng. VIEW không chép row. Nếu chép thì dữ liệu sẽ cũ dần, và VIEW không bị vậy.' },
        { text: 'Một table mới có thể INSERT trực tiếp', feedback: 'Chưa đúng. VIEW không phải table mới. Nó chỉ là tên đặt cho một câu SELECT.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Sau khi tạo VIEW, đồng nghiệp thêm một nhân viên mới vào `employees`. Nhân viên này đủ điều kiện của VIEW. Bạn chạy `SELECT * FROM active_staff` thì sao?',
      options: [
        { text: 'Thấy nhân viên mới ngay', correct: true, feedback: 'Đúng. VIEW chạy lại câu SELECT mỗi lần đọc, nên luôn thấy dữ liệu hiện tại của `employees`.' },
        { text: 'Chưa thấy, phải tạo lại VIEW', feedback: 'Chưa đúng. VIEW không giữ row cũ, nên bạn không cần tạo lại.' },
        { text: 'Chưa thấy, phải COMMIT VIEW', feedback: 'Chưa đúng. VIEW không có COMMIT riêng. Nó đọc dữ liệu thật của table nền mỗi lần.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Bạn chạy `DROP VIEW active_staff`. Chuyện gì xảy ra với các row trong `employees`?',
      options: [
        { text: 'Không row nào mất, chỉ cái tên VIEW biến mất', correct: true, feedback: 'Đúng. Dữ liệu nằm ở `employees`. DROP VIEW chỉ bỏ câu SELECT đã đặt tên.' },
        { text: 'Các row thỏa điều kiện của VIEW bị xóa', feedback: 'Chưa đúng. DROP VIEW không chạm vào row. Muốn xóa row thì dùng DELETE.' },
        { text: 'Cả table `employees` bị xóa', feedback: 'Chưa đúng. DROP VIEW chỉ bỏ VIEW. Table nền vẫn còn nguyên.' },
      ],
    },
  ],
  why: 'VIEW lưu một câu SELECT, không lưu row. Vì vậy nó luôn thấy dữ liệu mới, và bỏ nó không làm mất dữ liệu.',
};
