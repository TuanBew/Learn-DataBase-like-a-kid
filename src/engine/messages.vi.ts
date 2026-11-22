/**
 * Mọi câu tiếng Việt mà engine nói ra: lời giải thích lỗi và lý do của từng row.
 * Sửa chữ ở đây, không cần đụng vào parser hay executor.
 */

type P = Record<string, string | number | undefined>;

/** Lời giải thích lỗi, bằng lời dễ hiểu. Khóa là tên tình huống. */
export const friendly: Record<string, (p: P) => string> = {
  empty: () => 'Editor đang trống. Gõ một query rồi bấm Chạy.',
  'only-semicolon': () => 'Editor chỉ có dấu ; mà chưa có query. Gõ một query trước dấu ; rồi bấm Chạy.',
  'multi-statement': () => 'Mỗi lần chỉ chạy một query. Xóa phần nằm sau dấu ; đi.',
  'limit-in-oracle': () => 'Oracle không hiểu LIMIT. Ở Oracle, viết FETCH FIRST n ROWS ONLY.',
  'fetch-in-mysql': () => 'MySQL không hiểu FETCH FIRST. Ở MySQL, viết LIMIT n.',
  'nulls-in-mysql': () => 'MySQL không có NULLS FIRST và NULLS LAST. Chỉ Oracle mới viết như vậy.',
  'as-table-alias': () => 'Oracle không cho viết AS trước alias của table. Xóa chữ AS, giữ lại tên alias.',
  'no-from-oracle': () => 'Ở Oracle 19c, SELECT luôn cần FROM. Nếu chỉ muốn tính toán, viết thêm FROM DUAL.',
  'missing-from': (p) =>
    `Sau danh sách column, database chờ chữ FROM nhưng lại gặp ${p.tok}. Có thể bạn quên chữ FROM hoặc một dấu phẩy.`,
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
  'alias-quote-oracle': (p) => `Ở Oracle, tên mới của column không nằm trong nháy đơn. Dùng nháy kép: "${p.text}", hoặc bỏ nháy.`,
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
    `Oracle đọc chuỗi ngày theo một dạng mặc định, và '${p.text}' không khớp dạng đó. Viết DATE '${p.text}' hoặc dùng TO_DATE.`,
  'need-condition': () =>
    'WHERE cần một phép so sánh, ví dụ price > 30000. Ở đây mới chỉ có một giá trị.',
  'condition-in-select': () =>
    'Oracle 19c không cho đặt phép so sánh ngay trong danh sách SELECT. Muốn ra kết quả theo điều kiện, dùng CASE WHEN.',
  'order-position': (p) => `ORDER BY ${p.n} nghĩa là sắp theo column thứ ${p.n}, nhưng SELECT chỉ có ${p.max} column.`,
  'negative-limit': () => 'Số row cần lấy phải là số nguyên từ 0 trở lên.',
  ambiguous: (p) => `Column ${p.name} có ở nhiều table (${p.tables}). Ghi rõ table đứng trước, ví dụ ${String(p.tables).split(', ')[0]}.${p.name}.`,
  'alias-twice': (p) => `Tên ${p.name} đang được dùng cho hai table. Đặt cho mỗi table một alias riêng.`,
  'join-needs-on': () => 'JOIN cần điều kiện ON để biết row nào ghép với row nào. Viết thêm ON kèm hai column cần so.',
  'agg-not-allowed': (p) => `Không dùng ${p.name} trong ${p.where} được. Lúc đó database chưa gom nhóm. Để lọc theo kết quả đã gom, dùng HAVING.`,
  'not-grouped': (p) => `Column ${p.name} không nằm trong GROUP BY và cũng không nằm trong function gom. Mỗi nhóm có nhiều row, database không biết lấy ${p.name} của row nào.`,
  'agg-with-column': (p) => `Query này có function gom nên cả table gom thành một row. Column ${p.name} đứng riêng thì database không biết lấy của row nào. Thêm GROUP BY ${p.name} hoặc bỏ column này.`,
  'sub-one-column': () => 'Subquery ở chỗ này chỉ được trả về một column.',
  'sub-one-row': (p) => `Subquery này trả về ${p.n} row, nhưng chỗ này chỉ nhận một giá trị. Dùng IN thay cho dấu =, hoặc sửa subquery để ra một row.`,
  'rownum-mysql': () => 'ROWNUM chỉ có ở Oracle. Ở MySQL, dùng LIMIT.',
  'no-parens': (p) => `Ở Oracle, ${p.name} viết không có ngoặc.`,
  'unknown-type': (p) => `Sau tên column ${p.after} cần một data type, ví dụ INT hoặc VARCHAR(50). Database không hiểu ${p.name}.`,
  'type-other-dialect': (p) => `${p.dialect} không có data type ${p.name}. Ở ${p.dialect}, dùng ${p.use}.`,
  'identity-other-dialect': (p) => `${p.dialect} không hiểu ${p.name}. Ở ${p.dialect}, viết ${p.use}.`,
  'varchar-length': (p) => `${p.name} cần độ dài trong ngoặc, ví dụ ${p.name}(50).`,
  'insert-multi-oracle': () => 'Oracle 19c chỉ nhận một row cho mỗi câu INSERT. Viết mỗi row một câu INSERT riêng.',
  'value-count': (p) => `Table cần ${p.need} giá trị cho mỗi row, nhưng bạn đưa ${p.got}.`,
  'dup-key': (p) => `Đã có một row mang ${p.column} = ${p.value}. Column ${p.column} không cho hai row trùng nhau.`,
  'not-null': (p) => `Column ${p.column} không được để NULL.`,
  'fk-parent': (p) => `Table ${p.parent} không có row nào mang ${p.pcolumn} = ${p.value}. Row mới phải trỏ tới một row có thật.`,
  'fk-child': (p) => `Còn ${p.n} row ở table ${p.child} đang trỏ tới row này. Database chặn lại để các row đó không trỏ vào chỗ trống.`,
  'check-fail': (p) => `Row này phạm luật CHECK (${p.check}).`,
  'bad-value': (p) => `Column ${p.column} có data type ${p.type}, không nhận giá trị ${p.value}.`,
  'table-exists': (p) => `Database đã có table tên ${p.name}.`,
  'name-used': (p) => `Database đã có table hoặc sequence tên ${p.name}. Đặt tên khác.`,
  'sequence-mysql': () => 'MySQL không có sequence. Muốn tự tăng số, viết AUTO_INCREMENT cho column.',
  'if-exists-oracle': (p) => `Oracle 19c không có ${p.stmt === 'DROP TABLE' ? 'IF EXISTS' : 'IF NOT EXISTS'}. Xóa phần đó đi.`,
  'default-order-oracle': () => 'Ở Oracle, DEFAULT đứng ngay sau data type, trước NOT NULL. Chuyển DEFAULT lên trước.',
  'column-word-oracle': () => 'Oracle không viết chữ COLUMN sau ADD hay MODIFY. Xóa chữ COLUMN.',
  'alter-comma-oracle': () => 'Oracle không nối nhiều thay đổi bằng dấu phẩy. Viết ADD (a ..., b ...) hoặc chạy từng ALTER TABLE.',
  'alter-option': (p) => `Sau tên table, ALTER TABLE cần ADD, MODIFY, DROP hoặc RENAME. Database không hiểu ${p.tok}.`,
  'truncate-table-oracle': () => 'Oracle cần chữ TABLE. Viết TRUNCATE TABLE tên_table.',
  'too-long': (p) =>
    `Column ${p.column} nhận tối đa ${p.max} ${p.unit ?? 'ký tự'}, nhưng giá trị này tốn ${p.actual}.` +
    (p.unit === 'byte' ? ' Chữ có dấu tốn 2 hay 3 byte. Viết VARCHAR2(n CHAR) để đếm theo ký tự.' : ' Cắt ngắn giá trị, hoặc tăng độ dài của column.'),
  'out-of-range': (p) => `Giá trị ${p.value} quá lớn cho column ${p.column} (${p.type}). Chọn giá trị nhỏ hơn, hoặc đổi data type của column.`,
  'no-default': (p) => `Column ${p.column} không được để NULL và không có DEFAULT. INSERT phải đưa giá trị cho column này.`,
  'dup-column': (p) => `Table đã có column tên ${p.name}. Đặt tên khác.`,
  'key-column-missing': (p) => `Table không có column tên ${p.name}. Kiểm tra chính tả.`,
  'multi-pk': () => 'Table chỉ có một primary key. Muốn gồm nhiều column, viết PRIMARY KEY (a, b).',
  'dup-constraint-name': (p) => `Tên ${p.name} đã có constraint dùng. Đặt tên khác.`,
  'fk-parent-table': (p) => `Table ${p.name} chưa có. Tạo table đó trước, rồi mới trỏ foreign key tới.`,
  'fk-parent-column': (p) => `Table ${p.table} không có column tên ${p.name}.`,
  'fk-no-key': (p) => `Foreign key chỉ trỏ tới column là primary key hoặc UNIQUE của table ${p.name}. Column này chưa phải.`,
  'fk-incompatible': (p) => `Column ${p.column} và column ${p.pcolumn} khác data type, nên foreign key không nối được. Cho hai column cùng data type.`,
  'fk-count': (p) => `Foreign key có ${p.got} column, nhưng REFERENCES có ${p.need}. Hai bên phải bằng nhau.`,
  'fk-set-null-not-null': (p) => `ON DELETE SET NULL cần column ${p.column} cho phép NULL. Bỏ NOT NULL ở column đó.`,
  'check-column': (p) => `CHECK ${p.name} nhắc tới column ${p.column}, mà chỗ này không dùng được column đó. Kiểm tra tên column.`,
  'bad-default': (p) => `DEFAULT của column ${p.column} không hợp với data type hay độ dài của column. Sửa giá trị mặc định.`,
  'length-too-big': (p) => `Độ dài của column ${p.name} lớn hơn limit ${p.max} của ${p.type}. Giảm độ dài xuống.`,
  'precision-range': (p) => `Tổng số chữ số của column ${p.name} phải từ 1 tới ${p.max}, mà bạn viết ${p.p}.`,
  'scale-over-precision': (p) => `Số chữ số sau dấu phẩy (${p.s}) không được lớn hơn tổng số chữ số (${p.p}). Sửa hai số trong ngoặc.`,
  'scale-range': (p) => `Số chữ số sau dấu phẩy của column ${p.name} phải từ -84 tới 127.`,
  'auto-key': () => 'AUTO_INCREMENT chỉ đặt được cho column là primary key hoặc UNIQUE. Thêm PRIMARY KEY cho column đó.',
  'unique-exists': () => 'Table đã có primary key hoặc UNIQUE trên đúng các column này. Không cần thêm lần nữa.',
  'pk-null-found': (p) => `Column ${p.column} đang có NULL, nên chưa làm primary key được. UPDATE các row đó thành giá trị thật trước.`,
  'add-not-null': (p) => `Table đang có row, nên column NOT NULL phải có DEFAULT. Thêm DEFAULT cho column ${p.column}, hoặc cho column nhận NULL.`,
  'already-not-null': (p) => `Column ${p.column} đã là NOT NULL.`,
  'already-null': (p) => `Column ${p.column} không đổi sang NULL được: nó đã nhận NULL, hoặc là primary key.`,
  'modify-null-found': (p) => `Column ${p.column} đang có NULL. UPDATE các row đó trước, rồi mới đặt NOT NULL.`,
  'modify-truncate': (p) => `Dữ liệu đang có không vừa với định nghĩa mới của column ${p.column}: có giá trị quá dài hoặc có NULL. Sửa dữ liệu trước, rồi MODIFY lại.`,
  'modify-too-small': (p) => `Column ${p.column} đang có giá trị dài hơn độ dài mới. Cắt ngắn các giá trị đó trước.`,
  'modify-type-nonempty': (p) => `Column ${p.column} đang có dữ liệu, nên không đổi sang data type khác nhóm được. Thêm một column mới thay vào.`,
  'modify-precision-nonempty': (p) => `Column ${p.column} đang có dữ liệu, nên không giảm số chữ số được.`,
  'drop-unknown-column': (p) => `Table không có column tên ${p.name} để xóa.`,
  'drop-all-columns': () => 'Không xóa hết column của table được. Muốn bỏ cả table, dùng DROP TABLE.',
  'drop-column-fk': (p) =>
    p.parent ? `Column ${p.column} đang được foreign key ${p.fk ?? ''} trỏ tới${p.table ? ` (table ${p.table})` : ''}. Xóa foreign key đó trước.` : `Column ${p.column} đang nằm trong foreign key ${p.fk}. Xóa foreign key đó trước.`,
  'drop-column-check': (p) => `Column ${p.column} đang nằm trong CHECK ${p.name}. Xóa CHECK đó trước.`,
  'drop-column-multi': (p) => `Column ${p.column} nằm trong constraint ${p.name} có nhiều column. Xóa constraint đó trước.`,
  'drop-constraint-missing': (p) => `Table này không có constraint tên ${p.name}.`,
  'drop-key-referenced': (p) => `Foreign key của table khác đang dựa vào ${p.name}. Xóa foreign key đó trước.`,
  'drop-referenced': (p) =>
    `Table ${p.child} có foreign key ${p.fk} đang trỏ tới table ${p.name}. Xóa table ${p.child} hoặc foreign key đó trước.` +
    (p.cascade ? ` Hoặc viết DROP TABLE ${p.name} CASCADE CONSTRAINTS để bỏ luôn các foreign key đó.` : ''),
  'truncate-referenced': (p) => `Table ${p.child} có foreign key trỏ tới table ${p.name}, nên không TRUNCATE được. Dùng DELETE FROM, hoặc xóa foreign key trước.`,
  'seq-increment-zero': () => 'INCREMENT BY phải khác 0.',
  'seq-missing': (p) => `Database không có sequence tên ${p.name}.`,
  'seq-curr-undefined': (p) => `Phiên làm việc này chưa gọi ${p.name}.NEXTVAL, nên CURRVAL chưa có giá trị. Gọi NEXTVAL trước.`,
  'no-tx': () => 'Chưa có thay đổi nào đang chờ, nên không có gì để lưu hay bỏ.',
  'select-only': () => 'Chỗ này chỉ chạy câu SELECT. Lệnh sửa dữ liệu có bài riêng ở Chương 7.',
  internal: () => 'Engine của khóa học chưa chạy được query này. Thử viết query gọn hơn.',
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
