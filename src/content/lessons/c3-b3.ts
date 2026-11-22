import type { Lesson } from '../types';

const mysqlMain = `CREATE TABLE departments (
  department_id INT,
  name VARCHAR(50),
  location VARCHAR(50)
);
SELECT * FROM departments;`;

const oracleMain = `CREATE TABLE departments (
  department_id NUMBER,
  name VARCHAR2(50),
  location VARCHAR2(50)
);
SELECT * FROM departments;`;

export const lesson: Lesson = {
  id: 'c3-b3',
  chapter: 3,
  order: 3,
  title: 'Câu CREATE TABLE đầu tiên',
  lead: 'Bạn tự viết một câu tạo table, chạy nó, rồi sửa ba lỗi hay gặp.',
  minutes: 15,
  goals: [
    'Viết câu CREATE TABLE từ tờ ghi chép column và data type',
    'Chạy câu đó và thấy table rỗng hiện ra',
    'Đọc lỗi khi thiếu dấu phẩy',
    'Xử lý lỗi table đã tồn tại và lỗi data type viết sai',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Dịch tờ giấy thành SQL',
      paragraphs: [
        'Ở bài 1, bạn ghi lên giấy những thứ công ty Sao Mai cần nhớ về phòng ban. Mỗi phòng có một mã, một tên và một nơi đặt.',
        'Ở bài 2, bạn chọn data type cho từng thứ. Mã phòng là số nguyên. Tên phòng và nơi đặt là chữ, tối đa 50 ký tự.',
        'Tờ giấy đã đủ. Nhưng database không đọc được chữ viết tay.',
        'Mình nói: "Mình chỉ hiểu SQL. Bạn dịch tờ giấy thành một câu SQL, mình sẽ dựng table ra cho bạn xem."',
        'Câu SQL đó có tên riêng. Bạn sẽ gõ nó ngay bây giờ.',
      ],
    },
    {
      type: 'text',
      title: 'Một câu CREATE TABLE',
      paragraphs: [
        '**[[create-table]]** là lệnh tạo một table mới.',
        'Câu CREATE TABLE ghi tên table trước. Sau đó là danh sách column nằm trong cặp ngoặc tròn.',
        'Mỗi column viết theo mẫu: tên column, dấu cách, data type. Ví dụ `name VARCHAR(50)`.',
        'Dấu phẩy ngăn các column với nhau. Column cuối cùng không có dấu phẩy.',
        'Thứ tự column trong câu là thứ tự column khi bạn viết `SELECT *`.',
        'Đặt tên bằng chữ thường, không dấu, nối bằng dấu gạch dưới. Ví dụ `department_id`.',
        'Table mới tạo chưa có row nào. `SELECT *` chỉ trả về tên column.',
        'Mỗi tên table chỉ dùng một lần trong một database. Tên đã có thì DBMS từ chối.',
        'Khi câu viết sai, DBMS không chạy gì cả. Table không hiện ra, kể cả một nửa.',
      ],
    },
    {
      type: 'workshop',
      title: 'Dựng table departments',
      intro: 'Bấm Chạy. Lệnh tạo table departments, rồi bạn xem table đó.',
      start: 'empty',
      dialects: ['mysql', 'oracle'],
      sql: { mysql: mysqlMain, oracle: oracleMain },
      tries: [
        {
          label: 'Tạo lần hai',
          expect: 'error',
          sql: {
            mysql: 'CREATE TABLE departments (department_id INT, name VARCHAR(50), location VARCHAR(50));',
            oracle: 'CREATE TABLE departments (department_id NUMBER, name VARCHAR2(50), location VARCHAR2(50));',
          },
        },
        {
          label: 'Thiếu dấu phẩy',
          expect: 'error',
          sql: {
            mysql: 'CREATE TABLE departments_copy (\n  department_id INT,\n  name VARCHAR(50)\n  location VARCHAR(50)\n);',
            oracle: 'CREATE TABLE departments_copy (\n  department_id NUMBER,\n  name VARCHAR2(50)\n  location VARCHAR2(50)\n);',
          },
        },
        {
          label: 'Data type viết sai',
          expect: 'error',
          sql: {
            mysql: 'CREATE TABLE departments_copy (\n  department_id INT,\n  name VARCHR(50),\n  location VARCHAR(50)\n);',
            oracle: 'CREATE TABLE departments_copy (\n  department_id NUMBER,\n  name VARCHR2(50),\n  location VARCHAR2(50)\n);',
          },
        },
        {
          label: 'Sửa lỗi, đổi tên table',
          sql: {
            mysql: 'CREATE TABLE departments_copy (\n  department_id INT,\n  name VARCHAR(50),\n  location VARCHAR(50)\n);\nSELECT * FROM departments_copy;',
            oracle: 'CREATE TABLE departments_copy (\n  department_id NUMBER,\n  name VARCHAR2(50),\n  location VARCHAR2(50)\n);\nSELECT * FROM departments_copy;',
          },
        },
        {
          label: 'Viết chữ thường hết',
          sql: {
            mysql: 'create table meeting_rooms (room_id int, room_name varchar(30), capacity int);\nselect * from meeting_rooms;',
            oracle: 'create table meeting_rooms (room_id number, room_name varchar2(30), capacity number);\nselect * from meeting_rooms;',
          },
        },
      ],
      say: 'Table nào hiện ra cũng rỗng, vì mình chưa nhận row nào. Chỗ xuống dòng và chữ hoa chữ thường chỉ để bạn đọc cho dễ.',
    },
    {
      type: 'text',
      title: 'Đọc lỗi',
      paragraphs: [
        '**[[error-code]]** là con số DBMS gửi kèm lời báo lỗi. Tra con số này là cách nhanh nhất để hiểu lỗi.',
        'Ba lỗi trong bài này gặp nhiều nhất khi mới tập tạo table.',
        'Thiếu dấu phẩy: MySQL báo 1064 và chỉ vào chữ đứng sau chỗ sai, sau cụm "near". Oracle báo ORA-00907.',
        'Table đã tồn tại: MySQL báo 1050. Oracle báo ORA-00955.',
        'Data type viết sai: MySQL báo 1064 và chỉ vào chữ viết sai. Oracle báo ORA-00902.',
        'Lỗi thường nằm ngay trước chữ mà MySQL chỉ tới. Bạn tìm ở đó trước.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle dùng NUMBER cho số và VARCHAR2 cho chữ. DATE viết giống MySQL.',
        'Oracle nhận cả `INT` và `VARCHAR`, nhưng code Oracle ở công ty viết NUMBER và VARCHAR2. Khóa học dùng hai chữ này cho Oracle.',
        'CREATE TABLE ở Oracle tự COMMIT. Bạn không cần gõ thêm COMMIT, và không ROLLBACK lại được.',
        'Lệnh `DESC departments` ở Oracle là lệnh của tool như SQL*Plus hay SQL Developer. Server không nhận nó như một câu SQL. Ở MySQL, `DESC` là lệnh SQL thật.',
        'Oracle lưu tên không đặt trong ngoặc kép thành chữ hoa. Bạn gõ `departments`, Oracle ghi `DEPARTMENTS`. Query vẫn gõ chữ thường được.',
      ],
      mysql: 'CREATE TABLE departments (\n  department_id INT,\n  name VARCHAR(50),\n  location VARCHAR(50)\n);',
      oracle: 'CREATE TABLE departments (\n  department_id NUMBER,\n  name VARCHAR2(50),\n  location VARCHAR2(50)\n);',
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Câu CREATE TABLE có hai column mà thiếu dấu phẩy giữa chúng. Chuyện gì xảy ra?',
          options: [
            { text: 'Database tạo table với column đầu rồi bỏ qua column sau', feedback: 'Không có table nào hiện ra. Câu viết sai thì database không chạy gì cả.' },
            { text: 'Database báo lỗi và không tạo table', correct: true, feedback: 'Đúng. MySQL báo 1064 và chỉ vào chữ sau chỗ sai.' },
            { text: 'Database tự thêm dấu phẩy', feedback: 'Database không đoán ý bạn. Câu sai thì database dừng lại và báo lỗi.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn chạy một câu CREATE TABLE departments hai lần liên tiếp. Lần hai ra sao?',
          options: [
            { text: 'Table có hai bản, mỗi bản một nửa', feedback: 'Database không tạo hai table cùng tên.' },
            { text: 'Lần hai ghi đè table cũ', feedback: 'Database không ghi đè. Muốn xóa table cũ, bạn cần một lệnh riêng ở bài 10.' },
            { text: 'Lần hai báo lỗi 1050 trên MySQL hoặc ORA-00955 trên Oracle', correct: true, feedback: 'Đúng. Table departments đã có từ lần một, nên tên này bị chiếm.' },
            { text: 'Lần hai chạy thành công và không đổi gì', feedback: 'Lần hai báo lỗi, không im lặng. Database nói rõ tên đã có.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn viết name VARCHR(50). Bạn thấy gì?',
          options: [
            { text: 'Database hiểu là VARCHAR và tạo table', feedback: 'Database không đoán chữ gõ sai. Data type phải đúng từng chữ.' },
            { text: 'Database báo lỗi. MySQL chỉ vào VARCHR, Oracle báo ORA-00902', correct: true, feedback: 'Đúng. Đọc lỗi, sửa data type, rồi bấm Chạy lại.' },
            { text: 'Table hiện ra nhưng column name để trống', feedback: 'Câu sai thì không có table nào hiện ra.' },
          ],
        },
      ],
    },
    { type: 'exercise', exerciseIds: ['c3-e2'] },
    {
      type: 'realworld',
      title: 'Chạy lại script cũ',
      paragraphs: [
        'Một bạn mới vào công ty nhận file script có sẵn câu CREATE TABLE. Bạn chạy script trên database thử và nó chạy ổn.',
        'Hôm sau bạn chạy lại script đó vì nghĩ mình quên lưu. Database báo ORA-00955, vì table đã có từ hôm qua.',
        'Bạn không cần sửa gì. Lỗi này chỉ báo table đã tồn tại. Bạn đọc mã lỗi, hiểu ngay chuyện gì xảy ra và chuyển sang bước tiếp theo.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'CREATE TABLE ghi tên table, rồi liệt kê từng column kèm data type trong ngoặc tròn.',
        'Dấu phẩy ngăn các column. Column cuối không có dấu phẩy.',
        'Table mới tạo rỗng. Mỗi tên table chỉ dùng một lần.',
        'Gặp lỗi thì đọc mã lỗi trước. MySQL chỉ vào chữ đứng sau chỗ sai.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'SQLBolt, Lesson 16: Creating tables', url: 'https://sqlbolt.com/lesson/creating_tables' },
        { name: 'MySQL 8.0 Reference Manual: CREATE TABLE Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/create-table.html' },
        { name: 'Oracle Database 19c SQL Language Reference: CREATE TABLE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-TABLE.html' },
      ],
    },
  ],
};
