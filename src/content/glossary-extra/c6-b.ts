import type { GlossaryEntry } from '../types';

/** Thuật ngữ mới của các bài 5 và 6 trong Chương 6. */
export const entries: Record<string, GlossaryEntry> = {
  pivot: {
    term: 'pivot',
    short: 'Cách xoay các giá trị của một column thành nhiều column đứng cạnh nhau.',
    example: 'Mỗi trạng thái đơn từ một row thành một column: số đơn xong, số đơn hủy.',
  },
  'group-concat': {
    term: 'GROUP_CONCAT',
    short: 'Function gom của MySQL nối giá trị của mọi row trong nhóm thành một chuỗi.',
    example: 'Ghép tên mọi nhân viên của một phòng vào một ô, cách nhau bằng dấu phẩy.',
  },
  listagg: {
    term: 'LISTAGG',
    short: 'Function gom của Oracle nối giá trị của mọi row trong nhóm thành một chuỗi. Thường đi với WITHIN GROUP để chọn thứ tự nối.',
    example: 'Ghép tên mọi nhân viên của một phòng vào một ô, xếp theo thứ tự chữ cái.',
  },
  rollup: {
    term: 'ROLLUP',
    short: 'Từ khóa SQL của GROUP BY, thêm các row tổng phụ và một row tổng cộng vào kết quả.',
    example: 'Báo cáo tổng lương theo phòng có thêm một row cộng lương của cả công ty.',
  },
  grouping: {
    term: 'GROUPING',
    short: 'Function trả 1 nếu NULL của column nhóm đến từ row tổng, và trả 0 trong mọi trường hợp khác.',
    example: 'Phân biệt row tổng cộng với nhóm nhân viên chưa có phòng, vì cả hai cùng hiện NULL.',
  },
};
