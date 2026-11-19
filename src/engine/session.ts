import type { ColumnDef, Database, Dialect, RawValue, TableDef, Value } from './types';
import type { CreateTableStmt, DeleteStmt, Expr, InsertStmt, SelectStmt, UpdateStmt } from './ast';
import { type Span, SqlError, oraMessage, syntaxError, unknownColumn, unsupported } from './errors';
import { type Cx, DEFAULT_ENV, type Evaluator, execSelect, findTable, isCond, loadRows, makeEvaluator, scopeOf } from './executor';
import type { FnEnv } from './functions';
import { friendly } from './messages.vi';
import { parse } from './parser';
import type { ResultSet, Trace, TraceCol, TraceRow } from './trace';
import { isDate, keyOf, parseIsoDate, showQuoted, toText } from './values';

/** Kết quả của một lệnh sửa dữ liệu, đủ để diễn lại từng row. */
export interface DmlTrace {
  op: 'insert' | 'update' | 'delete';
  dialect: Dialect;
  sql: string;
  table: string;
  columns: TraceCol[];
  /** Các row của table trước khi chạy. `id` là vị trí của row lúc đó. */
  before: TraceRow[];
  /** Các row sau khi chạy. Row còn lại giữ `id` cũ, row mới thêm có `id` nối tiếp. */
  after: TraceRow[];
  /** id của các row bị đổi, bị xóa hoặc mới thêm. */
  touched: number[];
  /** Tên các column bị SET (chỉ với UPDATE). */
  changed: string[];
  /** UPDATE hoặc DELETE không có WHERE: mọi row đều bị đụng tới. */
  noWhere: boolean;
  /** Điều kiện WHERE, nguyên văn. */
  where?: string;
  /** true nếu thay đổi còn chờ COMMIT. false nếu đã lưu hẳn. */
  pending: boolean;
}

export type RunResult =
  | { ok: true; kind: 'select'; result: ResultSet; trace: Trace }
  | { ok: true; kind: 'dml'; dml: DmlTrace }
  /** `changes` là số lệnh sửa dữ liệu vừa được lưu (commit) hoặc vừa bị bỏ (rollback). */
  | { ok: true; kind: 'tx'; op: 'commit' | 'rollback' | 'begin'; changes: number }
  | { ok: true; kind: 'ddl'; table: string; columns: { name: string; typeName: string }[] }
  | { ok: false; error: SqlError };

export interface Session {
  readonly dialect: Dialect;
  /** Database đang làm việc, gồm cả thay đổi chưa COMMIT. */
  db(): Database;
  run(sql: string): RunResult;
  /** Số lệnh sửa dữ liệu đang chờ COMMIT. */
  pending(): number;
  /** Bỏ mọi thay đổi, quay về dữ liệu gốc. */
  reset(): void;
}

const clone = (db: Database): Database => ({ name: db.name, tables: db.tables.map((t) => ({ ...t, rows: t.rows.map((r) => [...r]) })) });

const TYPE_NAME: Record<Dialect, Record<ColumnDef['type'], string>> = {
  mysql: { int: 'INT', decimal: 'DECIMAL', text: 'VARCHAR', date: 'DATE', datetime: 'DATETIME' },
  oracle: { int: 'NUMBER', decimal: 'NUMBER', text: 'VARCHAR2', date: 'DATE', datetime: 'DATE' },
};

export function createSession(source: Database, dialect: Dialect, env: FnEnv = DEFAULT_ENV): Session {
  const d = dialect;
  let committed = clone(source);
  let working = clone(source);
  let pending = 0;
  let inTx = false;

  const fail = (code: [string, string], msg: [string, string], hint: string, p: Record<string, string | number | undefined>, span: Span): SqlError =>
    d === 'mysql'
      ? new SqlError('runtime', code[0], `ERROR ${code[0]} ${msg[0]}`, hint, friendly[hint](p), span)
      : new SqlError('runtime', `ORA-${code[1]}`, msg[1] || oraMessage(code[1]), hint, friendly[hint](p), span);

  const traceCols = (t: TableDef): TraceCol[] => t.columns.map((c, i) => ({ key: `c${i}`, header: d === 'oracle' ? c.name.toUpperCase() : c.name, label: c.label, type: c.type }));
  const upper = (s: string) => s.toUpperCase();
  const qual = (t: TableDef, c: ColumnDef) => `"${upper(working.name)}"."${upper(t.name)}"."${upper(c.name)}"`;

  /** Đổi một giá trị đã tính thành giá trị cất trong table, đúng data type của column. */
  const store = (v: Value, c: ColumnDef, span: Span): RawValue => {
    if (v === null) return null;
    const bad = () => fail(['1366', '01722'], [`(HY000): Incorrect ${c.type === 'int' ? 'integer' : 'decimal'} value: '${toText(v)}' for column '${c.name}' at row 1`, ''], 'bad-value', { column: c.name, type: TYPE_NAME[d][c.type], value: showQuoted(v) }, span);
    switch (c.type) {
      case 'int':
      case 'decimal': {
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (typeof v === 'number') return c.type === 'int' && d === 'mysql' ? Math.round(v) : v;
        if (typeof v === 'string' && /^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(v)) return Number(v);
        throw bad();
      }
      case 'text':
        return isDate(v) ? v.iso : toText(v);
      default: {
        let date = isDate(v) ? v : null;
        if (!date && typeof v === 'string' && d === 'mysql') date = parseIsoDate(v);
        if (!date) {
          throw fail(['1292', '01861'], [`(22007): Incorrect ${c.type} value: '${toText(v)}' for column '${c.name}' at row 1`, ''], d === 'oracle' ? 'date-literal-oracle' : 'bad-value', { column: c.name, type: TYPE_NAME[d][c.type], value: showQuoted(v), text: toText(v) }, span);
        }
        if (c.type === 'date' && (d === 'mysql' || date.iso.endsWith(' 00:00:00'))) return date.iso.slice(0, 10);
        return c.type === 'datetime' && date.iso.length === 10 ? `${date.iso} 00:00:00` : date.iso;
      }
    }
  };

  const key = (v: RawValue) => keyOf(v as Value, d);

  /** Kiểm mọi luật của table cho các row vừa thêm hoặc vừa đổi. `rows` là table sau khi sửa. */
  const validate = (t: TableDef, rows: RawValue[][], targets: number[], span: Span, updating: boolean) => {
    const pkCols = t.columns.map((c, i) => (c.pk ? i : -1)).filter((i) => i >= 0);
    const checks = t.checks ?? [];
    const evalCheck = checks.map((text) => {
      const sqlC = `SELECT 1 FROM DUAL WHERE ${text}`;
      const st = parse(sqlC, d) as SelectStmt;
      const E = makeEvaluator(scopeOf(t, { table: t.name, span }), working, d, sqlC, env, t.name);
      return { text, where: st.where!, E };
    });
    const loaded = loadRows({ ...t, rows }, d);
    for (const i of targets) {
      const row = rows[i];
      t.columns.forEach((c, ci) => {
        if (row[ci] === null && (c.notNull || c.pk)) {
          throw fail(['1048', updating ? '01407' : '01400'], [`(23000): Column '${c.name}' cannot be null`, `ORA-${updating ? '01407: cannot update' : '01400: cannot insert NULL into'} (${qual(t, c)})${updating ? ' to NULL' : ''}`], 'not-null', { column: c.name }, span);
        }
      });
      const dupOn = (cols: number[], name: string) => {
        if (cols.some((ci) => row[ci] === null)) return;
        const k = cols.map((ci) => key(row[ci])).join('|');
        const other = rows.findIndex((r, j) => j !== i && cols.map((ci) => key(r[ci])).join('|') === k);
        if (other >= 0) {
          const value = cols.map((ci) => toText(row[ci] as Value)).join('-');
          throw fail(['1062', '00001'], [`(23000): Duplicate entry '${value}' for key '${t.name}.${name}'`, `ORA-00001: unique constraint (${upper(working.name)}.${upper(t.name)}_${name === 'PRIMARY' ? 'PK' : 'UK'}) violated`], 'dup-key', { column: cols.map((ci) => t.columns[ci].name).join(', '), value }, span);
        }
      };
      if (pkCols.length > 0) dupOn(pkCols, 'PRIMARY');
      t.columns.forEach((c, ci) => c.unique && dupOn([ci], c.name));
      for (const c of evalCheck) {
        if (c.E.truth(c.E.ev(c.where, { cells: loaded[i] }), c.where.span) === false) {
          throw fail(['3819', '02290'], [`(HY000): Check constraint '${t.name}_chk_1' is violated.`, `ORA-02290: check constraint (${upper(working.name)}.${upper(t.name)}_CHK) violated`], 'check-fail', { check: c.text }, span);
        }
      }
      t.columns.forEach((c, ci) => {
        if (!c.fk || row[ci] === null) return;
        const parent = working.tables.find((x) => x.name === c.fk!.table);
        const pi = parent?.columns.findIndex((x) => x.name === c.fk!.column) ?? -1;
        if (!parent || pi < 0) return;
        if (!parent.rows.some((r) => key(r[pi]) === key(row[ci]))) {
          throw fail(
            ['1452', '02291'],
            [`(23000): Cannot add or update a child row: a foreign key constraint fails (\`${working.name}\`.\`${t.name}\`, CONSTRAINT \`${t.name}_fk\` FOREIGN KEY (\`${c.name}\`) REFERENCES \`${parent.name}\` (\`${c.fk.column}\`))`, `ORA-02291: integrity constraint (${upper(working.name)}.${upper(t.name)}_FK) violated - parent key not found`],
            'fk-parent',
            { parent: parent.name, pcolumn: c.fk.column, value: showQuoted(row[ci] as Value) },
            span,
          );
        }
      });
    }
  };

  /** Row đang bị row ở table khác trỏ tới thì không xóa hay đổi mã được. */
  const guardChildren = (t: TableDef, gone: RawValue[][], span: Span) => {
    for (const child of working.tables) {
      child.columns.forEach((c, ci) => {
        if (!c.fk || c.fk.table !== t.name) return;
        const pi = t.columns.findIndex((x) => x.name === c.fk!.column);
        const keys = new Set(gone.map((r) => key(r[pi])));
        const n = child.rows.filter((r) => r[ci] !== null && keys.has(key(r[ci]))).length;
        if (n > 0) {
          throw fail(
            ['1451', '02292'],
            [`(23000): Cannot delete or update a parent row: a foreign key constraint fails (\`${working.name}\`.\`${child.name}\`, CONSTRAINT \`${child.name}_fk\` FOREIGN KEY (\`${c.name}\`) REFERENCES \`${t.name}\` (\`${c.fk.column}\`))`, `ORA-02292: integrity constraint (${upper(working.name)}.${upper(child.name)}_FK) violated - child record found`],
            'fk-child',
            { child: child.name, n },
            span,
          );
        }
      });
    }
  };

  const snapshot = (t: TableDef, rows: RawValue[][], ids: number[]): TraceRow[] => loadRows({ ...t, rows }, d).map((cells, i) => ({ id: ids[i], cells }));

  const finish = (dml: Omit<DmlTrace, 'pending' | 'dialect'>, t: TableDef, rows: RawValue[][]): RunResult => {
    t.rows = rows;
    const autocommit = d === 'mysql' && !inTx;
    if (autocommit) committed = clone(working);
    else pending++;
    return { ok: true, kind: 'dml', dml: { ...dml, dialect: d, pending: !autocommit } };
  };

  const whereOf = (stmt: UpdateStmt | DeleteStmt, t: TableDef, sql: string): { E: Evaluator; test: (cx: Cx) => boolean } => {
    const E = makeEvaluator(scopeOf(t, stmt.table), working, d, sql, env, t.name);
    if (stmt.where) {
      if (d === 'oracle' && !isCond(stmt.where)) throw syntaxError(d, sql, stmt.where.span, '00920', 'need-condition');
      E.check(stmt.where, 'where clause', 'no');
    }
    const w = stmt.where;
    return { E, test: (cx) => !w || E.truth(E.ev(w, cx), w.span) === true };
  };

  const insert = (stmt: InsertStmt, sql: string): RunResult => {
    const t = findTable(working, stmt.table, d);
    const E = makeEvaluator([], working, d, sql, env);
    const target = stmt.columns
      ? stmt.columns.map((c) => {
          const i = t.columns.findIndex((x) => x.name.toLowerCase() === c.name.toLowerCase());
          if (i < 0) throw unknownColumn(d, c.name, `"${upper(c.name)}"`, 'field list', c.span, 'unknown-column', { name: c.name, table: t.name });
          return i;
        })
      : t.columns.map((_c, i) => i);
    const rows = t.rows.map((r) => [...r]);
    const ids = rows.map((_r, i) => i);
    const touched: number[] = [];
    for (const r of stmt.rows) {
      if (r.values.length !== target.length) {
        const more = r.values.length > target.length;
        throw fail(['1136', more ? '00913' : '00947'], [`(21S01): Column count doesn't match value count at row ${touched.length + 1}`, ''], 'value-count', { need: target.length, got: r.values.length }, r.span);
      }
      const row: RawValue[] = t.columns.map(() => null);
      r.values.forEach((e: Expr, k) => {
        E.check(e, 'field list', 'no');
        row[target[k]] = store(E.ev(e, { cells: [] }), t.columns[target[k]], e.span);
      });
      // Column tự tăng: không đưa mã thì database tự sinh mã kế tiếp.
      t.columns.forEach((c, ci) => {
        if (c.identity && row[ci] === null) row[ci] = rows.reduce((max, x) => (typeof x[ci] === 'number' && x[ci] > max ? x[ci] : max), 0) + 1;
      });
      rows.push(row);
      ids.push(rows.length - 1);
      touched.push(rows.length - 1);
      validate(t, rows, [rows.length - 1], r.span, false);
    }
    return finish({ op: 'insert', sql, table: t.name, columns: traceCols(t), before: snapshot(t, t.rows, ids.slice(0, t.rows.length)), after: snapshot(t, rows, ids), touched, changed: [], noWhere: false }, t, rows);
  };

  const update = (stmt: UpdateStmt, sql: string): RunResult => {
    const t = findTable(working, stmt.table, d);
    const { E, test } = whereOf(stmt, t, sql);
    const sets = stmt.sets.map((s) => {
      const i = t.columns.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase());
      if (i < 0) throw unknownColumn(d, s.name, `"${upper(s.name)}"`, 'field list', s.span, 'unknown-column', { name: s.name, table: t.name });
      E.check(s.e, 'field list', 'no');
      return { i, e: s.e };
    });
    const loaded = loadRows(t, d);
    const rows = t.rows.map((r) => [...r]);
    const ids = rows.map((_r, i) => i);
    const touched: number[] = [];
    loaded.forEach((cells, i) => {
      if (!test({ cells, rownum: touched.length + 1 })) return;
      touched.push(i);
      for (const s of sets) rows[i][s.i] = store(E.ev(s.e, { cells }), t.columns[s.i], s.e.span);
    });
    const keyCols = t.columns.map((c, i) => (c.pk ? i : -1)).filter((i) => i >= 0);
    const moved = touched.filter((i) => keyCols.some((k) => key(rows[i][k]) !== key(t.rows[i][k])));
    if (moved.length > 0) guardChildren(t, moved.map((i) => t.rows[i]), stmt.span);
    validate(t, rows, touched, stmt.span, true);
    return finish(
      { op: 'update', sql, table: t.name, columns: traceCols(t), before: snapshot(t, t.rows, ids), after: snapshot(t, rows, ids), touched, changed: sets.map((s) => `c${s.i}`), noWhere: !stmt.where, where: stmt.where ? sql.slice(stmt.where.span.s, stmt.where.span.e) : undefined },
      t,
      rows,
    );
  };

  const del = (stmt: DeleteStmt, sql: string): RunResult => {
    const t = findTable(working, stmt.table, d);
    const { test } = whereOf(stmt, t, sql);
    const loaded = loadRows(t, d);
    const ids = t.rows.map((_r, i) => i);
    const touched: number[] = [];
    loaded.forEach((cells, i) => {
      if (test({ cells, rownum: touched.length + 1 })) touched.push(i);
    });
    guardChildren(t, touched.map((i) => t.rows[i]), stmt.span);
    const gone = new Set(touched);
    const keep = ids.filter((i) => !gone.has(i));
    const rows = keep.map((i) => [...t.rows[i]]);
    return finish(
      { op: 'delete', sql, table: t.name, columns: traceCols(t), before: snapshot(t, t.rows, ids), after: snapshot(t, rows, keep), touched, changed: [], noWhere: !stmt.where, where: stmt.where ? sql.slice(stmt.where.span.s, stmt.where.span.e) : undefined },
      t,
      rows,
    );
  };

  const create = (stmt: CreateTableStmt): RunResult => {
    if (working.tables.some((t) => t.name.toLowerCase() === stmt.name.toLowerCase())) {
      throw fail(['1050', '00955'], [`(42S01): Table '${stmt.name}' already exists`, ''], 'table-exists', { name: stmt.name }, stmt.nameSpan);
    }
    for (const c of stmt.columns) {
      if (c.fk) findTable(working, { table: c.fk.table, span: c.span }, d);
    }
    const table: TableDef = {
      name: stmt.name,
      columns: stmt.columns.map((c) => ({ name: c.name, type: c.type, pk: c.pk, notNull: c.notNull, unique: c.unique, fk: c.fk, identity: c.identity })),
      checks: [...stmt.columns.flatMap((c) => (c.check ? [c.check] : [])), ...stmt.checks],
      rows: [],
    };
    working.tables.push(table);
    // CREATE TABLE tự lưu ở cả hai DBMS, kéo theo mọi thay đổi đang chờ.
    committed = clone(working);
    pending = 0;
    inTx = false;
    return { ok: true, kind: 'ddl', table: stmt.name, columns: stmt.columns.map((c) => ({ name: c.name, typeName: c.typeName })) };
  };

  const run = (sql: string): RunResult => {
    try {
      const stmt = parse(sql, d);
      switch (stmt.t) {
        case 'select': {
          const trace = execSelect(stmt, working, d, sql, env);
          return { ok: true, kind: 'select', result: trace.result, trace };
        }
        case 'insert':
          return insert(stmt, sql);
        case 'update':
          return update(stmt, sql);
        case 'delete':
          return del(stmt, sql);
        case 'create':
          return create(stmt);
        case 'begin':
          inTx = true;
          return { ok: true, kind: 'tx', op: 'begin', changes: 0 };
        case 'commit': {
          const changes = pending;
          committed = clone(working);
          pending = 0;
          inTx = false;
          return { ok: true, kind: 'tx', op: 'commit', changes };
        }
        case 'rollback': {
          const changes = pending;
          working = clone(committed);
          pending = 0;
          inTx = false;
          return { ok: true, kind: 'tx', op: 'rollback', changes };
        }
      }
    } catch (e) {
      if (e instanceof SqlError) return { ok: false, error: e };
      const err = unsupported('', { s: 0, e: sql.length });
      err.hint = 'internal';
      err.friendly = friendly.internal({});
      return { ok: false, error: err };
    }
  };

  return {
    dialect: d,
    db: () => working,
    run,
    pending: () => pending,
    reset: () => {
      committed = clone(source);
      working = clone(source);
      pending = 0;
      inTx = false;
    },
  };
}
