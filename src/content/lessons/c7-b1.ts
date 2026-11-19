import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c7-b1',
  chapter: 7,
  order: 1,
  title: 'INSERT, UPDATE, DELETE',
  lead: 'Bạn thêm, sửa và xóa row, và học thói quen để không sửa nhầm.',
  minutes: 16,
  goals: [
    'Thêm row bằng INSERT, sửa bằng UPDATE, xóa bằng DELETE',
    'Biết UPDATE và DELETE không có WHERE sẽ đổi mọi row',
    'Chạy SELECT với đúng WHERE trước khi sửa',
    'Đọc ý nghĩa của ORA-00001, ORA-01400 và ORA-02292',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tăng giá một món',
      paragraphs: [
        'Chủ tiệm nói với Bi: "Tăng giá trà đào cam sả lên 48.000 đồng."',
        'Bi mở sổ thực đơn và tìm đúng món đó. Rồi mình sửa số giá của món ấy.',
        'Giả sử Bi quên nói món nào. Mình sẽ sửa giá của mọi món trong thực đơn thành 48.000.',
        'SQL có ba lệnh để sửa dữ liệu. Các lệnh này làm đúng điều bạn viết, và không hỏi lại.',
      ],
    },
    {
      type: 'text',
      title: 'Ba lệnh sửa dữ liệu',
      paragraphs: [
        '**[[insert]]** thêm một row mới vào table.',
        '**[[update]]** sửa giá trị trong những row có sẵn.',
        '**[[delete]]** xóa row khỏi table.',
        'Ba lệnh này gọi chung là **[[dml]]**.',
        'UPDATE và DELETE cần WHERE để nói row nào bị đụng tới. WHERE ở đây viết giống hệt WHERE trong SELECT.',
      ],
    },
    {
      type: 'code',
      title: 'Ba lệnh trên table products',
      intro: 'Đọc từng lệnh. Chưa cần chạy, phần diễn tập ở ngay bên dưới.',
      code:
        "INSERT INTO products (product_id, name, category, price)\nVALUES (15, 'Trà xoài', 'Trà trái cây', 42000);\n\nUPDATE products\nSET price = 48000\nWHERE product_id = 2;\n\nDELETE FROM products\nWHERE product_id = 14;",
      notes: [
        { find: 'INSERT INTO products', text: 'INSERT thêm một row. Danh sách column và danh sách giá trị đi theo cùng thứ tự.' },
        { find: 'SET price = 48000', text: 'SET nói column nào đổi thành giá trị gì. Đổi nhiều column thì viết cách nhau bằng dấu phẩy.' },
        { find: 'WHERE product_id = 2', text: 'WHERE chọn row cần sửa. Ở đây chỉ món số 2 đổi giá.' },
        { find: 'DELETE FROM products', text: 'DELETE xóa các row thỏa WHERE. Ở đây chỉ món số 14 bị xóa.' },
      ],
    },
    {
      type: 'text',
      title: 'Quên WHERE là đổi mọi row',
      paragraphs: [
        'Nếu UPDATE không có WHERE, mọi row trong table bị đổi.',
        'Nếu DELETE không có WHERE, mọi row trong table bị xóa.',
        '`UPDATE products SET price = 48000` đặt giá của cả 14 món thành 48000.',
        'Cảnh dưới đây cho bạn diễn tập trên một bản sao của table products. Dữ liệu thật vẫn an toàn.',
      ],
    },
    {
      type: 'scene',
      scene: 'dml-rehearsal',
      title: 'Diễn tập UPDATE và DELETE',
      intro: 'Chạy thử UPDATE và DELETE trên bản sao của products. Thử một lệnh có WHERE, rồi thử một lệnh quên WHERE.',
    },
    {
      type: 'text',
      title: 'Thói quen: SELECT trước, sửa sau',
      paragraphs: [
        'Trước khi UPDATE hoặc DELETE, chạy SELECT với đúng WHERE đó.',
        'Đếm số row trả về. Nếu số row đúng như bạn nghĩ, đổi SELECT thành UPDATE hoặc DELETE và giữ nguyên WHERE.',
        'Nếu số row nhiều hơn dự tính, dừng lại. Sửa WHERE trước.',
        'Bài sau dạy ROLLBACK, cách gỡ lại thay đổi chưa lưu. Thói quen này vẫn là lớp bảo vệ đầu tiên.',
      ],
    },
    {
      type: 'code',
      title: 'Hai bước cho một lần sửa',
      code:
        "-- Bước 1: xem trước. Phải ra đúng 1 row.\nSELECT * FROM products\nWHERE product_id = 2;\n\n-- Bước 2: giữ nguyên WHERE, đổi sang UPDATE.\nUPDATE products\nSET price = 48000\nWHERE product_id = 2;",
      notes: [
        { find: 'SELECT * FROM products', text: 'Bước 1 chỉ đọc dữ liệu, không đổi gì.' },
        { find: 'UPDATE products', text: 'Bước 2 chỉ chạy khi bước 1 cho đúng số row bạn muốn.' },
      ],
    },
    {
      type: 'text',
      title: 'constraint có thể chặn lệnh',
      paragraphs: [
        'Mọi lệnh sửa dữ liệu đều đi qua cổng của **[[constraint]]**.',
        'Lệnh nào làm table phạm luật thì database từ chối. Lệnh bị hủy, không row nào đổi.',
        '**[[error-code]]** là mã database báo khi lệnh gặp lỗi. Oracle viết ORA kèm năm số. MySQL báo một con số.',
        'Đọc mã trước, rồi đọc lời giải thích đi kèm. Ba mã dưới đây hay gặp nhất khi sửa dữ liệu.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'ORA-00001: bạn thêm row có mã đã tồn tại. Column là primary key hoặc UNIQUE nên không cho hai row trùng nhau. MySQL báo 1062.',
        'ORA-01400: bạn đưa NULL vào column bắt buộc có giá trị, tức column NOT NULL. MySQL báo 1048.',
        'ORA-02292: bạn xóa row mà row khác còn trỏ tới. Ví dụ xóa một món đã nằm trong đơn. MySQL báo 1451.',
        'INSERT nhiều row trong một câu thì MySQL nhận. Oracle 19c không nhận và báo ORA-00933. Ở Oracle, viết mỗi row một câu INSERT.',
      ],
      mysql:
        "INSERT INTO products (product_id, name, category, price)\nVALUES (1, 'Trà xoài', 'Trà trái cây', 42000);\n-- Lỗi 1062: mã 1 đã có",
      oracle:
        "INSERT INTO products (product_id, name, category, price)\nVALUES (1, 'Trà xoài', 'Trà trái cây', 42000);\n-- ORA-00001: mã 1 đã có",
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn chạy `DELETE FROM products` mà quên WHERE. Chuyện gì xảy ra?',
          options: [
            { text: 'Mọi row trong products bị xóa', correct: true, feedback: 'Đúng. Không có WHERE thì không row nào được giữ lại.' },
            { text: 'Database báo lỗi và không xóa gì', feedback: 'Câu này đúng cú pháp, nên database chạy luôn. Nó không hỏi lại.' },
            { text: 'Chỉ row đầu tiên bị xóa', feedback: 'Database không đoán. Không có WHERE nghĩa là mọi row.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn sắp chạy `UPDATE products SET price = 50000 WHERE category = \'Topping\'`. Bạn nên làm gì đầu tiên?',
          options: [
            { text: "Chạy `SELECT * FROM products WHERE category = 'Topping'` và đếm row", correct: true, feedback: 'Đúng. SELECT với cùng WHERE cho bạn thấy trước những row nào sẽ đổi.' },
            { text: 'Chạy UPDATE luôn, sai thì sửa lại', feedback: 'Có thể sửa lại, nhưng bạn phải nhớ giá cũ. Xem trước an toàn hơn.' },
            { text: 'Bỏ WHERE cho nhanh', feedback: 'Bỏ WHERE làm mọi món đổi giá. Đó là điều cần tránh.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mã lỗi với điều nó báo.',
          pairs: [
            { left: 'ORA-00001', right: 'Thêm row có mã đã tồn tại' },
            { left: 'ORA-01400', right: 'Đưa NULL vào column bắt buộc có giá trị' },
            { left: 'ORA-02292', right: 'Xóa row mà row khác còn trỏ tới' },
          ],
          done: 'Đúng hết. Cả ba lỗi đều do constraint chặn lệnh.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Đổi số điện thoại trong app',
      paragraphs: [
        'Bạn đổi số điện thoại trong hồ sơ và bấm Lưu.',
        'App gửi cho database một lệnh UPDATE. WHERE trong lệnh trỏ tới đúng tài khoản của bạn. Nếu thiếu WHERE, số điện thoại của mọi người đều đổi.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'INSERT thêm row, UPDATE sửa row, DELETE xóa row.',
        'UPDATE và DELETE không có WHERE sẽ đổi mọi row.',
        'Chạy SELECT với đúng WHERE trước, xem số row, rồi mới sửa.',
        'constraint chặn lệnh làm table phạm luật: ORA-00001, ORA-01400, ORA-02292.',
      ],
    },
    {
      type: 'sources',
      items: [{ name: 'Harvard CS50 SQL, Lecture 3', url: 'https://cs50.harvard.edu/sql/notes/3/', note: 'CC BY-NC-SA 4.0' }],
    },
  ],
};
