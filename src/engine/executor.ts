import type { ColumnDef, Database, Dialect, RawValue, SqlDate, TableDef, Value } from './types';
import { AGGREGATES, type Expr, RUN_ORDER, type SelectStmt, type TableRef } from './ast';
import {
  type MysqlWhere,
  type Span,
  SqlError,
  nearest,
  oraMessage,
  runtimeError,
  syntaxError,
  unknownColumn,
  unknownFunction,
  unknownTable,
  unsupported,
} from './errors';
import { FUNCTIONS, type FnEnv, addDays, diffDays, extract } from './functions';
import { didYouMean, friendly, reason } from './messages.vi';
import type { ResultSet, Trace, TraceCol, TraceRow, TraceStep } from './trace';
import { arith, compare, isDate, keyOf, like, norm, parseIsoDate, show, showQuoted, toNumber, toText } from './values';

type ColExpr = Extract<Expr, { t: 'col' }>;
type FnExpr = Extract<Expr, { t: 'fn' }>;

export interface ScopeCol {
  /** Tên đứng trước dấu chấm: alias nếu có, không thì tên table. */
  qualifier: string;
  table: string;
  def: ColumnDef;
  idx: number;
}

/** Thứ một biểu thức cần để tính: các ô của row, nhóm row (khi đã gom), và số thứ tự ROWNUM. */
export interface Cx {
  cells: Value[];
  group?: Value[][];
  rownum?: number;
}

export const DUAL: TableDef = { name: 'DUAL', columns: [{ name: 'DUMMY', type: 'text' }], rows: [['X']] };

/** "Bây giờ" của khóa học: thứ Hai ngay sau tuần có dữ liệu mẫu. */
export const DEFAULT_ENV: FnEnv = { now: { kind: 'date', iso: '2026-03-09 10:30:00' } };

const DIALECT_NAME = { mysql: 'MySQL', oracle: 'Oracle' } as const;
const UNITS = new Set(['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND']);
const CONDITION = new Set(['=', '<>', '<', '<=', '>', '>=', 'AND', 'OR']);

export const isCond = (e: Expr): boolean =>
  (e.t === 'bin' && CONDITION.has(e.op)) || (e.t === 'unary' && e.op === 'NOT') || e.t === 'isnull' || e.t === 'in' || e.t === 'insub' || e.t === 'between' || e.t === 'like';

const isAgg = (e: Expr): e is FnExpr => e.t === 'fn' && AGGREGATES.has(e.name);

function children(e: Expr): Expr[] {
  switch (e.t) {
    case 'unary':
    case 'isnull':
      return [e.e];
    case 'bin':
      return [e.l, e.r];
    case 'in':
      return [e.e, ...e.list];
    case 'insub':
      return [e.e];
    case 'between':
      return [e.e, e.lo, e.hi];
    case 'like':
      return [e.e, e.pat];
    case 'fn':
      return e.args;
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
  return table.rows.map((r) => r.map((v, i) => load(v, table.columns[i].type, d)));
}

export function findTable(db: Database, ref: TableRef, d: Dialect): TableDef {
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
  /** Các subquery đã chạy, theo thứ tự gặp. */
  subs: { q: SelectStmt; result: ResultSet; scalar: boolean }[];
}

export function makeEvaluator(scope: ScopeCol[], db: Database, d: Dialect, sql: string, env: FnEnv, tableName?: string, depth = 0): Evaluator {
  const src = (s: Span) => sql.slice(s.s, s.e);
  const colIdx = new Map<ColExpr, ScopeCol>();
  const subCache = new Map<SelectStmt, ResultSet>();
  const subs: Evaluator['subs'] = [];

  const nameEq = (def: string, c: ColExpr) => (d === 'oracle' && c.quoted ? def.toUpperCase() === c.name : def.toLowerCase() === c.name.toLowerCase());

  const resolve = (c: ColExpr, where: MysqlWhere): ScopeCol => {
    const hit0 = colIdx.get(c);
    if (hit0) return hit0;
    const shown = c.table ? `${c.table}.${c.name}` : c.name;
    const oraIdent = (c.table ? `"${c.table.toUpperCase()}".` : '') + `"${c.quoted ? c.name : c.name.toUpperCase()}"`;
    let cands = scope;
    if (c.table) {
      cands = scope.filter((s) => s.qualifier.toLowerCase() === c.table!.toLowerCase());
      if (cands.length === 0) throw unknownColumn(d, shown, oraIdent, where, c.span, 'unknown-qualifier', { name: c.table });
    }
    const hits = cands.filter((s) => nameEq(s.def.name, c));
    if (hits.length === 1) {
      colIdx.set(c, hits[0]);
      return hits[0];
    }
    if (hits.length > 1) {
      const p = { name: c.name, tables: [...new Set(hits.map((h) => h.qualifier))].join(', ') };
      if (d === 'mysql') throw new SqlError('name', '1052', `ERROR 1052 (23000): Column '${c.name}' in ${where} is ambiguous`, 'ambiguous', friendly.ambiguous(p), c.span);
      throw new SqlError('name', 'ORA-00918', oraMessage('00918'), 'ambiguous', friendly.ambiguous(p), c.span);
    }
    if (d === 'oracle' && c.quoted) {
      const ci = cands.find((s) => s.def.name.toLowerCase() === c.name.toLowerCase());
      if (ci) throw unknownColumn(d, shown, oraIdent, where, c.span, 'quoted-case-oracle', { real: ci.def.name.toUpperCase() });
      throw unknownColumn(d, shown, oraIdent, where, c.span, 'dquote-oracle', { text: c.name });
    }
    const near = nearest(c.name, cands.map((s) => s.def.name));
    throw unknownColumn(d, shown, oraIdent, where, c.span, 'unknown-column', { name: c.name, table: tableName }, near ? didYouMean(near) : undefined);
  };

  /** Chạy một subquery không phụ thuộc vào query bên ngoài. Kết quả được nhớ lại. */
  const runSub = (q: SelectStmt, scalar: boolean): ResultSet => {
    const hit = subCache.get(q);
    if (hit) return hit;
    if (depth > 4) throw unsupported('subquery lồng quá sâu', q.span);
    let result: ResultSet;
    try {
      result = execSelect(q, db, d, sql, env, depth + 1).result;
    } catch (err) {
      if (err instanceof SqlError && (err.hint === 'unknown-column' || err.hint === 'unknown-qualifier')) {
        const parts = src(err.span).split('.');
        const name = parts[parts.length - 1].toLowerCase();
        if (scope.some((s) => s.def.name.toLowerCase() === name)) throw unsupported('subquery có nhắc tới table của query bên ngoài', err.span);
      }
      throw err;
    }
    if (result.columns.length !== 1) {
      if (d === 'mysql') throw new SqlError('runtime', '1241', 'ERROR 1241 (21000): Operand should contain 1 column(s)', 'sub-one-column', friendly['sub-one-column']({}), q.span);
      throw new SqlError('runtime', 'ORA-00913', oraMessage('00913'), 'sub-one-column', friendly['sub-one-column']({}), q.span);
    }
    if (scalar && result.rows.length > 1) {
      if (d === 'mysql') throw new SqlError('runtime', '1242', 'ERROR 1242 (21000): Subquery returns more than 1 row', 'sub-one-row', friendly['sub-one-row']({ n: result.rows.length }), q.span);
      throw new SqlError('runtime', 'ORA-01427', oraMessage('01427'), 'sub-one-row', friendly['sub-one-row']({ n: result.rows.length }), q.span);
    }
    subCache.set(q, result);
    subs.push({ q, result, scalar });
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
        runSub(e.q, true);
        return;
      case 'insub':
        check(e.e, where, agg);
        runSub(e.q, false);
        return;
      case 'date':
        if (!parseIsoDate(e.v)) throw runtimeError(d, ['1525', 'HY000', `Incorrect DATE value: '${e.v}'`], '01861', e.span, 'date-literal-oracle', { text: e.v });
        return;
      case 'fn': {
        if (AGGREGATES.has(e.name)) {
          if (agg === 'inside') throw unsupported('function gom lồng trong function gom', e.span);
          if (agg === 'no') {
            const p = { name: e.name, where: where === 'where clause' ? 'WHERE' : where === 'on clause' ? 'ON' : 'chỗ này' };
            if (d === 'mysql') throw new SqlError('syntax', '1111', 'ERROR 1111 (HY000): Invalid use of group function', 'agg-not-allowed', friendly['agg-not-allowed'](p), e.span);
            throw new SqlError('syntax', 'ORA-00934', oraMessage('00934'), 'agg-not-allowed', friendly['agg-not-allowed'](p), e.span);
          }
          if ((e.star && e.name !== 'COUNT') || (!e.star && e.args.length !== 1)) {
            throw runtimeError(d, ['1064', '42000', 'You have an error in your SQL syntax'], '00909', e.span, 'arg-count', { name: e.name, need: '1', got: e.star ? '*' : e.args.length });
          }
          e.args.forEach((x) => check(x, where, 'inside'));
          return;
        }
        if (e.name === 'EXTRACT') {
          if (!UNITS.has(e.unit ?? '')) throw unsupported(`EXTRACT(${e.unit ?? ''} ...)`, e.span);
          check(e.args[0], where, agg);
          return;
        }
        if (e.name === 'ROWNUM') {
          if (d === 'mysql' || !e.bare) throw unknownColumn(d, 'ROWNUM', '"ROWNUM"', where, e.span, 'rownum-mysql', {});
          return;
        }
        const def = FUNCTIONS[e.name];
        if (!def) throw unknownFunction(d, db.name, e.name, e.nameSpan, 'unknown-function', { name: e.name, dialect: DIALECT_NAME[d] });
        if (def.only && def.only !== d) {
          throw unknownFunction(d, db.name, e.name, e.nameSpan, 'function-other-dialect', { name: e.name, other: DIALECT_NAME[def.only], dialect: DIALECT_NAME[d], use: def.use });
        }
        if (e.bare && !def.bare?.includes(d)) {
          throw unknownColumn(d, e.name, `"${e.name}"`, where, e.span, 'function-other-dialect', { name: e.name, other: 'Oracle', dialect: DIALECT_NAME[d], use: `${e.name}() hoặc NOW()` });
        }
        if (!e.bare && def.bareOnly?.includes(d)) throw syntaxError(d, sql, e.span, '00933', 'no-parens', { name: e.name });
        const max = e.name === 'CONCAT' && d === 'oracle' ? 2 : def.max;
        const min = e.name === 'CONCAT' && d === 'oracle' ? 2 : def.min;
        if (e.args.length < min || e.args.length > max) {
          const hint = e.name === 'CONCAT' && d === 'oracle' ? 'concat-oracle' : 'arg-count';
          const need = min === max ? String(min) : `${min} tới ${max}`;
          throw runtimeError(d, ['1582', '42000', `Incorrect parameter count in the call to native function '${e.name}'`], '00909', e.span, hint, { name: e.name, need, got: e.args.length });
        }
        e.args.forEach((x) => check(x, where, agg));
        return;
      }
      default:
        children(e).forEach((x) => check(x, where, agg));
    }
  };

  const truth = (v: Value, span: Span): boolean | null => {
    if (v === null) return null;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return toNumber(v, d, span) !== 0;
    return true;
  };

  const aggregate = (e: FnExpr, group: Value[][]): Value => {
    if (e.star) return group.length;
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
    switch (e.name) {
      case 'COUNT':
        return vals.length;
      case 'SUM':
      case 'AVG': {
        if (vals.length === 0) return null;
        const sum = vals.reduce<number>((a, v) => a + (toNumber(v, d, e.span) ?? 0), 0);
        return Math.round((e.name === 'SUM' ? sum : sum / vals.length) * 1e10) / 1e10;
      }
      default: {
        if (vals.length === 0) return null;
        return vals.reduce((best, v) => {
          const c = compare(v, best, d, e.span) ?? 0;
          return (e.name === 'MIN' ? c < 0 : c > 0) ? v : best;
        });
      }
    }
  };

  const ev = (e: Expr, cx: Cx): Value => {
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
      case 'col':
        return cx.cells[resolve(e, 'field list').idx];
      case 'sub': {
        const r = runSub(e.q, true);
        return r.rows.length === 0 ? null : r.rows[0][0];
      }
      case 'insub': {
        const v = ev(e.e, cx);
        if (v === null) return null;
        let unknown = false;
        for (const row of runSub(e.q, false).rows) {
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
        if (e.op === '||') return norm((a === null ? '' : toText(a)) + (b === null ? '' : toText(b)), d);
        if (e.op === '+' || e.op === '-' || e.op === '*' || e.op === '/' || e.op === '%') {
          // Oracle: ngày cộng trừ một số là cộng trừ số ngày, ngày trừ ngày ra số ngày.
          if (d === 'oracle' && (e.op === '+' || e.op === '-') && (isDate(a) || isDate(b))) {
            if (a === null || b === null) return null;
            if (isDate(a) && isDate(b)) return e.op === '-' ? Math.round(diffDays(a, b) * 1e6) / 1e6 : null;
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
        if (AGGREGATES.has(e.name)) return aggregate(e, cx.group ?? []);
        if (e.name === 'ROWNUM') return cx.rownum ?? 1;
        if (e.name === 'EXTRACT') return extract(e.unit ?? '', ev(e.args[0], cx), d, e.span);
        return norm(FUNCTIONS[e.name].run(e.args.map((a) => ev(a, cx)), d, e.span, env), d);
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
        const found = e.t === 'in' ? e.list.some((x) => compare(v, ev(x, cx), d, e.span) === 0) : runSub(e.q, false).rows.some((r) => compare(v, r[0], d, e.span) === 0);
        return found ? reason.inList(side(e.e, v)) : reason.notInList(side(e.e, v));
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
        return resolve(a, 'field list').idx === resolve(b, 'field list').idx;
      } catch {
        return false;
      }
    }
    return a.t === b.t && flat(a) === flat(b);
  };

  return { resolve, check, ev, truth, why, same, subs, focus: () => [...new Set([...colIdx.values()].map((c) => `c${c.idx}`))] };
}

const traceCols = (scope: ScopeCol[], d: Dialect): TraceCol[] =>
  scope.map((c) => ({ key: `c${c.idx}`, header: d === 'oracle' ? c.def.name.toUpperCase() : c.def.name, label: c.def.label, type: c.def.type }));

interface Unit {
  id: number;
  cx: Cx;
}

export function execSelect(stmt: SelectStmt, db: Database, d: Dialect, sql: string, env: FnEnv = DEFAULT_ENV, depth = 0): Trace {
  const steps: TraceStep[] = [];
  const src = (s: Span) => sql.slice(s.s, s.e);

  /* ---------- FROM và JOIN ---------- */
  let scope: ScopeCol[] = [];
  let rows: { id: number; cells: Value[] }[] = [{ id: 0, cells: [] }];
  let tableName: string | undefined;

  if (stmt.from) {
    const base = findTable(db, stmt.from, d);
    tableName = stmt.joins.length === 0 ? base.name : undefined;
    scope = scopeOf(base, stmt.from);
    rows = loadRows(base, d).map((cells, id) => ({ id, cells }));
    if (base !== DUAL) steps.push({ kind: 'from', table: base.name, alias: stmt.from.alias, columns: traceCols(scope, d), rows: rows.map((r) => ({ id: r.id, cells: r.cells })) });

    stmt.joins.forEach((j, n) => {
      const right = findTable(db, j.ref, d);
      const rightScope = scopeOf(right, j.ref, scope.length);
      const dup = scope.find((s) => s.qualifier.toLowerCase() === rightScope[0].qualifier.toLowerCase());
      if (dup) {
        const p = { name: rightScope[0].qualifier };
        if (d === 'mysql') throw new SqlError('name', '1066', `ERROR 1066 (42000): Not unique table/alias: '${p.name}'`, 'alias-twice', friendly['alias-twice'](p), j.ref.span);
        throw new SqlError('name', 'ORA-00918', oraMessage('00918'), 'alias-twice', friendly['alias-twice'](p), j.ref.span);
      }
      const joined = [...scope, ...rightScope];
      const J = makeEvaluator(joined, db, d, sql, env, undefined, depth);
      if (j.on) {
        if (d === 'oracle' && !isCond(j.on)) throw syntaxError(d, sql, j.on.span, '00920', 'need-condition');
        J.check(j.on, 'on clause', 'no');
      }
      const rightRows = loadRows(right, d);
      if (rows.length * rightRows.length > 250000) throw unsupported('cách ghép hai table lớn mà không có điều kiện ON', j.span);
      const out: typeof rows = [];
      const links: { id: number; left: number; right: number | null }[] = [];
      let seq = (n + 1) * 100000;
      for (const L of rows) {
        let matched = false;
        rightRows.forEach((R, ri) => {
          const cells = [...L.cells, ...R];
          if (!j.on || J.truth(J.ev(j.on, { cells }), j.on.span) === true) {
            matched = true;
            out.push({ id: seq, cells });
            links.push({ id: seq++, left: L.id, right: ri });
          }
        });
        if (!matched && j.kind === 'left') {
          out.push({ id: seq, cells: [...L.cells, ...right.columns.map(() => null)] });
          links.push({ id: seq++, left: L.id, right: null });
        }
      }
      steps.push({
        kind: 'join',
        joinKind: j.kind,
        table: right.name,
        alias: j.ref.alias,
        on: j.on ? src(j.on.span).replace(/\s+/g, ' ') : undefined,
        rightColumns: traceCols(rightScope, d),
        rightRows: rightRows.map((cells, id) => ({ id, cells })),
        columns: traceCols(joined, d),
        rows: out.map((r) => ({ id: r.id, cells: r.cells })),
        links,
      });
      scope = joined;
      rows = out;
    });
  }

  const E = makeEvaluator(scope, db, d, sql, env, tableName, depth);

  /* ---------- kiểm trước khi chạy ---------- */
  const keyExprs = stmt.groupBy ?? [];
  const grouped = stmt.groupBy !== undefined || stmt.having !== undefined || stmt.items.some((it) => it.e && hasAgg(it.e)) || (stmt.orderBy ?? []).some((o) => hasAgg(o.e));

  for (const it of stmt.items) {
    if (it.e) {
      if (d === 'oracle' && isCond(it.e)) throw syntaxError(d, sql, it.e.span, '00923', 'condition-in-select');
      E.check(it.e, 'field list', grouped ? 'yes' : 'no');
    } else if (it.starTable && !scope.some((s) => s.qualifier.toLowerCase() === it.starTable!.toLowerCase())) {
      throw unknownColumn(d, `${it.starTable}.*`, `"${it.starTable.toUpperCase()}"`, 'field list', it.span, 'unknown-qualifier', { name: it.starTable });
    }
  }
  if (stmt.where) {
    if (d === 'oracle' && !isCond(stmt.where)) throw syntaxError(d, sql, stmt.where.span, '00920', 'need-condition');
    E.check(stmt.where, 'where clause', 'no');
  }
  keyExprs.forEach((k) => E.check(k, 'group statement', 'no'));
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
      if (groupedTables.has(c.qualifier)) return;
      const hint = stmt.groupBy ? 'not-grouped' : 'agg-with-column';
      const p = { name: e.name };
      const full = `${db.name}.${c.table}.${c.def.name}`;
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
    stmt.items.forEach((it, i) => {
      if (it.e) mustBeGrouped(it.e, 'field list', i + 1, 'SELECT list');
      else {
        const first = scope.find((s) => !groupedTables.has(s.qualifier) && !keyExprs.some((k) => k.t === 'col' && E.resolve(k, 'group statement').idx === s.idx));
        if (first) mustBeGrouped({ t: 'col', name: first.def.name, table: first.qualifier, span: it.span }, 'field list', i + 1, 'SELECT list');
      }
    });
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
  if (stmt.where) {
    const w = stmt.where;
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
    keyExprs.forEach((k, i) => {
      const c = k.t === 'col' ? E.resolve(k, 'group statement') : null;
      groupCols.push({ key: `g${i}`, header: c ? (d === 'oracle' ? c.def.name.toUpperCase() : c.def.name) : src(k.span), label: c?.def.label, type: c ? c.def.type : 'expr' });
    });
    aggs.forEach((a, i) => groupCols.push({ key: `a${i}`, header: d === 'oracle' ? oracleHeader(src(a.span)) : src(a.span), type: 'expr' }));

    let gi = 0;
    const traceGroups = [...groups.values()].map((g) => {
      const cells = g.rows[0]?.cells ?? blank;
      const cx: Cx = { cells, group: g.rows.map((r) => r.cells) };
      const keyValues = keyExprs.map((e) => E.ev(e, cx));
      const aggValues = aggs.map((a) => E.ev(a, cx));
      const id = 900000 + gi++;
      return { id, rowIds: g.rows.map((r) => r.id), keyValues, aggValues, cx };
    });
    units = traceGroups.map((g) => ({ id: g.id, cx: g.cx }));
    steps.push({
      kind: 'group',
      implicit: !stmt.groupBy,
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

  /* ---------- SELECT ---------- */
  const outCols: TraceCol[] = [];
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
      for (const c of scope) {
        if (it.starTable && c.qualifier.toLowerCase() !== it.starTable.toLowerCase()) continue;
        const gk = grouped ? keyExprs.findIndex((k) => k.t === 'col' && E.resolve(k, 'group statement').idx === c.idx) : -1;
        outCols.push({ key: uniq(gk >= 0 ? `g${gk}` : `c${c.idx}`), header: d === 'oracle' ? c.def.name.toUpperCase() : c.def.name, label: c.def.label, type: c.def.type });
        getters.push((cx) => cx.cells[c.idx]);
        aliases.push(undefined);
      }
      continue;
    }
    const e = it.e;
    const alias = it.alias === undefined ? undefined : d === 'oracle' && !it.aliasQuoted ? it.alias.toUpperCase() : it.alias;
    const text = src(e.span);
    const gk = grouped ? keyExprs.findIndex((k) => E.same(k, e)) : -1;
    const ak = grouped ? aggs.findIndex((a) => E.same(a, e)) : -1;
    if (e.t === 'col') {
      const c = E.resolve(e, 'field list');
      const header = alias ?? (d === 'oracle' ? (e.quoted ? e.name : e.name.toUpperCase()) : e.name);
      outCols.push({ key: uniq(gk >= 0 ? `g${gk}` : `c${c.idx}`), header, label: alias ? undefined : c.def.label, type: c.def.type });
      getters.push((cx) => cx.cells[c.idx]);
    } else {
      const key = uniq(gk >= 0 ? `g${gk}` : ak >= 0 ? `a${ak}` : `x${xn++}`);
      outCols.push({ key, header: alias ?? (d === 'oracle' ? oracleHeader(text) : text), type: 'expr' });
      if (key.startsWith('x')) computed.push(key);
      getters.push((cx) => {
        const v = E.ev(e, cx);
        return typeof v === 'boolean' ? (v ? 1 : 0) : v;
      });
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
  const before = grouped ? groupCols.map((c) => c.key) : scope.map((c) => `c${c.idx}`);
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
      const want = gk >= 0 ? `g${gk}` : ak >= 0 ? `a${ak}` : e.t === 'col' ? `c${E.resolve(e, 'order clause').idx}` : undefined;
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

  return { dialect: d, sql, clauses, focus: E.focus(), steps, result };
}
