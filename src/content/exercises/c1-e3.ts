import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c1-e3',
  chapter: 1,
  kind: 'quiz',
  title: 'Chỉ ra table, row, column',
  prompt: 'Nhìn table products của tiệm. Table này có 14 món và 6 column: mã món, tên, nhóm, giá, calo, ngày ra mắt.',
  asks: [],
  items: [
    {
      kind: 'match',
      question: 'Nối mỗi mô tả với phần của table products.',
      pairs: [
        { left: 'Trà đào cam sả, nhóm Trà trái cây, giá 45.000', right: 'row' },
        { left: 'Giá của cả 14 món', right: 'column' },
        { left: 'Giá 45.000 của trà đào cam sả', right: 'một ô' },
      ],
      done: 'Đúng hết rồi. Row đi ngang, column đi dọc, ô nằm chỗ hai đường gặp nhau.',
    },
    {
      kind: 'choice',
      question: 'Table products có 14 món. Bạn đếm được bao nhiêu row?',
      options: [
        { text: '14 row', correct: true, feedback: 'Đúng. Mỗi món là một row, nên 14 món là 14 row.' },
        { text: '6 row', feedback: 'Số 6 là số column của table. Mỗi món là một row, nên có 14 row.' },
        { text: '1 row', feedback: 'Cả table có nhiều row. Mỗi món chiếm đúng một row.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Tiệm muốn ghi thêm thông tin "có đường hay không" cho mọi món. Nên thêm gì vào table products?',
      options: [
        { text: 'Một column mới', correct: true, feedback: 'Đúng. Thêm một loại thông tin cho mọi món thì thêm một column.' },
        { text: 'Một row mới', feedback: 'Row mới là thêm một món. Bạn đang cần thêm một loại thông tin, tức là một column.' },
        { text: 'Một table mới', feedback: 'Thông tin này vẫn nói về món, nên cứ để ở table products và thêm một column.' },
      ],
    },
  ],
  why: 'Bạn chỉ đúng từng phần của một table rồi. Mình đọc table nào cũng bắt đầu bằng cách nhìn row và column.',
};
