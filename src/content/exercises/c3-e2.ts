import type { SqlExercise } from '../types';

export const exercise: SqlExercise = {
  id: 'c3-e2',
  chapter: 3,
  kind: 'fill',
  title: 'Đặt tên tiếng Việt cho column',
  prompt: 'Quản lý muốn một danh sách nhân viên với tiêu đề column bằng tiếng Việt. Điền vào chỗ trống `____`.',
  asks: [
    'Hiện `full_name` với tên mới `ho_ten`.',
    'Hiện `salary` với tên mới `luong`.',
    'Lấy từ table staff.',
  ],
  database: 'teashop',
  tables: ['staff'],
  dialects: ['mysql', 'oracle'],
  starter: {
    mysql: 'SELECT full_name AS ____, ____ AS luong\nFROM ____;',
    oracle: 'SELECT full_name AS ____, ____ AS luong\nFROM ____',
  },
  solution: {
    mysql: 'SELECT full_name AS ho_ten, salary AS luong\nFROM staff;',
    oracle: 'SELECT full_name AS ho_ten, salary AS luong\nFROM staff',
  },
  check: { orderMatters: false, aliasMatters: true },
  why: 'SELECT chọn hai column và FROM chọn table staff. Mỗi AS đặt một alias mới cho column đứng trước nó.',
  hints: {
    light: 'AS đứng giữa column và tên mới. Mỗi column cần một AS riêng.',
    specific: 'Chỗ trống đầu là tên mới của full_name. Chỗ trống tiếp theo là column lương. Chỗ trống sau FROM là table chứa nhân viên.',
    skeleton: {
      mysql: 'SELECT full_name AS ____, ____ AS luong\nFROM ____;',
      oracle: 'SELECT full_name AS ____, ____ AS luong\nFROM ____',
    },
  },
  wrong: [
    {
      id: 'no-alias-salary',
      sql: {
        mysql: 'SELECT full_name AS ho_ten, salary FROM staff',
        oracle: 'SELECT full_name AS ho_ten, salary FROM staff',
      },
      hint: 'Column lương vẫn mang tên salary. Thêm AS luong sau salary để đổi tên nó.',
    },
    {
      id: 'wrong-column',
      sql: {
        mysql: 'SELECT full_name AS ho_ten, role AS luong FROM staff',
        oracle: 'SELECT full_name AS ho_ten, role AS luong FROM staff',
      },
      hint: 'Tên luong đang gắn cho column role, nên kết quả hiện chức vụ. Đổi role thành salary.',
    },
    {
      id: 'swapped',
      sql: {
        mysql: 'SELECT salary AS ho_ten, full_name AS luong FROM staff',
        oracle: 'SELECT salary AS ho_ten, full_name AS luong FROM staff',
      },
      hint: 'Hai tên mới đang gắn nhầm column. ho_ten đi với full_name, còn luong đi với salary.',
    },
  ],
};
