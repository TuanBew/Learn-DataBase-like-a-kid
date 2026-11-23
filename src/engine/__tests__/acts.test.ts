import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect, Trace } from '../index';
import { hr } from '../../data/hr';

/**
 * Trace nhiều màn: query ghép kết quả (setop), subquery trong FROM, WITH và window function.
 * Dữ liệu là database hr (src/data/hr.ts), kết quả đối chiếu bằng tay từ dữ liệu.
 */

const DIALECTS: Dialect[] = ['mysql', 'oracle'];
const each = (name: string, fn: (d: Dialect) => void) => {
  for (const d of DIALECTS) it(`[${d}] ${name}`, () => fn(d));
};
const trace = (sql: string, d: Dialect): Trace => {
  const r = run(sql, hr, d);
  if (!r.ok) throw new Error(`[${d}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return r.trace;
};
const minus = (d: Dialect) => (d === 'mysql' ? 'EXCEPT' : 'MINUS');
const dual = (d: Dialect) => (d === 'oracle' ? ' FROM DUAL' : '');

describe('trace của query ghép kết quả', () => {
  each('UNION: mỗi vế một màn branch, step setop loại row trùng', (d) => {
    const t = trace('SELECT department_id FROM departments WHERE department_id <= 30 UNION SELECT department_id FROM departments WHERE department_id BETWEEN 20 AND 60', d);
    expect(t.partial).toBeUndefined();
    expect(t.acts?.map((a) => [a.kind, a.name])).toEqual([['branch', 'vế 1'], ['branch', 'vế 2']]);
    expect(t.acts?.every((a) => a.trace.steps.length >= 2 && a.sql.startsWith('SELECT'))).toBe(true);
    expect(t.steps.map((s) => s.kind)).toEqual(['setop']);
    const s = t.steps[0];
    if (s.kind !== 'setop') throw new Error('không phải setop');
    expect(s.op).toBe('union');
    expect(s.left.map((r) => r.cells[0])).toEqual([10, 20, 30]);
    expect(s.right.map((r) => r.cells[0])).toEqual([20, 30, 60]);
    expect(s.rows.map((r) => r.cells[0])).toEqual([10, 20, 30, 60]);
    expect(s.removed.map((x) => x.why)).toEqual(['dup', 'dup']);
    // Row bị loại là hai row của vế phải, vì row của vế trái đứng trước.
    const rightIds = new Set(s.right.map((r) => r.id));
    expect(s.removed.every((x) => rightIds.has(x.id))).toBe(true);
    expect(s.left.length + s.right.length).toBe(s.rows.length + s.removed.length);
    expect(t.result.rows.map((r) => r[0])).toEqual([10, 20, 30, 60]);
    expect(t.result.rowIds).toEqual(s.rows.map((r) => r.id));
  });

  each('UNION ALL không loại row nào', (d) => {
    const t = trace('SELECT department_id FROM departments WHERE department_id <= 20 UNION ALL SELECT department_id FROM departments WHERE department_id <= 20', d);
    const s = t.steps[0];
    if (s.kind !== 'setop') throw new Error('không phải setop');
    expect(s.removed).toEqual([]);
    expect(s.rows).toHaveLength(4);
  });

  each('INTERSECT loại row của vế trái không có ở vế phải', (d) => {
    const t = trace('SELECT department_id FROM departments WHERE department_id <= 30 INTERSECT SELECT department_id FROM departments WHERE department_id >= 20', d);
    const s = t.steps[0];
    if (s.kind !== 'setop') throw new Error('không phải setop');
    expect(s.op).toBe('intersect');
    expect(s.rows.map((r) => r.cells[0])).toEqual([20, 30]);
    expect(s.removed.map((x) => x.why)).toEqual(['absent']);
    expect(s.left.find((r) => r.id === s.removed[0].id)?.cells[0]).toBe(10);
  });

  each('EXCEPT (MySQL) và MINUS (Oracle) loại row có ở vế phải', (d) => {
    const t = trace(`SELECT department_id FROM departments WHERE department_id <= 30 ${minus(d)} SELECT department_id FROM departments WHERE department_id >= 20`, d);
    const s = t.steps[0];
    if (s.kind !== 'setop') throw new Error('không phải setop');
    expect(s.op).toBe('except');
    expect(s.word.toUpperCase()).toBe(minus(d));
    expect(t.clauses[0].text).toBe(`FROM vế 1 ${minus(d)} vế 2`);
    expect(s.rows.map((r) => r.cells[0])).toEqual([10]);
    expect(s.removed.map((x) => x.why)).toEqual(['present', 'present']);
  });

  each('ghép ba vế: ba màn, hai step setop nối tiếp, id không đổi', (d) => {
    const t = trace(`SELECT 1 a${dual(d)} UNION SELECT 2${dual(d)} UNION ALL SELECT 2${dual(d)}`, d);
    expect(t.acts?.map((a) => a.name)).toEqual(['vế 1', 'vế 2', 'vế 3']);
    const [one, two] = t.steps;
    if (one.kind !== 'setop' || two.kind !== 'setop') throw new Error('không phải setop');
    expect(two.left.map((r) => r.id)).toEqual(one.rows.map((r) => r.id));
    expect(new Set([...two.left, ...two.right].map((r) => r.id)).size).toBe(two.left.length + two.right.length);
    expect(two.op).toBe('union all');
    expect(t.result.rows).toEqual([[1], [2], [2]]);
  });

  each('ORDER BY và LIMIT theo sau step setop', (d) => {
    const lim = d === 'mysql' ? 'LIMIT 2' : 'FETCH FIRST 2 ROWS ONLY';
    const t = trace(`SELECT department_id FROM departments UNION SELECT department_id FROM departments ORDER BY 1 DESC ${lim}`, d);
    expect(t.steps.map((s) => s.kind)).toEqual(['setop', 'order', 'limit']);
  });

  each('vế có ORDER BY và LIMIT riêng vẫn là một màn đủ step', (d) => {
    const lim = d === 'mysql' ? 'LIMIT 2' : 'FETCH FIRST 2 ROWS ONLY';
    const t = trace(`(SELECT department_id FROM departments ORDER BY 1 ${lim}) UNION ALL (SELECT department_id FROM departments ORDER BY 1 DESC ${lim})`, d);
    expect(t.acts?.[0].trace.steps.map((s) => s.kind)).toEqual(['from', 'select', 'order', 'limit']);
  });

  each('(A UNION B) có ORDER BY làm vế trái thì thành một màn có acts riêng', (d) => {
    const t = trace(`(SELECT 1 a${dual(d)} UNION SELECT 2${dual(d)} ORDER BY 1) UNION SELECT 3${dual(d)}`, d);
    expect(t.acts).toHaveLength(2);
    expect(t.acts?.[0].trace.acts).toHaveLength(2);
    expect(t.steps.map((s) => s.kind)).toEqual(['setop']);
  });

  each('MySQL đổi hai vế sang chữ khi lệch data type: step setop có cell đã đổi', (d) => {
    if (d !== 'mysql') return;
    const t = trace("SELECT 1 UNION SELECT 'x'", d);
    const s = t.steps[0];
    if (s.kind !== 'setop') throw new Error('không phải setop');
    expect(s.left[0].cells[0]).toBe('1');
    expect(s.columns[0].type).toBe('text');
  });
});

describe('trace của subquery trong FROM và WITH', () => {
  each('subquery trong FROM: một màn derived, step from ghi source', (d) => {
    const t = trace('SELECT t.department_id FROM (SELECT department_id FROM departments WHERE department_id > 100) t WHERE t.department_id > 110', d);
    expect(t.partial).toBeUndefined();
    expect(t.acts).toHaveLength(1);
    expect(t.acts?.[0].kind).toBe('derived');
    expect(t.acts?.[0].name).toBe('t');
    expect(t.acts?.[0].sql).toBe('SELECT department_id FROM departments WHERE department_id > 100');
    expect(t.acts?.[0].trace.steps.map((s) => s.kind)).toEqual(['from', 'where', 'select']);
    const from = t.steps[0];
    if (from.kind !== 'from') throw new Error('không phải from');
    expect(from.source).toBe('derived');
    expect(from.table).toBe('t');
    expect(t.acts?.[0].trace.result.rows).toEqual(from.rows.map((r) => r.cells));
  });

  each('table thật không có source, kể cả khi JOIN với subquery', (d) => {
    const t = trace('SELECT d.department_name, s.n FROM departments d JOIN (SELECT department_id, COUNT(*) n FROM employees GROUP BY department_id) s ON s.department_id = d.department_id', d);
    const [from, join] = t.steps;
    if (from.kind !== 'from' || join.kind !== 'join') throw new Error('sai step');
    expect(from.source).toBeUndefined();
    expect(join.source).toBe('derived');
    expect(t.acts).toHaveLength(1);
  });

  each('WITH dùng hai lần vẫn một màn cte; khối sau dùng khối trước thì hai màn', (d) => {
    const once = trace('WITH big AS (SELECT department_id FROM departments WHERE department_id > 100) SELECT a.department_id FROM big a JOIN big b ON a.department_id = b.department_id', d);
    expect(once.acts?.map((a) => [a.kind, a.name])).toEqual([['cte', 'big']]);
    const [from, join] = once.steps;
    if (from.kind !== 'from' || join.kind !== 'join') throw new Error('sai step');
    expect(from.source).toBe('cte');
    expect(join.source).toBe('cte');
    const two = trace('WITH a AS (SELECT department_id FROM departments), b AS (SELECT department_id FROM a WHERE department_id > 100) SELECT COUNT(*) FROM b', d);
    expect(two.acts?.map((x) => x.name)).toEqual(['a', 'b']);
    const inner = two.acts?.[1].trace.steps[0];
    if (inner?.kind !== 'from') throw new Error('không phải from');
    expect(inner.source).toBe('cte');
  });

  each('subquery trong FROM lồng nhau: acts lồng nhau', (d) => {
    const t = trace('SELECT x.n FROM (SELECT y.n FROM (SELECT department_id n FROM departments) y WHERE y.n > 100) x', d);
    expect(t.acts).toHaveLength(1);
    expect(t.acts?.[0].trace.acts).toHaveLength(1);
    expect(t.acts?.[0].trace.acts?.[0].name).toBe('y');
  });

  each('WITH đứng trước query ghép: màn cte rồi tới các vế', (d) => {
    const t = trace('WITH big AS (SELECT department_id FROM departments WHERE department_id > 100) SELECT department_id FROM big UNION SELECT department_id FROM big', d);
    expect(t.acts?.map((a) => a.kind)).toEqual(['cte', 'branch', 'branch']);
  });

  each('chỉ subquery phụ thuộc query ngoài mới partial', (d) => {
    expect(trace('SELECT employee_id FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)', d).partial).toBe(true);
    expect(trace('SELECT department_id FROM departments WHERE department_id IN (SELECT department_id FROM employees)', d).partial).toBeUndefined();
  });

  each('subquery trong WHERE không tạo màn', (d) => {
    expect(trace('SELECT department_id FROM departments WHERE department_id IN (SELECT department_id FROM employees)', d).acts).toBeUndefined();
  });
});

describe('trace của window function', () => {
  const rank = 'SELECT first_name, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) rk FROM employees WHERE employee_id < 106';

  each('step window đứng sau where, trước select; row không gộp lại', (d) => {
    const t = trace(rank, d);
    expect(t.partial).toBeUndefined();
    expect(t.steps.map((s) => s.kind)).toEqual(['from', 'where', 'window', 'select']);
    const w = t.steps[2];
    if (w.kind !== 'window') throw new Error('không phải window');
    expect(w.fns).toHaveLength(1);
    expect(w.fns[0]).toMatch(/^RANK\(\) OVER \(PARTITION BY department_id ORDER BY salary DESC\)$/);
    expect(w.partitionBy).toEqual(['department_id']);
    expect(w.orderBy).toEqual([{ text: 'salary', desc: true }]);
    expect(w.parts.map((p) => p.ids.length).reduce((a, b) => a + b, 0)).toBe(w.rows.length);
    expect(w.parts.length).toBeGreaterThan(1);
    expect(w.added).toEqual(['w0']);
    expect(w.columns.at(-1)?.key).toBe('w0');
    expect(w.rows.every((r) => r.cells.length === w.columns.length)).toBe(true);
    const where = t.steps[1];
    if (where.kind !== 'where') throw new Error('không phải where');
    expect(w.rows).toHaveLength(where.verdicts.filter((v) => v.pass).length);
  });

  each('select coi column của window là đã có: không nằm trong computed', (d) => {
    const t = trace(rank, d);
    const w = t.steps[2];
    const s = t.steps[3];
    if (w.kind !== 'window' || s.kind !== 'select') throw new Error('sai step');
    expect(s.columns.at(-1)?.key).toBe('w0');
    expect(s.computed).toEqual([]);
    // Column gốc không được chọn thì bị bỏ, column window không bị bỏ.
    expect(s.dropped).not.toContain('w0');
    expect(s.dropped.length).toBeGreaterThan(0);
    // Giá trị trong step window khớp kết quả.
    const byId = new Map(w.rows.map((r) => [r.id, r.cells.at(-1)]));
    expect(t.result.rowIds.map((id) => byId.get(id))).toEqual(t.result.rows.map((r) => r.at(-1)));
  });

  each('hai cụm OVER khác nhau: hai step, column cộng dồn', (d) => {
    const t = trace('SELECT first_name, RANK() OVER (ORDER BY salary DESC) a, SUM(salary) OVER (ORDER BY salary) b, ROW_NUMBER() OVER (ORDER BY salary DESC) c FROM employees WHERE employee_id < 106', d);
    const ws = t.steps.filter((s) => s.kind === 'window');
    expect(ws).toHaveLength(2);
    const [x, y] = ws;
    if (x.kind !== 'window' || y.kind !== 'window') throw new Error('không phải window');
    // RANK và ROW_NUMBER cùng OVER (ORDER BY salary DESC) nên chung một step.
    expect(x.fns).toHaveLength(2);
    expect(x.added).toEqual(['w0', 'w2']);
    expect(y.added).toEqual(['w1']);
    expect(y.columns.length).toBe(x.columns.length + 1);
    expect(x.parts).toHaveLength(1);
  });

  each('không có PARTITION BY thì một phần chứa mọi row', (d) => {
    const t = trace('SELECT salary, SUM(salary) OVER (ORDER BY salary) run FROM employees WHERE employee_id < 104', d);
    const w = t.steps.find((s) => s.kind === 'window');
    if (w?.kind !== 'window') throw new Error('không phải window');
    expect(w.partitionBy).toEqual([]);
    expect(w.parts).toHaveLength(1);
    expect(w.parts[0].label).toBe('');
    expect(w.parts[0].ids).toHaveLength(w.rows.length);
  });

  each('window sau GROUP BY: step window nằm sau group và having', (d) => {
    const t = trace('SELECT department_id, SUM(salary) s, RANK() OVER (ORDER BY SUM(salary) DESC) rk FROM employees WHERE department_id IS NOT NULL GROUP BY department_id', d);
    expect(t.steps.map((s) => s.kind)).toEqual(['from', 'where', 'group', 'window', 'select']);
    const w = t.steps[3];
    if (w.kind !== 'window') throw new Error('không phải window');
    expect(w.columns.map((c) => c.key)).toEqual(['g0', 'a0', 'w0']);
  });

  each('window dùng trong biểu thức: column window bị mờ đi, column x mới do tính toán', (d) => {
    const t = trace('SELECT first_name, RANK() OVER (ORDER BY salary) + 1 r FROM employees WHERE employee_id < 104', d);
    const s = t.steps.find((x) => x.kind === 'select');
    if (s?.kind !== 'select') throw new Error('không phải select');
    expect(s.computed).toEqual(['x0']);
    expect(s.dropped).toContain('w0');
  });
});
