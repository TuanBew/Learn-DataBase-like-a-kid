import type { GlossaryEntry } from '../types';

export const entries: Record<string, GlossaryEntry> = {
  from: {
    term: 'FROM',
    short: 'Từ khóa SQL nói query lấy dữ liệu từ table nào.',
    example: 'Bạn nói với Bi: lấy tên món từ sổ thực đơn.',
  },
  expression: {
    term: 'expression',
    short: 'Một phép tính hoặc một giá trị đứng trong query, ví dụ lương tháng nhân 12.',
    example: 'Giá một ly nhân với số ly cho ra tiền của món đó trong đơn.',
  },
  like: {
    term: 'LIKE',
    short: 'Từ khóa SQL tìm chữ theo mẫu. Dấu % thay cho đoạn chữ bất kỳ, dấu _ thay cho đúng một ký tự.',
    example: 'Tìm mọi món có tên bắt đầu bằng chữ Trà.',
  },
  collation: {
    term: 'collation',
    short: 'Bộ luật so sánh và xếp chữ: có phân biệt hoa thường và dấu hay không.',
    example: 'Hai người đọc tên "Hà" và "ha" là một hay hai tên khác nhau? Collation quyết định.',
  },
  distinct: {
    term: 'DISTINCT',
    short: 'Từ khóa SQL bỏ các row trùng nhau trong kết quả, chỉ giữ một row cho mỗi giá trị.',
    example: 'Từ 14 món, bạn chỉ muốn liệt kê các nhóm món, mỗi nhóm một lần.',
  },
  offset: {
    term: 'OFFSET',
    short: 'Từ khóa SQL bỏ qua một số row đầu rồi mới bắt đầu lấy.',
    example: 'Trang hai của danh sách bỏ qua các món của trang một.',
  },
  rownum: {
    term: 'ROWNUM',
    short: 'Số thứ tự Oracle gán cho từng row lúc lấy ra, bắt đầu từ 1. Thường gặp trong code Oracle cũ.',
    example: 'Đánh số 1, 2, 3 theo thứ tự các món được lấy ra khỏi sổ.',
  },
};
