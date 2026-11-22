import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect, Trace } from '../index';
import { buildFrames } from '../../theater/frames';
import { hr } from '../../data/hr';

/**
 * Các kiểu nối table: RIGHT, FULL, CROSS, USING, NATURAL, dấu (+) của Oracle.
 * MySQL: kết quả, thứ tự column của SELECT *, mã lỗi và câu báo đều đã kiểm trên MySQL 8.0.46 thật.
 * Oracle: theo tài liệu 19c (SQL Language Reference: SELECT, Joins; Database Error Messages).
 * Dữ liệu: src/data/hr.ts. 25 nhân viên (1 người không có department_id), 8 phòng (phòng 120 Treasury chưa có ai), 12 job.
 */

const ok = (sql: string, d: Dialect) => {
  const r = run(sql, hr, d);
  if (!r.ok) throw new Error(`[${d}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return r;
};
const fail = (sql: string, d: Dialect) => {
  const r = run(sql, hr, d);
  if (r.ok) throw new Error(`[${d}] ${sql}\n   -> expected error, got ${r.result.rows.length} rows`);
  return r.error;
};
const rows = (sql: string, d: Dialect) => ok(sql, d).result.rows;
const one = (sql: string, d: Dialect) => rows(sql, d)[0][0];
const at = (sql: string, e: { span: { s: number; e: number } }) => sql.slice(e.span.s, e.span.e);
const joinStep = (t: Trace, n = 0) => {
  const s = t.steps.filter((x) => x.kind === 'join')[n];
  if (s?.kind !== 'join') throw new Error('không có bước join');
  return s;
};

const E_D = 'FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id';

describe('RIGHT JOIN', () => {
  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`[${d}] giữ mọi row bên phải: 24 row khớp và phòng Treasury chưa có ai`, () => {
      expect(one(`SELECT COUNT(*) ${E_D}`, d)).toBe(25);
      expect(rows(`SELECT d.department_name, e.last_name ${E_D} WHERE d.department_id IN (10, 120) ORDER BY d.department_id`, d)).toEqual([
        ['Administration', 'Whalen'],
        ['Treasury', null],
      ]);
    });
    it(`[${d}] RIGHT OUTER JOIN giống RIGHT JOIN`, () => {
      expect(one('SELECT COUNT(*) FROM employees e RIGHT OUTER JOIN departments d ON e.department_id = d.department_id', d)).toBe(25);
    });
    it(`[${d}] tìm row không khớp: WHERE e.employee_id IS NULL`, () => {
      expect(rows(`SELECT d.department_name ${E_D} WHERE e.employee_id IS NULL`, d)).toEqual([['Treasury']]);
    });
    it(`[${d}] đếm theo nhóm: Treasury có 0 nhân viên`, () => {
      const r = rows(`SELECT d.department_name, COUNT(e.employee_id) ${E_D} GROUP BY d.department_name ORDER BY d.department_name`, d);
      expect(r).toHaveLength(8);
      expect(r.find((x) => x[0] === 'Treasury')).toEqual(['Treasury', 0]);
      expect(r.find((x) => x[0] === 'Sales')).toEqual(['Sales', 8]);
    });
    it(`[${d}] điều kiện thêm trong ON làm row bên phải mất bạn ghép, không mất row`, () => {
      expect(one('SELECT COUNT(*) FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id AND e.salary > 9000', d)).toBe(16);
    });
    it(`[${d}] điều kiện trong WHERE lọc luôn row NULL`, () => {
      expect(one(`SELECT COUNT(*) ${E_D} WHERE e.salary > 9000`, d)).toBe(13);
    });
    it(`[${d}] SELECT *: column table trái đứng trước, table phải đứng sau`, () => {
      const r = ok(`SELECT * ${E_D}`, d).result;
      const names = r.columns.map((c) => c.toLowerCase());
      expect(names[0]).toBe('employee_id');
      expect(names.at(-1)).toBe('location_id');
      expect(r.rows).toHaveLength(25);
    });
    it(`[${d}] hai RIGHT JOIN nối tiếp`, () => {
      expect(one('SELECT COUNT(*) FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id RIGHT JOIN locations l ON l.location_id = d.location_id', d)).toBe(26);
    });
    it(`[${d}] trace: row bên phải không khớp có left = null`, () => {
      const s = joinStep(ok(`SELECT * ${E_D}`, d).trace);
      expect(s.joinKind).toBe('right');
      expect(s.links.filter((l) => l.left === null)).toHaveLength(1);
      expect(s.links.filter((l) => l.right === null)).toHaveLength(0);
      expect(s.rows).toHaveLength(25);
    });
  }
  it('thiếu ON: MySQL 1064, Oracle ORA-00905', () => {
    const sql = 'SELECT * FROM employees e RIGHT JOIN departments d';
    expect(fail(sql, 'mysql').code).toBe('1064');
    expect(fail(sql, 'oracle').code).toBe('ORA-00905');
  });
  it('MySQL: thứ tự row theo table bên phải', () => {
    const r = rows('SELECT d.department_id FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id', 'mysql');
    const ids = r.map((x) => x[0]);
    expect(ids.slice(0, 1)).toEqual([10]);
    expect(ids.indexOf(120)).toBeGreaterThan(ids.indexOf(110));
  });
});

describe('FULL JOIN', () => {
  const FULL = 'FROM employees e FULL JOIN departments d ON e.department_id = d.department_id';
  it('Oracle: giữ row không khớp của cả hai bên (24 khớp, 1 nhân viên không phòng, 1 phòng không người)', () => {
    expect(one(`SELECT COUNT(*) ${FULL}`, 'oracle')).toBe(26);
    expect(rows(`SELECT e.last_name, d.department_name ${FULL} WHERE e.employee_id IS NULL OR d.department_id IS NULL ORDER BY e.last_name`, 'oracle')).toEqual([
      ['Grant', null],
      [null, 'Treasury'],
    ]);
  });
  it('Oracle: FULL OUTER JOIN giống FULL JOIN', () => {
    expect(one('SELECT COUNT(*) FROM employees e FULL OUTER JOIN departments d ON e.department_id = d.department_id', 'oracle')).toBe(26);
  });
  it('Oracle: trace có cả hai loại row không khớp', () => {
    const s = joinStep(ok(`SELECT * ${FULL}`, 'oracle').trace);
    expect(s.joinKind).toBe('full');
    expect(s.links.filter((l) => l.left === null)).toHaveLength(1);
    expect(s.links.filter((l) => l.right === null)).toHaveLength(1);
    expect(s.rows).toHaveLength(26);
  });
  it('Oracle: USING trả một column gộp, lấy giá trị khác NULL đầu tiên', () => {
    const r = ok('SELECT department_id, last_name, department_name FROM employees FULL JOIN departments USING (department_id) WHERE last_name = \'Grant\' OR department_name = \'Treasury\' ORDER BY department_id', 'oracle').result;
    expect(r.rows).toEqual([
      [120, null, 'Treasury'],
      [null, 'Grant', null],
    ]);
  });
  it('Oracle: FULL JOIN thiếu ON là ORA-00905', () => {
    expect(fail('SELECT * FROM employees e FULL JOIN departments d', 'oracle').code).toBe('ORA-00905');
  });

  // Đã thử trên MySQL 8.0.46: FULL ngay sau table là alias, nên JOIN phía sau là JOIN thường.
  it('MySQL: FULL JOIN ... ON báo 1054, vì FULL thành alias và tên table cũ không còn dùng được', () => {
    const sql = 'SELECT * FROM employees FULL JOIN departments ON employees.department_id = departments.department_id';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1054');
    expect(e.dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'employees.department_id' in 'on clause'");
    expect(e.friendly).toContain('MySQL không có FULL JOIN');
    expect(e.friendly).toContain('UNION');
  });
  it('MySQL: FULL OUTER JOIN báo 1064 tại chữ OUTER', () => {
    const sql = 'SELECT * FROM employees FULL OUTER JOIN departments ON employees.department_id = departments.department_id';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'OUTER JOIN departments");
    expect(at(sql, e)).toBe('OUTER');
    expect(e.friendly).toContain('FULL JOIN');
  });
  it('MySQL: table đã có alias thì FULL JOIN báo 1064 tại chữ FULL', () => {
    const sql = 'SELECT * FROM employees e FULL JOIN departments d ON e.department_id = d.department_id';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'FULL JOIN departments d");
    expect(at(sql, e)).toBe('FULL');
    expect(e.friendly).toContain('UNION');
  });
  it('MySQL: FULL JOIN ... USING chạy như JOIN thường (24 row), vì FULL chỉ là alias', () => {
    expect(one('SELECT COUNT(*) FROM employees FULL JOIN departments USING (department_id)', 'mysql')).toBe(24);
  });
  it('MySQL: dùng alias tên full ở nơi khác vẫn chạy', () => {
    expect(one('SELECT COUNT(*) FROM jobs full WHERE full.job_id = \'AD_VP\'', 'mysql')).toBe(1);
  });
});

describe('CROSS JOIN', () => {
  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`[${d}] ghép mọi row với mọi row: 25 x 12 = 300`, () => {
      expect(one('SELECT COUNT(*) FROM employees e CROSS JOIN jobs j', d)).toBe(300);
    });
    it(`[${d}] CROSS JOIN rồi WHERE giống nối bằng dấu phẩy`, () => {
      const a = rows('SELECT e.employee_id, j.job_id FROM employees e CROSS JOIN jobs j WHERE e.job_id = j.job_id ORDER BY e.employee_id', d);
      const b = rows('SELECT e.employee_id, j.job_id FROM employees e, jobs j WHERE e.job_id = j.job_id ORDER BY e.employee_id', d);
      expect(a).toEqual(b);
      expect(a).toHaveLength(25);
    });
    it(`[${d}] ba table: 25 x 8 x 12 = 2400`, () => {
      expect(one('SELECT COUNT(*) FROM employees CROSS JOIN departments CROSS JOIN jobs', d)).toBe(2400);
    });
    it(`[${d}] trace: joinKind cross, không có điều kiện ON`, () => {
      const s = joinStep(ok('SELECT * FROM departments d CROSS JOIN locations l', d).trace);
      expect(s.joinKind).toBe('cross');
      expect(s.on).toBeUndefined();
      expect(s.rows).toHaveLength(40);
    });
  }
  it('JOIN không có ON: MySQL coi là CROSS JOIN, Oracle ORA-00905', () => {
    expect(one('SELECT COUNT(*) FROM employees e JOIN jobs j', 'mysql')).toBe(300);
    expect(fail('SELECT COUNT(*) FROM employees e JOIN jobs j', 'oracle').code).toBe('ORA-00905');
  });
  it('CROSS JOIN kèm ON: MySQL chạy như INNER JOIN, Oracle ORA-00933', () => {
    const sql = 'SELECT COUNT(*) FROM employees e CROSS JOIN departments d ON e.department_id = d.department_id';
    expect(one(sql, 'mysql')).toBe(24);
    const e = fail(sql, 'oracle');
    // CHỜ KIỂM TÀI LIỆU: mã ORA-00933 cho CROSS JOIN ... ON theo suy luận từ cú pháp, chưa có nguồn xác nhận.
    expect(e.code).toBe('ORA-00933');
    expect(at(sql, e)).toBe('ON');
  });
});

describe('JOIN ... USING', () => {
  const EJ = 'FROM employees e JOIN jobs j USING (job_id)';
  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`[${d}] SELECT * chỉ hiện column trong USING một lần, đứng đầu`, () => {
      const r = ok(`SELECT * ${EJ}`, d).result;
      const names = r.columns.map((c) => c.toLowerCase());
      expect(names).toEqual(['job_id', 'employee_id', 'first_name', 'last_name', 'email', 'phone_number', 'hire_date', 'salary', 'commission_pct', 'manager_id', 'department_id', 'job_title', 'min_salary', 'max_salary']);
      expect(r.rows).toHaveLength(25);
    });
    it(`[${d}] column trong USING viết không có table đứng trước`, () => {
      expect(one('SELECT COUNT(job_id) FROM employees JOIN jobs USING (job_id)', d)).toBe(25);
      expect(rows('SELECT job_id, job_title FROM employees JOIN jobs USING (job_id) WHERE employee_id = 100', d)).toEqual([['AD_PRES', 'President']]);
    });
    it(`[${d}] LEFT JOIN USING: column gộp lấy giá trị bên trái`, () => {
      expect(rows('SELECT department_id, department_name FROM departments LEFT JOIN employees USING (department_id) WHERE employee_id IS NULL', d)).toEqual([[120, 'Treasury']]);
    });
    it(`[${d}] RIGHT JOIN USING: column gộp lấy giá trị bên phải (phòng 120 vẫn hiện)`, () => {
      const r = rows('SELECT department_id, department_name FROM employees RIGHT JOIN departments USING (department_id) WHERE department_id = 120', d);
      expect(r).toEqual([[120, 'Treasury']]);
    });
    it(`[${d}] ba table nối tiếp bằng USING`, () => {
      const r = ok('SELECT * FROM employees JOIN jobs USING (job_id) JOIN departments USING (department_id)', d).result;
      expect(r.rows).toHaveLength(24);
      const names = r.columns.map((c) => c.toLowerCase());
      expect(names.slice(0, 2)).toEqual(['department_id', 'job_id']);
      expect(names.filter((n) => n === 'department_id')).toHaveLength(1);
      expect(names.filter((n) => n === 'job_id')).toHaveLength(1);
    });
    it(`[${d}] GROUP BY column gộp`, () => {
      const r = rows('SELECT department_id, COUNT(*) FROM employees JOIN departments USING (department_id) GROUP BY department_id ORDER BY department_id', d);
      expect(r).toHaveLength(7);
      expect(r[0]).toEqual([10, 1]);
    });
    it(`[${d}] tên column gộp không bị coi là trùng`, () => {
      expect(rows('SELECT job_id FROM employees JOIN jobs USING (job_id) JOIN departments ON departments.department_id = employees.department_id', d)).toHaveLength(24);
    });
    it(`[${d}] column có ở cả hai table mà không nằm trong USING vẫn là trùng tên`, () => {
      const sql = 'SELECT manager_id FROM employees JOIN departments USING (department_id)';
      expect(fail(sql, d).code).toBe(d === 'mysql' ? '1052' : 'ORA-00918');
    });
    it(`[${d}] hai column trong USING`, () => {
      expect(one('SELECT COUNT(*) FROM employees JOIN departments USING (department_id, manager_id)', d)).toBe(13);
    });
    it(`[${d}] trace: có on tự dựng và tên column gộp`, () => {
      const s = joinStep(ok(`SELECT * ${EJ}`, d).trace);
      expect(s.on).toBe('e.job_id = j.job_id');
      expect(s.merged).toEqual(['job_id']);
      expect(s.columns.length).toBe(15);
    });
  }

  it('MySQL: cho viết e.job_id và j.job_id với column trong USING', () => {
    expect(rows('SELECT e.job_id, j.job_id FROM employees e JOIN jobs j USING (job_id) WHERE employee_id = 100', 'mysql')).toEqual([['AD_PRES', 'AD_PRES']]);
  });
  it('Oracle: viết alias.column với column trong USING là ORA-25154', () => {
    const sql = 'SELECT e.job_id FROM employees e JOIN jobs j USING (job_id)';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-25154');
    expect(e.dbMessage).toBe('ORA-25154: column part of USING clause cannot have qualifier');
    expect(at(sql, e)).toBe('e.job_id');
    expect(e.friendly).toContain('Viết job_id một mình');
  });
  it('Oracle: ORA-25154 cũng báo ở WHERE', () => {
    expect(fail('SELECT job_title FROM employees e JOIN jobs j USING (job_id) WHERE j.job_id = \'AD_VP\'', 'oracle').code).toBe('ORA-25154');
  });
  it('Oracle: column không thuộc USING vẫn viết alias.column', () => {
    expect(one('SELECT e.employee_id FROM employees e JOIN jobs j USING (job_id) WHERE j.job_title = \'President\'', 'oracle')).toBe(100);
  });
  it('MySQL: SELECT * thứ tự column gộp theo table bên trái, không theo thứ tự viết trong USING', () => {
    const names = ok('SELECT * FROM employees JOIN departments USING (department_id, manager_id)', 'mysql').result.columns;
    expect(names.slice(0, 2)).toEqual(['manager_id', 'department_id']);
  });
  it('Oracle: SELECT * thứ tự column gộp theo thứ tự viết trong USING', () => {
    // CHỜ KIỂM TÀI LIỆU: tài liệu 19c không nói thứ tự column của SELECT *. Theo chuẩn SQL, thứ tự là thứ tự viết trong USING.
    const names = ok('SELECT * FROM employees JOIN departments USING (department_id, manager_id)', 'oracle').result.columns;
    expect(names.slice(0, 2)).toEqual(['DEPARTMENT_ID', 'MANAGER_ID']);
  });
  it('MySQL: RIGHT JOIN USING đưa column của table bên phải lên trước phần còn lại của table bên trái', () => {
    const names = ok('SELECT * FROM jobs RIGHT JOIN employees USING (job_id)', 'mysql').result.columns;
    expect(names.slice(0, 3)).toEqual(['job_id', 'employee_id', 'first_name']);
    expect(names.slice(-3)).toEqual(['job_title', 'min_salary', 'max_salary']);
  });
  it('Oracle: RIGHT JOIN USING vẫn để column bên trái trước', () => {
    // CHỜ KIỂM TÀI LIỆU: thứ tự column của RIGHT JOIN USING ở Oracle theo chuẩn SQL, chưa có nguồn xác nhận.
    const names = ok('SELECT * FROM jobs RIGHT JOIN employees USING (job_id)', 'oracle').result.columns;
    expect(names.slice(0, 3)).toEqual(['JOB_ID', 'JOB_TITLE', 'MIN_SALARY']);
  });
  it('MySQL: t.* vẫn đủ column của table, kể cả column trong USING', () => {
    const r = ok('SELECT j.* FROM employees e JOIN jobs j USING (job_id) WHERE e.employee_id = 100', 'mysql').result;
    expect(r.columns).toEqual(['job_id', 'job_title', 'min_salary', 'max_salary']);
  });
  it('MySQL: dùng tên hoa thường lẫn lộn', () => {
    expect(one('SELECT COUNT(*) FROM employees JOIN jobs USING (JOB_ID)', 'mysql')).toBe(25);
  });
  it('column không có ở table bên phải: MySQL 1054 ở from clause, Oracle ORA-00904', () => {
    const sql = 'SELECT * FROM employees JOIN departments USING (job_id)';
    const m = fail(sql, 'mysql');
    expect(m.dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'job_id' in 'from clause'");
    expect(at(sql, m)).toBe('job_id');
    expect(m.friendly).toContain('USING chỉ nhận column có ở cả hai table');
    // CHỜ KIỂM TÀI LIỆU: ORA-00904 cho column không có trong USING, chưa có nguồn xác nhận.
    expect(fail(sql, 'oracle').code).toBe('ORA-00904');
  });
  it('column không có ở table bên trái: MySQL 1054', () => {
    expect(fail('SELECT * FROM employees JOIN departments USING (department_name)', 'mysql').code).toBe('1054');
  });
  it('column trong USING có ở hai table đứng trước: MySQL 1052 ở from clause', () => {
    const sql = 'SELECT * FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations USING (location_id)';
    expect(one('SELECT COUNT(*) FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations USING (location_id)', 'mysql')).toBe(24);
    const sql2 = 'SELECT * FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN jobs USING (manager_id)';
    void sql;
    // jobs không có manager_id: lỗi 1054 đứng trước lỗi 1052
    expect(fail(sql2, 'mysql').code).toBe('1054');
    const e = fail('SELECT * FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN employees e3 USING (manager_id)', 'mysql');
    expect(e.dbMessage).toBe("ERROR 1052 (23000): Column 'manager_id' in from clause is ambiguous");
  });
  it('thiếu ngoặc sau USING: MySQL 1064, Oracle ORA-00906', () => {
    const sql = 'SELECT * FROM employees JOIN jobs USING job_id';
    const m = fail(sql, 'mysql');
    expect(m.code).toBe('1064');
    expect(m.dbMessage).toContain("near 'job_id'");
    expect(fail(sql, 'oracle').code).toBe('ORA-00906');
  });
  it('USING () rỗng: MySQL 1064 tại dấu )', () => {
    const sql = 'SELECT * FROM employees JOIN jobs USING ()';
    const e = fail(sql, 'mysql');
    expect(e.dbMessage).toContain("near ')'");
    expect(at(sql, e)).toBe(')');
  });
  it('self join bằng USING: column trùng của hai alias đều hiện, column gộp hiện một lần', () => {
    const r = ok('SELECT * FROM jobs a JOIN jobs b USING (job_id)', 'mysql').result;
    expect(r.columns).toEqual(['job_id', 'job_title', 'min_salary', 'max_salary', 'job_title', 'min_salary', 'max_salary']);
    expect(r.rows).toHaveLength(12);
  });
});

describe('NATURAL JOIN', () => {
  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`[${d}] nối theo mọi column trùng tên (department_id và manager_id): 13 row`, () => {
      expect(one('SELECT COUNT(*) FROM employees NATURAL JOIN departments', d)).toBe(13);
    });
    it(`[${d}] SELECT * hiện column trùng một lần, đứng đầu`, () => {
      const names = ok('SELECT * FROM employees NATURAL JOIN departments', d).result.columns.map((c) => c.toLowerCase());
      expect(names.slice(0, 2)).toEqual(['manager_id', 'department_id']);
      expect(names.filter((n) => n === 'department_id')).toHaveLength(1);
      expect(names).toHaveLength(13);
    });
    it(`[${d}] NATURAL LEFT JOIN giữ mọi row bên trái`, () => {
      expect(one('SELECT COUNT(*) FROM employees NATURAL LEFT JOIN departments', d)).toBe(25);
      expect(one('SELECT COUNT(*) FROM employees NATURAL LEFT OUTER JOIN departments', d)).toBe(25);
    });
    it(`[${d}] NATURAL RIGHT JOIN giữ mọi row bên phải`, () => {
      expect(one('SELECT COUNT(*) FROM employees NATURAL RIGHT JOIN departments', d)).toBe(15);
    });
    it(`[${d}] không có column trùng tên thì thành CROSS JOIN (5 x 12)`, () => {
      expect(one('SELECT COUNT(*) FROM locations NATURAL JOIN jobs', d)).toBe(60);
      const s = joinStep(ok('SELECT * FROM locations NATURAL JOIN jobs', d).trace);
      expect(s.joinKind).toBe('cross');
    });
    it(`[${d}] nối tiếp ba table`, () => {
      expect(one('SELECT COUNT(*) FROM departments NATURAL JOIN locations NATURAL JOIN employees', d)).toBe(13);
    });
    it(`[${d}] NATURAL INNER JOIN`, () => {
      expect(one('SELECT COUNT(*) FROM jobs NATURAL INNER JOIN employees', d)).toBe(25);
    });
    it(`[${d}] self join với hai alias`, () => {
      expect(one('SELECT COUNT(*) FROM jobs a NATURAL JOIN jobs b', d)).toBe(12);
    });
    it(`[${d}] trace ghi các column được gộp`, () => {
      const s = joinStep(ok('SELECT * FROM jobs NATURAL JOIN employees', d).trace);
      expect(s.merged).toEqual(['job_id']);
      expect(s.on).toBe('jobs.job_id = employees.job_id');
    });
    it(`[${d}] sau ON hay USING là lỗi`, () => {
      expect(fail('SELECT * FROM employees NATURAL JOIN departments ON 1 = 1', d).code).toBe(d === 'mysql' ? '1064' : 'ORA-00933');
      expect(fail('SELECT * FROM employees NATURAL JOIN departments USING (job_id)', d).code).toBe(d === 'mysql' ? '1064' : 'ORA-00933');
    });
    it(`[${d}] NATURAL CROSS JOIN không có`, () => {
      expect(fail('SELECT * FROM employees NATURAL CROSS JOIN departments', d).code).toBe(d === 'mysql' ? '1064' : 'ORA-00933');
    });
  }
  it('MySQL: NATURAL RIGHT JOIN xếp column trùng theo table bên phải', () => {
    const names = ok('SELECT * FROM employees NATURAL RIGHT JOIN departments', 'mysql').result.columns;
    expect(names.slice(0, 2)).toEqual(['department_id', 'manager_id']);
  });
  it('MySQL: NATURAL FULL JOIN báo 1064, Oracle chạy', () => {
    const sql = 'SELECT COUNT(*) FROM employees NATURAL FULL JOIN departments';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(at(sql, e)).toBe('FULL');
    expect(one(sql, 'oracle')).toBe(27);
  });
  it('Oracle: NATURAL JOIN rồi viết alias.column là ORA-25155', () => {
    const e = fail('SELECT e.job_id FROM employees e NATURAL JOIN jobs j', 'oracle');
    expect(e.code).toBe('ORA-25155');
    expect(e.dbMessage).toBe('ORA-25155: column used in NATURAL join cannot have qualifier');
  });
  it('MySQL: NATURAL JOIN rồi viết alias.column vẫn chạy', () => {
    expect(one('SELECT COUNT(e.job_id) FROM employees e NATURAL JOIN jobs j', 'mysql')).toBe(25);
  });
  it('NATURAL JOIN lấy column trùng từ nhiều table bên trái: MySQL 1052', () => {
    expect(one('SELECT COUNT(*) FROM employees e JOIN departments d ON e.department_id = d.department_id NATURAL JOIN jobs', 'mysql')).toBe(24);
    const e = fail('SELECT * FROM employees e JOIN departments d ON e.department_id = d.department_id NATURAL JOIN employees e3', 'mysql');
    expect(e.dbMessage).toBe("ERROR 1052 (23000): Column 'department_id' in from clause is ambiguous");
    expect(fail('SELECT * FROM departments d3 JOIN employees e ON e.department_id = d3.department_id NATURAL JOIN employees e3', 'mysql').dbMessage).toContain("Column 'manager_id'");
    expect(fail('SELECT * FROM employees e JOIN departments d ON e.department_id = d.department_id NATURAL JOIN employees e3', 'oracle').code).toBe('ORA-00918');
  });
});

describe('dấu (+) của Oracle', () => {
  const ED = 'FROM employees e, departments d';
  it('b.x(+): giữ mọi row của table kia (25 nhân viên, người không phòng ra NULL)', () => {
    const sql = `SELECT e.last_name, d.department_name ${ED} WHERE e.department_id = d.department_id(+) ORDER BY e.employee_id`;
    const r = rows(sql, 'oracle');
    expect(r).toHaveLength(25);
    expect(r.find((x) => x[0] === 'Grant')).toEqual(['Grant', null]);
    expect(r[0]).toEqual(['King', 'Executive']);
  });
  it('a.x(+): giữ mọi row của table bên phải (25 row, Treasury có NULL)', () => {
    const r = rows(`SELECT d.department_name, e.last_name ${ED} WHERE e.department_id(+) = d.department_id AND d.department_id IN (10, 120) ORDER BY d.department_id`, 'oracle');
    expect(r).toEqual([
      ['Administration', 'Whalen'],
      ['Treasury', null],
    ]);
  });
  it('kết quả giống LEFT JOIN viết tay', () => {
    const a = rows(`SELECT e.employee_id, d.department_id ${ED} WHERE e.department_id = d.department_id(+) ORDER BY e.employee_id`, 'oracle');
    const b = rows('SELECT e.employee_id, d.department_id FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id ORDER BY e.employee_id', 'oracle');
    expect(a).toEqual(b);
  });
  it('SELECT * giữ thứ tự table trong FROM, dù (+) đổi thứ tự nối', () => {
    const r = ok(`SELECT * ${ED} WHERE e.department_id(+) = d.department_id`, 'oracle').result;
    expect(r.columns[0]).toBe('EMPLOYEE_ID');
    expect(r.columns.at(-1)).toBe('LOCATION_ID');
    expect(r.rows).toHaveLength(25);
    expect(r.rows.find((x) => x[0] === null)?.slice(11)).toEqual([120, 'Treasury', null, 1700]);
  });
  it('điều kiện lọc có (+): row của table kia vẫn giữ nguyên, chỉ bên có (+) thành NULL', () => {
    const r = rows(`SELECT e.last_name, d.department_name ${ED} WHERE e.department_id = d.department_id(+) AND d.department_name(+) = 'IT' ORDER BY e.employee_id`, 'oracle');
    expect(r).toHaveLength(25);
    expect(r.filter((x) => x[1] !== null)).toHaveLength(5);
    expect(r.slice(0, 5)).toEqual([['King', null], ['Yang', null], ['Garcia', null], ['James', 'IT'], ['Miller', 'IT']]);
  });
  it('điều kiện lọc không có (+): thành nối thường, mất row không khớp', () => {
    const r = rows(`SELECT e.last_name ${ED} WHERE e.department_id = d.department_id(+) AND d.department_name = 'IT'`, 'oracle');
    expect(r).toHaveLength(5);
  });
  it('điều kiện thêm không dính (+) lọc sau khi nối', () => {
    expect(one(`SELECT COUNT(*) ${ED} WHERE e.department_id = d.department_id(+) AND e.salary > 9000`, 'oracle')).toBe(13);
  });
  it('self join với hai alias', () => {
    const r = rows('SELECT e.last_name, m.last_name FROM employees e, employees m WHERE e.manager_id = m.employee_id(+) ORDER BY e.employee_id', 'oracle');
    expect(r).toHaveLength(25);
    expect(r[0]).toEqual(['King', null]);
    expect(r[3]).toEqual(['James', 'Garcia']);
  });
  it('nối ngoài tiếp ba table', () => {
    const r = rows('SELECT e.last_name, l.city FROM employees e, departments d, locations l WHERE e.department_id = d.department_id(+) AND d.location_id = l.location_id(+) ORDER BY e.employee_id', 'oracle');
    expect(r).toHaveLength(25);
    expect(r.find((x) => x[0] === 'Grant')).toEqual(['Grant', null]);
    expect(r[0]).toEqual(['King', 'Seattle']);
  });
  it('một table bị nối ngoài với hai table khác (bản 12c trở lên cho phép)', () => {
    const r = rows('SELECT COUNT(*) FROM departments a, locations b, jobs j WHERE a.location_id = b.location_id(+) AND j.job_id = \'AD_VP\'', 'oracle');
    expect(r[0][0]).toBe(8);
    const r2 = rows('SELECT COUNT(*) FROM departments a, jobs j, locations b WHERE a.location_id = b.location_id(+) AND j.min_salary = b.location_id(+)', 'oracle');
    expect(r2[0][0]).toBe(96);
  });
  it('trộn table nối ngoài và table nối thường', () => {
    const r = rows('SELECT e.last_name, d.department_name, j.job_title FROM employees e, departments d, jobs j WHERE e.department_id = d.department_id(+) AND e.job_id = j.job_id AND e.employee_id IN (100, 178) ORDER BY e.employee_id', 'oracle');
    expect(r).toEqual([['King', 'Executive', 'President'], ['Grant', null, 'Sales Representative']]);
  });
  it('trace: LEFT JOIN, điều kiện ON ghi không có (+)', () => {
    const s = joinStep(ok(`SELECT * ${ED} WHERE e.department_id = d.department_id(+)`, 'oracle').trace);
    expect(s.joinKind).toBe('left');
    expect(s.on).toBe('e.department_id = d.department_id');
    expect(s.links.filter((l) => l.right === null)).toHaveLength(1);
  });
  it('trace: (+) ở table đứng trước thì table kia vào sân khấu trước', () => {
    const t = ok(`SELECT * ${ED} WHERE e.department_id(+) = d.department_id`, 'oracle').trace;
    const from = t.steps[0];
    expect(from.kind === 'from' && from.table).toBe('departments');
    expect(joinStep(t).table).toBe('employees');
  });

  it('MySQL không có dấu (+): 1064 tại dấu )', () => {
    const sql = `SELECT * ${ED} WHERE e.department_id = d.department_id(+)`;
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near ')'");
    expect(e.friendly).toContain('LEFT JOIN');
    expect(at(sql, e)).toBe(')');
  });
  it('(+) ở cả hai vế: ORA-01468', () => {
    const e = fail(`SELECT * ${ED} WHERE e.department_id(+) = d.department_id(+)`, 'oracle');
    expect(e.code).toBe('ORA-01468');
    expect(e.dbMessage).toBe('ORA-01468: a predicate may reference only one outer-joined table');
  });
  it('(+) trong OR: ORA-01719', () => {
    expect(fail(`SELECT * ${ED} WHERE e.department_id = d.department_id(+) OR e.salary > 5000`, 'oracle').code).toBe('ORA-01719');
  });
  it('(+) trong IN: ORA-01719', () => {
    expect(fail(`SELECT * ${ED} WHERE e.department_id = d.department_id(+) AND d.location_id(+) IN (1700, 1800)`, 'oracle').code).toBe('ORA-01719');
  });
  it('(+) so với subquery: ORA-01799', () => {
    const e = fail(`SELECT * ${ED} WHERE e.department_id = d.department_id(+) AND d.location_id(+) = (SELECT MAX(location_id) FROM locations)`, 'oracle');
    expect(e.code).toBe('ORA-01799');
  });
  it('(+) trong danh sách SELECT hoặc ORDER BY: ORA-30563', () => {
    expect(fail(`SELECT d.department_id(+) ${ED} WHERE e.department_id = d.department_id`, 'oracle').code).toBe('ORA-30563');
    expect(fail(`SELECT * ${ED} WHERE e.department_id = d.department_id(+) ORDER BY d.department_id(+)`, 'oracle').code).toBe('ORA-30563');
  });
  it('(+) cùng query với JOIN ... ON: ORA-25156', () => {
    const e = fail('SELECT * FROM employees e JOIN jobs j ON e.job_id = j.job_id, departments d WHERE e.department_id = d.department_id(+)', 'oracle');
    expect(e.code).toBe('ORA-25156');
    expect(e.dbMessage).toBe('ORA-25156: old style outer join (+) cannot be used with ANSI joins');
  });
  it('hai table nối ngoài vào nhau: ORA-01416', () => {
    const e = fail(`SELECT * ${ED} WHERE e.department_id(+) = d.department_id AND d.manager_id(+) = e.employee_id`, 'oracle');
    expect(e.code).toBe('ORA-01416');
  });
  it('(+) cho column không có: ORA-00904', () => {
    expect(fail(`SELECT * ${ED} WHERE e.department_id = d.nosuch(+)`, 'oracle').code).toBe('ORA-00904');
  });
  it('tên không có table đứng trước vẫn dùng được khi không trùng', () => {
    expect(one("SELECT COUNT(*) FROM employees e, jobs j WHERE e.job_id = j.job_id(+) AND job_title(+) = 'President'", 'oracle')).toBe(25);
  });
});

describe('ON phức tạp và nhiều table', () => {
  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`[${d}] ON nhiều điều kiện nối bằng AND`, () => {
      expect(one('SELECT COUNT(*) FROM employees e JOIN departments d ON e.department_id = d.department_id AND e.manager_id = d.manager_id', d)).toBe(13);
    });
    it(`[${d}] ON nối bằng OR`, () => {
      expect(one('SELECT COUNT(*) FROM employees e JOIN departments d ON e.department_id = d.department_id OR e.manager_id = d.manager_id', d)).toBe(29);
    });
    it(`[${d}] ON so theo khoảng: BETWEEN min_salary và max_salary`, () => {
      expect(one('SELECT COUNT(*) FROM employees e JOIN jobs j ON e.salary BETWEEN j.min_salary AND j.max_salary', d)).toBe(112);
      expect(rows('SELECT j.job_title FROM employees e JOIN jobs j ON e.salary BETWEEN j.min_salary AND j.max_salary WHERE e.employee_id = 100 ORDER BY j.job_id', d)).toEqual([['President'], ['Administration Vice President']]);
    });
    it(`[${d}] self join với hai alias: tên quản lý`, () => {
      const r = rows('SELECT e.last_name, m.last_name FROM employees e JOIN employees m ON e.manager_id = m.employee_id WHERE e.employee_id IN (101, 104) ORDER BY e.employee_id', d);
      expect(r).toEqual([['Yang', 'King'], ['Miller', 'James']]);
    });
    it(`[${d}] self join nối hai row khác nhau của cùng một table`, () => {
      expect(one('SELECT COUNT(*) FROM departments d1 JOIN departments d2 ON d1.location_id = d2.location_id AND d1.department_id < d2.department_id', d)).toBe(10);
    });
    it(`[${d}] nối năm table trong một query`, () => {
      const sql = 'SELECT e.last_name, d.department_name, l.city, j.job_title, m.last_name FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id JOIN jobs j ON e.job_id = j.job_id LEFT JOIN employees m ON e.manager_id = m.employee_id ORDER BY e.employee_id';
      const r = rows(sql, d);
      expect(r).toHaveLength(24);
      expect(r[0]).toEqual(['King', 'Executive', 'Seattle', 'President', null]);
      expect(r[1]).toEqual(['Yang', 'Executive', 'Seattle', 'Administration Vice President', 'King']);
    });
    it(`[${d}] LEFT JOIN nối tiếp nhau giữ mọi nhân viên`, () => {
      const r = rows('SELECT e.last_name, d.department_name, l.city FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id LEFT JOIN locations l ON d.location_id = l.location_id ORDER BY e.employee_id', d);
      expect(r).toHaveLength(25);
      expect(r.find((x) => x[0] === 'Grant')).toEqual(['Grant', null, null]);
    });
    it(`[${d}] LEFT JOIN rồi INNER JOIN loại row NULL`, () => {
      expect(one('SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id JOIN locations l ON d.location_id = l.location_id', d)).toBe(24);
    });
    it(`[${d}] INNER JOIN rồi LEFT JOIN`, () => {
      expect(one('SELECT COUNT(*) FROM employees e JOIN departments d ON e.department_id = d.department_id LEFT JOIN locations l ON d.location_id = l.location_id', d)).toBe(24);
    });
    it(`[${d}] LEFT JOIN: điều kiện trong ON không làm mất row bên trái`, () => {
      const r = rows('SELECT e.last_name, d.department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.department_id AND d.department_name = \'IT\' ORDER BY e.employee_id', d);
      expect(r).toHaveLength(25);
      expect(r.filter((x) => x[1] === 'IT')).toHaveLength(5);
    });
    it(`[${d}] column trùng tên ở hai table mà không ghi alias`, () => {
      const sql = 'SELECT department_id FROM employees e JOIN departments d ON e.department_id = d.department_id';
      const e = fail(sql, d);
      expect(e.code).toBe(d === 'mysql' ? '1052' : 'ORA-00918');
      expect(e.friendly).toContain('e.department_id');
    });
  }
  it('MySQL: 1052 nói rõ chỗ lỗi', () => {
    expect(fail('SELECT department_id FROM employees e JOIN departments d ON e.department_id = d.department_id', 'mysql').dbMessage).toBe("ERROR 1052 (23000): Column 'department_id' in field list is ambiguous");
    expect(fail('SELECT e.last_name FROM employees e JOIN departments d ON department_id = 1', 'mysql').dbMessage).toBe("ERROR 1052 (23000): Column 'department_id' in on clause is ambiguous");
  });
  it('Oracle: ORA-00918 khi column trùng tên nằm trong ON', () => {
    expect(fail('SELECT e.last_name FROM employees e JOIN departments d ON department_id = 1', 'oracle').code).toBe('ORA-00918');
  });
});

describe('Theater dựng được khung hình từ trace của mọi kiểu JOIN', () => {
  const cases: [string, string, Dialect][] = [
    ['RIGHT JOIN', 'SELECT d.department_name, e.last_name FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id ORDER BY d.department_name', 'mysql'],
    ['RIGHT JOIN (Oracle)', 'SELECT d.department_name, COUNT(e.employee_id) FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id GROUP BY d.department_name', 'oracle'],
    ['FULL JOIN', 'SELECT e.last_name, d.department_name FROM employees e FULL JOIN departments d ON e.department_id = d.department_id', 'oracle'],
    ['CROSS JOIN', 'SELECT * FROM departments d CROSS JOIN locations l', 'mysql'],
    ['CROSS JOIN (Oracle)', 'SELECT * FROM departments d CROSS JOIN locations l WHERE d.location_id = l.location_id', 'oracle'],
    ['USING', 'SELECT * FROM employees JOIN jobs USING (job_id) WHERE salary > 10000', 'mysql'],
    ['USING + RIGHT', 'SELECT * FROM employees RIGHT JOIN departments USING (department_id)', 'oracle'],
    ['NATURAL JOIN', 'SELECT * FROM employees NATURAL JOIN departments', 'mysql'],
    ['NATURAL LEFT JOIN', 'SELECT * FROM employees NATURAL LEFT JOIN departments ORDER BY employee_id', 'oracle'],
    ['dấu (+)', 'SELECT e.last_name, d.department_name FROM employees e, departments d WHERE e.department_id = d.department_id(+) AND e.salary > 5000', 'oracle'],
    ['dấu (+) bên trái', 'SELECT * FROM employees e, departments d WHERE e.department_id(+) = d.department_id', 'oracle'],
    ['trộn nhiều kiểu', 'SELECT e.last_name, d.department_name, l.city FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id LEFT JOIN locations l ON l.location_id = d.location_id', 'mysql'],
  ];
  for (const [name, sql, d] of cases) {
    it(`${name} [${d}]`, () => {
      const t = ok(sql, d).trace;
      const frames = buildFrames(t);
      expect(frames.length).toBeGreaterThan(4);
      const last = frames.at(-1)!;
      expect(last.phase).toBe('done');
      expect(last.count).toBe(t.result.rows.length);
      const caps = frames.map((f) => f.caption).join(' ');
      expect(caps).not.toMatch(/undefined|NaN|\[object/);
      // Chữ trên sân khấu theo luật viết của site: giữ tiếng Anh cho table, row, column, query.
      expect(caps).not.toMatch(/\b(bảng|cột|hàng|dòng|truy vấn)\b/i);
    });
  }
  it('RIGHT JOIN: table đang bay vào đánh dấu row bên phải không khớp, và nói rõ trong chữ', () => {
    const t = ok('SELECT * FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id', 'mysql').trace;
    const frames = buildFrames(t);
    const withSide = frames.filter((f) => f.side);
    expect(withSide.length).toBeGreaterThanOrEqual(2);
    const caption = withSide.at(-1)!.caption;
    expect(caption).toContain('RIGHT JOIN giữ mọi row của table departments');
    expect(caption).toContain('1 row không có row khớp');
    // Treasury là row thứ 8 của departments, nằm ngoài 6 row hiện ra bên cạnh. Row đầu tiên khớp nên không đánh dấu.
    expect(withSide[0].side!.rows.some((r) => r.mark === 'passed' && r.note)).toBe(false);
  });
  it('RIGHT JOIN: row bên phải không khớp xuất hiện trên sân khấu sau khi ghép', () => {
    const t = ok('SELECT * FROM employees e RIGHT JOIN departments d ON e.department_id = d.department_id WHERE e.employee_id IS NULL', 'oracle').trace;
    const frames = buildFrames(t);
    const joined = frames.find((f) => f.caption.startsWith('Ghép xong'))!;
    expect(joined.count).toBe(25);
    expect(joined.cols.length).toBe(15);
  });
  it('FULL JOIN: caption nói cả hai bên', () => {
    const t = ok('SELECT * FROM employees e FULL JOIN departments d ON e.department_id = d.department_id', 'oracle').trace;
    const caps = buildFrames(t).map((f) => f.caption);
    expect(caps.some((c) => c.startsWith('FULL JOIN giữ row của cả hai bên') && c.includes('1 row bên trái') && c.includes('1 row của table departments'))).toBe(true);
  });
  it('USING: SELECT * làm mờ column trùng rồi còn lại column gộp', () => {
    const t = ok('SELECT * FROM employees JOIN jobs USING (job_id)', 'mysql').trace;
    const frames = buildFrames(t);
    const dim = frames.find((f) => f.phase === 'select' && f.cols.some((c) => c.state === 'dim'));
    expect(dim).toBeDefined();
    const last = frames.at(-1)!;
    expect(last.cols.map((c) => c.header)).toEqual(t.result.columns);
    expect(last.cols.filter((c) => c.header === 'job_id')).toHaveLength(1);
  });
  it('CROSS JOIN: caption nói mỗi row ghép với mọi row', () => {
    const caps = buildFrames(ok('SELECT * FROM departments d CROSS JOIN locations l', 'mysql').trace).map((f) => f.caption);
    expect(caps.some((c) => c.includes('ghép mỗi row với mọi row của locations'))).toBe(true);
  });
  it('dấu (+): Theater diễn như LEFT JOIN', () => {
    const t = ok('SELECT * FROM employees e, departments d WHERE e.department_id = d.department_id(+)', 'oracle').trace;
    const caps = buildFrames(t).map((f) => f.caption);
    expect(caps.some((c) => c.startsWith('LEFT JOIN giữ mọi row bên trái'))).toBe(true);
    expect(caps.some((c) => c.includes('e.department_id = d.department_id') && !c.includes('(+)'))).toBe(true);
  });
});
