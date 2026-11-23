import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của Chương 9 (báo cáo nâng cao). */
export const entries: Record<string, GlossaryEntry> = {
  'window-function': {
    term: 'window function',
    short: 'Function tính trên một nhóm row mà vẫn giữ nguyên từng row. Kết quả hiện thành một column mới. Oracle gọi là analytic function.',
    example: 'Đặt lương trung bình của phòng cạnh lương từng người trong phòng.',
  },
  over: {
    term: 'OVER',
    short: 'Từ khóa SQL đứng sau window function. Trong ngoặc của OVER, bạn nói nhóm nào cần tính và xếp row theo thứ tự nào.',
    example: '`AVG(salary) OVER (PARTITION BY department_id)` tính trung bình lương cho từng phòng.',
  },
  'partition-by': {
    term: 'PARTITION BY',
    short: 'Từ khóa SQL trong OVER, chia row thành các nhóm để tính riêng. Khác GROUP BY, nó không gộp row.',
    example: 'Chia nhân viên theo phòng, rồi đánh số thứ hạng lại từ 1 trong từng phòng.',
  },
  'row-number': {
    term: 'ROW_NUMBER',
    short: 'Window function đánh số 1, 2, 3 liên tục. Hai row bằng nhau vẫn nhận hai số khác nhau.',
    example: 'Đánh số thứ tự người lương cao nhất, không có hai người cùng số.',
  },
  rank: {
    term: 'RANK',
    short: 'Window function xếp hạng. Row bằng nhau cùng một hạng, và hạng kế tiếp nhảy cách: 1, 2, 2, 4.',
    example: 'Hai vận động viên cùng huy chương bạc thì không ai nhận huy chương đồng.',
  },
  'dense-rank': {
    term: 'DENSE_RANK',
    short: 'Window function xếp hạng. Row bằng nhau cùng một hạng, và hạng kế tiếp không nhảy: 1, 2, 2, 3.',
    example: 'Bảng xếp hạng có các mức liền nhau: nhất, nhì, ba, dù có người đồng hạng.',
  },
  'top-n': {
    term: 'Top N của mỗi nhóm',
    short: 'Dạng đề giữ N row đầu tiên của từng nhóm. Cách làm: tính hạng trong từng nhóm, rồi lọc hạng nhỏ hơn hoặc bằng N.',
    example: 'Ba người lương cao nhất của mỗi phòng.',
  },
  'running-total': {
    term: 'running total',
    short: 'Số cộng dồn: mỗi row bằng tổng của chính nó và mọi row đứng trước. Tính bằng SUM kèm OVER và ORDER BY.',
    example: 'Doanh thu từ đầu năm tới hết từng tháng.',
  },
  lag: {
    term: 'LAG',
    short: 'Window function lấy giá trị của row phía trước theo thứ tự đã chọn. Row đầu tiên nhận NULL.',
    example: 'Lấy doanh thu của tháng trước để đặt cạnh tháng này.',
  },
  lead: {
    term: 'LEAD',
    short: 'Window function lấy giá trị của row phía sau theo thứ tự đã chọn. Row cuối cùng nhận NULL.',
    example: 'Lấy doanh thu của tháng sau để đặt cạnh tháng này.',
  },
  view: {
    term: 'view',
    short: 'Câu SELECT được lưu dưới một cái tên. Bạn đọc nó như một table. Nó không chứa dữ liệu riêng và chạy lại câu SELECT mỗi lần đọc.',
    example: 'Team dữ liệu lưu cách tính doanh thu thành view, các phòng khác chỉ việc SELECT từ nó.',
  },
};
