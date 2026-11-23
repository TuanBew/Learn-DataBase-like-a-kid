import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của c10-b3 tới c10-b6 và c11-b2. */
export const entries: Record<string, GlossaryEntry> = {
  session: {
    term: 'session',
    short: 'Một lần đăng nhập vào database, từ lúc nối tới lúc ngắt.',
    example: 'Ba đồng nghiệp mở ba cửa sổ SQL là ba session.',
  },
  lock: {
    term: 'lock',
    short: 'Tấm biển "đang dùng" mà database đặt lên row đang được sửa, để người khác chờ.',
    example: 'An sửa giá trà đào chưa COMMIT, nên Bình sửa cùng row phải chờ lock của An.',
  },
  deadlock: {
    term: 'deadlock',
    short: 'Hai session giữ lock của nhau và cùng chờ nhau, nên không ai chạy tiếp được.',
    example: 'An giữ row 2 và chờ row 3, Bình giữ row 3 và chờ row 2.',
  },
  dba: {
    term: 'DBA',
    short: 'Người quản trị database của công ty, có quyền xem lock và ngắt session.',
    example: 'Lệnh của bạn bị treo, bạn nhắn DBA để tìm người giữ lock.',
  },
  savepoint: {
    term: 'SAVEPOINT',
    short: 'Một mốc đặt giữa transaction, để ROLLBACK TO quay về mốc đó mà không bỏ cả transaction.',
    example: 'Bi ghi đơn 1, đặt mốc, ghi thêm đơn 2 và 3, rồi quay về mốc để chỉ giữ đơn 1.',
  },
  ctas: {
    term: 'CREATE TABLE AS SELECT',
    short: 'Lệnh tạo table mới từ kết quả của một SELECT, kèm luôn các row.',
    example: 'Trước khi sửa giá, Bi chép các món sắp sửa sang table menu_items_bak.',
  },
  merge: {
    term: 'MERGE',
    short: 'Lệnh Oracle gộp một danh sách vào table: row đã có thì sửa, row chưa có thì thêm.',
    example: 'Nhà cung cấp gửi giá mới, một lệnh MERGE đổi giá món cũ và thêm món mới.',
  },
  'on-duplicate-key': {
    term: 'ON DUPLICATE KEY UPDATE',
    short: 'Đuôi của INSERT ở MySQL: row mới trùng primary key hoặc UNIQUE thì sửa row có sẵn.',
    example: 'INSERT món số 2, món đã có, nên MySQL chỉ đổi giá của món đó.',
  },
  'schema-owner': {
    term: 'schema',
    short: 'Ở Oracle, schema là ngăn chứa các table của một user, mang tên user đó.',
    example: 'User HR có schema HR, và table EMPLOYEES do HR tạo nằm trong đó.',
  },
  'qualified-name': {
    term: 'tên đầy đủ',
    short: 'Tên table kèm tên schema, viết dạng schema.table, để gọi table của schema khác.',
    example: 'HR.EMPLOYEES là table EMPLOYEES trong schema HR.',
  },
  dual: {
    term: 'DUAL',
    short: 'Table nhỏ có sẵn của Oracle, dùng khi bạn cần SELECT mà không đọc table nào.',
    example: 'SELECT USER FROM DUAL cho biết bạn đang là user nào.',
  },
  synonym: {
    term: 'synonym',
    short: 'Tên gọi tắt do người quản trị đặt, trỏ tới table ở schema khác.',
    example: 'Synonym EMP trỏ tới HR.EMPLOYEES, nên bạn gõ FROM emp.',
  },
};
