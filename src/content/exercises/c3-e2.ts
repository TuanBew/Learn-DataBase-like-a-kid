import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c3-e2',
  chapter: 3,
  kind: 'fill',
  title: 'Lương mới sau khi thêm 500.000 đồng',
  prompt: 'Quản lý muốn xem lương mới nếu mỗi nhân viên được thêm 500.000 đồng. Điền vào chỗ trống `____`.',
  asks: [
    'Hiện `full_name` của nhân viên.',
    'Hiện lương tháng cộng 500000, đặt tên column là `luong_moi`.',
    'Lấy từ table staff.',
  ],
  database: 'teashop',
  tables: ['staff'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT full_name, ____ AS luong_moi\nFROM ____;',
    oracle: 'SELECT full_name, ____ AS luong_moi\nFROM ____',
  },
  solution: {
    mysql: 'SELECT full_name, salary + 500000 AS luong_moi\nFROM staff;',
    oracle: 'SELECT full_name, salary + 500000 AS luong_moi\nFROM staff',
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'Phép tính `salary + 500000` chạy trên từng row. AS đặt tên luong_moi cho column mới.',
  hints: {
    light: 'Một phép tính đứng được ở vị trí của column. AS đặt tên cho kết quả phép tính.',
    specific: 'Chỗ trống đầu là phép cộng column salary với 500000. Chỗ trống sau FROM là tên table chứa nhân viên.',
    skeleton: {
      mysql: 'SELECT full_name, salary ____ ____ AS luong_moi\nFROM ____;',
      oracle: 'SELECT full_name, salary ____ ____ AS luong_moi\nFROM ____',
    },
  },
  wrong: [
    {
      id: 'no-math',
      sql: {
        mysql: 'SELECT full_name, salary AS luong_moi FROM staff',
        oracle: 'SELECT full_name, salary AS luong_moi FROM staff',
      },
      hint: 'Column luong_moi đang bằng lương cũ. Thêm phép cộng 500000 sau salary.',
    },
    {
      id: 'minus',
      sql: {
        mysql: 'SELECT full_name, salary - 500000 AS luong_moi FROM staff',
        oracle: 'SELECT full_name, salary - 500000 AS luong_moi FROM staff',
      },
      hint: 'Dấu `-` đang trừ đi 500000. Đổi thành dấu `+` để lương tăng.',
    },
  ],
};
