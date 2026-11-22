import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của các bài 2, 3 và 7 trong Chương 4. */
export const entries: Record<string, GlossaryEntry> = {
  and: {
    term: 'AND',
    short: 'Từ khóa SQL nối hai điều kiện. Row phải thỏa cả hai điều kiện mới được giữ.',
    example: 'Món Trà sữa và có giá dưới 40.000 đồng.',
  },
  or: {
    term: 'OR',
    short: 'Từ khóa SQL nối hai điều kiện. Row thỏa một trong hai điều kiện là được giữ.',
    example: 'Món thuộc nhóm Cà phê hoặc thuộc nhóm Topping.',
  },
  not: {
    term: 'NOT',
    short: 'Từ khóa SQL đảo một điều kiện. Điều kiện đúng thì thành sai, và ngược lại.',
    example: 'Mọi món không thuộc nhóm Topping.',
  },
  between: {
    term: 'BETWEEN',
    short: 'Từ khóa SQL giữ giá trị nằm trong một khoảng, gồm cả hai đầu.',
    example: 'Món có giá từ 30.000 đến 40.000 đồng, kể cả món đúng 30.000 đồng.',
  },
  wildcard: {
    term: 'wildcard',
    short: 'Ký tự đặc biệt trong mẫu của LIKE. Dấu % thay cho một đoạn chữ bất kỳ, dấu _ thay cho đúng một ký tự.',
    example: 'Mẫu "Trà%" khớp mọi tên bắt đầu bằng chữ Trà.',
  },
  'is-null': {
    term: 'IS NULL',
    short: 'Từ khóa SQL giữ row có giá trị chưa có. Dấu = không tìm được NULL.',
    example: 'Tìm những khách chưa để lại số điện thoại.',
  },
  comment: {
    term: 'comment',
    short: 'Phần chữ trong query mà database bỏ qua. Người đọc dùng nó để hiểu query.',
    example: 'Dòng ghi chú ở đầu query: báo cáo này gửi cho phòng kinh doanh.',
  },
};
