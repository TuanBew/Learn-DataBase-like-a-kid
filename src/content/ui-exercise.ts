/** Chữ cố định của các component bài tập: ResultTable, ResultCompare, HintLadder. */

const list = (xs: string[]) => xs.join(', ');

export const uiExercise = {
  table: {
    defaultCaption: 'Kết quả của query',
    empty: 'Query chạy xong và không có row nào.',
    counts: (rows: number, cols: number) => `${rows} row, ${cols} column`,
    truncated: (shown: number, total: number) => `Đang hiện ${shown} trong ${total} row.`,
    nullText: 'NULL',
    markExtra: 'Row thừa.',
    markMissing: 'Row thiếu.',
  },

  compare: {
    yours: 'Kết quả của bạn',
    expected: 'Kết quả cần có',
    legendLabel: 'Chú thích màu',
    legendExtra: 'Row thừa: kết quả cần có không chứa row này.',
    legendMissing: 'Row thiếu: kết quả của bạn chưa có row này.',
    problemsLabel: 'Điểm khác nhau',
    allGood: 'Kết quả khớp. Mọi row đều đúng.',
    columnCount: (expected: number, actual: number) => `Kết quả cần ${expected} column. Bạn đang có ${actual}.`,
    columnExtra: (names: string[]) => `Bỏ column ${list(names)}.`,
    columnMissing: (names: string[]) => `Thêm column ${list(names)}.`,
    columnOrder: 'Bạn có đủ column, nhưng thứ tự khác. Xếp column theo thứ tự đề bài.',
    columnNames: (positions: number[], names: string[]) =>
      `Tên column khác ở vị trí ${list(positions.map(String))}. Đặt tên ${list(names)}.`,
    rows: (missing: number, extra: number) => {
      if (missing > 0 && extra > 0) return `Bạn thiếu ${missing} row và thừa ${extra} row.`;
      if (missing > 0) return `Bạn thiếu ${missing} row.`;
      return `Bạn thừa ${extra} row.`;
    },
    rowOrder: 'Các row đều đúng, nhưng thứ tự khác. Kiểm tra ORDER BY.',
  },

  hints: {
    regionLabel: 'Gợi ý',
    levels: ['Gợi ý nhẹ', 'Gợi ý cụ thể', 'Khung query', 'Lời giải'],
    step: (n: number) => `Bậc ${n}`,
    open: ['Mở gợi ý nhẹ', 'Mở gợi ý cụ thể', 'Mở khung query', 'Mở lời giải'],
    allOpen: 'Đã mở hết',
    runSolution: 'Chạy lời giải trong Theater',
    // Lời Châu, theo số bậc đã mở (0 đến 4).
    chau: [
      'Kẹt thì mở gợi ý. Mình đưa từng bậc một.',
      'Kẹt là chuyện bình thường. Thử lại với gợi ý này.',
      'Gần rồi. Đọc kỹ rồi sửa query của bạn.',
      'Mình đưa khung query. Bạn điền chỗ trống là xong.',
      'Đây là lời giải. Đọc xong, thử tự viết lại nhé.',
    ],
  },
} as const;
