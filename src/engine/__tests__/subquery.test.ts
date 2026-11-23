import { describe, expect, it } from 'vitest';
import { createSession, run } from '../index';
import type { Dialect, Session, Trace, Value } from '../index';
import { buildFrames } from '../../theater/frames';
import { hr } from '../../data/hr';

/**
 * Subquery đủ kiểu, ghép kết quả (UNION, INTERSECT, EXCEPT, MINUS) và WITH.
 * MySQL: kết quả, tên column, mã lỗi và câu báo đều đã kiểm trên MySQL 8.0.46 thật (database hr nạp từ src/data/hr.ts).
 * Oracle: theo tài liệu 19c (SQL Language Reference: Subqueries, Set Operators, WITH; Database Error Messages).
 * Mã Oracle đã kiểm trên Oracle XE 21c thật, chỗ nào 21c khác 19c thì kiểm thêm trên 18c (xem docs/dialect-verification.md).
 */

const DIALECTS: Dialect[] = ['mysql', 'oracle'];
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
const col = (sql: string, d: Dialect) => rows(sql, d).map((r) => r[0]);
const one = (sql: string, d: Dialect) => rows(sql, d)[0][0];
/** Cùng một ý, hai cách viết. */
const by = (d: Dialect, v: { mysql: string; oracle: string }) => v[d];
const top = (d: Dialect, n: number) => (d === 'mysql' ? `LIMIT ${n}` : `FETCH FIRST ${n} ROWS ONLY`);
const each = (name: string, fn: (d: Dialect) => void) => {
  for (const d of DIALECTS) it(`[${d}] ${name}`, () => fn(d));
};
const frames = (t: Trace) => buildFrames(t);

describe('scalar subquery ở mọi chỗ nhận biểu thức', () => {
  each('trong danh sách SELECT', (d) => {
    expect(one('SELECT (SELECT MAX(salary) FROM employees) m FROM DUAL', d)).toBe(24000);
  });
  each('trong WHERE', (d) => {
    expect(one('SELECT COUNT(*) FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)', d)).toBe(11);
  });
  each('trong HAVING', (d) => {
    const r = rows('SELECT department_id, SUM(salary) s FROM employees GROUP BY department_id HAVING SUM(salary) > (SELECT AVG(s2) FROM (SELECT SUM(salary) s2 FROM employees GROUP BY department_id) t) ORDER BY 2', d);
    expect(r).toEqual([[90, 58000], [80, 86000]]);
  });
  each('trong ORDER BY', (d) => {
    const sql = 'SELECT employee_id FROM employees WHERE employee_id < 103 ORDER BY (SELECT salary FROM employees x WHERE x.employee_id = employees.employee_id) DESC';
    expect(col(sql, d)).toEqual([100, 101, 102]);
  });
  each('dùng trong phép tính', (d) => {
    expect(one('SELECT (SELECT 1 FROM DUAL) + (SELECT 2 FROM DUAL) FROM DUAL', d)).toBe(3);
  });
  each('không ra row nào thì là NULL', (d) => {
    expect(one('SELECT (SELECT employee_id FROM employees WHERE 1 = 0) FROM DUAL', d)).toBeNull();
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id = (SELECT employee_id FROM employees WHERE 1 = 0)', d)).toBe(0);
  });
  it('mysql: ra hơn một row thì lỗi 1242', () => {
    const e = fail('SELECT (SELECT department_id FROM departments) FROM DUAL', 'mysql');
    expect(e.code).toBe('1242');
    expect(e.dbMessage).toBe('ERROR 1242 (21000): Subquery returns more than 1 row');
    expect(e.hint).toBe('sub-one-row');
  });
  it('oracle: ra hơn một row thì ORA-01427', () => {
    expect(fail('SELECT (SELECT department_id FROM departments) FROM DUAL', 'oracle').code).toBe('ORA-01427');
  });
  it('mysql: ra hơn một column thì lỗi 1241', () => {
    for (const where of ['SELECT (SELECT 1, 2) FROM DUAL', 'SELECT 1 FROM departments WHERE department_id = (SELECT 1, 2)']) {
      const e = fail(where, 'mysql');
      expect(e.code).toBe('1241');
      expect(e.dbMessage).toBe('ERROR 1241 (21000): Operand should contain 1 column(s)');
    }
  });
  it('oracle: ra hơn một column thì ORA-00913', () => {
    expect(fail('SELECT (SELECT 1, 2 FROM DUAL) FROM DUAL', 'oracle').code).toBe('ORA-00913');
  });
  it('tên column của subquery là chữ gốc trong query (MySQL) hoặc chữ hoa không dấu cách (Oracle)', () => {
    expect(ok('SELECT (SELECT MAX(salary) FROM employees) FROM DUAL', 'mysql').result.columns).toEqual(['(SELECT MAX(salary) FROM employees)']);
    expect(ok('SELECT (SELECT MAX(salary) FROM employees) FROM DUAL', 'oracle').result.columns).toEqual(['(SELECTMAX(SALARY)FROMEMPLOYEES)']);
  });
});

describe('subquery trong FROM', () => {
  each('chọn từ subquery có alias', (d) => {
    expect(col('SELECT t.department_id FROM (SELECT department_id FROM departments WHERE department_id > 100) t ORDER BY 1', d)).toEqual([110, 120]);
  });
  each('SELECT * và t.* hiện column của subquery', (d) => {
    const r = ok('SELECT * FROM (SELECT department_id, department_name FROM departments) t WHERE t.department_id > 100', d).result;
    expect(r.columns.map((c) => c.toLowerCase())).toEqual(['department_id', 'department_name']);
    expect(r.rows).toEqual([[110, 'Accounting'], [120, 'Treasury']]);
    expect(ok('SELECT t.* FROM (SELECT department_id FROM departments) t', d).result.columns).toHaveLength(1);
  });
  each('column tính toán đặt alias rồi dùng ở query ngoài', (d) => {
    expect(one('SELECT t.double_pay FROM (SELECT salary * 2 AS double_pay FROM employees WHERE employee_id = 100) t', d)).toBe(48000);
  });
  each('nối subquery với table', (d) => {
    const r = rows('SELECT d.department_name, s.total FROM departments d JOIN (SELECT department_id, SUM(salary) total FROM employees GROUP BY department_id) s ON s.department_id = d.department_id ORDER BY s.total DESC ' + top(d, 2), d);
    expect(r).toEqual([['Sales', 86000], ['Executive', 58000]]);
  });
  each('nối hai subquery với nhau', (d) => {
    expect(
      rows('SELECT a.x, b.y FROM (SELECT department_id x FROM departments) a JOIN (SELECT department_id y FROM departments) b ON a.x = b.y WHERE a.x < 30 ORDER BY 1', d),
    ).toEqual([[10, 10], [20, 20]]);
  });
  each('lồng nhiều tầng', (d) => {
    expect(col('SELECT * FROM (SELECT * FROM (SELECT * FROM (SELECT department_id FROM departments WHERE department_id > 100) a) b) c ORDER BY 1', d)).toEqual([110, 120]);
  });
  each('subquery trong WHERE nhìn thấy subquery trong FROM, và ngược lại', (d) => {
    expect(col('SELECT t.n FROM (SELECT department_id n FROM departments) t WHERE t.n IN (SELECT n FROM (SELECT location_id n FROM locations UNION SELECT 10 FROM DUAL) u)', d)).toEqual([10]);
  });
  it('mysql: thiếu alias thì lỗi 1248', () => {
    const e = fail('SELECT * FROM (SELECT department_id FROM departments)', 'mysql');
    expect(e.code).toBe('1248');
    expect(e.dbMessage).toBe('ERROR 1248 (42000): Every derived table must have its own alias');
  });
  it('oracle: không cần alias', () => {
    expect(col('SELECT department_id FROM (SELECT department_id FROM departments WHERE department_id > 100)', 'oracle')).toEqual([110, 120]);
  });
  it('mysql: hai column cùng tên trong subquery thì lỗi 1060', () => {
    const e = fail('SELECT * FROM (SELECT 1 a, 2 a) t', 'mysql');
    expect(e.code).toBe('1060');
    expect(e.dbMessage).toBe("ERROR 1060 (42S21): Duplicate column name 'a'");
  });
  // Đã kiểm trên Oracle XE 21c và 18c thật: subquery có hai column cùng tên chạy được khi không đọc tên column nào (COUNT(*), SELECT 1).
  // SELECT *, SELECT a và t.a đều báo ORA-00918.
  it('oracle: hai column cùng tên chỉ lỗi khi đọc tên chúng (ORA-00918)', () => {
    expect(ok('SELECT COUNT(*) FROM (SELECT 1 a, 2 a FROM DUAL)', 'oracle').result.rows).toEqual([[1]]);
    expect(fail('SELECT * FROM (SELECT 1 a, 2 a FROM DUAL)', 'oracle').code).toBe('ORA-00918');
    expect(fail('SELECT a FROM (SELECT 1 a, 2 a FROM DUAL)', 'oracle').code).toBe('ORA-00918');
    expect(fail('SELECT t.a FROM (SELECT 1 a, 2 a FROM DUAL) t', 'oracle').code).toBe('ORA-00918');
  });
  it('oracle: alias trong nháy kép giữ đúng chữ hoa chữ thường', () => {
    const r = ok('SELECT * FROM (SELECT salary "Total" FROM employees) WHERE ROWNUM = 1', 'oracle').result;
    expect(r.columns).toEqual(['Total']);
    expect(col('SELECT "Total" FROM (SELECT salary "Total" FROM employees) WHERE ROWNUM = 1', 'oracle')).toEqual([24000]);
  });
  each('tên column không có trong subquery thì báo như table thường', (d) => {
    const e = fail('SELECT x FROM (SELECT department_id FROM departments) t', d);
    expect(e.code).toBe(d === 'mysql' ? '1054' : 'ORA-00904');
  });
});

describe('subquery phụ thuộc query bên ngoài', () => {
  each('ở WHERE: lương cao hơn trung bình phòng mình', (d) => {
    expect(one('SELECT COUNT(*) FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)', d)).toBe(8);
  });
  each('ở danh sách SELECT: mỗi phòng đếm nhân viên', (d) => {
    const sql = 'SELECT d.department_name, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.department_id) n FROM departments d WHERE d.department_id IN (10, 120) ORDER BY 1';
    expect(rows(sql, d)).toEqual([['Administration', 1], ['Treasury', 0]]);
  });
  each('ở HAVING', (d) => {
    const sql = 'SELECT department_id FROM employees WHERE department_id IS NOT NULL GROUP BY department_id HAVING COUNT(*) > (SELECT COUNT(*) FROM employees e2 WHERE e2.department_id = employees.department_id AND e2.salary > 9000) ORDER BY 1';
    expect(col(sql, d)).toEqual([10, 20, 30, 60, 80, 110]);
  });
  each('ở ORDER BY', (d) => {
    const sql = 'SELECT employee_id FROM employees e WHERE e.department_id IS NOT NULL ORDER BY (SELECT d.location_id FROM departments d WHERE d.department_id = e.department_id), employee_id ' + top(d, 4);
    expect(col(sql, d)).toEqual([103, 104, 105, 106]);
  });
  each('tên column ở subquery thắng tên ở query ngoài khi trùng', (d) => {
    // department_id có ở cả hai: trong subquery, nó là của departments x, nên điều kiện luôn đúng.
    expect(one('SELECT COUNT(*) FROM employees WHERE EXISTS (SELECT 1 FROM departments x WHERE department_id = x.department_id AND x.department_id = 10)', d)).toBe(25);
  });
  each('phụ thuộc hai tầng: subquery trong subquery nhắc tới table ngoài cùng', (d) => {
    const sql = "SELECT employee_id FROM employees e WHERE EXISTS (SELECT 1 FROM departments d WHERE d.department_id = e.department_id AND EXISTS (SELECT 1 FROM locations l WHERE l.location_id = d.location_id AND l.city = 'Seattle' AND e.salary > 10000)) ORDER BY 1";
    expect(col(sql, d)).toEqual([100, 101, 102, 114, 205]);
  });
  each('subquery trong FROM bên trong subquery phụ thuộc', (d) => {
    const sql = 'SELECT COUNT(*) FROM employees e WHERE (SELECT COUNT(*) FROM (SELECT salary FROM employees x WHERE x.department_id = e.department_id) t WHERE t.salary > e.salary) = 0';
    expect(one(sql, d)).toBe(8);
  });
  each('nhắc tới column không có ở đâu thì báo lỗi tên', (d) => {
    const e = fail('SELECT 1 FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM departments WHERE department_id = e.nope)', d);
    expect(e.code).toBe(d === 'mysql' ? '1054' : 'ORA-00904');
  });
  each('chỉ lỗi "nhiều row" khi row thật sự ra nhiều', (d) => {
    // Subquery ra đúng một row cho mỗi nhân viên: không lỗi dù lúc kiểm, row ngoài chưa có giá trị.
    expect(
      one('SELECT COUNT(*) FROM employees e WHERE e.salary = (SELECT MAX(x.salary) FROM employees x WHERE x.department_id = e.department_id OR e.department_id IS NULL)', d),
    ).toBeGreaterThan(0);
  });
});

describe('EXISTS và NOT EXISTS', () => {
  each('EXISTS giữ row có row khớp', (d) => {
    expect(col('SELECT d.department_id FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id AND e.salary > 12000) ORDER BY 1', d)).toEqual([20, 80, 90, 110]);
  });
  each('NOT EXISTS tìm row không có bạn ghép', (d) => {
    expect(col('SELECT d.department_id FROM departments d WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id)', d)).toEqual([120]);
  });
  each('subquery không phụ thuộc: EXISTS đúng hay sai cho cả query', (d) => {
    expect(one('SELECT COUNT(*) FROM departments WHERE EXISTS (SELECT 1 FROM employees WHERE salary > 23000)', d)).toBe(8);
    expect(one('SELECT COUNT(*) FROM departments WHERE EXISTS (SELECT 1 FROM employees WHERE salary > 99000)', d)).toBe(0);
  });
  each('EXISTS không quan tâm subquery chọn gì, kể cả NULL hay nhiều column', (d) => {
    expect(one('SELECT COUNT(*) FROM departments WHERE EXISTS (SELECT NULL FROM DUAL)', d)).toBe(8);
    expect(one('SELECT COUNT(*) FROM departments WHERE EXISTS (SELECT 1, 2 FROM DUAL)', d)).toBe(8);
  });
  it('mysql: EXISTS trong danh sách SELECT ra 1 hoặc 0', () => {
    const r = ok('SELECT EXISTS (SELECT 1 FROM employees WHERE 1 = 0) a, NOT EXISTS (SELECT 1 FROM DUAL) b, EXISTS (SELECT 1 FROM DUAL) c', 'mysql');
    expect(r.result.rows).toEqual([[0, 0, 1]]);
    expect(r.result.columns[0]).toBe('a');
  });
  it('oracle: EXISTS không đứng trong danh sách SELECT, dùng CASE WHEN', () => {
    expect(fail('SELECT EXISTS (SELECT 1 FROM DUAL) FROM DUAL', 'oracle').hint).toBe('condition-in-select');
    expect(one("SELECT CASE WHEN EXISTS (SELECT 1 FROM DUAL) THEN 'co' ELSE 'khong' END FROM DUAL", 'oracle')).toBe('co');
  });
  each('NOT EXISTS ở HAVING', (d) => {
    const sql = 'SELECT department_id FROM employees WHERE department_id IS NOT NULL GROUP BY department_id HAVING NOT EXISTS (SELECT 1 FROM departments d WHERE d.department_id = employees.department_id AND d.location_id <> 1700) ORDER BY 1';
    expect(col(sql, d)).toEqual([10, 30, 90, 110]);
  });
  each('lý do trên từng row nói rõ có hay không có row khớp', (d) => {
    const t = ok('SELECT d.department_id FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id)', d).trace;
    const where = t.steps.find((s) => s.kind === 'where');
    if (where?.kind !== 'where') throw new Error('thiếu bước where');
    expect(where.verdicts.find((v) => !v.pass)?.reason).toBe('subquery không ra row nào');
    expect(where.verdicts.find((v) => v.pass)?.reason).toBe('subquery có ra row');
  });
});

describe('IN, NOT IN, ANY, SOME, ALL', () => {
  each('IN (subquery)', (d) => {
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id IN (SELECT department_id FROM employees)', d)).toBe(7);
  });
  each('NOT IN gặp một NULL trong danh sách thì không row nào qua', (d) => {
    // employees.department_id có một NULL (Grant chưa có phòng).
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id NOT IN (SELECT department_id FROM employees)', d)).toBe(0);
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id <> ALL (SELECT department_id FROM employees)', d)).toBe(0);
  });
  each('loại NULL khỏi danh sách thì NOT IN chạy lại', (d) => {
    expect(col('SELECT department_id FROM departments WHERE department_id NOT IN (SELECT department_id FROM employees WHERE department_id IS NOT NULL)', d)).toEqual([120]);
  });
  each('subquery rỗng: IN sai, NOT IN đúng, kể cả với NULL', (d) => {
    expect(one('SELECT COUNT(*) FROM employees WHERE NULL IN (SELECT 1 FROM DUAL WHERE 1 = 0)', d)).toBe(0);
    expect(one('SELECT COUNT(*) FROM employees WHERE NULL NOT IN (SELECT 1 FROM DUAL WHERE 1 = 0)', d)).toBe(25);
  });
  each('= ANY và = SOME như IN', (d) => {
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id = ANY (SELECT department_id FROM employees)', d)).toBe(7);
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id = SOME (SELECT department_id FROM employees)', d)).toBe(7);
  });
  each('< ANY: nhỏ hơn ít nhất một giá trị', (d) => {
    expect(col('SELECT department_id FROM departments WHERE department_id < ANY (SELECT department_id FROM departments WHERE department_id < 30) ORDER BY 1', d)).toEqual([10]);
  });
  each('> ALL: lớn hơn mọi giá trị', (d) => {
    expect(col('SELECT department_id FROM departments WHERE department_id > ALL (SELECT department_id FROM employees WHERE department_id IS NOT NULL)', d)).toEqual([120]);
    expect(one('SELECT COUNT(*) FROM employees WHERE salary >= ALL (SELECT salary FROM employees)', d)).toBe(1);
  });
  each('subquery rỗng: ANY sai, ALL đúng', (d) => {
    expect(one('SELECT COUNT(*) FROM employees WHERE salary > ANY (SELECT salary FROM employees WHERE 1 = 0)', d)).toBe(0);
    expect(one('SELECT COUNT(*) FROM employees WHERE salary > ALL (SELECT salary FROM employees WHERE 1 = 0)', d)).toBe(25);
  });
  each('NULL trong ANY và ALL cho ra "chưa biết"', (d) => {
    const three = (e: string) => `SELECT CASE WHEN ${e} THEN 'T' WHEN NOT (${e}) THEN 'F' ELSE 'N' END FROM DUAL`;
    const list = (a: string) => `(SELECT ${a} FROM DUAL UNION ALL SELECT NULL FROM DUAL)`;
    expect(one(three(`5 = ANY ${list('5')}`), d)).toBe('T');
    expect(one(three(`5 = ANY ${list('4')}`), d)).toBe('N');
    expect(one(three(`5 > ALL ${list('4')}`), d)).toBe('N');
    expect(one(three(`5 > ALL ${list('6')}`), d)).toBe('F');
  });
  each('subquery ra nhiều column thì báo lỗi', (d) => {
    for (const sql of ['SELECT 1 FROM DUAL WHERE 1 IN (SELECT 1, 2 FROM DUAL)', 'SELECT 1 FROM DUAL WHERE 1 > ALL (SELECT 1, 2 FROM DUAL)']) {
      expect(fail(sql, d).code).toBe(d === 'mysql' ? '1241' : 'ORA-00913');
    }
  });
  it('mysql: LIMIT trong subquery của IN và ANY là lỗi 1235, trong scalar subquery thì được', () => {
    const e = fail('SELECT 1 FROM employees WHERE department_id IN (SELECT department_id FROM departments LIMIT 2)', 'mysql');
    expect(e.code).toBe('1235');
    expect(e.dbMessage).toBe("ERROR 1235 (42000): This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'");
    expect(fail('SELECT 1 FROM employees WHERE department_id = ANY (SELECT department_id FROM departments LIMIT 2)', 'mysql').code).toBe('1235');
    expect(one('SELECT COUNT(*) FROM employees WHERE department_id = (SELECT department_id FROM departments ORDER BY 1 LIMIT 1)', 'mysql')).toBe(1);
  });
  it('oracle: FETCH FIRST trong subquery của IN chạy được', () => {
    expect(one('SELECT COUNT(*) FROM employees WHERE department_id IN (SELECT department_id FROM departments FETCH FIRST 2 ROWS ONLY)', 'oracle')).toBe(3);
  });
});

describe('ghép kết quả', () => {
  const names90 = 'SELECT first_name FROM employees WHERE department_id = 90';
  const vp = "SELECT first_name FROM employees WHERE job_id = 'AD_VP'";
  each('UNION bỏ row trùng, UNION ALL giữ hết', (d) => {
    expect(col(`${names90} UNION ${vp} ORDER BY 1`, d)).toEqual(['Lex', 'Neena', 'Steven']);
    expect(col(`${names90} UNION ALL ${vp} ORDER BY 1`, d)).toEqual(['Lex', 'Lex', 'Neena', 'Neena', 'Steven']);
  });
  each('INTERSECT lấy row có ở cả hai bên', (d) => {
    expect(col('SELECT department_id FROM employees INTERSECT SELECT department_id FROM departments ORDER BY 1', d)).toEqual([10, 20, 30, 60, 80, 90, 110]);
  });
  each('lấy row có ở query đầu mà không có ở query sau (EXCEPT hoặc MINUS)', (d) => {
    const word = by(d, { mysql: 'EXCEPT', oracle: 'MINUS' });
    expect(col(`SELECT department_id FROM departments ${word} SELECT department_id FROM employees`, d)).toEqual([120]);
    expect(col(`SELECT department_id FROM employees WHERE department_id IS NOT NULL ${word} SELECT department_id FROM departments WHERE department_id > 20 ORDER BY 1`, d)).toEqual([10, 20]);
  });
  // Đã kiểm trên Oracle XE 18c thật: ORA-00933. Oracle 21c đã nhận EXCEPT, 19c thì chưa (tài liệu 19c chỉ có UNION, INTERSECT, MINUS). Vị trí lỗi thì engine gạch chân chữ EXCEPT cho dễ hiểu.
  it('oracle: EXCEPT báo ORA-00933 và chỉ sang MINUS', () => {
    const e = fail('SELECT 1 FROM DUAL EXCEPT SELECT 2 FROM DUAL', 'oracle');
    expect(e.code).toBe('ORA-00933');
    expect(e.hint).toBe('except-oracle');
    expect(e.friendly).toContain('MINUS');
  });
  it('mysql: MINUS báo 1064 ở chữ sau MINUS và chỉ sang EXCEPT', () => {
    const e = fail('SELECT 1 FROM DUAL MINUS SELECT 2 FROM DUAL', 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'SELECT 2 FROM DUAL' at line 1");
    expect(e.hint).toBe('minus-mysql');
    expect(e.friendly).toContain('EXCEPT');
    expect(e.span).toEqual({ s: 19, e: 24 });
  });
  each('ghép nhiều hơn hai query, có ngoặc', (d) => {
    const q = (n: string) => `SELECT department_id FROM departments WHERE department_id ${n}`;
    expect(col(`${q('<= 20')} UNION ${q('>= 110')} UNION SELECT 999 FROM DUAL ORDER BY 1`, d)).toEqual([10, 20, 110, 120, 999]);
    expect(col(`(${q('<= 20')} UNION ${q('>= 110')}) ${by(d, { mysql: 'EXCEPT', oracle: 'MINUS' })} ${q('= 20')} ORDER BY 1`, d)).toEqual([10, 110, 120]);
  });
  it('INTERSECT ưu tiên hơn UNION ở MySQL 8, còn Oracle chạy từ trái sang phải', () => {
    const sql = 'SELECT 1 FROM DUAL UNION SELECT 2 FROM DUAL INTERSECT SELECT 2 FROM DUAL';
    expect(col(`${sql} ORDER BY 1`, 'mysql')).toEqual([1, 2]);
    expect(col(sql, 'oracle')).toEqual([2]);
  });
  it('mysql: UNION và EXCEPT ngang hàng, chạy từ trái sang phải', () => {
    expect(col('SELECT 1 UNION SELECT 2 EXCEPT SELECT 2', 'mysql')).toEqual([1]);
    expect(col('SELECT 2 EXCEPT SELECT 2 UNION SELECT 5', 'mysql')).toEqual([5]);
  });
  each('ORDER BY cuối câu áp cho cả kết quả: theo alias của query đầu', (d) => {
    const sql = `SELECT department_id AS d, 'x' AS tag FROM departments WHERE department_id < 30 UNION SELECT location_id, 'y' FROM locations WHERE location_id > 2400 ORDER BY d DESC`;
    expect(rows(sql, d)).toEqual([[2500, 'y'], [20, 'x'], [10, 'x']]);
  });
  each('ORDER BY theo số thứ tự column', (d) => {
    expect(rows('SELECT job_id, salary FROM employees WHERE department_id = 90 UNION SELECT job_id, min_salary FROM jobs WHERE job_id LIKE \'AD%\' ORDER BY 2, 1', d).map((r) => r[1])).toEqual([3000, 15000, 17000, 20080, 24000]);
  });
  each('LIMIT hay FETCH FIRST áp cho cả kết quả', (d) => {
    expect(col(`SELECT department_id FROM departments UNION SELECT department_id FROM employees WHERE department_id IS NOT NULL ORDER BY 1 DESC ${top(d, 3)}`, d)).toEqual([120, 110, 90]);
  });
  it('mysql: LIMIT m, n và OFFSET áp cho cả kết quả', () => {
    expect(col('SELECT department_id FROM departments UNION SELECT department_id FROM employees ORDER BY 1 LIMIT 3 OFFSET 2', 'mysql')).toEqual([20, 30, 60]);
  });
  it('oracle: OFFSET ... FETCH áp cho cả kết quả', () => {
    expect(col('SELECT department_id FROM departments UNION SELECT department_id FROM employees WHERE department_id IS NOT NULL ORDER BY 1 OFFSET 2 ROWS FETCH NEXT 3 ROWS ONLY', 'oracle')).toEqual([30, 60, 80]);
  });
  each('query trong ngoặc có ORDER BY và LIMIT riêng', (d) => {
    const sql = `(SELECT department_id FROM departments ORDER BY 1 ${top(d, 2)}) UNION ALL (SELECT department_id FROM departments ORDER BY 1 DESC ${top(d, 2)}) ORDER BY 1 DESC`;
    expect(col(sql, d)).toEqual([120, 110, 20, 10]);
  });
  each('tên column lấy từ query đầu', (d) => {
    const c = ok('SELECT 1 AS a FROM DUAL UNION SELECT 2 AS b FROM DUAL', d).result.columns;
    expect(c).toEqual([by(d, { mysql: 'a', oracle: 'A' })]);
  });
  each('lệch số column', (d) => {
    const e = fail('SELECT department_id FROM departments UNION SELECT department_id, 1 FROM employees', d);
    expect(e.code).toBe(d === 'mysql' ? '1222' : 'ORA-01789');
    if (d === 'mysql') expect(e.dbMessage).toBe('ERROR 1222 (21000): The used SELECT statements have a different number of columns');
    expect(e.friendly).toContain('1 column');
  });
  it('oracle: lệch nhóm data type là ORA-01790', () => {
    expect(fail("SELECT 1 FROM DUAL UNION SELECT 'x' FROM DUAL", 'oracle').code).toBe('ORA-01790');
    expect(fail('SELECT hire_date FROM employees WHERE ROWNUM = 1 UNION SELECT salary FROM employees WHERE ROWNUM = 1', 'oracle').code).toBe('ORA-01790');
  });
  it('mysql: lệch nhóm data type thì đổi cả hai vế sang chữ', () => {
    const r = ok("SELECT 1 UNION SELECT 'x'", 'mysql').result;
    expect(r.rows).toEqual([['1'], ['x']]);
    expect(rows("SELECT 1 UNION SELECT '1'", 'mysql')).toEqual([['1']]);
    expect(rows('SELECT DATE \'2026-01-01\' UNION SELECT 5', 'mysql')).toEqual([['2026-01-01'], ['5']]);
  });
  it('NULL không làm lệch data type', () => {
    for (const d of DIALECTS) expect(rows('SELECT 1 FROM DUAL UNION SELECT NULL FROM DUAL', d)).toHaveLength(2);
  });
  each('hai NULL là một row khi UNION', (d) => {
    expect(rows('SELECT NULL FROM DUAL UNION SELECT NULL FROM DUAL', d)).toEqual([[null]]);
  });
  it('so chữ khi UNION theo collation của từng dialect', () => {
    expect(rows("SELECT 'a' FROM DUAL UNION SELECT 'A' FROM DUAL", 'mysql')).toEqual([['a']]);
    expect(rows("SELECT 'a' FROM DUAL UNION SELECT 'A' FROM DUAL", 'oracle')).toHaveLength(2);
  });
  it('mysql: ORDER BY nhận biểu thức tính từ tên column của query đầu', () => {
    expect(col('SELECT department_id d FROM departments UNION SELECT 1 ORDER BY d + 1 LIMIT 2', 'mysql')).toEqual([1, 10]);
  });
  // Đã kiểm trên Oracle XE 21c thật: biểu thức tính (d + 1) báo ORA-01785.
  it('oracle: ORDER BY của câu ghép chỉ nhận tên, alias hoặc số thứ tự (ORA-01785)', () => {
    const e = fail('SELECT department_id d FROM departments UNION SELECT 1 FROM DUAL ORDER BY d + 1', 'oracle');
    expect(e.code).toBe('ORA-01785');
    expect(e.hint).toBe('setop-order-expr');
  });
  each('ORDER BY tên không có trong query đầu', (d) => {
    const e = fail('SELECT department_id d FROM departments UNION SELECT 1 FROM DUAL ORDER BY zz', d);
    expect(e.code).toBe(d === 'mysql' ? '1054' : 'ORA-00904');
  });
  each('ORDER BY số thứ tự quá lớn', (d) => {
    const e = fail('SELECT department_id d FROM departments UNION SELECT 1 FROM DUAL ORDER BY 2', d);
    expect(e.code).toBe(d === 'mysql' ? '1054' : 'ORA-01785');
  });
  it('oracle: ORDER BY của câu ghép có tên table đứng trước là ORA-00904', () => {
    // Đã kiểm trên Oracle XE 21c thật: ORA-00904 "DEPARTMENTS"."D": invalid identifier.
    const e = fail('SELECT department_id d FROM departments UNION SELECT 1 FROM DUAL ORDER BY departments.d', 'oracle');
    expect(e.code).toBe('ORA-00904');
  });
  it('mysql: ORDER BY có tên table đứng trước là lỗi 1250', () => {
    const e = fail('SELECT department_id d FROM departments UNION SELECT 1 ORDER BY departments.d', 'mysql');
    expect(e.code).toBe('1250');
    expect(e.dbMessage).toBe("ERROR 1250 (42000): Table 'departments' from one of the SELECTs cannot be used in global ORDER clause");
  });
  each('ORDER BY đứng giữa chuỗi ghép là sai chỗ', (d) => {
    expect(fail('SELECT 1 FROM DUAL ORDER BY 1 UNION SELECT 2 FROM DUAL', d).code).toBe(d === 'mysql' ? '1064' : 'ORA-00933');
  });
  each('INTERSECT ALL chưa dạy', (d) => {
    expect(fail('SELECT 1 FROM DUAL INTERSECT ALL SELECT 1 FROM DUAL', d).kind).toBe('unsupported');
  });
  // Đã kiểm trên Oracle XE 21c và 18c thật: ORA-00928 missing SELECT keyword.
  it('oracle: UNION chưa có query sau là ORA-00928', () => {
    expect(fail('SELECT 1 FROM DUAL UNION', 'oracle').code).toBe('ORA-00928');
  });
  it('mysql: giả FULL JOIN bằng LEFT JOIN và RIGHT JOIN nối bằng UNION', () => {
    const sql = 'SELECT e.employee_id, d.department_id FROM employees e LEFT JOIN departments d ON d.department_id = e.department_id UNION SELECT e.employee_id, d.department_id FROM employees e RIGHT JOIN departments d ON d.department_id = e.department_id';
    expect(rows(sql, 'mysql')).toHaveLength(26);
  });
  each('dùng được trong IN, trong FROM và trong subquery', (d) => {
    expect(one('SELECT COUNT(*) FROM departments WHERE department_id IN (SELECT department_id FROM departments UNION SELECT 10 FROM DUAL UNION SELECT 20 FROM DUAL)', d)).toBe(8);
    expect(one('SELECT COUNT(*) FROM (SELECT department_id FROM departments UNION ALL SELECT department_id FROM departments) t', d)).toBe(16);
  });
  it('mysql: SELECT không có FROM vẫn ghép và sắp được', () => {
    expect(col('SELECT 1 UNION SELECT 2 UNION SELECT 3 ORDER BY 1 DESC LIMIT 2', 'mysql')).toEqual([3, 2]);
  });
});

describe('WITH', () => {
  each('một khối, dùng như table', (d) => {
    expect(col('WITH big AS (SELECT department_id FROM departments WHERE department_id > 100) SELECT department_id FROM big ORDER BY 1', d)).toEqual([110, 120]);
  });
  each('nhiều khối, khối sau dùng khối trước', (d) => {
    const sql = 'WITH big AS (SELECT department_id, COUNT(*) n FROM employees GROUP BY department_id), top1 AS (SELECT MAX(n) m FROM big) SELECT department_id FROM big WHERE n = (SELECT m FROM top1)';
    expect(col(sql, d)).toEqual([80]);
  });
  each('dùng trong JOIN của query chính', (d) => {
    const sql = 'WITH s AS (SELECT department_id, SUM(salary) t FROM employees GROUP BY department_id) SELECT d.department_name, s.t FROM departments d JOIN s ON s.department_id = d.department_id ORDER BY s.t DESC ' + top(d, 2);
    expect(rows(sql, d)).toEqual([['Sales', 86000], ['Executive', 58000]]);
  });
  each('dùng trong subquery', (d) => {
    expect(one('WITH hi AS (SELECT department_id FROM employees WHERE salary > 20000) SELECT COUNT(*) FROM employees WHERE department_id IN (SELECT department_id FROM hi)', d)).toBe(3);
  });
  each('dùng hai lần: nối khối với chính nó', (d) => {
    expect(one('WITH a AS (SELECT department_id FROM departments), b AS (SELECT department_id FROM a WHERE department_id > 100) SELECT COUNT(*) FROM b JOIN a USING (department_id)', d)).toBe(2);
  });
  it('mysql: tên khối che table cùng tên', () => {
    expect(one('WITH employees AS (SELECT * FROM employees WHERE salary > 20000) SELECT COUNT(*) FROM employees', 'mysql')).toBe(1);
  });
  each('khối chứa UNION, và query chính cũng UNION', (d) => {
    expect(col('WITH a AS (SELECT 1 x FROM DUAL UNION SELECT 2 FROM DUAL) SELECT x FROM a UNION SELECT 5 FROM DUAL ORDER BY 1 DESC', d)).toEqual([5, 2, 1]);
  });
  each('ghi tên column trong ngoặc sau tên khối', (d) => {
    const r = ok('WITH a (p, q) AS (SELECT 1, 2 FROM DUAL) SELECT q, p FROM a', d).result;
    expect(r.columns).toEqual(d === 'mysql' ? ['q', 'p'] : ['Q', 'P']);
    expect(r.rows).toEqual([[2, 1]]);
  });
  it('mysql: số tên column không khớp SELECT là lỗi 1353', () => {
    const e = fail('WITH a (p) AS (SELECT 1, 2) SELECT * FROM a', 'mysql');
    expect(e.code).toBe('1353');
    expect(e.hint).toBe('cte-columns');
  });
  it('oracle: số tên column không khớp SELECT là ORA-32038', () => {
    expect(fail('WITH a (p) AS (SELECT 1, 2 FROM DUAL) SELECT * FROM a', 'oracle').code).toBe('ORA-32038');
  });
  it('mysql: hai khối trùng tên là lỗi 1066', () => {
    const e = fail('WITH a AS (SELECT 1 x), a AS (SELECT 2 x) SELECT * FROM a', 'mysql');
    expect(e.code).toBe('1066');
    expect(e.dbMessage).toBe("ERROR 1066 (42000): Not unique table/alias: 'a'");
  });
  it('oracle: hai khối trùng tên không báo lỗi, khối đầu thắng và khối sau không chạy', () => {
    // Đã kiểm trên Oracle XE 21c và 18c thật: WITH a AS (SELECT 1 x ...), a AS (SELECT 2 x ...) cho x = 1, khối sau (kể cả 1/0) không bị chạy.
    expect(rows('WITH a AS (SELECT 1 x FROM DUAL), a AS (SELECT 2 x FROM DUAL) SELECT * FROM a', 'oracle')).toEqual([[1]]);
    expect(rows('WITH a AS (SELECT 1 x FROM DUAL), a AS (SELECT 1/0 x FROM DUAL), b AS (SELECT x + 10 y FROM a) SELECT * FROM b', 'oracle')).toEqual([[11]]);
  });
  it('mysql: WITH RECURSIVE chưa dạy', () => {
    expect(fail('WITH RECURSIVE a AS (SELECT 1 x UNION ALL SELECT x + 1 FROM a WHERE x < 3) SELECT * FROM a', 'mysql').kind).toBe('unsupported');
  });
  it('oracle: khối WITH gọi lại chính nó (đệ quy) chưa dạy', () => {
    const e = fail('WITH a (x) AS (SELECT 1 FROM DUAL UNION ALL SELECT x + 1 FROM a WHERE x < 3) SELECT * FROM a', 'oracle');
    expect(e.kind).toBe('unsupported');
  });
  each('khối WITH báo lỗi tên như query thường', (d) => {
    expect(fail('WITH a AS (SELECT nope FROM employees) SELECT * FROM a', d).code).toBe(d === 'mysql' ? '1054' : 'ORA-00904');
  });
});

describe('subquery trong UPDATE và DELETE', () => {
  const sess = (d: Dialect): Session => createSession(hr, d);
  const salary = (s: Session, id: number): Value => {
    const r = s.run(`SELECT salary FROM employees WHERE employee_id = ${id}`);
    if (!r.ok || r.kind !== 'select') throw new Error('không đọc được');
    return r.result.rows[0][0];
  };
  const good = (s: Session, sql: string) => {
    const r = s.run(sql);
    if (!r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
    return r;
  };
  const bad = (s: Session, sql: string) => {
    const r = s.run(sql);
    if (r.ok) throw new Error(`[${s.dialect}] expected error: ${sql}`);
    return r.error;
  };
  each('UPDATE ... WHERE salary IN (subquery table khác)', (d) => {
    const s = sess(d);
    good(s, 'UPDATE employees SET salary = salary + 1 WHERE department_id IN (SELECT department_id FROM departments WHERE location_id = 1400)');
    expect(salary(s, 103)).toBe(9001);
    expect(salary(s, 100)).toBe(24000);
  });
  each('UPDATE ... SET c = (subquery phụ thuộc)', (d) => {
    const s = sess(d);
    good(s, 'UPDATE departments SET manager_id = (SELECT MAX(employee_id) FROM employees WHERE department_id = departments.department_id) WHERE department_id = 10');
    const r = s.run('SELECT manager_id FROM departments WHERE department_id = 10');
    if (!r.ok || r.kind !== 'select') throw new Error('không đọc được');
    expect(r.result.rows).toEqual([[200]]);
  });
  each('UPDATE ... SET c = (subquery ra nhiều row) bị chặn', (d) => {
    const e = bad(sess(d), 'UPDATE departments SET manager_id = (SELECT employee_id FROM employees) WHERE department_id = 10');
    expect(e.code).toBe(d === 'mysql' ? '1242' : 'ORA-01427');
  });
  each('DELETE ... WHERE NOT EXISTS', (d) => {
    const s = sess(d);
    good(s, 'DELETE FROM departments WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = departments.department_id)');
    const r = s.run('SELECT COUNT(*) FROM departments');
    if (!r.ok || r.kind !== 'select') throw new Error('không đọc được');
    expect(r.result.rows[0][0]).toBe(7);
  });
  it('oracle: subquery đọc chính table đang sửa thì chạy được', () => {
    const s = sess('oracle');
    const before = salary(s, 100);
    good(s, 'UPDATE employees SET salary = salary + 1 WHERE salary > (SELECT AVG(salary) FROM employees)');
    expect(salary(s, 100)).toBe((before as number) + 1);
    good(s, 'DELETE FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)');
    const r = s.run('SELECT COUNT(*) FROM employees');
    if (!r.ok || r.kind !== 'select') throw new Error('không đọc được');
    expect(r.result.rows[0][0]).toBe(14);
  });
  it('mysql: subquery đọc chính table đang sửa là lỗi 1093', () => {
    const s = sess('mysql');
    for (const sql of ['UPDATE employees SET salary = salary + 1 WHERE salary > (SELECT AVG(salary) FROM employees)', 'DELETE FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)', 'UPDATE employees SET salary = (SELECT MAX(salary) FROM employees) WHERE employee_id = 100']) {
      const e = bad(s, sql);
      expect(e.code).toBe('1093');
      expect(e.dbMessage).toBe("ERROR 1093 (HY000): You can't specify target table 'employees' for update in FROM clause");
      expect(e.hint).toBe('target-table');
    }
  });
  it('mysql: lỗi 1093 gọi table theo alias, và bọc subquery trong FROM thì qua', () => {
    const s = sess('mysql');
    expect(bad(s, 'UPDATE employees e SET salary = 1 WHERE e.employee_id IN (SELECT employee_id FROM employees x)').dbMessage).toContain("target table 'e'");
    good(s, 'DELETE FROM employees WHERE salary > (SELECT a FROM (SELECT AVG(salary) a FROM employees) t) AND employee_id > 9999');
    // Subquery chỉ nhắc tới table đang sửa ở điều kiện phụ thuộc thì không phải đọc nó.
    good(s, 'UPDATE employees SET salary = 1 WHERE department_id IN (SELECT department_id FROM departments WHERE department_id = employees.department_id) AND employee_id = 100');
    expect(salary(s, 100)).toBe(1);
  });
  each('INSERT ... SELECT với UNION', (d) => {
    const s = sess(d);
    good(s, 'CREATE TABLE ids (n INT)');
    good(s, 'INSERT INTO ids SELECT department_id FROM departments WHERE department_id < 30 UNION SELECT 999 FROM DUAL');
    const r = s.run('SELECT COUNT(*) FROM ids');
    if (!r.ok || r.kind !== 'select') throw new Error('không đọc được');
    expect(r.result.rows[0][0]).toBe(3);
  });
});

describe('trace và Query Theater', () => {
  const q = {
    union: 'SELECT department_id FROM departments UNION SELECT department_id FROM employees ORDER BY 1',
    unionLimit: 'SELECT first_name FROM employees WHERE department_id = 90 UNION ALL SELECT first_name FROM employees WHERE job_id = \'AD_VP\' ORDER BY 1 DESC',
    intersect: 'SELECT department_id FROM employees INTERSECT SELECT department_id FROM departments',
    derived: 'SELECT t.department_id FROM (SELECT department_id FROM departments WHERE department_id > 100) t WHERE t.department_id > 110',
    derivedJoin: 'SELECT d.department_name, s.n FROM departments d JOIN (SELECT department_id, COUNT(*) n FROM employees GROUP BY department_id) s ON s.department_id = d.department_id',
    with: 'WITH big AS (SELECT department_id FROM departments WHERE department_id > 100) SELECT department_id FROM big ORDER BY department_id',
    withMany: 'WITH a AS (SELECT department_id FROM departments), b AS (SELECT department_id FROM a WHERE department_id > 100) SELECT COUNT(*) FROM b',
    correlated: 'SELECT employee_id FROM employees e WHERE salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id)',
    correlatedSelect: 'SELECT d.department_name, (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.department_id) n FROM departments d',
    exists: 'SELECT d.department_id FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id)',
    notExists: 'SELECT d.department_id FROM departments d WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id)',
    all: 'SELECT employee_id FROM employees WHERE salary > ALL (SELECT salary FROM employees WHERE department_id = 30)',
    notIn: 'SELECT department_id FROM departments WHERE department_id NOT IN (SELECT department_id FROM employees WHERE department_id IS NOT NULL)',
  };
  for (const [name, sql] of Object.entries(q)) {
    each(`${name}: result đúng và frames dựng được`, (d) => {
      const r = ok(sql, d);
      expect(r.trace.result).toBe(r.result);
      const f = frames(r.trace);
      expect(f.length).toBeGreaterThan(3);
      expect(f.at(-1)?.phase).toBe('done');
      // Mỗi row kết quả có một id, và id không trùng nhau.
      expect(new Set(r.result.rowIds).size).toBe(r.result.rows.length);
    });
  }
  each('query có ghép, subquery trong FROM, WITH, subquery phụ thuộc đều mang partial', (d) => {
    for (const name of ['union', 'unionLimit', 'intersect', 'derived', 'derivedJoin', 'with', 'withMany', 'correlated', 'correlatedSelect', 'exists', 'notExists'] as const) {
      expect(ok(q[name], d).trace.partial, name).toBe(true);
    }
  });
  each('query diễn được trọn vẹn không mang partial', (d) => {
    for (const name of ['all', 'notIn'] as const) expect(ok(q[name], d).trace.partial, name).toBeUndefined();
    expect(ok('SELECT COUNT(*) FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)', d).trace.partial).toBeUndefined();
    expect(ok('SELECT * FROM departments WHERE department_id IN (SELECT department_id FROM employees)', d).trace.partial).toBeUndefined();
  });
  each('subquery không phụ thuộc vẫn có bước subquery, subquery phụ thuộc thì không', (d) => {
    expect(ok(q.all, d).trace.steps.some((s) => s.kind === 'subquery')).toBe(true);
    expect(ok(q.correlated, d).trace.steps.some((s) => s.kind === 'subquery')).toBe(false);
  });
  each('trace của query ghép: một bước from với row đã ghép, rồi order và limit', (d) => {
    const t = ok(`SELECT department_id FROM departments UNION SELECT department_id FROM employees WHERE department_id IS NOT NULL ORDER BY 1 DESC ${top(d, 3)}`, d).trace;
    expect(t.steps.map((s) => s.kind)).toEqual(['from', 'order', 'limit']);
    const from = t.steps[0];
    if (from.kind !== 'from') throw new Error('bước đầu không phải from');
    expect(from.rows).toHaveLength(8);
    expect(t.clauses.map((c) => c.kind)).toEqual(['FROM', 'ORDER BY', by(d, { mysql: 'LIMIT', oracle: 'FETCH' })]);
    expect(t.result.rows.map((r) => r[0])).toEqual([120, 110, 90]);
  });
  each('trace của subquery trong FROM: from mang tên alias, row đã có sẵn', (d) => {
    const t = ok(q.derived, d).trace;
    const from = t.steps[0];
    if (from.kind !== 'from') throw new Error('bước đầu không phải from');
    expect(from.table).toBe('t');
    expect(from.rows.map((r) => r.cells[0])).toEqual([110, 120]);
  });
  each('trace của WITH: from mang tên khối', (d) => {
    const from = ok(q.with, d).trace.steps[0];
    if (from.kind !== 'from') throw new Error('bước đầu không phải from');
    expect(from.table).toBe('big');
  });
  each('query ghép đặt trong subquery vẫn cho trace hợp lệ ở query ngoài', (d) => {
    const t = ok('SELECT department_id FROM departments WHERE department_id IN (SELECT department_id FROM departments WHERE department_id < 30 UNION SELECT 120 FROM DUAL)', d).trace;
    expect(t.partial).toBeUndefined();
    expect(frames(t).length).toBeGreaterThan(3);
  });
  each('SELECT, ORDER BY, LIMIT của query ngoài vẫn diễn đủ khi subquery trong FROM', (d) => {
    const t = ok(`SELECT t.department_id FROM (SELECT department_id FROM departments) t ORDER BY t.department_id DESC ${top(d, 2)}`, d).trace;
    expect(t.steps.map((s) => s.kind)).toEqual(['from', 'select', 'order', 'limit']);
  });
});

describe('lời giải thích tiếng Việt cho lỗi mới', () => {
  const banned = /\b(bảng|cột|hàng|dòng|truy vấn|cơ sở dữ liệu|khóa chính|khóa ngoại|chỉ mục|lược đồ|ràng buộc|mệnh đề)\b/i;
  const cases: [Dialect, string][] = [
    ['mysql', 'SELECT * FROM (SELECT 1)'],
    ['mysql', 'SELECT * FROM (SELECT 1 a, 2 a) t'],
    ['mysql', 'SELECT 1 MINUS SELECT 2'],
    ['oracle', 'SELECT 1 FROM DUAL EXCEPT SELECT 2 FROM DUAL'],
    ['mysql', 'SELECT 1 UNION SELECT 1, 2'],
    ['oracle', "SELECT 1 FROM DUAL UNION SELECT 'a' FROM DUAL"],
    ['oracle', 'SELECT 1 d FROM DUAL UNION SELECT 2 FROM DUAL ORDER BY d + 1'],
    ['mysql', 'SELECT 1 d UNION SELECT 2 ORDER BY x.d'],
    ['mysql', 'WITH a (p) AS (SELECT 1, 2) SELECT * FROM a'],
    ['oracle', 'WITH a (p) AS (SELECT 1, 2 FROM DUAL) SELECT * FROM a'],
    ['mysql', 'WITH a AS (SELECT 1 x), a AS (SELECT 2 x) SELECT * FROM a'],
    ['mysql', 'SELECT 1 FROM employees WHERE department_id IN (SELECT department_id FROM departments LIMIT 2)'],
    ['oracle', 'SELECT a FROM (SELECT 1 a, 2 a FROM DUAL)'],
  ];
  for (const [d, sql] of cases) {
    it(`[${d}] ${sql.slice(0, 60)}`, () => {
      const e = fail(sql, d);
      expect(e.friendly.length).toBeGreaterThan(20);
      expect(e.friendly).not.toMatch(banned);
    });
  }
  it('lời nhắc cho lỗi 1093 không dùng từ cấm và nhắc cách tránh', () => {
    const s = createSession(hr, 'mysql');
    const r = s.run('DELETE FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)');
    if (r.ok) throw new Error('phải lỗi');
    expect(r.error.friendly).not.toMatch(banned);
    expect(r.error.friendly).toContain('FROM');
  });
});
