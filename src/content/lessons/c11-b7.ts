import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c11-b7',
  chapter: 11,
  order: 7,
  title: 'MySQL và Oracle khác nhau ở đâu',
  lead: 'Bạn ôn mọi khác biệt đã gặp và học cách đọc mã lỗi của Oracle.',
  minutes: 18,
  goals: [
    'Nhớ các khác biệt chính giữa MySQL và Oracle',
    'Biết lệnh xem cấu trúc của từng dialect',
    'Biết cách đọc một mã lỗi Oracle',
    'Đoán nguyên nhân của bảy mã ORA hay gặp',
    'Biết khóa học này dạy theo Oracle 19c',
  ],
  blocks: [
    {
      type: 'story',
      title: 'File query từ đồng nghiệp',
      paragraphs: [
        'Một đồng nghiệp gửi bạn file query. Anh ấy viết cho MySQL, và file chạy tốt ở đó.',
        'Công ty bạn dùng Oracle. Bạn dán file vào, bấm Chạy, và màn hình hiện một loạt mã lỗi.',
        'Bi nhìn qua và nói: "Mỗi mã lỗi là một lời chỉ đường. Bạn chỉ cần biết đọc."',
        'Bài này gom các khác biệt bạn đã gặp, rồi dạy cách đọc mã lỗi.',
      ],
    },
    {
      type: 'scene',
      scene: 'dialect-table',
      title: 'Trang tra cứu MySQL và Oracle',
      intro: 'Bấm vào từng chủ đề. Bạn thấy hai cách viết cạnh nhau và mã lỗi hay gặp.',
    },
    {
      type: 'text',
      title: 'Giữ row và sắp xếp',
      paragraphs: [
        'Lấy năm row đầu: MySQL viết `LIMIT 5`. Oracle viết `FETCH FIRST 5 ROWS ONLY`.',
        'Bỏ qua m row: MySQL viết `OFFSET m`. Oracle viết `OFFSET m ROWS`.',
        'Sắp tăng dần: MySQL đặt NULL lên đầu. Oracle đặt NULL xuống cuối.',
        'Oracle cho đổi thứ tự này bằng `NULLS FIRST` hoặc `NULLS LAST`.',
      ],
    },
    {
      type: 'text',
      title: 'Tên, chữ và dấu nháy',
      paragraphs: [
        'Alias của table: MySQL nhận AS. Oracle không nhận AS trước alias của table.',
        'Chữ nằm trong nháy đơn ở cả hai dialect. MySQL nhận cả nháy kép. Oracle dùng nháy kép để bao tên column.',
        'So chữ: MySQL không phân biệt hoa thường và dấu theo mặc định. Oracle có phân biệt.',
        'Tên không có nháy kép: Oracle hiểu thành chữ hoa.',
        'Nối chuỗi: MySQL viết `CONCAT(a, b)`. Oracle viết `a || b`.',
        'Ở MySQL, `||` mặc định là OR. CONCAT của Oracle chỉ nhận hai tham số.',
      ],
    },
    {
      type: 'text',
      title: 'Ngày, số và NULL',
      paragraphs: [
        'Giờ hiện tại: MySQL viết `NOW()`. Oracle viết `SYSDATE`.',
        'Định dạng ngày: MySQL dùng `DATE_FORMAT`. Oracle dùng `TO_CHAR`.',
        "Chuỗi thành ngày: MySQL dùng `STR_TO_DATE`. Oracle dùng `TO_DATE`, hoặc viết `DATE '2026-03-02'`.",
        'DATE của Oracle có cả giờ. Khi lọc theo ngày, dùng khoảng `>=` và `<` để khỏi sót row.',
        'Cộng tháng: MySQL viết `DATE_ADD(d, INTERVAL 1 MONTH)`. Oracle viết `ADD_MONTHS(d, 1)`. Cộng ngày ở Oracle chỉ cần `d + 7`.',
        'Chia lấy dư: MySQL có `%`. Oracle chỉ có `MOD(a, b)`.',
        'Chuỗi rỗng: MySQL coi là một giá trị. Oracle coi là NULL.',
        'Thay NULL: MySQL viết `IFNULL`. Oracle viết `NVL`. `COALESCE` chạy ở cả hai.',
        'SELECT không có FROM: MySQL chạy được. Oracle 19c cần `FROM DUAL`.',
        'Oracle 26ai nới vài luật, ví dụ cho SELECT không cần FROM DUAL. Khóa học này dạy theo 19c.',
      ],
    },
    {
      type: 'text',
      title: 'Tạo table và sửa dữ liệu',
      paragraphs: [
        'Data type: MySQL viết `INT`, `VARCHAR`, `DATETIME`. Oracle viết `NUMBER`, `VARCHAR2`, `DATE`.',
        'Id tự tăng: MySQL viết `AUTO_INCREMENT`. Oracle viết `GENERATED AS IDENTITY`.',
        'INSERT nhiều row trong một câu: MySQL nhận. Oracle 19c không nhận.',
        'Lưu thay đổi: MySQL tự COMMIT sau mỗi lệnh. Tool Oracle thường chờ bạn gõ COMMIT.',
        'Lệnh DDL như CREATE TABLE tự COMMIT ở Oracle.',
      ],
    },
    {
      type: 'text',
      title: 'Gom nhóm, nối table và ghép kết quả',
      paragraphs: [
        "Gộp chữ trong nhóm: MySQL viết `GROUP_CONCAT(name)`. Oracle viết `LISTAGG(name, ', ') WITHIN GROUP (ORDER BY name)`.",
        'FULL OUTER JOIN: Oracle có. MySQL không có. Ở MySQL, bạn ghép LEFT JOIN và RIGHT JOIN bằng UNION.',
        'Lấy row của query trước mà query sau không có: Oracle 19c viết `MINUS`. MySQL 8 viết `EXCEPT`.',
        'Viết chữ của dialect kia thì báo lỗi. Oracle gặp EXCEPT báo ORA-00933. MySQL gặp MINUS báo lỗi 1064.',
        'Dấu `(+)` và `DECODE` chỉ có ở Oracle. MySQL dùng LEFT JOIN và CASE.',
      ],
    },
    {
      type: 'text',
      title: 'Xem cấu trúc database',
      paragraphs: [
        'Liệt kê table: MySQL viết `SHOW TABLES`. Oracle viết `SELECT table_name FROM user_tables`.',
        'Xem column của một table: cả hai nhận `DESC orders`. MySQL còn nhận `DESCRIBE orders`.',
        'Ở Oracle, DESC là lệnh của tool, không phải câu SQL. Ở MySQL, DESC và SHOW là lệnh của chính server.',
        'Xem câu tạo table: MySQL viết `SHOW CREATE TABLE orders`. Oracle đọc data dictionary, như `USER_TAB_COLUMNS` và `USER_CONSTRAINTS`.',
        'Gõ `SHOW TABLES` ở Oracle báo ORA-00900. Tên trong data dictionary của Oracle viết hoa.',
      ],
    },
    {
      type: 'text',
      title: 'Đọc một mã lỗi Oracle',
      paragraphs: [
        '**[[error-code]]** của Oracle gồm chữ ORA, dấu gạch ngang và năm chữ số.',
        'Đọc mã trước, rồi đọc câu giải thích đi kèm. Bảy mã dưới đây hay gặp nhất, mỗi mã kèm nguyên nhân thường thấy.',
        'ORA-00933: thường do viết thừa hoặc sai chỗ. Ví dụ AS trước alias của table, LIMIT, hoặc INSERT nhiều row.',
        'ORA-00942: thường do gõ sai tên table, hoặc table chưa được tạo.',
        'ORA-00904: thường do tên column sai, hoặc chữ bị bao bằng nháy kép.',
        'ORA-00923: thường do SELECT thiếu FROM, như `SELECT 1 + 1`.',
        'ORA-00936: thường do thiếu một biểu thức, như dấu phẩy thừa ngay trước FROM.',
        'ORA-00979: thường do column trong SELECT không nằm trong GROUP BY.',
        'ORA-01722: thường do Oracle cần một con số nhưng gặp chữ không phải số.',
        'MySQL cũng báo bằng con số. Lỗi 1064 là sai cú pháp. Lỗi 1146 là table không có. Lỗi 1054 là column không có.',
      ],
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn chạy `SELECT name FROM products LIMIT 3` trên Oracle. Oracle báo mã nào?',
          options: [
            { text: 'ORA-00933', correct: true, feedback: 'Đúng. Oracle không hiểu LIMIT, nên coi câu lệnh kết thúc sai chỗ. Viết FETCH FIRST 3 ROWS ONLY.' },
            { text: 'ORA-00942', feedback: 'ORA-00942 báo table không có. Table products vẫn có.' },
            { text: 'ORA-00979', feedback: 'ORA-00979 liên quan tới GROUP BY. Query này không có GROUP BY.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `SELECT 1 + 1` trên Oracle 19c. Oracle báo mã nào?',
          options: [
            { text: 'ORA-00923, vì thiếu FROM', correct: true, feedback: 'Đúng. Ở 19c, thêm `FROM DUAL` là chạy.' },
            { text: 'ORA-01722, vì 1 không phải số', feedback: '1 là một con số. Lỗi nằm ở chỗ thiếu FROM.' },
            { text: 'Không lỗi, Oracle trả 2', feedback: 'Oracle 26ai làm được. Khóa học này dạy 19c, và 19c báo lỗi.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy `SELECT a FROM t1 EXCEPT SELECT a FROM t2` trên Oracle 19c. Chuyện gì xảy ra?',
          options: [
            { text: 'Oracle báo ORA-00933. Hãy viết MINUS', correct: true, feedback: 'Đúng. Oracle 19c dùng MINUS. MySQL 8 dùng EXCEPT.' },
            { text: 'Oracle chạy bình thường', feedback: 'EXCEPT là chữ của MySQL. Oracle 19c báo lỗi.' },
            { text: 'Oracle báo ORA-00942', feedback: 'ORA-00942 báo table không có. Lỗi này nằm ở chữ EXCEPT.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mã lỗi với nguyên nhân thường thấy.',
          pairs: [
            { left: 'ORA-00942', right: 'Gõ sai tên table' },
            { left: 'ORA-00904', right: 'Tên column sai' },
            { left: 'ORA-00979', right: 'Column ngoài GROUP BY' },
            { left: 'ORA-01722', right: 'Cần số nhưng gặp chữ' },
          ],
          done: 'Đúng hết. Gặp mã lạ, bạn có thể tra mã đó trong tài liệu của Oracle.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Công ty chạy cả hai',
      paragraphs: [
        'Một công ty có thể dùng MySQL cho hệ thống này và Oracle cho hệ thống khác.',
        'Người viết query ở đó cần đọc được cả hai dialect, và biết mã lỗi nào báo điều gì.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'MySQL và Oracle khác nhau ở: LIMIT hay FETCH FIRST, nối chuỗi, ngày giờ, chuỗi rỗng, alias của table, data type, id tự tăng, cách lưu thay đổi.',
        'Khác nhau cả ở FULL OUTER JOIN, MINUS và EXCEPT, LISTAGG và GROUP_CONCAT, NVL và IFNULL, TO_CHAR và DATE_FORMAT, ADD_MONTHS và DATE_ADD.',
        'Xem cấu trúc: MySQL có SHOW TABLES, DESCRIBE, SHOW CREATE TABLE. Oracle có DESC của tool và data dictionary.',
        'Mã ORA có năm chữ số. Đọc mã rồi đọc câu giải thích đi kèm.',
        'ORA-00933, 00942, 00904, 00923, 00936, 00979, 01722 là bảy mã hay gặp nhất.',
        'Khóa học này dạy theo Oracle 19c. Oracle 26ai nới vài luật.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'MySQL 8.0 Reference Manual, SELECT', url: 'https://dev.mysql.com/doc/refman/8.0/en/select.html' },
        { name: 'MySQL 8.0 Reference Manual, START TRANSACTION, COMMIT, and ROLLBACK', url: 'https://dev.mysql.com/doc/refman/8.0/en/commit.html' },
        { name: 'Oracle Database 19c SQL Language Reference, SELECT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, Nulls', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Nulls.html' },
        { name: 'Oracle Database 19c SQL Language Reference, LISTAGG', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/LISTAGG.html' },
        { name: 'MySQL 8.0 Reference Manual, Aggregate Functions', url: 'https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html' },
        { name: 'Oracle Database 19c SQL Language Reference, COMMIT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/COMMIT.html' },
        { name: 'Oracle Database Error Help, ORA-00933', url: 'https://docs.oracle.com/en/error-help/db/ora-00933/' },
      ],
    },
  ],
};
