import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của Chương 8 (subquery và ghép kết quả). */
export const entries: Record<string, GlossaryEntry> = {
  'not-in': {
    term: 'NOT IN',
    short: 'Từ khóa SQL giữ row khi giá trị không nằm trong danh sách. Danh sách có NULL thì không row nào qua.',
    example: 'Tìm nhân viên có mã không nằm trong danh sách người từng bán đơn.',
  },
  any: {
    term: 'ANY',
    short: 'Từ khóa SQL so một giá trị với từng phần tử của danh sách. Điều kiện đúng khi ít nhất một phần tử thỏa. Viết = ANY thì giống IN.',
    example: 'Lương cao hơn ANY lương phòng IT nghĩa là cao hơn ít nhất một người của phòng IT.',
  },
  all: {
    term: 'ALL',
    short: 'Từ khóa SQL so một giá trị với từng phần tử của danh sách. Điều kiện đúng khi mọi phần tử đều thỏa.',
    example: 'Lương cao hơn ALL lương phòng IT nghĩa là cao hơn cả người lương cao nhất phòng IT.',
  },
  'from-subquery': {
    term: 'subquery trong FROM',
    short: 'Subquery đứng ở chỗ của table trong FROM. Kết quả của nó là một table tạm để query ngoài đọc hoặc nối. MySQL gọi là derived table, Oracle gọi là inline view.',
    example: 'Gom doanh thu theo từng khách ra một danh sách ngắn, rồi nối danh sách đó với table khách.',
  },
  'correlated-subquery': {
    term: 'subquery phụ thuộc',
    short: 'Subquery nhắc tới column của query ngoài, nên phải chạy lại với từng row của query ngoài.',
    example: 'Với mỗi nhân viên, tính lương trung bình riêng cho phòng của chính người đó.',
  },
  exists: {
    term: 'EXISTS',
    short: 'Từ khóa SQL hỏi subquery có ra ít nhất một row hay không. Câu trả lời chỉ có "có" hoặc "không".',
    example: 'Giữ khách nếu tìm thấy ít nhất một đơn mang mã của khách đó.',
  },
  union: {
    term: 'UNION',
    short: 'Phép ghép kết quả của hai query thành một danh sách và bỏ row trùng.',
    example: 'Gộp danh sách nước có văn phòng với danh sách nước có khách, mỗi nước chỉ hiện một lần.',
  },
  'union-all': {
    term: 'UNION ALL',
    short: 'Phép ghép kết quả của hai query và giữ mọi row, kể cả row trùng.',
    example: 'Dán hai danh sách nối đuôi nhau, nước nào xuất hiện hai lần thì hiện hai lần.',
  },
  intersect: {
    term: 'INTERSECT',
    short: 'Phép ghép giữ các row có mặt ở cả hai query.',
    example: 'Chọn các nước vừa có văn phòng vừa có khách.',
  },
  minus: {
    term: 'MINUS',
    short: 'Phép ghép của Oracle giữ các row chỉ có ở query bên trái. MySQL gọi phép này là EXCEPT.',
    example: 'Lấy các nước có khách mà công ty chưa có văn phòng.',
  },
  except: {
    term: 'EXCEPT',
    short: 'Phép ghép của MySQL giữ các row chỉ có ở query bên trái. Oracle gọi phép này là MINUS.',
    example: 'Lấy các nước có khách mà công ty chưa có văn phòng.',
  },
  with: {
    term: 'WITH',
    short: 'Từ khóa SQL đặt tên cho một query nhỏ ở đầu query lớn, để query lớn gọi lại bằng tên đó.',
    example: 'Ghi "doanh thu từng khách" lên đầu trang, rồi các bước sau chỉ cần nhắc tên.',
  },
  cte: {
    term: 'CTE',
    short: 'Một khối có tên trong WITH. Query bên dưới dùng nó như một table tạm.',
    example: 'Khối customer_total là doanh thu của từng khách, tính một lần và dùng nhiều lần.',
  },
};
