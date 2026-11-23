import type { ColumnDef, ConstraintDef, Database, Dialect, RawValue, TableDef, Value } from './types';
import { SqlError, oraMessage, type Span } from './errors';
import { friendly } from './messages.vi';
import { tokenize } from './tokenizer';
import { checkSchema, schemaMatches } from './executor';
import { type FkDef, columnsIn, constraintsOf, findTableIn, pkOf, sameName, typeNameOf, upper } from './catalog';
import type { ResultSet, Trace, TraceCol } from './trace';

/**
 * Xem cấu trúc database: SHOW TABLES, DESCRIBE, SHOW COLUMNS, SHOW CREATE TABLE (MySQL), DESC (Oracle),
 * và các view data dictionary của Oracle (USER_TABLES...). Không chạy SQL, chỉ đọc `Database`.
 */

type Sel = { ok: true; kind: 'select'; result: ResultSet; trace: Trace; tool?: true };

/* ---------- data type theo dialect ---------- */

const INT_MY: Record<string, string> = { INT: 'int', INTEGER: 'int', SMALLINT: 'smallint', BIGINT: 'bigint', TINYINT: 'tinyint', BOOLEAN: 'tinyint(1)' };

/** Số chữ số và số lẻ của column số. `undefined` là không ghi. */
function numParts(c: ColumnDef): { p?: number; s?: number } {
  return { p: c.precision, s: c.precision === undefined ? undefined : (c.scale ?? 0) };
}

/** Tên data type như DESCRIBE của dialect `d` viết: `varchar(50)`, `decimal(12,2)`, `VARCHAR2(50)`, `NUMBER(38)`. */
export function dialectType(c: ColumnDef, d: Dialect): string {
  const n = typeNameOf(c);
  const { p, s } = numParts(c);
  if (d === 'mysql') {
    switch (c.type) {
      case 'int':
        return p !== undefined && p > 0 && !INT_MY[n] ? `decimal(${p},${s})` : (INT_MY[n] ?? 'int');
      case 'decimal':
        if (n === 'FLOAT') return 'float';
        if (n === 'DOUBLE') return 'double';
        return `decimal(${p ?? 10},${s ?? 0})`;
      case 'text':
        if (n === 'TEXT' || n === 'CLOB') return 'text';
        return `${n === 'CHAR' ? 'char' : 'varchar'}(${c.length ?? 255})`;
      case 'date':
        return 'date';
      case 'datetime':
        return n === 'TIMESTAMP' ? 'timestamp' : 'datetime';
    }
  }
  switch (c.type) {
    case 'int':
      return p !== undefined ? (s ? `NUMBER(${p},${s})` : `NUMBER(${p})`) : 'NUMBER(38)';
    case 'decimal':
      if (n === 'FLOAT') return 'FLOAT(126)';
      return p !== undefined ? (s ? `NUMBER(${p},${s})` : `NUMBER(${p})`) : n === 'NUMBER' ? 'NUMBER' : 'NUMBER(10)';
    case 'text':
      if (n === 'TEXT' || n === 'CLOB') return 'CLOB';
      return `${n === 'CHAR' ? 'CHAR' : 'VARCHAR2'}(${c.length ?? 255}${c.charLength ? ' CHAR' : ''})`;
    case 'date':
      return 'DATE';
    case 'datetime':
      return 'TIMESTAMP(6)';
  }
}

/* ---------- giá trị DEFAULT ---------- */

const isNow = (s: string) => /^(CURRENT_TIMESTAMP|NOW\(\)|SYSDATE|LOCALTIMESTAMP)/i.test(s.trim());
const isStr = (s: string) => /^'.*'$/s.test(s.trim());
const isNum = (s: string) => /^-?\d+(\.\d+)?$/.test(s.trim());

/** Giá trị DEFAULT đã bỏ nháy. `null` là không có DEFAULT hoặc DEFAULT NULL. Dùng cho DESCRIBE và máy chấm. */
export function defaultValue(c: ColumnDef): string | number | null {
  const raw = c.default?.trim();
  if (raw === undefined || /^NULL$/i.test(raw)) return null;
  if (isStr(raw)) return raw.slice(1, -1).replace(/''/g, "'");
  if (isNum(raw)) return Number(raw);
  const inner = /^\((.*)\)$/s.exec(raw);
  if (inner && isNum(inner[1])) return Number(inner[1]);
  return raw;
}

/** Như MySQL: DEFAULT của column decimal được làm tròn theo số lẻ. */
function mysqlDefault(c: ColumnDef): string | null {
  const raw = c.default?.trim();
  if (raw === undefined) return null;
  if (isNow(raw)) return 'CURRENT_TIMESTAMP';
  const v = defaultValue(c);
  if (v === null) return null;
  if (typeof v === 'number') return c.type === 'decimal' || c.precision !== undefined ? v.toFixed(c.scale ?? 0) : String(v);
  return v;
}

/* ---------- tiện ích ---------- */

const tcol = (header: string, i: number): TraceCol => ({ key: `c${i}`, header, type: 'text' });

/** Kết quả như một SELECT: các column đều là chữ, header đúng nguyên văn (Oracle không in hoa lại). */
function table(sql: string, d: Dialect, name: string, columns: string[], rows: Value[][], tool?: true): Sel {
  const cols = columns.map(tcol);
  const trows = rows.map((cells, id) => ({ id, cells }));
  const result: ResultSet = { columns, types: columns.map(() => 'text'), rows, rowIds: rows.map((_r, i) => i) };
  const trace: Trace = {
    dialect: d,
    sql,
    clauses: [],
    focus: [],
    steps: [
      { kind: 'from', table: name, columns: cols, rows: trows },
      { kind: 'select', star: true, distinct: false, columns: cols, rows: trows, dropped: [], computed: [], duplicates: [] },
    ],
    result,
  };
  return { ok: true, kind: 'select', result, trace, ...(tool ? { tool } : {}) };
}

const isPk = (t: TableDef, c: ColumnDef) => !!pkOf(t)?.columns.some((n) => sameName(n, c.name));
const notNullOf = (t: TableDef, c: ColumnDef) => !!c.notNull || isPk(t, c);

/* ---------- MySQL ---------- */

function mysqlKey(t: TableDef, c: ColumnDef): string {
  if (isPk(t, c)) return 'PRI';
  const cons = constraintsOf(t);
  const first = (x: ConstraintDef) => 'columns' in x && sameName(x.columns[0], c.name);
  const solo = cons.some((x) => x.kind === 'unique' && x.columns.length === 1 && first(x));
  if (solo) return 'UNI';
  return cons.some((x) => (x.kind === 'unique' || x.kind === 'fk') && first(x)) ? 'MUL' : '';
}

function mysqlDescribe(t: TableDef, sql: string): Sel {
  const rows = t.columns.map((c): Value[] => {
    const raw = c.default?.trim();
    const generated = raw !== undefined && (isNow(raw) || raw.startsWith('('));
    const extra = [c.identity ? 'auto_increment' : '', generated ? 'DEFAULT_GENERATED' : ''].filter(Boolean).join(' ');
    return [c.name, dialectType(c, 'mysql'), notNullOf(t, c) ? 'NO' : 'YES', mysqlKey(t, c), mysqlDefault(c), extra];
  });
  return table(sql, 'mysql', t.name, ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], rows);
}

const bt = (s: string) => `\`${s}\``;
const btList = (xs: string[]) => xs.map(bt).join(',');
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** Biểu thức CHECK: tên column viết trong dấu `, cả biểu thức nằm trong một cặp ngoặc như MySQL in. */
function checkExpr(t: TableDef, source: string): string {
  const all = tokenize(source, 'mysql').filter((x) => x.type !== 'eof');
  // Biểu thức đã nằm trọn trong một cặp ngoặc (do chạy lại câu SHOW CREATE TABLE): bỏ cặp đó đi.
  let depth = 0;
  let wrapped = all.length > 1 && all[0].text === '(' && all[all.length - 1].text === ')';
  all.forEach((x, i) => {
    if (x.type === 'op' && x.text === '(') depth++;
    if (x.type === 'op' && x.text === ')') depth--;
    if (depth === 0 && i < all.length - 1) wrapped = false;
  });
  const expr = wrapped ? source.slice(all[0].e, all[all.length - 1].s) : source;
  let out = '';
  let at = 0;
  for (const tok of tokenize(expr, 'mysql')) {
    if (tok.type !== 'word') continue;
    const c = t.columns.find((x) => sameName(x.name, tok.text));
    if (!c) continue;
    out += expr.slice(at, tok.s) + bt(c.name);
    at = tok.e;
  }
  return `(${out + expr.slice(at)})`;
}

function nextAuto(t: TableDef): number {
  const ci = t.columns.findIndex((c) => c.identity);
  if (ci < 0) return 1;
  return t.autoInc ?? t.rows.reduce((m, r) => (typeof r[ci] === 'number' && (r[ci] as number) > m ? (r[ci] as number) : m), 0) + 1;
}

/** Câu CREATE TABLE dựng lại table, như SHOW CREATE TABLE của MySQL 8. */
export function mysqlCreate(t: TableDef): string {
  const lines: string[] = [];
  for (const c of t.columns) {
    let s = `${bt(c.name)} ${dialectType(c, 'mysql')}`;
    const ts = typeNameOf(c) === 'TIMESTAMP';
    if (notNullOf(t, c)) s += ' NOT NULL';
    else if (ts) s += ' NULL';
    if (c.identity) s += ' AUTO_INCREMENT';
    else if (c.default !== undefined && !/^NULL$/i.test(c.default.trim())) {
      const raw = c.default.trim();
      const shown = mysqlDefault(c);
      s += isNow(raw) ? ' DEFAULT CURRENT_TIMESTAMP' : raw.startsWith('(') ? ` DEFAULT (${raw})` : ` DEFAULT ${q(shown ?? '')}`;
    } else if (!notNullOf(t, c) && dialectType(c, 'mysql') !== 'text') s += ' DEFAULT NULL';
    lines.push(s);
  }
  const cons = constraintsOf(t);
  for (const k of cons) if (k.kind === 'pk') lines.push(`PRIMARY KEY (${btList(k.columns)})`);
  for (const k of cons) if (k.kind === 'unique') lines.push(`UNIQUE KEY ${bt(k.name)} (${btList(k.columns)})`);
  for (const k of cons) if (k.kind === 'fk') lines.push(`KEY ${bt(k.name)} (${btList(k.columns)})`);
  for (const k of cons) {
    if (k.kind !== 'fk') continue;
    const del = k.onDelete ? ` ON DELETE ${k.onDelete.toUpperCase()}` : '';
    lines.push(`CONSTRAINT ${bt(k.name)} FOREIGN KEY (${btList(k.columns)}) REFERENCES ${bt(k.refTable)} (${btList(k.refColumns)})${del}`);
  }
  for (const k of cons) if (k.kind === 'check') lines.push(`CONSTRAINT ${bt(k.name)} CHECK (${checkExpr(t, k.expr)})`);
  const n = nextAuto(t);
  const tail = `ENGINE=InnoDB${n > 1 ? ` AUTO_INCREMENT=${n}` : ''} DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
  return `CREATE TABLE ${bt(t.name)} (\n${lines.map((l) => `  ${l}`).join(',\n')}\n) ${tail}`;
}

/* ---------- Oracle: DESC và data dictionary ---------- */

function oracleDescribe(t: TableDef, sql: string): Sel {
  const rows = t.columns.map((c): Value[] => [upper(c.name), notNullOf(t, c) ? 'NOT NULL' : null, dialectType(c, 'oracle')]);
  return table(sql, 'oracle', t.name, ['Name', 'Null?', 'Type'], rows, true);
}

const V = (name: string, type: 'text' | 'int' = 'text'): ColumnDef => (type === 'int' ? { name, type, sqlType: 'NUMBER' } : { name, type, sqlType: 'VARCHAR2', length: 128 });
const view = (name: string, columns: ColumnDef[], rows: RawValue[][]): TableDef => ({ name, columns, rows });

/** Oracle không phân biệt kiểu của cột trong view: tên data type, độ dài, độ chính xác của một column. */
function oracleTypeInfo(c: ColumnDef): [string, number, number | null, number | null] {
  const { p, s } = numParts(c);
  switch (c.type) {
    case 'int':
      return p !== undefined ? ['NUMBER', 22, p, s ?? 0] : ['NUMBER', 22, null, 0];
    case 'decimal':
      return typeNameOf(c) === 'FLOAT' ? ['FLOAT', 22, 126, null] : p !== undefined ? ['NUMBER', 22, p, s ?? 0] : ['NUMBER', 22, null, null];
    case 'text': {
      const n = typeNameOf(c);
      if (n === 'TEXT' || n === 'CLOB') return ['CLOB', 4000, null, null];
      // Đã kiểm trên Oracle XE 21c thật: VARCHAR2(20 CHAR) có DATA_LENGTH 80, tức 4n (AL32UTF8).
      return [n === 'CHAR' ? 'CHAR' : 'VARCHAR2', (c.length ?? 255) * (c.charLength ? 4 : 1), null, null];
    }
    case 'date':
      return ['DATE', 7, null, null];
    case 'datetime':
      return ['TIMESTAMP(6)', 11, null, null];
  }
}

const DICT_RE = /\b(USER|ALL)_(TABLES|TAB_COLUMNS|CONSTRAINTS|CONS_COLUMNS|SEQUENCES|VIEWS)\b/i;

/** Có nhắc tới view data dictionary không. */
export const mentionsDictionary = (sql: string): boolean => DICT_RE.test(sql);

/** Các view data dictionary của Oracle, dựng từ database hiện tại. */
export function dictionary(db: Database): TableDef[] {
  const owner = upper(db.name);
  const tables = db.tables.map((t) => upper(t.name));
  const colRows = (own: boolean): RawValue[][] =>
    db.tables.flatMap((t) =>
      t.columns.map((c, i): RawValue[] => {
        const [type, len, prec, scale] = oracleTypeInfo(c);
        const def = c.identity ? null : c.default === undefined ? null : c.default;
        const row: RawValue[] = [upper(t.name), upper(c.name), type, len, prec, scale, notNullOf(t, c) ? 'N' : 'Y', i + 1, def];
        return own ? row : [owner, ...row];
      }),
    );
  const colDefs = [V('TABLE_NAME'), V('COLUMN_NAME'), V('DATA_TYPE'), V('DATA_LENGTH', 'int'), V('DATA_PRECISION', 'int'), V('DATA_SCALE', 'int'), V('NULLABLE'), V('COLUMN_ID', 'int'), V('DATA_DEFAULT')];

  const refName = (fk: FkDef): string | null => {
    const parent = findTableIn(db, fk.refTable);
    const key = constraintsOf(parent ?? { name: '', columns: [], rows: [] }).find(
      (k) => (k.kind === 'pk' || k.kind === 'unique') && k.columns.length === fk.refColumns.length && k.columns.every((x, i) => sameName(x, fk.refColumns[i])),
    );
    return key ? upper(key.name) : null;
  };
  const cons: RawValue[][] = [];
  const consCols: RawValue[][] = [];
  for (const t of db.tables) {
    for (const k of constraintsOf(t)) {
      const name = upper(k.name);
      const T = upper(t.name);
      if (k.kind === 'check') {
        cons.push([name, 'C', T, k.expr, null, null]);
        for (const i of columnsIn(k.expr, t, 'oracle')) consCols.push([name, T, upper(t.columns[i].name), null]);
        continue;
      }
      const type = k.kind === 'pk' ? 'P' : k.kind === 'unique' ? 'U' : 'R';
      const rule = k.kind === 'fk' ? (k.onDelete === 'cascade' ? 'CASCADE' : k.onDelete === 'set null' ? 'SET NULL' : 'NO ACTION') : null;
      cons.push([name, type, T, null, k.kind === 'fk' ? refName(k) : null, rule]);
      k.columns.forEach((c, i) => consCols.push([name, T, upper(c), i + 1]));
    }
  }
  return [
    view('USER_TABLES', [V('TABLE_NAME')], tables.map((n) => [n])),
    view('ALL_TABLES', [V('OWNER'), V('TABLE_NAME')], tables.map((n) => [owner, n])),
    view('USER_TAB_COLUMNS', colDefs, colRows(true)),
    view('ALL_TAB_COLUMNS', [V('OWNER'), ...colDefs], colRows(false)),
    view('USER_VIEWS', [V('VIEW_NAME'), V('TEXT')], (db.views ?? []).map((v) => [upper(v.name), v.sql])),
    view('ALL_VIEWS', [V('OWNER'), V('VIEW_NAME'), V('TEXT')], (db.views ?? []).map((v) => [owner, upper(v.name), v.sql])),
    view('USER_CONSTRAINTS', [V('CONSTRAINT_NAME'), V('CONSTRAINT_TYPE'), V('TABLE_NAME'), V('SEARCH_CONDITION'), V('R_CONSTRAINT_NAME'), V('DELETE_RULE')], cons),
    view('USER_CONS_COLUMNS', [V('CONSTRAINT_NAME'), V('TABLE_NAME'), V('COLUMN_NAME'), V('POSITION', 'int')], consCols),
    // Đã kiểm trên Oracle XE 21c thật: LAST_NUMBER là số đầu tiên của lô kế tiếp chưa giữ sẵn. Chưa gọi NEXTVAL thì bằng START WITH.
    // Mặc định CACHE 20: sau n lần NEXTVAL, LAST_NUMBER = start + ceil(n / cache) * cache * increment. NOCACHE: số kế tiếp sẽ cấp.
    // Chưa mô phỏng: MINVALUE, MAXVALUE (engine chưa dạy) và sequence ngầm của identity (ISEQ$$_...).
    view(
      'USER_SEQUENCES',
      [V('SEQUENCE_NAME'), V('INCREMENT_BY', 'int'), V('LAST_NUMBER', 'int')],
      (db.sequences ?? []).map((s) => {
        const cache = s.cache ?? 20;
        const used = s.last === undefined ? 0 : (s.last - s.start) / s.increment + 1;
        return [upper(s.name), s.increment, used === 0 ? s.start : cache === 0 ? s.last! + s.increment : s.start + Math.ceil(used / cache) * cache * s.increment];
      }),
    ),
  ];
}

/** Database cộng thêm các view data dictionary, để SELECT thường đọc được. Table của người học che view cùng tên. */
export function withDictionary(db: Database): Database {
  return { ...db, tables: [...db.tables, ...dictionary(db).filter((v) => !findTableIn(db, v.name))] };
}

/* ---------- đọc lệnh ---------- */

const noTable = (d: Dialect, db: Database, name: string, span: Span): SqlError => {
  const text = friendly['unknown-table']({ name });
  if (d === 'mysql') return new SqlError('name', '1146', `ERROR 1146 (42S02): Table '${db.name}.${name}' doesn't exist`, 'unknown-table', text, span);
  return new SqlError('name', 'ORA-04043', `ORA-04043: object ${name} does not exist`, 'unknown-table', text, span);
};

/**
 * Nhận ra lệnh xem cấu trúc. Trả `undefined` nếu câu này không phải lệnh đó, để parser xử lý tiếp.
 * MySQL: SHOW TABLES, DESCRIBE t, DESC t, SHOW COLUMNS FROM t, SHOW CREATE TABLE t. Oracle: DESC t, DESCRIBE t.
 */
export function toolCommand(sql: string, db: Database, d: Dialect): Sel | { ok: false; error: SqlError } | undefined {
  let toks;
  try {
    toks = tokenize(sql, d);
  } catch {
    return undefined;
  }
  toks = toks.filter((t) => t.type !== 'eof');
  if (toks.at(-1)?.text === ';') toks.pop();
  if (toks.some((t) => t.text === ';') || toks.length === 0) return undefined;
  // DESC schema.table: kiểm schema rồi bỏ nó đi, phần còn lại chạy như DESC table.
  const first = toks[0].type === 'word' ? toks[0].value : '';
  if (['DESC', 'DESCRIBE'].includes(first) && toks.length === 4 && toks[2].text === '.' && toks[1].type !== 'op' && toks[3].type !== 'op') {
    const sch = { name: toks[1].type === 'qident' ? toks[1].value : toks[1].text, quoted: toks[1].type === 'qident' };
    if (!schemaMatches(db, d, sch)) {
      const whole = { s: toks[1].s, e: toks[3].e };
      // Oracle: DESC báo ORA-04043 (object does not exist), không phải ORA-00942.
      if (d === 'oracle') return { ok: false, error: noTable(d, db, `${upper(sch.name)}.${upper(toks[3].text)}`, whole) };
      try {
        checkSchema(db, d, { ...sch, span: { s: toks[1].s, e: toks[1].e } }, toks[3].text, whole);
      } catch (e) {
        return { ok: false, error: e as SqlError };
      }
    }
    toks = [toks[0], toks[3]];
  }
  const w = toks.map((t) => (t.type === 'word' ? t.value : ''));
  const named = (i: number) => toks.length === i + 1 && (toks[i].type === 'word' || toks[i].type === 'qident');
  const span = (i: number): Span => ({ s: toks[i].s, e: toks[i].e });

  const find = (i: number): TableDef | { ok: false; error: SqlError } => {
    const tok = toks[i];
    const found = db.tables.find((t) => (d === 'oracle' && tok.type === 'qident' ? upper(t.name) === tok.value : sameName(t.name, tok.type === 'qident' ? tok.value : tok.text)));
    if (found) return found;
    return { ok: false, error: noTable(d, db, tok.type === 'qident' ? tok.value : tok.text, span(i)) };
  };
  const want = (i: number, f: (t: TableDef) => Sel) => {
    const t = find(i);
    return 'ok' in t ? t : f(t);
  };

  if (d === 'mysql') {
    const full = w[0] === 'SHOW' && w[1] === 'FULL' && w[2] === 'TABLES' && toks.length === 3;
    if ((w[0] === 'SHOW' && w[1] === 'TABLES' && toks.length === 2) || full) {
      const names = [...db.tables.map((t) => ({ n: t.name, v: false })), ...(db.views ?? []).map((v) => ({ n: v.name, v: true }))].sort((a, b) => a.n.toLowerCase().localeCompare(b.n.toLowerCase()));
      if (full) return table(sql, d, 'tables', [`Tables_in_${db.name}`, 'Table_type'], names.map((x) => [x.n, x.v ? 'VIEW' : 'BASE TABLE']));
      return table(sql, d, 'tables', [`Tables_in_${db.name}`], names.map((x) => [x.n]));
    }
    if ((w[0] === 'DESCRIBE' || w[0] === 'DESC') && named(1)) return want(1, (t) => mysqlDescribe(t, sql));
    if (w[0] === 'SHOW' && (w[1] === 'COLUMNS' || w[1] === 'FIELDS') && (w[2] === 'FROM' || w[2] === 'IN') && named(3)) return want(3, (t) => mysqlDescribe(t, sql));
    if (w[0] === 'SHOW' && w[1] === 'CREATE' && w[2] === 'TABLE' && named(3)) return want(3, (t) => table(sql, d, t.name, ['Table', 'Create Table'], [[t.name, mysqlCreate(t)]]));
    return undefined;
  }
  if ((w[0] === 'DESCRIBE' || w[0] === 'DESC') && named(1)) {
    const tok = toks[1];
    const shown = tok.type === 'qident' ? tok.value : tok.text;
    const all = withDictionary(db);
    const t = all.tables.find((x) => (tok.type === 'qident' ? upper(x.name) === tok.value : sameName(x.name, shown)));
    return t ? oracleDescribe(t, sql) : { ok: false, error: noTable(d, db, shown, span(1)) };
  }
  if (w[0] === 'SHOW' && w[1] === 'TABLES' && toks.length === 2) {
    return { ok: false, error: new SqlError('syntax', 'ORA-00900', oraMessage('00900'), 'show-in-oracle', friendly['show-in-oracle']({}), { s: toks[0].s, e: toks[1].e }) };
  }
  return undefined;
}
