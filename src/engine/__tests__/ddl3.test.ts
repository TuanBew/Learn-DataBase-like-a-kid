import { describe, expect, it } from 'vitest';
import { createSession, splitStatements } from '../index';
import type { Dialect } from '../index';
import { teashop } from '../../data/teashop';
import { BOTH, INT, S, TEXT, all, err, good, rows } from './ddl-util';

/**
 * Sequence của Oracle, INSERT ... SELECT, chú thích, splitStatements, runScript, hình dạng của kết quả DDL,
 * Database lưu lại được, và DDL trên table mẫu.
 * Test MySQL ghi kết quả đã thấy trên MySQL 8.0.46 thật. Test Oracle theo Oracle Database 19c SQL Language Reference.
 */

describe('Sequence (Oracle)', () => {
  it('CREATE SEQUENCE mặc định bắt đầu từ 1, tăng 1', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    expect(rows(s, 'SELECT s.NEXTVAL FROM DUAL')).toEqual([[1]]);
    expect(rows(s, 'SELECT s.NEXTVAL FROM DUAL')).toEqual([[2]]);
  });

  it('START WITH và INCREMENT BY', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s2 START WITH 100 INCREMENT BY 10');
    expect(rows(s, 'SELECT s2.NEXTVAL FROM DUAL')).toEqual([[100]]);
    expect(rows(s, 'SELECT s2.NEXTVAL FROM DUAL')).toEqual([[110]]);
  });

  it('INCREMENT BY số âm, kèm NOCACHE NOCYCLE', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s4 START WITH 5 INCREMENT BY -1 NOCACHE NOCYCLE');
    expect(rows(s, 'SELECT s4.NEXTVAL FROM DUAL')).toEqual([[5]]);
    expect(rows(s, 'SELECT s4.NEXTVAL FROM DUAL')).toEqual([[4]]);
  });

  it('tiêu đề column của s.NEXTVAL là NEXTVAL, alias thì dùng alias', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    const r = s.run('SELECT s.NEXTVAL FROM DUAL');
    expect(r.ok && r.kind === 'select' && r.result.columns).toEqual(['NEXTVAL']);
    const r2 = s.run('SELECT s.CURRVAL AS cur FROM DUAL');
    expect(r2.ok && r2.kind === 'select' && r2.result.columns).toEqual(['CUR']);
  });

  it('CURRVAL trả về số NEXTVAL vừa cấp trong phiên này', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    rows(s, 'SELECT s.NEXTVAL FROM DUAL');
    rows(s, 'SELECT s.NEXTVAL FROM DUAL');
    expect(rows(s, 'SELECT s.CURRVAL FROM DUAL')).toEqual([[2]]);
    expect(rows(s, 'SELECT s.CURRVAL FROM DUAL')).toEqual([[2]]);
  });

  it('NEXTVAL gọi nhiều lần trong một câu SELECT chỉ tăng một lần', () => {
    // Oracle: NEXTVAL hai lần trong cùng một câu ra cùng một số.
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    expect(rows(s, 'SELECT s.NEXTVAL, s.CURRVAL, s.NEXTVAL FROM DUAL')).toEqual([[1, 1, 1]]);
    expect(rows(s, 'SELECT s.NEXTVAL FROM DUAL')).toEqual([[2]]);
  });

  it('CURRVAL trước khi gọi NEXTVAL là ORA-08002', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    const e = err(s, 'SELECT s.CURRVAL FROM DUAL');
    expect(e.dbMessage).toBe('ORA-08002: sequence S.CURRVAL is not yet defined in this session');
    expect(e.friendly).toContain('NEXTVAL');
  });

  it('INSERT dùng s.NEXTVAL cho mã và s.CURRVAL cho row con', () => {
    const s = S('oracle');
    all(s, ['CREATE SEQUENCE order_seq START WITH 1000', 'CREATE TABLE orders (id NUMBER PRIMARY KEY, who VARCHAR2(10))', 'CREATE TABLE items (id NUMBER PRIMARY KEY, order_id NUMBER REFERENCES orders)']);
    good(s, "INSERT INTO orders (id, who) VALUES (order_seq.NEXTVAL, 'An')");
    good(s, 'INSERT INTO items VALUES (1, order_seq.CURRVAL)');
    good(s, "INSERT INTO orders VALUES (order_seq.NEXTVAL, 'Bình')");
    expect(rows(s, 'SELECT id, who FROM orders ORDER BY id')).toEqual([[1000, 'An'], [1001, 'Bình']]);
    expect(rows(s, 'SELECT order_id FROM items')).toEqual([[1000]]);
  });

  it('sequence không có: NEXTVAL là ORA-02289', () => {
    const s = S('oracle');
    const e = err(s, 'SELECT nope.NEXTVAL FROM DUAL');
    expect(e.dbMessage).toBe('ORA-02289: sequence does not exist');
  });

  it('DROP SEQUENCE: xong thì NEXTVAL lỗi, DROP lần nữa là ORA-02289', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    good(s, 'DROP SEQUENCE s');
    expect(err(s, 'SELECT s.NEXTVAL FROM DUAL').code).toBe('ORA-02289');
    expect(err(s, 'DROP SEQUENCE s').dbMessage).toBe('ORA-02289: sequence does not exist');
  });

  it('tạo sequence trùng tên: ORA-00955, và trùng tên với table cũng vậy', () => {
    const s = S('oracle');
    all(s, ['CREATE SEQUENCE s', 'CREATE TABLE t (a NUMBER)']);
    expect(err(s, 'CREATE SEQUENCE s').dbMessage).toBe('ORA-00955: name is already used by an existing object');
    expect(err(s, 'CREATE SEQUENCE t').code).toBe('ORA-00955');
    expect(err(s, 'CREATE TABLE s (a NUMBER)').code).toBe('ORA-00955');
  });

  it('INCREMENT BY 0 là ORA-04002', () => {
    // Error Messages 19c: ORA-04002 INCREMENT must be a non-zero integer (cause: sequence increment was specified to be zero)
    expect(err(S('oracle'), 'CREATE SEQUENCE s3 INCREMENT BY 0').dbMessage).toBe('ORA-04002: INCREMENT must be a non-zero integer');
  });

  it('MINVALUE, MAXVALUE, CYCLE khóa học chưa dạy', () => {
    const e = err(S('oracle'), 'CREATE SEQUENCE s5 MAXVALUE 10');
    expect(e.code).toBe('CHUA-HOC');
  });

  it('sequence và số đã cấp nằm trong Database (JSON thuần), session mới đếm tiếp', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s START WITH 10 INCREMENT BY 5');
    rows(s, 'SELECT s.NEXTVAL FROM DUAL');
    rows(s, 'SELECT s.NEXTVAL FROM DUAL');
    const saved = JSON.parse(JSON.stringify(s.db()));
    expect(saved.sequences).toEqual([{ name: 's', start: 10, increment: 5, last: 15 }]);
    const s2 = createSession(saved, 'oracle');
    expect(rows(s2, 'SELECT s.NEXTVAL FROM DUAL')).toEqual([[20]]);
  });

  it('CURRVAL của phiên mới chưa có giá trị dù sequence đã được dùng ở phiên cũ', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    rows(s, 'SELECT s.NEXTVAL FROM DUAL');
    const s2 = createSession(JSON.parse(JSON.stringify(s.db())), 'oracle');
    expect(err(s2, 'SELECT s.CURRVAL FROM DUAL').code).toBe('ORA-08002');
  });

  it('ROLLBACK không hoàn lại số sequence đã cấp', () => {
    const s = S('oracle');
    all(s, ['CREATE SEQUENCE s', 'CREATE TABLE t (id NUMBER)']);
    good(s, 'INSERT INTO t VALUES (s.NEXTVAL)');
    good(s, 'ROLLBACK');
    good(s, 'INSERT INTO t VALUES (s.NEXTVAL)');
    expect(rows(s, 'SELECT id FROM t')).toEqual([[2]]);
  });

  it('reset() về database gốc, bỏ cả sequence', () => {
    const s = S('oracle');
    good(s, 'CREATE SEQUENCE s');
    s.reset();
    expect(err(s, 'SELECT s.NEXTVAL FROM DUAL').code).toBe('ORA-02289');
    expect(s.db().sequences).toBeUndefined();
  });

  it('DEFAULT s.NEXTVAL trên column', () => {
    const s = S('oracle');
    all(s, ['CREATE SEQUENCE s', 'CREATE TABLE t (id NUMBER DEFAULT s.NEXTVAL PRIMARY KEY, v NUMBER)']);
    good(s, 'INSERT INTO t (v) VALUES (7)');
    good(s, 'INSERT INTO t (v) VALUES (8)');
    expect(rows(s, 'SELECT id, v FROM t ORDER BY id')).toEqual([[1, 7], [2, 8]]);
  });

  it('MySQL không có sequence: CREATE SEQUENCE và DROP SEQUENCE là lỗi cú pháp 1064', () => {
    // MySQL thật: ERROR 1064 ... near 'sequence s start with 1' at line 1
    const s = S('mysql');
    expect(err(s, 'CREATE SEQUENCE s START WITH 1').dbMessage).toContain("near 'SEQUENCE s START WITH 1' at line 1");
    expect(err(s, 'DROP SEQUENCE s').dbMessage).toContain("near 'SEQUENCE s' at line 1");
    expect(err(s, 'CREATE SEQUENCE s').code).toBe('1064');
  });

  it('MySQL: s.NEXTVAL không phải sequence, chỉ là column không có', () => {
    const s = S('mysql');
    expect(err(s, 'SELECT s.nextval FROM DUAL').code).toBe('1054');
  });
});

describe('INSERT ... SELECT', () => {
  for (const d of BOTH) {
    const make = () => {
      const s = S(d);
      all(s, [
        `CREATE TABLE src (a ${INT[d]}, b ${TEXT[d]}(10))`,
        `CREATE TABLE dst (a ${INT[d]} PRIMARY KEY, b ${TEXT[d]}(10), c ${INT[d]} DEFAULT 5)`,
        "INSERT INTO src VALUES (1, 'x')",
        "INSERT INTO src VALUES (2, 'y')",
        "INSERT INTO src VALUES (3, 'z')",
      ]);
      return s;
    };

    it(`${d}: INSERT INTO t (a, b) SELECT ... chép row, column bỏ qua lấy DEFAULT`, () => {
      const s = make();
      good(s, 'INSERT INTO dst (a, b) SELECT a, b FROM src WHERE a < 3');
      expect(rows(s, 'SELECT a, b, c FROM dst ORDER BY a')).toEqual([[1, 'x', 5], [2, 'y', 5]]);
    });

    it(`${d}: INSERT INTO t SELECT * (không ghi danh sách column)`, () => {
      const s = make();
      good(s, 'CREATE TABLE copy2 (a ' + INT[d] + ', b ' + TEXT[d] + '(10))');
      good(s, 'INSERT INTO copy2 SELECT * FROM src');
      expect(rows(s, 'SELECT COUNT(*) FROM copy2')).toEqual([[3]]);
    });

    it(`${d}: kết quả của DmlTrace nói đúng bao nhiêu row mới`, () => {
      const s = make();
      const r = good(s, 'INSERT INTO dst (a, b) SELECT a, b FROM src');
      if (r.kind !== 'dml') throw new Error('x');
      expect(r.dml.op).toBe('insert');
      expect(r.dml.touched.length).toBe(3);
      expect(r.dml.after.length).toBe(3);
    });

    it(`${d}: số column của SELECT khác số column đích`, () => {
      const s = make();
      const few = err(s, 'INSERT INTO dst (a, b) SELECT a FROM src');
      const many = err(s, 'INSERT INTO dst (a, b) SELECT a, b, a FROM src');
      if (d === 'mysql') {
        // MySQL thật: ERROR 1136 (21S01): Column count doesn't match value count at row 1
        expect(few.dbMessage).toBe("ERROR 1136 (21S01): Column count doesn't match value count at row 1");
        expect(many.code).toBe('1136');
      } else {
        expect(few.code).toBe('ORA-00947');
        expect(many.code).toBe('ORA-00913');
      }
    });

    it(`${d}: row chép về phạm luật thì cả câu lỗi, không row nào vào`, () => {
      const s = make();
      good(s, "INSERT INTO dst (a, b) VALUES (2, 'old')");
      const e = err(s, 'INSERT INTO dst (a, b) SELECT a, b FROM src');
      expect(e.code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      expect(rows(s, 'SELECT COUNT(*) FROM dst')).toEqual([[1]]);
    });

    it(`${d}: chép từ chính table đó`, () => {
      const s = make();
      good(s, 'INSERT INTO src SELECT a + 10, b FROM src');
      expect(rows(s, 'SELECT COUNT(*) FROM src')).toEqual([[6]]);
    });
  }

  it('MySQL: INSERT ... SELECT để column AUTO_INCREMENT tự sinh mã', () => {
    // MySQL thật: insert into s2 (v) select id from s -> id 1..n
    const s = S('mysql');
    all(s, ['CREATE TABLE s (id INT PRIMARY KEY)', 'INSERT INTO s VALUES (1), (10), (11)', 'CREATE TABLE s2 (id INT AUTO_INCREMENT PRIMARY KEY, v INT)', 'INSERT INTO s2 (v) SELECT id FROM s']);
    expect(rows(s, 'SELECT id, v FROM s2 ORDER BY id')).toEqual([[1, 1], [2, 10], [3, 11]]);
  });

  it('MySQL: chữ không phải số chép vào column INT là 1366', () => {
    // MySQL thật: ERROR 1366 (HY000): Incorrect integer value: 'a' for column 'v' at row 1
    const s = S('mysql');
    all(s, ['CREATE TABLE s (v VARCHAR(5))', "INSERT INTO s VALUES ('a')", 'CREATE TABLE s2 (v INT)']);
    expect(err(s, 'INSERT INTO s2 (v) SELECT v FROM s').dbMessage).toBe("ERROR 1366 (HY000): Incorrect integer value: 'a' for column 'v' at row 1");
  });

  it('MySQL: chép chữ dài vào column ngắn hơn là 1406', () => {
    const s = S('mysql');
    all(s, ['CREATE TABLE s (v VARCHAR(10))', "INSERT INTO s VALUES ('abcdefgh')", 'CREATE TABLE s2 (v VARCHAR(3))']);
    expect(err(s, 'INSERT INTO s2 SELECT v FROM s').code).toBe('1406');
  });

  it('SELECT rỗng thì không có row nào vào, không lỗi', () => {
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE a (x ${INT[d]})`, `CREATE TABLE b (x ${INT[d]})`]);
      good(s, 'INSERT INTO b SELECT x FROM a');
      expect(rows(s, 'SELECT COUNT(*) FROM b')).toEqual([[0]]);
    }
  });
});

describe('Chú thích trong SQL', () => {
  it('-- chú thích tới hết dòng ở cả hai dialect', () => {
    expect(rows(S('mysql'), 'SELECT 3 -- hi\n')).toEqual([[3]]);
    expect(rows(S('oracle'), 'SELECT 3 FROM DUAL -- hi')).toEqual([[3]]);
  });

  it('/* ... */ chú thích nằm giữa câu', () => {
    expect(rows(S('mysql'), 'SELECT /* x */ 2')).toEqual([[2]]);
    expect(rows(S('oracle'), 'SELECT /* x */ 2 FROM /* y */ DUAL')).toEqual([[2]]);
  });

  it('MySQL: # chú thích tới hết dòng', () => {
    // MySQL thật: select 1 # hi chạy được
    expect(rows(S('mysql'), 'SELECT 1 # hi\n')).toEqual([[1]]);
  });

  it('Oracle: # không phải chú thích, là ký tự lạ ORA-00911', () => {
    expect(err(S('oracle'), 'SELECT 1 # hi FROM DUAL').code).toBe('ORA-00911');
  });

  it('MySQL: -- chỉ là chú thích khi sau nó có dấu cách', () => {
    // MySQL thật: select 4--5 ra 9 (4 - (-5)); select 4 -- 5 ra 4
    expect(rows(S('mysql'), 'SELECT 4--5')).toEqual([[9]]);
    expect(rows(S('mysql'), 'SELECT 4 -- 5\n')).toEqual([[4]]);
  });

  it('Oracle: -- luôn là chú thích, dù sau nó không có dấu cách', () => {
    expect(rows(S('oracle'), 'SELECT 4--5\nFROM DUAL')).toEqual([[4]]);
  });

  it('dấu chú thích nằm trong chuỗi thì là chữ thường', () => {
    // MySQL thật: select '--not', '/*x*/', "#x" ra đúng ba chuỗi đó
    expect(rows(S('mysql'), `SELECT '--not', '/*x*/', "#x"`)).toEqual([['--not', '/*x*/', '#x']]);
    expect(rows(S('oracle'), `SELECT '--not', '/*x*/' FROM DUAL`)).toEqual([['--not', '/*x*/']]);
  });

  it('chú thích trong CREATE TABLE', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE t ( -- mã\n a ${INT[d]}, /* tên */ b ${TEXT[d]}(5) )`);
      expect(s.db().tables[0].columns.map((c) => c.name)).toEqual(['a', 'b']);
    }
  });

  it('câu chỉ có chú thích là Editor trống', () => {
    expect(err(S('mysql'), '-- không có gì\n').code).toBe('1065');
    expect(err(S('oracle'), '/* không có gì */').code).toBe('ORA-00900');
  });
});

describe('splitStatements', () => {
  const pieces = (sql: string, d: Dialect = 'mysql') => splitStatements(sql, d).map((p) => p.sql);

  it('tách theo dấu ; và bỏ dấu ; khỏi từng lệnh', () => {
    expect(pieces('SELECT 1; SELECT 2;\nSELECT 3')).toEqual(['SELECT 1', 'SELECT 2', 'SELECT 3']);
  });

  it('start và end trỏ đúng vào script gốc', () => {
    const sql = '  SELECT 1 ;\n\n  SELECT 2  ';
    const ps = splitStatements(sql, 'mysql');
    expect(ps.map((p) => sql.slice(p.start, p.end))).toEqual(['SELECT 1', 'SELECT 2']);
    expect(ps[0]).toEqual({ sql: 'SELECT 1', start: 2, end: 10 });
  });

  it('dấu ; trong chuỗi nháy đơn không tách', () => {
    expect(pieces("SELECT 'a;b'; SELECT 2")).toEqual(["SELECT 'a;b'", 'SELECT 2']);
  });

  it("nháy đơn viết đôi '' vẫn nằm trong chuỗi", () => {
    // MySQL thật: select 'it''s;ok' ra it's;ok
    expect(pieces("SELECT 'it''s;ok'; SELECT 2")).toEqual(["SELECT 'it''s;ok'", 'SELECT 2']);
    expect(pieces("SELECT 'it''s;ok' FROM DUAL; SELECT 2 FROM DUAL", 'oracle')).toEqual(["SELECT 'it''s;ok' FROM DUAL", 'SELECT 2 FROM DUAL']);
  });

  it('MySQL: nháy kép và dấu ` cũng giữ dấu ;', () => {
    expect(pieces('SELECT "a;b"; SELECT `c;d` FROM t')).toEqual(['SELECT "a;b"', 'SELECT `c;d` FROM t']);
  });

  it("MySQL: dấu \\ thoát nháy: 'a\\';b' là một chuỗi", () => {
    // MySQL thật: select 'a\';b' ra a';b
    expect(pieces("SELECT 'a\\';b'; SELECT 2")).toEqual(["SELECT 'a\\';b'", 'SELECT 2']);
  });

  it("Oracle: dấu \\ không thoát nháy: 'a\\' là một chuỗi hoàn chỉnh", () => {
    expect(pieces("SELECT 'a\\' FROM DUAL; SELECT 2 FROM DUAL", 'oracle')).toEqual(["SELECT 'a\\' FROM DUAL", 'SELECT 2 FROM DUAL']);
  });

  it('dấu ; trong chú thích -- không tách (chú thích ở cuối lệnh không nằm trong lệnh)', () => {
    expect(pieces('SELECT 1 -- a; b\n; SELECT 2')).toEqual(['SELECT 1', 'SELECT 2']);
  });

  it('dấu ; trong chú thích /* */ không tách', () => {
    expect(pieces('SELECT /* a; b */ 1; SELECT 2')).toEqual(['SELECT /* a; b */ 1', 'SELECT 2']);
  });

  it('MySQL: dấu ; trong chú thích # không tách, Oracle thì tách', () => {
    expect(pieces('SELECT 1 # a; b\n; SELECT 2')).toEqual(['SELECT 1', 'SELECT 2']);
    expect(pieces('SELECT 1 # a; b', 'oracle')).toEqual(['SELECT 1 # a', 'b']);
  });

  it('MySQL: --5 không phải chú thích nên dấu ; sau đó vẫn tách', () => {
    expect(pieces('SELECT 4--5; SELECT 2')).toEqual(['SELECT 4--5', 'SELECT 2']);
  });

  it('bỏ qua phần rỗng và phần chỉ có chú thích', () => {
    expect(pieces(';;  ; SELECT 1;; -- hết\n;')).toEqual(['SELECT 1']);
    expect(splitStatements('-- chỉ chú thích', 'oracle')).toEqual([]);
    expect(splitStatements('   ', 'mysql')).toEqual([]);
  });

  it('chú thích đứng trước hoặc sau lệnh không nằm trong lệnh, chú thích ở giữa thì có', () => {
    const sql = '-- mở đầu\nSELECT 1; /* nối */ SELECT /* giữa */ 2 -- cuối';
    const ps = splitStatements(sql, 'mysql');
    expect(ps.map((p) => p.sql)).toEqual(['SELECT 1', 'SELECT /* giữa */ 2']);
    expect(ps.map((p) => sql.slice(p.start, p.end))).toEqual(['SELECT 1', 'SELECT /* giữa */ 2']);
  });

  it('chuỗi chưa đóng thì ăn hết phần còn lại', () => {
    expect(pieces("SELECT 1; SELECT 'abc; SELECT 3")).toEqual(['SELECT 1', "SELECT 'abc; SELECT 3"]);
  });
});

describe('Session.runScript', () => {
  it('chạy lần lượt: tạo table, thêm row, đọc ra', () => {
    for (const d of BOTH) {
      const s = S(d);
      const r = s.runScript(`CREATE TABLE t (a ${INT[d]} PRIMARY KEY, b ${TEXT[d]}(5));\nINSERT INTO t VALUES (1, 'x');\nINSERT INTO t VALUES (2, 'y');\nSELECT a, b FROM t ORDER BY a;`);
      expect(r.failedAt).toBeUndefined();
      expect(r.results.map((x) => x.ok && x.kind)).toEqual(['ddl', 'dml', 'dml', 'select']);
      const last = r.results[3];
      expect(last.ok && last.kind === 'select' && last.result.rows).toEqual([[1, 'x'], [2, 'y']]);
    }
  });

  it('dừng ở lệnh lỗi đầu tiên, lệnh sau không chạy', () => {
    for (const d of BOTH) {
      const s = S(d);
      const r = s.runScript(`CREATE TABLE t (a ${INT[d]} PRIMARY KEY);\nINSERT INTO t VALUES (1);\nINSERT INTO t VALUES (1);\nINSERT INTO t VALUES (2);`);
      expect(r.failedAt).toBe(2);
      expect(r.results.length).toBe(3);
      const bad = r.results[2];
      expect(!bad.ok && bad.error.code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
    }
  });

  it('vị trí gạch chân của lỗi tính trong cả script', () => {
    const s = S('mysql');
    const sql = 'SELECT 1;\n\nSELECT * FROM nope;';
    const r = s.runScript(sql);
    expect(r.failedAt).toBe(1);
    const bad = r.results[1];
    if (bad.ok) throw new Error('x');
    expect(sql.slice(bad.error.span.s, bad.error.span.e)).toBe('nope');
  });

  it('lỗi cú pháp ở lệnh thứ hai cũng dừng và báo vị trí trong script', () => {
    const s = S('oracle');
    const sql = 'SELECT 1 FROM DUAL;\nSELECT FROM DUAL;\nSELECT 3 FROM DUAL;';
    const r = s.runScript(sql);
    expect(r.failedAt).toBe(1);
    const bad = r.results[1];
    if (bad.ok) throw new Error('x');
    expect(bad.error.code).toBe('ORA-00936');
    expect(sql.slice(bad.error.span.s, bad.error.span.e)).toBe('FROM');
  });

  it('script rỗng hoặc chỉ có chú thích: một kết quả lỗi, failedAt 0', () => {
    const r = S('mysql').runScript('  -- không có gì\n');
    expect(r.failedAt).toBe(0);
    expect(r.results.length).toBe(1);
    expect(r.results[0].ok).toBe(false);
  });

  it('script có một lệnh thì như run', () => {
    const s = S('mysql');
    const r = s.runScript('SELECT 1');
    expect(r.failedAt).toBeUndefined();
    expect(r.results.length).toBe(1);
  });

  it('DDL trong script chốt thay đổi chờ như khi chạy riêng', () => {
    const s = S('oracle');
    const r = s.runScript('CREATE TABLE t (a NUMBER); INSERT INTO t VALUES (1); CREATE TABLE u (a NUMBER); ROLLBACK;');
    expect(r.failedAt).toBeUndefined();
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
  });

  it('run với hai lệnh một lần vẫn báo lỗi như cũ', () => {
    // Session.run chỉ chạy một lệnh. MySQL báo 1064 ở lệnh thứ hai, Oracle ORA-00933.
    const m = err(S('mysql'), 'SELECT 1; SELECT 2');
    expect(m.code).toBe('1064');
    expect(m.hint).toBe('multi-statement');
    const o = err(S('oracle'), 'SELECT 1 FROM DUAL; SELECT 2 FROM DUAL');
    expect(o.code).toBe('ORA-00933');
    expect(o.hint).toBe('multi-statement');
  });

  it('run với một lệnh có dấu ; ở cuối vẫn chạy', () => {
    expect(rows(S('mysql'), 'SELECT 1;')).toEqual([[1]]);
    expect(rows(S('oracle'), 'SELECT 1 FROM DUAL;')).toEqual([[1]]);
  });
});

describe('Kết quả của lệnh DDL', () => {
  it('CREATE: op create, tên table, các column kèm data type', () => {
    const r = good(S('mysql'), 'CREATE TABLE t (a INT, b VARCHAR(5))');
    expect(r).toEqual({
      ok: true,
      kind: 'ddl',
      op: 'create',
      object: 't',
      table: 't',
      columns: [
        { name: 'a', typeName: 'INT', declared: 'INT' },
        { name: 'b', typeName: 'VARCHAR', declared: 'VARCHAR(5)' },
      ],
    });
  });

  it('ALTER: op alter, các column hiện có sau khi sửa', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE t (a INT)');
    const r = good(s, 'ALTER TABLE t ADD b INT');
    expect(r).toMatchObject({ kind: 'ddl', op: 'alter', object: 't' });
    if (r.kind !== 'ddl') throw new Error('x');
    expect(r.columns.map((c) => c.name)).toEqual(['a', 'b']);
  });

  it('DROP: op drop, không còn column', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t (a NUMBER)');
    expect(good(s, 'DROP TABLE t')).toMatchObject({ kind: 'ddl', op: 'drop', object: 't', columns: [] });
  });

  it('TRUNCATE: op truncate, vẫn còn column', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t (a NUMBER)');
    const r = good(s, 'TRUNCATE TABLE t');
    expect(r).toMatchObject({ kind: 'ddl', op: 'truncate', object: 't' });
    if (r.kind !== 'ddl') throw new Error('x');
    expect(r.columns.length).toBe(1);
  });

  it('CREATE SEQUENCE và DROP SEQUENCE: op sequence, verb create hoặc drop', () => {
    const s = S('oracle');
    expect(good(s, 'CREATE SEQUENCE sq')).toMatchObject({ kind: 'ddl', op: 'sequence', verb: 'create', object: 'sq', columns: [] });
    expect(good(s, 'DROP SEQUENCE sq')).toMatchObject({ kind: 'ddl', op: 'sequence', verb: 'drop', object: 'sq' });
  });

  it('CREATE TABLE IF NOT EXISTS khi đã có vẫn là kết quả create', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE t (a INT)');
    expect(good(s, 'CREATE TABLE IF NOT EXISTS t (a INT)')).toMatchObject({ kind: 'ddl', op: 'create', object: 't' });
  });

  it('data type của Oracle hiện đủ: VARCHAR2(20 CHAR), NUMBER(5,2)', () => {
    const r = good(S('oracle'), 'CREATE TABLE t (a VARCHAR2(20 CHAR), b NUMBER(5,2))');
    if (r.kind !== 'ddl') throw new Error('x');
    expect(r.columns.map((c) => c.declared)).toEqual(['VARCHAR2(20 CHAR)', 'NUMBER(5,2)']);
  });
});

describe('Database sau DDL vẫn là JSON thuần và lưu lại được', () => {
  for (const d of BOTH) {
    it(`${d}: db() qua JSON ra đúng như cũ`, () => {
      const s = S(d);
      all(s, [
        `CREATE TABLE p (id ${INT[d]} PRIMARY KEY, name ${TEXT[d]}(20) DEFAULT 'x' NOT NULL, price ${d === 'mysql' ? 'DECIMAL(8,2)' : 'NUMBER(8,2)'}, UNIQUE (name))`,
        `CREATE TABLE c (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id) ON DELETE CASCADE, CONSTRAINT ck_c CHECK (id > 0))`,
        "INSERT INTO p (id, price) VALUES (1, 9.5)",
      ]);
      const db = s.db();
      expect(JSON.parse(JSON.stringify(db))).toEqual(db);
    });

    it(`${d}: session mới dựng từ database đã lưu, luật và bộ đếm vẫn chạy`, () => {
      const s = S(d);
      const identity = d === 'mysql' ? 'INT AUTO_INCREMENT' : 'NUMBER GENERATED ALWAYS AS IDENTITY';
      all(s, [`CREATE TABLE t (id ${identity} PRIMARY KEY, v ${TEXT[d]}(3) NOT NULL UNIQUE, CONSTRAINT ck_v CHECK (v <> 'bad'))`, "INSERT INTO t (v) VALUES ('a')", "INSERT INTO t (v) VALUES ('b')", 'DELETE FROM t']);
      if (d === 'oracle') good(s, 'COMMIT');
      const s2 = createSession(JSON.parse(JSON.stringify(s.db())), d);
      good(s2, "INSERT INTO t (v) VALUES ('c')");
      expect(rows(s2, 'SELECT id FROM t')).toEqual([[3]]);
      expect(err(s2, "INSERT INTO t (v) VALUES ('c')").code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      expect(err(s2, "INSERT INTO t (v) VALUES ('bad')").code).toBe(d === 'mysql' ? '3819' : 'ORA-02290');
      expect(err(s2, "INSERT INTO t (v) VALUES ('toolong')").code).toBe(d === 'mysql' ? '1406' : 'ORA-12899');
    });
  }

  it('database gốc truyền vào không bị đổi sau một loạt DDL', () => {
    const before = JSON.stringify(teashop);
    for (const d of BOTH) {
      const s = createSession(teashop, d);
      all(s, ['ALTER TABLE stores ADD note ' + (d === 'mysql' ? 'VARCHAR(10)' : 'VARCHAR2(10)'), 'TRUNCATE TABLE order_items', 'DROP TABLE order_items']);
    }
    expect(JSON.stringify(teashop)).toBe(before);
  });
});

describe('DDL trên table mẫu (viết bằng cờ pk, fk, unique)', () => {
  for (const d of BOTH) {
    it(`${d}: foreign key của table mẫu chặn DROP TABLE và TRUNCATE TABLE của table cha`, () => {
      const s = createSession(teashop, d);
      const drop = err(s, 'DROP TABLE stores');
      expect(drop.code).toBe(d === 'mysql' ? '3730' : 'ORA-02449');
      const trunc = err(s, 'TRUNCATE TABLE stores');
      expect(trunc.code).toBe(d === 'mysql' ? '1701' : 'ORA-02266');
    });

    it(`${d}: table không ai trỏ tới thì xóa được, rồi table cha mới xóa được`, () => {
      const s = createSession(teashop, d);
      good(s, 'DROP TABLE order_items');
      expect(err(s, 'SELECT * FROM order_items').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
      expect(s.db().tables.length).toBe(teashop.tables.length - 1);
    });

    it(`${d}: ALTER TABLE ADD column trên table mẫu giữ nguyên dữ liệu`, () => {
      const s = createSession(teashop, d);
      good(s, `ALTER TABLE stores ADD note ${TEXT[d]}(10) DEFAULT 'moi'`);
      expect(rows(s, 'SELECT note FROM stores WHERE store_id = 1')).toEqual([['moi']]);
      expect(rows(s, 'SELECT COUNT(*) FROM stores')).toEqual([[4]]);
    });

    it(`${d}: table mới trỏ foreign key vào table mẫu`, () => {
      const s = createSession(teashop, d);
      good(s, `CREATE TABLE reviews (review_id ${INT[d]} PRIMARY KEY, store_id ${INT[d]}, CONSTRAINT fk_rev FOREIGN KEY (store_id) REFERENCES stores(store_id))`);
      good(s, 'INSERT INTO reviews VALUES (1, 2)');
      const e = err(s, 'INSERT INTO reviews VALUES (2, 99)');
      expect(e.dbMessage).toContain(d === 'mysql' ? 'CONSTRAINT `fk_rev`' : 'TRASUA.FK_REV');
    });

    it(`${d}: ADD CONSTRAINT UNIQUE trên table mẫu kiểm dữ liệu đang có`, () => {
      const s = createSession(teashop, d);
      // city có hai tiệm ở Hà Nội và hai tiệm ở TP. Hồ Chí Minh: trùng
      const e = err(s, 'ALTER TABLE stores ADD CONSTRAINT u_city UNIQUE (city)');
      expect(e.code).toBe(d === 'mysql' ? '1062' : 'ORA-02299');
      good(s, 'ALTER TABLE stores ADD CONSTRAINT u_name UNIQUE (name)');
    });
  }
});
