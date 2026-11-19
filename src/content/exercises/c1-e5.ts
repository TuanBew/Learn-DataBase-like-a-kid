import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c1-e5',
  chapter: 1,
  kind: 'quiz',
  title: 'DBMS, SQL và dialect',
  prompt: 'Ba câu hỏi để phân biệt người giữ kho, tờ phiếu và cách viết phiếu.',
  asks: [],
  items: [
    {
      kind: 'match',
      question: 'Nối mỗi mô tả với tên của nó.',
      pairs: [
        { left: 'Phiếu "lấy các ly trên 40.000" viết bằng ngôn ngữ này', right: 'SQL' },
        { left: 'Phần mềm đọc phiếu và mang dữ liệu ra', right: 'DBMS' },
        { left: 'Nơi chứa các table', right: 'database' },
      ],
      done: 'Đúng hết rồi. Bạn viết phiếu bằng SQL, DBMS đọc phiếu và lấy dữ liệu trong database.',
    },
    {
      kind: 'choice',
      question: 'Tên nào là một DBMS?',
      options: [
        { text: 'PostgreSQL', correct: true, feedback: 'Đúng. PostgreSQL là một DBMS, giống MySQL và Oracle.' },
        { text: 'SQL', feedback: 'SQL là ngôn ngữ để nói với DBMS, không phải chính DBMS.' },
        { text: 'products', feedback: 'products là tên một table trong database của tiệm.' },
        { text: 'row', feedback: 'Row là một lần ghi trong table, không phải một phần mềm.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Công ty bạn dùng Oracle. Bạn quen MySQL và thấy vài lệnh phải viết lại. Vì sao?',
      options: [
        { text: 'Mỗi DBMS có dialect riêng, nên vài chỗ viết khác nhau', correct: true, feedback: 'Đúng. Phần lớn SQL giống nhau, và chỉ vài chỗ khác theo dialect.' },
        { text: 'Oracle dùng một ngôn ngữ khác hẳn SQL', feedback: 'Oracle vẫn nói SQL. Chỉ vài chỗ viết khác, và cách viết riêng đó gọi là dialect.' },
        { text: 'Bạn đã viết sai ngay từ đầu', feedback: 'Câu lệnh của bạn không sai. Oracle chỉ có cách viết riêng ở vài chỗ.' },
      ],
    },
  ],
  why: 'Bạn phân biệt được người giữ kho, tờ phiếu và cách nói của từng người giữ kho. Mình nhận phiếu SQL của bạn bất cứ lúc nào.',
};
