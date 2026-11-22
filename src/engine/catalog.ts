import type { ColumnDef, ConstraintDef, Database, Dialect, TableDef } from './types';
import { tokenize } from './tokenizer';

/** Phần danh mục: tên luật, cờ trên column, so data type. Không chạy SQL, không ném lỗi. */

export const upper = (s: string) => s.toUpperCase();
export const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Database toàn JSON thuần, nên sao chép bằng JSON là đủ. */
export const deepClone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export const colIndex = (t: TableDef, name: string) => t.columns.findIndex((c) => sameName(c.name, name));
export const colIndexes = (t: TableDef, names: string[]) => names.map((n) => colIndex(t, n));

export const findTableIn = (db: Database, name: string): TableDef | undefined => db.tables.find((t) => sameName(t.name, name));

export const constraintsOf = (t: TableDef): ConstraintDef[] => t.constraints ?? [];

export const pkOf = (t: TableDef) => constraintsOf(t).find((c): c is Extract<ConstraintDef, { kind: 'pk' }> => c.kind === 'pk');

export type FkDef = Extract<ConstraintDef, { kind: 'fk' }>;

/** Mọi foreign key (của mọi table) đang trỏ tới table `name`. */
export function childrenOf(db: Database, name: string): { child: TableDef; fk: FkDef }[] {
  const out: { child: TableDef; fk: FkDef }[] = [];
  for (const child of db.tables) {
    for (const c of constraintsOf(child)) if (c.kind === 'fk' && sameName(c.refTable, name)) out.push({ child, fk: c });
  }
  return out;
}

/** Số hiệu cho tên SYS_C00... của Oracle, cấp từ bộ đếm nằm trong Database. */
export function sysName(db: Database): string {
  db.sysName = (db.sysName ?? 8500) + 1;
  return `SYS_C00${db.sysName}`;
}

/**
 * Tên mặc định của một luật khi người học không đặt tên.
 * MySQL: PRIMARY, tên column (UNIQUE), t_ibfk_n (FOREIGN KEY), t_chk_n (CHECK). Oracle: SYS_C00nnnn.
 */
export function defaultName(db: Database, d: Dialect, t: TableDef, kind: ConstraintDef['kind'], columns: string[]): string {
  if (d === 'oracle') return sysName(db);
  const used = constraintsOf(t);
  if (kind === 'pk') return 'PRIMARY';
  if (kind === 'unique') {
    const base = columns[0];
    let name = base;
    for (let n = 2; used.some((c) => c.kind === 'unique' && sameName(c.name, name)); n++) name = `${base}_${n}`;
    return name;
  }
  const mid = kind === 'fk' ? 'ibfk' : 'chk';
  // Số kế tiếp sau mọi tên có dạng t_chk_n. Luật có tên riêng không chiếm số.
  const re = new RegExp(`^${t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_${mid}_(\\d+)$`, 'i');
  const n = Math.max(0, ...used.filter((c) => c.kind === kind).map((c) => Number(re.exec(c.name)?.[1] ?? 0))) + 1;
  return `${t.name}_${mid}_${n}`;
}

/**
 * Table mẫu viết luật bằng cờ trên column (pk, unique, fk) và `checks`. Dựng `constraints` từ các cờ đó.
 * Table đã có `constraints` thì giữ nguyên.
 */
export function normalize(db: Database, d: Dialect): Database {
  for (const t of db.tables) {
    if (t.constraints) continue;
    const cons: ConstraintDef[] = [];
    const T = upper(t.name);
    const pk = t.columns.filter((c) => c.pk).map((c) => c.name);
    if (pk.length > 0) cons.push({ kind: 'pk', name: d === 'mysql' ? 'PRIMARY' : `${T}_PK`, columns: pk });
    for (const c of t.columns) if (c.unique) cons.push({ kind: 'unique', name: d === 'mysql' ? c.name : `${T}_${upper(c.name)}_UK`, columns: [c.name] });
    let fkN = 0;
    for (const c of t.columns) {
      if (!c.fk) continue;
      fkN++;
      cons.push({ kind: 'fk', name: d === 'mysql' ? `${t.name}_ibfk_${fkN}` : `${T}_${upper(c.name)}_FK`, columns: [c.name], refTable: c.fk.table, refColumns: [c.fk.column] });
    }
    (t.checks ?? []).forEach((expr, i) => cons.push({ kind: 'check', name: d === 'mysql' ? `${t.name}_chk_${i + 1}` : `${T}_CHK${i + 1}`, expr }));
    t.constraints = cons;
  }
  return db;
}

/** Giữ các cờ `pk`, `unique`, `fk` trên column và `checks` của table khớp với `constraints`. */
export function syncFlags(t: TableDef): void {
  const cons = constraintsOf(t);
  const pk = pkOf(t);
  for (const c of t.columns) {
    const inPk = !!pk && pk.columns.some((n) => sameName(n, c.name));
    const single = cons.filter((x) => x.kind === 'unique' && x.columns.length === 1 && sameName(x.columns[0], c.name));
    const fk = cons.find((x): x is FkDef => x.kind === 'fk' && x.columns.length === 1 && sameName(x.columns[0], c.name));
    if (inPk) c.pk = true;
    else delete c.pk;
    if (single.length > 0) c.unique = true;
    else delete c.unique;
    if (fk) c.fk = { table: fk.refTable, column: fk.refColumns[0] };
    else delete c.fk;
  }
  const checks = cons.filter((x) => x.kind === 'check').map((x) => (x as { expr: string }).expr);
  if (checks.length > 0) t.checks = checks;
  else delete t.checks;
}

/** Tên data type mặc định của table mẫu, chưa có `sqlType`. */
const DEFAULT_TYPE: Record<ColumnDef['type'], string> = { int: 'INT', decimal: 'DECIMAL', text: 'VARCHAR', date: 'DATE', datetime: 'DATETIME' };

export const typeNameOf = (c: ColumnDef): string => c.sqlType ?? DEFAULT_TYPE[c.type];

/** Data type viết đầy đủ như trong SQL: VARCHAR(50), DECIMAL(5,2), NUMBER(10). */
export function declaredType(c: ColumnDef): string {
  const n = typeNameOf(c);
  if (c.length !== undefined) return `${n}(${c.length}${c.charLength ? ' CHAR' : ''})`;
  if (c.precision !== undefined) return `${n}(${c.precision}${c.scale ? `,${c.scale}` : ''})`;
  return n;
}

const INT_NAMES = new Set(['INT', 'INTEGER', 'SMALLINT', 'BIGINT', 'TINYINT']);

/** Hai column có nối với nhau bằng foreign key được không. MySQL khó tính hơn Oracle. */
export function fkCompatible(child: ColumnDef, parent: ColumnDef, d: Dialect): boolean {
  const a = typeNameOf(child);
  const b = typeNameOf(parent);
  if (d === 'oracle') {
    const num = (c: ColumnDef) => c.type === 'int' || c.type === 'decimal';
    if (num(child) || num(parent)) return num(child) && num(parent);
    return child.type === parent.type;
  }
  if (INT_NAMES.has(a) || INT_NAMES.has(b)) return a === b || (a === 'INT' && b === 'INTEGER') || (a === 'INTEGER' && b === 'INT');
  if (child.type === 'decimal' || child.type === 'int') return parent.type !== 'text' && (child.precision ?? 10) === (parent.precision ?? 10) && (child.scale ?? 0) === (parent.scale ?? 0);
  return child.type === parent.type;
}

/** Các column của table mà biểu thức `expr` nhắc tới (so theo từng chữ). */
export function columnsIn(expr: string, t: TableDef, d: Dialect): number[] {
  const hit = new Set<number>();
  for (const tok of tokenize(expr, d)) {
    if (tok.type !== 'word' && tok.type !== 'qident') continue;
    const i = t.columns.findIndex((c) => (tok.type === 'word' ? sameName(c.name, tok.text) : c.name === tok.value || sameName(c.name, tok.value)));
    if (i >= 0) hit.add(i);
  }
  return [...hit];
}

/** Đổi tên column trong biểu thức CHECK. */
export function renameIn(expr: string, from: string, to: string, d: Dialect): string {
  let out = '';
  let at = 0;
  for (const tok of tokenize(expr, d)) {
    if ((tok.type === 'word' && sameName(tok.text, from)) || (tok.type === 'qident' && tok.value === from)) {
      out += expr.slice(at, tok.s) + to;
      at = tok.e;
    }
  }
  return out + expr.slice(at);
}
