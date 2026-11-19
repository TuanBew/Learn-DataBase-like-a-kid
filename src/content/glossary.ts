import type { GlossaryEntry } from './types';

export const glossary: Record<string, GlossaryEntry> = {
  database: {
    term: 'database',
    short: 'Nơi cất dữ liệu có sắp xếp, để nhiều người cùng ghi và tìm lại nhanh.',
    example: 'Tiệm trà sữa cất đơn, thực đơn và danh sách khách quen trong một database.',
  },
  dbms: {
    term: 'DBMS',
    short: 'Phần mềm quản lý database: nhận lệnh, ghi dữ liệu, trả dữ liệu về.',
    example: 'Thủ kho là DBMS: bạn nói cần gì, thủ kho vào kho lấy và ghi sổ.',
  },
  table: {
    term: 'table',
    short: 'Nơi các row cùng loại nằm chung, mỗi table giữ một loại dữ liệu.',
    example: 'Sổ điểm của lớp là một table: mỗi học sinh một row.',
  },
  row: {
    term: 'row',
    short: 'Một lần ghi trong table, gồm đủ các ô của một đối tượng.',
    example: 'Một đơn trà sữa là một row: mã đơn, món, giá, giờ đặt.',
  },
  column: {
    term: 'column',
    short: 'Một loại thông tin của table, row nào cũng có một ô ở column này.',
    example: 'Sổ điểm có column tên, column môn học và column điểm.',
  },
  'data-type': {
    term: 'data type',
    short: 'Loại giá trị một column được phép chứa: số, chữ hay ngày giờ.',
    example: 'Giá ly trà là số, tên món là chữ, giờ đặt là ngày giờ.',
  },
  'primary-key': {
    term: 'primary key',
    short: 'Mã riêng của mỗi row, không trùng với row nào khác trong table.',
    example: 'Số báo danh trong lớp: hai bạn có thể trùng tên, không trùng số báo danh.',
  },
  'foreign-key': {
    term: 'foreign key',
    short: 'Column giữ primary key của table khác, để nối row của hai table.',
    example: 'Đơn trà sữa ghi mã khách, nên tìm được chủ đơn trong sổ khách quen.',
  },
  null: {
    term: 'NULL',
    short: 'Giá trị nghĩa là chưa có thông tin, khác với số 0 hay chữ trống.',
    example: 'Khách chưa cho số điện thoại thì ô số điện thoại là NULL.',
  },
  constraint: {
    term: 'constraint',
    short: 'Quy tắc buộc dữ liệu phải đúng, như không được trống hay không được trùng.',
    example: 'Tiệm đặt quy tắc: giá mỗi ly trà phải lớn hơn 0.',
  },
  schema: {
    term: 'schema',
    short: 'Bản thiết kế của database: có table nào, column nào, loại dữ liệu gì.',
    example: 'Sơ đồ nhà kho ghi rõ kệ nào chứa gì, giống schema của database.',
  },
  index: {
    term: 'index',
    short: 'Danh mục phụ giúp database tìm row nhanh mà không đọc hết table.',
    example: 'Mục lục cuối sách giúp bạn tìm đúng trang ngay, giống index.',
  },
  query: {
    term: 'query',
    short: 'Câu lệnh bạn gửi cho database để lấy hoặc đổi dữ liệu.',
    example: 'Bạn hỏi thủ kho: cho mình các đơn trên 40.000. Câu hỏi đó là một query.',
  },
  clause: {
    term: 'clause',
    short: 'Một phần của câu lệnh SQL, mỗi phần lo một nhiệm vụ riêng.',
    example: 'WHERE chỉ lo lọc, ORDER BY chỉ lo sắp xếp: mỗi cái là một clause.',
  },
  function: {
    term: 'function',
    short: 'Công thức có sẵn: nhận giá trị vào, trả một giá trị ra.',
    example: 'Máy ép chữ in hoa nhận "an" và trả "AN", giống function UPPER.',
  },
  join: {
    term: 'JOIN',
    short: 'Cách ghép row của hai table lại theo một column chung.',
    example: 'Ghép sổ đơn với sổ khách quen qua mã khách để thấy tên người đặt.',
  },
  subquery: {
    term: 'subquery',
    short: 'Query nhỏ nằm trong query lớn, trả kết quả cho query lớn dùng.',
    example: 'Muốn tìm ly đắt hơn giá trung bình, trước hết phải tính giá trung bình.',
  },
  transaction: {
    term: 'transaction',
    short: 'Nhóm thao tác trên database làm trọn gói: xong hết hoặc không làm gì.',
    example: 'Chuyển tiền gồm trừ tiền người gửi và cộng tiền người nhận, phải xong cùng lúc.',
  },
  commit: {
    term: 'COMMIT',
    short: 'Lệnh chốt transaction, mọi thay đổi trong đó được lưu thật.',
    example: 'Bạn ghi đơn vào giấy nháp, bấm chốt thì đơn mới vào sổ chính.',
  },
  rollback: {
    term: 'ROLLBACK',
    short: 'Lệnh hủy transaction, database quay về như lúc chưa thay đổi.',
    example: 'Ghi nhầm đơn thì xé tờ nháp, sổ chính vẫn nguyên.',
  },
  client: {
    term: 'client',
    short: 'Chương trình của bạn, gửi query đến server và nhận kết quả.',
    example: 'Khách ngồi quầy gọi món là client, bếp nhận phiếu là server.',
  },
  server: {
    term: 'server',
    short: 'Máy hoặc chương trình giữ database và trả lời client.',
    example: 'Bếp nhận phiếu gọi món rồi làm ra ly trà.',
  },
  dialect: {
    term: 'dialect',
    short: 'Cách viết SQL riêng của từng phần mềm database, giống phương ngữ.',
    example: 'Miền Bắc nói bát, miền Nam nói chén, cùng chỉ một món đồ.',
  },
  sql: {
    term: 'SQL',
    short: 'Ngôn ngữ để nói chuyện với database: hỏi, thêm, sửa, xóa dữ liệu.',
    example: 'Bạn dặn thủ kho bằng vài từ cố định: lấy gì, lọc gì, xếp ra sao.',
  },
  select: {
    term: 'SELECT',
    short: 'Từ khóa SQL chọn column nào sẽ hiện ra trong kết quả.',
    example: 'Từ sổ điểm, bạn chỉ chép tên và điểm, bỏ các thông tin khác.',
  },
  where: {
    term: 'WHERE',
    short: 'Từ khóa SQL giữ lại row thỏa điều kiện, bỏ các row còn lại.',
    example: 'Bạn chỉ lấy các đơn trên 40.000 và bỏ đơn rẻ hơn.',
  },
  'order-by': {
    term: 'ORDER BY',
    short: 'Từ khóa SQL sắp xếp row trong kết quả theo column bạn chọn.',
    example: 'Xếp danh sách lớp theo điểm từ cao xuống thấp.',
  },
  limit: {
    term: 'LIMIT',
    short: 'Từ khóa của MySQL, giữ lại đúng số row đầu tiên bạn nói.',
    example: 'Bạn chỉ lấy ba ly bán chạy nhất trong danh sách.',
  },
  'fetch-first': {
    term: 'FETCH FIRST',
    short: 'Cách Oracle giữ lại số row đầu tiên, tương đương LIMIT của MySQL.',
    example: 'Cùng là lấy ba ly đầu danh sách, hai nơi chỉ khác cách nói.',
  },
  alias: {
    term: 'alias',
    short: 'Tên tạm bạn đặt cho column hoặc table, chỉ dùng trong query đó.',
    example: 'Ghi sổ cho nhanh, bạn gọi "Trà sữa trân châu" là "TSTC".',
  },
};
