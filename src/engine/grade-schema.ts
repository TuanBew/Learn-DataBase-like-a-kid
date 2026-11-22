import type { ColumnDef, ColumnType, Database, Dialect, TableDef } from './types';
import { constraintsOf, deepClone, findTableIn, pkOf, sameName } from './catalog';
import { defaultValue, dialectType } from './describe';
import { createSession } from './session';
import type { ColumnSpec, Probe, SchemaCheck, SchemaReport, SchemaSpec, TableSpec } from './schema-spec';

/**
 * Chấm bài "dựng table": so cấu trúc database của người học với `SchemaSpec`.
 * Điều spec không ghi thì không chấm. Tên table và column không phân biệt hoa thường.
 */

const GROUP: Record<ColumnType, string> = { int: 'số nguyên', decimal: 'số thập phân', text: 'chữ', date: 'ngày', datetime: 'ngày giờ' };

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.some((y) => sameName(x, y)));

/** Tìm chỗ lệch giữa một column và điều spec ghi. Rỗng là khớp. */
function columnProblems(t: TableDef, c: ColumnDef, s: ColumnSpec, d: Dialect): string[] {
  const out: string[] = [];
  const cons = constraintsOf(t);
  const pk = pkOf(t);
  const inPk = !!pk?.columns.some((n) => sameName(n, c.name));

  const groups = Array.isArray(s.type) ? s.type : [s.type];
  if (!groups.includes(c.type)) out.push(`Data type đang là ${dialectType(c, d).toUpperCase()}, cần kiểu ${groups.map((g) => GROUP[g]).join(' hoặc ')}.`);
  else if (s.minLength !== undefined && c.length !== undefined && c.length < s.minLength) out.push(`Độ dài mới là ${c.length}, cần từ ${s.minLength} trở lên.`);
  if (s.pk) {
    if (!inPk) out.push('Column này chưa là primary key.');
    else if (pk!.columns.length > 1) out.push('Primary key đang gồm nhiều column, đề chỉ cần một.');
  }
  if (s.identity && !c.identity) out.push(d === 'mysql' ? 'Column này chưa tự tăng (AUTO_INCREMENT).' : 'Column này chưa tự tăng (GENERATED AS IDENTITY).');
  // primary key luôn kéo theo NOT NULL.
  if (s.notNull && !c.notNull && !inPk) out.push('Column này chưa có NOT NULL.');
  if (s.unique) {
    const uniq = cons.some((k) => k.kind === 'unique' && k.columns.length === 1 && sameName(k.columns[0], c.name));
    if (!uniq && !(inPk && pk!.columns.length === 1)) out.push('Column này chưa có UNIQUE.');
  }
  if (s.default !== undefined) {
    const have = defaultValue(c);
    const ok = have !== null && (typeof have === 'number' || typeof s.default === 'number' ? Number(have) === Number(s.default) && !Number.isNaN(Number(have)) : have === s.default);
    if (!ok) out.push(`DEFAULT chưa đúng, cần ${s.default}.`);
  }
  if (s.fk) {
    const k = cons.find((x) => x.kind === 'fk' && x.columns.some((n) => sameName(n, c.name)));
    if (!k || k.kind !== 'fk') out.push(`Column này chưa có foreign key trỏ tới ${s.fk.table}.${s.fk.column}.`);
    else {
      const i = k.columns.findIndex((n) => sameName(n, c.name));
      if (!sameName(k.refTable, s.fk.table) || !sameName(k.refColumns[i], s.fk.column)) out.push(`Foreign key đang trỏ tới ${k.refTable}.${k.refColumns[i]}, cần trỏ tới ${s.fk.table}.${s.fk.column}.`);
      else if (s.fk.onDelete && k.onDelete !== s.fk.onDelete) out.push(`Foreign key chưa có ON DELETE ${s.fk.onDelete.toUpperCase()}.`);
    }
  }
  return out;
}

function tableChecks(db: Database, t: TableSpec, d: Dialect): SchemaCheck[] {
  const found = findTableIn(db, t.name);
  const checks: SchemaCheck[] = [{ id: `table:${t.name}`, label: `Có table ${t.name}`, ok: !!found, note: found ? undefined : 'Chưa có table này.' }];
  const missing = 'Chưa có table này.';
  const pkCols = t.columns.filter((c) => c.pk).length;

  for (const s of t.columns) {
    const id = `${t.name}.${s.name}`;
    if (!found) {
      checks.push({ id, label: s.label, ok: false, note: missing });
      continue;
    }
    const c = found.columns.find((x) => sameName(x.name, s.name));
    if (!c) {
      checks.push({ id, label: s.label, ok: false, note: `Chưa có column ${s.name}.` });
      continue;
    }
    const probs = columnProblems(found, c, s, d);
    // Spec có nhiều column pk: coi là một primary key ghép, nên không đòi "chỉ một column".
    const list = pkCols > 1 ? probs.filter((p) => !p.startsWith('Primary key đang gồm')) : probs;
    checks.push({ id, label: s.label, ok: list.length === 0, note: list.length ? list.join(' ') : undefined });
  }

  if (t.primaryKey) {
    const pk = found ? pkOf(found) : undefined;
    const ok = !!pk && same(pk.columns, t.primaryKey);
    const note = ok ? undefined : !found ? missing : !pk ? 'Table chưa có primary key.' : `Primary key đang là (${pk.columns.join(', ')}), cần (${t.primaryKey.join(', ')}).`;
    checks.push({ id: `${t.name}:pk`, label: `Primary key ghép (${t.primaryKey.join(', ')})`, ok, note });
  }

  if (!t.allowExtra) {
    const extra = found ? found.columns.filter((c) => !t.columns.some((s) => sameName(s.name, c.name))).map((c) => c.name) : [];
    checks.push({
      id: `${t.name}:extra`,
      label: `Table ${t.name} chỉ có các column của đề`,
      ok: !!found && extra.length === 0,
      note: !found ? missing : extra.length ? `Có column ngoài đề: ${extra.join(', ')}.` : undefined,
    });
  }
  if (t.minRows !== undefined) {
    const n = found?.rows.length ?? 0;
    checks.push({
      id: `${t.name}:rows`,
      label: `Table ${t.name} có ít nhất ${t.minRows} row`,
      ok: !!found && n >= t.minRows,
      note: !found ? missing : n >= t.minRows ? undefined : `Table đang có ${n} row, cần từ ${t.minRows} trở lên.`,
    });
  }
  return checks;
}

function probeCheck(db: Database, p: Probe, d: Dialect): SchemaCheck | undefined {
  const sql = p.sql[d];
  if (sql === undefined) return undefined;
  const base = { id: p.id, label: p.label };
  const s = createSession(deepClone(db), d);
  for (const step of p.setup?.[d] ?? []) {
    const r = s.run(step);
    if (!r.ok) return { ...base, ok: false, note: `Chưa thử được, vì lệnh chuẩn bị báo lỗi ${r.error.code}. Kiểm tra lại table và column.` };
  }
  const r = s.run(sql);
  if (p.expect === 'ok') return { ...base, ok: r.ok, note: r.ok ? undefined : `Lệnh thử báo lỗi ${r.error.code}, trong khi table phải nhận lệnh này.` };
  return { ...base, ok: !r.ok, note: r.ok ? 'Lệnh thử chạy được, trong khi table phải chặn lệnh này.' : undefined };
}

/** Chấm database của người học. Không đổi `db`. */
export function gradeSchema(db: Database, spec: SchemaSpec, dialect: Dialect): SchemaReport {
  const checks: SchemaCheck[] = spec.tables.flatMap((t) => tableChecks(db, t, dialect));
  for (const p of spec.probes ?? []) {
    const c = probeCheck(db, p, dialect);
    if (c) checks.push(c);
  }
  return { ok: checks.every((c) => c.ok), checks };
}
