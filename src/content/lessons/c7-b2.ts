import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c7-b2',
  chapter: 7,
  order: 2,
  title: 'Transaction, COMMIT, ROLLBACK',
  lead: 'Bạn gom nhiều thay đổi thành một gói, rồi lưu hẳn hoặc bỏ cả gói.',
  minutes: 16,
  goals: [
    'Hiểu transaction là một gói thay đổi làm trọn gói',
    'Dùng COMMIT để lưu và ROLLBACK để bỏ',
    'Biết MySQL tự COMMIT sau mỗi lệnh còn tool Oracle thường chờ COMMIT',
    'Biết lệnh như CREATE TABLE tự COMMIT ở Oracle',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Ghi đơn xong thì mất điện',
      paragraphs: [
        'Khách mua hai ly. Bi làm hai bước: ghi đơn vào sổ đơn, rồi trừ nguyên liệu trong sổ kho.',
        'Bi vừa ghi đơn xong thì mất điện. Sổ kho chưa kịp trừ.',
        'Hai sổ giờ lệch nhau. Đơn có, nhưng kho vẫn còn đủ nguyên liệu.',
        'Bi cần gộp hai bước thành một gói. Xong cả hai, hoặc không xong bước nào.',
      ],
    },
    {
      type: 'text',
      title: 'Transaction là một giỏ thay đổi',
      paragraphs: [
        '**[[transaction]]** là một gói thay đổi làm trọn gói: lưu hết hoặc bỏ hết.',
        'Hình dung một giỏ mua sắm. Mỗi lệnh sửa dữ liệu bỏ thêm một thay đổi vào giỏ.',
        'Khi giỏ chưa thanh toán, người khác chưa thấy các thay đổi trong đó. Bạn thì thấy.',
        '**[[commit]]** là thanh toán. Mọi thay đổi trong giỏ được lưu hẳn, và người khác thấy chúng.',
        '**[[rollback]]** là trả đồ về kệ. Mọi thay đổi trong giỏ bị bỏ, và database trở lại như lúc chưa bắt đầu.',
        'Cảnh dưới đây có một giỏ như vậy. Bạn bỏ thay đổi vào giỏ, rồi chọn COMMIT hoặc ROLLBACK.',
      ],
    },
    {
      type: 'scene',
      scene: 'tx-cart',
      title: 'Giỏ thay đổi',
      intro: 'Chạy vài lệnh để bỏ thay đổi vào giỏ. Bấm COMMIT để lưu hoặc ROLLBACK để bỏ. Đổi công tắc giữa MySQL và Oracle để xem khác biệt.',
    },
    {
      type: 'text',
      title: 'COMMIT là điểm không quay lại',
      paragraphs: [
        'ROLLBACK chỉ cứu được thay đổi chưa COMMIT. COMMIT xong thì ROLLBACK không đòi lại được gì.',
        'Thói quen tốt: sửa xong, chạy SELECT để kiểm kết quả. Kết quả đúng thì COMMIT. Kết quả sai thì ROLLBACK.',
        'Bài trước nói chuyện quên WHERE. Nếu bạn chưa COMMIT, ROLLBACK cứu được toàn bộ.',
        'Oracle khuyên bạn tự kết thúc mọi transaction bằng COMMIT hoặc ROLLBACK. Luật này áp dụng cả cho transaction cuối, trước khi ngắt kết nối.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'MySQL bật **[[autocommit]]** theo mặc định. Mỗi lệnh tự COMMIT ngay sau khi chạy xong, nên ROLLBACK sau đó không còn gì để gỡ.',
        'Muốn gom nhiều lệnh thành một transaction ở MySQL, gõ `START TRANSACTION` trước. Xong thì gõ COMMIT hoặc ROLLBACK.',
        'Ở Oracle, tool bạn dùng thường chờ bạn gõ COMMIT. Mỗi tool có cài đặt riêng, nên đọc cài đặt của tool trước khi sửa dữ liệu thật.',
        'Oracle còn một luật nữa. Lệnh **[[ddl]]** như CREATE TABLE tự COMMIT, cả ngay trước và ngay sau khi chạy.',
        'Vì vậy UPDATE đang chờ, rồi CREATE TABLE, rồi ROLLBACK: UPDATE đã được lưu từ lúc CREATE TABLE chạy.',
      ],
      mysql:
        'START TRANSACTION;\nUPDATE products SET price = 48000 WHERE product_id = 2;\nROLLBACK;\n-- giá về như cũ',
      oracle:
        'UPDATE products SET price = 48000 WHERE product_id = 2;\nROLLBACK;\n-- giá về như cũ',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'MySQL đang bật autocommit. Bạn chạy một lệnh UPDATE, rồi gõ ROLLBACK. Giá trị trong table ra sao?',
          options: [
            { text: 'Vẫn là giá trị mới, vì UPDATE đã tự COMMIT', correct: true, feedback: 'Đúng. Autocommit lưu thay đổi ngay sau lệnh, nên ROLLBACK không còn gì để gỡ.' },
            { text: 'Trở lại giá trị cũ', feedback: 'Chỉ đúng khi bạn mở transaction bằng START TRANSACTION trước lệnh UPDATE.' },
            { text: 'Database báo lỗi', feedback: 'ROLLBACK chạy được, chỉ là nó không gỡ được gì.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Ở Oracle, bạn chạy UPDATE, rồi CREATE TABLE, rồi ROLLBACK. UPDATE ra sao?',
          options: [
            { text: 'UPDATE đã được lưu, vì CREATE TABLE tự COMMIT', correct: true, feedback: 'Đúng. Lệnh DDL tự COMMIT mọi thay đổi đang chờ.' },
            { text: 'UPDATE bị bỏ', feedback: 'UPDATE đã được lưu trước khi ROLLBACK chạy.' },
            { text: 'UPDATE còn chờ, ROLLBACK sẽ bỏ nó', feedback: 'CREATE TABLE đã kết thúc transaction. Không còn gì chờ.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi thuật ngữ với ý của nó.',
          pairs: [
            { left: 'COMMIT', right: 'Lưu hẳn mọi thay đổi trong giỏ' },
            { left: 'ROLLBACK', right: 'Bỏ mọi thay đổi trong giỏ' },
            { left: 'autocommit', right: 'Mỗi lệnh tự COMMIT ngay' },
            { left: 'START TRANSACTION', right: 'MySQL: mở một giỏ mới' },
          ],
          done: 'Đúng hết. Bốn thuật ngữ này đủ để đọc mọi đoạn code về transaction.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Chuyển tiền trên app ngân hàng',
      paragraphs: [
        'Khi bạn chuyển tiền, app trừ tiền của bạn và cộng tiền cho người nhận.',
        'Hai thay đổi nằm trong cùng một transaction. Nếu bước thứ hai lỗi, ROLLBACK trả tiền về cho bạn, và tiền không biến mất giữa đường.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Transaction là một giỏ thay đổi. COMMIT lưu hẳn cả giỏ, ROLLBACK bỏ cả giỏ.',
        'ROLLBACK chỉ cứu được thay đổi chưa COMMIT.',
        'MySQL tự COMMIT sau mỗi lệnh. Tool Oracle thường chờ bạn gõ COMMIT.',
        'Ở Oracle, lệnh DDL như CREATE TABLE tự COMMIT.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 5 (phần Transactions)', url: 'https://cs50.harvard.edu/sql/notes/5/', note: 'CC BY-NC-SA 4.0' },
        { name: 'MySQL 8.0 Reference Manual, START TRANSACTION, COMMIT, and ROLLBACK', url: 'https://dev.mysql.com/doc/refman/8.0/en/commit.html' },
        { name: 'MySQL 8.0 Reference Manual, autocommit, Commit, and Rollback', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-autocommit-commit-rollback.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COMMIT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, ROLLBACK', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/ROLLBACK.html' },
      ],
    },
  ],
};
