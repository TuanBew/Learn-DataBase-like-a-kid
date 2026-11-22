import type { Dialect } from './types';

export interface Piece {
  /** Nguyên văn một lệnh, không có dấu ; ở cuối. */
  sql: string;
  /** Vị trí chữ đầu tiên của lệnh trong cả đoạn script. */
  start: number;
  /** Vị trí ngay sau chữ cuối cùng của lệnh. */
  end: number;
}

/**
 * Tách script thành từng lệnh theo dấu `;` nằm ngoài nháy và ngoài chú thích.
 * Phần chỉ có khoảng trắng hoặc chú thích không tính là lệnh.
 * Chú thích dùng cùng luật với tokenizer: `--` (MySQL cần dấu cách sau đó), `#` (MySQL) và chú thích kiểu C.
 */
export function splitStatements(sql: string, dialect: Dialect): Piece[] {
  const out: Piece[] = [];
  const n = sql.length;
  let i = 0;
  /** Vị trí chữ đầu tiên của lệnh đang đọc, -1 nếu chưa gặp chữ nào. */
  let first = -1;
  /** Vị trí ngay sau chữ cuối của lệnh đang đọc. */
  let last = -1;

  const flush = () => {
    if (first >= 0) out.push({ sql: sql.slice(first, last), start: first, end: last });
    first = -1;
    last = -1;
  };
  const mark = (from: number, to: number) => {
    if (first < 0) first = from;
    last = to;
  };

  while (i < n) {
    const c = sql[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '-' && sql[i + 1] === '-' && (dialect === 'oracle' || i + 2 >= n || /[\s\x00-\x1f]/.test(sql[i + 2]))) {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '#' && dialect === 'mysql') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < n) {
        const d = sql[j];
        if (d === '\\' && dialect === 'mysql' && c !== '`' && j + 1 < n) {
          j += 2;
          continue;
        }
        if (d === c) {
          if (sql[j + 1] === c) {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      mark(i, j);
      i = j;
      continue;
    }
    if (c === ';') {
      flush();
      i++;
      continue;
    }
    mark(i, i + 1);
    i++;
  }
  flush();
  return out;
}
