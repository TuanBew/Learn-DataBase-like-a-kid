import type { QuizExercise } from '../types';

export const exercise: QuizExercise = {
  id: 'c2-boss',
  chapter: 2,
  kind: 'quiz',
  title: 'Boss: Ôn Chương 2',
  prompt: 'Năm câu ôn lại cả chương. Câu nào chưa chắc, bạn đọc kỹ lời giải thích bên dưới. Mình giải thích từng bước.',
  asks: [],
  items: [
    {
      kind: 'choice',
      question:
        'Table món được dựng bằng `CREATE TABLE menu (item_id INT, item_name VARCHAR(50) NOT NULL UNIQUE, price INT CHECK (price > 0), PRIMARY KEY (item_id))`. Column nào là primary key?',
      options: [
        { text: 'item_id', correct: true, feedback: 'Đúng. Phần PRIMARY KEY (item_id) chỉ ra mã riêng của mỗi món.' },
        { text: 'item_name', feedback: 'Column này có UNIQUE, nhưng UNIQUE chỉ cấm trùng. Primary key được khai ở phần PRIMARY KEY.' },
        { text: 'price', feedback: 'Column này có CHECK để giá lớn hơn 0. Primary key được khai ở phần PRIMARY KEY.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Cũng với table menu ở câu trước, bạn thêm ba row mới. Row nào bị constraint chặn?',
      options: [
        { text: 'item_id 21, tên Trà dâu tằm, giá -5000', correct: true, feedback: 'Đúng. CHECK (price > 0) chặn giá âm.' },
        { text: 'item_id 21, tên Trà dâu tằm, giá 46000', feedback: 'Row này hợp lệ ở mọi luật, nên qua được.' },
        { text: 'item_id 22, tên Trà ổi hồng, giá 39000', feedback: 'Row này cũng hợp lệ ở mọi luật. Hãy tìm row có giá trị phạm luật.' },
      ],
    },
    {
      kind: 'choice',
      question: 'Table products có vài món chưa ghi calo. Query nào tìm các món đó?',
      options: [
        { text: '`WHERE calories IS NULL`', correct: true, feedback: 'Đúng. `IS NULL` là cách hỏi ô có trống không.' },
        { text: '`WHERE calories = NULL`', feedback: 'So sánh bằng `=` với NULL cho kết quả "không biết", nên không row nào được giữ.' },
        { text: '`WHERE calories = 0`', feedback: 'Số 0 là một giá trị thật. Món chưa ghi calo thì ô trống, và trống khác 0.' },
      ],
    },
    {
      kind: 'match',
      question: 'Nối mỗi mô tả với tên của nó.',
      pairs: [
        { left: 'Column customer_id của table orders', right: 'foreign key' },
        { left: 'Column customer_id của table customers', right: 'primary key' },
        { left: 'Ô phải có giá trị', right: 'NOT NULL' },
        { left: 'Không được trùng với row khác', right: 'UNIQUE' },
      ],
      done: 'Đúng hết rồi. Mỗi constraint canh một luật riêng, và hai loại key nối các table lại.',
    },
    {
      kind: 'choice',
      question: 'Vì sao nên tách số điện thoại khách ra table customers, thay vì chép vào từng đơn?',
      options: [
        { text: 'Số điện thoại chỉ nằm một chỗ, sửa một lần là đúng ở mọi nơi', correct: true, feedback: 'Đúng. Một thông tin chép ở nhiều row sẽ lệch nhau khi sửa.' },
        { text: 'Để table orders có nhiều column hơn', feedback: 'Tách table làm orders gọn đi. Lý do là sửa một lần, đúng ở mọi nơi.' },
        { text: 'Vì database không chứa được số điện thoại ở table orders', feedback: 'Table orders chứa được. Nhưng chép trùng sẽ làm các row lệch nhau khi một số đổi.' },
      ],
    },
  ],
  why: 'Bạn đã qua hết Chương 2. Bạn đọc được primary key, foreign key, NULL và constraint, và hiểu vì sao các table tách riêng.',
};
