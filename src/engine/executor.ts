import type { ColumnDef, ColumnType, Database, Dialect, RawValue, SqlDate, TableDef, Value, ViewDef } from './types';
import { AGGREGATES, RANKING, WINDOW_AGGS, type ClauseKind, type CompareOp, type Cte, type Expr, type Join, type Query, RUN_ORDER, type SelectStmt, type SetStmt, type TableRef } from './ast';
import {
  type MysqlWhere,
  type Span,
  SqlError,
  nearest,
  oraFail,
  oraMessage,
  runtimeError,
  syntaxError,
  unknownColumn,
  unknownFunction,
  unknownTable,
  unsupported,
} from './errors';
import { FUNCTIONS, type FnEnv, addDays, arityOf, castValue, diffDays, extract } from './functions';
import { didYouMean, friendly, reason } from './messages.vi';
import type { ResultSet, Trace, TraceAct, TraceCol, TraceRow, TraceStep } from './trace';
import { parse } from './parser';
import { computeWindows, foldValues } from './window';
import { arith, compare, isDate, keyOf, like, norm, parseIsoDate, peekWarnings, resetWarnings, show, showQuoted, toNumber, toText, warn } from './values';

type ColExpr = Extract<Expr, { t: 'col' }>;
type FnExpr = Extract<Expr, { t: 'fn' }>;

export interface ScopeCol {
  /** Tên đứng trước dấu chấm: alias nếu có, không thì tên table. */
  qualifier: string;
  table: string;
  def: ColumnDef;
  idx: number;
  /** Column dùng để nối bằng USING hay NATURAL. Nó ẩn khỏi tên không có table đứng trước: tên đó chỉ về column gộp (`virtual`). */
  named?: 'using' | 'natural';
  /** Column gộp của USING hay NATURAL: giá trị là giá trị khác NULL đầu tiên trong các ô `from`. Không thuộc table nào. */
  virtual?: boolean;
  from?: number[];
  /** Column này thuộc query bên ngoài (subquery phụ thuộc). Giá trị đọc từ `outerEnv.cells`, không đọc từ row đang chạy. */
  outerEnv?: OuterEnv;
}

/**
 * Môi trường của query bên ngoài, đưa cho subquery. `cells` là row đang xét của query ngoài.
 * `used` thành true khi subquery nhắc tới column của query ngoài (hay xa hơn): kết quả của nó khi đó phụ thuộc row, không nhớ lại được.
 */
export interface OuterEnv {
  scope: ScopeCol[];
  cells: Value[];
  parent?: OuterEnv;
  used: boolean;
  /** Vị trí các column của `scope` mà subquery đã nhắc tới. Dùng làm khóa nhớ kết quả cho từng giá trị của row ngoài. */
  hits?: Set<number>;
}

/** Thứ một biểu thức cần để tính: các ô của row, nhóm row (khi đã gom), và số thứ tự ROWNUM. */
export interface Cx {
  cells: Value[];
  group?: Value[][];
  rownum?: number;
  /** Dòng tổng của ROLLUP: các key này đã được cuộn lên, nên mang giá trị NULL. */
  nullKeys?: Expr[];
  /** Giá trị đã tính của các window function trong query, theo từng node. */
  win?: Map<Expr, Value>;
}

export const DUAL: TableDef = { name: 'DUAL', columns: [{ name: 'DUMMY', type: 'text' }], rows: [['X']] };

/** "Bây giờ" của khóa học: thứ Hai ngay sau tuần có dữ liệu mẫu. */
export const DEFAULT_ENV: FnEnv = { now: { kind: 'date', iso: '2026-03-09 10:30:00' } };

const DIALECT_NAME = { mysql: 'MySQL', oracle: 'Oracle' } as const;
const UNITS = new Set(['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND']);
const CONDITION = new Set(['=', '<>', '<', '<=', '>', '>=', 'AND', 'OR']);

export const isCond = (e: Expr): boolean =>
  (e.t === 'bin' && CONDITION.has(e.op)) ||
  (e.t === 'unary' && e.op === 'NOT') ||
  e.t === 'isnull' ||
  e.t === 'in' ||
  e.t === 'insub' ||
  e.t === 'exists' ||
  e.t === 'quant' ||
  e.t === 'between' ||
  e.t === 'like';

/** Khóa chính xác của một giá trị (không gộp hoa thường như collation), để nhớ kết quả subquery theo row ngoài. */
const rawKey = (v: Value): string => (v === null ? '\u0000' : typeof v === 'object' ? `d${v.iso}` : `${typeof v}${String(v)}`);

const cmpOp = (op: CompareOp, c: number): boolean => (op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '<=' ? c <= 0 : op === '>' ? c > 0 : c >= 0);

/** Tên column hiện ra: Oracle in hoa, trừ column của subquery đã giữ đúng chữ. */
const hdr = (def: ColumnDef, d: Dialect): string => (d === 'oracle' && !def.exact ? def.name.toUpperCase() : def.name);

const isAgg = (e: Expr): e is FnExpr => e.t === 'fn' && AGGREGATES.has(e.name) && !e.over;

export function children(e: Expr): Expr[] {
  switch (e.t) {
    case 'unary':
    case 'isnull':
      return [e.e];
    case 'bin':
      return [e.l, e.r];
    case 'in':
      return [e.e, ...e.list];
    case 'insub':
    case 'quant':
      return [e.e];
    case 'between':
      return [e.e, e.lo, e.hi];
    case 'like':
      return [e.e, e.pat];
    case 'fn':
      return e.over ? [...e.args, ...e.over.partition, ...e.over.orderBy.map((o) => o.e)] : e.args;
    case 'case':
      return [...(e.operand ? [e.operand] : []), ...e.whens.flatMap((w) => [w.when, w.then]), ...(e.else ? [e.else] : [])];
    default:
      return [];
  }
}

function hasAgg(e: Expr): boolean {
  return isAgg(e) || children(e).some(hasAgg);
}

function load(v: RawValue, type: ColumnDef['type'], d: Dialect): Value {
  if (typeof v === 'string' && (type === 'date' || type === 'datetime')) return parseIsoDate(v) ?? v;
  return norm(v, d);
}

export function loadRows(table: TableDef, d: Dialect): Value[][] {
  if (table.loaded) return table.loaded.map((r) => [...r]);
  return table.rows.map((r) => r.map((v, i) => load(v, table.columns[i].type, d)));
}

/** Tên schema viết trước dấu chấm có đúng là schema của database này không. MySQL phân biệt hoa thường, Oracle thì không (trừ khi nằm trong nháy kép). */
export function schemaMatches(db: Database, d: Dialect, s: { name: string; quoted: boolean }): boolean {
  if (d === 'mysql') return s.name === db.name;
  return (s.quoted ? s.name : s.name.toUpperCase()) === db.name.toUpperCase();
}

/** Schema viết sai thì báo lỗi: MySQL 1049, Oracle ORA-00942. */
export function checkSchema(db: Database, d: Dialect, schema: TableRef['schema'], table: string, span: Span): void {
  if (!schema || schemaMatches(db, d, schema)) return;
  const p = { name: schema.name, db: d === 'oracle' ? db.name.toUpperCase() : db.name, table };
  if (d === 'mysql') throw new SqlError('name', '1049', `ERROR 1049 (42000): Unknown database '${schema.name}'`, 'unknown-schema', friendly['unknown-schema'](p), span);
  throw new SqlError('name', 'ORA-00942', oraMessage('00942'), 'unknown-schema', friendly['unknown-schema'](p), span);
}

/** View mà `ref` trỏ tới. Table (kể cả khối WITH) cùng tên che view. */
export function viewOf(db: Database, ref: TableRef, d: Dialect): ViewDef | undefined {
  if (ref.sub || !db.views?.length) return undefined;
  const same = (n: string) => (d === 'oracle' && ref.quoted ? n.toUpperCase() === ref.table : n.toLowerCase() === ref.table.toLowerCase());
  if (db.tables.some((x) => same(x.name))) return undefined;
  return db.views.find((v) => same(v.name));
}

export function findTable(db: Database, ref: TableRef, d: Dialect): TableDef {
  checkSchema(db, d, ref.schema, ref.table, ref.span);
  if (ref.table.toUpperCase() === 'DUAL') return DUAL;
  const t = db.tables.find((x) => (d === 'oracle' && ref.quoted ? x.name.toUpperCase() === ref.table : x.name.toLowerCase() === ref.table.toLowerCase()));
  if (!t) {
    const near = nearest(ref.table, db.tables.map((x) => x.name));
    throw unknownTable(d, db.name, ref.table, ref.span, near ? didYouMean(near) : undefined);
  }
  return t;
}

export function scopeOf(table: TableDef, ref: TableRef, offset = 0): ScopeCol[] {
  return table.columns.map((def, i) => ({ qualifier: ref.alias ?? table.name, table: table.name, def, idx: offset + i }));
}

/** Tiêu đề column của Oracle cho một biểu thức: bỏ dấu cách, in hoa phần nằm ngoài nháy. */
function oracleHeader(text: string): string {
  let out = '';
  let q = false;
  for (const c of text) {
    if (c === "'") q = !q;
    if (q) out += c;
    else if (!/\s/.test(c)) out += c.toUpperCase();
  }
  return out;
}

export interface Evaluator {
  resolve(c: ColExpr, where: MysqlWhere): ScopeCol;
  /** Kiểm tên column, function và luật riêng của dialect trước khi chạy. `agg`: function gom có được phép ở đây không. */
  check(e: Expr, where: MysqlWhere, agg?: 'no' | 'yes'): void;
  ev(e: Expr, cx: Cx): Value;
  truth(v: Value, span: Span): boolean | null;
  /** Lý do ngắn vì sao một row đạt hoặc không đạt. */
  why(e: Expr, cx: Cx): string;
  same(a: Expr, b: Expr): boolean;
  /** Khóa của các column mà query nhắc tới. */
  focus(): string[];
  /** Các subquery không phụ thuộc query ngoài đã chạy, theo thứ tự gặp. */
  subs: { q: Query; result: ResultSet; scalar: boolean }[];
  /** Có subquery phụ thuộc query ngoài (chạy lại cho từng row): Theater không diễn lại được từng bước. */
  readonly correlated: boolean;
}

type SubKind = 'scalar' | 'list' | 'exists';

export function makeEvaluator(scope: ScopeCol[], db: Database, d: Dialect, sql: string, env: FnEnv, tableName?: string, depth = 0, outer?: OuterEnv): Evaluator {
  const src = (s: Span) => sql.slice(s.s, s.e);
  const colIdx = new Map<ColExpr, ScopeCol>();
  const subCache = new Map<Query, ResultSet>();
  /** Subquery phụ thuộc: column của row ngoài mà nó dùng, và kết quả đã chạy theo giá trị của các column đó. */
  const corrHits = new Map<Query, Set<number>>();
  const corrCache = new Map<Query, Map<string, ResultSet>>();
  const subs: Evaluator['subs'] = [];
  let correlated = false;

  const nameEq = (def: ColumnDef, c: ColExpr) => {
    if (d !== 'oracle') return def.name.toLowerCase() === c.name.toLowerCase();
    if (def.exact) return c.quoted ? def.name === c.name : def.name.toUpperCase() === c.name.toUpperCase();
    return c.quoted ? def.name.toUpperCase() === c.name : def.name.toLowerCase() === c.name.toLowerCase();
  };

  const ambiguous = (c: ColExpr, hits: ScopeCol[], where: MysqlWhere): SqlError => {
    const named = [...new Set(hits.map((h) => h.qualifier))].filter((q) => q !== '');
    const p = { name: c.name, tables: named.join(', ') };
    // Subquery không alias (Oracle) không có tên để viết đứng trước.
    const hint = named.length === 0 ? 'ambiguous-anon' : 'ambiguous';
    const text = friendly[hint](p);
    if (d === 'mysql') return new SqlError('name', '1052', `ERROR 1052 (23000): Column '${c.name}' in ${where} is ambiguous`, hint, text, c.span);
    return new SqlError('name', 'ORA-00918', oraMessage('00918'), hint, text, c.span);
  };

  /** Tìm column trong query bên ngoài, từ gần ra xa. Thấy thì đánh dấu mọi tầng đã đi qua là phụ thuộc. */
  const lookupOuter = (c: ColExpr, where: MysqlWhere): ScopeCol | undefined => {
    const chain: OuterEnv[] = [];
    for (let o = outer; o; o = o.parent) {
      chain.push(o);
      const cands = c.table ? o.scope.filter((s) => s.qualifier.toLowerCase() === c.table!.toLowerCase()) : o.scope.filter((s) => !s.named);
      const hits = cands.filter((s) => nameEq(s.def, c));
      if (hits.length > 1) throw ambiguous(c, hits, where);
      if (hits.length === 1) {
        chain.forEach((x) => (x.used = true));
        (o.hits ??= new Set()).add(hits[0].idx);
        return { ...hits[0], outerEnv: o };
      }
    }
    return undefined;
  };

  const resolve = (c: ColExpr, where: MysqlWhere): ScopeCol => {
    const hit0 = colIdx.get(c);
    if (hit0) return hit0;
    const shown = c.table ? `${c.table}.${c.name}` : c.name;
    const oraIdent = (c.table ? `"${c.table.toUpperCase()}".` : '') + `"${c.quoted ? c.name : c.name.toUpperCase()}"`;
    let cands = scope.filter((s) => !s.named);
    if (c.table) {
      cands = scope.filter((s) => s.qualifier.toLowerCase() === c.table!.toLowerCase());
      if (cands.length === 0) {
        const o = lookupOuter(c, where);
        if (o) {
          colIdx.set(c, o);
          return o;
        }
        throw unknownColumn(d, shown, oraIdent, where, c.span, 'unknown-qualifier', { name: c.table });
      }
    }
    const hits = cands.filter((s) => nameEq(s.def, c));
    if (hits.length === 1) {
      const named = hits[0].named;
      if (named && c.table && d === 'oracle') {
        const hint = named === 'natural' ? 'natural-qualified' : 'using-qualified';
        const code = named === 'natural' ? '25155' : '25154';
        throw new SqlError('name', `ORA-${code}`, oraMessage(code), hint, friendly[hint]({ name: c.name }), c.span);
      }
      colIdx.set(c, hits[0]);
      return hits[0];
    }
    if (hits.length > 1) throw ambiguous(c, hits, where);
    const o = lookupOuter(c, where);
    if (o) {
      colIdx.set(c, o);
      return o;
    }
    if (d === 'oracle' && c.quoted) {
      const ci = cands.find((s) => s.def.name.toLowerCase() === c.name.toLowerCase());
      if (ci) throw unknownColumn(d, shown, oraIdent, where, c.span, 'quoted-case-oracle', { real: ci.def.name.toUpperCase() });
      throw unknownColumn(d, shown, oraIdent, where, c.span, 'dquote-oracle', { text: c.name });
    }
    const near = nearest(c.name, cands.map((s) => s.def.name));
    throw unknownColumn(d, shown, oraIdent, where, c.span, 'unknown-column', { name: c.name, table: tableName }, near ? didYouMean(near) : undefined);
  };

  /**
   * Chạy một subquery. Không nhắc tới query ngoài thì kết quả được nhớ lại. Có nhắc thì chạy lại cho từng row của query ngoài (`cx`).
   * Lúc kiểm (không có `cx`), row ngoài giả là toàn NULL: chỉ để bắt lỗi tên và lỗi cấu trúc, nên bỏ qua lỗi "nhiều row".
   */
  const runSub = (q: Query, kind: SubKind, cx?: Cx): ResultSet => {
    const hit = subCache.get(q);
    if (hit) return hit;
    if (depth > 8) throw unsupported('subquery lồng quá sâu', q.span);
    if (d === 'mysql' && kind === 'list' && q.limit) throw new SqlError('syntax', '1235', "ERROR 1235 (42000): This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'", 'limit-in-sub', friendly['limit-in-sub']({}), q.limit.span);
    const memo = (idx: Set<number> | undefined) => (cx && idx ? [...idx].sort((a, b) => a - b).map((i) => rawKey(cx.cells[i])).join('\u0001') : undefined);
    const known = memo(corrHits.get(q));
    const seen = known === undefined ? undefined : corrCache.get(q)?.get(known);
    if (seen) return seen;
    const here: OuterEnv = { scope, cells: cx?.cells ?? scope.map(() => null), parent: outer, used: false };
    const result = execSelect(q, db, d, sql, env, depth + 1, here).result;
    if (kind !== 'exists' && result.columns.length !== 1) {
      if (d === 'mysql') throw new SqlError('runtime', '1241', 'ERROR 1241 (21000): Operand should contain 1 column(s)', 'sub-one-column', friendly['sub-one-column']({}), q.span);
      throw new SqlError('runtime', 'ORA-00913', oraMessage('00913'), 'sub-one-column', friendly['sub-one-column']({}), q.span);
    }
    if (kind === 'scalar' && result.rows.length > 1 && (cx || !here.used)) {
      if (d === 'mysql') throw new SqlError('runtime', '1242', 'ERROR 1242 (21000): Subquery returns more than 1 row', 'sub-one-row', friendly['sub-one-row']({ n: result.rows.length }), q.span);
      throw new SqlError('runtime', 'ORA-01427', oraMessage('01427'), 'sub-one-row', friendly['sub-one-row']({ n: result.rows.length }), q.span);
    }
    if (here.used) {
      correlated = true;
      const idx = here.hits ?? new Set<number>();
      corrHits.set(q, idx);
      const k = memo(idx);
      if (k !== undefined) {
        const m = corrCache.get(q) ?? new Map<string, ResultSet>();
        m.set(k, result);
        corrCache.set(q, m);
      }
    } else {
      subCache.set(q, result);
      subs.push({ q, result, scalar: kind === 'scalar' });
    }
    return result;
  };

  const check = (e: Expr, where: MysqlWhere, agg: 'no' | 'yes' | 'inside' = 'no'): void => {
    switch (e.t) {
      case 'col':
        resolve(e, where);
        return;
      case 'unary':
        if (e.op === 'NOT' && d === 'oracle' && !isCond(e.e)) throw syntaxError(d, sql, e.e.span, '00920', 'need-condition');
        check(e.e, where, agg);
        return;
      case 'bin':
        if ((e.op === 'AND' || e.op === 'OR') && d === 'oracle') {
          for (const side of [e.l, e.r]) if (!isCond(side)) throw syntaxError(d, sql, side.span, '00920', 'need-condition');
        }
        check(e.l, where, agg);
        check(e.r, where, agg);
        return;
      case 'sub':
        runSub(e.q, 'scalar');
        return;
      case 'exists':
        runSub(e.q, 'exists');
        return;
      case 'quant':
        check(e.e, where, agg);
        runSub(e.q, 'list');
        return;
      case 'seq':
      case 'default':
        return;
      case 'insub':
        check(e.e, where, agg);
        runSub(e.q, 'list');
        return;
      case 'date':
        if (!parseIsoDate(e.v)) throw runtimeError(d, ['1525', 'HY000', `Incorrect DATE value: '${e.v}'`], '01861', e.span, 'date-literal-oracle', { text: e.v });
        return;
      case 'fn': {
        if (e.over) {
          checkWindow(e, where, agg);
          return;
        }
        if (e.name === 'GROUPING') {
          if (agg === 'no') {
            const p = { name: e.name, where: where === 'where clause' ? 'WHERE' : where === 'on clause' ? 'ON' : 'chỗ này' };
            if (d === 'mysql') throw new SqlError('syntax', '1111', 'ERROR 1111 (HY000): Invalid use of group function', 'agg-not-allowed', friendly['agg-not-allowed'](p), e.span);
            throw new SqlError('syntax', 'ORA-00934', oraMessage('00934'), 'agg-not-allowed', friendly['agg-not-allowed'](p), e.span);
          }
          if (e.args.length < 1) throw syntaxError(d, sql, { s: e.span.e - 1, e: e.span.e }, '00909', 'arg-count', { name: e.name, need: '1 trở lên', got: 0 });
          e.args.forEach((x) => check(x, where, 'inside'));
          return;
        }
        if (AGGREGATES.has(e.name)) {
          const own = e.name === 'GROUP_CONCAT' ? 'mysql' : e.name === 'LISTAGG' ? 'oracle' : undefined;
          if (own && own !== d) {
            const use = own === 'mysql' ? 'LISTAGG(column, \'chuỗi nối\') WITHIN GROUP (ORDER BY ...)' : "GROUP_CONCAT(column SEPARATOR 'chuỗi nối')";
            throw unknownFunction(d, db.name, e.name, e.nameSpan, 'function-other-dialect', { name: e.name, other: DIALECT_NAME[own], dialect: DIALECT_NAME[d], use });
          }
          if (agg === 'inside') throw unsupported('function gom lồng trong function gom', e.span);
          if (agg === 'no') {
            const p = { name: e.name, where: where === 'where clause' ? 'WHERE' : where === 'on clause' ? 'ON' : 'chỗ này' };
            if (d === 'mysql') throw new SqlError('syntax', '1111', 'ERROR 1111 (HY000): Invalid use of group function', 'agg-not-allowed', friendly['agg-not-allowed'](p), e.span);
            throw new SqlError('syntax', 'ORA-00934', oraMessage('00934'), 'agg-not-allowed', friendly['agg-not-allowed'](p), e.span);
          }
          // COUNT(DISTINCT a, b) chỉ có ở MySQL. Oracle báo sai số tham số.
          const [lo, hi] = e.name === 'GROUP_CONCAT' ? [1, 99] : e.name === 'LISTAGG' ? [1, 2] : e.name === 'COUNT' && e.distinct && d === 'mysql' ? [1, 99] : [1, 1];
          if ((e.star && e.name !== 'COUNT') || (!e.star && (e.args.length < lo || e.args.length > hi))) {
            const need = lo === hi ? String(lo) : `${lo} tới ${hi}`;
            if (d === 'mysql') throw syntaxError(d, sql, { s: e.span.e - 1, e: e.span.e }, '00909', 'arg-count', { name: e.name, need, got: e.star ? '*' : e.args.length });
            throw runtimeError(d, ['1064', '42000', 'You have an error in your SQL syntax'], '00909', e.span, 'arg-count', { name: e.name, need, got: e.star ? '*' : e.args.length });
          }
          // LISTAGG không có WITHIN GROUP vẫn chạy (Oracle 18c, 21c thật và tài liệu 19c: hai phần đi cùng nhau hoặc vắng cùng nhau). Thứ tự nối không được hứa.
          e.args.forEach((x) => check(x, where, 'inside'));
          (e.within ?? []).forEach((o) => check(o.e, where, 'inside'));
          return;
        }
        if (e.name === 'EXTRACT') {
          if (!UNITS.has(e.unit ?? '')) throw unsupported(`EXTRACT(${e.unit ?? ''} ...)`, e.span);
          check(e.args[0], where, agg);
          return;
        }
        if (e.name === 'VALUES' && d === 'mysql' && env.incoming) {
          const a = e.args[0];
          if (e.args.length !== 1 || a.t !== 'col') throw syntaxError(d, sql, e.span, '00909', 'call-shape', { name: 'VALUES', shape: 'VALUES(column)' });
          if (!env.incoming.columns.some((c) => c.name.toLowerCase() === a.name.toLowerCase())) throw unknownColumn(d, a.name, `"${a.name.toUpperCase()}"`, where, a.span, 'unknown-column', { name: a.name });
          return;
        }
        if (e.name === 'ROWNUM') {
          if (d === 'mysql' || !e.bare) throw unknownColumn(d, 'ROWNUM', '"ROWNUM"', where, e.span, 'rownum-mysql', {});
          return;
        }
        const def = FUNCTIONS[e.name];
        if (!def) throw unknownFunction(d, db.name, e.name, e.nameSpan, 'unknown-function', { name: e.name, dialect: DIALECT_NAME[d] });
        // Viết không ngoặc mà function của dialect kia: DBMS coi đó là tên column (MySQL 1054, Oracle ORA-00904).
        if (e.bare && def.only && def.only !== d) {
          throw unknownColumn(d, e.name, `"${e.name}"`, where, e.span, 'function-other-dialect', { name: e.name, other: DIALECT_NAME[def.only], dialect: DIALECT_NAME[d], use: def.use });
        }
        if (def.only && def.only !== d) {
          throw unknownFunction(d, db.name, e.name, e.nameSpan, 'function-other-dialect', { name: e.name, other: DIALECT_NAME[def.only], dialect: DIALECT_NAME[d], use: def.use });
        }
        if (e.bare && !def.bare?.includes(d)) {
          throw unknownColumn(d, e.name, `"${e.name}"`, where, e.span, 'function-other-dialect', { name: e.name, other: 'Oracle', dialect: DIALECT_NAME[d], use: `${e.name}() hoặc NOW()` });
        }
        if (!e.bare && def.bareOnly?.includes(d)) throw syntaxError(d, sql, e.span, '00933', 'no-parens', { name: e.name });
        const [min, maxDef] = arityOf(def, d);
        // TRIM(a, b) không có dạng đó: chỉ TRIM(... FROM ...) mới có hai tham số.
        const max = e.name === 'TRIM' && !e.unit ? 1 : maxDef;
        if (e.args.length < min || e.args.length > max) {
          const hint = e.name === 'CONCAT' && d === 'oracle' ? 'concat-oracle' : 'arg-count';
          const need = min === max ? String(min) : max >= 99 ? `${min} trở lên` : `${min} tới ${max}`;
          const p = { name: e.name, need, got: e.args.length };
          if (d === 'mysql' && def.syntax) {
            // Function nằm trong cú pháp của MySQL: sai số tham số là lỗi 1064, tại dấu phẩy thừa hoặc dấu ngoặc đóng.
            const at = e.args.length > max ? sql.lastIndexOf(',', e.args[max].span.s) : e.span.e - 1;
            throw syntaxError(d, sql, { s: at, e: at + 1 }, '00909', hint, p);
          }
          throw runtimeError(d, ['1582', '42000', `Incorrect parameter count in the call to native function '${e.name}'`], '00909', e.span, hint, p);
        }
        e.args.forEach((x) => check(x, where, agg));
        return;
      }
      default:
        children(e).forEach((x) => check(x, where, agg));
    }
  };

  /** Window function: chỗ đứng, tên function, số tham số, ORDER BY bắt buộc (Oracle). */
  const checkWindow = (e: FnExpr, where: MysqlWhere, agg: 'no' | 'yes' | 'inside'): void => {
    const over = e.over!;
    if (where === 'where clause' || where === 'on clause' || where === 'group statement' || where === 'having clause') {
      const p = { name: e.name, where: where === 'where clause' ? 'WHERE' : where === 'on clause' ? 'ON' : where === 'having clause' ? 'HAVING' : 'GROUP BY' };
      if (d === 'mysql') throw new SqlError('syntax', '3593', `ERROR 3593 (HY000): You cannot use the window function '${e.name.toLowerCase()}' in this context.'`, 'window-not-allowed', friendly['window-not-allowed'](p), e.span);
      throw new SqlError('syntax', 'ORA-30483', oraMessage('30483'), 'window-not-allowed', friendly['window-not-allowed'](p), e.span);
    }
    if (!RANKING.has(e.name) && !WINDOW_AGGS.has(e.name)) {
      if (d === 'mysql') throw syntaxError(d, sql, over.span, '30484', 'over-not-allowed', { name: e.name });
      throw new SqlError('syntax', 'ORA-30484', oraMessage('30484'), 'over-not-allowed', friendly['over-not-allowed']({ name: e.name }), over.span);
    }
    const [lo, hi] = e.name === 'LAG' || e.name === 'LEAD' ? [1, 3] : RANKING.has(e.name) ? [0, 0] : [1, 1];
    if ((e.star && e.name !== 'COUNT') || (!e.star && (e.args.length < lo || e.args.length > hi))) {
      const need = lo === hi ? String(lo) : `${lo} tới ${hi}`;
      const p = { name: e.name, need, got: e.star ? '*' : e.args.length };
      if (d === 'mysql') throw syntaxError(d, sql, { s: e.span.s, e: e.span.s + e.name.length }, '00909', 'arg-count', p);
      throw runtimeError(d, ['1064', '42000', 'You have an error in your SQL syntax'], '00909', e.span, 'arg-count', p);
    }
    if (d === 'oracle' && RANKING.has(e.name) && over.orderBy.length === 0) {
      throw new SqlError('syntax', 'ORA-30485', oraMessage('30485'), 'over-needs-order', friendly['over-needs-order']({ name: e.name }), over.span);
    }
    if (over.rows && RANKING.has(e.name)) throw unsupported(`khung ROWS với ${e.name}`, over.span);
    const nested = (x: Expr): boolean => (x.t === 'fn' && !!x.over) || children(x).some(nested);
    for (const x of [...e.args, ...over.partition, ...over.orderBy.map((o) => o.e)]) {
      if (nested(x)) throw unsupported('window function lồng trong window function', x.span);
      check(x, where, agg);
    }
  };

  const truth = (v: Value, span: Span): boolean | null => {
    if (v === null) return null;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return toNumber(v, d, span) !== 0;
    return true;
  };

  /** NULL xếp cuối khi giảm dần ở MySQL, và xếp đầu ở Oracle: như ORDER BY. */
  const sortNull = (x: Value, y: Value, desc: boolean, nulls?: 'FIRST' | 'LAST'): number | undefined => {
    if (x !== null && y !== null) return undefined;
    if (x === null && y === null) return 0;
    const first = nulls ? nulls === 'FIRST' : d === 'mysql' ? !desc : desc;
    return (x === null) === first ? -1 : 1;
  };

  /** GROUP_CONCAT (MySQL) và LISTAGG (Oracle). Bỏ row có NULL. Không còn row nào thì ra NULL. */
  const listAgg = (e: FnExpr, group: Value[][]): Value => {
    const mysql = e.name === 'GROUP_CONCAT';
    const parts = mysql ? e.args : e.args.slice(0, 1);
    let rows = group.map((cells) => ({ cells, vals: parts.map((a) => ev(a, { cells })) })).filter((r) => r.vals.every((v) => v !== null));
    if (e.distinct) {
      const seen = new Set<string>();
      rows = rows.filter((r) => {
        const k = r.vals.map((v) => keyOf(v, d)).join('\u0001');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    if (e.within?.length) {
      const keyed = rows.map((r) => ({ r, k: e.within!.map((o) => ev(o.e, { cells: r.cells })) }));
      keyed.sort((a, b) => {
        for (let i = 0; i < e.within!.length; i++) {
          const o = e.within![i];
          const nc = sortNull(a.k[i], b.k[i], o.desc, o.nulls);
          if (nc !== undefined) {
            if (nc !== 0) return nc;
            continue;
          }
          const c = compare(a.k[i], b.k[i], d, e.span) ?? 0;
          if (c !== 0) return o.desc ? -c : c;
        }
        return 0;
      });
      rows = keyed.map((x) => x.r);
    }
    if (rows.length === 0) return null;
    const sepVal = mysql ? (e.sep ?? ',') : e.args[1] ? ev(e.args[1], { cells: [] }) : '';
    const sep = sepVal === null ? '' : toText(sepVal);
    const texts = rows.map((r) => r.vals.map((v) => toText(v, d)).join(''));
    const enc = new TextEncoder();
    const bytes = (t: string) => enc.encode(t).length;
    if (mysql) {
      // group_concat_max_len mặc định là 1024 byte: dài hơn thì cắt và báo cảnh báo 1260.
      let out = '';
      for (let i = 0; i < texts.length; i++) {
        const next = (i === 0 ? '' : sep) + texts[i];
        if (bytes(out + next) > 1024) {
          const cut = new TextDecoder().decode(enc.encode(out + next).slice(0, 1024)).replace(/\uFFFD+$/, '');
          warn(1260, `Row ${i + 1} was cut by GROUP_CONCAT()`);
          return cut;
        }
        out += next;
      }
      return out;
    }
    const out = texts.join(sep);
    if (bytes(out) > 4000) throw oraFail('01489', 'result of string concatenation is too long', 'listagg-too-long', {}, e.span);
    return out;
  };

  const aggregate = (e: FnExpr, group: Value[][]): Value => {
    if (e.name === 'GROUP_CONCAT' || e.name === 'LISTAGG') return listAgg(e, group);
    if (e.star) return group.length;
    if (e.args.length > 1) {
      // COUNT(DISTINCT a, b): đếm các cặp khác nhau, bỏ cặp có NULL.
      const seen = new Set<string>();
      for (const cells of group) {
        const vs = e.args.map((a) => ev(a, { cells }));
        if (vs.every((v) => v !== null)) seen.add(vs.map((v) => keyOf(v, d)).join('\u0001'));
      }
      return seen.size;
    }
    let vals = group.map((cells) => ev(e.args[0], { cells })).filter((v) => v !== null);
    if (e.distinct) {
      const seen = new Set<string>();
      vals = vals.filter((v) => {
        const k = keyOf(v, d);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    return foldValues(e.name, vals, d, e.span);
  };

  const ev = (e: Expr, cx: Cx): Value => {
    if (cx.nullKeys && cx.nullKeys.some((k) => same(k, e))) return null;
    switch (e.t) {
      case 'num':
        return e.v;
      case 'str':
        return norm(e.v, d);
      case 'null':
        return null;
      case 'bool':
        return e.v;
      case 'date':
        return parseIsoDate(e.v);
      case 'col': {
        const c = resolve(e, 'field list');
        return c.outerEnv ? c.outerEnv.cells[c.idx] : cx.cells[c.idx];
      }
      case 'sub': {
        const r = runSub(e.q, 'scalar', cx);
        return r.rows.length === 0 ? null : r.rows[0][0];
      }
      case 'exists':
        return runSub(e.q, 'exists', cx).rows.length > 0;
      case 'quant': {
        const rows = runSub(e.q, 'list', cx).rows;
        const all = e.quant === 'all';
        // Subquery không ra row nào: ANY sai, ALL đúng, dù vế trái là gì.
        if (rows.length === 0) return all;
        const v = ev(e.e, cx);
        let unknown = false;
        for (const r of rows) {
          const c = compare(v, r[0], d, e.span);
          if (c === null) {
            unknown = true;
            continue;
          }
          const t = cmpOp(e.op, c);
          if (all && !t) return false;
          if (!all && t) return true;
        }
        return unknown ? null : all;
      }
      case 'seq': {
        if (!env.seq) throw runtimeError(d, ['1064', '42000', ''], '02289', e.seqSpan, 'seq-missing', { name: e.seq });
        return e.which === 'NEXTVAL' ? env.seq.next(e.seq, e.seqSpan) : env.seq.curr(e.seq, e.seqSpan);
      }
      case 'default':
        // Từ khóa DEFAULT chỉ có nghĩa trong VALUES và SET: session xử lý trước khi tới đây.
        throw unsupported('DEFAULT ở chỗ này', e.span);
      case 'insub': {
        const rows = runSub(e.q, 'list', cx).rows;
        // Subquery không ra row nào: IN sai, NOT IN đúng, kể cả khi vế trái là NULL.
        if (rows.length === 0) return e.not;
        const v = ev(e.e, cx);
        if (v === null) return null;
        let unknown = false;
        for (const row of rows) {
          const c = compare(v, row[0], d, e.span);
          if (c === 0) return !e.not;
          if (c === null) unknown = true;
        }
        return unknown ? null : e.not;
      }
      case 'unary': {
        if (e.op === 'NOT') {
          const t = truth(ev(e.e, cx), e.e.span);
          return t === null ? null : !t;
        }
        const n = toNumber(ev(e.e, cx), d, e.span);
        return n === null ? null : e.op === '-' ? -n : n;
      }
      case 'bin': {
        if (e.op === 'AND' || e.op === 'OR') {
          const l = truth(ev(e.l, cx), e.l.span);
          const stop = e.op === 'OR';
          if (l === stop) return stop;
          const r = truth(ev(e.r, cx), e.r.span);
          if (r === stop) return stop;
          return l === null || r === null ? null : !stop;
        }
        const a = ev(e.l, cx);
        const b = ev(e.r, cx);
        if (e.op === '||') return norm((a === null ? '' : toText(a, d)) + (b === null ? '' : toText(b, d)), d);
        if (e.op === '+' || e.op === '-' || e.op === '*' || e.op === '/' || e.op === '%') {
          // Oracle: ngày cộng trừ một số là cộng trừ số ngày, ngày trừ ngày ra số ngày.
          if (d === 'oracle' && (e.op === '+' || e.op === '-') && (isDate(a) || isDate(b))) {
            if (a === null || b === null) return null;
            if (isDate(a) && isDate(b)) {
              if (e.op === '+') throw oraFail('00975', 'date + date not allowed', 'date-plus-date', {}, e.span);
              return Math.round(diffDays(a, b) * 1e6) / 1e6;
            }
            const date = (isDate(a) ? a : b) as SqlDate;
            const n = toNumber(isDate(a) ? b : a, d, e.span)!;
            return addDays(date, e.op === '-' ? -n : n);
          }
          return arith(e.op, a, b, d, e.span);
        }
        const c = compare(a, b, d, e.span);
        if (c === null) return null;
        switch (e.op) {
          case '=':
            return c === 0;
          case '<>':
            return c !== 0;
          case '<':
            return c < 0;
          case '<=':
            return c <= 0;
          case '>':
            return c > 0;
          default:
            return c >= 0;
        }
      }
      case 'isnull': {
        const v = ev(e.e, cx);
        return e.not ? v !== null : v === null;
      }
      case 'in': {
        const v = ev(e.e, cx);
        if (v === null) return null;
        let unknown = false;
        for (const item of e.list) {
          const c = compare(v, ev(item, cx), d, e.span);
          if (c === 0) return !e.not;
          if (c === null) unknown = true;
        }
        return unknown ? null : e.not;
      }
      case 'between': {
        const v = ev(e.e, cx);
        const lo = compare(v, ev(e.lo, cx), d, e.span);
        const hi = compare(v, ev(e.hi, cx), d, e.span);
        if (lo === null || hi === null) return null;
        const inside = lo >= 0 && hi <= 0;
        return e.not ? !inside : inside;
      }
      case 'like': {
        const r = like(ev(e.e, cx), ev(e.pat, cx), d);
        return r === null ? null : e.not ? !r : r;
      }
      case 'fn': {
        if (e.over) {
          const v = cx.win?.get(e);
          if (v === undefined) throw unsupported('window function ở chỗ này', e.span);
          return v;
        }
        // GROUPING(a, b): mỗi column đã cuộn lên thành NULL ở dòng tổng cho một bit 1, đọc từ trái sang phải.
        if (e.name === 'GROUPING') return e.args.reduce<number>((n, a) => n * 2 + (cx.nullKeys?.some((k) => same(k, a)) ? 1 : 0), 0);
        if (AGGREGATES.has(e.name)) return aggregate(e, cx.group ?? []);
        if (e.name === 'VALUES' && env.incoming) {
          const a = e.args[0] as ColExpr;
          return env.incoming.cells[env.incoming.columns.findIndex((c) => c.name.toLowerCase() === a.name.toLowerCase())] ?? null;
        }
        if (e.name === 'ROWNUM') return cx.rownum ?? 1;
        if (e.name === 'EXTRACT') return extract(e.unit ?? '', ev(e.args[0], cx), d, e.span);
        if (e.cast) return norm(castValue(ev(e.args[0], cx), e.cast, d, e.span), d);
        return norm(FUNCTIONS[e.name].run(e.args.map((a) => ev(a, cx)), d, e.span, env, e.unit), d);
      }
      case 'case': {
        if (e.operand) {
          const v = ev(e.operand, cx);
          for (const w of e.whens) if (compare(v, ev(w.when, cx), d, e.span) === 0) return ev(w.then, cx);
        } else {
          for (const w of e.whens) if (truth(ev(w.when, cx), w.when.span) === true) return ev(w.then, cx);
        }
        return e.else ? ev(e.else, cx) : null;
      }
    }
  };

  /* ---------- lý do đạt hoặc không đạt ---------- */
  const nameOf = (e: Expr): string => (e.t === 'col' ? (resolve(e, 'where clause').def.label ?? e.name) : src(e.span).replace(/\s+/g, ' '));
  const side = (e: Expr, v: Value): string => {
    if (e.t === 'col' || (e.t === 'fn' && (AGGREGATES.has(e.name) || e.name === 'ROWNUM'))) return `${nameOf(e)} ${showQuoted(v)}`;
    return showQuoted(v);
  };

  const why = (e: Expr, cx: Cx): string => {
    switch (e.t) {
      case 'unary':
        if (e.op === 'NOT') return why(e.e, cx);
        break;
      case 'bin': {
        if (e.op === 'AND') {
          if (truth(ev(e.l, cx), e.l.span) !== true) return why(e.l, cx);
          if (truth(ev(e.r, cx), e.r.span) !== true) return why(e.r, cx);
          return why(e.l, cx);
        }
        if (e.op === 'OR') {
          if (truth(ev(e.l, cx), e.l.span) === true) return why(e.l, cx);
          if (truth(ev(e.r, cx), e.r.span) === true) return why(e.r, cx);
          return why(e.l, cx) + reason.and + why(e.r, cx);
        }
        if (CONDITION.has(e.op)) {
          const a = ev(e.l, cx);
          const b = ev(e.r, cx);
          if (a === null) return reason.nullCompare(nameOf(e.l));
          if (b === null) return reason.nullCompare(nameOf(e.r));
          const c = compare(a, b, d, e.span)!;
          const textual = typeof a === 'string' && typeof b === 'string';
          const rel = c === 0 ? '=' : textual ? '≠' : c < 0 ? '<' : '>';
          return `${side(e.l, a)} ${rel} ${side(e.r, b)}`;
        }
        break;
      }
      case 'isnull': {
        const v = ev(e.e, cx);
        return v === null ? reason.isNull(nameOf(e.e)) : reason.notNull(nameOf(e.e), showQuoted(v));
      }
      case 'in':
      case 'insub': {
        const v = ev(e.e, cx);
        if (v === null) return reason.nullCompare(nameOf(e.e));
        const found = e.t === 'in' ? e.list.some((x) => compare(v, ev(x, cx), d, e.span) === 0) : runSub(e.q, 'list', cx).rows.some((r) => compare(v, r[0], d, e.span) === 0);
        return found ? reason.inList(side(e.e, v)) : reason.notInList(side(e.e, v));
      }
      case 'exists':
        return runSub(e.q, 'exists', cx).rows.length > 0 ? reason.exists() : reason.notExists();
      case 'quant': {
        const v = ev(e.e, cx);
        if (v === null && runSub(e.q, 'list', cx).rows.length > 0) return reason.nullCompare(nameOf(e.e));
        const ok = truth(ev(e, cx), e.span) === true;
        return (ok ? reason.quantOk : reason.quantNo)(side(e.e, v), e.op, e.word);
      }
      case 'between': {
        const v = ev(e.e, cx);
        if (v === null) return reason.nullCompare(nameOf(e.e));
        const lo = ev(e.lo, cx);
        const hi = ev(e.hi, cx);
        const inside = (compare(v, lo, d, e.span) ?? -1) >= 0 && (compare(v, hi, d, e.span) ?? 1) <= 0;
        return (inside ? reason.inRange : reason.outRange)(side(e.e, v), show(lo), show(hi));
      }
      case 'like': {
        const v = ev(e.e, cx);
        if (v === null) return reason.nullCompare(nameOf(e.e));
        const pat = ev(e.pat, cx);
        return (like(v, pat, d) ? reason.like : reason.notLike)(side(e.e, v), showQuoted(pat));
      }
      default:
        break;
    }
    return reason.truthy(src(e.span), showQuoted(ev(e, cx)));
  };

  const flat = (e: Expr) => src(e.span).replace(/\s+/g, '').toLowerCase();
  const same = (a: Expr, b: Expr): boolean => {
    if (a.t === 'col' && b.t === 'col') {
      try {
        const x = resolve(a, 'field list');
        const y = resolve(b, 'field list');
        return x.idx === y.idx && x.outerEnv === y.outerEnv;
      } catch {
        return false;
      }
    }
    return a.t === b.t && flat(a) === flat(b);
  };

  return {
    resolve,
    check,
    ev,
    truth,
    why,
    same,
    subs,
    get correlated() {
      return correlated;
    },
    focus: () => [...new Set([...colIdx.values()].filter((c) => !c.outerEnv).flatMap((c) => (c.virtual && c.from ? c.from.map((i) => `c${i}`) : [`c${c.idx}`])))],
  };
}

const traceCols = (scope: ScopeCol[], d: Dialect): TraceCol[] =>
  scope.map((c) => ({ key: `c${c.idx}`, header: hdr(c.def, d), label: c.def.label, type: c.def.type }));

interface Unit {
  id: number;
  cx: Cx;
}

/** Một bước nối table: lấy từ JOIN trong FROM, hoặc do dấu (+) trong WHERE sinh ra. */
interface JoinPlan {
  kind: Join['kind'];
  ref: TableRef;
  on?: Expr;
  onText?: string;
  using?: Join['using'];
  natural?: boolean;
  span: Span;
}

const oraError = (kind: 'syntax' | 'name', code: string, hint: string, span: Span, p: Record<string, string | number | undefined> = {}) =>
  new SqlError(kind, `ORA-${code}`, oraMessage(code), hint, friendly[hint](p), span);

const outerMarks = (e: Expr | undefined): ColExpr[] => (!e ? [] : e.t === 'col' ? (e.outer ? [e] : []) : children(e).flatMap(outerMarks));
const plainCols = (e: Expr): ColExpr[] => (e.t === 'col' ? (e.outer ? [] : [e]) : children(e).flatMap(plainCols));
const andChain = (list: Expr[]): Expr => list.reduce((l, r) => ({ t: 'bin', op: 'AND', l, r, span: { s: l.span.s, e: r.span.e }, opSpan: r.span }));
const flatAnd = (e: Expr): Expr[] => (e.t === 'bin' && e.op === 'AND' ? [...flatAnd(e.l), ...flatAnd(e.r)] : [e]);

function aliasTwice(d: Dialect, name: string, span: Span): SqlError {
  const p = { name };
  if (d === 'mysql') return new SqlError('name', '1066', `ERROR 1066 (42000): Not unique table/alias: '${name}'`, 'alias-twice', friendly['alias-twice'](p), span);
  return new SqlError('name', 'ORA-00918', oraMessage('00918'), 'alias-twice', friendly['alias-twice'](p), span);
}

/**
 * Oracle: nối ngoài kiểu cũ. FROM ngăn bằng dấu phẩy, dấu (+) trong WHERE đánh dấu bên bị thiếu row.
 * Trả về thứ tự nối: table giữ đủ row đứng trước, table có (+) nối sau bằng LEFT JOIN. Không có (+) thì trả undefined.
 */
function planOuter(stmt: SelectStmt, db: Database, d: Dialect, sql: string, env: FnEnv, depth: number, outer?: OuterEnv): { from: TableRef; plan: JoinPlan[]; where?: Expr } | undefined {
  const src = (s: Span) => sql.slice(s.s, s.e);
  const all = outerMarks(stmt.where);
  if (all.length === 0 || !stmt.from || !stmt.where) return undefined;
  if (stmt.joins.some((j) => !j.comma)) throw oraError('syntax', '25156', 'outer-ansi', all[0].span);

  const refs = [stmt.from, ...stmt.joins.map((j) => j.ref)];
  const tabs = refs.map((r) => resolveRef(r, { db, d, sql, env, depth, outer }));
  const quals = refs.map((r, i) => (r.alias ?? tabs[i].name).toLowerCase());
  quals.forEach((q, i) => {
    if (quals.indexOf(q) !== i) throw aliasTwice(d, refs[i].alias ?? tabs[i].name, refs[i].span);
  });
  let off = 0;
  const full = refs.flatMap((r, i) => {
    const sc = scopeOf(tabs[i], r, off);
    off += sc.length;
    return sc;
  });
  const E0 = makeEvaluator(full, db, d, sql, env, undefined, depth, outer);

  const compareOps = new Set(['=', '<>', '<', '<=', '>', '>=']);
  const badPlace = (e: Expr): void => {
    const m = outerMarks(e)[0];
    if (!m) return;
    if ((e.t === 'bin' && e.op === 'OR') || e.t === 'in') throw oraError('syntax', '01719', 'outer-or', m.span);
    if (e.t === 'insub' || (e.t === 'bin' && compareOps.has(e.op) && (e.l.t === 'sub' || e.r.t === 'sub'))) throw oraError('syntax', '01799', 'outer-sub', m.span);
    children(e).forEach(badPlace);
  };

  const nullGen = new Map<string, { conjs: Expr[]; partners: Set<string> }>();
  const rest: Expr[] = [];
  for (const conj of flatAnd(stmt.where)) {
    const ms = outerMarks(conj);
    if (ms.length === 0) {
      rest.push(conj);
      continue;
    }
    badPlace(conj);
    const marked = [...new Set(ms.map((c) => E0.resolve(c, 'where clause').qualifier.toLowerCase()))];
    if (marked.length > 1) throw oraError('syntax', '01468', 'outer-two', ms[1].span);
    const M = marked[0];
    const others = new Set(plainCols(conj).map((c) => E0.resolve(c, 'where clause').qualifier.toLowerCase()));
    // Đã kiểm trên Oracle XE 21c thật: `employees.manager_id(+) = employees.employee_id` (cùng một table hai vế) báo ORA-01416.
    if (others.has(M)) throw oraError('syntax', '01416', 'outer-cycle', ms[0].span);
    const g = nullGen.get(M) ?? { conjs: [], partners: new Set<string>() };
    g.conjs.push(conj);
    others.forEach((o) => g.partners.add(o));
    nullGen.set(M, g);
  }
  for (const [M, g] of nullGen) {
    for (const p of g.partners) if (nullGen.get(p)?.partners.has(M)) throw oraError('syntax', '01416', 'outer-cycle', g.conjs[0].span);
  }

  const order: number[] = [];
  const done = new Set<string>();
  const left = refs.map((_r, i) => i);
  while (left.length > 0) {
    const pick = left.findIndex((i) => {
      const g = nullGen.get(quals[i]);
      return !g || (done.size > 0 && [...g.partners].every((p) => done.has(p)));
    });
    if (pick < 0) throw oraError('syntax', '01416', 'outer-cycle', all[0].span);
    const [i] = left.splice(pick, 1);
    order.push(i);
    done.add(quals[i]);
  }
  const plan: JoinPlan[] = order.slice(1).map((i) => {
    const g = nullGen.get(quals[i]);
    if (!g) return { kind: 'cross', ref: refs[i], span: refs[i].span };
    return { kind: 'left', ref: refs[i], on: andChain(g.conjs), onText: g.conjs.map((c) => src(c.span).replace(/\s*\(\+\)/g, '').replace(/\s+/g, ' ')).join(' AND '), span: refs[i].span };
  });
  return { from: refs[order[0]], plan, where: rest.length > 0 ? andChain(rest) : undefined };
}

/** MySQL đọc chữ FULL sau table như alias. Khi lỗi tên table nảy ra vì alias đó, giải thích rằng MySQL không có FULL JOIN. */
const fullAliasUsed = (stmt: SelectStmt): boolean => !!stmt.from?.fullAlias || stmt.joins.some((j) => j.ref.fullAlias);

export interface RefCtx {
  db: Database;
  d: Dialect;
  sql: string;
  env: FnEnv;
  depth: number;
  outer?: OuterEnv;
}

/** Kiểu của column theo giá trị, khi query không nói rõ (biểu thức, hằng). */
export function typeOfValues(rows: Value[][], i: number): ColumnType {
  for (const r of rows) {
    const v = r[i];
    if (v === null) continue;
    if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'decimal';
    if (typeof v === 'boolean') return 'int';
    if (typeof v === 'string') return 'text';
    return v.iso.length > 10 ? 'datetime' : 'date';
  }
  return 'text';
}

/** Kết quả của một query thành table tạm: dùng cho subquery trong FROM và khối WITH. */
export function derivedTable(name: string, result: ResultSet, d: Dialect, span: Span, names?: string[]): TableDef {
  const heads = names ?? result.columns;
  if (d === 'mysql') {
    const seen = new Set<string>();
    for (const h of heads) {
      const k = h.toLowerCase();
      if (seen.has(k)) throw new SqlError('name', '1060', `ERROR 1060 (42S21): Duplicate column name '${h}'`, 'derived-dup-column', friendly['derived-dup-column']({ name: h }), span);
      seen.add(k);
    }
  }
  return {
    name,
    columns: heads.map((h, i) => ({ name: h, type: result.types[i] === 'expr' ? typeOfValues(result.rows, i) : (result.types[i] as ColumnType), exact: d === 'oracle' ? true : undefined })),
    rows: [],
    loaded: result.rows,
  };
}

/** Chạy câu SELECT của view và dựng thành table tạm. View hỏng (table nó dùng đã mất) thì báo như DBMS. */
export function viewTable(v: ViewDef, ref: TableRef, x: Pick<RefCtx, 'db' | 'd' | 'env' | 'depth'>): TableDef {
  const q = parse(v.sql, x.d) as Query;
  try {
    const tr = execSelect(q, x.db, x.d, v.sql, x.env, x.depth + 1);
    return derivedTable(v.name, tr.result, x.d, ref.span);
  } catch (e) {
    if (e instanceof SqlError && e.kind !== 'unsupported') {
      const p = { name: v.name };
      if (x.d === 'mysql') throw new SqlError('name', '1356', `ERROR 1356 (HY000): View '${x.db.name}.${v.name}' references invalid table(s) or column(s) or function(s) or definer/invoker of view lack rights to use them`, 'view-invalid', friendly['view-invalid'](p), ref.span);
      throw new SqlError('name', 'ORA-04063', `ORA-04063: view "${x.db.name.toUpperCase()}.${v.name.toUpperCase()}" has errors`, 'view-invalid', friendly['view-invalid'](p), ref.span);
    }
    throw e;
  }
}

/** Các màn mà query đang chạy đã gặp: khối WITH, subquery trong FROM. Mỗi lần execSelect có một sổ riêng. */
let actSink: { acts: TraceAct[]; seen: Set<object> } | null = null;
/** Table tạm sinh từ khối WITH hay subquery trong FROM, để step `from` và `join` ghi `source`. */
const cteDefs = new WeakSet<TableDef>();
const derivedDefs = new WeakSet<TableDef>();

function noteAct(kind: TraceAct['kind'], q: Query, name: string, sql: string, trace: Trace): void {
  if (!actSink || actSink.seen.has(q)) return;
  actSink.seen.add(q);
  actSink.acts.push({ kind, name, sql: sql.slice(q.span.s, q.span.e).replace(/\s+/g, ' ').trim(), trace });
}

const sourceOf = (t: TableDef): 'cte' | 'derived' | undefined => (cteDefs.has(t) ? 'cte' : derivedDefs.has(t) ? 'derived' : undefined);

/** Table trong FROM: table có thật, khối WITH, hoặc subquery (chạy ngay, kết quả thành table tạm). */
export function resolveRef(ref: TableRef, x: RefCtx): TableDef {
  if (!ref.sub) {
    checkSchema(x.db, x.d, ref.schema, ref.table, ref.span);
    const v = viewOf(x.db, ref, x.d);
    if (v) return viewTable(v, ref, x);
    return findTable(x.db, ref, x.d);
  }
  const tr = execSelect(ref.sub, x.db, x.d, x.sql, x.env, x.depth + 1, x.outer);
  const t = derivedTable(ref.alias ?? '', tr.result, x.d, ref.span);
  derivedDefs.add(t);
  noteAct('derived', ref.sub, t.name, x.sql, tr);
  return t;
}

/** Gọi f cho mọi table thật mà query nhắc tới, kể cả trong subquery. `intoDerived` false thì bỏ qua subquery trong FROM. */
function walkRefs(q: Query, f: (r: TableRef) => void, intoDerived = true): void {
  q.with?.forEach((c) => walkRefs(c.q, f, intoDerived));
  if (q.t === 'setop') {
    walkRefs(q.left, f, intoDerived);
    walkRefs(q.right, f, intoDerived);
    q.orderBy?.forEach((o) => walkExprRefs(o.e, f, intoDerived));
    return;
  }
  for (const r of [q.from, ...q.joins.map((j) => j.ref)]) {
    if (!r) continue;
    if (!r.sub) f(r);
    else if (intoDerived) walkRefs(r.sub, f, intoDerived);
  }
  const exprs = [...q.items.map((i) => i.e), q.where, q.having, ...(q.groupBy ?? []), ...(q.orderBy ?? []).map((o) => o.e), ...q.joins.map((j) => j.on)];
  for (const e of exprs) if (e) walkExprRefs(e, f, intoDerived);
}

function walkExprRefs(e: Expr, f: (r: TableRef) => void, intoDerived: boolean): void {
  if (e.t === 'sub' || e.t === 'insub' || e.t === 'exists' || e.t === 'quant') walkRefs(e.q, f, intoDerived);
  children(e).forEach((x) => walkExprRefs(x, f, intoDerived));
}

/**
 * MySQL 1093: UPDATE hay DELETE không cho subquery đọc chính table đang sửa. Subquery bọc trong FROM của một subquery khác thì qua.
 * Oracle không có luật này.
 */
export function checkTargetTable(exprs: (Expr | undefined)[], target: TableRef, d: Dialect): void {
  if (d !== 'mysql') return;
  for (const e of exprs) {
    if (!e) continue;
    walkExprRefs(e, (r) => {
      if (r.table.toLowerCase() !== target.table.toLowerCase()) return;
      const name = target.alias ?? target.table;
      throw new SqlError('runtime', '1093', `ERROR 1093 (HY000): You can't specify target table '${name}' for update in FROM clause`, 'target-table', friendly['target-table']({ name }), r.span);
    }, false);
  }
}

/** Chạy các khối WITH theo thứ tự. Mỗi khối thành một table tạm, khối sau dùng được khối trước. */
function withTables(ctes: Cte[], db: Database, d: Dialect, sql: string, env: FnEnv, depth: number, outer?: OuterEnv): Database {
  let cur = db;
  const seen = new Set<string>();
  for (const c of ctes) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) {
      // Oracle 18c và 21c thật không báo lỗi: khối đầu tiên thắng, khối trùng tên sau nó bị bỏ qua (không chạy).
      if (d === 'oracle') continue;
      throw new SqlError('name', '1066', `ERROR 1066 (42000): Not unique table/alias: '${c.name}'`, 'cte-twice', friendly['cte-twice']({ name: c.name }), c.nameSpan);
    }
    seen.add(key);
    if (d === 'oracle') {
      let self = false;
      walkRefs(c.q, (r) => {
        if (r.table.toLowerCase() === key) self = true;
      });
      if (self) throw unsupported('WITH đệ quy (khối WITH gọi lại chính nó)', c.nameSpan);
    }
    const tr = execSelect(c.q, cur, d, sql, env, depth + 1, outer);
    if (c.columns && c.columns.length !== tr.result.columns.length) {
      const p = { name: c.name, listed: c.columns.length, got: tr.result.columns.length };
      if (d === 'mysql') throw new SqlError('runtime', '1353', 'ERROR 1353 (HY000): In definition of view, derived table or common table expression, SELECT list and column names list have different column counts', 'cte-columns', friendly['cte-columns'](p), c.span);
      throw new SqlError('runtime', 'ORA-32038', oraMessage('32038'), 'cte-columns', friendly['cte-columns'](p), c.span);
    }
    const names = c.columns?.map((x) => (d === 'oracle' ? x.name.toUpperCase() : x.name));
    const t = derivedTable(c.name, tr.result, d, c.span, names);
    cteDefs.add(t);
    noteAct('cte', c.q, c.name, sql, tr);
    cur = { ...cur, tables: [t, ...cur.tables.filter((x) => x.name.toLowerCase() !== key)] };
  }
  return cur;
}

/** Chạy một query: SELECT, query ghép kết quả, có hay không có WITH. */
export function execSelect(q: Query, db: Database, d: Dialect, sql: string, env: FnEnv = DEFAULT_ENV, depth = 0, outer?: OuterEnv): Trace {
  const saved = actSink;
  const mine = { acts: [] as TraceAct[], seen: new Set<object>() };
  actSink = mine;
  try {
    if (depth === 0) resetWarnings();
    if (!env.user) env = { ...env, user: db.name.toUpperCase() };
    let base = db;
    if (q.with?.length) base = withTables(q.with, db, d, sql, env, depth, outer);
    const tr = q.t === 'select' ? execSelectInner(q, base, d, sql, env, depth, outer) : execSet(q, base, d, sql, env, depth, outer);
    // Các màn chạy trước: khối WITH, subquery trong FROM, rồi các vế của query ghép.
    const acts = [...mine.acts, ...(tr.acts ?? [])];
    if (acts.length > 0) tr.acts = acts;
    // Cảnh báo của MySQL (SHOW WARNINGS) đi kèm kết quả.
    if (depth === 0 && d === 'mysql') {
      const w = peekWarnings();
      if (w.length > 0) tr.result.warnings = w;
    }
    return tr;
  } catch (err) {
    if (err instanceof SqlError && d === 'mysql' && err.hint === 'unknown-qualifier' && q.t === 'select' && fullAliasUsed(q)) {
      err.hint = 'full-join-mysql';
      err.friendly = friendly['full-join-mysql']({});
    }
    throw err;
  } finally {
    actSink = saved;
  }
}

/** Định nghĩa column gốc của từng column trong kết quả (undefined cho biểu thức). Dùng cho CREATE TABLE ... AS SELECT. */
export const resultDefs = new WeakMap<ResultSet, (ColumnDef | undefined)[]>();

const GROUP_NAME = { n: 'số', c: 'chữ', d: 'ngày' } as const;

/** Nhóm data type của một column trong kết quả. Không biết (toàn NULL, hay biểu thức không có row) thì undefined. */
function typeGroup(t: ResultSet['types'][number], rows: Value[][], i: number): 'n' | 'c' | 'd' | undefined {
  if (t === 'int' || t === 'decimal') return 'n';
  if (t === 'text') return 'c';
  if (t === 'date' || t === 'datetime') return 'd';
  for (const r of rows) {
    const v = r[i];
    if (v === null) continue;
    return typeof v === 'number' || typeof v === 'boolean' ? 'n' : typeof v === 'string' ? 'c' : 'd';
  }
  return undefined;
}

/**
 * UNION, UNION ALL, INTERSECT, EXCEPT, MINUS. Hai vế chạy riêng, rồi ghép. Tên column lấy từ query đầu.
 * ORDER BY và LIMIT ở cuối áp cho cả kết quả.
 * Trace: mỗi vế là một màn (`acts`, kind 'branch'). Màn chính mở bằng một step `setop` cho mỗi toán tử, từ trái sang phải.
 */
function execSet(stmt: SetStmt, db: Database, d: Dialect, sql: string, env: FnEnv, depth: number, outer?: OuterEnv): Trace {
  const src = (s: Span) => sql.slice(s.s, s.e);
  const branches: TraceAct[] = [];
  const setops: TraceStep[] = [];
  let nextId = 0;
  type Side = { columns: string[]; types: ResultSet['types']; rows: TraceRow[] };
  const leaf = (q: Query): ResultSet => {
    const tr = execSelect(q, db, d, sql, env, depth, outer);
    branches.push({ kind: 'branch', name: `vế ${branches.length + 1}`, sql: src(q.span).replace(/\s+/g, ' ').trim(), trace: tr });
    return tr.result;
  };
  const fresh = (r: ResultSet): Side => ({ columns: r.columns, types: [...r.types], rows: r.rows.map((cells) => ({ id: nextId++, cells: [...cells] })) });
  /** Chuỗi ghép kiểu (A op B) op C đi thành một dãy step. Vế trái có WITH, ORDER BY hay LIMIT riêng thì là một màn. */
  const chained = (q: Query): q is SetStmt => q.t === 'setop' && !q.with && !q.orderBy && !q.limit;

  const run = (st: SetStmt): Side => {
    const L = chained(st.left) ? run(st.left) : fresh(leaf(st.left));
    const R = fresh(leaf(st.right));
    if (L.columns.length !== R.columns.length) {
      const p = { left: L.columns.length, right: R.columns.length };
      if (d === 'mysql') throw new SqlError('runtime', '1222', 'ERROR 1222 (21000): The used SELECT statements have a different number of columns', 'setop-columns', friendly['setop-columns'](p), st.right.span);
      throw new SqlError('runtime', 'ORA-01789', oraMessage('01789'), 'setop-columns', friendly['setop-columns'](p), st.right.span);
    }
    const width = L.columns.length;
    const types = [...L.types];
    // Row của bước trước giữ nguyên: đổi data type thì đổi trên bản sao.
    const lrows = L.rows.map((r) => ({ id: r.id, cells: [...r.cells] }));
    const rrows = R.rows;
    for (let i = 0; i < width; i++) {
      const a = typeGroup(L.types[i], lrows.map((r) => r.cells), i);
      const b = typeGroup(R.types[i], rrows.map((r) => r.cells), i);
      if (!a || !b || a === b) continue;
      // Oracle không tự đổi data type (ORA-01790, mã trong tài liệu). MySQL đổi cả hai vế sang chữ.
      if (d === 'oracle') throw new SqlError('runtime', 'ORA-01790', oraMessage('01790'), 'setop-type', friendly['setop-type']({ n: i + 1, a: GROUP_NAME[a], b: GROUP_NAME[b] }), st.right.span);
      for (const rows of [lrows, rrows]) for (const r of rows) r.cells[i] = r.cells[i] === null || typeof r.cells[i] === 'string' ? r.cells[i] : toText(r.cells[i]);
      types[i] = 'text';
    }

    const key = (r: TraceRow) => r.cells.map((v) => keyOf(v, d)).join('\u0001');
    const rightKeys = new Set(rrows.map(key));
    const seen = new Set<string>();
    const kept: TraceRow[] = [];
    const removed: { id: number; why: 'dup' | 'absent' | 'present' }[] = [];
    const take = (r: TraceRow, why?: 'absent' | 'present') => {
      const k = key(r);
      if (why) removed.push({ id: r.id, why });
      else if (st.op !== 'union all' && seen.has(k)) removed.push({ id: r.id, why: 'dup' });
      else {
        seen.add(k);
        kept.push(r);
      }
    };
    if (st.op === 'union all' || st.op === 'union') [...lrows, ...rrows].forEach((r) => take(r));
    else for (const r of lrows) take(r, st.op === 'intersect' ? (rightKeys.has(key(r)) ? undefined : 'absent') : rightKeys.has(key(r)) ? 'present' : undefined);

    const columns: TraceCol[] = L.columns.map((h, i) => ({ key: `c${i}`, header: h, type: types[i] }));
    setops.push({ kind: 'setop', op: st.op, word: st.word, columns, left: lrows, right: rrows, rows: kept, removed });
    return { columns: L.columns, types, rows: kept };
  };
  const merged = run(stmt);
  const types = merged.types;
  const rows = merged.rows.map((r) => r.cells);
  const width = merged.columns.length;
  const L = { columns: merged.columns };
  let out: TraceRow[] = merged.rows.map((r) => ({ id: r.id, cells: r.cells }));
  const steps: TraceStep[] = [...setops];

  /* ORDER BY: theo tên hoặc alias column của query đầu, theo số thứ tự, hoặc biểu thức tính từ các column đó. */
  if (stmt.orderBy) {
    const scope: ScopeCol[] = L.columns.map((h, i) => ({
      qualifier: '',
      table: '',
      def: { name: h, type: types[i] === 'expr' ? typeOfValues(rows, i) : (types[i] as ColumnType), exact: d === 'oracle' ? true : undefined },
      idx: i,
    }));
    const E = makeEvaluator(scope, db, d, sql, env, undefined, depth);
    type Key = { get: (r: Value[]) => Value; desc: boolean; nulls?: 'FIRST' | 'LAST'; text: string; col?: string; span: Span };
    const keys: Key[] = stmt.orderBy.map((o) => {
      const e = o.e;
      const base = { desc: o.desc, nulls: o.nulls, text: src(e.span), span: e.span };
      if (e.t === 'num' && Number.isInteger(e.v)) {
        if (e.v < 1 || e.v > width) {
          const p = { n: e.v, max: width };
          if (d === 'mysql') throw new SqlError('name', '1054', `ERROR 1054 (42S22): Unknown column '${e.v}' in 'order clause'`, 'order-position', friendly['order-position'](p), e.span);
          throw new SqlError('name', 'ORA-01785', oraMessage('01785'), 'order-position', friendly['order-position'](p), e.span);
        }
        const i = e.v - 1;
        return { ...base, get: (r) => r[i], col: `c${i}` };
      }
      const qual = plainCols(e).find((c) => c.table);
      if (qual) {
        // Đã kiểm trên Oracle XE 21c thật: ORA-00904 "TABLE"."COLUMN" khi ORDER BY của câu ghép viết tên table đứng trước column.
        if (d === 'mysql') throw new SqlError('name', '1250', `ERROR 1250 (42000): Table '${qual.table}' from one of the SELECTs cannot be used in global ORDER clause`, 'setop-order-qualified', friendly['setop-order-qualified']({ table: qual.table }), qual.span);
        throw unknownColumn(d, `${qual.table}.${qual.name}`, `"${qual.table!.toUpperCase()}"."${qual.name.toUpperCase()}"`, 'order clause', qual.span, 'setop-order-qualified', { table: qual.table });
      }
      if (d === 'oracle' && e.t !== 'col') throw new SqlError('syntax', 'ORA-01785', oraMessage('01785'), 'setop-order-expr', friendly['setop-order-expr']({}), e.span);
      E.check(e, 'order clause', 'no');
      return { ...base, get: (r) => E.ev(e, { cells: r }), col: e.t === 'col' ? `c${E.resolve(e, 'order clause').idx}` : undefined };
    });
    const beforeIds = out.map((r) => r.id);
    const vals = new Map(out.map((r) => [r.id, keys.map((k) => k.get(r.cells))]));
    let nullsWhere: 'first' | 'last' | undefined;
    out = [...out].sort((ra, rb) => {
      const a = vals.get(ra.id)!;
      const b = vals.get(rb.id)!;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const x = a[i];
        const y = b[i];
        if (x === null || y === null) {
          if (x === null && y === null) continue;
          const first = k.nulls ? k.nulls === 'FIRST' : d === 'mysql' ? !k.desc : k.desc;
          nullsWhere ??= first ? 'first' : 'last';
          return (x === null) === first ? -1 : 1;
        }
        const c = compare(x, y, d, k.span)!;
        if (c !== 0) return k.desc ? -c : c;
      }
      return 0;
    });
    const hiddenKeys = keys.map((k, i) => (k.col ? -1 : i)).filter((i) => i >= 0);
    steps.push({
      kind: 'order',
      keys: keys.map((k) => ({ text: k.text, desc: k.desc, col: k.col })),
      before: beforeIds,
      after: out.map((r) => r.id),
      hidden: hiddenKeys.length === 0 ? [] : out.map((r) => ({ id: r.id, text: hiddenKeys.map((i) => show(vals.get(r.id)![i])).join(', ') })),
      nulls: nullsWhere,
    });
  }

  if (stmt.limit) {
    const { offset, count, style } = stmt.limit;
    const ids = out.map((r) => r.id);
    const end = count === null ? ids.length : offset + count;
    steps.push({ kind: 'limit', style, offset, count, skipped: ids.slice(0, offset), kept: ids.slice(offset, end), cut: ids.slice(end) });
    out = out.slice(offset, end);
  }

  const bodyEnd = stmt.clauses[0]?.span.s ?? stmt.span.e;
  const all = [{ kind: 'FROM' as ClauseKind, span: { s: stmt.span.s, e: bodyEnd } }, ...stmt.clauses];
  const order = (k: string) => RUN_ORDER.indexOf(k as (typeof RUN_ORDER)[number]);
  const byRun = [...all].sort((a, b) => order(a.kind) - order(b.kind));
  // Clause FROM của query ghép là chính các vế: 'FROM vế 1 UNION vế 2'.
  const joined = ['FROM vế 1', ...setops.map((o, i) => (o.kind === 'setop' ? `${o.word.toUpperCase()} vế ${i + 2}` : ''))].join(' ');
  const clauses = all.map((c, written) => ({ kind: c.kind, text: c.kind === 'FROM' ? joined : src(c.span).replace(/\s+/g, ' ').trim(), written, run: byRun.indexOf(c) }));

  const result: ResultSet = { columns: L.columns, types, rows: out.map((r) => r.cells), rowIds: out.map((r) => r.id) };
  return { dialect: d, sql, clauses, focus: [], steps, result, acts: branches };
}

function execSelectInner(stmt: SelectStmt, db: Database, d: Dialect, sql: string, env: FnEnv, depth: number, outer?: OuterEnv): Trace {
  const steps: TraceStep[] = [];
  const src = (s: Span) => sql.slice(s.s, s.e);

  // Dấu (+) chỉ có chỗ trong WHERE.
  for (const e of [...stmt.items.map((it) => it.e ?? undefined), ...(stmt.groupBy ?? []), stmt.having, ...(stmt.orderBy ?? []).map((o) => o.e)]) {
    const m = outerMarks(e)[0];
    if (m) throw oraError('syntax', '30563', 'outer-select', m.span);
  }
  const old = planOuter(stmt, db, d, sql, env, depth, outer);
  const fromRef = old?.from ?? stmt.from;
  const plan: JoinPlan[] = old ? old.plan : stmt.joins.map((j) => ({ kind: j.kind, ref: j.ref, on: j.on, using: j.using, natural: j.natural, span: j.span }));
  const whereExpr = old ? old.where : stmt.where;

  /* ---------- FROM và JOIN ---------- */
  let scope: ScopeCol[] = [];
  /** Các column hiện ra khi SELECT *, theo thứ tự đúng của từng DBMS. */
  let starCols: ScopeCol[] = [];
  let rows: { id: number; cells: Value[] }[] = [{ id: 0, cells: [] }];
  let tableName: string | undefined;
  /** Thứ tự table người học viết trong FROM, để SELECT * không đổi chỗ khi (+) làm đổi thứ tự nối. */
  const written = new Map<string, number>();
  if (stmt.from) [stmt.from, ...stmt.joins.map((j) => j.ref)].forEach((r, i) => written.set((r.alias ?? r.table).toLowerCase(), i));

  if (fromRef) {
    const base = resolveRef(fromRef, { db, d, sql, env, depth, outer });
    tableName = plan.length === 0 ? base.name : undefined;
    scope = scopeOf(base, fromRef);
    starCols = [...scope];
    rows = loadRows(base, d).map((cells, id) => ({ id, cells }));
    if (base !== DUAL) steps.push({ kind: 'from', table: base.name, alias: fromRef.alias, ...(sourceOf(base) ? { source: sourceOf(base) } : {}), columns: traceCols(scope, d), rows: rows.map((r) => ({ id: r.id, cells: r.cells })) });

    plan.forEach((j, n) => {
      const right = resolveRef(j.ref, { db, d, sql, env, depth, outer });
      const rightScope = scopeOf(right, j.ref, scope.length);
      const dup = rightScope[0].qualifier !== '' && scope.find((s) => !s.virtual && s.qualifier.toLowerCase() === rightScope[0].qualifier.toLowerCase());
      if (dup) throw aliasTwice(d, rightScope[0].qualifier, j.ref.span);
      const nL = scope.length;
      const nR = rightScope.length;
      const joined = [...scope, ...rightScope];
      const J = makeEvaluator(joined, db, d, sql, env, undefined, depth, outer);

      /* USING và NATURAL: tìm các cặp column cùng tên. */
      const pairs: { left: ScopeCol; right: ScopeCol }[] = [];
      const visible = scope.filter((s) => !s.named);
      const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
      const leftOf = (name: string): ScopeCol | undefined => {
        const hits = visible.filter((s) => sameName(s.def.name, name));
        if (hits.length > 1) {
          const p = { name, tables: hits.map((h) => h.qualifier).join(', ') };
          if (d === 'mysql') throw new SqlError('name', '1052', `ERROR 1052 (23000): Column '${name}' in from clause is ambiguous`, 'ambiguous', friendly.ambiguous(p), j.span);
          throw new SqlError('name', 'ORA-00918', oraMessage('00918'), 'ambiguous', friendly.ambiguous(p), j.span);
        }
        return hits[0];
      };
      if (j.using) {
        for (const u of j.using) {
          if (pairs.some((p) => sameName(p.left.def.name, u.name))) continue;
          const r = rightScope.find((s) => sameName(s.def.name, u.name));
          const l = r ? leftOf(u.name) : undefined;
          if (!l || !r) {
            const p = { name: u.name, table: !r ? `table ${right.name}` : 'các table đứng trước JOIN' };
            // Đã kiểm trên Oracle XE 21c thật: ORA-00904 "bên thiếu"."COLUMN". Bên trái có nhiều table thì Oracle ghi tên nội bộ "from$_subquery$_003", engine bỏ phần đứng trước.
            const lq = new Set(visible.map((s) => s.qualifier.toLowerCase()));
            const q = !r ? rightScope[0].qualifier : lq.size === 1 ? visible[0].qualifier : '';
            throw unknownColumn(d, u.name, q === '' ? `"${u.name.toUpperCase()}"` : `"${q.toUpperCase()}"."${u.name.toUpperCase()}"`, 'from clause', u.span, 'using-missing', p);
          }
          pairs.push({ left: l, right: r });
        }
      } else if (j.natural) {
        // MySQL tìm column trùng từ table đứng cuối của bên trái ngược lên, nên lỗi 1052 nêu column đầu tiên theo thứ tự đó.
        const blocks = [...new Set(visible.map((c) => c.qualifier))].reverse();
        for (const q of blocks) {
          for (const l of visible.filter((c) => c.qualifier === q)) if (rightScope.some((s) => sameName(s.def.name, l.def.name))) leftOf(l.def.name);
        }
        for (const l of starCols) {
          const r = rightScope.find((s) => sameName(s.def.name, l.def.name));
          if (!r) continue;
          leftOf(l.def.name);
          pairs.push({ left: l, right: r });
        }
      }
      // MySQL xếp column gộp theo thứ tự trong table đứng đầu kết quả (bên trái, hoặc bên phải với RIGHT JOIN), không theo thứ tự viết trong USING.
      // Đã kiểm trên Oracle XE 21c thật: Oracle xếp theo thứ tự viết trong USING; NATURAL thì theo table bên trái (kể cả RIGHT JOIN USING).
      if (d === 'mysql' && pairs.length > 1) {
        const rank = (p: { left: ScopeCol; right: ScopeCol }) => (j.kind === 'right' ? p.right.idx : starCols.indexOf(p.left));
        pairs.sort((a, b) => rank(a) - rank(b));
      }
      const qual = (c: ScopeCol) => (c.virtual ? c.def.name : `${c.qualifier}.${c.def.name}`);
      let on = j.on;
      let onText = j.onText ?? (j.on ? src(j.on.span).replace(/\s+/g, ' ') : undefined);
      let kind = j.kind;
      if (j.using || j.natural) {
        if (pairs.length > 0) {
          const eq = pairs.map(({ left: l, right: r }): Expr => ({
            t: 'bin',
            op: '=',
            l: { t: 'col', table: l.virtual ? undefined : l.qualifier, name: l.def.name, span: j.span },
            r: { t: 'col', table: r.qualifier, name: r.def.name, span: j.span },
            span: j.span,
            opSpan: j.span,
          }));
          on = andChain(eq);
          onText = pairs.map(({ left: l, right: r }) => `${qual(l)} = ${qual(r)}`).join(' AND ');
        } else if (j.natural) {
          // NATURAL JOIN không có column trùng tên thì thành CROSS JOIN.
          on = undefined;
          onText = undefined;
          if (kind === 'inner') kind = 'cross';
        }
      }
      if (j.on) {
        if (d === 'oracle' && !isCond(j.on)) throw syntaxError(d, sql, j.on.span, '00920', 'need-condition');
        J.check(j.on, 'on clause', 'no');
      } else if (on) J.check(on, 'on clause', 'no');

      const rightRows = loadRows(right, d);
      if (rows.length * rightRows.length > 250000) throw unsupported('cách ghép hai table lớn mà không có điều kiện ON', j.span);

      /* Column gộp: nằm sau các ô của hai table trong mỗi row. */
      const virtuals: ScopeCol[] = pairs.map(({ left: l, right: r }, k) => ({
        qualifier: '',
        table: '',
        def: { name: l.def.name, type: l.def.type, label: l.def.label },
        idx: nL + nR + k,
        virtual: true,
        from: kind === 'right' ? [r.idx, l.idx] : [l.idx, r.idx],
      }));
      const withMerged = (cells: Value[]): Value[] => [...cells, ...virtuals.map((v) => v.from!.map((i) => cells[i]).find((x) => x !== null && x !== undefined) ?? null)];
      const nullsL: Value[] = scope.map(() => null);
      const nullsR: Value[] = right.columns.map(() => null);
      const match = (lc: Value[], rc: Value[]) => !on || J.truth(J.ev(on, { cells: [...lc, ...rc] }), on.span) === true;

      const out: typeof rows = [];
      const links: { id: number; left: number | null; right: number | null }[] = [];
      let seq = (n + 1) * 100000;
      const emit = (lc: Value[], rc: Value[], l: number | null, r: number | null) => {
        out.push({ id: seq, cells: withMerged([...lc, ...rc]) });
        links.push({ id: seq++, left: l, right: r });
      };
      if (kind === 'right') {
        // Chạy theo từng row bên phải, như MySQL: row bên phải đứng đúng thứ tự của nó.
        rightRows.forEach((R, ri) => {
          let found = false;
          for (const L of rows) {
            if (match(L.cells, R)) {
              found = true;
              emit(L.cells, R, L.id, ri);
            }
          }
          if (!found) emit(nullsL, R, null, ri);
        });
      } else {
        const used = new Set<number>();
        for (const L of rows) {
          let found = false;
          rightRows.forEach((R, ri) => {
            if (match(L.cells, R)) {
              found = true;
              used.add(ri);
              emit(L.cells, R, L.id, ri);
            }
          });
          if (!found && (kind === 'left' || kind === 'full')) emit(L.cells, nullsR, L.id, null);
        }
        if (kind === 'full') rightRows.forEach((R, ri) => !used.has(ri) && emit(nullsL, R, null, ri));
      }

      /* Ghi nhận column gộp và thứ tự SELECT *. */
      const flag = j.natural ? 'natural' : 'using';
      pairs.forEach(({ left: l, right: r }) => {
        l.named = flag;
        r.named = flag;
      });
      if (pairs.length === 0) starCols = [...starCols, ...rightScope];
      else {
        const gone = new Set(pairs.map((p) => p.left));
        const restL = starCols.filter((c) => !gone.has(c));
        const restR = rightScope.filter((c) => !pairs.some((p) => p.right === c));
        // MySQL coi RIGHT JOIN như LEFT JOIN đã đổi chỗ hai table, nên column bên phải đứng trước. Oracle luôn để column bên trái trước.
        starCols = d === 'mysql' && kind === 'right' ? [...virtuals, ...restR, ...restL] : [...virtuals, ...restL, ...restR];
      }
      scope = [...joined, ...virtuals];

      const shown = scope.filter((c) => !c.virtual);
      steps.push({
        kind: 'join',
        joinKind: kind,
        table: right.name,
        alias: j.ref.alias,
        ...(sourceOf(right) ? { source: sourceOf(right) } : {}),
        on: onText,
        rightColumns: traceCols(rightScope, d),
        rightRows: rightRows.map((cells, id) => ({ id, cells })),
        columns: traceCols(shown, d),
        rows: out.map((r) => ({ id: r.id, cells: shown.map((c) => r.cells[c.idx]) })),
        links,
        merged: pairs.length > 0 ? pairs.map((p) => p.left.def.name) : undefined,
      });
      rows = out;
    });
    // (+) có thể làm đổi thứ tự nối. SELECT * vẫn theo thứ tự table trong FROM.
    if (old) starCols = [...starCols].sort((a, b) => (written.get(a.qualifier.toLowerCase()) ?? 0) - (written.get(b.qualifier.toLowerCase()) ?? 0) || a.idx - b.idx);
  }

  const E = makeEvaluator(scope, db, d, sql, env, tableName, depth, outer);

  /* ---------- kiểm trước khi chạy ---------- */
  /** MySQL cho GROUP BY viết số thứ tự column trong SELECT, hoặc alias (khi alias không trùng tên column của table). Oracle thì không. */
  const groupKey = (k: Expr): Expr => {
    if (d !== 'mysql') return k;
    if (k.t === 'num' && Number.isInteger(k.v)) {
      const it = stmt.items[k.v - 1];
      if (k.v < 1 || !it) throw unknownColumn(d, String(k.v), String(k.v), 'group statement', k.span, 'group-position', { n: k.v, max: stmt.items.length });
      if (!it.e) throw unsupported('GROUP BY số thứ tự khi SELECT có dấu *', k.span);
      if (hasAgg(it.e)) throw new SqlError('syntax', '1056', `ERROR 1056 (42000): Can't group on '${src(it.span)}'`, 'group-on-agg', friendly['group-on-agg']({ name: src(it.span) }), k.span);
      return it.e;
    }
    if (k.t !== 'col' || k.table) return k;
    try {
      E.resolve(k, 'group statement');
      return k;
    } catch (err) {
      const it = stmt.items.find((x) => x.e && x.alias !== undefined && x.alias.toLowerCase() === k.name.toLowerCase());
      if (!it?.e) throw err;
      if (hasAgg(it.e)) throw new SqlError('syntax', '1056', `ERROR 1056 (42000): Can't group on '${k.name}'`, 'group-on-agg', friendly['group-on-agg']({ name: k.name }), k.span);
      return it.e;
    }
  };
  const keyExprs = (stmt.groupBy ?? []).map(groupKey);
  const grouped = stmt.groupBy !== undefined || stmt.having !== undefined || stmt.items.some((it) => it.e && hasAgg(it.e)) || (stmt.orderBy ?? []).some((o) => hasAgg(o.e));

  for (const it of stmt.items) {
    if (it.e) {
      if (d === 'oracle' && isCond(it.e)) throw syntaxError(d, sql, it.e.span, '00923', 'condition-in-select');
      E.check(it.e, 'field list', grouped ? 'yes' : 'no');
    } else if (it.starTable && !scope.some((s) => s.qualifier.toLowerCase() === it.starTable!.toLowerCase())) {
      throw unknownColumn(d, `${it.starTable}.*`, `"${it.starTable.toUpperCase()}"`, 'field list', it.span, 'unknown-qualifier', { name: it.starTable });
    }
  }
  if (whereExpr) {
    if (d === 'oracle' && !isCond(whereExpr)) throw syntaxError(d, sql, whereExpr.span, '00920', 'need-condition');
    E.check(whereExpr, 'where clause', 'no');
  }
  keyExprs.forEach((k) => E.check(k, 'group statement', 'no'));
  // GROUPING(x) chỉ nhận key của GROUP BY, và chỉ có nghĩa khi có GROUP BY.
  const checkGrouping = (e: Expr): void => {
    if (e.t === 'fn' && e.name === 'GROUPING') {
      if (!stmt.groupBy) {
        if (d === 'mysql') throw new SqlError('syntax', '1111', 'ERROR 1111 (HY000): Invalid use of group function', 'grouping-no-group', friendly['grouping-no-group']({}), e.span);
        throw new SqlError('name', 'ORA-00979', oraMessage('00979'), 'grouping-no-group', friendly['grouping-no-group']({}), e.span);
      }
      e.args.forEach((a, i) => {
        if (keyExprs.some((k) => E.same(k, a))) return;
        const p = { name: src(a.span) };
        if (d === 'mysql') throw new SqlError('name', '3602', `ERROR 3602 (HY000): Argument #${i + 1} of GROUPING function is not in GROUP BY`, 'grouping-not-key', friendly['grouping-not-key'](p), a.span);
        throw new SqlError('name', 'ORA-00979', oraMessage('00979'), 'grouping-not-key', friendly['grouping-not-key'](p), a.span);
      });
    }
    children(e).forEach(checkGrouping);
  };
  [...stmt.items.map((it) => it.e), stmt.having, ...(stmt.orderBy ?? []).map((o) => o.e)].forEach((e) => e && checkGrouping(e));
  if (stmt.having) {
    if (d === 'oracle' && !isCond(stmt.having)) throw syntaxError(d, sql, stmt.having.span, '00920', 'need-condition');
    E.check(stmt.having, 'having clause', 'yes');
  }

  /** Trong query có gom nhóm, column đứng ngoài function gom phải nằm trong GROUP BY. */
  const groupedTables = new Set(
    d === 'mysql'
      ? [...new Set(scope.map((s) => s.qualifier))].filter((q) => {
          const pks = scope.filter((s) => s.qualifier === q && s.def.pk);
          return pks.length > 0 && pks.every((pk) => keyExprs.some((k) => k.t === 'col' && E.resolve(k, 'group statement').idx === pk.idx));
        })
      : [],
  );
  const mustBeGrouped = (e: Expr, where: MysqlWhere, n: number, part: string): void => {
    if (keyExprs.some((k) => E.same(k, e)) || isAgg(e)) return;
    if (e.t === 'col') {
      const c = E.resolve(e, where);
      // Column của query ngoài là một hằng với query này.
      if (c.outerEnv || groupedTables.has(c.qualifier)) return;
      const hint = stmt.groupBy ? 'not-grouped' : 'agg-with-column';
      const p = { name: e.name };
      const origin = c.virtual && c.from ? (scope.find((x) => x.idx === c.from![0]) ?? c) : c;
      const full = `${db.name}.${origin.table}.${c.def.name}`;
      if (d === 'mysql') {
        const msg = stmt.groupBy
          ? `ERROR 1055 (42000): Expression #${n} of ${part} is not in GROUP BY clause and contains nonaggregated column '${full}' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by`
          : `ERROR 1140 (42000): In aggregated query without GROUP BY, expression #${n} of ${part} contains nonaggregated column '${full}'; this is incompatible with sql_mode=only_full_group_by`;
        throw new SqlError('name', stmt.groupBy ? '1055' : '1140', msg, hint, friendly[hint](p), e.span);
      }
      const code = stmt.groupBy ? '00979' : '00937';
      throw new SqlError('name', `ORA-${code}`, oraMessage(code), hint, friendly[hint](p), e.span);
    }
    children(e).forEach((x) => mustBeGrouped(x, where, n, part));
  };
  if (grouped) {
    // MySQL đánh số theo column sau khi dấu * đã bung ra.
    let pos = 0;
    for (const it of stmt.items) {
      if (it.e) {
        pos++;
        mustBeGrouped(it.e, 'field list', pos, 'SELECT list');
      } else {
        const cols = it.starTable ? scope.filter((x) => !x.virtual && x.qualifier.toLowerCase() === it.starTable!.toLowerCase()) : starCols;
        const k = cols.findIndex((s) => !groupedTables.has(s.qualifier) && !keyExprs.some((g) => g.t === 'col' && E.resolve(g, 'group statement').idx === s.idx));
        if (k >= 0) mustBeGrouped({ t: 'col', name: cols[k].def.name, table: cols[k].virtual ? undefined : cols[k].qualifier, span: it.span }, 'field list', pos + k + 1, 'SELECT list');
        pos += cols.length;
      }
    }
    if (stmt.having) mustBeGrouped(stmt.having, 'having clause', 1, 'HAVING clause');
  }

  /* ---------- subquery đã chạy trong lúc kiểm ---------- */
  const noteSubs = (from: number) => {
    for (const s of E.subs.slice(from)) {
      steps.push({ kind: 'subquery', text: src(s.q.span).replace(/\s+/g, ' '), scalar: s.scalar, columns: s.result.columns, rows: s.result.rows.slice(0, 8), total: s.result.rows.length });
    }
    return E.subs.length;
  };
  let seenSubs = noteSubs(0);

  /* ---------- WHERE ---------- */
  if (whereExpr) {
    const w = whereExpr;
    let kept = 0;
    const verdicts = rows.map((r) => {
      const cx: Cx = { cells: r.cells, rownum: kept + 1 };
      const pass = E.truth(E.ev(w, cx), w.span) === true;
      const v = { id: r.id, pass, reason: E.why(w, cx) };
      if (pass) kept++;
      return v;
    });
    const keep = new Set(verdicts.filter((v) => v.pass).map((v) => v.id));
    rows = rows.filter((r) => keep.has(r.id));
    steps.push({ kind: 'where', verdicts });
  }

  /* ---------- GROUP BY và HAVING ---------- */
  let units: Unit[] = rows.map((r, i) => ({ id: r.id, cx: { cells: r.cells, rownum: i + 1 } }));
  /** Giá trị các column đang trên sân khấu của từng unit (row, hoặc nhóm khi đã GROUP BY). Dùng cho step window. */
  const stageCells = new Map<number, Value[]>();
  const shownScope = scope.filter((c) => !c.virtual);
  for (const r of rows) stageCells.set(r.id, shownScope.map((c) => r.cells[c.idx]));
  const aggs: FnExpr[] = [];
  const groupCols: TraceCol[] = [];
  if (grouped) {
    const collect = (e: Expr) => {
      if (isAgg(e)) {
        if (!aggs.some((a) => E.same(a, e))) aggs.push(e);
        return;
      }
      children(e).forEach(collect);
    };
    stmt.items.forEach((it) => it.e && collect(it.e));
    if (stmt.having) collect(stmt.having);
    (stmt.orderBy ?? []).forEach((o) => collect(o.e));

    const groups = new Map<string, { rows: typeof rows }>();
    if (!stmt.groupBy) groups.set('', { rows });
    else {
      for (const r of rows) {
        const k = keyExprs.map((e) => keyOf(E.ev(e, { cells: r.cells }), d)).join('\u0001');
        const g = groups.get(k);
        if (g) g.rows.push(r);
        else groups.set(k, { rows: [r] });
      }
    }
    const blank = scope.map(() => null);
    type GroupEntry = { rows: typeof rows; nullKeys: Expr[] };
    let entries: GroupEntry[] = [...groups.values()].map((g) => ({ rows: g.rows, nullKeys: [] }));
    const R = stmt.rollup ?? 0;
    if (R > 0 && stmt.groupBy) {
      // Dòng tổng: cuộn lần lượt 1, 2, ... R key cuối thành NULL, gộp các nhóm có cùng phần key còn lại.
      const n = keyExprs.length;
      const base = entries;
      const keyOfRow = (r: (typeof rows)[number], upto: number) => keyExprs.slice(0, upto).map((e) => keyOf(E.ev(e, { cells: r.cells }), d)).join('\u0001');
      for (let j = 1; j <= R; j++) {
        const merged = new Map<string, GroupEntry>();
        for (const g of base) {
          const k = keyOfRow(g.rows[0], n - j);
          const hit = merged.get(k);
          if (hit) hit.rows = [...hit.rows, ...g.rows];
          else merged.set(k, { rows: [...g.rows], nullKeys: keyExprs.slice(n - j) });
        }
        entries = [...entries, ...merged.values()];
      }
      // Sắp theo key từ trái sang phải. Key đã cuộn lên xếp sau mọi giá trị, nên dòng tổng đứng sau các dòng chi tiết của nó.
      const sortKey = entries.map((g) => keyExprs.map((e, i) => (i >= n - g.nullKeys.length ? undefined : E.ev(e, { cells: g.rows[0].cells }))));
      const sortNullKeys = (x: Value, y: Value): number | undefined => (x !== null && y !== null ? undefined : x === null && y === null ? 0 : (x === null) === (d === 'mysql') ? -1 : 1);
      const order = entries.map((_g, i) => i).sort((a, b) => {
        for (let i = 0; i < n; i++) {
          const x = sortKey[a][i];
          const y = sortKey[b][i];
          if (x === undefined || y === undefined) {
            if (x === y) continue;
            return x === undefined ? 1 : -1;
          }
          const nc = sortNullKeys(x, y);
          if (nc !== undefined) {
            if (nc !== 0) return nc;
            continue;
          }
          const c = compare(x, y, d, stmt.span) ?? 0;
          if (c !== 0) return c;
        }
        return a - b;
      });
      entries = order.map((i) => entries[i]);
    }
    keyExprs.forEach((k, i) => {
      const c = k.t === 'col' ? E.resolve(k, 'group statement') : null;
      groupCols.push({ key: `g${i}`, header: c ? hdr(c.def, d) : src(k.span), label: c?.def.label, type: c ? c.def.type : 'expr' });
    });
    aggs.forEach((a, i) => groupCols.push({ key: `a${i}`, header: d === 'oracle' ? oracleHeader(src(a.span)) : src(a.span), type: 'expr' }));

    let gi = 0;
    const traceGroups = entries.map((g) => {
      const cells = g.rows[0]?.cells ?? blank;
      const cx: Cx = { cells, group: g.rows.map((r) => r.cells), ...(g.nullKeys.length > 0 ? { nullKeys: g.nullKeys } : {}) };
      const keyValues = keyExprs.map((e) => E.ev(e, cx));
      const aggValues = aggs.map((a) => E.ev(a, cx));
      const id = 900000 + gi++;
      return { id, rowIds: g.rows.map((r) => r.id), keyValues, aggValues, cx };
    });
    units = traceGroups.map((g) => ({ id: g.id, cx: g.cx }));
    stageCells.clear();
    for (const g of traceGroups) stageCells.set(g.id, [...g.keyValues, ...g.aggValues]);
    steps.push({
      kind: 'group',
      implicit: !stmt.groupBy,
      ...(R > 0 ? { rollup: R } : {}),
      keys: keyExprs.map((k) => src(k.span)),
      aggs: aggs.map((a) => src(a.span)),
      columns: groupCols,
      groups: traceGroups.map((g) => ({ id: g.id, rowIds: g.rowIds, cells: [...g.keyValues, ...g.aggValues] })),
    });

    if (stmt.having) {
      const h = stmt.having;
      const verdicts = units.map((u) => ({ id: u.id, pass: E.truth(E.ev(h, u.cx), h.span) === true, reason: E.why(h, u.cx) }));
      const keep = new Set(verdicts.filter((v) => v.pass).map((v) => v.id));
      units = units.filter((u) => keep.has(u.id));
      steps.push({ kind: 'having', verdicts });
    }
  }

  /* ---------- window function: tính sau WHERE, GROUP BY, HAVING ---------- */
  const winFns: FnExpr[] = [];
  const findWin = (e: Expr): void => {
    if (e.t === 'fn' && e.over) winFns.push(e);
    else children(e).forEach(findWin);
  };
  stmt.items.forEach((it) => it.e && findWin(it.e));
  (stmt.orderBy ?? []).forEach((o) => findWin(o.e));
  const winKeys: string[] = [];
  if (winFns.length > 0) {
    winFns.forEach((f) => E.check(f, 'field list', grouped ? 'yes' : 'no'));
    const partsOf = new Map<FnExpr, { label: string; ids: number[] }[]>();
    const order = computeWindows(winFns, units, E.ev, d, (fn, parts) => {
      partsOf.set(fn, parts.map((p) => ({ label: p.key.map((v) => show(v)).join(', '), ids: p.idxs.map((i) => units[i].id) })));
    });
    // Không có ORDER BY thì DBMS trả row theo thứ tự sắp của window cuối cùng.
    // Đã kiểm trên MySQL 8.0.46 và Oracle XE 21c thật: cả hai trả row theo thứ tự sắp của window cuối. Oracle không hứa thứ tự này, nên bài tập vẫn phải có ORDER BY.
    if (order && !stmt.orderBy) units = order.map((i) => units[i]);

    /* Mỗi cụm OVER (...) khác nhau một step. Column của cụm sau cộng dồn lên column của cụm trước. */
    const clusters = new Map<string, FnExpr[]>();
    for (const f of winFns) {
      const k = src(f.over!.span).replace(/\s+/g, ' ');
      clusters.set(k, [...(clusters.get(k) ?? []), f]);
    }
    let cols: TraceCol[] = grouped ? [...groupCols] : traceCols(shownScope, d);
    const extra = new Map<number, Value[]>();
    for (const fns of clusters.values()) {
      const spec = fns[0].over!;
      const added = fns.map((f) => `w${winFns.indexOf(f)}`);
      winKeys.push(...added);
      // Tiêu đề giống tiêu đề mà SELECT sẽ đặt: alias nếu có, nếu không thì chính chữ của function.
      const head = (f: FnExpr) => {
        const it = stmt.items.find((x) => x.e === f);
        if (it?.alias !== undefined) return d === 'oracle' && !it.aliasQuoted ? it.alias.toUpperCase() : it.alias;
        return d === 'oracle' ? oracleHeader(src(f.span)) : src(f.span);
      };
      cols = [...cols, ...fns.map((f, i) => ({ key: added[i], header: head(f), type: 'expr' as const }))];
      for (const u of units) {
        const vals = fns.map((f) => {
          const v = u.cx.win?.get(f) ?? null;
          return typeof v === 'boolean' ? (v ? 1 : 0) : v;
        });
        extra.set(u.id, [...(extra.get(u.id) ?? []), ...vals]);
      }
      steps.push({
        kind: 'window',
        fns: fns.map((f) => src(f.span).replace(/\s+/g, ' ')),
        partitionBy: spec.partition.map((p) => src(p.span)),
        orderBy: spec.orderBy.map((o) => ({ text: src(o.e.span), desc: o.desc })),
        parts: partsOf.get(fns[0])!,
        columns: cols,
        added,
        rows: units.map((u) => ({ id: u.id, cells: [...(stageCells.get(u.id) ?? []), ...(extra.get(u.id) ?? [])] })),
      });
    }
  }

  /* ---------- SELECT ---------- */
  const outCols: TraceCol[] = [];
  const outDefs: (ColumnDef | undefined)[] = [];
  const getters: ((cx: Cx) => Value)[] = [];
  const aliases: (string | undefined)[] = [];
  const computed: string[] = [];
  const used = new Set<string>();
  const uniq = (key: string) => {
    let k = key;
    for (let n = 2; used.has(k); n++) k = `${key}#${n}`;
    used.add(k);
    return k;
  };
  let star = false;
  let xn = 0;
  for (const it of stmt.items) {
    if (!it.e) {
      star = true;
      const starSrc = (it.starTable ? scope.filter((x) => !x.virtual) : starCols).filter((c) => !it.starTable || c.qualifier.toLowerCase() === it.starTable.toLowerCase());
      // Oracle 18c và 21c thật: SELECT * trên subquery có hai column cùng tên báo ORA-00918 (MySQL báo từ lúc dựng subquery).
      if (d === 'oracle') {
        const dup = starSrc.find((c, i) => starSrc.some((o, j) => j < i && o.qualifier.toLowerCase() === c.qualifier.toLowerCase() && o.def.name.toLowerCase() === c.def.name.toLowerCase()));
        if (dup) {
          throw new SqlError('name', 'ORA-00918', oraMessage('00918'), 'ambiguous-anon', friendly['ambiguous-anon']({ name: dup.def.name }), it.span);
        }
      }
      for (const c of starSrc) {
        const gk = grouped ? keyExprs.findIndex((k) => k.t === 'col' && E.resolve(k, 'group statement').idx === c.idx) : -1;
        outCols.push({ key: uniq(gk >= 0 ? `g${gk}` : `c${c.idx}`), header: hdr(c.def, d), label: c.def.label, type: c.def.type });
        getters.push((cx) => cx.cells[c.idx]);
        outDefs.push(c.def);
        aliases.push(undefined);
      }
      continue;
    }
    const e = it.e;
    const alias = it.alias === undefined ? undefined : d === 'oracle' && !it.aliasQuoted ? it.alias.toUpperCase() : it.alias;
    const text = src(e.span);
    const gk = grouped ? keyExprs.findIndex((k) => E.same(k, e)) : -1;
    const ak = grouped ? aggs.findIndex((a) => E.same(a, e)) : -1;
    const own = e.t === 'col' ? E.resolve(e, 'field list') : undefined;
    if (e.t === 'col' && own && !own.outerEnv) {
      const c = own;
      const header = alias ?? (d === 'oracle' ? (e.quoted ? e.name : e.name.toUpperCase()) : e.name);
      outCols.push({ key: uniq(gk >= 0 ? `g${gk}` : `c${c.idx}`), header, label: alias ? undefined : c.def.label, type: c.def.type });
      getters.push((cx) => (cx.nullKeys?.some((k) => E.same(k, e)) ? null : cx.cells[c.idx]));
      outDefs.push(c.def);
    } else {
      // Column của window function đã có từ step window: SELECT chỉ chọn nó.
      const wk = e.t === 'fn' && e.over ? winFns.indexOf(e) : -1;
      const key = uniq(gk >= 0 ? `g${gk}` : ak >= 0 ? `a${ak}` : wk >= 0 ? `w${wk}` : `x${xn++}`);
      // MySQL đặt tiêu đề của một chuỗi đứng riêng bằng chính nội dung chuỗi, không kèm dấu nháy.
      const plain = d === 'mysql' && e.t === 'str' ? e.v : text;
      // Oracle đặt tiêu đề của s.NEXTVAL là NEXTVAL.
      const header = e.t === 'seq' ? e.which : d === 'oracle' ? oracleHeader(text) : plain;
      outCols.push({ key, header: alias ?? header, type: 'expr' });
      if (key.startsWith('x')) computed.push(key);
      getters.push((cx) => {
        const v = E.ev(e, cx);
        return typeof v === 'boolean' ? (v ? 1 : 0) : v;
      });
      outDefs.push(undefined);
    }
    aliases.push(alias);
  }
  let outRows: TraceRow[] = units.map((u) => ({ id: u.id, cells: getters.map((g) => g(u.cx)) }));
  const unitById = new Map(units.map((u) => [u.id, u]));
  seenSubs = noteSubs(seenSubs);

  const duplicates: number[] = [];
  if (stmt.distinct) {
    const seen = new Set<string>();
    outRows = outRows.filter((r) => {
      const k = r.cells.map((v) => keyOf(v, d)).join('\u0001');
      if (seen.has(k)) {
        duplicates.push(r.id);
        return false;
      }
      seen.add(k);
      return true;
    });
  }
  const keptKeys = new Set(outCols.map((c) => c.key.split('#')[0]));
  const before = [...(grouped ? groupCols.map((c) => c.key) : scope.map((c) => `c${c.idx}`)), ...winKeys];
  steps.push({ kind: 'select', star, distinct: stmt.distinct, columns: outCols, rows: outRows, dropped: before.filter((k) => !keptKeys.has(k)), computed, duplicates });

  /* ---------- ORDER BY ---------- */
  if (stmt.orderBy) {
    type Key = { get: (r: TraceRow) => Value; desc: boolean; nulls?: 'FIRST' | 'LAST'; text: string; col?: string; span: Span };
    const keys: Key[] = stmt.orderBy.map((o, n) => {
      const e = o.e;
      const base = { desc: o.desc, nulls: o.nulls, text: src(e.span), span: e.span };
      if (e.t === 'num' && Number.isInteger(e.v)) {
        if (e.v < 1 || e.v > outCols.length) {
          const p = { n: e.v, max: outCols.length };
          if (d === 'mysql') throw new SqlError('name', '1054', `ERROR 1054 (42S22): Unknown column '${e.v}' in 'order clause'`, 'order-position', friendly['order-position'](p), e.span);
          throw new SqlError('name', 'ORA-01785', 'ORA-01785: ORDER BY item must be the number of a SELECT-list expression', 'order-position', friendly['order-position'](p), e.span);
        }
        const i = e.v - 1;
        return { ...base, get: (r) => r.cells[i], col: outCols[i].key };
      }
      if (e.t === 'col' && !e.table) {
        const want = d === 'oracle' && !e.quoted ? e.name.toUpperCase() : e.name;
        const i = aliases.findIndex((a) => a !== undefined && (d === 'oracle' ? a === want : a.toLowerCase() === want.toLowerCase()));
        if (i >= 0) return { ...base, get: (r) => r.cells[i], col: outCols[i].key };
      }
      E.check(e, 'order clause', grouped ? 'yes' : 'no');
      if (grouped) mustBeGrouped(e, 'order clause', n + 1, 'ORDER BY clause');
      const gk = grouped ? keyExprs.findIndex((k) => E.same(k, e)) : -1;
      const ak = grouped ? aggs.findIndex((a) => E.same(a, e)) : -1;
      const oc = e.t === 'col' ? E.resolve(e, 'order clause') : undefined;
      const want = gk >= 0 ? `g${gk}` : ak >= 0 ? `a${ak}` : oc && !oc.outerEnv ? `c${oc.idx}` : undefined;
      const visible = want ? outCols.find((c) => c.key === want)?.key : undefined;
      return { ...base, get: (r) => E.ev(e, unitById.get(r.id)!.cx), col: visible };
    });

    const beforeIds = outRows.map((r) => r.id);
    const vals = new Map(outRows.map((r) => [r.id, keys.map((k) => k.get(r))]));
    let nullsWhere: 'first' | 'last' | undefined;
    const sorted = [...outRows].sort((ra, rb) => {
      const a = vals.get(ra.id)!;
      const b = vals.get(rb.id)!;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const x = a[i];
        const y = b[i];
        if (x === null || y === null) {
          if (x === null && y === null) continue;
          // MySQL coi NULL là nhỏ nhất. Oracle coi NULL là lớn nhất.
          const first = k.nulls ? k.nulls === 'FIRST' : d === 'mysql' ? !k.desc : k.desc;
          nullsWhere ??= first ? 'first' : 'last';
          return (x === null) === first ? -1 : 1;
        }
        const c = compare(x, y, d, k.span)!;
        if (c !== 0) return k.desc ? -c : c;
      }
      return 0;
    });
    outRows = sorted;
    const hiddenKeys = keys.map((k, i) => (k.col ? -1 : i)).filter((i) => i >= 0);
    steps.push({
      kind: 'order',
      keys: keys.map((k) => ({ text: k.text, desc: k.desc, col: k.col })),
      before: beforeIds,
      after: outRows.map((r) => r.id),
      hidden: hiddenKeys.length === 0 ? [] : outRows.map((r) => ({ id: r.id, text: hiddenKeys.map((i) => show(vals.get(r.id)![i])).join(', ') })),
      nulls: nullsWhere,
    });
  }

  /* ---------- LIMIT hoặc FETCH FIRST ---------- */
  if (stmt.limit) {
    const { offset, count, style } = stmt.limit;
    const ids = outRows.map((r) => r.id);
    const end = count === null ? ids.length : offset + count;
    steps.push({ kind: 'limit', style, offset, count, skipped: ids.slice(0, offset), kept: ids.slice(offset, end), cut: ids.slice(end) });
    outRows = outRows.slice(offset, end);
  }

  const result: ResultSet = {
    columns: outCols.map((c) => c.header),
    types: outCols.map((c) => c.type),
    rows: outRows.map((r) => r.cells),
    rowIds: outRows.map((r) => r.id),
  };

  const order = (k: string) => RUN_ORDER.indexOf(k as (typeof RUN_ORDER)[number]);
  const byRun = [...stmt.clauses].sort((a, b) => order(a.kind) - order(b.kind));
  const clauses = stmt.clauses.map((c, written) => ({
    kind: c.kind,
    text: src(c.span).replace(/\s+/g, ' ').trim(),
    written,
    run: byRun.indexOf(c),
  }));

  resultDefs.set(result, outDefs);
  return { dialect: d, sql, clauses, focus: E.focus(), steps, result, ...(E.correlated ? { partial: true } : {}) };
}
