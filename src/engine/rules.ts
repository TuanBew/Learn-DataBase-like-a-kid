import type { ColumnDef, ConstraintDef, Database, Dialect, RawValue, TableDef, Value } from './types';
import type { SelectStmt } from './ast';
import { type Span, SqlError, oraMessage } from './errors';
import { type Evaluator, loadRows, makeEvaluator, scopeOf } from './executor';
import type { FnEnv } from './functions';
import { friendly } from './messages.vi';
import { parse } from './parser';
import { type FkDef, childrenOf, colIndexes, constraintsOf, declaredType, sameName, typeNameOf, upper } from './catalog';
import { isDate, keyOf, parseIsoDate, showQuoted, toText } from './values';

/** Lỗi lúc chạy cho cả hai dialect. `code` và `msg` là [MySQL, Oracle]. Oracle để msg rỗng thì lấy câu chuẩn theo mã. */
export type Fail = (code: [string, string], msg: [string, string], hint: string, p: Record<string, string | number | undefined>, span: Span) => SqlError;

export const makeFail =
  (d: Dialect): Fail =>
  (code, msg, hint, p, span) =>
    d === 'mysql'
      ? new SqlError('runtime', code[0], `ERROR ${code[0]} ${msg[0]}`, hint, friendly[hint](p), span)
      : new SqlError('runtime', `ORA-${code[1]}`, msg[1] || oraMessage(code[1]), hint, friendly[hint](p), span);

/** Khoảng giá trị của các kiểu số nguyên MySQL. */
const INT_RANGE: Record<string, [number, number]> = {
  TINYINT: [-128, 127],
  SMALLINT: [-32768, 32767],
  INT: [-2147483648, 2147483647],
  INTEGER: [-2147483648, 2147483647],
  BIGINT: [-9223372036854775808, 9223372036854775807],
};

/** Làm tròn về `scale` chữ số sau dấu phẩy, nửa thì tròn ra xa số 0 (MySQL và Oracle đều vậy). */
export function roundTo(n: number, scale: number): number {
  const sign = n < 0 ? -1 : 1;
  const r = Math.round(Number(`${Math.abs(n)}e${scale}`));
  return sign * Number(`${r}e${-scale}`);
}

export interface Rules {
  fail: Fail;
  /** Đổi một giá trị đã tính thành giá trị cất trong table, đúng data type, độ dài và độ chính xác của column. */
  store(v: Value, c: ColumnDef, span: Span, t: TableDef, rowNo?: number): RawValue;
  /** Giá trị mặc định của một column: DEFAULT nếu có, không thì NULL. */
  defaultOf(t: TableDef, c: ColumnDef, span: Span): RawValue;
  /** Kiểm mọi luật của table cho các row vừa thêm hoặc vừa đổi. `rows` là table sau khi sửa. */
  validate(t: TableDef, rows: RawValue[][], targets: number[], span: Span, updating: boolean): void;
  /** Row ở table khác đang trỏ tới `gone` thì chặn, trừ khi foreign key có ON DELETE CASCADE hoặc SET NULL. */
  planDelete(t: TableDef, goneRows: number[], span: Span, cascade: boolean, changedCols?: number[]): DeletePlan;
  key(v: RawValue): string;
  qual(t: TableDef, c: ColumnDef): string;
  schema(): string;
  /** Câu mô tả foreign key như MySQL in trong thông báo lỗi. */
  fkText(child: TableDef, fk: FkDef): string;
}

export interface DeletePlan {
  /** Row bị xóa thêm ở các table khác (ON DELETE CASCADE), theo tên table. */
  deletes: Map<string, Set<number>>;
  /** Row bị đặt NULL (ON DELETE SET NULL): tên table, rồi số thứ tự row, rồi các column. */
  nulls: Map<string, Map<number, number[]>>;
}

export function makeRules(d: Dialect, getDb: () => Database, env: FnEnv): Rules {
  const fail = makeFail(d);
  const key = (v: RawValue) => keyOf(v as Value, d);
  const schema = () => upper(getDb().name);
  const qual = (t: TableDef, c: ColumnDef) => `"${schema()}"."${upper(t.name)}"."${upper(c.name)}"`;
  const enc = new TextEncoder();

  const store: Rules['store'] = (v, c, span, t, rowNo = 1) => {
    if (v === null) return null;
    const bad = () =>
      fail(
        ['1366', '01722'],
        [`(HY000): Incorrect ${c.type === 'int' ? 'integer' : 'decimal'} value: '${toText(v)}' for column '${c.name}' at row ${rowNo}`, ''],
        'bad-value',
        { column: c.name, type: typeNameOf(c), value: showQuoted(v) },
        span,
      );
    const outOfRange = () =>
      fail(
        ['1264', '01438'],
        [`(22003): Out of range value for column '${c.name}' at row ${rowNo}`, ''],
        'out-of-range',
        { column: c.name, type: declaredType(c), value: showQuoted(v) },
        span,
      );
    switch (c.type) {
      case 'int':
      case 'decimal': {
        let n: number;
        if (typeof v === 'boolean') n = v ? 1 : 0;
        else if (typeof v === 'number') n = v;
        else if (typeof v === 'string' && /^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(v)) n = Number(v);
        else throw bad();
        if (c.precision !== undefined) {
          n = roundTo(n, c.scale ?? 0);
          if (Math.abs(n) >= 10 ** (c.precision - (c.scale ?? 0))) throw outOfRange();
        } else if (c.type === 'int' && d === 'mysql') n = Math.round(n);
        if (d === 'mysql') {
          const range = INT_RANGE[typeNameOf(c)];
          if (range && (n < range[0] || n > range[1])) throw outOfRange();
        }
        return n;
      }
      case 'text': {
        let s = isDate(v) ? v.iso : toText(v);
        if (c.length === undefined) return s;
        if (d === 'mysql') {
          // MySQL đếm ký tự. Dấu cách thừa ở cuối bị cắt, không báo lỗi.
          if ([...s].length > c.length) {
            const trimmed = s.replace(/ +$/, '');
            if ([...trimmed].length > c.length) {
              throw fail(['1406', '12899'], [`(22001): Data too long for column '${c.name}' at row ${rowNo}`, ''], 'too-long', { column: c.name, max: c.length, actual: [...s].length }, span);
            }
            s = [...trimmed].slice(0, c.length).join('');
          }
          return s;
        }
        // Oracle đếm byte (UTF-8) trừ khi viết VARCHAR2(n CHAR). Chữ có dấu tốn 2 hoặc 3 byte.
        const actual = c.charLength ? [...s].length : enc.encode(s).length;
        if (actual > c.length) {
          throw fail(['1406', '12899'], ['', `ORA-12899: value too large for column ${qual(t, c)} (actual: ${actual}, maximum: ${c.length})`], 'too-long', { column: c.name, max: c.length, actual, unit: c.charLength ? 'ký tự' : 'byte' }, span);
        }
        return s;
      }
      default: {
        let date = isDate(v) ? v : null;
        if (!date && typeof v === 'string' && d === 'mysql') date = parseIsoDate(v);
        if (!date) {
          throw fail(
            ['1292', '01861'],
            [`(22007): Incorrect ${c.type} value: '${toText(v)}' for column '${c.name}' at row ${rowNo}`, ''],
            d === 'oracle' ? 'date-literal-oracle' : 'bad-value',
            { column: c.name, type: typeNameOf(c), value: showQuoted(v), text: toText(v) },
            span,
          );
        }
        if (c.type === 'date' && (d === 'mysql' || date.iso.endsWith(' 00:00:00'))) return date.iso.slice(0, 10);
        return c.type === 'datetime' && date.iso.length === 10 ? `${date.iso} 00:00:00` : date.iso;
      }
    }
  };

  /** Biểu thức đã đọc sẵn: CHECK và DEFAULT chạy lại ở mỗi row, không cần đọc lại mỗi lần. */
  const compiled = new Map<string, { st: SelectStmt; sql: string }>();
  const compile = (expr: string) => {
    let hit = compiled.get(expr);
    if (!hit) {
      const sql = `SELECT 1 FROM DUAL WHERE ${expr}`;
      hit = { st: parse(sql, d) as SelectStmt, sql };
      compiled.set(expr, hit);
    }
    return hit;
  };

  const defaultOf: Rules['defaultOf'] = (t, c, span) => {
    if (c.default === undefined) return null;
    const sql = `SELECT ${c.default} FROM DUAL`;
    const st = parse(sql, d) as SelectStmt;
    const E = makeEvaluator([], getDb(), d, sql, env);
    const e = st.items[0].e!;
    E.check(e, 'field list', 'no');
    return store(E.ev(e, { cells: [] }), c, span, t);
  };

  const fkText = (_child: TableDef, fk: FkDef) => {
    const names = (xs: string[]) => xs.map((x) => `\`${x}\``).join(', ');
    const action = fk.onDelete === 'cascade' ? ' ON DELETE CASCADE' : fk.onDelete === 'set null' ? ' ON DELETE SET NULL' : '';
    return `CONSTRAINT \`${fk.name}\` FOREIGN KEY (${names(fk.columns)}) REFERENCES \`${fk.refTable}\` (${names(fk.refColumns)})${action}`;
  };

  const validate: Rules['validate'] = (t, rows, targets, span, updating) => {
    const db = getDb();
    const cons = constraintsOf(t);
    const evals = cons
      .filter((c): c is Extract<ConstraintDef, { kind: 'check' }> => c.kind === 'check')
      .map((c) => {
        const { st, sql } = compile(c.expr);
        const E: Evaluator = makeEvaluator(scopeOf(t, { table: t.name, span }), db, d, sql, env, t.name);
        return { c, where: st.where!, E };
      });
    const loaded = evals.length > 0 ? loadRows({ ...t, rows }, d) : [];
    for (const i of targets) {
      const row = rows[i];
      t.columns.forEach((c, ci) => {
        if (row[ci] === null && (c.notNull || c.pk)) {
          throw fail(
            ['1048', updating ? '01407' : '01400'],
            [`(23000): Column '${c.name}' cannot be null`, `ORA-${updating ? '01407: cannot update' : '01400: cannot insert NULL into'} (${qual(t, c)})${updating ? ' to NULL' : ''}`],
            'not-null',
            { column: c.name },
            span,
          );
        }
      });
      for (const { c, where, E } of evals) {
        if (E.truth(E.ev(where, { cells: loaded[i] }), where.span) === false) {
          throw fail(['3819', '02290'], [`(HY000): Check constraint '${c.name}' is violated.`, `ORA-02290: check constraint (${schema()}.${upper(c.name)}) violated`], 'check-fail', { check: c.expr }, span);
        }
      }
      for (const c of cons) {
        if (c.kind !== 'pk' && c.kind !== 'unique') continue;
        const ix = colIndexes(t, c.columns);
        if (ix.some((ci) => row[ci] === null)) continue;
        const k = ix.map((ci) => key(row[ci])).join('|');
        const other = rows.findIndex((r, j) => j !== i && ix.map((ci) => key(r[ci])).join('|') === k);
        if (other >= 0) {
          const value = ix.map((ci) => toText(row[ci] as Value)).join('-');
          throw fail(
            ['1062', '00001'],
            [`(23000): Duplicate entry '${value}' for key '${t.name}.${c.name}'`, `ORA-00001: unique constraint (${schema()}.${upper(c.name)}) violated`],
            'dup-key',
            { column: c.columns.join(', '), value },
            span,
          );
        }
      }
      for (const c of cons) {
        if (c.kind !== 'fk') continue;
        const ix = colIndexes(t, c.columns);
        if (ix.some((ci) => row[ci] === null)) continue;
        const parent = sameName(c.refTable, t.name) ? { ...t, rows } : db.tables.find((x) => sameName(x.name, c.refTable));
        if (!parent) continue;
        const pi = colIndexes(parent, c.refColumns);
        if (pi.some((x) => x < 0)) continue;
        const k = ix.map((ci) => key(row[ci])).join('|');
        if (!parent.rows.some((r) => pi.map((x) => key(r[x])).join('|') === k)) {
          throw fail(
            ['1452', '02291'],
            [`(23000): Cannot add or update a child row: a foreign key constraint fails (\`${db.name}\`.\`${t.name}\`, ${fkText(t, c)})`, `ORA-02291: integrity constraint (${schema()}.${upper(c.name)}) violated - parent key not found`],
            'fk-parent',
            { parent: parent.name, pcolumn: c.refColumns.join(', '), value: ix.map((ci) => showQuoted(row[ci] as Value)).join(', ') },
            span,
          );
        }
      }
    }
  };

  const planDelete: Rules['planDelete'] = (t, goneRows, span, cascade, changedCols) => {
    const db = getDb();
    const plan: DeletePlan = { deletes: new Map(), nulls: new Map() };
    const main = plan.deletes.get(t.name) ?? new Set<number>(goneRows);
    plan.deletes.set(t.name, main);
    const visit = (parent: TableDef, gone: number[]) => {
      for (const { child, fk } of childrenOf(db, parent.name)) {
        const pi = colIndexes(parent, fk.refColumns);
        const ci = colIndexes(child, fk.columns);
        if (pi.some((x) => x < 0) || ci.some((x) => x < 0)) continue;
        // UPDATE chỉ đụng tới foreign key nào trỏ vào column vừa bị đổi.
        if (changedCols && parent === t && !pi.some((x) => changedCols.includes(x))) continue;
        const keys = new Set(gone.map((r) => pi.map((x) => key(parent.rows[r][x])).join('|')));
        const going = plan.deletes.get(child.name) ?? new Set<number>();
        const hits: number[] = [];
        child.rows.forEach((r, j) => {
          if (ci.some((x) => r[x] === null) || going.has(j)) return;
          if (keys.has(ci.map((x) => key(r[x])).join('|'))) hits.push(j);
        });
        if (hits.length === 0) continue;
        if (cascade && fk.onDelete === 'cascade') {
          hits.forEach((j) => going.add(j));
          plan.deletes.set(child.name, going);
          visit(child, hits);
        } else if (cascade && fk.onDelete === 'set null') {
          const m = plan.nulls.get(child.name) ?? new Map<number, number[]>();
          hits.forEach((j) => m.set(j, ci));
          plan.nulls.set(child.name, m);
        } else {
          throw fail(
            ['1451', '02292'],
            [`(23000): Cannot delete or update a parent row: a foreign key constraint fails (\`${db.name}\`.\`${child.name}\`, ${fkText(child, fk)})`, `ORA-02292: integrity constraint (${schema()}.${upper(fk.name)}) violated - child record found`],
            'fk-child',
            { child: child.name, n: hits.length },
            span,
          );
        }
      }
    };
    visit(t, goneRows);
    return plan;
  };

  return { fail, store, defaultOf, validate, planDelete, key, qual, schema, fkText };
}
