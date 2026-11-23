import { describe, expect, it } from 'vitest';
import { bad, col0, each, exec, sel, sess } from './adv-util';

/**
 * VIEW, CREATE TABLE ... AS SELECT, và tên đầy đủ schema.table.
 * MySQL: mã lỗi, kết quả, SHOW FULL TABLES đã kiểm trên MySQL 8.0.46 thật.
 * Oracle: theo tài liệu 19c (CREATE VIEW, CREATE TABLE, Database Error Messages).
 */

const T = (name: string, fn: Parameters<typeof each>[2]) => each(it, name, fn);
const IT_VIEW = "CREATE VIEW v_it AS SELECT id, name, salary * 2 AS s2 FROM employees WHERE dept = 'IT'";

describe('VIEW', () => {
  T('CREATE VIEW rồi SELECT như một table', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    expect(sel(s, 'SELECT * FROM v_it ORDER BY id')).toEqual([[1, 'An', 200], [2, 'Binh', 400]]);
    expect(col0(s, 'SELECT name FROM v_it WHERE s2 > 300')).toEqual(['Binh']);
  });

  T('JOIN một view với table', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    expect(sel(s, 'SELECT e.name, v.s2 FROM employees e JOIN v_it v ON v.id = e.id ORDER BY e.id')).toEqual([['An', 200], ['Binh', 400]]);
  });

  T('view luôn đọc dữ liệu hiện tại của table', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    exec(s, "INSERT INTO employees (id, name, dept, salary) VALUES (9, 'Zed', 'IT', 10)");
    expect(col0(s, 'SELECT COUNT(*) FROM v_it')).toEqual([3]);
  });

  T('CREATE OR REPLACE VIEW thay view cũ, CREATE VIEW trùng tên thì lỗi', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    const e = bad(s, 'CREATE VIEW v_it AS SELECT 1 AS x FROM DUAL');
    expect(e.code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
    expect(e.friendly).toContain('CREATE OR REPLACE VIEW');
    exec(s, 'CREATE OR REPLACE VIEW v_it AS SELECT name FROM employees');
    expect(sel(s, 'SELECT COUNT(*) FROM v_it')).toEqual([[5]]);
  });

  T('tên view không được trùng tên table, và ngược lại', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    expect(bad(s, 'CREATE VIEW employees AS SELECT 1 AS x FROM DUAL').code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
    expect(bad(s, 'CREATE TABLE v_it (a INT)').code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
  });

  T('DROP VIEW; DROP VIEW lần hai và DROP TABLE trên view đều lỗi', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    expect(bad(s, 'DROP TABLE v_it').code).toBe(d === 'mysql' ? '1051' : 'ORA-00942');
    exec(s, 'DROP VIEW v_it');
    expect(bad(s, 'SELECT * FROM v_it').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
    expect(bad(s, 'DROP VIEW v_it').code).toBe(d === 'mysql' ? '1051' : 'ORA-00942');
  });

  T('DROP VIEW trên một table thật thì lỗi', (d) => {
    const e = bad(sess(d), 'DROP VIEW employees');
    expect(e.code).toBe(d === 'mysql' ? '1347' : 'ORA-00942');
  });

  it('mysql: DROP VIEW IF EXISTS không lỗi. Oracle 19c không có IF EXISTS', () => {
    exec(sess('mysql'), 'DROP VIEW IF EXISTS nope');
    expect(bad(sess('oracle'), 'DROP VIEW IF EXISTS nope').code).toBe('ORA-00933');
  });

  T('INSERT, UPDATE, DELETE trên view: khóa học chưa dạy tới', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    for (const sql of ["INSERT INTO v_it VALUES (7, 'x', 1)", "UPDATE v_it SET name = 'x'", 'DELETE FROM v_it']) {
      const e = bad(s, sql);
      expect(e.kind).toBe('unsupported');
      expect(e.friendly).toContain('view');
    }
    expect(sel(s, 'SELECT COUNT(*) FROM employees')).toEqual([[5]]);
  });

  T('view hiện trong schema() kèm câu SELECT', (d) => {
    const s = sess(d);
    exec(s, IT_VIEW);
    const v = s.schema().views;
    expect(v).toHaveLength(1);
    expect(v[0].name).toBe('v_it');
    expect(v[0].sql).toBe("SELECT id, name, salary * 2 AS s2 FROM employees WHERE dept = 'IT'");
    exec(s, 'DROP VIEW v_it');
    expect(s.schema().views).toEqual([]);
  });

  T('view mất table nền thì báo view hỏng (1356, ORA-04063)', (d) => {
    const s = sess(d);
    exec(s, 'CREATE VIEW v_kv AS SELECT k FROM kv');
    exec(s, 'DROP TABLE kv');
    const e = bad(s, 'SELECT * FROM v_kv');
    expect(e.code).toBe(d === 'mysql' ? '1356' : 'ORA-04063');
  });

  it('mysql: SHOW TABLES có view, SHOW FULL TABLES ghi Table_type', () => {
    const s = sess('mysql');
    exec(s, IT_VIEW);
    expect(col0(s, 'SHOW TABLES')).toEqual(['employees', 'kv', 'v_it']);
    expect(sel(s, 'SHOW FULL TABLES')).toEqual([['employees', 'BASE TABLE'], ['kv', 'BASE TABLE'], ['v_it', 'VIEW']]);
  });

  it('oracle: USER_VIEWS có view, USER_TABLES thì không', () => {
    const s = sess('oracle');
    exec(s, IT_VIEW);
    expect(sel(s, 'SELECT view_name FROM USER_VIEWS')).toEqual([['V_IT']]);
    expect(col0(s, 'SELECT table_name FROM USER_TABLES ORDER BY 1')).toEqual(['EMPLOYEES', 'KV']);
  });

  it('oracle: biểu thức không có alias thì ORA-00998', () => {
    const s = sess('oracle');
    const e = bad(s, 'CREATE VIEW v AS SELECT salary * 2 FROM employees');
    expect(e.code).toBe('ORA-00998');
    expect(e.friendly).toContain('alias');
  });

  it('mysql: tên column trùng trong view thì 1060', () => {
    expect(bad(sess('mysql'), 'CREATE VIEW v AS SELECT name n, id n FROM employees').code).toBe('1060');
  });
});

describe('CREATE TABLE ... AS SELECT', () => {
  T('chép column và row', (d) => {
    const s = sess(d);
    exec(s, "CREATE TABLE it_copy AS SELECT id, name, salary FROM employees WHERE dept = 'IT'");
    expect(sel(s, 'SELECT * FROM it_copy ORDER BY id')).toEqual([[1, 'An', 100], [2, 'Binh', 200]]);
    const t = s.schema().tables.find((x) => x.name === 'it_copy')!;
    expect(t.columns.map((c) => c.type)).toEqual(d === 'mysql' ? ['INT', 'VARCHAR(50)', 'DECIMAL(10,2)'] : ['NUMBER(38)', 'VARCHAR2(50)', 'NUMBER(10,2)']);
  });

  T('không chép primary key, nhưng giữ NOT NULL', (d) => {
    const s = sess(d);
    exec(s, 'CREATE TABLE copy1 AS SELECT * FROM employees');
    const t = s.schema().tables.find((x) => x.name === 'copy1')!;
    expect(t.columns.some((c) => c.pk)).toBe(false);
    expect(t.columns.map((c) => c.nullable)).toEqual([false, false, true, true, true]);
    // Không còn primary key: hai row trùng id vào được.
    exec(s, "INSERT INTO copy1 (id, name) VALUES (1, 'trùng')");
  });

  it('mysql: column số NOT NULL có DEFAULT 0, như MySQL thật', () => {
    const s = sess('mysql');
    exec(s, 'CREATE TABLE copy1 AS SELECT id, name FROM employees');
    const t = s.schema().tables.find((x) => x.name === 'copy1')!;
    expect(t.columns[0].default).toBe('0');
    expect(t.columns[1].default).toBeUndefined();
  });

  T('table mới độc lập với table gốc', (d) => {
    const s = sess(d);
    exec(s, 'CREATE TABLE copy1 AS SELECT * FROM employees');
    exec(s, "UPDATE copy1 SET name = 'x'");
    expect(col0(s, "SELECT COUNT(*) FROM employees WHERE name = 'x'")).toEqual([0]);
  });

  T('column là biểu thức, window function và gom nhóm', (d) => {
    const s = sess(d);
    exec(s, 'CREATE TABLE rep AS SELECT dept, COUNT(*) AS n, SUM(salary) AS total FROM employees GROUP BY dept');
    expect(sel(s, 'SELECT dept, n, total FROM rep WHERE dept IS NOT NULL ORDER BY dept')).toEqual([['HR', 2, 300], ['IT', 2, 300]]);
    exec(s, 'CREATE TABLE ranked AS SELECT name, RANK() OVER (ORDER BY salary DESC) AS rk FROM employees');
    expect(col0(s, 'SELECT rk FROM ranked WHERE name = ' + "'Binh'")).toEqual([1]);
  });

  T('tên table đã có thì lỗi', (d) => {
    const e = bad(sess(d), 'CREATE TABLE employees AS SELECT * FROM kv');
    expect(e.code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
  });

  it('mysql: có thể bỏ chữ AS. Hai column trùng tên thì 1060', () => {
    const s = sess('mysql');
    exec(s, 'CREATE TABLE c3 SELECT name, dept FROM employees WHERE id < 3');
    expect(col0(s, 'SELECT COUNT(*) FROM c3')).toEqual([2]);
    expect(bad(s, 'CREATE TABLE c5 AS SELECT name, name FROM employees').code).toBe('1060');
  });

  it('oracle: biểu thức không có alias thì ORA-00998. Tên column giữ chữ hoa của alias', () => {
    const s = sess('oracle');
    expect(bad(s, 'CREATE TABLE c1 AS SELECT salary * 2 FROM employees').code).toBe('ORA-00998');
    exec(s, 'CREATE TABLE c2 AS SELECT salary * 2 AS "Double" FROM employees');
    const r = exec(s, 'SELECT "Double" FROM c2 ORDER BY 1');
    expect(r.kind === 'select' && r.result.columns).toEqual(['Double']);
  });

  T('CREATE TABLE AS SELECT tự COMMIT như mọi lệnh DDL', (d) => {
    const s = sess(d);
    if (d === 'mysql') exec(s, 'START TRANSACTION');
    exec(s, 'DELETE FROM kv');
    exec(s, 'CREATE TABLE c9 AS SELECT * FROM kv');
    expect(s.pending()).toBe(0);
    exec(s, 'ROLLBACK');
    expect(col0(s, 'SELECT COUNT(*) FROM kv')).toEqual([0]);
  });
});

describe('tên đầy đủ schema.table', () => {
  T('đúng schema thì chạy như thường ở SELECT, INSERT, UPDATE, DELETE', (d) => {
    const s = sess(d);
    const q = d === 'mysql' ? 'congty' : 'CONGTY';
    expect(col0(s, `SELECT COUNT(*) FROM ${q}.employees`)).toEqual([5]);
    exec(s, `INSERT INTO ${q}.kv VALUES ('c', 3, 3)`);
    exec(s, `UPDATE ${q}.kv SET v = 9 WHERE k = 'c'`);
    expect(col0(s, `SELECT v FROM ${q}.kv WHERE k = 'c'`)).toEqual([9]);
    exec(s, `DELETE FROM ${q}.kv WHERE k = 'c'`);
    expect(col0(s, 'SELECT COUNT(*) FROM kv')).toEqual([2]);
  });

  T('schema có alias, trong JOIN và trong subquery', (d) => {
    const s = sess(d);
    const q = d === 'mysql' ? 'congty' : 'CONGTY';
    const sql = `SELECT e.name FROM ${q}.employees e JOIN ${q}.kv k ON k.v = e.id WHERE e.id IN (SELECT v FROM ${q}.kv) ORDER BY e.id`;
    expect(col0(s, sql)).toEqual(['An', 'Binh']);
  });

  T('DDL kèm schema: CREATE TABLE, CREATE VIEW, ALTER, TRUNCATE, DROP', (d) => {
    const s = sess(d);
    const q = d === 'mysql' ? 'congty' : 'CONGTY';
    exec(s, `CREATE TABLE ${q}.t1 (a INT)`);
    exec(s, `ALTER TABLE ${q}.t1 ADD b INT`);
    exec(s, `INSERT INTO ${q}.t1 VALUES (1, 2)`);
    exec(s, `TRUNCATE TABLE ${q}.t1`);
    exec(s, `CREATE VIEW ${q}.v1 AS SELECT a FROM ${q}.t1`);
    exec(s, `DROP VIEW ${q}.v1`);
    exec(s, `DROP TABLE ${q}.t1`);
    expect(s.schema().tables.map((t) => t.name)).toEqual(['employees', 'kv']);
  });

  it('oracle: schema viết thường hay hoa đều được, nháy kép thì phân biệt', () => {
    const s = sess('oracle');
    expect(col0(s, 'SELECT COUNT(*) FROM congty.employees')).toEqual([5]);
    expect(bad(s, 'SELECT COUNT(*) FROM "congty".employees').code).toBe('ORA-00942');
  });

  it('mysql: tên schema phân biệt hoa thường', () => {
    const e = bad(sess('mysql'), 'SELECT COUNT(*) FROM CONGTY.employees');
    expect(e.code).toBe('1049');
    expect(e.dbMessage).toBe("ERROR 1049 (42000): Unknown database 'CONGTY'");
  });

  T('schema khác: MySQL 1049, Oracle ORA-00942, ở mọi lệnh', (d) => {
    const s = sess(d);
    const code = d === 'mysql' ? '1049' : 'ORA-00942';
    for (const sql of [
      'SELECT * FROM khac.employees',
      "INSERT INTO khac.kv VALUES ('z', 1, 1)",
      'UPDATE khac.kv SET v = 1',
      'DELETE FROM khac.kv',
      'ALTER TABLE khac.kv ADD z INT',
    ]) {
      const e = bad(s, sql);
      expect(e.code, sql).toBe(code);
      expect(e.friendly).toContain(d === 'mysql' ? 'congty' : 'CONGTY');
    }
  });

  T('CREATE, DROP, TRUNCATE trong schema khác', (d) => {
    const s = sess(d);
    expect(bad(s, 'CREATE TABLE khac.t (a INT)').code).toBe(d === 'mysql' ? '1049' : 'ORA-01918');
    expect(bad(s, 'DROP TABLE khac.kv').code).toBe(d === 'mysql' ? '1051' : 'ORA-00942');
    expect(bad(s, 'TRUNCATE TABLE khac.kv').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
  });

  T('đúng schema nhưng table không có: lỗi table như thường', (d) => {
    const q = d === 'mysql' ? 'congty' : 'CONGTY';
    expect(bad(sess(d), `SELECT * FROM ${q}.nope`).code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
  });

  T('DESC kèm schema', (d) => {
    const s = sess(d);
    const q = d === 'mysql' ? 'congty' : 'CONGTY';
    expect(sel(s, `DESC ${q}.kv`).length).toBe(3);
    expect(bad(s, 'DESC khac.kv').code).toBe(d === 'mysql' ? '1049' : 'ORA-04043');
  });

  it('oracle: ALL_TABLES và ALL_TAB_COLUMNS có OWNER là tên schema, SELECT USER trả tên schema', () => {
    const s = sess('oracle');
    expect(sel(s, 'SELECT DISTINCT owner FROM ALL_TABLES')).toEqual([['CONGTY']]);
    expect(sel(s, 'SELECT DISTINCT owner FROM ALL_TAB_COLUMNS')).toEqual([['CONGTY']]);
    expect(sel(s, 'SELECT USER FROM DUAL')).toEqual([['CONGTY']]);
  });
});
