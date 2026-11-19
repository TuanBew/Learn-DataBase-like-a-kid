import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c1-b4',
  chapter: 1,
  order: 4,
  title: 'DBMS và SQL',
  lead: 'Ai giữ database, và bạn nói gì để nhờ người đó lấy dữ liệu?',
  minutes: 12,
  goals: [
    'Biết DBMS là phần mềm giữ database',
    'Kể tên ba DBMS phổ biến',
    'Hiểu SQL là ngôn ngữ nói với DBMS',
    'Biết mỗi DBMS nói SQL hơi khác, gọi là dialect',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Phiếu yêu cầu và người giữ kho',
      paragraphs: [
        'Tiệm có một nhà kho lớn, hàng xếp kín các kệ. Bạn không tự vào kho lấy hàng.',
        'Bạn đưa cho mình một phiếu yêu cầu, ví dụ "lấy các ly trên 40.000". Mình chạy vào kho, tìm đúng kệ, rồi mang hàng ra.',
        'Hàng nào cần cất thì bạn đưa phiếu, mình xếp lên kệ. Bạn không cần biết kệ nào còn chỗ.',
        'Mình là Bi, người giữ kho. Ngoài đời, người giữ kho của database là một phần mềm.',
      ],
    },
    {
      type: 'scene',
      scene: 'warehouse',
      title: 'Nhà kho của Bi',
      intro: 'Chọn một phiếu yêu cầu. Xem mình vào kệ lấy đúng các row mang ra.',
    },
    {
      type: 'text',
      title: 'Người giữ kho và ngôn ngữ của phiếu',
      paragraphs: [
        '**[[dbms]]** là phần mềm giữ database. Nó nhận lệnh của bạn, ghi dữ liệu và trả dữ liệu về.',
        'Có nhiều DBMS. **[[mysql]]**, **[[oracle]]** và **[[postgresql]]** là ba cái phổ biến. Mỗi cái là một người giữ kho khác nhau.',
        'Bạn nói với DBMS bằng **[[sql]]**. SQL là ngôn ngữ để hỏi, thêm, sửa và xóa dữ liệu.',
        'Câu lệnh bạn gửi đi gọi là query. Một query giống một phiếu yêu cầu.',
        'Mỗi DBMS nói SQL hơi khác nhau. Cách nói riêng của mỗi DBMS gọi là **[[dialect]]**.',
        'SQL là chuẩn chung, nhưng mỗi DBMS chỉ hiểu một phần chuẩn đó. Đổi sang DBMS khác thì có khi phải sửa cú pháp.',
        'Khóa này học MySQL trước, vì MySQL miễn phí và dễ bắt đầu. Sau đó học Oracle, vì công ty của bạn dùng Oracle.',
      ],
    },
    {
      type: 'quiz',
      title: 'Bài tập',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi từ với vai của nó ở nhà kho.',
          pairs: [
            { left: 'database', right: 'Cả nhà kho và hàng trong đó' },
            { left: 'DBMS', right: 'Người giữ kho' },
            { left: 'SQL', right: 'Ngôn ngữ trên phiếu yêu cầu' },
          ],
          done: 'Đúng hết rồi. Bạn viết phiếu bằng SQL, DBMS đọc phiếu và lấy dữ liệu trong database.',
        },
        {
          kind: 'choice',
          question: 'MySQL và Oracle đều hiểu SQL, nhưng mỗi bên viết một số lệnh hơi khác. Cách viết riêng đó gọi là gì?',
          options: [
            { text: 'dialect', correct: true, feedback: 'Đúng. Mỗi DBMS có dialect riêng, giống mỗi vùng có giọng riêng.' },
            { text: 'database', feedback: 'Database là nơi cất dữ liệu. Cách viết SQL riêng của mỗi DBMS gọi là dialect.' },
            { text: 'row', feedback: 'Row là một lần ghi trong table. Cách viết SQL riêng của mỗi DBMS gọi là dialect.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Instagram chọn PostgreSQL',
      paragraphs: [
        'Instagram dùng PostgreSQL làm database chính.',
        'Khi app lớn dần, họ chia dữ liệu ra nhiều máy.',
        'PostgreSQL là một DBMS khác với MySQL và Oracle, nhưng cũng nói SQL.',
      ],
      source: { name: 'Instagram Engineering', url: 'https://instagram-engineering.com/1cf5a71e5a5c' },
    },
    {
      type: 'keypoints',
      items: [
        'DBMS là phần mềm giữ database và làm theo lệnh của bạn.',
        'MySQL, Oracle và PostgreSQL là các DBMS khác nhau.',
        'SQL là ngôn ngữ nói với DBMS.',
        'Mỗi DBMS nói SQL hơi khác, gọi là dialect. Khóa này học MySQL trước, Oracle sau.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Instagram Engineering', url: 'https://instagram-engineering.com/1cf5a71e5a5c' },
      ],
    },
  ],
};
