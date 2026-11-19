import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c2-e6',
  chapter: 2,
  kind: 'quiz',
  title: 'Canh cổng cho tiệm trà sữa',
  prompt: 'Bốn tình huống ở tiệm trà sữa. Mỗi lần có một row sắp vào sổ, và bạn đoán cổng làm gì.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question:
        'Table `products` có các luật: mã món là primary key, tên món UNIQUE, giá phải lớn hơn 0. Đang có món tên "Trà đào" với giá 40000. Bạn thêm một row mới cũng tên "Trà đào", giá 45000, mã món chưa ai dùng. Constraint nào chặn row này?',
      options: [
        { text: 'UNIQUE trên tên món', correct: true, feedback: 'Đúng. Tên "Trà đào" đã có, và UNIQUE cấm hai row cùng tên.' },
        { text: 'CHECK trên giá', feedback: 'Giá 45000 lớn hơn 0 nên CHECK cho qua. Hãy nhìn lại tên món.' },
        { text: 'PRIMARY KEY trên mã món', feedback: 'Mã món của row này chưa ai dùng, nên primary key cho qua. Hãy nhìn lại tên món.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi row sắp thêm vào `products` với constraint chặn nó.',
      pairs: [
        { left: 'Món có giá -20000', right: 'CHECK' },
        { left: 'Món có mã trùng với món khác', right: 'PRIMARY KEY' },
        { left: 'Món có tên trùng với món khác', right: 'UNIQUE' },
        { left: 'Món bỏ trống mã món', right: 'NOT NULL' },
      ],
      done: 'Đúng hết. Mỗi luật canh một kiểu row sai riêng.',
    },
    {
      kind: 'choice',
      question:
        'Table `customers` có luật: tên khách không được để trống (NOT NULL), còn số điện thoại thì để trống được. Bạn thêm một khách mới có tên Hà nhưng chưa có số điện thoại. Database làm gì?',
      options: [
        { text: 'Nhận row, vì chỉ tên khách mới bắt buộc', correct: true, feedback: 'Đúng. Số điện thoại không có luật NOT NULL, nên ô này để trống được.' },
        { text: 'Từ chối row, vì thiếu số điện thoại', feedback: 'Chỉ column có NOT NULL mới bắt buộc. Số điện thoại không có luật này.' },
        { text: 'Từ chối row, vì thiếu primary key', feedback: 'Đề bài không nói thiếu mã khách. Hãy xem lại: row này chỉ thiếu số điện thoại.' },
      ],
    },
    {
      kind: 'choice',
      question:
        'Một đơn mới ghi mã khách 99, nhưng table `customers` chỉ có khách mã 1 tới 8. Mã khách trên đơn là foreign key trỏ tới `customers`. Database làm gì?',
      options: [
        { text: 'Từ chối đơn, vì khách 99 không có trong customers', correct: true, feedback: 'Đúng. Foreign key bắt mã khách phải có sẵn ở table customers.' },
        { text: 'Nhận đơn và tự thêm khách 99', feedback: 'Database không tự thêm row vào table khác. Foreign key chỉ kiểm và từ chối.' },
        { text: 'Nhận đơn, vì mã 99 là một số hợp lệ', feedback: 'Số 99 hợp lệ về kiểu số, nhưng foreign key còn kiểm khách đó có thật không.' },
      ],
    },
  ],
  why: 'Bạn đoán đúng cổng chặn row nào. Mình canh các luật này mỗi lần có row muốn vào sổ.',
};
