import type { Database, Dialect, RawValue, TableDef, Value } from './types';
import type { DeleteStmt, Expr, InsertStmt, MergeStmt, UpdateStmt } from './ast';
import { type Span, SqlError, syntaxError, unknownColumn, unsupported } from './errors';
import { type Cx, DEFAULT_ENV, type Evaluator, checkTargetTable, children, execSelect, findTable, isCond, loadRows, makeEvaluator, resolveRef, scopeOf, viewOf } from './executor';
import type { FnEnv } from './functions';
import { friendly } from './messages.vi';
import { parse } from './parser';
import { type DdlResult, makeDdl } from './ddl';
import { colIndexes, constraintsOf, deepClone, normalize, sameName, upper } from './catalog';
import { makeFail, makeRules } from './rules';
import { mentionsDictionary, toolCommand, withDictionary } from './describe';
import { type SchemaView, schemaView } from './schema-view';
import { splitStatements } from './split';
import type { ResultSet, Trace, TraceCol, TraceRow } from './trace';

/** Kết quả của một lệnh sửa dữ liệu, đủ để diễn lại từng row. */
export interface DmlTrace {
  op: 'insert' | 'update' | 'delete' | 'merge';
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
  /** `tool` có khi đây là lệnh của công cụ SQL (DESC của Oracle), không phải câu SQL. */
  | { ok: true; kind: 'select'; result: ResultSet; trace: Trace; tool?: true }
  | { ok: true; kind: 'dml'; dml: DmlTrace }
  /** `changes` là số lệnh sửa dữ liệu vừa được lưu (commit) hoặc vừa bị bỏ (rollback). */
  | { ok: true; kind: 'tx'; op: 'commit' | 'rollback' | 'begin' | 'savepoint' | 'rollback-to'; changes: number }
  /** CREATE, ALTER, DROP, TRUNCATE, CREATE SEQUENCE, DROP SEQUENCE, CREATE VIEW, DROP VIEW. */
  | DdlResult
  | { ok: false; error: SqlError };

export interface Session {
  readonly dialect: Dialect;
  /**
   * Database đang làm việc, gồm cả thay đổi chưa COMMIT. Toàn JSON thuần: lưu bằng JSON.stringify,
   * nạp lại bằng `createSession(JSON.parse(...), dialect)`. Đối tượng này đổi theo từng lệnh, nên lưu ngay khi cần.
   */
  db(): Database;
  /** Cấu trúc database, cho giao diện vẽ khung. Data type viết theo dialect của session. */
  schema(): SchemaView;
  /** Chạy đúng một lệnh. Hai lệnh trong một lần thì báo lỗi. */
  run(sql: string): RunResult;
  /**
   * Chạy nhiều lệnh ngăn cách bằng dấu ; theo thứ tự, dừng ở lệnh lỗi đầu tiên.
   * `results` có một phần tử cho mỗi lệnh đã chạy, kể cả lệnh lỗi (phần tử cuối). `failedAt` là vị trí của lệnh lỗi.
   * `span` của lỗi tính trong cả đoạn script, không tính trong riêng lệnh đó.
   */
  runScript(sql: string): { results: RunResult[]; failedAt?: number };
  /** Số lệnh sửa dữ liệu đang chờ COMMIT. */
  pending(): number;
  /** Bỏ mọi thay đổi, quay về dữ liệu gốc. */
  reset(): void;
}

/** Bản sao độc lập, kèm luật dựng từ các cờ của table mẫu. */
const fresh = (db: Database, d: Dialect): Database => normalize(deepClone(db), d);

/** ROLLBACK không hoàn lại bộ đếm: AUTO_INCREMENT, identity và sequence vẫn đã đi tới số đó. */
function carryCounters(old: Database, next: Database): void {
  for (const t of next.tables) {
    const o = old.tables.find((x) => x.name === t.name);
    if (o?.autoInc !== undefined && (t.autoInc === undefined || o.autoInc > t.autoInc)) t.autoInc = o.autoInc;
  }
  for (const s of next.sequences ?? []) {
    const o = old.sequences?.find((x) => sameName(x.name, s.name));
    if (o?.last !== undefined) s.last = o.last;
  }
  if (old.sysName !== undefined) next.sysName = Math.max(old.sysName, next.sysName ?? 0);
}

export function createSession(source: Database, dialect: Dialect, env: FnEnv = DEFAULT_ENV): Session {
  const d = dialect;
  let committed = fresh(source, d);
  let working = fresh(source, d);
  let pending = 0;
  let inTx = false;
  /** SAVEPOINT đang có, theo thứ tự đặt. `name` đã hạ chữ thường (cả hai dialect không phân biệt hoa thường). */
  let savepoints: { name: string; db: Database; pending: number }[] = [];

  /** CURRVAL của từng sequence trong phiên này. Không nằm trong Database vì mỗi phiên có giá trị riêng. */
  const currvals = new Map<string, number>();
  /** NEXTVAL chỉ tăng một lần trong mỗi lệnh: gọi hai lần trong cùng lệnh ra cùng số, như Oracle với một row. */
  const stmtNext = new Map<string, number>();

  const fail = makeFail(d);

  const findSeq = (name: string, span: Span) => {
    const s = working.sequences?.find((x) => sameName(x.name, name));
    if (!s) throw fail(['1064', '02289'], ['', ''], 'seq-missing', { name }, span);
    return s;
  };
  const sessEnv: FnEnv = {
    ...env,
    get user() {
      return upper(working.name);
    },
    seq: {
      next(name, span) {
        const s = findSeq(name, span);
        const k = s.name.toLowerCase();
        const hit = stmtNext.get(k);
        if (hit !== undefined) return hit;
        const v = s.last === undefined ? s.start : s.last + s.increment;
        s.last = v;
        stmtNext.set(k, v);
        currvals.set(k, v);
        return v;
      },
      curr(name, span) {
        const s = findSeq(name, span);
        const v = currvals.get(s.name.toLowerCase());
        if (v === undefined) throw fail(['1064', '08002'], ['', `ORA-08002: sequence ${upper(s.name)}.CURRVAL is not yet defined in this session`], 'seq-curr-undefined', { name: upper(s.name) }, span);
        return v;
      },
    },
  };
  const rules = makeRules(d, () => working, sessEnv);
  const ddl = makeDdl({ d, env: sessEnv, rules, get: () => working, set: (db) => (working = db) });

  const traceCols = (t: TableDef): TraceCol[] => t.columns.map((c, i) => ({ key: `c${i}`, header: d === 'oracle' ? c.name.toUpperCase() : c.name, label: c.label, type: c.type }));

  const snapshot = (t: TableDef, rows: RawValue[][], ids: number[]): TraceRow[] => loadRows({ ...t, rows }, d).map((cells, i) => ({ id: ids[i], cells }));

  const finish = (dml: Omit<DmlTrace, 'pending' | 'dialect'>, t: TableDef, rows: RawValue[][]): RunResult => {
    t.rows = rows;
    const autocommit = d === 'mysql' && !inTx;
    if (autocommit) committed = deepClone(working);
    else pending++;
    return { ok: true, kind: 'dml', dml: { ...dml, dialect: d, pending: !autocommit } };
  };

  const whereOf = (stmt: UpdateStmt | DeleteStmt, t: TableDef, sql: string): { E: Evaluator; test: (cx: Cx) => boolean } => {
    const E = makeEvaluator(scopeOf(t, stmt.table), working, d, sql, sessEnv, t.name);
    checkTargetTable([stmt.where], stmt.table, d);
    if (stmt.where) {
      if (d === 'oracle' && !isCond(stmt.where)) throw syntaxError(d, sql, stmt.where.span, '00920', 'need-condition');
      E.check(stmt.where, 'where clause', 'no');
    }
    const w = stmt.where;
    return { E, test: (cx) => !w || E.truth(E.ev(w, cx), w.span) === true };
  };

  /** Số kế tiếp của column tự tăng. Bộ đếm nằm trong table, nên DELETE không làm số lùi lại. */
  const nextId = (t: TableDef, ci: number): number => {
    const next = t.autoInc ?? t.rows.reduce((max, x) => (typeof x[ci] === 'number' && (x[ci] as number) > max ? (x[ci] as number) : max), 0) + 1;
    t.autoInc = next + 1;
    return next;
  };

  /** Đích của INSERT, UPDATE, DELETE, MERGE: table thật. View thì khóa học chưa dạy tới. */
  const targetTable = (ref: InsertStmt['table']): TableDef => {
    if (viewOf(working, ref, d)) throw unsupported('INSERT, UPDATE, DELETE hay MERGE trên view', ref.span);
    return findTable(working, ref, d);
  };

  /** Nguồn của các row mới: VALUES, hoặc kết quả của một câu SELECT, hoặc ô đã tính (MERGE). */
  type Source = { span: Span; values?: Expr[]; cells?: Value[] };

  /** ON DUPLICATE KEY UPDATE: cách tính và ghi các column khi row mới trùng key. */
  interface DupPlan {
    sets: { i: number; e: Expr }[];
    E: Evaluator;
    /** Key của table, để tìm row trùng. */
    keys: number[][];
  }

  /** Thêm row vào `base` (bản sao các row hiện có của table). Trả về các row sau khi thêm, và vị trí các row bị đụng tới. */
  const addRows = (t: TableDef, target: number[], sources: Source[], base: RawValue[][], sql: string, dup?: DupPlan) => {
    const E = makeEvaluator([], working, d, sql, sessEnv);
    const rows = base.map((r) => [...r]);
    const ids = rows.map((_r, i) => i);
    const touched: number[] = [];
    const changedCols = new Set<number>();
    let rowNo = 0;
    for (const r of sources) {
      const width = r.values?.length ?? r.cells!.length;
      if (width !== target.length) {
        const more = width > target.length;
        throw fail(['1136', more ? '00913' : '00947'], [`(21S01): Column count doesn't match value count at row ${rowNo + 1}`, ''], 'value-count', { need: target.length, got: width }, r.span);
      }
      rowNo++;
      const row: RawValue[] = t.columns.map(() => null);
      const given = t.columns.map(() => false);
      target.forEach((ci, k) => {
        const col = t.columns[ci];
        if (r.cells) {
          row[ci] = rules.store(r.cells[k], col, r.span, t, rowNo);
          given[ci] = true;
          return;
        }
        const e = r.values![k];
        // Từ khóa DEFAULT: coi như người học bỏ qua column này.
        if (e.t === 'default') return;
        E.check(e, 'field list', 'no');
        row[ci] = rules.store(E.ev(e, { cells: [] }), col, e.span, t, rowNo);
        given[ci] = true;
      });
      t.columns.forEach((c, ci) => {
        // Column tự tăng: không đưa mã (hoặc đưa NULL) thì database tự sinh mã kế tiếp. MySQL coi số 0 cũng vậy.
        if (c.identity) {
          const v = given[ci] ? row[ci] : null;
          if (d === 'oracle' && given[ci]) {
            // GENERATED ALWAYS: ghi giá trị nào cũng bị từ chối. Mã ORA-32795: tài liệu lỗi của Oracle.
            if (c.identityMode === 'always') throw fail(['0', '32795'], ['', `ORA-32795: cannot insert into a generated always identity column`], 'identity-always', { column: c.name }, r.span);
            // BY DEFAULT: identity ngầm NOT NULL (tài liệu CREATE TABLE), nên NULL tường minh bị từ chối.
            // CHỜ KIỂM TÀI LIỆU: tài liệu không ghi rõ mã lỗi là ORA-01400, mã này suy ra từ NOT NULL ngầm định.
            if (c.identityMode === 'default' && v === null) throw fail(['0', '01400'], ['', `ORA-01400: cannot insert NULL into (${rules.qual(t, c)})`], 'identity-null', { column: c.name }, r.span);
          }
          if (v === null || (d === 'mysql' && v === 0)) row[ci] = nextId(t, ci);
          else if (d === 'mysql' && typeof v === 'number' && t.autoInc !== undefined && v >= t.autoInc) t.autoInc = v + 1;
          return;
        }
        if (given[ci]) return;
        if (c.default !== undefined) row[ci] = rules.defaultOf(t, c, r.span);
        // Table mẫu viết primary key bằng cờ `pk` và không có `notNull`: giữ lỗi 1048 cũ cho chúng.
        else if (d === 'mysql' && c.notNull) throw fail(['1364', '01400'], [`(HY000): Field '${c.name}' doesn't have a default value`, ''], 'no-default', { column: c.name }, r.span);
      });
      // ON DUPLICATE KEY UPDATE: row mới trùng key với một row đang có thì sửa row đó, không thêm row mới.
      if (dup) {
        const hit = rows.findIndex((x) => dup.keys.some((ks) => ks.every((ci) => row[ci] !== null && rules.key(x[ci]) === rules.key(row[ci]))));
        if (hit >= 0) {
          const incoming = loadRows({ ...t, rows: [row] }, d)[0];
          const current = loadRows({ ...t, rows }, d)[hit];
          sessEnv.incoming = { columns: t.columns, cells: incoming };
          try {
            for (const s of dup.sets) {
              rows[hit][s.i] = rules.store(dup.E.ev(s.e, { cells: [...current, ...incoming] }), t.columns[s.i], s.e.span, t, rowNo);
              changedCols.add(s.i);
            }
          } finally {
            sessEnv.incoming = undefined;
          }
          rules.validate(t, rows, [hit], r.span, true);
          if (!touched.includes(hit)) touched.push(hit);
          continue;
        }
      }
      rows.push(row);
      ids.push(rows.length - 1);
      touched.push(rows.length - 1);
      rules.validate(t, rows, [rows.length - 1], r.span, false);
    }
    return { rows, ids, touched, changedCols };
  };

  const insert = (stmt: InsertStmt, sql: string): RunResult => {
    const t = targetTable(stmt.table);
    const target = stmt.columns
      ? stmt.columns.map((c) => {
          const i = t.columns.findIndex((x) => x.name.toLowerCase() === c.name.toLowerCase());
          if (i < 0) throw unknownColumn(d, c.name, `"${upper(c.name)}"`, 'field list', c.span, 'unknown-column', { name: c.name, table: t.name });
          return i;
        })
      : t.columns.map((_c, i) => i);

    let sources: Source[];
    if (stmt.select) {
      const trace = execSelect(stmt.select, working, d, sql, sessEnv);
      const width = trace.result.columns.length;
      if (width !== target.length) {
        const more = width > target.length;
        throw fail(['1136', more ? '00913' : '00947'], [`(21S01): Column count doesn't match value count at row 1`, ''], 'value-count', { need: target.length, got: width }, stmt.select.span);
      }
      sources = trace.result.rows.map((cells) => ({ span: stmt.select!.span, cells }));
    } else sources = stmt.rows.map((r) => ({ span: r.span, values: r.values }));

    let dup: DupPlan | undefined;
    if (stmt.onDup) {
      // Column của table, rồi column của row mới (đứng sau alias, nếu người học đặt alias).
      const scope = scopeOf(t, stmt.table);
      const alias = stmt.onDup.alias;
      const inc = alias ? t.columns.map((def, i) => ({ qualifier: alias, table: t.name, def, idx: scope.length + i })) : [];
      const E = makeEvaluator([...scope, ...inc], working, d, sql, sessEnv, t.name);
      sessEnv.incoming = { columns: t.columns, cells: t.columns.map(() => null) };
      let sets: DupPlan['sets'];
      try {
        sets = stmt.onDup.sets.map((s) => {
          const i = t.columns.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase());
          if (i < 0) throw unknownColumn(d, s.name, `"${upper(s.name)}"`, 'field list', s.span, 'unknown-column', { name: s.name, table: t.name });
          if (s.e.t !== 'default') E.check(s.e, 'field list', 'no');
          return { i, e: s.e };
        });
      } finally {
        sessEnv.incoming = undefined;
      }
      const keys = constraintsOf(t).flatMap((c) => (c.kind === 'pk' || c.kind === 'unique' ? [colIndexes(t, c.columns)] : []));
      dup = { sets, E, keys };
    }

    const { rows, ids, touched, changedCols } = addRows(t, target, sources, t.rows, sql, dup);
    const n = t.rows.length;
    const dml = { op: 'insert' as const, sql, table: t.name, columns: traceCols(t), before: snapshot(t, t.rows, ids.slice(0, n)), after: snapshot(t, rows, ids), touched, changed: [...changedCols].map((i) => `c${i}`), noWhere: false };
    return finish(dml, t, rows);
  };

  /** Row ở table khác đang trỏ tới giá trị cũ của column vừa đổi thì chặn. */
  const guardRefChanges = (t: TableDef, rows: RawValue[][], touched: number[], span: Span) => {
    const refCols = new Set<number>();
    for (const child of working.tables) {
      for (const c of child.constraints ?? []) if (c.kind === 'fk' && sameName(c.refTable, t.name)) colIndexes(t, c.refColumns).forEach((x) => x >= 0 && refCols.add(x));
    }
    const changed = [...refCols].filter((ci) => touched.some((i) => rules.key(rows[i][ci]) !== rules.key(t.rows[i][ci])));
    if (changed.length > 0) {
      const moved = touched.filter((i) => changed.some((ci) => rules.key(rows[i][ci]) !== rules.key(t.rows[i][ci])));
      rules.planDelete(t, moved, span, false, changed);
    }
  };

  /** Oracle MERGE: mỗi row của nguồn hoặc sửa các row khớp ON, hoặc thêm row mới. */
  const merge = (stmt: MergeStmt, sql: string): RunResult => {
    const t = targetTable(stmt.table);
    const src = resolveRef(stmt.using, { db: working, d, sql, env: sessEnv, depth: 0 });
    const tScope = scopeOf(t, stmt.table);
    const sScope = scopeOf(src, stmt.using, tScope.length);
    const E = makeEvaluator([...tScope, ...sScope], working, d, sql, sessEnv, t.name);
    if (!isCond(stmt.on)) throw syntaxError(d, sql, stmt.on.span, '00920', 'need-condition');
    E.check(stmt.on, 'on clause', 'no');

    const sets = (stmt.matched?.sets ?? []).map((s) => {
      const i = t.columns.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase());
      if (i < 0) throw unknownColumn(d, s.name, `"${upper(s.name)}"`, 'field list', s.span, 'unknown-column', { name: s.name, table: t.name });
      if (s.e.t === 'default') throw unsupported('DEFAULT trong MERGE', s.e.span);
      E.check(s.e, 'field list', 'no');
      return { i, e: s.e, span: s.span };
    });
    // Column đã dùng trong ON thì không được sửa (ORA-38104).
    const onCols = new Set<number>();
    const walk = (e: Expr) => {
      if (e.t === 'col') {
        const c = E.resolve(e, 'on clause');
        if (c.idx < tScope.length) onCols.add(c.idx);
      }
      children(e).forEach(walk);
    };
    walk(stmt.on);
    for (const s of sets) {
      if (onCols.has(s.i)) throw new SqlError('runtime', 'ORA-38104', `ORA-38104: Columns referenced in the ON Clause cannot be updated: "${upper(stmt.table.alias ?? t.name)}"."${upper(t.columns[s.i].name)}"`, 'merge-on-column', friendly['merge-on-column']({ column: t.columns[s.i].name }), s.span);
    }

    const nm = stmt.notMatched;
    const ES = makeEvaluator(scopeOf(src, stmt.using, 0), working, d, sql, sessEnv);
    let target: number[] = t.columns.map((_c, i) => i);
    if (nm) {
      if (nm.columns) {
        target = nm.columns.map((c) => {
          const i = t.columns.findIndex((x) => x.name.toLowerCase() === c.name.toLowerCase());
          if (i < 0) throw unknownColumn(d, c.name, `"${upper(c.name)}"`, 'field list', c.span, 'unknown-column', { name: c.name, table: t.name });
          return i;
        });
      }
      for (const v of nm.values) {
        if (v.t === 'default') throw unsupported('DEFAULT trong MERGE', v.span);
        ES.check(v, 'field list', 'no');
      }
    }

    const loaded = loadRows(t, d);
    const srcRows = loadRows(src, d);
    const updates = new Map<number, Value[]>();
    const fresh: Source[] = [];
    for (const sr of srcRows) {
      const hits: number[] = [];
      loaded.forEach((tc, i) => {
        if (E.truth(E.ev(stmt.on, { cells: [...tc, ...sr] }), stmt.on.span) === true) hits.push(i);
      });
      if (hits.length > 0) {
        if (!stmt.matched) continue;
        for (const i of hits) {
          if (updates.has(i)) throw fail(['0', '30926'], ['', 'ORA-30926: unable to get a stable set of rows in the source tables'], 'merge-stable', {}, stmt.using.span);
          updates.set(i, sr);
        }
      } else if (nm) fresh.push({ span: nm.span, cells: nm.values.map((v) => ES.ev(v, { cells: sr })) });
    }

    const rows = t.rows.map((r) => [...r]);
    const touchedUp: number[] = [];
    let n = 0;
    for (const [i, sr] of [...updates].sort((a, b) => a[0] - b[0])) {
      touchedUp.push(i);
      n++;
      for (const s of sets) rows[i][s.i] = rules.store(E.ev(s.e, { cells: [...loaded[i], ...sr] }), t.columns[s.i], s.e.span, t, n);
    }
    if (touchedUp.length > 0) {
      guardRefChanges(t, rows, touchedUp, stmt.span);
      rules.validate(t, rows, touchedUp, stmt.span, true);
    }
    const added = addRows(t, target, fresh, rows, sql);
    const ids = added.rows.map((_r, i) => i);
    const dml = {
      op: 'merge' as const,
      sql,
      table: t.name,
      columns: traceCols(t),
      before: snapshot(t, t.rows, t.rows.map((_r, i) => i)),
      after: snapshot(t, added.rows, ids),
      touched: [...touchedUp, ...added.touched],
      changed: sets.map((s) => `c${s.i}`),
      noWhere: false,
    };
    return finish(dml, t, added.rows);
  };

  const update = (stmt: UpdateStmt, sql: string): RunResult => {
    const t = targetTable(stmt.table);
    const { E, test } = whereOf(stmt, t, sql);
    checkTargetTable(stmt.sets.map((s) => s.e), stmt.table, d);
    const sets = stmt.sets.map((s) => {
      const i = t.columns.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase());
      if (i < 0) throw unknownColumn(d, s.name, `"${upper(s.name)}"`, 'field list', s.span, 'unknown-column', { name: s.name, table: t.name });
      if (s.e.t !== 'default') E.check(s.e, 'field list', 'no');
      return { i, e: s.e };
    });
    const loaded = loadRows(t, d);
    const rows = t.rows.map((r) => [...r]);
    const ids = rows.map((_r, i) => i);
    const touched: number[] = [];
    loaded.forEach((cells, i) => {
      if (!test({ cells, rownum: touched.length + 1 })) return;
      touched.push(i);
      for (const s of sets) {
        const col = t.columns[s.i];
        rows[i][s.i] = s.e.t === 'default' ? rules.defaultOf(t, col, s.e.span) : rules.store(E.ev(s.e, { cells }), col, s.e.span, t, touched.length);
      }
    });
    // Đổi giá trị mà row ở table khác đang trỏ tới thì bị chặn.
    guardRefChanges(t, rows, touched, stmt.span);
    rules.validate(t, rows, touched, stmt.span, true);
    return finish(
      { op: 'update', sql, table: t.name, columns: traceCols(t), before: snapshot(t, t.rows, ids), after: snapshot(t, rows, ids), touched, changed: sets.map((s) => `c${s.i}`), noWhere: !stmt.where, where: stmt.where ? sql.slice(stmt.where.span.s, stmt.where.span.e) : undefined },
      t,
      rows,
    );
  };

  const del = (stmt: DeleteStmt, sql: string): RunResult => {
    const t = targetTable(stmt.table);
    const { test } = whereOf(stmt, t, sql);
    const loaded = loadRows(t, d);
    const ids = t.rows.map((_r, i) => i);
    const hit: number[] = [];
    loaded.forEach((cells, i) => {
      if (test({ cells, rownum: hit.length + 1 })) hit.push(i);
    });
    // ON DELETE CASCADE kéo thêm row ở table khác (và cả table này, nếu foreign key trỏ về chính nó).
    const plan = rules.planDelete(t, hit, stmt.span, true);
    const gone = plan.deletes.get(t.name)!;
    const touched = [...gone].sort((a, b) => a - b);
    const before = snapshot(t, t.rows, ids);
    // ON DELETE SET NULL: đặt NULL theo vị trí cũ, trước khi các row bị xóa làm vị trí đổi.
    for (const [name, m] of plan.nulls) {
      const other = working.tables.find((x) => x.name === name)!;
      for (const [j, cols] of m) cols.forEach((ci) => (other.rows[j][ci] = null));
    }
    const keep = ids.filter((i) => !gone.has(i));
    const rows = keep.map((i) => [...t.rows[i]]);
    for (const [name, set] of plan.deletes) {
      if (name === t.name) continue;
      const other = working.tables.find((x) => x.name === name)!;
      other.rows = other.rows.filter((_r, j) => !set.has(j));
    }
    return finish(
      { op: 'delete', sql, table: t.name, columns: traceCols(t), before, after: snapshot(t, rows, keep), touched, changed: [], noWhere: !stmt.where, where: stmt.where ? sql.slice(stmt.where.span.s, stmt.where.span.e) : undefined },
      t,
      rows,
    );
  };

  /** DDL tự COMMIT trước khi chạy, kể cả khi lệnh đó rồi lỗi. Lỗi cú pháp thì chưa tới bước này. */
  const autoCommit = <T>(fn: () => T): T => {
    committed = deepClone(working);
    pending = 0;
    inTx = false;
    savepoints = [];
    const r = fn();
    committed = deepClone(working);
    return r;
  };

  const run = (sql: string): RunResult => {
    stmtNext.clear();
    try {
      const tool = toolCommand(sql, working, d);
      if (tool) return tool;
      const stmt = parse(sql, d);
      switch (stmt.t) {
        case 'select':
        case 'setop': {
          const from = d === 'oracle' && mentionsDictionary(sql) ? withDictionary(working) : working;
          const trace = execSelect(stmt, from, d, sql, sessEnv);
          return { ok: true, kind: 'select', result: trace.result, trace };
        }
        case 'insert':
          return insert(stmt, sql);
        case 'update':
          return update(stmt, sql);
        case 'delete':
          return del(stmt, sql);
        case 'create':
          return autoCommit(() => ddl.create(stmt, sql));
        case 'createview':
          return autoCommit(() => ddl.createView(stmt, sql));
        case 'dropview':
          return autoCommit(() => ddl.dropView(stmt));
        case 'merge':
          return merge(stmt, sql);
        case 'alter':
          return autoCommit(() => ddl.alter(stmt));
        case 'drop':
          return autoCommit(() => ddl.dropTable(stmt));
        case 'truncate':
          return autoCommit(() => ddl.truncate(stmt));
        case 'createseq':
          return autoCommit(() => ddl.createSequence(stmt));
        case 'dropseq':
          return autoCommit(() => ddl.dropSequence(stmt));
        case 'begin':
          inTx = true;
          savepoints = [];
          return { ok: true, kind: 'tx', op: 'begin', changes: 0 };
        case 'savepoint': {
          const key = stmt.name.toLowerCase();
          // MySQL: ngoài START TRANSACTION, mỗi lệnh tự COMMIT nên savepoint không giữ lại được. Oracle thì giữ tới COMMIT, ROLLBACK hay DDL.
          if (d === 'oracle' || inTx) savepoints = [...savepoints.filter((x) => x.name !== key), { name: key, db: deepClone(working), pending }];
          return { ok: true, kind: 'tx', op: 'savepoint', changes: 0 };
        }
        case 'rollback-to': {
          const key = stmt.name.toLowerCase();
          const at = savepoints.findIndex((x) => x.name === key);
          if (at < 0) {
            if (d === 'mysql') throw new SqlError('name', '1305', `ERROR 1305 (42000): SAVEPOINT ${stmt.name} does not exist`, 'savepoint-missing', friendly['savepoint-missing']({ name: stmt.name }), stmt.nameSpan);
            throw new SqlError('name', 'ORA-01086', `ORA-01086: savepoint '${upper(stmt.name)}' never established in this session or is invalid`, 'savepoint-missing', friendly['savepoint-missing']({ name: upper(stmt.name) }), stmt.nameSpan);
          }
          const sp = savepoints[at];
          const changes = pending - sp.pending;
          const old = working;
          working = deepClone(sp.db);
          carryCounters(old, working);
          pending = sp.pending;
          // Các savepoint đặt sau nó mất. Chính nó vẫn còn.
          savepoints = savepoints.slice(0, at + 1);
          return { ok: true, kind: 'tx', op: 'rollback-to', changes };
        }
        case 'commit': {
          const changes = pending;
          committed = deepClone(working);
          pending = 0;
          inTx = false;
          savepoints = [];
          return { ok: true, kind: 'tx', op: 'commit', changes };
        }
        case 'rollback': {
          const changes = pending;
          const old = working;
          working = deepClone(committed);
          carryCounters(old, working);
          pending = 0;
          inTx = false;
          savepoints = [];
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

  const runScript = (sql: string): { results: RunResult[]; failedAt?: number } => {
    const pieces = splitStatements(sql, d);
    // Không có lệnh nào (rỗng, hoặc chỉ có chú thích): để `run` báo lỗi "Editor đang trống".
    if (pieces.length === 0) {
      const r = run(sql);
      return { results: [r], failedAt: r.ok ? undefined : 0 };
    }
    const results: RunResult[] = [];
    for (const p of pieces) {
      const r = run(p.sql);
      results.push(r);
      if (!r.ok) {
        r.error.span = { s: r.error.span.s + p.start, e: r.error.span.e + p.start };
        return { results, failedAt: results.length - 1 };
      }
    }
    return { results };
  };

  return {
    dialect: d,
    db: () => working,
    schema: () => schemaView(working, d),
    run,
    runScript,
    pending: () => pending,
    reset: () => {
      committed = fresh(source, d);
      working = fresh(source, d);
      pending = 0;
      inTx = false;
      savepoints = [];
      currvals.clear();
    },
  };
}

