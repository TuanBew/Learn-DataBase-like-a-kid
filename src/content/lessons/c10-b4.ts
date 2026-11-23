import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c10-b4',
  chapter: 10,
  order: 4,
  title: 'Hai người cùng sửa một row: lock và query bị treo',
  lead: 'Bạn hiểu vì sao UPDATE của đồng nghiệp đứng im, và cách gỡ khi chính bạn là người giữ lock.',
  minutes: 13,
  goals: [
    'Hiểu lock giữ row cho tới khi COMMIT hoặc ROLLBACK',
    'Biết người sửa cùng row phải chờ, còn người chỉ SELECT thì không',
    'Biết quên COMMIT làm đồng nghiệp bị treo',
    'Nhận ra lỗi 1205 ở MySQL và ORA-00060 ở Oracle',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Màn hình của Bình đứng im',
      paragraphs: [
        'Chín giờ sáng, Bình chạy một lệnh UPDATE giá món trà đào. Màn hình không báo gì cả.',
        'Một phút trôi qua. Hai phút. Con trỏ vẫn quay, và lệnh chưa xong.',
        'Bình nghĩ máy hỏng. Bi nói máy vẫn ổn. Có người khác đang sửa đúng row đó, và họ chưa COMMIT.',
        'Bài này kể chuyện của ba người cùng dùng một database. Engine của site chỉ có một phiên, nên bạn đọc chuyện, chưa bấm được.',
      ],
    },
    {
      type: 'text',
      title: 'Lock là tấm biển "đang dùng"',
      paragraphs: [
        'Mỗi lần bạn đăng nhập vào database là một **[[session]]**. Ba người dùng cùng lúc là ba session.',
        'Khi session của bạn UPDATE một row, database đặt một **[[lock]]** lên row đó. Lock giống tấm biển "đang dùng" treo trên row.',
        'Lock chỉ giữ row đó. Các row khác vẫn tự do.',
        'Bạn giữ lock tới khi gõ COMMIT hoặc ROLLBACK. Hai lệnh này gỡ tấm biển.',
        'Session khác muốn UPDATE cùng row thì phải chờ. Màn hình của họ đứng im cho tới khi tấm biển được gỡ.',
      ],
    },
    {
      type: 'code',
      title: 'Một buổi sáng, ba người, một row',
      intro: 'Đọc từ trên xuống. Mỗi mục ghi giờ, tên người, lệnh họ chạy, và chuyện xảy ra.',
      code:
        '09:00  An    UPDATE products SET price = 48000 WHERE product_id = 2;\n' +
        '             -- An chưa COMMIT. Database giữ lock trên row số 2.\n' +
        '09:01  Bình  UPDATE products SET price = 50000 WHERE product_id = 2;\n' +
        '             -- Màn hình của Bình đứng im. Bình chờ lock của An.\n' +
        '09:02  Cúc   SELECT price FROM products WHERE product_id = 2;\n' +
        '             -- Cúc thấy 45000, giá cũ đã COMMIT. Cúc không phải chờ.\n' +
        '09:05  An    COMMIT;\n' +
        '             -- An gỡ lock. UPDATE của Bình chạy tiếp và báo 1 row updated.\n' +
        '09:06  Bình  COMMIT;\n' +
        '             -- Giá lưu hẳn là 50000. Giá 48000 của An bị ghi đè.',
      notes: [
        { find: '09:00  An    UPDATE', text: 'An bắt đầu. Row số 2 giờ có lock của An.' },
        { find: 'Màn hình của Bình đứng im', text: 'Bình không bị lỗi. Lệnh của Bình đang xếp hàng chờ lock.' },
        { find: 'Cúc thấy 45000', text: 'SELECT không chờ ai. Cúc chỉ thấy dữ liệu đã COMMIT, nên chưa thấy 48000 của An.' },
        { find: '09:05  An    COMMIT;', text: 'COMMIT của An gỡ lock. Bình được chạy ngay.' },
        { find: 'Giá 48000 của An bị ghi đè', text: 'Bình ghi sau nên giá của Bình thắng. Hai người nên nói với nhau trước khi sửa cùng row.' },
      ],
    },
    {
      type: 'text',
      title: 'Ai chờ, ai không chờ',
      paragraphs: [
        'Hai người cùng UPDATE hoặc DELETE một row thì người đến sau chờ.',
        'Người chỉ SELECT không chờ ai. Họ đọc phiên bản đã COMMIT gần nhất của row.',
        'Với database, đọc là đọc, sửa là sửa. Người đọc không chặn người sửa, và người sửa không chặn người đọc.',
        'Hai người sửa hai row khác nhau cũng không chờ nhau.',
      ],
    },
    {
      type: 'code',
      title: 'Quên COMMIT rồi đi ăn trưa',
      intro: 'Đây là chuyện hay gặp nhất ở công ty. Đọc thử.',
      code:
        '12:00  An    UPDATE products SET price = 48000 WHERE product_id = 2;\n' +
        '             -- An quên COMMIT, rồi đi ăn trưa.\n' +
        '12:05  Bình  UPDATE products SET price = 50000 WHERE product_id = 2;\n' +
        '             -- Bình chờ.\n' +
        '12:06  Bình  -- MySQL: sau 50 giây Bình thấy ERROR 1205: Lock wait timeout exceeded.\n' +
        '             -- Oracle: Bình chờ tiếp, không có hạn mặc định.\n' +
        '13:00  An    ROLLBACK;\n' +
        '             -- An quay lại, gõ ROLLBACK. Lock được gỡ.',
      notes: [
        { find: 'An quên COMMIT', text: 'Transaction của An vẫn mở, nên lock vẫn còn.' },
        { find: 'sau 50 giây Bình thấy ERROR 1205', text: 'MySQL chờ tối đa 50 giây theo cài đặt mặc định của InnoDB, rồi báo lỗi 1205. Lệnh của Bình không chạy.' },
        { find: 'Bình chờ tiếp, không có hạn mặc định', text: 'Oracle cho Bình chờ tới khi An kết thúc transaction. Bình chỉ còn cách nhắn An hoặc báo DBA.' },
        { find: '13:00  An    ROLLBACK;', text: 'Lock chỉ được gỡ khi An (hoặc session của An bị ngắt) kết thúc transaction.' },
      ],
    },
    {
      type: 'text',
      title: 'Khi bạn là người bị treo',
      paragraphs: [
        'Bước một: đừng bấm Chạy lại. Mỗi lần chạy thêm là một lệnh nữa xếp hàng chờ.',
        'Bước hai: hỏi quanh xem ai đang sửa table đó. Nhắn người đó COMMIT hoặc ROLLBACK.',
        'Bước ba: không ai nhận thì báo **[[dba]]**. DBA nhìn được ai đang giữ lock và có quyền ngắt session đó.',
        'Khi bạn là người giữ lock thì làm ngược lại. Sửa xong, kiểm xong, COMMIT hoặc ROLLBACK ngay. Đừng để transaction mở khi đi họp hay đi ăn.',
      ],
    },
    {
      type: 'text',
      title: 'Hai bên chờ lẫn nhau',
      paragraphs: [
        'Có một kiểu treo đặc biệt. An giữ row 2 và muốn row 3. Bình giữ row 3 và muốn row 2.',
        'Không ai nhường, và không ai chạy tiếp được. Đây là **[[deadlock]]**.',
        'Database tự phát hiện deadlock. Database hủy một câu lệnh của một bên để bên kia chạy tiếp.',
        'Ở Oracle, bên bị hủy nhận lỗi ORA-00060: deadlock detected while waiting for resource. Bên đó nên ROLLBACK rồi chạy lại.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'MySQL (InnoDB) chờ lock tối đa `innodb_lock_wait_timeout` giây. Giá trị mặc định là 50. Hết hạn thì báo lỗi 1205.',
        'Oracle không đặt hạn mặc định cho UPDATE. Bên chờ đứng im tới khi lock được gỡ.',
        'Cả hai database đều cho người chỉ SELECT đọc ngay, không chờ lock của người sửa.',
      ],
      mysql: "SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';\n-- Value: 50",
      oracle:
        '-- Không có số giây mặc định.\n-- UPDATE chờ tới khi người giữ lock COMMIT hoặc ROLLBACK.',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'An UPDATE row số 2 và chưa COMMIT. Bình UPDATE cùng row đó. Chuyện gì xảy ra với Bình?',
          options: [
            { text: 'Bình chờ cho tới khi An COMMIT hoặc ROLLBACK', correct: true, feedback: 'Đúng. Row số 2 đang có lock của An, nên lệnh của Bình đứng im.' },
            { text: 'Database báo lỗi ngay và Bình phải gõ lại', feedback: 'Database không báo lỗi ngay. Bình chờ, và chỉ có lỗi nếu chờ quá lâu (MySQL).' },
            { text: 'Cả hai thay đổi chạy song song', feedback: 'Hai người không sửa cùng một row cùng lúc. Người đến sau phải chờ.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Cúc chỉ chạy SELECT đọc row số 2 trong lúc An chưa COMMIT. Cúc thấy gì?',
          options: [
            { text: 'Giá cũ đã COMMIT, và Cúc không phải chờ', correct: true, feedback: 'Đúng. SELECT không bị lock chặn, và chỉ thấy dữ liệu đã COMMIT.' },
            { text: 'Giá mới của An, dù chưa COMMIT', feedback: 'Người khác chỉ thấy thay đổi của An sau khi An COMMIT.' },
            { text: 'Cúc chờ như Bình', feedback: 'Chỉ người sửa phải chờ. Người đọc thì không.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Đồng nghiệp quên COMMIT rồi đi ăn trưa, và lệnh của bạn đang treo. Bạn làm gì trước?',
          options: [
            { text: 'Nhắn đồng nghiệp COMMIT hoặc ROLLBACK, không được thì báo DBA', correct: true, feedback: 'Đúng. Chỉ người giữ lock hoặc DBA mới gỡ được lock.' },
            { text: 'Bấm Chạy liên tục cho tới khi qua', feedback: 'Mỗi lần chạy thêm là một lệnh nữa xếp hàng chờ. Dừng lại và tìm người giữ lock.' },
            { text: 'Chạy DELETE row đó để lấy lock', feedback: 'DELETE cũng phải chờ lock, và bạn xóa dữ liệu của người khác.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Sáng thứ hai, cả phòng kế toán bị treo',
      paragraphs: [
        'Chiều thứ sáu, một bạn sửa lương cuối tháng, kiểm kết quả rồi quên COMMIT. Bạn ấy đóng laptop về nhà.',
        'Sáng thứ hai, mọi người cùng mở phần mềm lương và đều đứng im. Bạn ấy phải mở lại session, gõ COMMIT, rồi cả phòng mới chạy tiếp.',
        'DBA kể lỗi này gặp mỗi tháng. Cách tránh chỉ là thói quen: sửa xong thì COMMIT hoặc ROLLBACK ngay.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'UPDATE một row thì database đặt lock lên row đó, tới khi COMMIT hoặc ROLLBACK.',
        'Người khác UPDATE cùng row phải chờ. Người chỉ SELECT thì không chờ và chỉ thấy dữ liệu đã COMMIT.',
        'Quên COMMIT làm đồng nghiệp bị treo. Sửa xong thì COMMIT hoặc ROLLBACK ngay.',
        'MySQL chờ lock tối đa 50 giây rồi báo 1205. Oracle chờ tới khi lock được gỡ.',
        'Hai bên chờ lẫn nhau là deadlock. Oracle báo ORA-00060 cho một bên.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, InnoDB Locking', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html' },
        { name: 'MySQL 8.0 Reference Manual, Consistent Nonlocking Reads', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-consistent-read.html' },
        { name: 'MySQL 8.0 Reference Manual, InnoDB Startup Options and System Variables (innodb_lock_wait_timeout)', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html' },
        { name: 'MySQL 8.0 Error Reference, server error 1205', url: 'https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html' },
        { name: 'Oracle Database 19c Concepts, Data Concurrency and Consistency', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/cncpt/data-concurrency-and-consistency.html' },
        { name: 'Oracle Database Error Help, ORA-00060', url: 'https://docs.oracle.com/en/error-help/db/ora-00060/' },
      ],
    },
  ],
};
