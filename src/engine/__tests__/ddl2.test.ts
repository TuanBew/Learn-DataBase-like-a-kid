import { describe, expect, it } from 'vitest';
import type { Dialect, Session } from '../index';
import { BOTH, INT, S, TEXT, all, err, good, rows } from './ddl-util';

/**
 * ALTER TABLE, DROP TABLE, TRUNCATE TABLE và việc mọi lệnh DDL tự COMMIT.
 * Test MySQL ghi kết quả đã thấy trên MySQL 8.0.46 thật. Test Oracle theo Oracle Database 19c SQL Language Reference.
 * Mã Oracle chưa tìm được nguồn xác nhận có dòng `CHỜ KIỂM TÀI LIỆU` ngay trên test.
 */

/** Table t(id, name, age) có hai row, dùng cho nhiều test. */
const seedT = (s: Session) => {
  const d = s.dialect;
  all(s, [
    `CREATE TABLE t (id ${INT[d]} PRIMARY KEY, name ${TEXT[d]}(10), age ${d === 'mysql' ? 'INT' : 'NUMBER(3)'})`,
    "INSERT INTO t VALUES (1, 'abcdefgh', 20)",
    "INSERT INTO t VALUES (2, 'zz', NULL)",
  ]);
};
const names = (s: Session, t: string) => s.db().tables.find((x) => x.name === t)!.columns.map((c) => c.name);

describe('ALTER TABLE ADD column', () => {
  it('MySQL: ADD COLUMN và ADD (bỏ chữ COLUMN) đều thêm column, row cũ nhận NULL', () => {
    const s = S('mysql');
    seedT(s);
    good(s, 'ALTER TABLE t ADD COLUMN email VARCHAR(30)');
    good(s, 'ALTER TABLE t ADD phone VARCHAR(10)');
    expect(names(s, 't')).toEqual(['id', 'name', 'age', 'email', 'phone']);
    expect(rows(s, 'SELECT id, email, phone FROM t ORDER BY id')).toEqual([[1, null, null], [2, null, null]]);
  });

  it('Oracle: ADD column nhận NULL cho row cũ, ADD (a ..., b ...) thêm nhiều column', () => {
    const s = S('oracle');
    seedT(s);
    good(s, 'ALTER TABLE t ADD email VARCHAR2(30)');
    good(s, "ALTER TABLE t ADD (phone VARCHAR2(10), city VARCHAR2(10) DEFAULT 'HN')");
    expect(names(s, 't')).toEqual(['id', 'name', 'age', 'email', 'phone', 'city']);
    expect(rows(s, 'SELECT id, email, city FROM t ORDER BY id')).toEqual([[1, null, 'HN'], [2, null, 'HN']]);
  });

  it('MySQL: nhiều việc nối bằng dấu phẩy, và ADD COLUMN (a, b) trong ngoặc', () => {
    // MySQL thật: alter table t add column n2 int, add column n3 int default 7 -> n3 = 7 cho row cũ
    const s = S('mysql');
    seedT(s);
    good(s, 'ALTER TABLE t ADD COLUMN n2 INT, ADD COLUMN n3 INT DEFAULT 7');
    good(s, 'ALTER TABLE t ADD COLUMN (q INT, w INT)');
    expect(rows(s, 'SELECT n2, n3, q, w FROM t WHERE id = 1')).toEqual([[null, 7, null, null]]);
  });

  it('DEFAULT điền vào các row đang có', () => {
    for (const d of BOTH) {
      const s = S(d);
      seedT(s);
      good(s, `ALTER TABLE t ADD city ${TEXT[d]}(10) DEFAULT 'HN' NOT NULL`);
      expect(rows(s, 'SELECT city FROM t')).toEqual([['HN'], ['HN']]);
    }
  });

  it('MySQL: thêm column NOT NULL không có DEFAULT thì tự điền 0 và chuỗi rỗng', () => {
    // MySQL thật: add phone varchar(10) not null -> '' ; add flag int not null -> 0 (không báo lỗi)
    const s = S('mysql');
    seedT(s);
    good(s, 'ALTER TABLE t ADD phone VARCHAR(10) NOT NULL');
    good(s, 'ALTER TABLE t ADD flag INT NOT NULL');
    expect(rows(s, 'SELECT phone, flag FROM t WHERE id = 1')).toEqual([['', 0]]);
  });

  it('MySQL: thêm column DATE NOT NULL vào table đang có row là lỗi 1292', () => {
    // MySQL thật: ERROR 1292 (22007): Incorrect date value: '0000-00-00' for column 'dd' at row 1
    const s = S('mysql');
    seedT(s);
    expect(err(s, 'ALTER TABLE t ADD dd DATE NOT NULL').dbMessage).toBe("ERROR 1292 (22007): Incorrect date value: '0000-00-00' for column 'dd' at row 1");
    expect(err(s, 'ALTER TABLE t ADD dt DATETIME NOT NULL').dbMessage).toBe("ERROR 1292 (22007): Incorrect datetime value: '0000-00-00 00:00:00' for column 'dt' at row 1");
    expect(names(s, 't')).toEqual(['id', 'name', 'age']);
  });

  it('MySQL: table rỗng thì thêm DATE NOT NULL được', () => {
    // MySQL thật: alter table dt add c date not null chạy được khi dt rỗng
    const s = S('mysql');
    good(s, 'CREATE TABLE dt (a DATE)');
    good(s, 'ALTER TABLE dt ADD c DATE NOT NULL');
  });

  it('Oracle: thêm column NOT NULL không có DEFAULT vào table đang có row là ORA-01758', () => {
    const s = S('oracle');
    seedT(s);
    const e = err(s, 'ALTER TABLE t ADD flag NUMBER NOT NULL');
    expect(e.dbMessage).toBe('ORA-01758: table must be empty to add mandatory (NOT NULL) column');
    expect(names(s, 't')).toEqual(['id', 'name', 'age']);
  });

  it('Oracle: thêm column NOT NULL vào table rỗng, hoặc có DEFAULT, thì được', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE e (a NUMBER)');
    good(s, 'ALTER TABLE e ADD flag NUMBER NOT NULL');
    seedT(s);
    good(s, 'ALTER TABLE t ADD flag NUMBER DEFAULT 0 NOT NULL');
    expect(rows(s, 'SELECT flag FROM t')).toEqual([[0], [0]]);
  });

  it('thêm column trùng tên: MySQL 1060, Oracle ORA-01430', () => {
    // MySQL thật: ERROR 1060 (42S21): Duplicate column name 'id'
    const m = S('mysql');
    seedT(m);
    expect(err(m, 'ALTER TABLE t ADD id INT').dbMessage).toBe("ERROR 1060 (42S21): Duplicate column name 'id'");
    const o = S('oracle');
    seedT(o);
    expect(err(o, 'ALTER TABLE t ADD name NUMBER').dbMessage).toBe('ORA-01430: column being added already exists in table');
  });

  it('Oracle: ADD COLUMN (có chữ COLUMN) là lỗi', () => {
    // CHỜ KIỂM TÀI LIỆU: COLUMN là từ dành riêng của Oracle nên không đứng làm tên column được. Mã ORA-00904 là suy luận.
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t ADD COLUMN x NUMBER').code).toBe('ORA-00904');
  });

  it('Oracle: nối hai ADD bằng dấu phẩy là lỗi ORA-00933', () => {
    // CHỜ KIỂM TÀI LIỆU: mã ORA-00933 cho "ADD a, ADD b" là suy luận.
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t ADD a NUMBER, ADD b NUMBER').code).toBe('ORA-00933');
  });

  it('ALTER table không có: MySQL 1146, Oracle ORA-00942', () => {
    // MySQL thật: ERROR 1146 (42S02): Table 'lab.nope' doesn't exist
    expect(err(S('mysql'), 'ALTER TABLE nope ADD x INT').dbMessage).toBe("ERROR 1146 (42S02): Table 'lab.nope' doesn't exist");
    expect(err(S('oracle'), 'ALTER TABLE nope ADD x NUMBER').code).toBe('ORA-00942');
  });

  it('MySQL: ADD column kèm UNIQUE và CHECK, luật đó chạy ngay', () => {
    // MySQL thật: alter table u1 add column code varchar(5) unique; add column n int check (n > 0) -> tên u1_chk_1
    const s = S('mysql');
    all(s, ['CREATE TABLE u1 (id INT PRIMARY KEY)', 'INSERT INTO u1 VALUES (1), (2)', 'ALTER TABLE u1 ADD COLUMN code VARCHAR(5) UNIQUE', 'ALTER TABLE u1 ADD COLUMN n INT CHECK (n > 0)']);
    good(s, "INSERT INTO u1 (id, code) VALUES (3, 'x')");
    expect(err(s, "INSERT INTO u1 (id, code) VALUES (4, 'x')").dbMessage).toBe("ERROR 1062 (23000): Duplicate entry 'x' for key 'u1.code'");
    expect(err(s, 'INSERT INTO u1 (id, n) VALUES (5, 0)').dbMessage).toBe("ERROR 3819 (HY000): Check constraint 'u1_chk_1' is violated.");
  });
});

describe('ALTER TABLE MODIFY', () => {
  it('MySQL: thu nhỏ column khi dữ liệu đang dài hơn là 1265', () => {
    // MySQL thật: ERROR 1265 (01000): Data truncated for column 'name' at row 1
    const s = S('mysql');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY COLUMN name VARCHAR(5)').dbMessage).toBe("ERROR 1265 (01000): Data truncated for column 'name' at row 1");
    good(s, 'ALTER TABLE t MODIFY name VARCHAR(8)');
    good(s, 'ALTER TABLE t MODIFY name VARCHAR(30)');
    expect(rows(s, 'SELECT name FROM t WHERE id = 1')).toEqual([['abcdefgh']]);
    good(s, "INSERT INTO t VALUES (3, 'x', 1)");
  });

  it('MySQL: sau khi nới độ dài, INSERT chữ dài hơn được nhận', () => {
    const s = S('mysql');
    seedT(s);
    expect(err(s, "INSERT INTO t VALUES (3, 'abcdefghijk', 1)").code).toBe('1406');
    good(s, 'ALTER TABLE t MODIFY name VARCHAR(20)');
    good(s, "INSERT INTO t VALUES (3, 'abcdefghijk', 1)");
  });

  it('MySQL: đổi sang NOT NULL khi column đang có NULL là 1265', () => {
    // MySQL thật: ERROR 1265 (01000): Data truncated for column 'age' at row 2
    const s = S('mysql');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY age INT NOT NULL').dbMessage).toBe("ERROR 1265 (01000): Data truncated for column 'age' at row 2");
  });

  it('MySQL: đổi data type thì đổi luôn giá trị: INT sang VARCHAR', () => {
    // MySQL thật: alter table t modify age varchar(3) -> 20 thành '20'
    const s = S('mysql');
    seedT(s);
    good(s, 'ALTER TABLE t MODIFY age VARCHAR(3)');
    expect(rows(s, 'SELECT age FROM t ORDER BY id')).toEqual([['20'], [null]]);
  });

  it('MySQL: đổi chữ sang INT khi có chữ không phải số là 1366', () => {
    // MySQL thật: ERROR 1366 (HY000): Incorrect integer value: 'x' for column 'c' at row 1
    const s = S('mysql');
    all(s, ['CREATE TABLE t (c VARCHAR(5))', "INSERT INTO t VALUES ('x')"]);
    expect(err(s, 'ALTER TABLE t MODIFY c INT').dbMessage).toBe("ERROR 1366 (HY000): Incorrect integer value: 'x' for column 'c' at row 1");
  });

  it('MySQL: MODIFY thay cả định nghĩa, NOT NULL và DEFAULT không viết lại thì mất', () => {
    // MySQL thật: alter table dflt modify a int -> insert NULL được
    const s = S('mysql');
    good(s, 'CREATE TABLE dflt (a INT DEFAULT 5, d INT)');
    good(s, 'ALTER TABLE dflt MODIFY a INT NOT NULL DEFAULT 7');
    good(s, 'INSERT INTO dflt (d) VALUES (2)');
    expect(err(s, 'INSERT INTO dflt (a, d) VALUES (NULL, 1)').code).toBe('1048');
    good(s, 'ALTER TABLE dflt MODIFY a INT');
    good(s, 'INSERT INTO dflt (a, d) VALUES (NULL, 3)');
    good(s, 'INSERT INTO dflt (d) VALUES (4)');
    expect(rows(s, 'SELECT a FROM dflt ORDER BY d')).toEqual([[7], [null], [null]]);
  });

  it('MySQL: column primary key vẫn NOT NULL sau MODIFY', () => {
    // MySQL thật: alter table t modify id int; show create table -> `id` int NOT NULL
    const s = S('mysql');
    seedT(s);
    good(s, 'ALTER TABLE t MODIFY id INT');
    expect(err(s, "INSERT INTO t (id, name) VALUES (NULL, 'x')").code).toBe('1048');
  });

  it('MySQL: MODIFY column không có: 1054', () => {
    // MySQL thật: ERROR 1054 (42S22): Unknown column 'nope' in 't'
    const s = S('mysql');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY nope INT').dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'nope' in 't'");
  });

  it('MySQL: đổi data type của column đang nối foreign key là 3780', () => {
    // MySQL thật: Referencing column 'x' and referenced column 'id' in foreign key constraint 'f8_ibfk_1' are incompatible.
    const s = S('mysql');
    all(s, ['CREATE TABLE f9 (id INT PRIMARY KEY, x INT)', 'CREATE TABLE f8 (id INT PRIMARY KEY, x INT, FOREIGN KEY (x) REFERENCES f9(id))']);
    expect(err(s, 'ALTER TABLE f9 MODIFY id BIGINT').dbMessage).toBe("ERROR 3780 (HY000): Referencing column 'x' and referenced column 'id' in foreign key constraint 'f8_ibfk_1' are incompatible.");
    expect(err(s, 'ALTER TABLE f8 MODIFY x BIGINT').code).toBe('3780');
  });

  it('MySQL: MODIFY (...) trong ngoặc là lỗi cú pháp', () => {
    const s = S('mysql');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY (name VARCHAR(20))').code).toBe('1064');
  });

  it('Oracle: thu nhỏ VARCHAR2 khi dữ liệu đang dài hơn là ORA-01441', () => {
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY (name VARCHAR2(5))').dbMessage).toBe('ORA-01441: cannot decrease column length because some value is too big');
    good(s, 'ALTER TABLE t MODIFY name VARCHAR2(8)');
    good(s, 'ALTER TABLE t MODIFY (name VARCHAR2(30), age NUMBER(5))');
  });

  it('Oracle: đổi data type khi column đang có dữ liệu là ORA-01439, column rỗng thì được', () => {
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY (name NUMBER)').dbMessage).toBe('ORA-01439: column to be modified must be empty to change datatype');
    good(s, 'ALTER TABLE t ADD note VARCHAR2(5)');
    good(s, 'ALTER TABLE t MODIFY (note NUMBER)');
  });

  it('Oracle: đổi DATE sang TIMESTAMP khi có dữ liệu thì được (cùng nhóm)', () => {
    const s = S('oracle');
    all(s, ['CREATE TABLE d (a DATE)', "INSERT INTO d VALUES (DATE '2026-01-01')"]);
    good(s, 'ALTER TABLE d MODIFY (a TIMESTAMP)');
  });

  it('Oracle: giảm NUMBER(3) xuống NUMBER(2) khi có dữ liệu là ORA-01440, tăng thì được', () => {
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY (age NUMBER(2))').dbMessage).toBe('ORA-01440: column to be modified must be empty to decrease precision or scale');
    good(s, 'ALTER TABLE t MODIFY (age NUMBER(5))');
    good(s, 'INSERT INTO t VALUES (3, NULL, 12345)');
  });

  it('Oracle: MODIFY (a NOT NULL) khi column đang có NULL là ORA-02296', () => {
    // CHỜ KIỂM TÀI LIỆU: câu thông báo đầy đủ của ORA-02296 trong trường hợp này (tên constraint để trống) chưa kiểm được.
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY (age NOT NULL)').code).toBe('ORA-02296');
  });

  it('Oracle: MODIFY NOT NULL cho column đã NOT NULL là ORA-01442, MODIFY NULL cho column đã nhận NULL là ORA-01451', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE m (a NUMBER NOT NULL, b NUMBER)');
    expect(err(s, 'ALTER TABLE m MODIFY (a NOT NULL)').dbMessage).toBe('ORA-01442: column to be modified to NOT NULL is already NOT NULL');
    expect(err(s, 'ALTER TABLE m MODIFY (b NULL)').dbMessage).toBe('ORA-01451: column to be modified to NULL cannot be modified to NULL');
  });

  it('Oracle: MODIFY (a NULL) bỏ NOT NULL, MODIFY (b NOT NULL) thêm NOT NULL khi dữ liệu hợp', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE m (a NUMBER NOT NULL, b NUMBER)');
    good(s, 'ALTER TABLE m MODIFY (a NULL, b NOT NULL)');
    good(s, 'INSERT INTO m VALUES (NULL, 1)');
    expect(err(s, 'INSERT INTO m VALUES (1, NULL)').code).toBe('ORA-01400');
  });

  it('Oracle: MODIFY (c DEFAULT ...) chỉ đổi DEFAULT, giữ data type', () => {
    const s = S('oracle');
    all(s, ["CREATE TABLE m (c VARCHAR2(10) DEFAULT 'HN', d NUMBER)", 'INSERT INTO m (d) VALUES (1)']);
    good(s, "ALTER TABLE m MODIFY (c DEFAULT 'SG')");
    good(s, 'INSERT INTO m (d) VALUES (2)');
    expect(rows(s, 'SELECT c FROM m ORDER BY d')).toEqual([['HN'], ['SG']]);
    expect(s.db().tables[0].columns[0].length).toBe(10);
  });

  it('Oracle: MODIFY column không có là ORA-00904', () => {
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY (nope NUMBER)').dbMessage).toBe('ORA-00904: "NOPE": invalid identifier');
  });

  it('Oracle: MODIFY COLUMN (có chữ COLUMN) là lỗi', () => {
    // CHỜ KIỂM TÀI LIỆU: như ADD COLUMN, mã ORA-00904 là suy luận từ việc COLUMN là từ dành riêng.
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t MODIFY COLUMN age NUMBER').code).toBe('ORA-00904');
  });
});

describe('ALTER TABLE DROP COLUMN', () => {
  it('xóa column kéo theo dữ liệu của column đó', () => {
    for (const d of BOTH) {
      const s = S(d);
      seedT(s);
      good(s, 'ALTER TABLE t DROP COLUMN name');
      expect(names(s, 't')).toEqual(['id', 'age']);
      expect(rows(s, 'SELECT id, age FROM t ORDER BY id')).toEqual([[1, 20], [2, null]]);
    }
  });

  it('MySQL: DROP bỏ chữ COLUMN, và xóa nhiều column một lệnh', () => {
    // MySQL thật: alter table t drop id; alter table t drop column v, drop column q chạy được
    const s = S('mysql');
    all(s, ['CREATE TABLE t (id INT PRIMARY KEY, v INT, q INT)']);
    good(s, 'ALTER TABLE t DROP q');
    good(s, 'ALTER TABLE t DROP COLUMN v');
    expect(names(s, 't')).toEqual(['id']);
    good(s, 'CREATE TABLE t2 (id INT, v INT, q INT)');
    good(s, 'ALTER TABLE t2 DROP COLUMN v, DROP COLUMN q');
    expect(names(s, 't2')).toEqual(['id']);
  });

  it('Oracle: DROP (a, b) xóa nhiều column', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t (id NUMBER, a NUMBER, b NUMBER)');
    good(s, 'ALTER TABLE t DROP (a, b)');
    expect(names(s, 't')).toEqual(['id']);
  });

  it('Oracle: DROP a (thiếu chữ COLUMN) là lỗi', () => {
    // CHỜ KIỂM TÀI LIỆU: mã ORA-00905 cho "DROP a" thiếu COLUMN là suy luận.
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t DROP name').code).toBe('ORA-00905');
  });

  it('xóa column không có: MySQL 1091, Oracle ORA-00904', () => {
    // MySQL thật: ERROR 1091 (42000): Can't DROP 'nope'; check that column/key exists
    const m = S('mysql');
    seedT(m);
    expect(err(m, 'ALTER TABLE t DROP COLUMN nope').dbMessage).toBe("ERROR 1091 (42000): Can't DROP 'nope'; check that column/key exists");
    const o = S('oracle');
    seedT(o);
    expect(err(o, 'ALTER TABLE t DROP COLUMN nope').dbMessage).toBe('ORA-00904: "NOPE": invalid identifier');
  });

  it('xóa column cuối cùng: MySQL 1090, Oracle ORA-12983', () => {
    const m = S('mysql');
    good(m, 'CREATE TABLE one (a INT)');
    expect(err(m, 'ALTER TABLE one DROP COLUMN a').dbMessage).toBe("ERROR 1090 (42000): You can't delete all columns with ALTER TABLE; use DROP TABLE instead");
    const o = S('oracle');
    good(o, 'CREATE TABLE one (a NUMBER)');
    expect(err(o, 'ALTER TABLE one DROP COLUMN a').dbMessage).toBe('ORA-12983: cannot drop all columns in a table');
  });

  it('MySQL: xóa column mà foreign key đang dùng: 1829 (cha) và 1828 (con)', () => {
    // MySQL thật: Cannot drop column 'id': needed in a foreign key constraint 'fk_c' of table 'c'; Cannot drop column 'pid': needed in a foreign key constraint 'fk_c'
    const s = S('mysql');
    all(s, ['CREATE TABLE p (id INT PRIMARY KEY, x INT)', 'CREATE TABLE c (id INT PRIMARY KEY, pid INT, CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id))']);
    expect(err(s, 'ALTER TABLE p DROP COLUMN id').dbMessage).toBe("ERROR 1829 (HY000): Cannot drop column 'id': needed in a foreign key constraint 'fk_c' of table 'c'");
    expect(err(s, 'ALTER TABLE c DROP COLUMN pid').dbMessage).toBe("ERROR 1828 (HY000): Cannot drop column 'pid': needed in a foreign key constraint 'fk_c'");
    good(s, 'ALTER TABLE c DROP FOREIGN KEY fk_c');
    good(s, 'ALTER TABLE c DROP COLUMN pid');
  });

  it('Oracle: xóa column cha mà foreign key đang trỏ tới là ORA-12992', () => {
    const s = S('oracle');
    all(s, ['CREATE TABLE p (id NUMBER PRIMARY KEY, x NUMBER)', 'CREATE TABLE c (id NUMBER, pid NUMBER, CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id))']);
    expect(err(s, 'ALTER TABLE p DROP COLUMN id').dbMessage).toBe('ORA-12992: cannot drop parent key column');
  });

  it('Oracle: xóa column con có foreign key một column thì foreign key đi theo', () => {
    // CHỜ KIỂM TÀI LIỆU: Oracle tự bỏ constraint một column khi xóa column đó (theo mô tả DROP COLUMN). Chưa kiểm câu chữ chính xác.
    const s = S('oracle');
    all(s, ['CREATE TABLE p (id NUMBER PRIMARY KEY)', 'CREATE TABLE c (id NUMBER, pid NUMBER, CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id))']);
    good(s, 'ALTER TABLE c DROP COLUMN pid');
    good(s, 'DROP TABLE p');
  });

  it('MySQL: xóa column đang nằm trong CHECK là 3959', () => {
    // MySQL thật: ERROR 3959 (HY000): Check constraint 'ck' uses column 'r', hence column cannot be dropped or renamed.
    const s = S('mysql');
    all(s, ['CREATE TABLE t (id INT, r INT)', 'ALTER TABLE t ADD CONSTRAINT ck CHECK (r < 5)']);
    expect(err(s, 'ALTER TABLE t DROP COLUMN r').dbMessage).toBe("ERROR 3959 (HY000): Check constraint 'ck' uses column 'r', hence column cannot be dropped or renamed.");
    good(s, 'ALTER TABLE t DROP CHECK ck');
    good(s, 'ALTER TABLE t DROP COLUMN r');
  });

  it('Oracle: xóa column có CHECK một column thì CHECK đi theo; CHECK nhiều column thì ORA-12991', () => {
    // Error Messages 19c: ORA-12991 "column is referenced in a multi-column constraint" (action: drop the constraints or CASCADE CONSTRAINTS).
    // CHỜ KIỂM TÀI LIỆU: việc Oracle tự bỏ CHECK một column khi xóa column đó.
    const s = S('oracle');
    all(s, ['CREATE TABLE t (id NUMBER, a NUMBER, b NUMBER)', 'ALTER TABLE t ADD CONSTRAINT ck_a CHECK (a > 0)', 'ALTER TABLE t ADD CONSTRAINT ck_ab CHECK (a < b)']);
    expect(err(s, 'ALTER TABLE t DROP COLUMN a').dbMessage).toBe('ORA-12991: column is referenced in a multi-column constraint');
    good(s, 'ALTER TABLE t DROP CONSTRAINT ck_ab');
    good(s, 'ALTER TABLE t DROP COLUMN a');
    expect(s.db().tables[0].constraints).toEqual([]);
  });

  it('MySQL: xóa một column khỏi key ghép thì key rút bớt, trùng thì lỗi 1062', () => {
    // MySQL thật: alter table e9 drop column b (unique (b, c)) -> ERROR 1062 Duplicate entry '2' for key 'e9.b'
    const s = S('mysql');
    all(s, ['CREATE TABLE e9 (a INT UNIQUE, b INT, c INT, UNIQUE KEY (b, c))', 'INSERT INTO e9 VALUES (1, 1, 1)', 'INSERT INTO e9 VALUES (2, 1, 2)', 'INSERT INTO e9 VALUES (3, NULL, 2)', 'INSERT INTO e9 VALUES (4, NULL, 2)']);
    expect(err(s, 'ALTER TABLE e9 DROP COLUMN b').dbMessage).toBe("ERROR 1062 (23000): Duplicate entry '2' for key 'e9.b'");
    expect(names(s, 'e9')).toEqual(['a', 'b', 'c']);
  });

  it('Oracle: xóa column nằm trong key ghép là ORA-12991', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE k (a NUMBER, b NUMBER, PRIMARY KEY (a, b))');
    expect(err(s, 'ALTER TABLE k DROP COLUMN a').code).toBe('ORA-12991');
  });

  it('xóa column primary key một column thì primary key đi theo', () => {
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE t (id ${INT[d]} PRIMARY KEY, v ${INT[d]})`]);
      good(s, 'ALTER TABLE t DROP COLUMN id');
      expect(s.db().tables[0].constraints).toEqual([]);
    }
  });
});

describe('ALTER TABLE RENAME', () => {
  it('RENAME COLUMN đổi tên, giữ dữ liệu và constraint', () => {
    for (const d of BOTH) {
      const s = S(d);
      seedT(s);
      good(s, 'ALTER TABLE t RENAME COLUMN name TO full_name');
      expect(names(s, 't')).toEqual(['id', 'full_name', 'age']);
      expect(rows(s, 'SELECT full_name FROM t WHERE id = 1')).toEqual([['abcdefgh']]);
      good(s, 'ALTER TABLE t RENAME COLUMN id TO pk');
      expect(err(s, "INSERT INTO t VALUES (1, 'x', 1)").code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
    }
  });

  it('RENAME COLUMN column không có: MySQL 1054, Oracle ORA-00904', () => {
    // MySQL thật: ERROR 1054 (42S22): Unknown column 'nope' in 't'
    const m = S('mysql');
    seedT(m);
    expect(err(m, 'ALTER TABLE t RENAME COLUMN nope TO x').dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'nope' in 't'");
    const o = S('oracle');
    seedT(o);
    expect(err(o, 'ALTER TABLE t RENAME COLUMN nope TO x').dbMessage).toBe('ORA-00904: "NOPE": invalid identifier');
  });

  it('RENAME COLUMN sang tên đã có: MySQL 1060, Oracle ORA-00957', () => {
    // MySQL thật: ERROR 1060 (42S21): Duplicate column name 'age'
    const m = S('mysql');
    seedT(m);
    expect(err(m, 'ALTER TABLE t RENAME COLUMN name TO age').dbMessage).toBe("ERROR 1060 (42S21): Duplicate column name 'age'");
    const o = S('oracle');
    seedT(o);
    expect(err(o, 'ALTER TABLE t RENAME COLUMN name TO age').dbMessage).toBe('ORA-00957: duplicate column name');
  });

  it('đổi tên column cha thì foreign key của table con đi theo', () => {
    // MySQL thật: alter table f9 rename column id to id2 -> f8 vẫn REFERENCES `f9` (`id2`), insert sai vẫn bị chặn
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE f9 (id ${INT[d]} PRIMARY KEY)`, `CREATE TABLE f8 (id ${INT[d]} PRIMARY KEY, x ${INT[d]}, FOREIGN KEY (x) REFERENCES f9(id))`, 'INSERT INTO f9 VALUES (1)', 'ALTER TABLE f9 RENAME COLUMN id TO id2']);
      good(s, 'INSERT INTO f8 VALUES (1, 1)');
      expect(err(s, 'INSERT INTO f8 VALUES (2, 5)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
      expect(s.db().tables[1].constraints?.find((c) => c.kind === 'fk')).toMatchObject({ refColumns: ['id2'] });
    }
  });

  it('MySQL: đổi tên column đang nằm trong CHECK là 3959', () => {
    // MySQL thật: ERROR 3959 ... uses column 'w2', hence column cannot be dropped or renamed.
    const s = S('mysql');
    all(s, ['CREATE TABLE t (id INT, w2 INT)', 'ALTER TABLE t ADD CONSTRAINT ck CHECK (w2 > 0)']);
    expect(err(s, 'ALTER TABLE t RENAME COLUMN w2 TO w3').code).toBe('3959');
  });

  it('Oracle: đổi tên column thì biểu thức CHECK đi theo', () => {
    // CHỜ KIỂM TÀI LIỆU: Oracle cập nhật CHECK khi đổi tên column (theo mô tả RENAME COLUMN); chưa kiểm câu chữ.
    const s = S('oracle');
    all(s, ['CREATE TABLE t (id NUMBER, w2 NUMBER)', 'ALTER TABLE t ADD CONSTRAINT ck CHECK (w2 > 0)', 'ALTER TABLE t RENAME COLUMN w2 TO w3']);
    expect(err(s, 'INSERT INTO t VALUES (1, -5)').code).toBe('ORA-02290');
    good(s, 'INSERT INTO t VALUES (1, 5)');
  });

  it('RENAME TO đổi tên table, tên cũ không còn', () => {
    for (const d of BOTH) {
      const s = S(d);
      seedT(s);
      good(s, 'ALTER TABLE t RENAME TO t2');
      expect(rows(s, 'SELECT COUNT(*) FROM t2')).toEqual([[2]]);
      expect(err(s, 'SELECT * FROM t').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
      const r = good(s, 'ALTER TABLE t2 RENAME TO t3');
      expect(r).toMatchObject({ kind: 'ddl', op: 'alter', object: 't3' });
    }
  });

  it('MySQL: RENAME AS cũng được', () => {
    const s = S('mysql');
    seedT(s);
    good(s, 'ALTER TABLE t RENAME AS t9');
    expect(rows(s, 'SELECT COUNT(*) FROM t9')).toEqual([[2]]);
  });

  it('đổi tên table cha thì foreign key đi theo', () => {
    // MySQL thật: alter table f9 rename to f10 -> f8 REFERENCES `f10`
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE f9 (id ${INT[d]} PRIMARY KEY)`, `CREATE TABLE f8 (x ${INT[d]}, FOREIGN KEY (x) REFERENCES f9(id))`, 'ALTER TABLE f9 RENAME TO f10', 'INSERT INTO f10 VALUES (1)']);
      good(s, 'INSERT INTO f8 VALUES (1)');
      expect(err(s, 'INSERT INTO f8 VALUES (5)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
    }
  });

  it('RENAME TO tên đã có: MySQL 1050, Oracle ORA-00955', () => {
    // MySQL thật: ERROR 1050 (42S01): Table 'u' already exists
    const m = S('mysql');
    all(m, ['CREATE TABLE t (a INT)', 'CREATE TABLE u (a INT)']);
    expect(err(m, 'ALTER TABLE t RENAME TO u').dbMessage).toBe("ERROR 1050 (42S01): Table 'u' already exists");
    const o = S('oracle');
    all(o, ['CREATE TABLE t (a NUMBER)', 'CREATE TABLE u (a NUMBER)']);
    expect(err(o, 'ALTER TABLE t RENAME TO u').code).toBe('ORA-00955');
  });
});

describe('ALTER TABLE ADD CONSTRAINT', () => {
  it('ADD PRIMARY KEY khi column có NULL: MySQL 1138, Oracle ORA-01449', () => {
    // MySQL thật: alter table t add primary key (a) -> ERROR 1138 (22004): Invalid use of NULL value
    const m = S('mysql');
    all(m, ['CREATE TABLE t (a INT, b INT)', 'INSERT INTO t VALUES (1, 1), (NULL, 3)']);
    expect(err(m, 'ALTER TABLE t ADD PRIMARY KEY (a)').dbMessage).toBe('ERROR 1138 (22004): Invalid use of NULL value');
    const o = S('oracle');
    all(o, ['CREATE TABLE t (a NUMBER, b NUMBER)', 'INSERT INTO t VALUES (1, 1)', 'INSERT INTO t VALUES (NULL, 3)']);
    // CHỜ KIỂM TÀI LIỆU: ORA-01449 cho ADD PRIMARY KEY trên column có NULL.
    expect(err(o, 'ALTER TABLE t ADD PRIMARY KEY (a)').code).toBe('ORA-01449');
  });

  it('ADD PRIMARY KEY khi dữ liệu trùng: MySQL 1062, Oracle ORA-02299', () => {
    // MySQL thật: Duplicate entry '1' for key 't.PRIMARY'
    const m = S('mysql');
    all(m, ['CREATE TABLE t (a INT)', 'INSERT INTO t VALUES (1), (1)']);
    expect(err(m, 'ALTER TABLE t ADD PRIMARY KEY (a)').dbMessage).toBe("ERROR 1062 (23000): Duplicate entry '1' for key 't.PRIMARY'");
    const o = S('oracle');
    all(o, ['CREATE TABLE t (a NUMBER)', 'INSERT INTO t VALUES (1)', 'INSERT INTO t VALUES (1)']);
    expect(err(o, 'ALTER TABLE t ADD CONSTRAINT pk_t PRIMARY KEY (a)').dbMessage).toBe('ORA-02299: cannot validate (LAB.PK_T) - duplicate keys found');
  });

  it('ADD PRIMARY KEY hợp lệ: chạy luôn từ đó, column thành NOT NULL', () => {
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE t (a ${INT[d]}, b ${INT[d]})`, 'INSERT INTO t VALUES (1, 1)', 'INSERT INTO t VALUES (2, 3)', 'ALTER TABLE t ADD PRIMARY KEY (a)']);
      expect(err(s, 'INSERT INTO t VALUES (1, 9)').code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      expect(err(s, 'INSERT INTO t VALUES (NULL, 9)').code).toBe(d === 'mysql' ? '1048' : 'ORA-01400');
    }
  });

  it('MySQL: ADD CONSTRAINT pk_t PRIMARY KEY vẫn tên PRIMARY', () => {
    const s = S('mysql');
    all(s, ['CREATE TABLE t (a INT)', 'ALTER TABLE t ADD CONSTRAINT pk_t PRIMARY KEY (a)']);
    expect(s.db().tables[0].constraints?.[0].name).toBe('PRIMARY');
  });

  it('table đã có primary key mà ADD thêm: MySQL 1068, Oracle ORA-02260', () => {
    // MySQL thật: ERROR 1068 (42000): Multiple primary key defined
    const m = S('mysql');
    seedT(m);
    expect(err(m, 'ALTER TABLE t ADD CONSTRAINT pk2 PRIMARY KEY (name)').dbMessage).toBe('ERROR 1068 (42000): Multiple primary key defined');
    const o = S('oracle');
    seedT(o);
    expect(err(o, 'ALTER TABLE t ADD CONSTRAINT pk2 PRIMARY KEY (name)').code).toBe('ORA-02260');
  });

  it('ADD constraint nhắc column không có: MySQL 1072, Oracle ORA-00904', () => {
    // MySQL thật: ERROR 1072 (42000): Key column 'nope' doesn't exist in table
    const m = S('mysql');
    good(m, 'CREATE TABLE t (a INT)');
    expect(err(m, 'ALTER TABLE t ADD PRIMARY KEY (nope)').dbMessage).toBe("ERROR 1072 (42000): Key column 'nope' doesn't exist in table");
    const o = S('oracle');
    good(o, 'CREATE TABLE t (a NUMBER)');
    expect(err(o, 'ALTER TABLE t ADD PRIMARY KEY (nope)').dbMessage).toBe('ORA-00904: "NOPE": invalid identifier');
  });

  it('ADD UNIQUE khi dữ liệu trùng: MySQL 1062, Oracle ORA-02299, tên constraint hiện trong lỗi', () => {
    // MySQL thật: ERROR 1062 (23000): Duplicate entry 'a' for key 'p.u_name'
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT PRIMARY KEY, name VARCHAR(10))', "INSERT INTO p VALUES (1, 'a'), (2, 'a')"]);
    expect(err(m, 'ALTER TABLE p ADD CONSTRAINT u_name UNIQUE (name)').dbMessage).toBe("ERROR 1062 (23000): Duplicate entry 'a' for key 'p.u_name'");
    const o = S('oracle');
    all(o, ['CREATE TABLE p (id NUMBER PRIMARY KEY, name VARCHAR2(10))', "INSERT INTO p VALUES (1, 'a')", "INSERT INTO p VALUES (2, 'a')"]);
    expect(err(o, 'ALTER TABLE p ADD CONSTRAINT u_name UNIQUE (name)').dbMessage).toBe('ORA-02299: cannot validate (LAB.U_NAME) - duplicate keys found');
  });

  it('ADD UNIQUE hợp lệ: NULL không tính là trùng, từ đó chặn trùng', () => {
    // MySQL thật: alter table p add constraint u_code unique (code) chạy được khi code có NULL
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE p (id ${INT[d]} PRIMARY KEY, code ${TEXT[d]}(5))`, "INSERT INTO p VALUES (1, 'x')", 'INSERT INTO p VALUES (2, NULL)', 'INSERT INTO p VALUES (3, NULL)', 'ALTER TABLE p ADD CONSTRAINT u_code UNIQUE (code)']);
      const e = err(s, "INSERT INTO p VALUES (4, 'x')");
      expect(e.dbMessage).toContain(d === 'mysql' ? "'p.u_code'" : '(LAB.U_CODE)');
    }
  });

  it('tên constraint trùng khi ADD: MySQL 1061 (UNIQUE), 1826 (foreign key), Oracle ORA-02264', () => {
    // MySQL thật: ERROR 1061 (42000): Duplicate key name 'u_c'; ERROR 1826 (HY000): Duplicate foreign key constraint name 'fk_c'
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT PRIMARY KEY)', 'CREATE TABLE c (id INT, pid INT)', 'ALTER TABLE c ADD CONSTRAINT u_c UNIQUE (id)', 'ALTER TABLE c ADD CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id)']);
    expect(err(m, 'ALTER TABLE c ADD CONSTRAINT u_c UNIQUE (id)').dbMessage).toBe("ERROR 1061 (42000): Duplicate key name 'u_c'");
    expect(err(m, 'ALTER TABLE c ADD CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id)').dbMessage).toBe("ERROR 1826 (HY000): Duplicate foreign key constraint name 'fk_c'");
    const o = S('oracle');
    all(o, ['CREATE TABLE c (id NUMBER, pid NUMBER)', 'ALTER TABLE c ADD CONSTRAINT u_c UNIQUE (id)']);
    expect(err(o, 'ALTER TABLE c ADD CONSTRAINT u_c UNIQUE (pid)').dbMessage).toBe('ORA-02264: name already used by an existing constraint');
  });

  it('Oracle: UNIQUE trên đúng các column đã có primary key là ORA-02261', () => {
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'ALTER TABLE t ADD CONSTRAINT u_id UNIQUE (id)').dbMessage).toBe('ORA-02261: such unique or primary key already exists in the table');
  });

  it('ADD CHECK: từ đó chặn row sai, tên hiện trong lỗi', () => {
    // MySQL thật: Check constraint 'chk_a' is violated.
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE t (a ${INT[d]})`, 'INSERT INTO t VALUES (1)', 'ALTER TABLE t ADD CONSTRAINT chk_a CHECK (a > 0)']);
      const e = err(s, 'INSERT INTO t VALUES (-1)');
      expect(e.dbMessage).toBe(d === 'mysql' ? "ERROR 3819 (HY000): Check constraint 'chk_a' is violated." : 'ORA-02290: check constraint (LAB.CHK_A) violated');
    }
  });

  it('ADD CHECK khi dữ liệu đang vi phạm: MySQL 3819, Oracle ORA-02293', () => {
    // MySQL thật: alter table p add constraint ck2 check (id > 2) -> ERROR 3819 Check constraint 'ck2' is violated.
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT)', 'INSERT INTO p VALUES (1), (3)']);
    expect(err(m, 'ALTER TABLE p ADD CONSTRAINT ck2 CHECK (id > 2)').dbMessage).toBe("ERROR 3819 (HY000): Check constraint 'ck2' is violated.");
    const o = S('oracle');
    all(o, ['CREATE TABLE p (id NUMBER)', 'INSERT INTO p VALUES (1)', 'INSERT INTO p VALUES (3)']);
    expect(err(o, 'ALTER TABLE p ADD CONSTRAINT ck2 CHECK (id > 2)').dbMessage).toBe('ORA-02293: cannot validate (LAB.CK2) - check constraint violated');
  });

  it('ADD CHECK nhắc column không có: MySQL 1054, Oracle ORA-00904', () => {
    // MySQL thật: ERROR 1054 (42S22): Unknown column 'age' in 'check constraint ck_age2 expression'
    const m = S('mysql');
    good(m, 'CREATE TABLE t (id INT)');
    expect(err(m, 'ALTER TABLE t ADD CONSTRAINT ck_age2 CHECK (age > 5)').dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'age' in 'check constraint ck_age2 expression'");
    const o = S('oracle');
    good(o, 'CREATE TABLE t (id NUMBER)');
    expect(err(o, 'ALTER TABLE t ADD CONSTRAINT ck_age2 CHECK (age > 5)').dbMessage).toBe('ORA-00904: "AGE": invalid identifier');
  });

  it('MySQL: ADD CHECK không tên đặt tên t_chk_1; ADD UNIQUE không tên lấy tên column', () => {
    const s = S('mysql');
    all(s, ['CREATE TABLE t (a INT, b INT)', 'ALTER TABLE t ADD CHECK (a > 0)', 'ALTER TABLE t ADD UNIQUE (b)']);
    expect(s.db().tables[0].constraints?.map((c) => c.name)).toEqual(['t_chk_1', 'b']);
  });

  it('ADD FOREIGN KEY khi row đang có trỏ vào chỗ trống: MySQL 1452, Oracle ORA-02298', () => {
    // MySQL thật: ERROR 1452 ... a foreign key constraint fails (`lab`.`#sql-...`, CONSTRAINT `fk_c` FOREIGN KEY (`pid`) REFERENCES `p` (`id`))
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT PRIMARY KEY)', 'CREATE TABLE c (id INT PRIMARY KEY, pid INT)', 'INSERT INTO p VALUES (1)', 'INSERT INTO c VALUES (1, 1), (2, 9), (3, NULL)']);
    const e = err(m, 'ALTER TABLE c ADD CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id)');
    expect(e.code).toBe('1452');
    expect(e.dbMessage).toContain('CONSTRAINT `fk_c` FOREIGN KEY (`pid`) REFERENCES `p` (`id`))');
    const o = S('oracle');
    all(o, ['CREATE TABLE p (id NUMBER PRIMARY KEY)', 'CREATE TABLE c (id NUMBER PRIMARY KEY, pid NUMBER)', 'INSERT INTO p VALUES (1)', 'INSERT INTO c VALUES (1, 1)', 'INSERT INTO c VALUES (2, 9)']);
    expect(err(o, 'ALTER TABLE c ADD CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id)').dbMessage).toBe('ORA-02298: cannot validate (LAB.FK_C) - parent keys not found');
  });

  it('ADD FOREIGN KEY hợp lệ: row NULL được, từ đó chặn row sai; ON DELETE CASCADE chạy', () => {
    for (const d of BOTH) {
      const s = S(d);
      all(s, [`CREATE TABLE p (id ${INT[d]} PRIMARY KEY)`, `CREATE TABLE c (id ${INT[d]} PRIMARY KEY, pid ${INT[d]})`, 'INSERT INTO p VALUES (1)', 'INSERT INTO c VALUES (1, 1)', 'INSERT INTO c VALUES (2, NULL)', 'ALTER TABLE c ADD CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id) ON DELETE CASCADE']);
      expect(err(s, 'INSERT INTO c VALUES (3, 9)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
      good(s, 'DELETE FROM p WHERE id = 1');
      expect(rows(s, 'SELECT id FROM c')).toEqual([[2]]);
    }
  });

  it('MySQL: ADD FOREIGN KEY không tên đặt t_ibfk_1', () => {
    const s = S('mysql');
    all(s, ['CREATE TABLE p (id INT PRIMARY KEY)', 'CREATE TABLE c (pid INT)', 'ALTER TABLE c ADD FOREIGN KEY (pid) REFERENCES p(id)']);
    expect(s.db().tables[1].constraints?.[0].name).toBe('c_ibfk_1');
  });

  it('ADD FOREIGN KEY tới table, column hay data type không hợp: dùng đúng mã của lúc CREATE', () => {
    // MySQL thật: 1824, 3734, 1072, 3780
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT PRIMARY KEY, name VARCHAR(10))', 'CREATE TABLE c (pid INT)']);
    expect(err(m, 'ALTER TABLE c ADD CONSTRAINT f1 FOREIGN KEY (pid) REFERENCES nope(id)').code).toBe('1824');
    expect(err(m, 'ALTER TABLE c ADD CONSTRAINT f2 FOREIGN KEY (pid) REFERENCES p(nope)').code).toBe('3734');
    expect(err(m, 'ALTER TABLE c ADD CONSTRAINT f3 FOREIGN KEY (nope) REFERENCES p(id)').code).toBe('1072');
    expect(err(m, 'ALTER TABLE c ADD CONSTRAINT f4 FOREIGN KEY (pid) REFERENCES p(name)').code).toBe('3780');
    const o = S('oracle');
    all(o, ['CREATE TABLE p (id NUMBER PRIMARY KEY, name VARCHAR2(10))', 'CREATE TABLE c (pid NUMBER)']);
    expect(err(o, 'ALTER TABLE c ADD CONSTRAINT f1 FOREIGN KEY (pid) REFERENCES nope(id)').code).toBe('ORA-00942');
    expect(err(o, 'ALTER TABLE c ADD CONSTRAINT f4 FOREIGN KEY (pid) REFERENCES p(name)').code).toBe('ORA-02267');
  });
});

describe('ALTER TABLE DROP CONSTRAINT', () => {
  const setup = (d: Dialect) => {
    const s = S(d);
    all(s, [
      `CREATE TABLE p (id ${INT[d]} PRIMARY KEY, code ${TEXT[d]}(5), CONSTRAINT u_code UNIQUE (code))`,
      `CREATE TABLE c (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, n ${INT[d]}, CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id), CONSTRAINT ck_n CHECK (n > 0))`,
      "INSERT INTO p VALUES (1, 'a')",
    ]);
    return s;
  };

  it('DROP CONSTRAINT bỏ FOREIGN KEY, CHECK, UNIQUE theo tên, luật đó hết chặn', () => {
    // MySQL thật: alter table c drop constraint fk_c / p drop constraint u_code đều chạy được
    for (const d of BOTH) {
      const s = setup(d);
      expect(err(s, 'INSERT INTO c VALUES (1, 77, 1)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
      good(s, 'ALTER TABLE c DROP CONSTRAINT fk_c');
      good(s, 'INSERT INTO c VALUES (1, 77, 1)');
      expect(err(s, 'INSERT INTO c VALUES (2, 1, -1)').code).toBe(d === 'mysql' ? '3819' : 'ORA-02290');
      good(s, 'ALTER TABLE c DROP CONSTRAINT ck_n');
      good(s, 'INSERT INTO c VALUES (2, 1, -1)');
      good(s, "INSERT INTO p VALUES (2, 'b')");
      expect(err(s, "INSERT INTO p VALUES (3, 'b')").code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      good(s, 'ALTER TABLE p DROP CONSTRAINT u_code');
      good(s, "INSERT INTO p VALUES (3, 'b')");
    }
  });

  it('MySQL: DROP FOREIGN KEY, DROP CHECK, DROP PRIMARY KEY', () => {
    // MySQL thật: các câu này chạy được
    const s = setup('mysql');
    good(s, 'ALTER TABLE c DROP FOREIGN KEY fk_c');
    good(s, 'ALTER TABLE c DROP CHECK ck_n');
    good(s, 'ALTER TABLE c DROP PRIMARY KEY');
    good(s, 'INSERT INTO c VALUES (1, 77, -1)');
    good(s, 'INSERT INTO c VALUES (1, 77, -1)');
  });

  it('MySQL: DROP constraint không có: 3940 (CONSTRAINT), 1091 (FOREIGN KEY), 3821 (CHECK), 1091 (PRIMARY KEY)', () => {
    // MySQL thật: Constraint 'nope' does not exist. / Can't DROP 'nope'; check that column/key exists / Check constraint 'ck1' is not found in the table. / Can't DROP 'PRIMARY'
    const s = setup('mysql');
    expect(err(s, 'ALTER TABLE c DROP CONSTRAINT nope').dbMessage).toBe("ERROR 3940 (HY000): Constraint 'nope' does not exist.");
    expect(err(s, 'ALTER TABLE c DROP FOREIGN KEY nope').dbMessage).toBe("ERROR 1091 (42000): Can't DROP 'nope'; check that column/key exists");
    expect(err(s, 'ALTER TABLE c DROP CHECK ck1').dbMessage).toBe("ERROR 3821 (HY000): Check constraint 'ck1' is not found in the table.");
    good(s, 'ALTER TABLE c DROP PRIMARY KEY');
    expect(err(s, 'ALTER TABLE c DROP PRIMARY KEY').dbMessage).toBe("ERROR 1091 (42000): Can't DROP 'PRIMARY'; check that column/key exists");
  });

  it('MySQL: DROP PRIMARY KEY khi table khác trỏ tới là 1553', () => {
    // MySQL thật: ERROR 1553 (HY000): Cannot drop index 'PRIMARY': needed in a foreign key constraint
    const s = setup('mysql');
    expect(err(s, 'ALTER TABLE p DROP PRIMARY KEY').dbMessage).toBe("ERROR 1553 (HY000): Cannot drop index 'PRIMARY': needed in a foreign key constraint");
    good(s, 'ALTER TABLE c DROP FOREIGN KEY fk_c');
    good(s, 'ALTER TABLE p DROP PRIMARY KEY');
  });

  it('Oracle: DROP CONSTRAINT không có là ORA-02443, DROP PRIMARY KEY không có là ORA-02441', () => {
    const s = setup('oracle');
    expect(err(s, 'ALTER TABLE c DROP CONSTRAINT nope').dbMessage).toBe('ORA-02443: Cannot drop constraint  - nonexistent constraint');
    good(s, 'ALTER TABLE c DROP PRIMARY KEY');
    expect(err(s, 'ALTER TABLE c DROP PRIMARY KEY').dbMessage).toBe('ORA-02441: Cannot drop nonexistent primary key');
  });

  it('Oracle: DROP PRIMARY KEY hay DROP CONSTRAINT của key mà foreign key đang trỏ tới là ORA-02273', () => {
    const s = setup('oracle');
    expect(err(s, 'ALTER TABLE p DROP PRIMARY KEY').dbMessage).toBe('ORA-02273: this unique/primary key is referenced by some foreign keys');
    good(s, 'ALTER TABLE c DROP CONSTRAINT fk_c');
    good(s, 'ALTER TABLE p DROP PRIMARY KEY');
  });

  it('Oracle: DROP FOREIGN KEY và DROP CHECK (cú pháp MySQL) là lỗi', () => {
    // CHỜ KIỂM TÀI LIỆU: Oracle chỉ có DROP CONSTRAINT. Mã ORA-00905 cho hai cú pháp MySQL này là suy luận.
    const s = setup('oracle');
    expect(err(s, 'ALTER TABLE c DROP FOREIGN KEY fk_c').code).toBe('ORA-00905');
    expect(err(s, 'ALTER TABLE c DROP CHECK ck_n').code).toBe('ORA-00905');
  });

  it('ALTER TABLE không có việc nào: Oracle ORA-01735', () => {
    // CHỜ KIỂM TÀI LIỆU: mã ORA-01735 cho ALTER TABLE t trơ trọi là suy luận.
    const s = setup('oracle');
    expect(err(s, 'ALTER TABLE c').code).toBe('ORA-01735');
  });
});

describe('DROP TABLE', () => {
  it('xóa table, table không còn, tạo lại tên đó được', () => {
    for (const d of BOTH) {
      const s = S(d);
      seedT(s);
      const r = good(s, 'DROP TABLE t');
      expect(r).toMatchObject({ kind: 'ddl', op: 'drop', object: 't', columns: [] });
      expect(err(s, 'SELECT * FROM t').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
      good(s, `CREATE TABLE t (a ${INT[d]})`);
    }
  });

  it('table không có: MySQL 1051, Oracle ORA-00942', () => {
    // MySQL thật: ERROR 1051 (42S02): Unknown table 'lab.nope'
    expect(err(S('mysql'), 'DROP TABLE nope').dbMessage).toBe("ERROR 1051 (42S02): Unknown table 'lab.nope'");
    expect(err(S('oracle'), 'DROP TABLE nope').dbMessage).toBe('ORA-00942: table or view does not exist');
  });

  it('MySQL: DROP TABLE IF EXISTS không báo lỗi khi table không có', () => {
    // MySQL thật: drop table if exists nope chạy được (chỉ có warning)
    const s = S('mysql');
    seedT(s);
    good(s, 'DROP TABLE IF EXISTS nope');
    good(s, 'DROP TABLE IF EXISTS t');
    expect(s.db().tables).toEqual([]);
  });

  it('Oracle 19c không có IF EXISTS: ORA-00933', () => {
    // CHỜ KIỂM TÀI LIỆU: Oracle đọc IF thành tên table rồi lạc ở chữ EXISTS. Mã ORA-00933 là hiểu biết tốt nhất, chưa tìm trang xác nhận.
    const e = err(S('oracle'), 'DROP TABLE IF EXISTS nope');
    expect(e.code).toBe('ORA-00933');
  });

  it('table đang bị foreign key trỏ tới thì chặn: MySQL 3730, Oracle ORA-02449', () => {
    // MySQL thật: ERROR 3730 (HY000): Cannot drop table 'p' referenced by a foreign key constraint 'fk2' on table 'c2'.
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT PRIMARY KEY)', 'CREATE TABLE c2 (id INT, CONSTRAINT fk2 FOREIGN KEY (id) REFERENCES p(id))']);
    expect(err(m, 'DROP TABLE p').dbMessage).toBe("ERROR 3730 (HY000): Cannot drop table 'p' referenced by a foreign key constraint 'fk2' on table 'c2'.");
    good(m, 'DROP TABLE c2');
    good(m, 'DROP TABLE p');
    const o = S('oracle');
    all(o, ['CREATE TABLE p (id NUMBER PRIMARY KEY)', 'CREATE TABLE c2 (id NUMBER, CONSTRAINT fk2 FOREIGN KEY (id) REFERENCES p(id))']);
    expect(err(o, 'DROP TABLE p').dbMessage).toBe('ORA-02449: unique/primary keys in table referenced by foreign keys');
    good(o, 'DROP TABLE c2');
    good(o, 'DROP TABLE p');
  });

  it('Oracle: DROP TABLE ... CASCADE CONSTRAINTS bỏ luôn foreign key của table con', () => {
    const s = S('oracle');
    all(s, ['CREATE TABLE p (id NUMBER PRIMARY KEY)', 'CREATE TABLE c2 (id NUMBER, CONSTRAINT fk2 FOREIGN KEY (id) REFERENCES p(id))', 'DROP TABLE p CASCADE CONSTRAINTS']);
    good(s, 'INSERT INTO c2 VALUES (99)');
    expect(s.db().tables.map((t) => t.name)).toEqual(['c2']);
    expect(s.db().tables[0].columns[0].fk).toBeUndefined();
    expect(s.db().tables[0].constraints).toEqual([]);
  });

  it('Oracle: PURGE đi kèm DROP TABLE được nhận', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE q1 (id NUMBER PRIMARY KEY)');
    good(s, 'DROP TABLE q1 PURGE');
  });

  it('table có foreign key tự trỏ vào chính nó thì xóa được', () => {
    // MySQL thật: drop table self chạy được
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE self (id ${INT[d]} PRIMARY KEY, boss ${INT[d]}, FOREIGN KEY (boss) REFERENCES self(id))`);
      good(s, 'DROP TABLE self');
    }
  });

  it('MySQL: DROP TABLE a, b (nhiều table một lệnh) khóa học chưa dạy', () => {
    const s = S('mysql');
    all(s, ['CREATE TABLE a (x INT)', 'CREATE TABLE b (x INT)']);
    expect(err(s, 'DROP TABLE a, b').code).toBe('CHUA-HOC');
  });
});

describe('TRUNCATE TABLE', () => {
  it('xóa hết row, giữ cấu trúc', () => {
    for (const d of BOTH) {
      const s = S(d);
      seedT(s);
      const r = good(s, 'TRUNCATE TABLE t');
      expect(r).toMatchObject({ kind: 'ddl', op: 'truncate', object: 't' });
      expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[0]]);
      good(s, "INSERT INTO t VALUES (1, 'a', 1)");
    }
  });

  it('MySQL: TRUNCATE đặt lại bộ đếm AUTO_INCREMENT, DELETE thì không', () => {
    // MySQL thật: sau truncate table e1, insert -> id = 1
    const s = S('mysql');
    all(s, ['CREATE TABLE e1 (id INT AUTO_INCREMENT PRIMARY KEY, v INT)', 'INSERT INTO e1 (v) VALUES (1), (2), (3)', 'TRUNCATE TABLE e1', 'INSERT INTO e1 (v) VALUES (9)']);
    expect(rows(s, 'SELECT id FROM e1')).toEqual([[1]]);
  });

  it('MySQL: TRUNCATE t (bỏ chữ TABLE) cũng được', () => {
    // MySQL thật: truncate e1 chạy được
    const s = S('mysql');
    seedT(s);
    good(s, 'TRUNCATE t');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[0]]);
  });

  it('Oracle: TRUNCATE t (thiếu chữ TABLE) là lỗi ORA-03290', () => {
    // Error Messages 19c: ORA-03290 Invalid truncate command - missing CLUSTER or TABLE keyword
    const s = S('oracle');
    seedT(s);
    expect(err(s, 'TRUNCATE t').dbMessage).toBe('ORA-03290: Invalid truncate command - missing CLUSTER or TABLE keyword');
  });

  it('Oracle: identity không về 1 sau TRUNCATE', () => {
    const s = S('oracle');
    all(s, ['CREATE TABLE e1 (id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v NUMBER)', 'INSERT INTO e1 (v) VALUES (1)', 'INSERT INTO e1 (v) VALUES (2)', 'TRUNCATE TABLE e1', 'INSERT INTO e1 (v) VALUES (9)']);
    expect(rows(s, 'SELECT id FROM e1')).toEqual([[3]]);
  });

  it('table đang bị foreign key trỏ tới thì chặn: MySQL 1701, Oracle ORA-02266', () => {
    // MySQL thật: ERROR 1701 (42000): Cannot truncate a table referenced in a foreign key constraint (`lab`.`cc`, CONSTRAINT `cc_ibfk_1`) (kể cả khi cc rỗng)
    const m = S('mysql');
    all(m, ['CREATE TABLE pp (id INT PRIMARY KEY)', 'CREATE TABLE cc (id INT, FOREIGN KEY (id) REFERENCES pp(id))']);
    expect(err(m, 'TRUNCATE TABLE pp').dbMessage).toBe('ERROR 1701 (42000): Cannot truncate a table referenced in a foreign key constraint (`lab`.`cc`, CONSTRAINT `cc_ibfk_1`)');
    good(m, 'TRUNCATE TABLE cc');
    const o = S('oracle');
    all(o, ['CREATE TABLE pp (id NUMBER PRIMARY KEY)', 'CREATE TABLE cc (id NUMBER REFERENCES pp)']);
    expect(err(o, 'TRUNCATE TABLE pp').dbMessage).toBe('ORA-02266: unique/primary keys in table referenced by enabled foreign keys');
    good(o, 'TRUNCATE TABLE cc');
  });

  it('table không có: MySQL 1146, Oracle ORA-00942', () => {
    // MySQL thật: ERROR 1146 (42S02): Table 'lab.nope' doesn't exist
    expect(err(S('mysql'), 'TRUNCATE TABLE nope').dbMessage).toBe("ERROR 1146 (42S02): Table 'lab.nope' doesn't exist");
    expect(err(S('oracle'), 'TRUNCATE TABLE nope').code).toBe('ORA-00942');
  });
});

describe('DDL tự COMMIT', () => {
  const DDL: Record<Dialect, Record<string, string>> = {
    mysql: { create: 'CREATE TABLE zz (a INT)', alter: 'ALTER TABLE t ADD COLUMN extra INT', drop: 'DROP TABLE t', truncate: 'TRUNCATE TABLE t' },
    oracle: { create: 'CREATE TABLE zz (a NUMBER)', alter: 'ALTER TABLE t ADD extra NUMBER', drop: 'DROP TABLE t', truncate: 'TRUNCATE TABLE t' },
  };
  for (const d of BOTH) {
    for (const kind of ['create', 'alter', 'drop', 'truncate']) {
      it(`${d}: ${kind.toUpperCase()} chốt thay đổi đang chờ, ROLLBACK sau đó không hoàn lại được`, () => {
        // MySQL thật: start transaction; insert; create table ...; rollback -> row vẫn còn
        const s = S(d);
        all(s, [`CREATE TABLE t (id ${INT[d]} PRIMARY KEY)`, 'INSERT INTO t VALUES (1)', 'COMMIT']);
        if (d === 'mysql') good(s, 'START TRANSACTION');
        good(s, 'INSERT INTO t VALUES (2)');
        expect(s.pending()).toBe(1);
        good(s, DDL[d][kind]);
        expect(s.pending()).toBe(0);
        const r = good(s, 'ROLLBACK');
        expect(r).toMatchObject({ kind: 'tx', op: 'rollback', changes: 0 });
        if (kind !== 'drop' && kind !== 'truncate') expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[2]]);
        if (kind === 'truncate') expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[0]]);
        if (kind === 'drop') expect(err(s, 'SELECT * FROM t').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
      });
    }
  }

  it('MySQL: DDL lỗi ở bước chạy (không phải lỗi cú pháp) vẫn đã chốt thay đổi trước đó', () => {
    // MySQL thật: set autocommit = 0; insert; alter table nope add x int (1146); rollback -> row insert vẫn còn
    const s = S('mysql');
    all(s, ['CREATE TABLE t (id INT)', 'START TRANSACTION', 'INSERT INTO t VALUES (1)']);
    expect(err(s, 'ALTER TABLE nope ADD x INT').code).toBe('1146');
    good(s, 'ROLLBACK');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
  });

  it('MySQL: lệnh sai cú pháp thì chưa chốt gì', () => {
    // MySQL thật: set autocommit = 0; insert; syntax error here; rollback -> row insert bị hoàn lại
    const s = S('mysql');
    all(s, ['CREATE TABLE t (id INT)', 'START TRANSACTION', 'INSERT INTO t VALUES (1)']);
    expect(err(s, 'CREATE TABLE zz (a FOO)').code).toBe('1064');
    good(s, 'ROLLBACK');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[0]]);
  });

  it('Oracle: DDL lỗi ở bước chạy vẫn đã chốt thay đổi trước đó, lỗi cú pháp thì chưa', () => {
    const s = S('oracle');
    all(s, ['CREATE TABLE t (id NUMBER)', 'INSERT INTO t VALUES (1)']);
    expect(err(s, 'DROP TABLE nope').code).toBe('ORA-00942');
    good(s, 'ROLLBACK');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
    good(s, 'INSERT INTO t VALUES (2)');
    expect(err(s, 'CREATE TABLE zz (a FOO)').code).toBe('ORA-00902');
    good(s, 'ROLLBACK');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
  });

  it('Oracle: CREATE SEQUENCE và DROP SEQUENCE cũng chốt thay đổi đang chờ', () => {
    const s = S('oracle');
    all(s, ['CREATE TABLE t (id NUMBER)', 'INSERT INTO t VALUES (1)', 'CREATE SEQUENCE sq']);
    good(s, 'ROLLBACK');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
    good(s, 'INSERT INTO t VALUES (2)');
    good(s, 'DROP SEQUENCE sq');
    good(s, 'ROLLBACK');
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[2]]);
  });

  it('DDL lỗi giữa chừng không để lại table nửa vời', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE p (id ${INT[d]} PRIMARY KEY)`);
      // lệnh này lỗi ở foreign key thứ hai, table c không được tạo
      err(s, `CREATE TABLE c (a ${INT[d]}, b ${INT[d]}, FOREIGN KEY (a) REFERENCES p(id), FOREIGN KEY (b) REFERENCES nope(id))`);
      expect(s.db().tables.map((t) => t.name)).toEqual(['p']);
      // ALTER có hai việc, việc thứ hai lỗi thì việc thứ nhất cũng không giữ lại (MySQL cho nối hai việc)
      if (d === 'mysql') {
        err(s, 'ALTER TABLE p ADD COLUMN x INT, ADD COLUMN id INT');
        expect(names(s, 'p')).toEqual(['id']);
      }
    }
  });
});
