import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của Chương 7. */
export const entries: Record<string, GlossaryEntry> = {
  'inner-join': {
    term: 'INNER JOIN',
    short: 'Kiểu JOIN chỉ giữ các row ghép được với row của table kia. Row không có cặp thì rơi ra ngoài.',
    example: 'Ghép đơn với khách quen: đơn của khách vãng lai không có tên để ghép, nên biến mất.',
  },
  'left-join': {
    term: 'LEFT JOIN',
    short: 'Kiểu JOIN giữ mọi row của table bên trái. Row không ghép được thì column bên phải là NULL.',
    example: 'Đi từng món trong thực đơn và ghi bên cạnh các đơn có món đó. Món chưa ai mua vẫn có tên trong danh sách.',
  },
  on: {
    term: 'ON',
    short: 'Từ khóa SQL nói hai row ghép với nhau khi nào, thường là hai column bằng nhau.',
    example: 'Hai tờ phiếu ghép với nhau khi cùng ghi mã khách 7.',
  },
  in: {
    term: 'IN',
    short: 'Từ khóa SQL giữ row khi giá trị nằm trong một danh sách. Danh sách có thể do subquery trả về.',
    example: 'Giữ những khách có mã nằm trong danh sách mã đã từng đặt đơn.',
  },
  'scalar-subquery': {
    term: 'scalar subquery',
    short: 'Subquery chỉ trả về đúng một giá trị, nên dùng được như một con số trong điều kiện.',
    example: 'Tính giá trung bình của thực đơn ra một số, rồi so từng món với số đó.',
  },
};
