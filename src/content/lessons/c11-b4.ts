import type { Lesson } from '../types';

export const lesson: Lesson = {
  id: 'c11-b4',
  chapter: 11,
  order: 4,
  title: 'Quyền: vì sao mình chỉ đọc được',
  lead: 'Bạn hiểu vì sao tài khoản của bạn đọc được mà không sửa được, và xin quyền đúng cách.',
  minutes: 12,
  goals: [
    'Hiểu mỗi user có một bộ quyền riêng cho từng table',
    'Đọc hiểu câu GRANT và REVOKE',
    'Phân biệt ORA-00942 và ORA-01031',
    'Biết xin quyền từ người quản trị thay vì tìm cách vòng',
  ],
  blocks: [
    {
      type: 'story',
      title: 'Đọc được mà không sửa được',
      paragraphs: [
        'Bạn nhận yêu cầu sửa một con số trong table employees của phòng nhân sự. Bạn gõ SELECT và thấy đủ dữ liệu.',
        'Bạn gõ UPDATE. Database trả lời: ORA-01031: insufficient privileges.',
        'Bạn thử lại và lỗi vẫn thế. Bạn tự hỏi mình gõ sai chỗ nào.',
        'Bi nói: bạn không gõ sai. Tài khoản của bạn có quyền đọc, và chưa có quyền sửa. Công ty cấp quyền như vậy có chủ ý.',
      ],
    },
    {
      type: 'text',
      title: 'Mỗi user có một bộ quyền',
      paragraphs: [
        '**[[db-user]]** là tài khoản đăng nhập vào database. Mỗi người trong công ty thường có user riêng.',
        '**[[privilege]]** là một thao tác database cho phép user làm trên một table. Ví dụ quyền SELECT cho đọc. Quyền INSERT, UPDATE và DELETE cho sửa.',
        'Quyền cấp riêng cho từng table. Bạn có thể đọc table A, sửa table B, và không đụng được table C.',
        'Hình dung một tòa nhà văn phòng. Thẻ của bạn mở cửa tầng của mình. Thẻ không mở phòng server và phòng tài chính.',
        'Công ty cấp quyền theo công việc. Nhân viên báo cáo chỉ cần đọc. Người nhập liệu cần thêm và sửa. Chỉ ít người được xóa.',
      ],
    },
    {
      type: 'text',
      title: 'Người quản trị cấp và thu quyền',
      paragraphs: [
        'Người quản trị database cấp quyền bằng **[[grant]]**.',
        'Họ thu quyền lại bằng **[[revoke]]**.',
        'Bạn thường không có quyền GRANT trên table của người khác. Người quản trị hoặc chủ của table mới cấp quyền được.',
        'Bạn vẫn cần đọc hiểu câu GRANT. Khi xin quyền, bạn nói đúng tên quyền và tên table.',
      ],
    },
    {
      type: 'code',
      title: 'Đọc hiểu câu GRANT',
      intro: 'Hai lệnh này thuộc về người quản trị. Bạn đọc để hiểu, không cần chạy.',
      code:
        'GRANT SELECT ON hr.employees TO an;\nGRANT INSERT, UPDATE ON hr.employees TO an;\nREVOKE UPDATE ON hr.employees FROM an;',
      notes: [
        { find: 'GRANT SELECT', text: 'GRANT cấp quyền. SELECT là quyền được cấp: cho phép đọc.' },
        { find: 'INSERT, UPDATE', text: 'Cấp nhiều quyền trong một câu: viết các quyền cách nhau bằng dấu phẩy.' },
        { find: 'ON hr.employees', text: 'Quyền áp dụng cho table employees của user hr. Phần trước dấu chấm là chủ của table, phần sau là tên table.' },
        { find: 'TO an', text: 'Người nhận quyền là user an. GRANT dùng TO.' },
        { find: 'REVOKE UPDATE', text: 'REVOKE thu quyền lại. Sau câu này an không còn sửa được table, và vẫn đọc được. REVOKE dùng FROM thay cho TO.' },
      ],
    },
    {
      type: 'text',
      title: 'Hai mã lỗi hay gặp',
      paragraphs: [
        '**ORA-01031: insufficient privileges** nghĩa là thiếu quyền. Bạn thấy table, nhưng chưa có quyền làm việc bạn gõ. Ví dụ UPDATE khi chỉ có SELECT.',
        '**ORA-00942: table or view does not exist** nghĩa là Oracle không tìm thấy table, hoặc table đó không tồn tại với bạn.',
        'Tài liệu Oracle ghi rõ mã này có thể liên quan tới quyền. Table có thật nhưng bạn chưa có quyền gì trên nó thì Oracle cũng báo ORA-00942.',
        'Vì vậy ORA-00942 cần hai lần kiểm. Lần một: tên table và tên chủ có đúng không, ví dụ `hr.employees`. Lần hai: hỏi người quản trị bạn có quyền SELECT chưa.',
        'MySQL báo lỗi 1142 khi user thiếu quyền trên table.',
      ],
    },
    {
      type: 'text',
      title: 'Gặp lỗi quyền thì làm gì',
      paragraphs: [
        'Nhắn người quản trị. Nói bốn điều: tên user của bạn, tên table, quyền bạn cần, và lý do.',
        'Ví dụ: "Em là an. Em cần quyền UPDATE trên hr.employees để sửa mức lương theo phiếu số 123."',
        'Đừng tìm cách vòng. Đừng mượn tài khoản của đồng nghiệp, và đừng nhờ ai chạy hộ lệnh bạn không được phép chạy.',
        'Quyền tồn tại để bảo vệ dữ liệu. Cách vòng làm mất dấu vết ai sửa gì. Chuyện này ảnh hưởng tới cả công ty.',
      ],
    },
    {
      type: 'oracle',
      body: [
        'Oracle báo ORA-00942 khi table không tồn tại, hoặc khi bạn không có quyền thấy nó. Oracle báo ORA-01031 khi bạn thấy table nhưng thiếu quyền làm việc bạn gõ.',
        'MySQL báo lỗi 1142 khi thiếu quyền trên table.',
        'Cả hai database đều dùng GRANT và REVOKE theo mẫu `GRANT quyền ON table TO user`.',
      ],
      mysql: 'GRANT SELECT ON hr.employees TO an;\n-- thiếu quyền thì báo lỗi 1142',
      oracle: 'GRANT SELECT ON hr.employees TO an;\n-- thiếu quyền thì báo ORA-01031 hoặc ORA-00942',
    },
    {
      type: 'quiz',
      title: 'Kiểm tra nhanh',
      items: [
        {
          kind: 'choice',
          question: 'Bạn chạy SELECT trên hr.employees và đọc được. Bạn chạy UPDATE và nhận ORA-01031. Nguyên nhân là gì?',
          options: [
            { text: 'User của bạn có quyền SELECT và chưa có quyền UPDATE', correct: true, feedback: 'Đúng. Quyền cấp riêng từng loại. Nhắn người quản trị xin quyền UPDATE nếu công việc cần.' },
            { text: 'Câu UPDATE viết sai cú pháp', feedback: 'Sai cú pháp báo ORA-00933, không phải ORA-01031.' },
            { text: 'Table employees không tồn tại', feedback: 'Table có thật vì SELECT đọc được.' },
          ],
        },
        {
          kind: 'choice',
          question: 'Bạn gõ SELECT trên một table có thật của người khác và nhận ORA-00942. Bạn nên làm gì?',
          options: [
            { text: 'Kiểm lại tên table và tên chủ, rồi hỏi người quản trị về quyền SELECT', correct: true, feedback: 'Đúng. ORA-00942 báo cả khi table không có và khi bạn thiếu quyền thấy nó.' },
            { text: 'Nhờ đồng nghiệp chạy hộ bằng tài khoản của họ', feedback: 'Mượn tài khoản làm mất dấu vết và phạm quy định bảo mật. Hãy xin quyền đúng cách.' },
            { text: 'Tạo một table mới tên giống thế', feedback: 'Table mới là table khác, không có dữ liệu bạn cần.' },
          ],
        },
        {
          kind: 'match',
          question: 'Nối mỗi từ với ý của nó.',
          pairs: [
            { left: 'GRANT', right: 'Người quản trị cấp quyền' },
            { left: 'REVOKE', right: 'Người quản trị thu quyền lại' },
            { left: 'SELECT (quyền)', right: 'Cho phép đọc dữ liệu' },
            { left: 'ORA-01031', right: 'Thiếu quyền làm việc bạn gõ' },
            { left: 'ORA-00942', right: 'Không thấy table: không có, hoặc không có quyền thấy' },
          ],
          done: 'Đúng hết. Biết năm thứ này, bạn đọc được hầu hết lỗi quyền.',
        },
      ],
    },
    {
      type: 'realworld',
      title: 'Phiếu xin quyền',
      paragraphs: [
        'Ở nhiều công ty, xin quyền đi qua một phiếu hoặc email gửi người quản trị. Phiếu ghi tên user, tên table, quyền cần, lý do và người duyệt.',
        'Người quản trị cấp đúng quyền cần, không hơn. Khi công việc xong, họ có thể REVOKE để thu lại.',
      ],
    },
    {
      type: 'keypoints',
      items: [
        'Mỗi user có một bộ quyền riêng cho từng table.',
        'Quyền SELECT cho đọc. Quyền INSERT, UPDATE, DELETE cho sửa.',
        'Người quản trị cấp quyền bằng GRANT và thu bằng REVOKE: GRANT SELECT ON hr.employees TO an.',
        'ORA-01031 là thiếu quyền. ORA-00942 hiện cả khi table không có và khi bạn không có quyền thấy nó.',
        'Gặp lỗi quyền thì nhắn người quản trị tên table, quyền cần và lý do. Không tìm cách vòng.',
      ],
    },
    {
      type: 'sources',
      items: [
        { name: 'Oracle Database 19c SQL Language Reference, GRANT', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GRANT.html' },
        { name: 'Oracle Database 19c SQL Language Reference, REVOKE', url: 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/REVOKE.html' },
        { name: 'Oracle Database error help, ORA-00942', url: 'https://docs.oracle.com/en/error-help/db/ora-00942/' },
        { name: 'Oracle Database error help, ORA-01031', url: 'https://docs.oracle.com/en/error-help/db/ora-01031/' },
        { name: 'MySQL 8.0 Reference Manual, GRANT Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/grant.html' },
      ],
    },
  ],
};
