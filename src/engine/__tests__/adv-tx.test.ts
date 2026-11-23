import { describe, expect, it } from 'vitest';
import { bad, col0, each, exec, sel, sess } from './adv-util';

/**
 * SAVEPOINT, ROLLBACK TO, MERGE (Oracle), INSERT ... ON DUPLICATE KEY UPDATE (MySQL).
 * MySQL: mã lỗi, kết quả, luật tự COMMIT đã kiểm trên MySQL 8.0.46 thật.
 * Oracle: theo tài liệu 19c (SAVEPOINT, ROLLBACK, MERGE, Database Error Messages).
 */

const T = (name: string, fn: Parameters<typeof each>[2]) => each(it, name, fn);
const begin = (s: ReturnType<typeof sess>) => {
  if (s.dialect === 'mysql') exec(s, 'START TRANSACTION');
};
const ins = (id: number) => `INSERT INTO kv VALUES ('s${id}', ${id}, ${id})`;
const count = (s: ReturnType<typeof sess>) => col0(s, 'SELECT COUNT(*) FROM kv')[0];

describe('SAVEPOINT', () => {
  T('ROLLBACK TO bỏ phần sau savepoint, giữ phần trước', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, ins(1));
    exec(s, 'SAVEPOINT a');
    exec(s, ins(2));
    exec(s, ins(3));
    expect(count(s)).toBe(5);
    const r = exec(s, 'ROLLBACK TO SAVEPOINT a');
    expect(r.kind === 'tx' && r.op).toBe('rollback-to');
    expect(r.kind === 'tx' && r.changes).toBe(2);
    expect(count(s)).toBe(3);
    expect(s.pending()).toBe(1);
  });

  T('chữ SAVEPOINT sau TO có thể bỏ, tên không phân biệt hoa thường', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, 'SAVEPOINT Abc');
    exec(s, ins(1));
    exec(s, 'ROLLBACK TO abc');
    expect(count(s)).toBe(2);
  });

  T('ROLLBACK TO giữ savepoint đó, bỏ savepoint đặt sau nó', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, 'SAVEPOINT a');
    exec(s, ins(1));
    exec(s, 'SAVEPOINT b');
    exec(s, ins(2));
    exec(s, 'ROLLBACK TO a');
    exec(s, 'ROLLBACK TO a');
    const e = bad(s, 'ROLLBACK TO b');
    expect(e.code).toBe(d === 'mysql' ? '1305' : 'ORA-01086');
  });

  T('transaction vẫn mở sau ROLLBACK TO: COMMIT lưu phần còn lại', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, ins(1));
    exec(s, 'SAVEPOINT a');
    exec(s, ins(2));
    exec(s, 'ROLLBACK TO a');
    exec(s, 'COMMIT');
    exec(s, 'ROLLBACK');
    expect(count(s)).toBe(3);
  });

  T('đặt lại savepoint cùng tên thì savepoint cũ mất', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, 'SAVEPOINT a');
    exec(s, ins(1));
    exec(s, 'SAVEPOINT a');
    exec(s, ins(2));
    exec(s, 'ROLLBACK TO a');
    expect(count(s)).toBe(3);
  });

  T('savepoint không có thì lỗi, kèm lời giải thích', (d) => {
    const e = bad(sess(d), 'ROLLBACK TO nope');
    expect(e.code).toBe(d === 'mysql' ? '1305' : 'ORA-01086');
    expect(e.friendly).toContain('savepoint');
    expect(e.dbMessage).toBe(d === 'mysql' ? 'ERROR 1305 (42000): SAVEPOINT nope does not exist' : "ORA-01086: savepoint 'NOPE' never established in this session or is invalid");
  });

  T('COMMIT và ROLLBACK xóa mọi savepoint', (d) => {
    for (const end of ['COMMIT', 'ROLLBACK']) {
      const s = sess(d);
      begin(s);
      exec(s, 'SAVEPOINT a');
      exec(s, end);
      expect(bad(s, 'ROLLBACK TO a').code).toBe(d === 'mysql' ? '1305' : 'ORA-01086');
    }
  });

  T('lệnh DDL tự COMMIT nên cũng xóa savepoint', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, 'SAVEPOINT a');
    exec(s, 'CREATE TABLE zz (a INT)');
    expect(bad(s, 'ROLLBACK TO a').code).toBe(d === 'mysql' ? '1305' : 'ORA-01086');
  });

  it('mysql: ngoài START TRANSACTION, savepoint không có nghĩa (mỗi lệnh đã tự COMMIT)', () => {
    const s = sess('mysql');
    exec(s, 'SAVEPOINT a');
    expect(bad(s, 'ROLLBACK TO a').code).toBe('1305');
  });

  it('oracle: không cần lệnh mở transaction, savepoint dùng được ngay', () => {
    const s = sess('oracle');
    exec(s, 'SAVEPOINT a');
    exec(s, ins(1));
    exec(s, 'ROLLBACK TO a');
    expect(count(s)).toBe(2);
  });

  T('ROLLBACK TO không hoàn lại bộ đếm tự tăng', (d) => {
    const s = sess(d);
    begin(s);
    exec(s, 'SAVEPOINT a');
    exec(s, ins(1));
    exec(s, 'ROLLBACK TO a');
    expect(s.pending()).toBe(0);
  });
});

describe('INSERT ... ON DUPLICATE KEY UPDATE (MySQL)', () => {
  it('VALUES(c): row trùng key thì sửa row cũ, row mới thì thêm', () => {
    const s = sess('mysql');
    exec(s, "INSERT INTO kv VALUES ('a', 10, 10), ('c', 3, 3) ON DUPLICATE KEY UPDATE v = VALUES(v)");
    expect(sel(s, 'SELECT * FROM kv ORDER BY k')).toEqual([['a', 10, 1], ['b', 2, 2], ['c', 3, 3]]);
  });

  it('dạng alias: AS new ... UPDATE c = new.c', () => {
    const s = sess('mysql');
    exec(s, "INSERT INTO kv VALUES ('a', 11, 11), ('c', 3, 3) AS new ON DUPLICATE KEY UPDATE v = new.v, kv.w = kv.w + new.w");
    expect(sel(s, 'SELECT * FROM kv ORDER BY k')).toEqual([['a', 11, 12], ['b', 2, 2], ['c', 3, 3]]);
  });

  it('có alias mà viết column không kèm tên thì 1052 (đã kiểm trên MySQL)', () => {
    const e = bad(sess('mysql'), "INSERT INTO kv VALUES ('a', 1, 1) AS new ON DUPLICATE KEY UPDATE w = w + new.w");
    expect(e.code).toBe('1052');
  });

  it('SET tham chiếu giá trị cũ của row, và trùng key UNIQUE cũng tính', () => {
    const s = sess('mysql');
    exec(s, "INSERT INTO kv (k, v) VALUES ('a', 5) ON DUPLICATE KEY UPDATE v = v + 1");
    expect(col0(s, "SELECT v FROM kv WHERE k = 'a'")).toEqual([2]);
    exec(s, 'CREATE TABLE u (id INT PRIMARY KEY, mail VARCHAR(20) UNIQUE, n INT)');
    exec(s, "INSERT INTO u VALUES (1, 'x', 0)");
    exec(s, "INSERT INTO u VALUES (2, 'x', 7) ON DUPLICATE KEY UPDATE n = VALUES(n)");
    expect(sel(s, 'SELECT * FROM u')).toEqual([[1, 'x', 7]]);
  });

  it('INSERT ... SELECT ... ON DUPLICATE KEY UPDATE', () => {
    const s = sess('mysql');
    exec(s, "INSERT INTO kv (k, v) SELECT 'a', 100 ON DUPLICATE KEY UPDATE v = VALUES(v)");
    expect(col0(s, "SELECT v FROM kv WHERE k = 'a'")).toEqual([100]);
  });

  it('column không có trong SET thì 1054', () => {
    const e = bad(sess('mysql'), "INSERT INTO kv VALUES ('a', 1, 1) ON DUPLICATE KEY UPDATE nope = 1");
    expect(e.code).toBe('1054');
    expect(bad(sess('mysql'), "INSERT INTO kv VALUES ('a', 1, 1) ON DUPLICATE KEY UPDATE v = VALUES(nope)").code).toBe('1054');
  });

  it('oracle: lỗi ở chữ ON, kèm lời chỉ sang MERGE', () => {
    const e = bad(sess('oracle'), "INSERT INTO kv VALUES ('a', 1, 1) ON DUPLICATE KEY UPDATE v = 1");
    expect(e.code).toBe('ORA-00933');
    expect(e.friendly).toContain('MERGE');
  });
});

const MERGE =
  'MERGE INTO kv t USING (SELECT k, v FROM kv2) s ON (t.k = s.k) WHEN MATCHED THEN UPDATE SET t.v = s.v WHEN NOT MATCHED THEN INSERT (k, v, w) VALUES (s.k, s.v, 0)';
const withSrc = () => {
  const s = sess('oracle');
  exec(s, "CREATE TABLE kv2 AS SELECT k, v FROM kv WHERE 1 = 0");
  exec(s, "INSERT INTO kv2 VALUES ('a', 100)");
  exec(s, "INSERT INTO kv2 VALUES ('c', 300)");
  exec(s, 'COMMIT');
  return s;
};

describe('MERGE (Oracle)', () => {
  it('MATCHED sửa row khớp, NOT MATCHED thêm row mới', () => {
    const s = withSrc();
    const r = exec(s, MERGE);
    expect(r.kind === 'dml' && r.dml.op).toBe('merge');
    expect(r.kind === 'dml' && r.dml.touched.length).toBe(2);
    expect(sel(s, 'SELECT * FROM kv ORDER BY k')).toEqual([['a', 100, 1], ['b', 2, 2], ['c', 300, 0]]);
    expect(s.pending()).toBe(1);
    exec(s, 'ROLLBACK');
    expect(count(s)).toBe(2);
  });

  it('chỉ có nhánh MATCHED, hoặc chỉ có nhánh NOT MATCHED', () => {
    const a = withSrc();
    exec(a, 'MERGE INTO kv t USING kv2 s ON (t.k = s.k) WHEN MATCHED THEN UPDATE SET t.v = s.v');
    expect(sel(a, 'SELECT k, v FROM kv ORDER BY k')).toEqual([['a', 100], ['b', 2]]);
    const b = withSrc();
    exec(b, "MERGE INTO kv t USING kv2 s ON (t.k = s.k) WHEN NOT MATCHED THEN INSERT (k, v) VALUES (s.k, s.v)");
    expect(sel(b, 'SELECT k, v FROM kv ORDER BY k')).toEqual([['a', 1], ['b', 2], ['c', 300]]);
  });

  it('hai row nguồn khớp cùng một row đích thì ORA-30926', () => {
    const s = withSrc();
    exec(s, "INSERT INTO kv2 VALUES ('a', 101)");
    const e = bad(s, MERGE);
    expect(e.code).toBe('ORA-30926');
    expect(col0(s, "SELECT v FROM kv WHERE k = 'a'")).toEqual([1]);
  });

  it('sửa column nằm trong ON thì ORA-38104', () => {
    const s = withSrc();
    const e = bad(s, 'MERGE INTO kv t USING kv2 s ON (t.k = s.k) WHEN MATCHED THEN UPDATE SET t.k = s.k');
    expect(e.code).toBe('ORA-38104');
    expect(e.friendly).toContain('ON');
  });

  it('column của nguồn không có thì ORA-00904. Lỗi data type vẫn bắt như INSERT', () => {
    const s = withSrc();
    expect(bad(s, 'MERGE INTO kv t USING kv2 s ON (t.k = s.nope) WHEN MATCHED THEN UPDATE SET t.v = 1').code).toBe('ORA-00904');
    expect(bad(s, "MERGE INTO kv t USING kv2 s ON (t.k = s.k) WHEN MATCHED THEN UPDATE SET t.v = 'chữ'").code).toBe('ORA-01722');
  });

  it('WHERE và DELETE trong MERGE: khóa học chưa dạy', () => {
    const s = withSrc();
    expect(bad(s, 'MERGE INTO kv t USING kv2 s ON (t.k = s.k) WHEN MATCHED THEN UPDATE SET t.v = 1 WHERE t.v > 1').kind).toBe('unsupported');
  });

  it('mysql: MERGE lỗi cú pháp 1064, kèm lời chỉ sang INSERT ... ON DUPLICATE KEY UPDATE', () => {
    const e = bad(sess('mysql'), 'MERGE INTO kv t USING kv s ON (t.k = s.k) WHEN MATCHED THEN UPDATE SET t.v = 1');
    expect(e.code).toBe('1064');
    expect(e.friendly).toContain('ON DUPLICATE KEY UPDATE');
  });
});
