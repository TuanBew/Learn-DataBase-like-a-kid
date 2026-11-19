import type { Dialect } from './types';
import { syntaxError } from './errors';

export type TokType = 'word' | 'qident' | 'num' | 'str' | 'op' | 'eof';

export interface Token {
  type: TokType;
  /** Nguyên văn trong câu query. */
  text: string;
  /** Với word: chữ in hoa. Với str và qident: nội dung trong nháy. Với num và op: như text. */
  value: string;
  s: number;
  e: number;
  /** Chuỗi viết bằng nháy kép (chỉ MySQL). */
  dquote?: boolean;
}

const OPS3 = ['<=>'];
const OPS2 = ['<>', '!=', '<=', '>=', '||', '&&'];
const OPS1 = '=<>+-*/%(),.;!';

export function tokenize(sql: string, dialect: Dialect): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = sql.length;
  const isWordStart = (c: string) => /[\p{L}_]/u.test(c);
  const isWordChar = (c: string) => /[\p{L}\p{N}_$#]/u.test(c);

  while (i < n) {
    const c = sql[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    // chú thích
    if (c === '-' && sql[i + 1] === '-') {
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
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(sql[i + 1] ?? ''))) {
      let j = i;
      while (j < n && /[0-9]/.test(sql[j])) j++;
      if (sql[j] === '.' && /[0-9]/.test(sql[j + 1] ?? '')) {
        j++;
        while (j < n && /[0-9]/.test(sql[j])) j++;
      } else if (sql[j] === '.' && !isWordStart(sql[j + 1] ?? ' ')) {
        j++;
      }
      const text = sql.slice(i, j);
      out.push({ type: 'num', text, value: text, s: i, e: j });
      i = j;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      let val = '';
      let closed = false;
      while (j < n) {
        const d = sql[j];
        if (d === '\\' && dialect === 'mysql' && c !== '`' && j + 1 < n) {
          val += sql[j + 1];
          j += 2;
          continue;
        }
        if (d === c) {
          if (sql[j + 1] === c) {
            val += c;
            j += 2;
            continue;
          }
          closed = true;
          j++;
          break;
        }
        val += d;
        j++;
      }
      if (c === '`' && dialect === 'oracle') {
        throw syntaxError(dialect, sql, { s: i, e: i + 1 }, '00911', 'backtick-oracle');
      }
      if (!closed) {
        throw syntaxError(dialect, sql, { s: i, e: n }, '01756', 'unterminated-string');
      }
      const text = sql.slice(i, j);
      if (c === "'") out.push({ type: 'str', text, value: val, s: i, e: j });
      else if (c === '"' && dialect === 'mysql') out.push({ type: 'str', text, value: val, s: i, e: j, dquote: true });
      else out.push({ type: 'qident', text, value: val, s: i, e: j });
      i = j;
      continue;
    }
    if (isWordStart(c)) {
      let j = i + 1;
      while (j < n && isWordChar(sql[j])) j++;
      const text = sql.slice(i, j);
      out.push({ type: 'word', text, value: text.toUpperCase(), s: i, e: j });
      i = j;
      continue;
    }
    const three = sql.slice(i, i + 3);
    const two = sql.slice(i, i + 2);
    if (OPS3.includes(three)) {
      out.push({ type: 'op', text: three, value: three, s: i, e: i + 3 });
      i += 3;
      continue;
    }
    if (OPS2.includes(two)) {
      out.push({ type: 'op', text: two, value: two === '!=' ? '<>' : two, s: i, e: i + 2 });
      i += 2;
      continue;
    }
    if (OPS1.includes(c)) {
      if (c === '%' && dialect === 'oracle') {
        throw syntaxError(dialect, sql, { s: i, e: i + 1 }, '00911', 'percent-oracle');
      }
      out.push({ type: 'op', text: c, value: c, s: i, e: i + 1 });
      i++;
      continue;
    }
    throw syntaxError(dialect, sql, { s: i, e: i + 1 }, '00911', 'bad-char', { ch: c });
  }
  out.push({ type: 'eof', text: '', value: '', s: n, e: n });
  return out;
}
