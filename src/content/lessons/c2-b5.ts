import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c2-b5',
  chapter: 2,
  order: 5,
  title: 'constraint: luật giữ dữ liệu đúng',
  lead: 'Database từ chối mọi row phạm luật, trước khi dữ liệu sai kịp vào sổ.',
  minutes: 14,
  goals: [
    'Kể tên các constraint hay gặp',
    'Nói được mỗi constraint bắt buộc điều gì',
    'Biết primary key và foreign key cũng là constraint',
    'Đoán constraint nào chặn một row sai',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Cổng kho có người gác',
      paragraphs: [
        'Tiệm có vài luật cho cuốn sổ. Giá mỗi ly phải lớn hơn 0. Đơn nào cũng phải có giờ đặt. Hai món không được trùng tên.',
        'Có hôm một bạn mới gõ nhầm giá âm hai mươi nghìn. Sổ ghi luôn, và cuối ngày tiền thu bị lệch.',
        'Mình đứng ở cổng kho từ hôm đó. Row nào muốn vào sổ phải qua mình. Row phạm luật thì mình trả lại.',
        'Database có một người gác như vậy. Thử đưa vài row qua cổng.',
      ],
    },
    {
      type: 'scene',
      scene: 'constraint-gate',
      title: 'Cổng kiểm luật',
      intro: 'Chọn một thẻ row, rồi bấm Đưa qua cổng. Đọc biển luật chặn row và mã lỗi.',
    },
    {
      type: 'text',
      title: 'Các biển luật',
      paragraphs: [
        '**[[constraint]]** là luật của một column hoặc một table. Database kiểm luật mỗi lần ghi row.',
        'Row phạm luật bị từ chối và nhận một mã lỗi. Dữ liệu đang có trong table không đổi.',
        '**[[not-null]]** bắt ô phải có giá trị. Column ordered_at của orders dùng luật này, vì đơn nào cũng cần giờ đặt.',
        '**[[unique]]** cấm hai row có cùng giá trị ở một column. Hai món trong products không được trùng tên.',
        '**[[check]]** kiểm một điều kiện. `CHECK (price > 0)` bắt giá món phải lớn hơn 0.',
        'Primary key gộp hai luật: NOT NULL và UNIQUE. Vì vậy column này không cần khai thêm hai luật kia.',
        'Foreign key cũng là constraint. Mã khách trên đơn phải có trong table customers.',
      ],
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi constraint với điều nó bắt buộc.',
          pairs: [
            { left: 'NOT NULL', right: 'Ô phải có giá trị' },
            { left: 'UNIQUE', right: 'Không được trùng với row khác' },
            { left: 'CHECK', right: 'Phải thỏa một điều kiện' },
            { left: 'FOREIGN KEY', right: 'Phải có sẵn ở table kia' },
          ],
          done: 'Đúng hết. Mỗi constraint canh một luật riêng.',
        },
        {
          kind: 'choice',
          question: 'Giá mỗi món phải lớn hơn 0. Nên dùng constraint nào?',
          options: [
            { text: 'CHECK', correct: true, feedback: 'Đúng. CHECK kiểm điều kiện, ví dụ giá lớn hơn 0.' },
            { text: 'UNIQUE', feedback: 'UNIQUE chỉ cấm trùng, không kiểm giá lớn hơn 0.' },
            { text: 'NOT NULL', feedback: 'NOT NULL chỉ bắt ô có giá trị. Giá âm vẫn là một giá trị.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn thêm món mới tên "Trà đào", và table đã có một món tên "Trà đào". Constraint nào chặn row này?',
          options: [
            { text: 'UNIQUE trên column tên món', correct: true, feedback: 'Đúng. UNIQUE cấm hai row có cùng tên.' },
            { text: 'CHECK trên column giá', feedback: 'Row này có thể có giá hợp lệ. Lỗi nằm ở tên bị trùng.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Luật nằm trong database',
      paragraphs: [
        'Nhiều app chặn số lượng âm ngay trong database, không chỉ ở màn hình nhập.',
        'Nhờ vậy, code của app có sai thì dữ liệu sai vẫn không vào được sổ.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Constraint là luật database kiểm mỗi lần ghi row.',
        'NOT NULL bắt ô có giá trị, UNIQUE cấm trùng, CHECK kiểm điều kiện.',
        'Primary key và foreign key cũng là constraint.',
        'Row phạm luật bị từ chối kèm mã lỗi.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual: CREATE TABLE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table.html' },
      ],
    },
  ],
};
