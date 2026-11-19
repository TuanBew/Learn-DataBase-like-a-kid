import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c3-b5',
  chapter: 3,
  order: 5,
  title: 'Thứ tự query chạy thật',
  lead: 'Bạn thấy database đọc các clause theo thứ tự khác với thứ tự bạn viết.',
  minutes: 12,
  goals: [
    'Nói đúng thứ tự database chạy các clause',
    'Hiểu vì sao WHERE không dùng được alias đặt ở SELECT',
    'Biết ORDER BY dùng được alias',
    'Đọc một query theo thứ tự chạy thật',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Bi đọc query ở đâu trước?',
      paragraphs: [
        'Bạn viết query từ trên xuống: SELECT trước, FROM sau. Bi không đọc theo thứ tự đó.',
        'Khi nhận query, mình tìm sổ trước. Rồi mình lọc row, rồi mới chọn column, xếp, và cắt lấy vài row đầu.',
        'Thứ tự bạn viết dành cho người đọc. Thứ tự Bi xử lý là thứ tự database chạy thật.',
        'Biết thứ tự này, bạn đoán trước được query nào chạy và query nào báo lỗi.',
      ],
    },
    {
      type: 'text',
      title: 'Bảy bước của một query',
      paragraphs: [
        'Database xử lý một query theo thứ tự sau. Với query bạn đã học, có năm bước: FROM, WHERE, SELECT, ORDER BY, rồi LIMIT hoặc FETCH FIRST.',
        'Hai bước nữa là GROUP BY và HAVING, nằm giữa WHERE và SELECT. Bạn sẽ học chúng ở chương sau.',
        'Trong cảnh dưới đây, bạn xếp các clause theo thứ tự database chạy.',
      ],
    },
    {
      type: 'scene',
      scene: 'clause-order',
      title: 'Xếp các clause theo thứ tự chạy',
      intro: 'Kéo từng clause vào đúng vị trí. Mỗi clause cho thấy bước đó làm gì với dữ liệu.',
    },
    {
      type: 'text',
      title: 'Thứ tự này giúp bạn điều gì',
      paragraphs: [
        'WHERE chạy trước SELECT. Lúc WHERE chạy, alias đặt ở SELECT chưa tồn tại.',
        'Vì vậy `SELECT price * 2 AS gia_doi ... WHERE gia_doi > 70000` báo lỗi. MySQL báo lỗi 1054: Unknown column. Oracle báo ORA-00904: invalid identifier.',
        'WHERE phải dùng tên column thật: `WHERE price * 2 > 70000`, hoặc `WHERE price > 35000`.',
        'ORDER BY chạy sau SELECT. Lúc đó alias đã có, nên ORDER BY dùng được alias.',
        'LIMIT và FETCH FIRST chạy cuối cùng. Chúng cắt sau khi ORDER BY đã xếp xong. Vì vậy "3 row đầu" luôn nghĩa là 3 row đầu của kết quả đã xếp.',
      ],
    },
    {
      type: 'playground',
      title: 'Query dùng đủ năm bước',
      intro: 'Bấm Chạy. WHERE dùng price, ORDER BY dùng alias gia_doi.',
      database: 'teashop',
      tables: ['products'],
      dialects: ['mysql', 'oracle'],
      sql: {
        mysql: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 40000\nORDER BY gia_doi DESC\nLIMIT 3;',
        oracle: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 40000\nORDER BY gia_doi DESC\nFETCH FIRST 3 ROWS ONLY',
      },
      tries: [
        {
          label: 'Đổi 40000 thành 30000',
          sql: {
            mysql: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 30000\nORDER BY gia_doi DESC\nLIMIT 3;',
            oracle: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 30000\nORDER BY gia_doi DESC\nFETCH FIRST 3 ROWS ONLY',
          },
        },
        {
          label: 'Đổi ORDER BY gia_doi thành ORDER BY price',
          sql: {
            mysql: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 40000\nORDER BY price DESC\nLIMIT 3;',
            oracle: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 40000\nORDER BY price DESC\nFETCH FIRST 3 ROWS ONLY',
          },
        },
        {
          label: 'Đổi 3 thành 2',
          sql: {
            mysql: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 40000\nORDER BY gia_doi DESC\nLIMIT 2;',
            oracle: 'SELECT name, price * 2 AS gia_doi\nFROM products\nWHERE price > 40000\nORDER BY gia_doi DESC\nFETCH FIRST 2 ROWS ONLY',
          },
        },
      ],
      say: 'Xem Theater từng bước: FROM lấy 14 row, WHERE giữ 4 row, SELECT tính gia_doi, ORDER BY xếp, rồi cắt còn 3 row.',
    },
    {
      type: 'text',
      paragraphs: [
        'Database có thể đổi thứ tự các bước để chạy nhanh hơn. Kết quả luôn như thể nó chạy đúng thứ tự trên.',
        'Dùng thứ tự này để đoán query nào hợp lệ và kết quả ra sao. Đừng dùng nó để đoán query chạy nhanh hay chậm.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Clause nào chạy đầu tiên?',
          options: [
            { text: 'FROM', correct: true, feedback: 'Đúng. Database tìm table trước, rồi mới lọc row.' },
            { text: 'SELECT', feedback: 'SELECT đứng đầu khi viết, nhưng chạy sau FROM và WHERE.' },
            { text: 'WHERE', feedback: 'WHERE cần có table để lọc. FROM chạy trước.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query `SELECT price * 2 AS gia_doi FROM products WHERE gia_doi > 70000` báo lỗi. Vì sao?',
          options: [
            { text: 'WHERE chạy trước SELECT, lúc đó alias gia_doi chưa có', correct: true, feedback: 'Đúng. Dùng `price * 2 > 70000` trong WHERE thì query chạy được.' },
            { text: 'Alias không bao giờ dùng được trong query', feedback: 'Alias dùng được, ví dụ ở ORDER BY. Chỉ WHERE chạy trước nên chưa thấy alias.' },
            { text: 'Số 70000 quá lớn', feedback: 'Số lớn không gây lỗi. Lỗi nằm ở tên gia_doi, vì WHERE chưa biết alias đó.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Query có ORDER BY và LIMIT 3. Database cắt 3 row vào lúc nào?',
          options: [
            { text: 'Sau khi ORDER BY xếp xong', correct: true, feedback: 'Đúng. Vì vậy bạn nhận 3 row đầu của danh sách đã xếp.' },
            { text: 'Trước khi ORDER BY chạy', feedback: 'Nếu cắt trước thì ba món đắt nhất sẽ không được chọn đúng. LIMIT chạy sau ORDER BY.' },
            { text: 'Cùng lúc với WHERE', feedback: 'WHERE lọc row theo điều kiện. Cắt vài row đầu là bước cuối.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Đọc lỗi trong app mua sắm',
      paragraphs: [
        'Lập trình viên của một app mua sắm viết query lọc món theo giá đã giảm. Họ đặt alias cho giá đã giảm ở SELECT, rồi dùng alias đó trong WHERE.',
        'Database báo lỗi unknown column hoặc invalid identifier. Người biết thứ tự chạy sẽ sửa ngay: viết lại phép tính trong WHERE.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Thứ tự chạy: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, rồi LIMIT hoặc FETCH FIRST.',
        'WHERE chạy trước SELECT, nên không dùng được alias của SELECT.',
        'ORDER BY chạy sau SELECT, nên dùng được alias.',
        'LIMIT và FETCH FIRST chạy cuối, sau khi ORDER BY xếp xong.',
        'Database có thể sắp lại bước để chạy nhanh, nhưng kết quả vẫn như chạy đúng thứ tự.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Julia Evans: SQL queries don\'t start with SELECT', url: 'https://jvns.ca/blog/2019/10/03/sql-queries-don-t-start-with-select/' },
        { name: 'Harvard CS50 SQL, Lecture 0', url: 'https://cs50.harvard.edu/sql/notes/0/', note: 'CC BY-NC-SA 4.0' },
      ],
    },
  ],
};
