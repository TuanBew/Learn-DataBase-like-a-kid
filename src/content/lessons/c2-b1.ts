import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c2-b1',
  chapter: 2,
  order: 1,
  title: 'primary key: mã riêng của mỗi row',
  lead: 'Hai khách có thể trùng tên, nên mỗi row cần một mã không trùng với ai.',
  minutes: 12,
  goals: [
    'Nói được vì sao row cần một mã riêng',
    'Nhận ra primary key trong một table',
    'Kể hai luật của primary key',
    'Đoán đúng chuyện xảy ra khi thêm row trùng mã',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Hai bạn tên Minh',
      paragraphs: [
        'Hôm thi cuối kỳ, lớp có hai bạn cùng tên Minh. Cô giáo đứng trước lớp, tay cầm một chồng bài.',
        'Cô gọi: "Minh ơi, lên nhận bài." Cả hai bạn cùng đứng dậy. Cô phải hỏi thêm họ và tên đệm.',
        'Lần sau cô đọc số báo danh: "Số 17, lên nhận bài." Chỉ một bạn đứng dậy.',
        'Mình là Bi, robot giữ kho. Kho của mình cũng có hai khách trùng tên. Mình cần một mã như số báo danh.',
        'Vậy database tìm đúng một row bằng cách nào? Thử xem nhé.',
      ],
    },
    {
      type: 'scene',
      scene: 'pk-bonk',
      title: 'Số báo danh bật ra',
      intro: 'Chọn một student_id cho row mới, rồi bấm Thêm row. Thử số báo danh đã có và xem row bật ra.',
    },
    {
      type: 'text',
      title: 'Mã riêng của row',
      paragraphs: [
        'Table học sinh cần một column để phân biệt các row. Column này giữ số báo danh.',
        'Số báo danh không trùng với row nào khác. Người ta gọi column này là **[[primary-key]]**.',
        'Hai bạn có thể trùng tên, nhưng không bao giờ trùng số báo danh. Nhờ vậy, một số báo danh chỉ ra đúng một bạn.',
        'Primary key có hai luật. Giá trị không được trùng. Giá trị cũng không được để trống.',
        'Nếu cho phép để trống, row đó mất mã. Database không còn cách tìm lại nó.',
        'Sách cũng vậy. Mỗi cuốn có mã ISBN riêng, và tìm theo ISBN chỉ ra đúng một cuốn.',
        'Primary key không cần mang ý nghĩa gì. Tiệm trà sữa đánh số đơn 1001, 1002, 1003, và thế là đủ.',
      ],
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Table khách quen có hai khách tên Hường. Column nào hợp làm primary key?',
          options: [
            { text: 'Họ tên', feedback: 'Hai khách tên Hường sẽ trùng nhau. Primary key không được trùng.' },
            { text: 'Số điện thoại', feedback: 'Nhiều khách chưa cho số điện thoại, nên có ô để trống. Primary key không được trống.' },
            { text: 'Mã khách, đánh số 1, 2, 3', correct: true, feedback: 'Đúng. Mã khách không trùng và ô nào cũng có giá trị.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Table học sinh đã có số báo danh 17. Bạn thêm một row mới cũng mang số 17. Database làm gì?',
          options: [
            { text: 'Từ chối row mới và báo lỗi', correct: true, feedback: 'Đúng. Primary key không được trùng, nên database giữ nguyên row cũ.' },
            { text: 'Ghi đè lên row cũ', feedback: 'Database không tự xóa row cũ. Row mới bị từ chối.' },
            { text: 'Ghi cả hai row', feedback: 'Nếu ghi cả hai, số 17 chỉ ra hai bạn. Mã đó mất tác dụng, nên database từ chối.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Vì sao primary key không được để trống?',
          options: [
            { text: 'Vì row không có mã thì không ai tìm lại được đúng row đó', correct: true, feedback: 'Đúng. Mã là cách duy nhất để chỉ ra một row.' },
            { text: 'Vì ô trống làm table chậm đi', feedback: 'Lý do không nằm ở tốc độ. Row thiếu mã thì không còn cách chỉ ra nó.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Số báo danh, số tài khoản',
      paragraphs: [
        'Trường học đánh số báo danh cho từng thí sinh. Ngân hàng đánh số tài khoản cho từng khách.',
        'Cả hai đều là một mã không trùng. Database của họ giữ mã đó làm primary key.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Mỗi row cần một mã riêng để tìm lại.',
        'Mã đó là primary key.',
        'Primary key không được trùng.',
        'Primary key không được để trống.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual: CREATE TABLE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table.html' },
      ],
    },
  ],
};
