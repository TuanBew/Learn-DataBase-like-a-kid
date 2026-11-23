import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect, Trace } from '../index';
import { buildFrames, firstFrameOf, screensOf } from '../../theater/frames';
import { hr } from '../../data/hr';

/** Khung hình Theater cho query nhiều màn: query ghép, subquery trong FROM, WITH, window function. */

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

describe('buildFrames: nhiều màn', () => {
  each('query một màn: một screen, không khung stash', (d) => {
    const f = buildFrames(trace('SELECT department_id FROM departments', d));
    expect(f.every((x) => x.screen.total === 1 && x.screen.kind === 'main' && x.stash === null)).toBe(true);
    expect(f.some((x) => x.phase === 'stash')).toBe(false);
  });

  each('subquery trong FROM: hai màn, màn phụ đóng bằng khung stash mang tên alias', (d) => {
    const t = trace('SELECT t.department_id FROM (SELECT department_id FROM departments WHERE department_id > 20) t WHERE t.department_id > 60', d);
    expect(screensOf(t).map((s) => [s.kind, s.name])).toEqual([['derived', 't'], ['main', '']]);
    const f = buildFrames(t);
    expect(new Set(f.map((x) => x.screen.index))).toEqual(new Set([0, 1]));
    // Các khung của mỗi màn đứng liền nhau, màn phụ trước.
    expect(f.map((x) => x.screen.index)).toEqual([...f.map((x) => x.screen.index)].sort());
    expect(f[0].phase).toBe('written');
    expect(f[0].caption).toMatch(/^Màn 1 trên 2: subquery t trong FROM chạy trước\./);
    const stash = f.filter((x) => x.phase === 'stash');
    expect(stash).toHaveLength(1);
    expect(stash[0].stash).toBe('t');
    expect(stash[0].rows.map((r) => r.cells[stash[0].cols[0].key])).toEqual([30, 60, 80, 90, 110, 120]);
    expect(stash[0].caption).toContain('table t');
    const main = f.find((x) => x.screen.index === 1)!;
    expect(main.caption).toMatch(/^Màn 2 trên 2: query chính/);
    expect(f.at(-1)?.phase).toBe('done');
    // Màn chính nhận table t từ màn trước.
    expect(f.find((x) => x.phase === 'from' && x.screen.index === 1)?.caption).toContain('kết quả của màn trước');
  });

  each('mỗi khung mang đúng dãy clause và focus của màn của nó', (d) => {
    const t = trace('SELECT t.department_id FROM (SELECT department_id FROM departments WHERE department_id > 20) t', d);
    const f = buildFrames(t);
    const inner = f.find((x) => x.screen.index === 0)!;
    const outer = f.find((x) => x.screen.index === 1)!;
    expect(inner.clauses).toBe(t.acts![0].trace.clauses);
    expect(outer.clauses).toBe(t.clauses);
    expect(inner.clauses.some((c) => c.kind === 'WHERE')).toBe(true);
  });

  each('WITH hai khối nối nhau: ba màn, màn chính cuối', (d) => {
    const t = trace('WITH a AS (SELECT department_id FROM departments), b AS (SELECT department_id FROM a WHERE department_id > 60) SELECT COUNT(*) FROM b', d);
    const f = buildFrames(t);
    expect(f.at(-1)?.screen).toMatchObject({ index: 2, total: 3, kind: 'main' });
    expect(f.filter((x) => x.phase === 'stash').map((x) => x.stash)).toEqual(['a', 'b']);
    expect(f.filter((x) => x.phase === 'written').map((x) => x.screen.kind)).toEqual(['cte', 'cte', 'main']);
  });

  each('subquery lồng nhau: màn trong cùng chạy trước', (d) => {
    const t = trace('SELECT x.n FROM (SELECT y.n FROM (SELECT department_id n FROM departments) y WHERE y.n > 60) x', d);
    expect(screensOf(t).map((s) => s.name)).toEqual(['y', 'x', '']);
    expect(buildFrames(t).filter((x) => x.phase === 'stash').map((x) => x.stash)).toEqual(['y', 'x']);
  });

  each('firstFrameOf chỉ tìm trong màn được hỏi', (d) => {
    const t = trace('SELECT t.department_id FROM (SELECT department_id FROM departments WHERE department_id > 20) t', d);
    const f = buildFrames(t);
    const a = firstFrameOf(f, 0, 0);
    const b = firstFrameOf(f, 0, 1);
    expect(f[a].screen.index).toBe(0);
    expect(f[b].screen.index).toBe(1);
  });

  each('hàm thuần: gọi hai lần cho cùng kết quả', (d) => {
    const t = trace('SELECT department_id FROM departments UNION SELECT department_id FROM departments', d);
    expect(JSON.stringify(buildFrames(t))).toBe(JSON.stringify(buildFrames(t)));
  });
});

describe('buildFrames: query ghép kết quả', () => {
  each('UNION: hai màn vế rồi màn chính, khung setop thả row trùng', (d) => {
    const t = trace('SELECT department_id FROM departments WHERE department_id <= 30 UNION SELECT department_id FROM departments WHERE department_id BETWEEN 20 AND 60', d);
    const f = buildFrames(t);
    expect(screensOf(t).map((s) => s.name)).toEqual(['vế 1', 'vế 2', '']);
    expect(f.filter((x) => x.phase === 'stash').map((x) => x.stash)).toEqual(['vế 1', 'vế 2']);
    expect(f.find((x) => x.screen.index === 2 && x.phase === 'written')?.caption).toContain('ghép kết quả của các vế');
    const arrive = f.find((x) => x.phase === 'setop' && x.side)!;
    expect(arrive.side?.rows).toHaveLength(3);
    expect(arrive.rows).toHaveLength(3);
    const merge = f.find((x) => x.phase === 'setop' && !x.side && x.rows.some((r) => r.mark === 'dup'))!;
    expect(merge.rows).toHaveLength(6);
    expect(merge.rows.filter((r) => r.mark === 'dup').map((r) => r.note)).toEqual(['trùng', 'trùng']);
    expect(merge.count).toBe(4);
    const last = f.at(-1)!;
    expect(last.rows).toHaveLength(4);
  });

  each('UNION ALL không có row rơi', (d) => {
    const f = buildFrames(trace('SELECT 1 a' + (d === 'oracle' ? ' FROM DUAL' : '') + ' UNION ALL SELECT 1' + (d === 'oracle' ? ' FROM DUAL' : ''), d));
    expect(f.flatMap((x) => x.rows).some((r) => r.mark === 'dup')).toBe(false);
    expect(f.at(-1)?.rows).toHaveLength(2);
  });

  each('INTERSECT: row không có ở vế kia rơi kèm lý do, vế kia ở yên bên dưới', (d) => {
    const t = trace('SELECT department_id FROM departments WHERE department_id <= 30 INTERSECT SELECT department_id FROM departments WHERE department_id >= 20', d);
    const verdict = buildFrames(t).find((x) => x.phase === 'setop' && x.rows.some((r) => r.mark === 'fail'))!;
    expect(verdict.side).not.toBeNull();
    expect(verdict.rows.filter((r) => r.mark === 'fail').map((r) => r.note)).toEqual(['không có ở vế 2']);
    expect(verdict.rows.filter((r) => r.mark === 'passed')).toHaveLength(2);
    expect(verdict.count).toBe(2);
  });

  each('EXCEPT và MINUS: row có ở vế kia rơi kèm lý do', (d) => {
    const t = trace(`SELECT department_id FROM departments WHERE department_id <= 30 ${minus(d)} SELECT department_id FROM departments WHERE department_id >= 20`, d);
    const f = buildFrames(t);
    const verdict = f.find((x) => x.phase === 'setop' && x.rows.some((r) => r.mark === 'fail'))!;
    expect(verdict.rows.filter((r) => r.mark === 'fail').map((r) => r.note)).toEqual(['có ở vế 2', 'có ở vế 2']);
    expect(verdict.caption).toContain(minus(d));
    expect(f.at(-1)?.rows).toHaveLength(1);
  });

  each('ba vế: hai lượt setop, lượt sau bắt đầu từ kết quả vừa ghép', (d) => {
    const from = d === 'oracle' ? ' FROM DUAL' : '';
    const f = buildFrames(trace(`SELECT 1 a${from} UNION SELECT 2${from} UNION ALL SELECT 3${from}`, d));
    expect(f.filter((x) => x.phase === 'written').map((x) => x.screen.index)).toEqual([0, 1, 2, 3]);
    const carry = f.filter((x) => x.phase === 'setop' && x.caption.startsWith('Kết quả vừa ghép'));
    expect(carry).toHaveLength(1);
    expect(carry[0].rows).toHaveLength(2);
    expect(f.at(-1)?.rows.map((r) => Object.values(r.cells)[0])).toEqual([1, 2, 3]);
  });

  each('ORDER BY và LIMIT của query ghép vẫn diễn sau khung setop', (d) => {
    const lim = d === 'mysql' ? 'LIMIT 2' : 'FETCH FIRST 2 ROWS ONLY';
    const f = buildFrames(trace(`SELECT department_id FROM departments UNION SELECT department_id FROM departments ORDER BY 1 DESC ${lim}`, d));
    const phases = f.filter((x) => x.screen.kind === 'main').map((x) => x.phase);
    expect(phases.indexOf('setop')).toBeLessThan(phases.indexOf('order'));
    expect(phases.indexOf('order')).toBeLessThan(phases.indexOf('limit'));
    expect(f.at(-1)?.rows).toHaveLength(2);
  });

  each('chế độ gọn: hơn 24 row vẫn dựng được và không vẽ quá 10 row', (d) => {
    const t = trace('SELECT employee_id FROM employees UNION ALL SELECT employee_id FROM employees UNION ALL SELECT employee_id FROM employees', d);
    const f = buildFrames(t);
    expect(f.every((x) => x.rows.length <= 10 || !x.more)).toBe(true);
    expect(f.filter((x) => x.screen.kind === 'main' && x.phase === 'setop').some((x) => x.more !== null)).toBe(true);
    expect(f.at(-1)?.count).toBe(t.result.rows.length);
  });

  each('khung nào cũng không có hai row trùng id', (d) => {
    const t = trace('SELECT department_id FROM departments UNION SELECT department_id FROM employees WHERE department_id IS NOT NULL ORDER BY 1', d);
    for (const x of buildFrames(t)) {
      const ids = x.rows.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('buildFrames: window function', () => {
  const rank = 'SELECT first_name, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) rk FROM employees WHERE employee_id < 106';

  each('PARTITION BY: tô màu theo phần, sắp trong phần, rồi column mới hiện', (d) => {
    const t = trace(rank, d);
    const f = buildFrames(t);
    const w = f.filter((x) => x.phase === 'window');
    expect(w).toHaveLength(3);
    expect(f.at(-1)?.screen.total).toBe(1);
    // Bước 1: row cùng phần cùng tone, cột mới chưa hiện.
    expect(w[0].rows.every((r) => r.tone !== undefined)).toBe(true);
    expect(new Set(w[0].rows.map((r) => r.tone)).size).toBe(2);
    expect(w[0].cols.some((c) => c.state === 'new')).toBe(false);
    expect(w[0].boxes).toHaveLength(0);
    // Bước 2: row đổi chỗ, mỗi phần nằm trong một hộp.
    expect(w[1].boxes.map((b) => [b.label, b.size])).toEqual([['60', 3], ['90', 3]]);
    expect(w[1].boxes.map((b) => b.start)).toEqual([0, 3]);
    expect(w[1].caption).toContain('Trong mỗi phần');
    // Bước 3: column mới, mỗi row có giá trị. Row không gộp lại.
    expect(w[2].cols.filter((c) => c.state === 'new').map((c) => c.key)).toEqual(['w0']);
    expect(w[2].rows).toHaveLength(w[0].rows.length);
    expect(w[2].rows.every((r) => typeof r.cells.w0 === 'number')).toBe(true);
    expect(w[2].caption).toContain('Row không gộp lại');
    // Sau SELECT, column giữ lại là first_name, salary và rk.
    expect(f.at(-1)?.cols.map((c) => c.header)).toEqual(t.result.columns);
    expect(f.at(-1)?.rows.map((r) => f.at(-1)!.cols.map((c) => r.cells[c.key]))).toEqual(t.result.rows);
  });

  each('không PARTITION BY: không hộp, mọi row một phần', (d) => {
    const f = buildFrames(trace('SELECT salary, SUM(salary) OVER (ORDER BY salary) run FROM employees WHERE employee_id < 104', d));
    const w = f.filter((x) => x.phase === 'window');
    expect(w[0].caption).toContain('Không có PARTITION BY');
    expect(w.every((x) => x.boxes.length === 0)).toBe(true);
    expect(w[1].caption).toContain('Các row xếp theo salary');
  });

  each('không ORDER BY: lời dẫn nói row giữ thứ tự cũ', (d) => {
    const f = buildFrames(trace('SELECT first_name, COUNT(*) OVER (PARTITION BY department_id) n FROM employees WHERE employee_id < 106', d));
    expect(f.filter((x) => x.phase === 'window')[1].caption).toContain('Không có ORDER BY');
  });

  each('hai cụm OVER: hai lượt window, column cộng dồn', (d) => {
    const t = trace('SELECT first_name, RANK() OVER (ORDER BY salary DESC) a, SUM(salary) OVER (ORDER BY salary) b FROM employees WHERE employee_id < 106', d);
    const w = buildFrames(t).filter((x) => x.phase === 'window');
    expect(w).toHaveLength(6);
    expect(w[5].cols.filter((c) => c.key.startsWith('w')).map((c) => c.key)).toEqual(['w0', 'w1']);
  });

  each('window sau GROUP BY: hộp group rồi hộp window', (d) => {
    const f = buildFrames(trace('SELECT department_id, SUM(salary) s, RANK() OVER (ORDER BY SUM(salary) DESC) rk FROM employees WHERE department_id IS NOT NULL GROUP BY department_id', d));
    const phases = f.map((x) => x.phase);
    expect(phases.indexOf('group')).toBeLessThan(phases.indexOf('window'));
    expect(phases.lastIndexOf('window')).toBeLessThan(phases.indexOf('select'));
  });

  each('chế độ gọn với window: hơn 24 row vẫn dựng được', (d) => {
    const f = buildFrames(trace('SELECT employee_id, RANK() OVER (PARTITION BY department_id ORDER BY salary) r FROM employees UNION ALL SELECT employee_id, 1 FROM employees UNION ALL SELECT employee_id, 1 FROM employees', d));
    expect(f.at(-1)?.phase).toBe('done');
    const big = buildFrames(trace('SELECT e.employee_id, e.salary, RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary) r FROM employees e, employees x WHERE x.employee_id < 103', d));
    const w = big.filter((x) => x.phase === 'window');
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((x) => x.rows.length <= 10)).toBe(true);
    expect(w.every((x) => x.more !== null)).toBe(true);
    expect(w.every((x) => x.boxes.length === 0)).toBe(true);
    expect(big.at(-1)?.phase).toBe('done');
  });
});

describe('buildFrames: dòng partial', () => {
  each('chỉ subquery phụ thuộc query ngoài mới còn partial', (d) => {
    const t = trace('SELECT employee_id FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)', d);
    expect(screensOf(t).some((s) => s.trace.partial)).toBe(true);
    const u = trace('SELECT department_id FROM departments UNION SELECT department_id FROM employees', d);
    expect(screensOf(u).some((s) => s.trace.partial)).toBe(false);
  });
});
