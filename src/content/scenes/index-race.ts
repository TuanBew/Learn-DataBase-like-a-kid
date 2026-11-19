/** Chữ và dữ liệu của cảnh "Cuộc đua tìm row" (bài index). */

export const copy = {
  /** Các cỡ table để chọn. */
  sizes: [100, 10000, 1000000],
  /** Row cần tìm nằm ở khoảng 72% chiều dài table. */
  targetAt: 0.72,
  sizeLabel: 'Số row của table',
  run: 'Chạy',
  reset: 'Làm lại',
  target: 'row cần tìm',
  scan: {
    name: 'Scan',
    how: 'đọc từng row, từ row đầu',
    count: (n: string) => `đã đọc ${n} row`,
  },
  index: {
    name: 'Index',
    how: 'tra index, mỗi lần bỏ đi một nửa',
    count: (n: string) => `đã so ${n} lần`,
  },
  finished: 'Tới đích',
  says: {
    start: 'Hai bên cùng tìm một row. Scan đọc lần lượt từng row. Index tra danh sách đã xếp sẵn. Chọn số row, rồi bấm Chạy.',
    picked: (n: string) => `Table có ${n} row. Bấm Chạy.`,
    running: 'Hai bên đang tìm. Nhìn con số của mỗi bên.',
    small: (scan: string, idx: string) => `Scan đọc ${scan} row mới gặp row cần tìm. Index so ${idx} lần. Table nhỏ thì hai cách gần như nhau.`,
    big: (n: string, scan: string, idx: string) => `Table có ${n} row. Scan đọc ${scan} row mới gặp row cần tìm. Index chỉ so ${idx} lần.`,
    huge: (n: string, scan: string, idx: string) =>
      `Table có ${n} row. Scan đọc ${scan} row. Index chỉ so ${idx} lần. Table càng lớn, index càng bỏ xa scan.`,
  },
};
