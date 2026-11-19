import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c7-b3',
  chapter: 7,
  order: 3,
  title: 'index',
  lead: 'Bạn hiểu vì sao index giúp tìm row nhanh, và cái giá phải trả.',
  minutes: 14,
  goals: [
    'Biết index giống mục lục cuối sách',
    'Phân biệt scan và tìm bằng index',
    'Biết index làm INSERT, UPDATE, DELETE chậm hơn một chút',
    'Biết primary key luôn có index',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tìm một khách trong cuốn sổ dày',
      paragraphs: [
        'Tiệm có một cuốn sổ ghi cả nghìn khách. Chủ tiệm nhờ Bi tìm khách tên Trần Thu Hà.',
        'Cách một: Bi lật từng trang từ đầu. Có khi tới trang cuối mới thấy.',
        'Cách hai: Bi mở danh sách tên xếp theo vần ở cuối sổ. Cạnh mỗi tên có số trang. Bi nhảy thẳng tới đúng trang.',
        'Hai cách cho cùng một kết quả. Cách hai nhanh hơn nhiều.',
      ],
    },
    {
      type: 'text',
      title: 'index giống mục lục cuối sách',
      paragraphs: [
        '**[[index]]** là danh sách phụ giúp database tìm row mà không phải đọc cả table.',
        'Index xếp sẵn các giá trị theo thứ tự. Cạnh mỗi giá trị có chỉ dẫn tới row chứa nó. Mục lục cuối sách làm đúng như vậy.',
        'Không có index, database làm **[[scan]]**: đọc table từ row đầu tới row cuối. Table càng nhiều row, scan càng lâu.',
        'Có index, database tra index trước, rồi nhảy thẳng tới row cần tìm.',
        'Cảnh dưới đây cho hai người đua. Một người lật từng trang. Một người tra mục lục.',
      ],
    },
    {
      type: 'scene',
      scene: 'index-race',
      title: 'Cuộc đua tìm row',
      intro: 'Chọn số row của table rồi bấm chạy. Xem ai tới đích trước khi table lớn dần.',
    },
    {
      type: 'text',
      title: 'Cái giá của index',
      paragraphs: [
        'Index không miễn phí. Nó chiếm thêm chỗ trong database.',
        'Mỗi lần bạn INSERT, UPDATE hoặc DELETE, database phải cập nhật cả index. Ghi vì thế chậm hơn một chút.',
        'Giống mục lục: sách thêm một trang thì mục lục phải sửa theo.',
        'Vì vậy không ai tạo index cho mọi column. Người ta chỉ tạo cho column hay dùng để tìm.',
        'Primary key luôn có index. Khi bạn tìm row bằng primary key, database dùng index đó.',
        'Khóa này chỉ dạy ý tưởng. Cách chọn column nào nên có index nằm ngoài phạm vi.',
      ],
    },
    {
      type: 'code',
      title: 'Tạo một index',
      intro: 'Lệnh dưới đây tạo index cho column full_name của table customers. MySQL và Oracle viết giống nhau.',
      code: 'CREATE INDEX idx_customers_name\nON customers (full_name);',
      notes: [
        { find: 'idx_customers_name', text: 'Tên của index. Bạn tự đặt, và nên có tên table và column để dễ nhớ.' },
        { find: 'customers (full_name)', text: 'Table và column mà index sắp xếp. Từ giờ, tìm theo full_name sẽ nhanh hơn.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Column không có index. Bạn tìm một giá trị trong đó. Database làm gì?',
          options: [
            { text: 'Scan: đọc table từ row đầu tới row cuối', correct: true, feedback: 'Đúng. Không có index thì database phải đọc từng row.' },
            { text: 'Nhảy thẳng tới row cần tìm', feedback: 'Chỉ index mới cho phép nhảy thẳng. Không có index thì phải đọc dần.' },
            { text: 'Báo lỗi vì thiếu index', feedback: 'Query vẫn chạy bình thường, chỉ chậm hơn khi table lớn.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Vì sao không nên tạo index cho mọi column?',
          options: [
            { text: 'Index chiếm chỗ, và mỗi lần ghi phải cập nhật thêm index', correct: true, feedback: 'Đúng. Càng nhiều index, ghi càng chậm và tốn chỗ.' },
            { text: 'Index làm kết quả query sai', feedback: 'Index không đổi kết quả. Nó chỉ đổi tốc độ tìm.' },
            { text: 'Mỗi table chỉ được một index', feedback: 'Một table có thể có nhiều index.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi mẩu với ý của nó.',
          pairs: [
            { left: 'Mục lục cuối sách', right: 'index' },
            { left: 'Lật từng trang từ đầu', right: 'scan' },
            { left: 'primary key', right: 'Luôn có index' },
          ],
          done: 'Đúng hết. Nhớ ví dụ mục lục là đủ để hiểu index.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Gõ tên sản phẩm trong app mua sắm',
      paragraphs: [
        'Bạn gõ tên một sản phẩm và kết quả hiện ra gần như ngay, dù cửa hàng có cả triệu sản phẩm.',
        'Những app như vậy thường có index trên column tên sản phẩm. Nếu không, database phải đọc từng sản phẩm một.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'index giống mục lục cuối sách: xếp sẵn giá trị và chỉ tới row.',
        'Không có index, database scan cả table. Có index, database nhảy thẳng tới row.',
        'Bù lại, index chiếm chỗ và làm INSERT, UPDATE, DELETE chậm hơn một chút.',
        'Primary key luôn có index.',
      ],
    },
    {
      type: 'sources',
      items: [{ name: 'Harvard CS50 SQL, Lecture 5', url: 'https://cs50.harvard.edu/sql/notes/5/', note: 'CC BY-NC-SA 4.0' }],
    },
  ],
};
