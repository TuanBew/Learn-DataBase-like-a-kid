import { describe, expect, it } from 'vitest';
import { createSession, gradeSchema, run } from '../engine';
import type { SchemaSpec } from '../engine';
import type { Database, Dialect, RawValue } from '../engine/types';
import { exercise as e1 } from '../content/exercises/c3-e1';
import { exercise as e3 } from '../content/exercises/c3-e3';
import { exercise as e4 } from '../content/exercises/c3-e4';
import { exercise as e5 } from '../content/exercises/c3-e5';
import { exercise as e7 } from '../content/exercises/c3-e7';
import { saomai } from './saomai';

const t = (name: string) => {
  const tb = saomai.tables.find((x) => x.name === name);
  if (!tb) throw new Error(`thiếu table ${name}`);
  return tb;
};
const col = (table: string, c: string): RawValue[] => {
  const i = t(table).columns.findIndex((x) => x.name === c);
  if (i < 0) throw new Error(`thiếu column ${table}.${c}`);
  return t(table).rows.map((r) => r[i]);
};
const set = (table: string, c: string) => new Set(col(table, c));
const both: Dialect[] = ['mysql', 'oracle'];
const exercises = [e1, e3, e4, e5, e7];

describe('saomai: cấu trúc và dữ liệu', () => {
  it('tên database và số row', () => {
    expect(saomai.name).toBe('saomai');
    expect(saomai.tables.map((x) => x.name)).toEqual(['departments', 'employees', 'projects', 'assignments', 'leave_requests']);
    const counts = Object.fromEntries(saomai.tables.map((x) => [x.name, x.rows.length]));
    expect(counts).toEqual({ departments: 5, employees: 18, projects: 6, assignments: 25, leave_requests: 15 });
  });

  it('mỗi row đủ column, mỗi column có label, mỗi table có about', () => {
    for (const tb of saomai.tables) {
      expect(tb.about).toBeTruthy();
      for (const c of tb.columns) expect(c.label).toBeTruthy();
      for (const r of tb.rows) expect(r).toHaveLength(tb.columns.length);
    }
  });

  it('primary key và các column UNIQUE không trùng', () => {
    for (const tb of saomai.tables) {
      const idx = tb.columns.map((c, i) => (c.pk ? i : -1)).filter((i) => i >= 0);
      const keys = tb.rows.map((r) => idx.map((i) => r[i]).join('|'));
      expect(new Set(keys).size).toBe(tb.rows.length);
      tb.columns.forEach((c, i) => {
        if (!c.unique) return;
        const vals = tb.rows.map((r) => r[i]).filter((v) => v !== null);
        expect(new Set(vals).size, `${tb.name}.${c.name}`).toBe(vals.length);
      });
    }
  });

  it('column NOT NULL không có NULL, CHECK và độ dài được giữ', () => {
    for (const tb of saomai.tables) {
      tb.columns.forEach((c, i) => {
        if (c.notNull) for (const r of tb.rows) expect(r[i], `${tb.name}.${c.name}`).not.toBeNull();
        if (c.length) for (const r of tb.rows) if (r[i] !== null) expect((r[i] as string).length).toBeLessThanOrEqual(c.length);
      });
    }
    expect(col('employees', 'salary').every((v) => (v as number) > 0)).toBe(true);
    expect(col('assignments', 'hours_per_week').every((v) => (v as number) >= 1 && (v as number) <= 40)).toBe(true);
    expect(col('projects', 'budget').every((v) => v === null || (v as number) >= 0)).toBe(true);
    for (const p of t('projects').rows) if (p[3] !== null) expect((p[3] as string) >= (p[2] as string)).toBe(true);
    for (const l of t('leave_requests').rows) expect((l[3] as string) >= (l[2] as string)).toBe(true);
  });

  it('mọi foreign key trỏ tới row có thật', () => {
    for (const tb of saomai.tables) {
      tb.columns.forEach((c, i) => {
        if (!c.fk) return;
        const target = set(c.fk.table, c.fk.column);
        for (const r of tb.rows) if (r[i] !== null) expect(target.has(r[i]), `${tb.name}.${c.name}=${r[i]}`).toBe(true);
      });
    }
    const fks = saomai.tables.flatMap((tb) => tb.columns.filter((c) => c.fk).map((c) => `${tb.name}.${c.name}`));
    expect(fks).toEqual([
      'employees.department_id', 'employees.manager_id', 'assignments.employee_id', 'assignments.project_id',
      'leave_requests.employee_id', 'leave_requests.approved_by',
    ]);
  });
});

describe('saomai: tình huống để dạy', () => {
  const emps = t('employees').rows;
  const byId = new Map(emps.map((e) => [e[0] as number, e]));

  it('18 nhân viên, 1 người không có sếp, 1 người chưa có phòng, cây sâu từ 3 tầng', () => {
    expect(emps).toHaveLength(18);
    expect(emps.filter((e) => e[6] === null)).toHaveLength(1);
    expect(emps.filter((e) => e[5] === null)).toHaveLength(1);
    const depth = (id: number) => {
      let d = 1;
      for (let cur = byId.get(id)!; cur[6] !== null; cur = byId.get(cur[6] as number)!) d++;
      return d;
    };
    expect(Math.max(...emps.map((e) => depth(e[0] as number)))).toBeGreaterThanOrEqual(3);
    expect(col('employees', 'phone').some((v) => v === null)).toBe(true);
  });

  it('phòng có NULL ở location và có giá trị trùng', () => {
    const loc = col('departments', 'location');
    expect(loc.some((v) => v === null)).toBe(true);
    expect(new Set(loc).size).toBeLessThan(loc.length);
  });

  it('1 dự án chưa có ai, phân công không trùng cặp, có vai trò trùng để GROUP BY', () => {
    const used = set('assignments', 'project_id');
    expect(col('projects', 'project_id').filter((p) => !used.has(p))).toHaveLength(1);
    expect(col('projects', 'end_date').some((v) => v === null)).toBe(true);
    const roles = col('assignments', 'role_name');
    expect(new Set(roles).size).toBeLessThan(roles.length);
  });

  it('đơn nghỉ phép đủ ba trạng thái; chỉ đơn pending chưa có người duyệt', () => {
    const rows = t('leave_requests').rows;
    expect(new Set(rows.map((r) => r[5]))).toEqual(new Set(['pending', 'approved', 'rejected']));
    for (const r of rows) expect(r[6] === null).toBe(r[5] === 'pending');
    expect(rows.some((r) => r[4] === null)).toBe(true);
    expect(rows.some((r) => r[2] === r[3])).toBe(true);
  });
});

describe('saomai: khớp lời giải của Chương 3', () => {
  /** Dựng database bằng lời giải của 5 bài, như người học làm. */
  const built = (d: Dialect) => {
    const s = createSession({ name: 'saomai', tables: [] }, d);
    for (const e of exercises) expect(s.runScript(e.solution[d]!).failedAt).toBeUndefined();
    return s.db();
  };
  const shape = (db: Database) =>
    db.tables.map((tb) => ({
      name: tb.name,
      columns: tb.columns.map((c) => ({
        // Oracle: NUMBER không kèm (p,s) là số nguyên với database mẫu, nhưng engine ghi nhóm decimal.
        name: c.name, type: c.type === 'decimal' && c.precision === undefined ? 'int' : c.type, length: c.length, precision: c.precision, scale: c.scale, default: c.default,
        identity: !!c.identity, notNull: !!c.notNull, unique: !!c.unique, pk: !!c.pk, fk: c.fk,
      })),
      checks: tb.checks ?? [],
    }));

  it.each(both)('từng column và luật giống database người học dựng, %s', (d) => {
    expect(shape(saomai)).toEqual(shape(built(d)));
  });

  /**
   * Spec của 5 bài gộp lại. Các probe thêm row thử vào table, và vài probe giả định table còn trống
   * (ví dụ thêm phòng mã 1). Với database đã đầy dữ liệu, probe đó sẽ lệch vì lý do khác, nên:
   * - kiểm cấu trúc trên database đầy đủ, bỏ các probe;
   * - kiểm toàn bộ spec, kể cả probe, trên bản sao đã xóa hết row.
   */
  const emptied = (): Database => {
    const db: Database = JSON.parse(JSON.stringify(saomai));
    for (const tb of db.tables) tb.rows = [];
    return db;
  };
  /** gradeSchema đọc database của session, nơi các luật đã dựng từ cờ pk, unique, fk. Làm đúng như app. */
  const inSession = (db: Database, d: Dialect): Database => createSession(JSON.parse(JSON.stringify(db)), d).db();

  /** Database cuối có thêm `employees.phone` (bài c3-e7), nên spec của các bài trước phải cho phép column thừa ở employees. */
  const tablesOf = (e: (typeof exercises)[number]) => e.spec.tables.map((x) => (x.name === 'employees' ? { ...x, allowExtra: true } : x));

  it.each(both)('gradeSchema: cấu trúc của c3-e1, e3, e4, e5, e7 đạt trên database đầy đủ, %s', (d) => {
    for (const e of exercises) {
      const spec: SchemaSpec = { tables: tablesOf(e) };
      const rep = gradeSchema(inSession(saomai, d), spec, d);
      expect(rep.checks.filter((c) => !c.ok), e.id).toEqual([]);
      expect(rep.checks.length).toBeGreaterThan(0);
    }
  });

  it.each(both)('gradeSchema: cả probe đạt trên bản sao đã xóa row, %s', (d) => {
    for (const e of exercises) {
      const rep = gradeSchema(inSession(emptied(), d), { ...e.spec, tables: tablesOf(e) }, d);
      expect(rep.checks.filter((c) => !c.ok), e.id).toEqual([]);
      expect(rep.checks.length).toBeGreaterThan(e.spec.tables.length);
    }
  });
});

describe('saomai: query chạy thật qua engine', () => {
  const rows = (sql: string, d: Dialect) => {
    const r = run(sql, saomai, d);
    if (!r.ok) throw new Error(`${d}: ${r.error.code} ${r.error.message}`);
    return r.result.rows;
  };

  it.each(both)('đếm và lọc NULL, %s', (d) => {
    expect(rows('SELECT COUNT(*) FROM employees', d)).toEqual([[18]]);
    expect(rows('SELECT full_name FROM employees WHERE manager_id IS NULL', d)).toEqual([['Trịnh Văn Long']]);
    expect(rows('SELECT COUNT(*) FROM employees WHERE department_id IS NULL', d)).toEqual([[1]]);
  });

  it.each(both)('GROUP BY số đơn nghỉ theo trạng thái, %s', (d) => {
    expect(rows('SELECT status, COUNT(*) FROM leave_requests GROUP BY status ORDER BY status', d)).toEqual([
      ['approved', 8], ['pending', 4], ['rejected', 3],
    ]);
  });

  it.each(both)('JOIN nhân viên với phòng, và LEFT JOIN tìm dự án chưa có ai, %s', (d) => {
    const r = rows('SELECT e.full_name, d.name FROM employees e JOIN departments d ON e.department_id = d.department_id', d);
    expect(r).toHaveLength(17);
    const empty = rows(
      'SELECT p.name FROM projects p LEFT JOIN assignments a ON a.project_id = p.project_id WHERE a.employee_id IS NULL',
      d,
    );
    expect(empty).toEqual([['Khảo sát nhu cầu khách']]);
  });
});
