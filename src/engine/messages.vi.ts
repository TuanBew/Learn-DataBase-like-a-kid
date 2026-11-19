/**
 * Mọi câu tiếng Việt mà engine nói ra: lời giải thích lỗi và lý do của từng row.
 * Sửa chữ ở đây, không cần đụng vào parser hay executor.
 */

type P = Record<string, string | number | undefined>;

/** Lời giải thích lỗi, bằng lời dễ hiểu. Khóa là tên tình huống. */
export const friendly: Record<string, (p: P) => string> = {
  empty: () => 'Editor đang trống. Gõ một query rồi bấm Chạy.',
  'multi-statement': () => 'Mỗi lần chỉ chạy một query. Xóa phần nằm sau dấu ; đi.',
  'limit-in-oracle': () => 'Oracle không hiểu LIMIT. Ở Oracle, viết FETCH FIRST n ROWS ONLY.',
  'fetch-in-mysql': () => 'MySQL không hiểu FETCH FIRST. Ở MySQL, viết LIMIT n.',
  'nulls-in-mysql': () => 'MySQL không có NULLS FIRST và NULLS LAST. Chỉ Oracle mới viết như vậy.',
  'as-table-alias': () => 'Oracle không cho viết AS trước alias của table. Xóa chữ AS, giữ lại tên alias.',
  'no-from-oracle': () => 'Ở Oracle 19c, SELECT luôn cần FROM. Nếu chỉ muốn tính toán, viết thêm FROM DUAL.',
  'missing-from': (p) =>
    `Sau danh sách column, database chờ chữ FROM nhưng lại gặp ${p.tok}. Kiểm tra xem bạn có quên chữ FROM hoặc một dấu phẩy không.`,
  'missing-expression': (p) => `Sau ${p.after} đang thiếu một thứ: tên column, một con số hoặc một chuỗi.`,
  'trailing-comma': (p) => `Có một dấu phẩy thừa ngay trước ${p.tok}. Xóa dấu phẩy đó.`,
  'no-table': () => 'Sau FROM cần tên của một table.',
  unexpected: (p) => `Database đọc tới ${p.tok} thì không hiểu nữa. Kiểm tra chính tả ở chỗ này.`,
  'unexpected-end': (p) => `Query dừng lại quá sớm. Sau ${p.after} còn thiếu một phần.`,
  'clause-order': (p) =>
    `${p.tok} đang đứng sai chỗ. Thứ tự viết là SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, rồi tới ${p.last}.`,
  'clause-twice': (p) => `Query này có hai lần ${p.tok}. Mỗi clause chỉ viết một lần.`,
  'missing-paren': () => 'Có một dấu ( chưa đóng. Thêm dấu ) vào cuối phần đó.',
  'missing-keyword': (p) => `Chỗ này thiếu chữ ${p.kw}.`,
  'missing-by': (p) => `Sau ${p.kw} phải có chữ BY.`,
  'unknown-table': (p) => `Database này không có table tên ${p.name}.`,
  'unknown-column': (p) =>
    p.table ? `Table ${p.table} không có column tên ${p.name}.` : `Không tìm thấy column tên ${p.name}.`,
  'unknown-qualifier': (p) =>
    `Query này không có table hay alias nào tên ${p.name}. Kiểm tra lại phần đứng trước dấu chấm.`,
  'dquote-oracle': (p) =>
    `Ở Oracle, nháy kép dành cho tên column. Chuỗi phải nằm trong nháy đơn: '${p.text}'.`,
  'alias-quote-oracle': (p) => `Ở Oracle, tên mới của column phải nằm trong nháy kép: "${p.text}".`,
  'quoted-case-oracle': (p) =>
    `Trong nháy kép, Oracle phân biệt chữ hoa và chữ thường. Column này tên là ${p.real}. Dễ nhất là bỏ nháy kép.`,
  'backtick-oracle': () => 'Oracle không dùng dấu `. Xóa dấu đó đi.',
  'bad-char': (p) => `Database không hiểu ký tự ${p.ch} ở chỗ này.`,
  'percent-oracle': () => 'Oracle không có phép % để lấy số dư. Ở Oracle, viết MOD(a, b).',
  'unterminated-string': () => 'Chuỗi này mở bằng dấu nháy nhưng chưa đóng. Thêm một dấu nháy đơn ở cuối chuỗi.',
  'unknown-function': (p) => `${p.dialect} không có function tên ${p.name}.`,
  'function-other-dialect': (p) =>
    `${p.name} là function của ${p.other}. Ở ${p.dialect}, dùng ${p.use}.`,
  'arg-count': (p) => `${p.name} cần ${p.need} giá trị trong ngoặc, nhưng bạn đưa ${p.got}.`,
  'concat-oracle': () =>
    'Ở Oracle 19c, CONCAT chỉ nối được 2 chuỗi. Để nối nhiều chuỗi, dùng dấu ||, ví dụ a || b || c.',
  'invalid-number': (p) => `Oracle cần một con số ở chỗ này nhưng lại gặp chuỗi '${p.text}'.`,
  'divide-zero': () => 'Oracle không chia được cho 0.',
  'date-literal-oracle': (p) =>
    `Oracle không tự đổi chuỗi '${p.text}' thành ngày. Viết DATE '${p.text}' hoặc dùng TO_DATE.`,
  'need-condition': () =>
    'WHERE cần một phép so sánh, ví dụ price > 30000. Ở đây mới chỉ có một giá trị.',
  'condition-in-select': () =>
    'Oracle 19c không cho đặt phép so sánh ngay trong danh sách SELECT. Muốn ra kết quả theo điều kiện, dùng CASE WHEN.',
  'order-position': (p) => `ORDER BY ${p.n} nghĩa là sắp theo column thứ ${p.n}, nhưng SELECT chỉ có ${p.max} column.`,
  'negative-limit': () => 'Số row cần lấy phải là số nguyên từ 0 trở lên.',
  unsupported: (p) => `Khóa học chưa dạy tới ${p.feature}. Trang Học tiếp có chỗ để bạn học thêm phần này.`,
  'not-yet': (p) => `${p.feature} sẽ có ở các chương sau. Bài này chỉ cần SELECT.`,
};

/** Gợi ý tên gần đúng. */
export const didYouMean = (name: string) => `Có phải bạn muốn gõ ${name}?`;

/** Lý do một row đạt hoặc không đạt điều kiện. Viết thật ngắn vì chữ nằm ngay trên row. */
export const reason = {
  isNull: (label: string) => `${label} là NULL`,
  notNull: (label: string, v: string) => `${label} có giá trị ${v}`,
  nullCompare: (label: string) => `${label} là NULL, không so sánh được`,
  inList: (left: string) => `${left} có trong danh sách`,
  notInList: (left: string) => `${left} không có trong danh sách`,
  inRange: (left: string, lo: string, hi: string) => `${left} nằm trong ${lo} tới ${hi}`,
  outRange: (left: string, lo: string, hi: string) => `${left} nằm ngoài ${lo} tới ${hi}`,
  like: (left: string, pat: string) => `${left} khớp mẫu ${pat}`,
  notLike: (left: string, pat: string) => `${left} không khớp mẫu ${pat}`,
  and: ' và ',
  truthy: (text: string, v: string) => `${text} ra ${v}`,
};
