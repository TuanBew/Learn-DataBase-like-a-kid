import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c11-b1',
  chapter: 11,
  order: 1,
  title: 'Tool và kết nối: SQL Developer, DBeaver, worksheet, nút COMMIT',
  lead: 'Bạn biết tool gửi lệnh tới database của công ty như thế nào, và cẩn thận với nút chạy và nút COMMIT.',
  minutes: 13,
  goals: [
    'Biết tool là client và database của công ty là server',
    'Kể được các thông tin cần để tạo một kết nối',
    'Phân biệt chạy một lệnh với chạy cả script',
    'Biết thay đổi chưa COMMIT thì phiên của người khác chưa thấy',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ngày đầu có quyền vào database',
      paragraphs: [
        'Anh Khoa ở phòng IT gửi bạn một email: "Chào mừng em. Tài khoản database của em đã tạo xong."',
        'Email có vài dòng thông tin lạ: tên máy chủ, một con số, một cái tên service, tên đăng nhập.',
        'Bạn chưa thấy chỗ nào để gõ SQL. Máy bạn không có database nào cả.',
        'Bi giải thích: database của công ty nằm ở một máy khác. Bạn cần một chương trình trên máy mình để nói chuyện với máy đó.',
      ],
    },
    {
      type: 'text',
      title: 'Tool là client, database của công ty là server',
      paragraphs: [
        'Chương trình bạn cài trên máy mình gọi là tool. SQL Developer và DBeaver là hai tool phổ biến.',
        'Tool đóng vai **[[client]]**: nó gửi lệnh đi. Database của công ty đóng vai **[[server]]**: nó nhận lệnh, chạy, rồi trả kết quả về.',
        'Dữ liệu vẫn nằm trên server. Tool chỉ hiện lại kết quả cho bạn xem.',
        'Hình dung bạn gọi điện cho thư viện để hỏi sách. Điện thoại là tool. Thư viện là server. Sách vẫn nằm ở thư viện.',
      ],
    },
    {
      type: 'text',
      title: 'Một kết nối cần gì',
      paragraphs: [
        'Một **[[connection]]** là đường nối từ tool của bạn tới một database cụ thể, với một user cụ thể.',
        'Muốn tạo kết nối, bạn điền các thông tin sau:',
        '**host**: tên hoặc địa chỉ của máy chủ chứa database.',
        '**port**: số cổng database lắng nghe trên máy chủ đó.',
        '**tên service** hoặc **SID**: tên của database cần vào, vì một máy chủ có thể chứa nhiều database. Oracle dùng một trong hai cách gọi này.',
        '**user** và **mật khẩu**: tài khoản của bạn.',
        'Người quản trị database cấp tất cả thông tin này. Bạn không tự đoán được. Nếu email thiếu thứ nào, nhắn lại hỏi.',
      ],
    },
    {
      type: 'text',
      title: 'Worksheet là nơi gõ lệnh',
      paragraphs: [
        '**[[worksheet]]** là cửa sổ trong tool, nơi bạn gõ SQL. Kết quả hiện ngay bên dưới.',
        'Mỗi worksheet gắn với một kết nối. Gõ lệnh ở worksheet nào thì lệnh đi qua kết nối của worksheet đó.',
        'Công ty thường có nhiều database: một để thử, một chạy thật. Trước khi chạy, nhìn tên kết nối của worksheet. Chọn nhầm kết nối là sai chỗ cả lệnh sửa.',
        'Nếu bạn mở nhiều worksheet, mỗi worksheet nên ghi rõ tên kết nối ở tab hoặc ở thanh trên.',
      ],
    },
    {
      type: 'text',
      title: 'Chạy một lệnh và chạy cả script',
      paragraphs: [
        'Trong worksheet, bạn có thể gõ nhiều lệnh, mỗi lệnh kết thúc bằng dấu `;`.',
        'Tool có hai kiểu chạy. Kiểu thứ nhất chạy một lệnh, lệnh đang chứa con trỏ chuột hoặc lệnh bạn bôi đen. Kiểu thứ hai chạy cả **[[script]]**, tức mọi lệnh trong worksheet, lần lượt từ trên xuống.',
        'Ở SQL Developer, tài liệu của Oracle ghi Ctrl+Enter chạy một lệnh và F5 chạy cả script. Các tool khác có phím riêng, và phím có thể đổi theo cài đặt.',
        'Quên kiểu nào đang bấm là lỗi hay gặp. Bạn định chạy một SELECT nhưng bấm chạy cả script, và các UPDATE nằm bên dưới cũng chạy theo.',
        'Thói quen an toàn: tách lệnh sửa dữ liệu ra một worksheet riêng, hoặc để chúng cách xa SELECT bằng dòng chú thích rõ ràng.',
      ],
    },
    {
      type: 'text',
      title: 'COMMIT: lưu hẳn, và người khác mới thấy',
      paragraphs: [
        'Bài về transaction đã nói: thay đổi chỉ lưu hẳn khi **[[commit]]**. Trước đó, thay đổi chỉ nằm trong phiên làm việc của bạn.',
        'Phiên của người khác chưa thấy thay đổi chưa COMMIT. Bạn thấy bảng lương đã tăng. Đồng nghiệp chạy cùng SELECT vẫn thấy lương cũ.',
        'Mỗi tool có nút COMMIT và nút ROLLBACK. Chỗ đặt khác nhau theo tool. Hỏi đồng nghiệp hoặc người quản trị chỗ đặt nút trước khi sửa dữ liệu thật.',
        'Tool còn có thể COMMIT thay bạn. Ở SQL Developer, tài liệu của Oracle nói tùy chọn Autocommit, khi bật, COMMIT sau mỗi lệnh INSERT, UPDATE và DELETE trong worksheet. Mặc định của từng bản có thể khác nhau, nên kiểm lại cài đặt của bạn.',
        'Chưa chắc tool đang ở chế độ nào thì làm thử trên database thử, không phải database chạy thật.',
        'Có thể tool dùng chung một phiên cho nhiều worksheet cùng kết nối. SQL Developer là một ví dụ: COMMIT ở một worksheet lưu hẳn thay đổi của cả các worksheet kia.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn cài SQL Developer trên laptop và kết nối tới database công ty. Database nằm ở đâu?',
          options: [
            { text: 'Trên server của công ty. Laptop chỉ gửi lệnh và hiện kết quả', correct: true, feedback: 'Đúng. Tool là client. Dữ liệu ở lại trên server.' },
            { text: 'Trên laptop của bạn', feedback: 'Laptop chỉ có tool. Database nằm ở máy chủ khác.' },
            { text: 'Trong chính SQL Developer', feedback: 'SQL Developer là chương trình gửi lệnh, không giữ dữ liệu của công ty.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn sửa lương bằng UPDATE, tool chưa tự COMMIT, và bạn chưa bấm COMMIT. Đồng nghiệp chạy SELECT. Họ thấy gì?',
          options: [
            { text: 'Lương cũ, vì thay đổi của bạn chưa COMMIT', correct: true, feedback: 'Đúng. Chỉ phiên của bạn thấy thay đổi chưa COMMIT.' },
            { text: 'Lương mới, vì UPDATE đã chạy xong', feedback: 'UPDATE chạy xong chưa đủ. Người khác chỉ thấy sau khi bạn COMMIT.' },
            { text: 'Database báo lỗi cho họ', feedback: 'Họ vẫn đọc bình thường, chỉ là thấy dữ liệu cũ.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi thông tin kết nối với ý của nó.',
          pairs: [
            { left: 'host', right: 'Tên hoặc địa chỉ máy chủ chứa database' },
            { left: 'port', right: 'Số cổng database lắng nghe' },
            { left: 'service hoặc SID', right: 'Tên database cần vào trên máy chủ' },
            { left: 'user và mật khẩu', right: 'Tài khoản của bạn do người quản trị cấp' },
            { left: 'Chạy một lệnh', right: 'Chỉ chạy lệnh đang chọn, không chạy cả script' },
          ],
          done: 'Đúng hết. Có đủ năm thứ này, bạn tạo được kết nối và chạy đúng lệnh.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Ngày đầu đi làm',
      paragraphs: [
        'Phòng IT của bạn gửi email chào mừng với thông tin kết nối. Bạn cài tool, điền host, port, service, user và mật khẩu, rồi bấm kết nối.',
        'Người làm lâu năm dặn thêm hai điều. Đừng bao giờ gõ lệnh sửa dữ liệu khi chưa nhìn tên kết nối. Và đừng bấm chạy cả script khi chỉ định chạy một lệnh.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Tool là client trên máy bạn. Database của công ty là server ở máy khác.',
        'Một kết nối cần host, port, tên service hoặc SID, user và mật khẩu. Người quản trị cấp các thông tin này.',
        'Worksheet là nơi gõ lệnh. Nhìn tên kết nối trước khi chạy.',
        'Chạy một lệnh khác với chạy cả script. Biết mình đang bấm nút nào.',
        'Thay đổi chỉ lưu hẳn khi COMMIT. Phiên của người khác chưa thấy thay đổi chưa COMMIT.',
        'Mỗi tool có nút chạy một lệnh, nút chạy cả script, nút COMMIT và ROLLBACK. Hỏi đồng nghiệp chỗ đặt.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle SQL Developer User\'s Guide, Concepts and Usage', url: 'https://docs.oracle.com/en/database/oracle/sql-developer/23.1/rptug/sql-developer-concepts-usage.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COMMIT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, ROLLBACK', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROLLBACK.html' },
      ],
    },
  ],
};
