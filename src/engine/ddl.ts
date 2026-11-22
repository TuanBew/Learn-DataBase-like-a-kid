import type { ColumnDef, ConstraintDef, Database, Dialect, RawValue, TableDef, Value } from './types';
import type {
  AlterAction,
  AlterTableStmt,
  ColumnSpec,
  ConstraintSpec,
  CreateSequenceStmt,
  CreateTableStmt,
  DropSequenceStmt,
  DropTableStmt,
  SelectStmt,
  TruncateStmt,
} from './ast';
import { type Span, SqlError, oraMessage, unknownTable } from './errors';
import { findTable, loadRows, makeEvaluator, scopeOf } from './executor';
import type { FnEnv } from './functions';
import { friendly } from './messages.vi';
import { parse } from './parser';
import type { Rules } from './rules';
import {
  type FkDef,
  childrenOf,
  colIndex,
  colIndexes,
  columnsIn,
  constraintsOf,
  declaredType,
  deepClone,
  defaultName,
  findTableIn,
  fkCompatible,
  pkOf,
  renameIn,
  sameName,
  syncFlags,
  typeNameOf,
  upper,
} from './catalog';
import { toText } from './values';

export type DdlResult = {
  ok: true;
  kind: 'ddl';
  op: 'create' | 'alter' | 'drop' | 'truncate' | 'sequence';
  /** Tên table hoặc sequence vừa bị đụng tới (tên mới nếu vừa đổi tên). */
  object: string;
  /** Giống `object`. Giữ lại cho chỗ đã dùng từ trước. */
  table: string;
  /** Với op 'sequence': tạo hay xóa. */
  verb?: 'create' | 'drop';
  /** Các column hiện có của table. Rỗng với DROP TABLE và sequence. */
  columns: { name: string; typeName: string; declared: string }[];
};

export interface DdlCtx {
  d: Dialect;
  env: FnEnv;
  rules: Rules;
  /** Database đang làm việc. */
  get(): Database;
  /** Thay database đang làm việc (dùng để hoàn lại khi một lệnh lỗi giữa chừng). */
  set(db: Database): void;
}

type P = Record<string, string | number | undefined>;

export function makeDdl(ctx: DdlCtx) {
  const { d, rules, env } = ctx;
  const my = d === 'mysql';

  /** Lỗi theo từng dialect. `m` là [mã, sqlstate, câu], `ora` là mã Oracle, `oraFull` là cả câu nếu có tên đi kèm. */
  const err = (m: [string, string, string], ora: string, hint: string, p: P, span: Span, oraFull?: string) =>
    rules.fail([m[0], ora], [`(${m[1]}): ${m[2]}`, oraFull ?? ''], hint, p, span);

  const oraIdent = (name: string) => oraMessage('00904', `"${upper(name)}"`);

  /** Chạy `fn` trên một bản nháp của database. Lỗi giữa chừng thì quay về bản cũ, không để lại nửa vời. */
  const atomic = <T>(fn: (db: Database) => T): T => {
    const before = ctx.get();
    ctx.set(deepClone(before));
    try {
      return fn(ctx.get());
    } catch (e) {
      ctx.set(before);
      throw e;
    }
  };

  const result = (op: DdlResult['op'], object: string, t?: TableDef, verb?: 'create' | 'drop'): DdlResult => ({
    ok: true,
    kind: 'ddl',
    op,
    object,
    table: object,
    ...(verb ? { verb } : {}),
    columns: t ? t.columns.map((c) => ({ name: c.name, typeName: typeNameOf(c), declared: declaredType(c) })) : [],
  });

  const nameTaken = (db: Database, name: string) => !!findTableIn(db, name) || (d === 'oracle' && !!db.sequences?.some((s) => sameName(s.name, name)));

  /* ---------- data type ---------- */

  const checkType = (s: ColumnSpec) => {
    if (s.typeName === '') return;
    const w = s.typeName;
    if (s.length !== undefined) {
      const max = my ? (w === 'CHAR' ? 255 : 16383) : w === 'CHAR' ? 2000 : 4000;
      // CHỜ KIỂM TÀI LIỆU: Oracle VARCHAR2(0) báo ORA-00910.
      if (s.length > max || (!my && s.length === 0)) {
        throw err(['1074', '42000', `Column length too big for column '${s.name}' (max = ${max}); use BLOB or TEXT instead`], '00910', 'length-too-big', { name: s.name, type: w, max }, s.span);
      }
    }
    if (s.precision !== undefined) {
      const scale = s.scale ?? 0;
      if (my) {
        if (s.precision > 65) throw err(['1426', '42000', `Too-big precision ${s.precision} specified for '${s.name}'. Maximum is 65.`], '01727', 'precision-range', { name: s.name, max: 65, p: s.precision }, s.span);
        if (scale > s.precision) throw err(['1427', '42000', `For float(M,D), double(M,D) or decimal(M,D), M must be >= D (column '${s.name}').`], '01728', 'scale-over-precision', { name: s.name, p: s.precision, s: scale }, s.span);
      } else {
        if (s.precision < 1 || s.precision > 38) throw err(['1426', '42000', ''], '01727', 'precision-range', { name: s.name, max: 38, p: s.precision }, s.span);
        if (scale < -84 || scale > 127) throw err(['1427', '42000', ''], '01728', 'scale-range', { name: s.name, p: s.precision, s: scale }, s.span);
      }
    }
  };

  const colDef = (s: ColumnSpec): ColumnDef => {
    const c: ColumnDef = { name: s.name, type: s.type, sqlType: s.typeName };
    if (s.length !== undefined) c.length = s.length;
    if (s.charLength) c.charLength = true;
    if (s.precision !== undefined) c.precision = s.precision;
    if (s.scale !== undefined) c.scale = s.scale;
    if (s.nullSpec === 'not null') c.notNull = true;
    if (s.identity) c.identity = true;
    if (s.default) c.default = s.default.text;
    return c;
  };

  /** Kiểm DEFAULT bằng cách thử tính và cất vào đúng column. MySQL gọi mọi hỏng hóc là 1067. */
  const checkDefault = (t: TableDef, c: ColumnDef, span: Span) => {
    if (c.default === undefined) return;
    try {
      const v = rules.defaultOf(t, c, span);
      if (v === null && c.notNull && my) throw new Error('null');
    } catch (e) {
      if (my) throw err(['1067', '42000', `Invalid default value for '${c.name}'`], '01722', 'bad-default', { column: c.name }, span);
      throw e;
    }
  };

  /* ---------- luật ---------- */

  const keyMissing = (name: string, span: Span) => err(['1072', '42000', `Key column '${name}' doesn't exist in table`], '00904', 'key-column-missing', { name }, span, oraIdent(name));

  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.some((y) => sameName(x, y)));

  const dupName = (kind: ConstraintDef['kind'], name: string, span: Span | undefined, sp: Span) =>
    err(
      kind === 'fk' ? ['1826', 'HY000', `Duplicate foreign key constraint name '${name}'`] : kind === 'check' ? ['3822', 'HY000', `Duplicate check constraint name '${name}'.`] : ['1061', '42000', `Duplicate key name '${name}'`],
      '02264',
      'dup-constraint-name',
      { name },
      span ?? sp,
    );

  const nameInUse = (db: Database, t: TableDef, kind: ConstraintDef['kind'], name: string) => {
    if (!my) return db.tables.some((x) => constraintsOf(x).some((c) => sameName(c.name, name)));
    if (kind === 'unique') return constraintsOf(t).some((c) => c.kind === 'unique' && sameName(c.name, name));
    if (kind === 'pk') return false;
    return db.tables.some((x) => constraintsOf(x).some((c) => c.kind === kind && sameName(c.name, name)));
  };

  const keyOfRow = (ix: number[], r: RawValue[]) => ix.map((ci) => rules.key(r[ci])).join('|');

  /** Chạy CHECK trên các row đang có. Trả về số thứ tự row đầu tiên vi phạm, hoặc -1. */
  const firstViolation = (t: TableDef, expr: string): number => {
    if (t.rows.length === 0) return -1;
    const sql = `SELECT 1 FROM DUAL WHERE ${expr}`;
    const st = parse(sql, d) as SelectStmt;
    const E = makeEvaluator(scopeOf(t, { table: t.name, span: { s: 0, e: 0 } }), ctx.get(), d, sql, env, t.name);
    const loaded = loadRows(t, d);
    return loaded.findIndex((cells) => E.truth(E.ev(st.where!, { cells }), st.where!.span) === false);
  };

  /** Mọi column mà CHECK nhắc tới phải có thật. */
  const checkColumns = (t: TableDef, spec: ConstraintSpec, name: string, creating: boolean, own?: string) => {
    const sql = `SELECT 1 FROM DUAL WHERE ${spec.expr}`;
    const st = parse(sql, d) as SelectStmt;
    const E = makeEvaluator(scopeOf(t, { table: t.name, span: { s: 0, e: 0 } }), ctx.get(), d, sql, env, t.name);
    try {
      E.check(st.where!, 'where clause', 'no');
    } catch (e) {
      if (e instanceof SqlError && (e.hint === 'unknown-column' || e.hint === 'unknown-qualifier')) {
        const bad = sql.slice(e.span.s, e.span.e);
        const sp = spec.exprSpan ?? spec.span;
        if (!my) throw err(['1054', '42S22', ''], '00904', 'check-column', { column: bad, name }, sp, oraIdent(bad));
        if (!creating) throw err(['1054', '42S22', `Unknown column '${bad}' in 'check constraint ${name} expression'`], '00904', 'check-column', { column: bad, name }, sp);
        if (own) throw err(['3813', 'HY000', `Column check constraint '${name}' references other column.`], '00904', 'check-column', { column: bad, name }, sp);
        throw err(['3820', 'HY000', `Check constraint '${name}' refers to non-existing column '${bad}'.`], '00904', 'check-column', { column: bad, name }, sp);
      }
      throw e;
    }
    if (my && creating && own) {
      const others = columnsIn(spec.expr!, t, d).filter((i) => !sameName(t.columns[i].name, own));
      if (others.length > 0) throw err(['3813', 'HY000', `Column check constraint '${name}' references other column.`], '00904', 'check-column', { column: t.columns[others[0]].name, name }, spec.exprSpan ?? spec.span);
    }
  };

  /** Các row đang có không được trùng nhau trên `cols` (row có NULL không tính). */
  const dupCheck = (t: TableDef, cols: number[], colNames: string[], name: string, span: Span) => {
    const seen = new Set<string>();
    for (const r of t.rows) {
      if (cols.some((i) => r[i] === null)) continue;
      const k = keyOfRow(cols, r);
      if (seen.has(k)) {
        const value = cols.map((i) => toText(r[i] as Value)).join('-');
        throw err(['1062', '23000', `Duplicate entry '${value}' for key '${t.name}.${name}'`], '02299', 'dup-key', { column: colNames.join(', '), value }, span, `ORA-02299: cannot validate (${rules.schema()}.${upper(name)}) - duplicate keys found`);
      }
      seen.add(k);
    }
  };

  /** Thêm một luật vào table. Table đã có row thì kiểm luôn các row đó. */
  const addConstraint = (db: Database, t: TableDef, spec: ConstraintSpec, creating: boolean): void => {
    const cons = (t.constraints ??= []);
    const cols = spec.columns.map((c) => {
      const i = colIndex(t, c.name);
      if (i < 0) throw keyMissing(c.name, c.span);
      return i;
    });
    const colNames = cols.map((i) => t.columns[i].name);
    const name0 = spec.name;
    if (spec.kind === 'pk' && pkOf(t)) {
      throw err(['1068', '42000', 'Multiple primary key defined'], '02260', 'multi-pk', {}, spec.span);
    }
    // MySQL luôn gọi primary key là PRIMARY, dù người học đặt tên khác.
    const checkName = (name: string) => {
      if (spec.kind === 'pk' && my) return;
      if (nameInUse(db, t, spec.kind, name)) throw dupName(spec.kind, name, spec.nameSpan, spec.span);
    };
    if (name0) checkName(name0);
    const pick = () => (spec.kind === 'pk' && my ? 'PRIMARY' : (name0 ?? defaultName(db, d, t, spec.kind, colNames)));

    if (spec.kind === 'check') {
      const name = pick();
      checkColumns(t, spec, name, creating, spec.inline ? spec.columns[0]?.name : undefined);
      const bad = firstViolation(t, spec.expr!);
      if (bad >= 0) {
        throw err(['3819', 'HY000', `Check constraint '${name}' is violated.`], '02293', 'check-fail', { check: spec.expr }, spec.span, `ORA-02293: cannot validate (${rules.schema()}.${upper(name)}) - check constraint violated`);
      }
      cons.push({ kind: 'check', name, expr: spec.expr! });
    } else if (spec.kind === 'pk' || spec.kind === 'unique') {
      if (!my && cons.some((c) => (c.kind === 'pk' || c.kind === 'unique') && sameSet(c.columns, colNames))) {
        throw err(['1061', '42000', ''], '02261', 'unique-exists', {}, spec.span);
      }
      const name = pick();
      if (spec.kind === 'pk' && t.rows.length > 0) {
        const nullAt = t.rows.findIndex((r) => cols.some((i) => r[i] === null));
        if (nullAt >= 0) throw err(['1138', '22004', 'Invalid use of NULL value'], '01449', 'pk-null-found', { column: colNames.join(', ') }, spec.span);
      }
      dupCheck(t, cols, colNames, name, spec.span);
      if (spec.kind === 'pk') cols.forEach((i) => (t.columns[i].notNull = true));
      cons.push({ kind: spec.kind, name, columns: colNames });
    } else {
      const ref = spec.ref!;
      const self = sameName(ref.table, t.name);
      const parent = self ? t : findTableIn(db, ref.table);
      if (!parent) throw err(['1824', 'HY000', `Failed to open the referenced table '${ref.table}'`], '00942', 'fk-parent-table', { name: ref.table }, ref.tableSpan);
      const pk = pkOf(parent);
      const refNames = ref.columns.length > 0 ? ref.columns.map((c) => c.name) : (pk?.columns ?? []);
      if (ref.columns.length === 0 && !pk) throw err(['1822', 'HY000', ''], '02270', 'fk-no-key', { name: parent.name }, ref.tableSpan);
      const pIdx = refNames.map((n) => colIndex(parent, n));
      const missing = pIdx.findIndex((i) => i < 0);
      const name = pick();
      if (missing >= 0) {
        throw err(['3734', 'HY000', `Failed to add the foreign key constraint. Missing column '${refNames[missing]}' for constraint '${name}' in the referenced table '${parent.name}'`], '00904', 'fk-parent-column', { name: refNames[missing], table: parent.name }, ref.columns[missing]?.span ?? ref.tableSpan, oraIdent(refNames[missing]));
      }
      if (refNames.length !== cols.length) {
        throw err(['1239', '42000', `Incorrect foreign key definition for '${name0 ?? 'foreign key without name'}': Key reference and table reference don't match`], '02256', 'fk-count', { need: refNames.length, got: cols.length }, spec.span);
      }
      for (let k = 0; k < cols.length; k++) {
        if (!fkCompatible(t.columns[cols[k]], parent.columns[pIdx[k]], d)) {
          throw err(['3780', 'HY000', `Referencing column '${t.columns[cols[k]].name}' and referenced column '${parent.columns[pIdx[k]].name}' in foreign key constraint '${name}' are incompatible.`], '02267', 'fk-incompatible', { column: t.columns[cols[k]].name, pcolumn: parent.columns[pIdx[k]].name }, spec.columns[k].span);
        }
      }
      const parentNames = pIdx.map((i) => parent.columns[i].name);
      if (!constraintsOf(parent).some((c) => (c.kind === 'pk' || c.kind === 'unique') && sameSet(c.columns, parentNames))) {
        // Table đang tạo cũng được trỏ vào chính nó: key của nó nằm trong các luật chưa thêm, nên xét thêm cả `spec` của chính nó.
        throw err(['1822', 'HY000', `Failed to add the foreign key constraint. Missing index for constraint '${name}' in the referenced table '${parent.name}'`], '02270', 'fk-no-key', { name: parent.name }, ref.tableSpan);
      }
      if (ref.onDelete === 'set null' && my) {
        const notNull = cols.find((i) => t.columns[i].notNull || t.columns[i].pk);
        if (notNull !== undefined) throw err(['1830', 'HY000', `Column '${t.columns[notNull].name}' cannot be NOT NULL: needed in a foreign key constraint '${name}' SET NULL`], '00904', 'fk-set-null-not-null', { column: t.columns[notNull].name }, spec.span);
      }
      const fk: FkDef = { kind: 'fk', name, columns: colNames, refTable: parent.name, refColumns: parentNames };
      if (ref.onDelete) fk.onDelete = ref.onDelete;
      // Row đang có phải trỏ vào row có thật.
      for (const r of t.rows) {
        if (cols.some((i) => r[i] === null)) continue;
        const k = keyOfRow(cols, r);
        if (!parent.rows.some((x) => keyOfRow(pIdx, x) === k)) {
          throw err(['1452', '23000', `Cannot add or update a child row: a foreign key constraint fails (\`${db.name}\`.\`#sql-ib${100 + db.tables.length}\`, ${rules.fkText(t, fk)})`], '02298', 'fk-parent', { parent: parent.name, pcolumn: refNames.join(', '), value: cols.map((i) => toText(r[i] as Value)).join(', ') }, spec.span, `ORA-02298: cannot validate (${rules.schema()}.${upper(name)}) - parent keys not found`);
        }
      }
      cons.push(fk);
    }
    syncFlags(t);
  };

  /* ---------- CREATE TABLE ---------- */

  const create = (stmt: CreateTableStmt): DdlResult => {
    const db0 = ctx.get();
    if (nameTaken(db0, stmt.name)) {
      if (my && stmt.ifNotExists) return result('create', findTableIn(db0, stmt.name)!.name, findTableIn(db0, stmt.name));
      throw err(['1050', '42S01', `Table '${stmt.name}' already exists`], '00955', findTableIn(db0, stmt.name) ? 'table-exists' : 'name-used', { name: stmt.name }, stmt.nameSpan);
    }
    return atomic((db) => {
      const seen = new Set<string>();
      for (const c of stmt.columns) {
        if (seen.has(c.name.toLowerCase())) throw err(['1060', '42S21', `Duplicate column name '${c.name}'`], '00957', 'dup-column', { name: c.name }, c.span);
        seen.add(c.name.toLowerCase());
        checkType(c);
      }
      const t: TableDef = { name: stmt.name, columns: stmt.columns.map(colDef), constraints: [], rows: [] };
      db.tables.push(t);
      // Key trước, rồi CHECK, rồi foreign key: foreign key trỏ vào key của chính table này dù viết ở đâu.
      const rank = (k: ConstraintSpec['kind']) => (k === 'pk' || k === 'unique' ? 0 : k === 'check' ? 1 : 2);
      const specs = [...stmt.columns.flatMap((c) => c.constraints), ...stmt.constraints].sort((a, b) => rank(a.kind) - rank(b.kind) || a.span.s - b.span.s);
      for (const s of specs) addConstraint(db, t, s, true);
      stmt.columns.forEach((s, i) => {
        if (s.identity) {
          const isKey = constraintsOf(t).some((c) => (c.kind === 'pk' || c.kind === 'unique') && c.columns.some((n) => sameName(n, s.name)));
          if (my && !isKey) throw err(['1075', '42000', 'Incorrect table definition; there can be only one auto column and it must be defined as a key'], '00907', 'auto-key', {}, s.span);
          t.autoInc = stmt.autoInc ?? 1;
          t.columns[i].notNull = true;
        }
        checkDefault(t, t.columns[i], s.default?.span ?? s.span);
      });
      syncFlags(t);
      return result('create', t.name, t);
    });
  };

  /* ---------- ALTER TABLE ---------- */

  const unknownCol = (t: TableDef, name: string, span: Span) => err(['1054', '42S22', `Unknown column '${name}' in '${t.name}'`], '00904', 'unknown-column', { name, table: t.name }, span, oraIdent(name));

  /** Giá trị MySQL tự điền cho column NOT NULL thêm vào table đang có row. */
  const implicit = (c: ColumnDef, span: Span): RawValue => {
    if (c.type === 'int' || c.type === 'decimal') return 0;
    if (c.type === 'text') return '';
    const zero = c.type === 'date' ? '0000-00-00' : '0000-00-00 00:00:00';
    throw err(['1292', '22007', `Incorrect ${c.type} value: '${zero}' for column '${c.name}' at row 1`], '01861', 'bad-value', { column: c.name, type: typeNameOf(c), value: zero }, span);
  };

  const addColumn = (db: Database, t: TableDef, s: ColumnSpec) => {
    if (colIndex(t, s.name) >= 0) throw err(['1060', '42S21', `Duplicate column name '${s.name}'`], '01430', 'dup-column', { name: s.name }, s.span);
    checkType(s);
    if (s.identity) throw new SqlError('unsupported', 'CHUA-HOC', '', 'unsupported', friendly.unsupported({ feature: 'thêm column AUTO_INCREMENT hay IDENTITY bằng ALTER TABLE' }), s.span);
    const c = colDef(s);
    checkDefault(t, c, s.default?.span ?? s.span);
    let fill: (r: RawValue[]) => RawValue;
    if (c.default !== undefined) {
      const v = rules.defaultOf(t, c, s.span);
      fill = () => v;
    } else if (c.notNull && t.rows.length > 0) {
      if (!my) throw err(['1364', 'HY000', ''], '01758', 'add-not-null', { column: c.name }, s.span);
      const v = implicit(c, s.span);
      fill = () => v;
    } else fill = () => null;
    t.columns.push(c);
    for (const r of t.rows) r.push(fill(r));
    for (const k of s.constraints) addConstraint(db, t, k, false);
    syncFlags(t);
  };

  /** Hai data type cùng nhóm thì Oracle đổi được dù column đang có dữ liệu. */
  const sameFamily = (a: ColumnDef, b: ColumnDef) => {
    const num = (c: ColumnDef) => c.type === 'int' || c.type === 'decimal';
    if (num(a) && num(b)) return true;
    if ((a.type === 'date' || a.type === 'datetime') && (b.type === 'date' || b.type === 'datetime')) return true;
    return a.type === b.type;
  };

  const modifyColumn = (db: Database, t: TableDef, s: ColumnSpec) => {
    const i = colIndex(t, s.name);
    if (i < 0) throw unknownCol(t, s.name, s.span);
    checkType(s);
    const old = t.columns[i];
    const inPk = !!pkOf(t)?.columns.some((n) => sameName(n, old.name));
    const next: ColumnDef = { ...old };
    if (my) {
      // MySQL thay cả định nghĩa: thứ gì không viết lại thì mất (NOT NULL, DEFAULT).
      const fresh = colDef(s);
      for (const k of ['sqlType', 'length', 'charLength', 'precision', 'scale', 'default', 'identity', 'notNull'] as const) delete next[k];
      Object.assign(next, fresh, { name: old.name });
      if (old.label !== undefined) next.label = old.label;
      if (inPk) next.notNull = true;
      next.type = s.type;
    } else {
      if (s.typeName !== '') {
        for (const k of ['sqlType', 'length', 'charLength', 'precision', 'scale'] as const) delete next[k];
        Object.assign(next, { type: s.type, sqlType: s.typeName }, s.length !== undefined ? { length: s.length } : {}, s.charLength ? { charLength: true } : {}, s.precision !== undefined ? { precision: s.precision, scale: s.scale } : {});
      }
      if (s.default) next.default = s.default.text;
      if (s.nullSpec === 'not null') {
        if (old.notNull || inPk) throw err(['1048', '23000', ''], '01442', 'already-not-null', { column: old.name }, s.span);
        if (t.rows.some((r) => r[i] === null)) throw err(['1265', '01000', ''], '02296', 'modify-null-found', { column: old.name }, s.span, `ORA-02296: cannot enable (${rules.schema()}.) - null values found`);
        next.notNull = true;
      } else if (s.nullSpec === 'null') {
        if (!old.notNull || inPk) throw err(['1048', '23000', ''], '01451', 'already-null', { column: old.name }, s.span);
        delete next.notNull;
      }
    }
    // Dữ liệu đang có phải vừa với định nghĩa mới.
    const nonEmpty = t.rows.some((r) => r[i] !== null);
    if (!my && nonEmpty) {
      if (!sameFamily(old, next)) throw err(['1366', 'HY000', ''], '01439', 'modify-type-nonempty', { column: old.name }, s.span);
      if (next.precision !== undefined && (old.precision === undefined || next.precision < old.precision || (next.scale ?? 0) < (old.scale ?? 0))) {
        throw err(['1264', '22003', ''], '01440', 'modify-precision-nonempty', { column: old.name }, s.span);
      }
      if (next.length !== undefined && next.type === 'text') {
        const enc = new TextEncoder();
        const tooBig = t.rows.some((r) => typeof r[i] === 'string' && (next.charLength ? [...(r[i] as string)].length : enc.encode(r[i] as string).length) > next.length!);
        if (tooBig) throw err(['1265', '01000', ''], '01441', 'modify-too-small', { column: old.name }, s.span);
      }
    }
    if (my) {
      const rows = t.rows.map((r, n) => {
        const v = r[i];
        if (v === null) {
          if (next.notNull) throw err(['1265', '01000', `Data truncated for column '${old.name}' at row ${n + 1}`], '01451', 'modify-truncate', { column: old.name }, s.span);
          return v;
        }
        try {
          return rules.store(v as Value, next, s.span, t, n + 1);
        } catch (e) {
          if (e instanceof SqlError && e.hint === 'too-long') throw err(['1265', '01000', `Data truncated for column '${old.name}' at row ${n + 1}`], '01441', 'modify-truncate', { column: old.name }, s.span);
          throw e;
        }
      });
      t.rows.forEach((r, n) => (r[i] = rows[n]));
    }
    t.columns[i] = next;
    checkDefault(t, next, s.default?.span ?? s.span);
    // foreign key nối column này phải còn hợp.
    for (const fk of constraintsOf(t)) {
      if (fk.kind !== 'fk' || !fk.columns.some((n) => sameName(n, old.name))) continue;
      const parent = sameName(fk.refTable, t.name) ? t : findTableIn(db, fk.refTable);
      fk.columns.forEach((n, k) => {
        const pc = parent?.columns[colIndex(parent, fk.refColumns[k])];
        const cc = t.columns[colIndex(t, n)];
        if (pc && !fkCompatible(cc, pc, d)) throw err(['3780', 'HY000', `Referencing column '${cc.name}' and referenced column '${pc.name}' in foreign key constraint '${fk.name}' are incompatible.`], '02267', 'fk-incompatible', { column: cc.name, pcolumn: pc.name }, s.span);
      });
    }
    for (const { child, fk } of childrenOf(db, t.name)) {
      if (!fk.refColumns.some((n) => sameName(n, old.name))) continue;
      fk.columns.forEach((n, k) => {
        if (!sameName(fk.refColumns[k], old.name)) return;
        const cc = child.columns[colIndex(child, n)];
        if (cc && !fkCompatible(cc, next, d)) throw err(['3780', 'HY000', `Referencing column '${cc.name}' and referenced column '${next.name}' in foreign key constraint '${fk.name}' are incompatible.`], '02267', 'fk-incompatible', { column: cc.name, pcolumn: next.name }, s.span);
      });
    }
    for (const k of s.constraints) addConstraint(db, t, k, false);
    syncFlags(t);
  };

  const dropColumn = (db: Database, t: TableDef, name: string, span: Span) => {
    const i = colIndex(t, name);
    if (i < 0) throw err(['1091', '42000', `Can't DROP '${name}'; check that column/key exists`], '00904', 'drop-unknown-column', { name }, span, oraIdent(name));
    const real = t.columns[i].name;
    if (t.columns.length === 1) throw err(['1090', '42000', "You can't delete all columns with ALTER TABLE; use DROP TABLE instead"], '12983', 'drop-all-columns', {}, span);
    const uses = (cols: string[]) => cols.some((n) => sameName(n, real));
    // foreign key của table khác đang trỏ vào column này
    for (const { child, fk } of childrenOf(db, t.name)) {
      if (uses(fk.refColumns)) throw err(['1829', 'HY000', `Cannot drop column '${real}': needed in a foreign key constraint '${fk.name}' of table '${child.name}'`], '12992', 'drop-column-fk', { column: real, fk: fk.name, table: child.name, parent: 'yes' }, span);
    }
    const keep: ConstraintDef[] = [];
    const reduced: Extract<ConstraintDef, { kind: 'pk' | 'unique' }>[] = [];
    for (const c of constraintsOf(t)) {
      if (c.kind === 'check') {
        const hit = columnsIn(c.expr, t, d).includes(i);
        if (!hit) keep.push(c);
        else if (my) throw err(['3959', 'HY000', `Check constraint '${c.name}' uses column '${real}', hence column cannot be dropped or renamed.`], '12991', 'drop-column-check', { column: real, name: c.name }, span);
        else if (columnsIn(c.expr, t, d).length > 1) throw err(['3959', 'HY000', ''], '12991', 'drop-column-multi', { column: real, name: c.name }, span);
        continue;
      }
      if (!uses(c.columns)) {
        keep.push(c);
        continue;
      }
      if (c.kind === 'fk') {
        if (my) throw err(['1828', 'HY000', `Cannot drop column '${real}': needed in a foreign key constraint '${c.name}'`], '12991', 'drop-column-fk', { column: real, fk: c.name }, span);
        if (c.columns.length > 1) throw err(['1828', 'HY000', ''], '12991', 'drop-column-multi', { column: real, name: c.name }, span);
        continue;
      }
      if (c.columns.length > 1) {
        // MySQL rút column khỏi key. Oracle không cho, trừ khi viết CASCADE CONSTRAINTS (engine chưa dạy).
        if (!my) throw err(['1091', '42000', ''], '12991', 'drop-column-multi', { column: real, name: c.name }, span);
        keep.push({ ...c, columns: c.columns.filter((n) => !sameName(n, real)) });
        reduced.push(keep[keep.length - 1] as Extract<ConstraintDef, { kind: 'pk' | 'unique' }>);
      }
    }
    t.constraints = keep;
    t.columns.splice(i, 1);
    for (const r of t.rows) r.splice(i, 1);
    // Key rút bớt column thì các row đang có có thể bắt đầu trùng nhau.
    for (const c of reduced) dupCheck(t, colIndexes(t, c.columns), c.columns, c.name, span);
    syncFlags(t);
  };

  const renameColumn = (db: Database, t: TableDef, from: { name: string; span: Span }, to: { name: string; span: Span }) => {
    const i = colIndex(t, from.name);
    if (i < 0) throw unknownCol(t, from.name, from.span);
    if (colIndex(t, to.name) >= 0 && !sameName(from.name, to.name)) throw err(['1060', '42S21', `Duplicate column name '${to.name}'`], '00957', 'dup-column', { name: to.name }, to.span);
    const real = t.columns[i].name;
    for (const c of constraintsOf(t)) {
      if (c.kind === 'check') {
        if (!columnsIn(c.expr, t, d).includes(i)) continue;
        if (my) throw err(['3959', 'HY000', `Check constraint '${c.name}' uses column '${real}', hence column cannot be dropped or renamed.`], '00904', 'drop-column-check', { column: real, name: c.name }, from.span);
        c.expr = renameIn(c.expr, real, to.name, d);
      } else {
        c.columns = c.columns.map((n) => (sameName(n, real) ? to.name : n));
      }
    }
    for (const { fk } of childrenOf(db, t.name)) fk.refColumns = fk.refColumns.map((n) => (sameName(n, real) ? to.name : n));
    t.columns[i].name = to.name;
    syncFlags(t);
    for (const x of db.tables) syncFlags(x);
  };

  const dropConstraint = (db: Database, t: TableDef, a: Extract<AlterAction, { a: 'drop-constraint' }>) => {
    const cons = constraintsOf(t);
    let found: ConstraintDef | undefined;
    if (a.via === 'primary') {
      found = pkOf(t);
      if (!found) throw err(['1091', '42000', "Can't DROP 'PRIMARY'; check that column/key exists"], '02441', 'drop-constraint-missing', { name: 'PRIMARY' }, a.span);
    } else {
      const name = a.name!;
      found = cons.find((c) => sameName(c.name, name) && (a.via === 'constraint' || (a.via === 'foreign' && c.kind === 'fk') || (a.via === 'check' && c.kind === 'check')));
      if (!found) {
        if (a.via === 'foreign') throw err(['1091', '42000', `Can't DROP '${name}'; check that column/key exists`], '02443', 'drop-constraint-missing', { name }, a.span);
        if (a.via === 'check') throw err(['3821', 'HY000', `Check constraint '${name}' is not found in the table.`], '02443', 'drop-constraint-missing', { name }, a.span);
        throw err(['3940', 'HY000', `Constraint '${name}' does not exist.`], '02443', 'drop-constraint-missing', { name }, a.span, 'ORA-02443: Cannot drop constraint  - nonexistent constraint');
      }
    }
    if (found.kind === 'pk' || found.kind === 'unique') {
      const used = childrenOf(db, t.name).find(({ fk }) => sameSet(fk.refColumns, found.columns));
      if (used) throw err(['1553', 'HY000', `Cannot drop index '${found.name}': needed in a foreign key constraint`], '02273', 'drop-key-referenced', { name: found.name, child: used.child.name }, a.span);
    }
    t.constraints = cons.filter((c) => c !== found);
    syncFlags(t);
  };

  const alter = (stmt: AlterTableStmt): DdlResult => {
    const t0 = findTable(ctx.get(), stmt.table, d);
    // DUAL không phải table của người học.
    if (!findTableIn(ctx.get(), t0.name)) throw unknownTable(d, ctx.get().name, stmt.table.table, stmt.table.span);
    const tname = t0.name;
    return atomic((db) => {
      const t = findTableIn(db, tname)!;
      for (const a of stmt.actions) {
        switch (a.a) {
          case 'add-column':
            a.cols.forEach((c) => addColumn(db, t, c));
            break;
          case 'modify':
            a.cols.forEach((c) => modifyColumn(db, t, c));
            break;
          case 'drop-column':
            a.names.forEach((n) => dropColumn(db, t, n.name, n.span));
            break;
          case 'rename-column':
            renameColumn(db, t, a.from, a.to);
            break;
          case 'rename-to': {
            if (nameTaken(db, a.to.name) && !sameName(a.to.name, t.name)) throw err(['1050', '42S01', `Table '${a.to.name}' already exists`], '00955', 'table-exists', { name: a.to.name }, a.to.span);
            for (const { fk } of childrenOf(db, t.name)) fk.refTable = a.to.name;
            t.name = a.to.name;
            break;
          }
          case 'add-constraint':
            addConstraint(db, t, a.c, false);
            break;
          case 'drop-constraint':
            dropConstraint(db, t, a);
            break;
        }
      }
      return result('alter', t.name, t);
    });
  };

  /* ---------- DROP, TRUNCATE ---------- */

  const dropTable = (stmt: DropTableStmt): DdlResult => {
    const db0 = ctx.get();
    const t = db0.tables.find((x) => (d === 'oracle' && stmt.table.quoted ? x.name.toUpperCase() === stmt.table.table : sameName(x.name, stmt.table.table)));
    if (!t) {
      if (my && stmt.ifExists) return result('drop', stmt.table.table);
      if (!my) throw unknownTable(d, db0.name, stmt.table.table, stmt.table.span);
      throw err(['1051', '42S02', `Unknown table '${db0.name}.${stmt.table.table}'`], '00942', 'unknown-table', { name: stmt.table.table }, stmt.table.span);
    }
    const refs = childrenOf(db0, t.name).filter((x) => x.child !== t);
    if (refs.length > 0 && !(d === 'oracle' && stmt.cascade)) {
      const r = refs[0];
      throw err(['3730', 'HY000', `Cannot drop table '${t.name}' referenced by a foreign key constraint '${r.fk.name}' on table '${r.child.name}'.`], '02449', 'drop-referenced', { name: t.name, child: r.child.name, fk: r.fk.name, cascade: my ? undefined : 'yes' }, stmt.table.span);
    }
    return atomic((db) => {
      for (const { child, fk } of childrenOf(db, t.name)) {
        if (sameName(child.name, t.name)) continue;
        child.constraints = constraintsOf(child).filter((c) => c !== fk && !(c.kind === 'fk' && c.name === fk.name));
        syncFlags(child);
      }
      db.tables = db.tables.filter((x) => !sameName(x.name, t.name));
      return result('drop', t.name);
    });
  };

  const truncate = (stmt: TruncateStmt): DdlResult => {
    const db0 = ctx.get();
    const t = findTable(db0, stmt.table, d);
    if (!findTableIn(db0, t.name)) throw unknownTable(d, db0.name, stmt.table.table, stmt.table.span);
    const refs = childrenOf(db0, t.name).filter((x) => x.child !== t);
    if (refs.length > 0) {
      const r = refs[0];
      throw err(['1701', '42000', `Cannot truncate a table referenced in a foreign key constraint (\`${db0.name}\`.\`${r.child.name}\`, CONSTRAINT \`${r.fk.name}\`)`], '02266', 'truncate-referenced', { name: t.name, child: r.child.name }, stmt.table.span);
    }
    return atomic((db) => {
      const x = findTableIn(db, t.name)!;
      x.rows = [];
      // MySQL đặt lại bộ đếm AUTO_INCREMENT. Identity của Oracle thì đếm tiếp.
      if (my && x.autoInc !== undefined) x.autoInc = 1;
      return result('truncate', x.name, x);
    });
  };

  /* ---------- sequence (Oracle) ---------- */

  const createSequence = (stmt: CreateSequenceStmt): DdlResult => {
    const db0 = ctx.get();
    if (nameTaken(db0, stmt.name)) throw err(['1050', '42S01', ''], '00955', 'name-used', { name: stmt.name }, stmt.nameSpan);
    if (stmt.increment === 0) throw err(['1064', '42000', ''], '04002', 'seq-increment-zero', {}, stmt.incrementSpan ?? stmt.span);
    return atomic((db) => {
      (db.sequences ??= []).push({ name: stmt.name, start: stmt.start ?? 1, increment: stmt.increment ?? 1 });
      return result('sequence', stmt.name, undefined, 'create');
    });
  };

  const dropSequence = (stmt: DropSequenceStmt): DdlResult => {
    const db0 = ctx.get();
    const s = db0.sequences?.find((x) => sameName(x.name, stmt.name));
    if (!s) throw err(['1064', '42000', ''], '02289', 'seq-missing', { name: stmt.name }, stmt.nameSpan);
    return atomic((db) => {
      db.sequences = (db.sequences ?? []).filter((x) => !sameName(x.name, stmt.name));
      return result('sequence', s.name, undefined, 'drop');
    });
  };

  return { create, alter, dropTable, truncate, createSequence, dropSequence };
}
