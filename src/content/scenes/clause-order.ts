/** Chữ của cảnh "Thứ tự query chạy thật" (bài c-order). */
export const copy = {
  writtenTitle: 'Bạn viết query theo thứ tự này',
  /** Mỗi phần tử là một clause, theo thứ tự viết. */
  query: [
    'SELECT category, COUNT(*) AS items',
    'FROM products',
    'WHERE price > 20000',
    'GROUP BY category',
    'HAVING COUNT(*) >= 2',
    'ORDER BY items DESC',
    'LIMIT 3',
  ],
  ranTitle: 'Database chạy theo thứ tự khác',
  task: 'Bấm từng clause theo thứ tự database chạy.',
  /** Thứ tự đúng: thứ tự database chạy. */
  pieces: [
    '`FROM`: lấy table',
    '`WHERE`: giữ row hợp lệ',
    '`GROUP BY`: gom row thành nhóm',
    '`HAVING`: giữ nhóm hợp lệ',
    '`SELECT`: chọn column cần hiện',
    '`ORDER BY`: sắp xếp kết quả',
    '`LIMIT`: cắt bớt row',
  ],
  labels: {
    pool: 'Clause còn lại',
    answer: 'Thứ tự database chạy',
    check: 'Kiểm tra',
    reset: 'Làm lại',
    right: 'Đúng rồi.',
    wrong: (n: number) => `Có ${n} clause sai chỗ. Bấm clause đỏ để đưa nó về khay.`,
  },
  idle: 'Query viết SELECT trước. Database thì không chạy SELECT trước. Bạn đoán nó chạy clause nào đầu tiên?',
  progress: (n: number, total: number) => `Bạn đã xếp ${n} trên ${total} clause.`,
  full: 'Đủ bảy clause rồi. Bấm Kiểm tra.',
  wrong: 'Chưa đúng. Hỏi thử: database cần biết gì trước khi lọc row?',
  done: 'Đúng rồi. FROM chạy đầu vì database cần biết lấy row từ table nào. SELECT chạy gần cuối vì nó chỉ chọn column để hiện, sau khi row đã được lọc và gom nhóm.',
} as const;
