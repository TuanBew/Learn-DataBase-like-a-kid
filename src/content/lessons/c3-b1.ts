import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c3-b1',
  chapter: 3,
  order: 1,
  title: 'Từ tờ ghi chép tới bản thiết kế',
  lead: 'Bạn chia một tờ phiếu xin nghỉ phép thành table, column và primary key trước khi gõ một dòng SQL nào.',
  minutes: 12,
  goals: [
    'Tách một tờ ghi chép thành các nhóm thông tin',
    'Đặt cho mỗi nhóm một table và một primary key',
    'Viết bản thiết kế dạng employees(employee_id, full_name)',
    'Đặt tên table và column theo quy ước',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Tờ phiếu xin nghỉ phép',
      paragraphs: [
        'Chị Hạnh đưa mình một tờ phiếu xin nghỉ phép của công ty Sao Mai. Phiếu có các mục: họ tên, email, phòng, nơi đặt phòng, ngày bắt đầu nghỉ, ngày kết thúc, lý do, người duyệt và trạng thái.',
        'Chị nói: "Mình muốn cất những phiếu này vào database."',
        'Mình đọc kỹ tờ phiếu. Tờ phiếu lẫn ba loại thông tin. Một loại nói về người xin nghỉ. Một loại nói về phòng. Một loại nói về chính đơn xin nghỉ.',
        'Database không nhận nguyên một tờ giấy. Mỗi loại thông tin cần một chỗ riêng.',
        'Mình vẽ bản thiết kế trước, rồi mới gõ SQL. Bạn vẽ cùng mình nhé.',
      ],
    },
    {
      type: 'text',
      title: 'Mỗi loại thông tin thành một table',
      paragraphs: [
        'Đọc từng mục trên phiếu và hỏi: mục này nói về ai hay về cái gì?',
        'Các mục cùng nói về một đối tượng thì gom lại. Mỗi đối tượng thành một table. Mỗi mục thành một column.',
        'Phiếu của Sao Mai có ba đối tượng. Họ tên và email nói về nhân viên. Tên phòng và nơi đặt nói về phòng ban. Ngày nghỉ, lý do và trạng thái nói về đơn xin nghỉ.',
        'Vậy bạn có ba table: `employees`, `departments` và `leave_requests`.',
        'Tên phòng chỉ ghi ở table `departments`, một lần. Đơn xin nghỉ không chép lại tên phòng. Bài "Vì sao phải tách table" đã nói lý do.',
      ],
    },
    {
      type: 'text',
      title: 'Mỗi table có một primary key',
      paragraphs: [
        'Mỗi row cần một mã riêng để các table tìm nhau. Mã đó là primary key.',
        'Chọn một column chỉ có ở table đó và không bao giờ trùng. Tên người không đủ điều kiện, vì hai người có thể trùng tên.',
        'Vì vậy mỗi table thêm một column mã: `employee_id`, `department_id` và `request_id`.',
        'Đơn nghỉ phép cần biết ai xin. Table `leave_requests` giữ thêm column `employee_id`, trỏ về `employees`. Đây là foreign key.',
        'Người duyệt cũng là một nhân viên. Column `approved_by` giữ mã của người đó.',
      ],
    },
    {
      type: 'quiz',
      title: 'Câu hỏi nhanh',
      items: [
        {
          kind: 'match',
          question: 'Nối mỗi mục trên phiếu với table sẽ giữ nó.',
          pairs: [
            { left: 'Email của nhân viên', right: 'employees' },
            { left: 'Nơi đặt của phòng', right: 'departments' },
            { left: 'Ngày bắt đầu nghỉ', right: 'leave_requests' },
          ],
          done: 'Đúng hết rồi. Mỗi mục về một đối tượng thì nằm ở table của đối tượng đó.',
        },
        {
          kind: 'choice',
          question: 'Table employees nên dùng column nào làm primary key?',
          options: [
            { text: 'full_name', feedback: 'Hai nhân viên có thể trùng họ tên. Primary key không được trùng.' },
            { text: 'employee_id', correct: true, feedback: 'Đúng. Mỗi nhân viên có một mã riêng, không ai trùng.' },
            { text: 'department_id', feedback: 'Nhiều nhân viên cùng một phòng, nên mã phòng bị trùng.' },
          ],
        },
      ],
    },
    {
      type: 'text',
      title: 'Viết bản thiết kế',
      paragraphs: [
        'Bản thiết kế liệt kê table và column của database. Dân IT gọi nó là **[[schema]]**.',
        'Mỗi table viết thành một dòng: tên table, rồi các column trong ngoặc tròn.',
        'Ba table của Sao Mai: `departments(department_id, name, location)`, `employees(employee_id, full_name, email, department_id)` và `leave_requests(request_id, employee_id, start_date, end_date, reason, status, approved_by)`.',
        'Column đầu tiên của mỗi table là primary key. Column `department_id` trong `employees` là foreign key trỏ về `departments`.',
        'Bài sau dạy chọn data type cho từng column. Bản thiết kế này chưa cần data type.',
      ],
    },
    {
      type: 'text',
      title: 'Quy ước đặt tên',
      paragraphs: [
        'Cả khóa học đặt tên theo bốn quy ước.',
        'Dùng chữ thường, không dấu, nối bằng dấu gạch dưới. Ví dụ `start_date`.',
        'Tên table ở số nhiều: `employees`. Tên column ở số ít: `full_name`.',
        'Primary key đặt theo mẫu tên table số ít cộng `_id`. Ví dụ `employee_id`.',
        'Tên phải nói rõ column giữ gì. Tránh viết tắt khó đoán.',
        'Oracle đổi tên không đặt trong ngoặc kép thành chữ hoa. Bạn gõ `full_name`, Oracle in `FULL_NAME`. MySQL in đúng chữ bạn gõ.',
      ],
    },
    {
      type: 'quiz',
      title: 'Hai câu cuối',
      items: [
        {
          kind: 'choice',
          question: 'Tên column nào đúng quy ước của khóa học?',
          options: [
            { text: 'Ngày Bắt Đầu', feedback: 'Tên có dấu cách và chữ có dấu. Dùng chữ thường không dấu, nối bằng gạch dưới.' },
            { text: 'start_date', correct: true, feedback: 'Đúng. Chữ thường, không dấu, nối bằng gạch dưới.' },
            { text: 'StartDate', feedback: 'Quy ước của khóa học nối các chữ bằng gạch dưới, viết thường hết.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn tạo column tên full_name trên Oracle và không đặt trong ngoặc kép. Oracle in tên column thế nào?',
          options: [
            { text: 'FULL_NAME', correct: true, feedback: 'Đúng. Oracle đổi tên không có ngoặc kép thành chữ hoa.' },
            { text: 'full_name', feedback: 'Đó là cách MySQL in. Oracle đổi tên thành chữ hoa.' },
            { text: 'Full_Name', feedback: 'Oracle không viết hoa riêng chữ cái đầu. Oracle viết hoa cả tên.' },
          ],
        },
      ],
    },
    {
      type: 'realworld',
      title: 'File Excel hai mươi column',
      paragraphs: [
        'Một bạn mới vào công ty nhận file Excel theo dõi nghỉ phép, có hai mươi column. Phòng hành chính muốn chuyển file vào database.',
        'Bạn vẽ ra giấy trước. File này nói về ai? Về phòng nào? Về đơn nào? Ra ba nhóm, tức ba table.',
        'Bước vẽ mất mười phút. Nhờ nó, câu CREATE TABLE sau đó viết một lần là xong, và không phải sửa table giữa chừng.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Một tờ ghi chép lẫn nhiều đối tượng. Mỗi đối tượng thành một table, mỗi mục thành một column.',
        'Mỗi table có một primary key. Table khác trỏ tới nó bằng foreign key.',
        'Bản thiết kế viết dạng employees(employee_id, full_name).',
        'Đặt tên chữ thường, nối bằng gạch dưới. Table ở số nhiều, column ở số ít.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Harvard CS50 SQL, Lecture 1: Relating', url: 'https://cs50.harvard.edu/sql/notes/1/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Harvard CS50 SQL, Lecture 2: Designing', url: 'https://cs50.harvard.edu/sql/notes/2/', note: 'CC BY-NC-SA 4.0' },
        { name: 'Oracle Database 19c SQL Language Reference: Database Object Names and Qualifiers', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Database-Object-Names-and-Qualifiers.html' },
      ],
    },
  ],
};
