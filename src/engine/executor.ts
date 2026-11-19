import type { ColumnDef, Database, Dialect, RawValue, TableDef, Value } from './types';
import { type Expr, RUN_ORDER, type SelectStmt } from './ast';
import {
  type MysqlWhere,
  type Span,
  SqlError,
  nearest,
  runtimeError,
  syntaxError,
  unknownColumn,
  unknownFunction,
  unknownTable,
} from './errors';
import { FUNCTIONS } from './functions';
import { didYouMean, friendly, reason } from './messages.vi';
import type { ResultSet, Trace, TraceCol, TraceRow, TraceStep } from './trace';
import { arith, compare, keyOf, like, norm, parseIsoDate, show, showQuoted, toNumber, toText } from './values';

type ColExpr = Extract<Expr, { t: 'col' }>;

interface ScopeCol {
  /** Tên đứng trước dấu chấm: alias nếu có, không thì tên table. */
  qualifier: string;
  table: string;
  def: ColumnDef;
  idx: number;
}

const DUAL: TableDef = { name: 'DUAL', columns: [{ name: 'DUMMY', type: 'text' }], rows: [['X']] };

const DIALECT_NAME = { mysql: 'MySQL', oracle: 'Oracle' } as const;

const CONDITION = new Set(['=', '<>', '<', '<=', '>', '>=', 'AND', 'OR']);
const isCond = (e: Expr): boolean =>
  (e.t === 'bin' && CONDITION.has(e.op)) || (e.t === 'unary' && e.op === 'NOT') || e.t === 'isnull' || e.t === 'in' || e.t === 'between' || e.t === 'like';

function load(v: RawValue, type: ColumnDef['type'], d: Dialect): Value {
  if (typeof v === 'string' && (type === 'date' || type === 'datetime')) return parseIsoDate(v) ?? v;
  return norm(v, d);
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

export function execSelect(stmt: SelectStmt, db: Database, d: Dialect, sql: string): Trace {
  const steps: TraceStep[] = [];
  const src = (s: Span) => sql.slice(s.s, s.e);

  /* ---------- FROM ---------- */
  let scope: ScopeCol[] = [];
  let rows: TraceRow[] = [{ id: 0, cells: [] }];
  let tableName: string | undefined;

  if (stmt.from) {
    const f = stmt.from;
    const isDual = f.table.toUpperCase() === 'DUAL';
    const table = isDual
      ? DUAL
      : db.tables.find((t) => (d === 'oracle' && f.quoted ? t.name.toUpperCase() === f.table : t.name.toLowerCase() === f.table.toLowerCase()));
    if (!table) {
      const near = nearest(f.table, db.tables.map((t) => t.name));
      throw unknownTable(d, db.name, f.table, f.span, near ? didYouMean(near) : undefined);
    }
    tableName = table.name;
    scope = table.columns.map((def, idx) => ({ qualifier: f.alias ?? table.name, table: table.name, def, idx }));
    rows = table.rows.map((r, id) => ({ id, cells: r.map((v, i) => load(v, table.columns[i].type, d)) }));
    if (!isDual) {
      steps.push({
        kind: 'from',
        table: table.name,
        alias: f.alias,
        columns: scope.map((c) => ({ key: `c${c.idx}`, header: d === 'oracle' ? c.def.name.toUpperCase() : c.def.name, label: c.def.label, type: c.def.type })),
        rows,
      });
    }
  }
  const sourceById = new Map(rows.map((r) => [r.id, r.cells]));

  /* ---------- tìm column ---------- */
  const colIdx = new Map<ColExpr, ScopeCol>();

  const resolve = (c: ColExpr, where: MysqlWhere): ScopeCol => {
    const hit0 = colIdx.get(c);
    if (hit0) return hit0;
    const shown = c.table ? `${c.table}.${c.name}` : c.name;
    const oraIdent = (c.table ? `"${c.table.toUpperCase()}".` : '') + `"${c.quoted ? c.name : c.name.toUpperCase()}"`;
    let cands = scope;
    if (c.table) {
      cands = scope.filter((s) => s.qualifier.toLowerCase() === c.table!.toLowerCase());
      if (cands.length === 0) {
        throw unknownColumn(d, shown, oraIdent, where, c.span, 'unknown-qualifier', { name: c.table });
      }
    }
    const exact = d === 'oracle' && c.quoted;
    const hit = cands.find((s) => (exact ? s.def.name.toUpperCase() === c.name : s.def.name.toLowerCase() === c.name.toLowerCase()));
    if (hit) {
      colIdx.set(c, hit);
      return hit;
    }
    if (exact) {
      const ci = cands.find((s) => s.def.name.toLowerCase() === c.name.toLowerCase());
      if (ci) throw unknownColumn(d, shown, oraIdent, where, c.span, 'quoted-case-oracle', { real: ci.def.name.toUpperCase() });
      throw unknownColumn(d, shown, oraIdent, where, c.span, 'dquote-oracle', { text: c.name });
    }
    const near = nearest(c.name, cands.map((s) => s.def.name));
    throw unknownColumn(d, shown, oraIdent, where, c.span, 'unknown-column', { name: c.name, table: tableName }, near ? didYouMean(near) : undefined);
  };

  /** Kiểm tên column, function và luật riêng của Oracle trước khi chạy. */
  const check = (e: Expr, where: MysqlWhere): void => {
    switch (e.t) {
      case 'col':
        resolve(e, where);
        return;
      case 'unary':
        if (e.op === 'NOT' && d === 'oracle' && !isCond(e.e)) throw syntaxError(d, sql, e.e.span, '00920', 'need-condition');
        check(e.e, where);
        return;
      case 'bin':
        if ((e.op === 'AND' || e.op === 'OR') && d === 'oracle') {
          for (const side of [e.l, e.r]) if (!isCond(side)) throw syntaxError(d, sql, side.span, '00920', 'need-condition');
        }
        check(e.l, where);
        check(e.r, where);
        return;
      case 'isnull':
        check(e.e, where);
        return;
      case 'in':
        check(e.e, where);
        e.list.forEach((x) => check(x, where));
        return;
      case 'between':
        check(e.e, where);
        check(e.lo, where);
        check(e.hi, where);
        return;
      case 'like':
        check(e.e, where);
        check(e.pat, where);
        return;
      case 'fn': {
        const def = FUNCTIONS[e.name];
        if (!def) throw unknownFunction(d, db.name, e.name, e.nameSpan, 'unknown-function', { name: e.name, dialect: DIALECT_NAME[d] });
        if (def.only && def.only !== d) {
          throw unknownFunction(d, db.name, e.name, e.nameSpan, 'function-other-dialect', {
            name: e.name,
            other: DIALECT_NAME[def.only],
            dialect: DIALECT_NAME[d],
            use: def.use,
          });
        }
        const max = e.name === 'CONCAT' && d === 'oracle' ? 2 : def.max;
        const min = e.name === 'CONCAT' && d === 'oracle' ? 2 : def.min;
        if (e.args.length < min || e.args.length > max) {
          const hint = e.name === 'CONCAT' && d === 'oracle' ? 'concat-oracle' : 'arg-count';
          const need = min === max ? String(min) : `${min} tới ${max}`;
          throw runtimeError(d, ['1582', '42000', `Incorrect parameter count in the call to native function '${e.name}'`], '00909', e.span, hint, {
            name: e.name,
            need,
            got: e.args.length,
          });
        }
        e.args.forEach((x) => check(x, where));
        return;
      }
      case 'case':
        if (e.operand) check(e.operand, where);
        for (const w of e.whens) {
          check(w.when, where);
          check(w.then, where);
        }
        if (e.else) check(e.else, where);
        return;
      case 'date':
        if (!parseIsoDate(e.v)) throw runtimeError(d, ['1525', 'HY000', `Incorrect DATE value: '${e.v}'`], '01861', e.span, 'date-literal-oracle', { text: e.v });
        return;
      default:
        return;
    }
  };

  /* ---------- tính giá trị ---------- */
  const truth = (v: Value, span: Span): boolean | null => {
    if (v === null) return null;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return toNumber(v, d, span) !== 0;
    return true;
  };

  const ev = (e: Expr, row: Value[]): Value => {
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
        return row[resolve(e, 'field list').idx];
      case 'unary': {
        if (e.op === 'NOT') {
          const t = truth(ev(e.e, row), e.e.span);
          return t === null ? null : !t;
        }
        const n = toNumber(ev(e.e, row), d, e.span);
        return n === null ? null : e.op === '-' ? -n : n;
      }
      case 'bin': {
        if (e.op === 'AND' || e.op === 'OR') {
          const l = truth(ev(e.l, row), e.l.span);
          const stop = e.op === 'OR';
          if (l === stop) return stop;
          const r = truth(ev(e.r, row), e.r.span);
          if (r === stop) return stop;
          return l === null || r === null ? null : !stop;
        }
        const a = ev(e.l, row);
        const b = ev(e.r, row);
        if (e.op === '||') return norm((a === null ? '' : toText(a)) + (b === null ? '' : toText(b)), d);
        if (e.op === '+' || e.op === '-' || e.op === '*' || e.op === '/' || e.op === '%') return arith(e.op, a, b, d, e.span);
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
        const v = ev(e.e, row);
        return e.not ? v !== null : v === null;
      }
      case 'in': {
        const v = ev(e.e, row);
        if (v === null) return null;
        let unknown = false;
        for (const item of e.list) {
          const c = compare(v, ev(item, row), d, e.span);
          if (c === 0) return !e.not;
          if (c === null) unknown = true;
        }
        return unknown ? null : e.not;
      }
      case 'between': {
        const v = ev(e.e, row);
        const lo = compare(v, ev(e.lo, row), d, e.span);
        const hi = compare(v, ev(e.hi, row), d, e.span);
        if (lo === null || hi === null) return null;
        const inside = lo >= 0 && hi <= 0;
        return e.not ? !inside : inside;
      }
      case 'like': {
        const r = like(ev(e.e, row), ev(e.pat, row), d);
        return r === null ? null : e.not ? !r : r;
      }
      case 'fn':
        return norm(FUNCTIONS[e.name].run(e.args.map((a) => ev(a, row)), d, e.span), d);
      case 'case': {
        if (e.operand) {
          const v = ev(e.operand, row);
          for (const w of e.whens) if (compare(v, ev(w.when, row), d, e.span) === 0) return ev(w.then, row);
        } else {
          for (const w of e.whens) if (truth(ev(w.when, row), w.when.span) === true) return ev(w.then, row);
        }
        return e.else ? ev(e.else, row) : null;
      }
    }
  };

  /* ---------- lý do đạt hoặc không đạt ---------- */
  const side = (e: Expr, v: Value): string => {
    if (e.t === 'col') {
      const c = resolve(e, 'where clause');
      return `${c.def.label ?? e.name} ${showQuoted(v)}`;
    }
    return showQuoted(v);
  };
  const nameOf = (e: Expr): string => (e.t === 'col' ? (resolve(e, 'where clause').def.label ?? e.name) : src(e.span));

  const why = (e: Expr, row: Value[]): string => {
    switch (e.t) {
      case 'unary':
        if (e.op === 'NOT') return why(e.e, row);
        break;
      case 'bin': {
        if (e.op === 'AND') {
          if (truth(ev(e.l, row), e.l.span) !== true) return why(e.l, row);
          if (truth(ev(e.r, row), e.r.span) !== true) return why(e.r, row);
          return why(e.l, row);
        }
        if (e.op === 'OR') {
          if (truth(ev(e.l, row), e.l.span) === true) return why(e.l, row);
          if (truth(ev(e.r, row), e.r.span) === true) return why(e.r, row);
          return why(e.l, row) + reason.and + why(e.r, row);
        }
        if (CONDITION.has(e.op)) {
          const a = ev(e.l, row);
          const b = ev(e.r, row);
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
        const v = ev(e.e, row);
        return v === null ? reason.isNull(nameOf(e.e)) : reason.notNull(nameOf(e.e), showQuoted(v));
      }
      case 'in': {
        const v = ev(e.e, row);
        if (v === null) return reason.nullCompare(nameOf(e.e));
        const found = e.list.some((x) => compare(v, ev(x, row), d, e.span) === 0);
        return found ? reason.inList(side(e.e, v)) : reason.notInList(side(e.e, v));
      }
      case 'between': {
        const v = ev(e.e, row);
        if (v === null) return reason.nullCompare(nameOf(e.e));
        const lo = ev(e.lo, row);
        const hi = ev(e.hi, row);
        const inside = (compare(v, lo, d, e.span) ?? -1) >= 0 && (compare(v, hi, d, e.span) ?? 1) <= 0;
        return (inside ? reason.inRange : reason.outRange)(side(e.e, v), show(lo), show(hi));
      }
      case 'like': {
        const v = ev(e.e, row);
        if (v === null) return reason.nullCompare(nameOf(e.e));
        const pat = ev(e.pat, row);
        return (like(v, pat, d) ? reason.like : reason.notLike)(side(e.e, v), showQuoted(pat));
      }
      default:
        break;
    }
    return reason.truthy(src(e.span), showQuoted(ev(e, row)));
  };

  /* ---------- kiểm trước khi chạy ---------- */
  for (const it of stmt.items) {
    if (it.e) {
      if (d === 'oracle' && isCond(it.e)) throw syntaxError(d, sql, it.e.span, '00923', 'condition-in-select');
      check(it.e, 'field list');
    } else if (it.starTable && !scope.some((s) => s.qualifier.toLowerCase() === it.starTable!.toLowerCase())) {
      throw unknownColumn(d, `${it.starTable}.*`, `"${it.starTable.toUpperCase()}"`, 'field list', it.span, 'unknown-qualifier', { name: it.starTable });
    }
  }
  if (stmt.where) {
    if (d === 'oracle' && !isCond(stmt.where)) throw syntaxError(d, sql, stmt.where.span, '00920', 'need-condition');
    check(stmt.where, 'where clause');
  }

  /* ---------- WHERE ---------- */
  if (stmt.where) {
    const w = stmt.where;
    const verdicts = rows.map((r) => {
      const pass = truth(ev(w, r.cells), w.span) === true;
      return { id: r.id, pass, reason: why(w, r.cells) };
    });
    const keep = new Set(verdicts.filter((v) => v.pass).map((v) => v.id));
    rows = rows.filter((r) => keep.has(r.id));
    steps.push({ kind: 'where', verdicts });
  }

  /* ---------- SELECT ---------- */
  const outCols: TraceCol[] = [];
  const getters: ((cells: Value[]) => Value)[] = [];
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
        outCols.push({ key: uniq(`c${c.idx}`), header: d === 'oracle' ? c.def.name.toUpperCase() : c.def.name, label: c.def.label, type: c.def.type });
        getters.push((cells) => cells[c.idx]);
        aliases.push(undefined);
      }
      continue;
    }
    const e = it.e;
    const alias = it.alias === undefined ? undefined : d === 'oracle' && !it.aliasQuoted ? it.alias.toUpperCase() : it.alias;
    if (e.t === 'col') {
      const c = resolve(e, 'field list');
      const header = alias ?? (d === 'oracle' ? (e.quoted ? e.name : e.name.toUpperCase()) : e.name);
      outCols.push({ key: uniq(`c${c.idx}`), header, label: alias ? undefined : c.def.label, type: c.def.type });
      getters.push((cells) => cells[c.idx]);
    } else {
      const key = uniq(`x${xn++}`);
      const text = src(e.span);
      outCols.push({ key, header: alias ?? (d === 'oracle' ? oracleHeader(text) : text), type: 'expr' });
      computed.push(key);
      getters.push((cells) => {
        const v = ev(e, cells);
        return typeof v === 'boolean' ? (v ? 1 : 0) : v;
      });
    }
    aliases.push(alias);
  }
  let outRows: TraceRow[] = rows.map((r) => ({ id: r.id, cells: getters.map((g) => g(r.cells)) }));

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
  steps.push({
    kind: 'select',
    star,
    distinct: stmt.distinct,
    columns: outCols,
    rows: outRows,
    dropped: scope.map((c) => `c${c.idx}`).filter((k) => !keptKeys.has(k)),
    computed,
    duplicates,
  });

  /* ---------- ORDER BY ---------- */
  if (stmt.orderBy) {
    type Key = { get: (r: TraceRow) => Value; desc: boolean; nulls?: 'FIRST' | 'LAST'; text: string; col?: string; span: Span };
    const keys: Key[] = stmt.orderBy.map((o) => {
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
      check(e, 'order clause');
      const visible = e.t === 'col' ? outCols.find((c) => c.key === `c${resolve(e, 'order clause').idx}`)?.key : undefined;
      return { ...base, get: (r) => ev(e, sourceById.get(r.id)!), col: visible };
    });

    const before = outRows.map((r) => r.id);
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
      before,
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

  const focus = [...new Set([...colIdx.values()].map((c) => `c${c.idx}`))];
  return { dialect: d, sql, clauses, focus, steps, result };
}
