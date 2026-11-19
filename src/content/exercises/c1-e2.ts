import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c1-e2',
  chapter: 1,
  kind: 'quiz',
  title: 'Excel hay database?',
  prompt: 'Ba tình huống để bạn chọn công cụ hợp lý.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question: 'Tiệm có năm quầy, và cả năm cùng ghi đơn suốt ngày. Nên cất đơn ở đâu?',
      options: [
        { text: 'Database', correct: true, feedback: 'Đúng. Database nhận nhiều người ghi cùng lúc và giữ lại mọi đơn.' },
        { text: 'Một file Excel chung', feedback: 'Năm người cùng lưu một file thì bản lưu sau có thể đè bản trước, nên đơn dễ mất.' },
        { text: 'Mỗi quầy một file Excel, cuối ngày gộp lại', feedback: 'Cách này tránh được đè file, nhưng cuối ngày phải gộp tay và dễ sót. Database làm gọn hơn.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Cô giáo giữ sổ học phí của một lớp 30 bạn, chỉ mình cô ghi. Nên dùng gì?',
      options: [
        { text: 'Excel, vì dữ liệu nhỏ và chỉ một người ghi', correct: true, feedback: 'Đúng. Dữ liệu nhỏ và ít người thì Excel gọn và đủ dùng.' },
        { text: 'Database, vì cái gì cũng nên dùng database', feedback: 'Database làm được, nhưng hơi thừa cho một lớp 30 bạn. Excel đã đủ tốt.' },
        { text: 'Chưa dùng được công cụ nào', feedback: 'Excel dùng tốt ở đây. Danh sách nhỏ, một người ghi là chỗ Excel mạnh.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi tình huống với điều xảy ra.',
      pairs: [
        { left: 'Hai thu ngân thêm đơn cùng một giây', right: 'Database giữ cả hai đơn' },
        { left: 'Ai đó gõ chữ vào ô giá', right: 'Database từ chối giá trị sai' },
        { left: 'Dữ liệu vượt 1.048.576 row', right: 'Một sheet Excel hết chỗ' },
      ],
      done: 'Đúng hết rồi. Ba khác biệt này là lý do tiệm lớn chọn database.',
    },
  ],
  why: 'Bạn chọn đúng công cụ cho từng tình huống. Dữ liệu nhỏ cứ để Excel, nhiều người ghi cùng lúc thì giao cho database.',
};
