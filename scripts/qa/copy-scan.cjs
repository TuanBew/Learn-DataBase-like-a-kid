// Quét từ cấm và dấu hiệu văn AI trong mọi chữ người học nhìn thấy.
// Dùng: node scripts/qa/copy-scan.cjs
// In từng chỗ nghi phạm luật ở CLAUDE.md. Thoát với mã 1 nếu còn chỗ nào.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const DIRS = ['src/content', 'src/theater/copy.vi.ts', 'src/engine/messages.vi.ts', 'src/pages', 'src/components', 'src/scenes', 'src/theater'];

/** Cụm từ đời thường hợp lệ. Xóa khỏi dòng trước khi dò từ cấm. */
const ALLOWED = [
  'cửa hàng', 'bán hàng', 'ngân hàng', 'khách hàng', 'đơn hàng', 'hàng hóa', 'xếp hàng', 'mặt hàng', 'món hàng', 'giỏ hàng', 'lấy hàng', 'cất hàng', 'mang hàng', 'hàng xếp', 'hàng về', 'hàng trong', 'hàng nào', 'kho hàng', 'hàng ngày', 'hàng tháng', 'hàng năm', 'hàng trăm', 'hàng nghìn', 'hàng triệu', 'hàng loạt',
  'trường học', 'trường hợp', 'nhà trường', 'ở trường', 'tới trường',
  'giao dịch ngân hàng', 'giao dịch của ngân hàng', 'lưu giao dịch', 'ghi giao dịch', 'một giao dịch chuyển', 'giao dịch chuyển tiền',
  'bảng điểm', 'bảng giá', 'bảng đen', 'bảng tin',
  'dòng chữ', 'dòng lỗi', 'dòng này', 'dòng đầu', 'dòng cuối', 'dòng thứ', 'một dòng', 'từng dòng', 'mỗi dòng', 'xuống dòng', 'dòng tiền', 'dòng code', 'dòng nguồn', 'hai dòng', 'dòng chú', 'dòng ghi', 'dòng trên', 'dòng dưới', 'dòng kế', 'cuối dòng', 'đầu dòng', 'dòng mới', 'dòng lệnh', 'cùng dòng', 'dòng mục', 'dòng của', 'dòng in',
  'hàm ý', 'chỉ số báo danh', 'cột mốc', 'trần nhà',
  'sự thật', 'sự kiện', 'sự cố', 'lịch sự', 'nhân sự',
  'danh sách giao dịch', 'các giao dịch', 'trường vừa',
  'công việc', 'làm việc', 'việc làm', 'việc của', 'việc này', 'việc gì', 'việc khác', 'việc nhà', 'một việc', 'hai việc', 'ba việc', 'mọi việc', 'các việc', 'việc cần', 'việc đầu', 'đúng việc', 'xong việc', 'việc đó', 'việc nào', 'việc nặng', 'việc sau', 'đi làm', 'việc chính', 'phần việc', 'chia việc', 'giao việc', 'việc còn',
];

const RULES = [
  { name: 'từ cấm', re: /(?<![\p{L}])(cơ sở dữ liệu|hệ quản trị|bảng|bản ghi|cột|khóa chính|khóa ngoại|chỉ mục|truy vấn|lược đồ|ràng buộc|mệnh đề|kiểu dữ liệu)(?![\p{L}])/giu },
  { name: 'từ cấm (hàng, dòng, trường, hàm, trần, giao dịch)', re: /(?<![\p{L}])(hàng|dòng|trường|hàm|trần|giao dịch)(?![\p{L}])/giu },
  { name: 'văn AI', re: /(Hãy cùng|Dưới đây là|Tóm lại|Hy vọng|không chỉ[^.]{0,40}mà còn|đóng vai trò quan trọng|then chốt|hành trình|khám phá|nâng tầm|chìa khóa|mở ra cánh cửa|một cách hiệu quả|liền mạch|vô cùng|cực kỳ)/giu },
  { name: 'văn dịch', re: /(Điều này|(?<![\p{L}])được [^.]{0,30} bởi|(?<![\p{L}])tiến hành(?![\p{L}])|(?<![\p{L}])một cách (?!nối|viết|ghi|khác|làm|hỏi|nói|đọc|dùng|lọc|tính|gọi|để|là)|(?<![\p{L}])việc(?![\p{L}])|(?<![\p{L}])sự(?![\p{L}]))/gu },
  { name: 'mở câu bằng Nó', re: /(^|[.!?:] |['"`])Nó /gu },
  { name: 'gạch ngang dài', re: /[—–]/gu },
  { name: 'xưng hô', re: /(?<![\p{L}])(chúng ta|các bạn|chúng mình)(?![\p{L}])/giu },
];

function files(p) {
  const abs = path.join(root, p);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [abs];
  return fs.readdirSync(abs).flatMap((f) => files(path.join(p, f)));
}

/** Chỉ lấy phần chữ trong chuỗi của file, bỏ comment, import và đoạn trong dấu `...` của Rich. */
function visible(line) {
  if (/^\s*(\/\/|\*|\/\*|import |export type|type |interface )/.test(line)) return '';
  const parts = [];
  const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`|>([^<>{}]+)</g;
  let m;
  while ((m = re.exec(line))) parts.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? '');
  return parts.join(' \u0001 ');
}

const list = [...new Set(DIRS.flatMap(files))].filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f));
// Hai câu chủ dự án tự chọn ở trang chủ: không sửa theo luật viết.
const OWNER = [/^\s*title: 'Hãy cùng nhau hiểu rõ Database và SQL nào!',/, /^\s*lead: 'Khóa học này sẽ giúp bạn hiểu rõ hơn/];
let hits = 0;
for (const file of list) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (OWNER.some((r) => r.test(line))) return;
    // Chuỗi SQL và tên kỹ thuật không phải chữ cho người đọc.
    if (/^\s*(sql|mysql|oracle|code|find|solution|starter|skeleton|from|url|href|className|id|scene|key):/.test(line)) return;
    let text = visible(line);
    if (!/[À-ỹ]/.test(text)) return;
    // Họ Trần đứng trước một tên viết hoa là tên người, không phải từ cấm.
    text = text.replace(/Trần(?= \p{Lu})/gu, ' ');
    // Bỏ các cụm đời thường hợp lệ, giữ nguyên chữ hoa chữ thường của phần còn lại.
    for (const a of ALLOWED) text = text.replace(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu'), ' ');
    const clean = text.toLowerCase();
    for (const rule of RULES) {
      const src = rule.name.startsWith('từ cấm') || rule.name === 'xưng hô' ? clean : text;
      const found = src.match(rule.re);
      if (found) {
        hits++;
        console.log(`${path.relative(root, file)}:${i + 1} [${rule.name}] ${[...new Set(found.map((x) => x.trim()))].join(', ')} | ${line.trim().slice(0, 150)}`);
      }
    }
  });
}
console.log(`\nĐã quét ${list.length} file. Số dòng nghi phạm luật: ${hits}`);
process.exit(hits ? 1 : 0);
