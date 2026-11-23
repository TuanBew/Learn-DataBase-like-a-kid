import type { Dialect } from './types';
import { friendly } from './messages.vi';

export type ErrorKind = 'syntax' | 'name' | 'unsupported' | 'runtime';

export interface Span {
  s: number;
  e: number;
}

/** Lỗi mà người học nhìn thấy. Luôn có mã lỗi thật của dialect và lời giải thích dễ hiểu. */
export class SqlError extends Error {
  kind: ErrorKind;
  /** '1064', 'ORA-00933', hoặc 'CHUA-HOC' cho phần khóa học chưa dạy. */
  code: string;
  /** Nguyên văn dòng lỗi mà DBMS thật in ra. */
  dbMessage: string;
  /** Lời giải thích tiếng Việt. */
  friendly: string;
  /** Chỗ sai trong câu query, để gạch chân. */
  span: Span;
  /** Gợi ý sửa, ví dụ tên gần đúng. */
  tip?: string;
  /** Tên tình huống, dùng trong test. */
  hint: string;

  constructor(kind: ErrorKind, code: string, dbMessage: string, hint: string, text: string, span: Span, tip?: string) {
    super(dbMessage);
    this.kind = kind;
    this.code = code;
    this.dbMessage = dbMessage;
    this.hint = hint;
    this.friendly = text;
    this.span = span;
    this.tip = tip;
  }
}

const ORA: Record<string, string> = {
  '00001': 'unique constraint violated',
  '00900': 'invalid SQL statement',
  '00902': 'invalid datatype',
  '00903': 'invalid table name',
  '00904': 'invalid identifier',
  '00905': 'missing keyword',
  '00906': 'missing left parenthesis',
  '00907': 'missing right parenthesis',
  '00908': 'missing NULL keyword',
  '00909': 'invalid number of arguments',
  '00910': 'specified length too long for its datatype',
  '00911': 'invalid character',
  '00913': 'too many values',
  '00918': 'column ambiguously defined',
  '00920': 'invalid relational operator',
  '00922': 'missing or invalid option',
  '00923': 'FROM keyword not found where expected',
  '00924': 'missing BY keyword',
  '00925': 'missing INTO keyword',
  '00926': 'missing VALUES keyword',
  '00927': 'missing equal sign',
  '00928': 'missing SELECT keyword',
  '00933': 'SQL command not properly ended',
  '00932': 'inconsistent datatypes',
  '00934': 'group function is not allowed here',
  '00936': 'missing expression',
  '00937': 'not a single-group group function',
  '00942': 'table or view does not exist',
  '00947': 'not enough values',
  '00955': 'name is already used by an existing object',
  '00957': 'duplicate column name',
  '00971': 'missing SET keyword',
  '00975': 'date + date not allowed',
  '00998': 'must name this expression with a column alias',
  '00979': 'not a GROUP BY expression',
  '01400': 'cannot insert NULL',
  '30483': 'window functions are not allowed here',
  '30484': 'missing window specification for this function',
  '30485': 'missing ORDER BY expression in the window specification',
  '32795': 'cannot insert into a generated always identity column',
  '01407': 'cannot update to NULL',
  '01416': 'two tables cannot be outer-joined to each other',
  '01468': 'a predicate may reference only one outer-joined table',
  '01719': 'outer join operator (+) not allowed in operand of OR or IN',
  '01785': 'ORDER BY item must be the number of a SELECT-list expression',
  '01789': 'query block has incorrect number of result columns',
  '01790': 'expression must have same datatype as corresponding expression',
  '01799': 'a column may not be outer-joined to a subquery',
  '25154': 'column part of USING clause cannot have qualifier',
  '25155': 'column used in NATURAL join cannot have qualifier',
  '25156': 'old style outer join (+) cannot be used with ANSI joins',
  '32038': 'number of WITH clause column names does not match number of elements in select list',
  '30563': 'outer join operator (+) is not allowed here',
  '01427': 'single-row subquery returns more than one row',
  '01430': 'column being added already exists in table',
  '01438': 'value larger than specified precision allowed for this column',
  '01439': 'column to be modified must be empty to change datatype',
  '01440': 'column to be modified must be empty to decrease precision or scale',
  '01441': 'cannot decrease column length because some value is too big',
  '01442': 'column to be modified to NOT NULL is already NOT NULL',
  '01449': 'column contains NULL values; cannot alter to NOT NULL',
  '01451': 'column to be modified to NULL cannot be modified to NULL',
  '01426': 'numeric overflow',
  '01476': 'divisor is equal to zero',
  '01481': 'invalid number format model',
  '01489': 'result of string concatenation is too long',
  '01722': 'invalid number',
  '01727': 'numeric precision specifier is out of range (1 to 38)',
  '01728': 'numeric scale specifier is out of range (-84 to 127)',
  '01723': 'zero-length columns are not allowed',
  '01735': 'invalid ALTER TABLE option',
  '01756': 'quoted string not properly terminated',
  '01758': 'table must be empty to add mandatory (NOT NULL) column',
  '01846': 'not a valid day of the week',
  '01861': 'literal does not match format string',
  '01899': 'bad precision specifier',
  '02256': 'number of referencing columns must match referenced columns',
  '02260': 'table can have only one primary key',
  '02261': 'such unique or primary key already exists in the table',
  '02264': 'name already used by an existing constraint',
  '02266': 'unique/primary keys in table referenced by enabled foreign keys',
  '02267': 'column type incompatible with referenced column type',
  '02270': 'no matching unique or primary key for this column-list',
  '02273': 'this unique/primary key is referenced by some foreign keys',
  '02289': 'sequence does not exist',
  '02290': 'check constraint violated',
  '02291': 'integrity constraint violated - parent key not found',
  '02292': 'integrity constraint violated - child record found',
  '02441': 'Cannot drop nonexistent primary key',
  '02443': 'Cannot drop constraint  - nonexistent constraint',
  '02449': 'unique/primary keys in table referenced by foreign keys',
  '02210': 'no options specified for ALTER TABLE',
  '03290': 'Invalid truncate command - missing CLUSTER or TABLE keyword',
  '04002': 'INCREMENT must be a non-zero integer',
  '04010': 'the number of values to CACHE must be greater than 1',
  '12983': 'cannot drop all columns in a table',
  '12991': 'column is referenced in a multi-column constraint',
  '12992': 'cannot drop parent key column',
};

export type OraCode = keyof typeof ORA | string;

type Params = Record<string, string | number | undefined>;

function say(hint: string, p: Params): string {
  const f = friendly[hint] ?? friendly.unexpected;
  return f(p);
}

/** Dòng lỗi 1064 của MySQL: trích phần query từ chỗ sai tới hết. */
function mysql1064(sql: string, at: number): string {
  const line = sql.slice(0, at).split('\n').length;
  const near = sql.slice(at).replace(/\s+$/, '').slice(0, 80);
  return `ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${near}' at line ${line}`;
}

export function oraMessage(code: OraCode, ident?: string): string {
  const text = ORA[code] ?? 'error';
  return ident ? `ORA-${code}: ${ident}: ${text}` : `ORA-${code}: ${text}`;
}

/** Lỗi cú pháp. MySQL luôn là 1064. Oracle dùng mã `ora`. */
export function syntaxError(
  dialect: Dialect,
  sql: string,
  span: Span,
  ora: OraCode,
  hint: string,
  p: Params = {},
  tip?: string,
): SqlError {
  if (dialect === 'mysql') {
    return new SqlError('syntax', '1064', mysql1064(sql, span.s), hint, say(hint, p), span, tip);
  }
  return new SqlError('syntax', `ORA-${ora}`, oraMessage(ora), hint, say(hint, p), span, tip);
}

export function unknownTable(dialect: Dialect, dbName: string, name: string, span: Span, tip?: string): SqlError {
  const text = say('unknown-table', { name });
  if (dialect === 'mysql') {
    return new SqlError('name', '1146', `ERROR 1146 (42S02): Table '${dbName}.${name}' doesn't exist`, 'unknown-table', text, span, tip);
  }
  return new SqlError('name', 'ORA-00942', oraMessage('00942'), 'unknown-table', text, span, tip);
}

export type MysqlWhere = 'field list' | 'where clause' | 'order clause' | 'group statement' | 'having clause' | 'on clause' | 'from clause';

export function unknownColumn(
  dialect: Dialect,
  shown: string,
  oraIdent: string,
  where: MysqlWhere,
  span: Span,
  hint: string,
  p: Params,
  tip?: string,
): SqlError {
  if (dialect === 'mysql') {
    return new SqlError('name', '1054', `ERROR 1054 (42S22): Unknown column '${shown}' in '${where}'`, hint, say(hint, p), span, tip);
  }
  return new SqlError('name', 'ORA-00904', oraMessage('00904', oraIdent), hint, say(hint, p), span, tip);
}

export function unknownFunction(dialect: Dialect, dbName: string, name: string, span: Span, hint: string, p: Params): SqlError {
  if (dialect === 'mysql') {
    return new SqlError('name', '1305', `ERROR 1305 (42000): FUNCTION ${dbName}.${name} does not exist`, hint, say(hint, p), span);
  }
  return new SqlError('name', 'ORA-00904', oraMessage('00904', `"${name.toUpperCase()}"`), hint, say(hint, p), span);
}

/** Lỗi lúc chạy. `mysql` là [mã, sqlstate, nguyên văn]. */
export function runtimeError(
  dialect: Dialect,
  mysql: [string, string, string],
  ora: OraCode,
  span: Span,
  hint: string,
  p: Params = {},
): SqlError {
  if (dialect === 'mysql') {
    return new SqlError('runtime', mysql[0], `ERROR ${mysql[0]} (${mysql[1]}): ${mysql[2]}`, hint, say(hint, p), span);
  }
  return new SqlError('runtime', `ORA-${ora}`, oraMessage(ora), hint, say(hint, p), span);
}

/** Lỗi lúc chạy của Oracle có phần chữ riêng, ví dụ ORA-01428 nhắc tới giá trị gây lỗi. */
export function oraFail(code: string, text: string, hint: string, p: Params, span: Span): SqlError {
  return new SqlError('runtime', `ORA-${code}`, `ORA-${code}: ${text}`, hint, say(hint, p), span);
}

/** Phần nằm ngoài khóa học. Không có mã lỗi thật vì DBMS thật vẫn chạy được. */
export function unsupported(feature: string, span: Span, hint: 'unsupported' | 'not-yet' = 'unsupported'): SqlError {
  return new SqlError('unsupported', 'CHUA-HOC', '', hint, say(hint, { feature }), span);
}

/** Khoảng cách sửa chữ, để gợi ý tên gần đúng. */
export function nearest(name: string, candidates: string[]): string | undefined {
  const a = name.toLowerCase();
  let best: string | undefined;
  let bestD = Infinity;
  for (const c of candidates) {
    const b = c.toLowerCase();
    const d = lev(a, b);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  const limit = Math.max(2, Math.floor(a.length / 3));
  return best !== undefined && bestD <= limit && bestD > 0 ? best : undefined;
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}
