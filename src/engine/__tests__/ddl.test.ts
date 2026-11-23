import { describe, expect, it } from 'vitest';
import type { Dialect, Session } from '../index';
import { BOTH, INT, S, TEXT, all, err, good, rows } from './ddl-util';

/**
 * CREATE TABLE: data type, độ dài, độ chính xác, DEFAULT, constraint có tên, foreign key và các hành động ON DELETE.
 * Test MySQL ghi kết quả đã thấy trên MySQL 8.0.46 thật (mysql -uroot, sql_mode mặc định).
 * Test Oracle theo Oracle Database 19c SQL Language Reference và Error Messages.
 * Mã Oracle đã kiểm trên Oracle XE 21c thật (xem docs/dialect-verification.md).
 */


describe('CREATE TABLE: data type', () => {
  it('MySQL: tạo table với đủ các data type của MySQL', () => {
    // Đã chạy trên MySQL thật: create table t1 (a int, ..., l timestamp) chạy được.
    const r = good(
      S('mysql'),
      'CREATE TABLE t1 (a INT, b INTEGER, c BIGINT, d SMALLINT, e TINYINT, f DECIMAL(5,2), g NUMERIC(4), h VARCHAR(20), i CHAR(3), j TEXT, k DATE, l DATETIME, m TIMESTAMP)',
    );
    if (r.kind !== 'ddl') throw new Error('x');
    expect(r.columns.map((c) => c.declared)).toEqual(['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL(5,2)', 'NUMERIC(4)', 'VARCHAR(20)', 'CHAR(3)', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP']);
  });

  it('Oracle: tạo table với đủ các data type của Oracle', () => {
    const r = good(
      S('oracle'),
      'CREATE TABLE t1 (a NUMBER, b NUMBER(5), c NUMBER(5,2), d INTEGER, e INT, f VARCHAR2(20), g VARCHAR2(20 CHAR), h VARCHAR(20), i CHAR(3), j CLOB, k DATE, l TIMESTAMP)',
    );
    if (r.kind !== 'ddl') throw new Error('x');
    expect(r.columns.map((c) => c.declared)).toEqual(['NUMBER', 'NUMBER(5)', 'NUMBER(5,2)', 'INTEGER', 'INT', 'VARCHAR2(20)', 'VARCHAR2(20 CHAR)', 'VARCHAR(20)', 'CHAR(3)', 'CLOB', 'DATE', 'TIMESTAMP']);
  });

  it('độ dài và độ chính xác nằm trong định nghĩa column của Database (JSON thuần)', () => {
    const s = S('mysql');
    good(s, "CREATE TABLE t (a VARCHAR(20) DEFAULT 'x', b DECIMAL(5,2), c INT NOT NULL)");
    const t = JSON.parse(JSON.stringify(s.db().tables[0]));
    expect(t.columns[0]).toMatchObject({ name: 'a', sqlType: 'VARCHAR', length: 20, default: "'x'" });
    expect(t.columns[1]).toMatchObject({ sqlType: 'DECIMAL', precision: 5, scale: 2 });
    expect(t.columns[2]).toMatchObject({ sqlType: 'INT', notNull: true });
  });

  it('MySQL: VARCHAR không có độ dài là lỗi 1064 ngay tại dấu )', () => {
    // MySQL thật: ERROR 1064 ... near ')' at line 1
    const e = err(S('mysql'), 'CREATE TABLE t2 (a VARCHAR)');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near ')' at line 1");
  });

  it('Oracle: VARCHAR2 không có độ dài là ORA-00906', () => {
    expect(err(S('oracle'), 'CREATE TABLE t2 (a VARCHAR2)').code).toBe('ORA-00906');
  });

  for (const name of ['VARCHAR2(5)', 'NUMBER', 'CLOB']) {
    it(`MySQL: ${name} không phải data type (1064)`, () => {
      // MySQL thật: ERROR 1064 ... near 'varchar2(5))', 'number)', 'clob)'
      const e = err(S('mysql'), `CREATE TABLE t3 (a ${name})`);
      expect(e.code).toBe('1064');
      expect(e.dbMessage).toContain(`near '${name}`);
    });
  }

  for (const name of ['TINYINT', 'BIGINT', 'TEXT', 'DATETIME']) {
    it(`Oracle: ${name} không phải data type (ORA-00902)`, () => {
      expect(err(S('oracle'), `CREATE TABLE t3 (a ${name})`).code).toBe('ORA-00902');
    });
  }

  it('tên data type sai: MySQL 1064, Oracle ORA-00902', () => {
    expect(err(S('mysql'), 'CREATE TABLE t5 (a FOO)').dbMessage).toContain("near 'FOO)'");
    expect(err(S('oracle'), 'CREATE TABLE t5 (a FOO)').code).toBe('ORA-00902');
  });

  it('MySQL: DECIMAL(5,6) là lỗi 1427', () => {
    // MySQL thật: ERROR 1427 (42000): For float(M,D), double(M,D) or decimal(M,D), M must be >= D (column 'a').
    const e = err(S('mysql'), 'CREATE TABLE t (a DECIMAL(5,6))');
    expect(e.dbMessage).toBe("ERROR 1427 (42000): For float(M,D), double(M,D) or decimal(M,D), M must be >= D (column 'a').");
  });

  it('MySQL: DECIMAL(66,2) là lỗi 1426', () => {
    // MySQL thật: ERROR 1426 (42000): Too-big precision 66 specified for 'x'. Maximum is 65.
    expect(err(S('mysql'), 'CREATE TABLE t (x DECIMAL(66,2))').dbMessage).toBe("ERROR 1426 (42000): Too-big precision 66 specified for 'x'. Maximum is 65.");
  });

  it('MySQL: VARCHAR(70000) và CHAR(256) là lỗi 1074', () => {
    // MySQL thật: Column length too big for column 'a' (max = 16383) và (max = 255)
    expect(err(S('mysql'), 'CREATE TABLE t (a VARCHAR(70000))').dbMessage).toBe("ERROR 1074 (42000): Column length too big for column 'a' (max = 16383); use BLOB or TEXT instead");
    expect(err(S('mysql'), 'CREATE TABLE t (x CHAR(256))').dbMessage).toContain('(max = 255)');
  });

  it('Oracle: NUMBER(39) là ORA-01727, NUMBER(5,130) là ORA-01728', () => {
    expect(err(S('oracle'), 'CREATE TABLE t (a NUMBER(39))').dbMessage).toBe('ORA-01727: numeric precision specifier is out of range (1 to 38)');
    expect(err(S('oracle'), 'CREATE TABLE t (a NUMBER(5,130))').dbMessage).toBe('ORA-01728: numeric scale specifier is out of range (-84 to 127)');
  });

  it('Oracle: VARCHAR2(5000) và CHAR(2001) là ORA-00910', () => {
    // Error Messages 19c: ORA-00910 specified length too long for its datatype (CHAR > 2000, kiểu khác > 4000)
    expect(err(S('oracle'), 'CREATE TABLE t (a VARCHAR2(5000))').dbMessage).toBe('ORA-00910: specified length too long for its datatype');
    expect(err(S('oracle'), 'CREATE TABLE t (a CHAR(2001))').code).toBe('ORA-00910');
    good(S('oracle'), 'CREATE TABLE t (a VARCHAR2(4000), b CHAR(2000))');
  });

  it('Oracle: độ dài 0 là ORA-01723', () => {
    // Đã kiểm trên Oracle XE 21c và 18c thật: VARCHAR2(0), VARCHAR(0), CHAR(0), VARCHAR2(0 CHAR) đều báo ORA-01723 (zero-length columns are not allowed).
    expect(err(S('oracle'), 'CREATE TABLE t (a VARCHAR2(0))').code).toBe('ORA-01723');
    expect(err(S('oracle'), 'CREATE TABLE t (a CHAR(0))').dbMessage).toBe('ORA-01723: zero-length columns are not allowed');
  });

  it('Oracle: NUMBER(5,-2) làm tròn tới hàng trăm không bị chặn khi tạo', () => {
    good(S('oracle'), 'CREATE TABLE t (a NUMBER(5,-2))');
  });

  it('tên column trùng nhau: MySQL 1060, Oracle ORA-00957', () => {
    // MySQL thật: ERROR 1060 (42S21): Duplicate column name 'a'
    expect(err(S('mysql'), 'CREATE TABLE t (a INT, a INT)').dbMessage).toBe("ERROR 1060 (42S21): Duplicate column name 'a'");
    expect(err(S('oracle'), 'CREATE TABLE t (a NUMBER, a NUMBER)').dbMessage).toBe('ORA-00957: duplicate column name');
  });

  it('tạo trùng tên table: MySQL 1050, Oracle ORA-00955', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE t (a ${INT[d]})`);
      expect(err(s, `CREATE TABLE T (a ${INT[d]})`).code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
    }
  });

  it('MySQL: CREATE TABLE IF NOT EXISTS bỏ qua khi table đã có', () => {
    // MySQL thật: chạy được, chỉ có warning
    const s = S('mysql');
    good(s, 'CREATE TABLE t (a INT)');
    good(s, 'INSERT INTO t VALUES (1)');
    good(s, 'CREATE TABLE IF NOT EXISTS t (b VARCHAR(5))');
    expect(s.db().tables[0].columns.map((c) => c.name)).toEqual(['a']);
    expect(rows(s, 'SELECT COUNT(*) FROM t')).toEqual([[1]]);
  });

  it('Oracle 19c không có IF NOT EXISTS: ORA-00922', () => {
    // Đã kiểm trên Oracle XE 21c và 18c thật: ORA-00922 missing or invalid option (23c mới thêm IF NOT EXISTS).
    expect(err(S('oracle'), 'CREATE TABLE IF NOT EXISTS t (a NUMBER)').code).toBe('ORA-00922');
  });

  it('MySQL: đọc và bỏ qua ENGINE, CHARSET, COMMENT, KEY, COMMENT của column', () => {
    // MySQL thật: các câu này đều chạy được
    const s = S('mysql');
    good(s, "CREATE TABLE z3 (a INT PRIMARY KEY, a2 INT COMMENT 'x', KEY idx_a2 (a2), INDEX (a2)) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4");
    expect(s.db().tables[0].constraints?.map((c) => c.kind)).toEqual(['pk']);
  });
});

describe('Độ dài của chữ', () => {
  it('MySQL: INSERT chữ dài quá độ dài là 1406', () => {
    // MySQL thật: ERROR 1406 (22001): Data too long for column 'b' at row 1
    const s = S('mysql');
    good(s, 'CREATE TABLE t1 (a INT, b VARCHAR(5), j CHAR(3))');
    expect(err(s, "INSERT INTO t1 (a, b) VALUES (1, 'abcdef')").dbMessage).toBe("ERROR 1406 (22001): Data too long for column 'b' at row 1");
    expect(err(s, "INSERT INTO t1 (a, j) VALUES (7, 'abcd')").code).toBe('1406');
    good(s, "INSERT INTO t1 (a, b) VALUES (1, 'abc')");
  });

  it('MySQL: UPDATE chữ dài quá độ dài là 1406', () => {
    // MySQL thật: update d9 set b = 'abcd' -> ERROR 1406 ... at row 1
    const s = S('mysql');
    good(s, 'CREATE TABLE d9 (a INT, b VARCHAR(3))');
    good(s, "INSERT INTO d9 VALUES (1, 'ab')");
    expect(err(s, "UPDATE d9 SET b = 'abcd'").dbMessage).toBe("ERROR 1406 (22001): Data too long for column 'b' at row 1");
    expect(rows(s, 'SELECT b FROM d9')).toEqual([['ab']]);
  });

  it('MySQL: nhiều row trong một INSERT, báo đúng row lỗi và không lưu row nào', () => {
    // MySQL thật: insert into s values ('abc'), ('abcd') -> 1406 ... at row 2, table vẫn rỗng
    const s = S('mysql');
    good(s, 'CREATE TABLE s (v VARCHAR(3))');
    const e = err(s, "INSERT INTO s VALUES ('abc'), ('abcd')");
    expect(e.dbMessage).toBe("ERROR 1406 (22001): Data too long for column 'v' at row 2");
    expect(rows(s, 'SELECT COUNT(*) FROM s')).toEqual([[0]]);
  });

  it('MySQL: đếm theo ký tự, chữ có dấu không tốn thêm', () => {
    // MySQL thật: 'ábcđé' (5 ký tự) vào VARCHAR(5) chạy được
    const s = S('mysql');
    good(s, 'CREATE TABLE t (b VARCHAR(5))');
    good(s, "INSERT INTO t VALUES ('ábcđé')");
    expect(rows(s, 'SELECT b FROM t')).toEqual([['ábcđé']]);
  });

  it('MySQL: dấu cách thừa ở cuối bị cắt, không báo lỗi', () => {
    // MySQL thật: 'abcde   ' vào VARCHAR(5) lưu thành 'abcde'. 'abcde  x' thì lỗi 1406.
    const s = S('mysql');
    good(s, 'CREATE TABLE t (b VARCHAR(5))');
    good(s, "INSERT INTO t VALUES ('abcde   ')");
    expect(rows(s, 'SELECT b FROM t')).toEqual([['abcde']]);
    expect(err(s, "INSERT INTO t VALUES ('abcde  x')").code).toBe('1406');
  });

  it('Oracle: INSERT chữ dài quá độ dài là ORA-12899, có số actual và maximum', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (a NUMBER, f VARCHAR2(5))');
    const e = err(s, "INSERT INTO t1 (a, f) VALUES (1, 'abcdef')");
    expect(e.dbMessage).toBe('ORA-12899: value too large for column "LAB"."T1"."F" (actual: 6, maximum: 5)');
  });

  it('Oracle: VARCHAR2(n) đếm byte, chữ có dấu tốn 2 byte', () => {
    // 'ábcđé': á, đ, é mỗi chữ 2 byte, b và c mỗi chữ 1 byte: tổng 8 byte (AL32UTF8, NLS_LENGTH_SEMANTICS mặc định BYTE).
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (f VARCHAR2(5))');
    expect(err(s, "INSERT INTO t1 VALUES ('ábcđé')").dbMessage).toContain('(actual: 8, maximum: 5)');
  });

  it('Oracle: VARCHAR2(n CHAR) đếm ký tự', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (g VARCHAR2(5 CHAR))');
    good(s, "INSERT INTO t1 VALUES ('ábcđé')");
    expect(err(s, "INSERT INTO t1 VALUES ('ábcđéx')").dbMessage).toContain('(actual: 6, maximum: 5)');
  });

  it('Oracle: UPDATE chữ dài quá độ dài cũng là ORA-12899', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (f VARCHAR2(3))');
    good(s, "INSERT INTO t1 VALUES ('ab')");
    expect(err(s, "UPDATE t1 SET f = 'abcd'").code).toBe('ORA-12899');
  });

  it('Oracle: CHAR(3) và VARCHAR(3) cũng bị giới hạn độ dài', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (i CHAR(3), h VARCHAR(3))');
    expect(err(s, "INSERT INTO t1 (i) VALUES ('abcd')").code).toBe('ORA-12899');
    expect(err(s, "INSERT INTO t1 (h) VALUES ('abcd')").code).toBe('ORA-12899');
  });

  it('lời giải thích tiếng Việt của lỗi độ dài nói rõ số byte ở Oracle', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (f VARCHAR2(5))');
    const e = err(s, "INSERT INTO t1 VALUES ('ábcđé')");
    expect(e.friendly).toContain('byte');
    expect(e.friendly).toContain('VARCHAR2(n CHAR)');
  });
});

describe('Độ chính xác của số', () => {
  it('MySQL: DECIMAL(5,2) làm tròn tới 2 chữ số, nửa thì tròn ra xa số 0', () => {
    // MySQL thật: 1.005 -> 1.01, -1.005 -> -1.01, 999.994 -> 999.99
    const s = S('mysql');
    good(s, 'CREATE TABLE d1 (x DECIMAL(5,2))');
    good(s, 'INSERT INTO d1 VALUES (1.005), (-1.005), (999.994)');
    expect(rows(s, 'SELECT x FROM d1')).toEqual([[1.01], [-1.01], [999.99]]);
  });

  it('MySQL: DECIMAL(5,2) nhận tối đa 999.99, vượt là 1264', () => {
    // MySQL thật: 999.995 -> ERROR 1264 (22003): Out of range value for column 'x' at row 1
    const s = S('mysql');
    good(s, 'CREATE TABLE d1 (x DECIMAL(5,2))');
    expect(err(s, 'INSERT INTO d1 VALUES (999.995)').dbMessage).toBe("ERROR 1264 (22003): Out of range value for column 'x' at row 1");
    expect(err(s, 'INSERT INTO d1 VALUES (1000)').code).toBe('1264');
  });

  it('MySQL: NUMERIC(3) làm tròn về số nguyên, 1000 vượt là 1264', () => {
    // MySQL thật: 2.5 -> 3, -2.5 -> -3, 1000 -> 1264
    const s = S('mysql');
    good(s, 'CREATE TABLE d1 (y NUMERIC(3))');
    good(s, 'INSERT INTO d1 VALUES (2.5), (-2.5)');
    expect(rows(s, 'SELECT y FROM d1')).toEqual([[3], [-3]]);
    expect(err(s, 'INSERT INTO d1 VALUES (1000)').code).toBe('1264');
  });

  it('MySQL: DECIMAL không có (p,s) là DECIMAL(10,0)', () => {
    // MySQL thật: show create table cho decimal(10,0); 10000000000 -> 1264
    const s = S('mysql');
    good(s, 'CREATE TABLE d1 (z DECIMAL)');
    good(s, 'INSERT INTO d1 VALUES (3.5), (9999999999)');
    expect(rows(s, 'SELECT z FROM d1')).toEqual([[4], [9999999999]]);
    expect(err(s, 'INSERT INTO d1 VALUES (10000000000)').code).toBe('1264');
  });

  it('MySQL: TINYINT, SMALLINT, INT có khoảng giá trị riêng', () => {
    // MySQL thật: 2147483648 vào INT, 32768 vào SMALLINT, -129 vào TINYINT đều là 1264
    const s = S('mysql');
    good(s, 'CREATE TABLE i1 (a INT, b SMALLINT, c TINYINT)');
    expect(err(s, 'INSERT INTO i1 VALUES (2147483648, 1, 1)').code).toBe('1264');
    expect(err(s, 'INSERT INTO i1 VALUES (1, 32768, 1)').code).toBe('1264');
    expect(err(s, 'INSERT INTO i1 VALUES (1, 1, -129)').code).toBe('1264');
    good(s, 'INSERT INTO i1 VALUES (2147483647, -32768, 127)');
  });

  it('MySQL: UPDATE vượt khoảng của INT cũng là 1264', () => {
    // MySQL thật: update i1 set a = 99999999999 -> ERROR 1264
    const s = S('mysql');
    good(s, 'CREATE TABLE i1 (a INT)');
    good(s, 'INSERT INTO i1 VALUES (1)');
    expect(err(s, 'UPDATE i1 SET a = 99999999999').code).toBe('1264');
  });

  it('MySQL: INT làm tròn số lẻ, nhận chuỗi số', () => {
    // MySQL thật: (1.5, 2.5, 3.5, 4.5) -> (2, 3, 4, 5); '1.5' -> 2
    const s = S('mysql');
    good(s, 'CREATE TABLE i1 (a INT, b INT)');
    good(s, "INSERT INTO i1 VALUES (1.5, 2.5), ('1.5', 3.5)");
    expect(rows(s, 'SELECT a, b FROM i1')).toEqual([[2, 3], [2, 4]]);
  });

  it('MySQL: chữ không phải số vào BIGINT là 1366', () => {
    // MySQL thật: ERROR 1366 (HY000): Incorrect integer value: 'x' for column 'g' at row 1
    const s = S('mysql');
    good(s, 'CREATE TABLE t (g BIGINT)');
    expect(err(s, "INSERT INTO t VALUES ('x')").dbMessage).toBe("ERROR 1366 (HY000): Incorrect integer value: 'x' for column 'g' at row 1");
  });

  it('Oracle: NUMBER(5) nhận tối đa 99999, vượt là ORA-01438', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (b NUMBER(5), c NUMBER(5,2))');
    expect(err(s, 'INSERT INTO t1 (b) VALUES (123456)').dbMessage).toBe('ORA-01438: value larger than specified precision allowed for this column');
    good(s, 'INSERT INTO t1 (b) VALUES (99999)');
  });

  it('Oracle: NUMBER(5,2) nhận tối đa 999.99, làm tròn 99.995 thành 100', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (c NUMBER(5,2))');
    expect(err(s, 'INSERT INTO t1 VALUES (1000)').code).toBe('ORA-01438');
    expect(err(s, 'INSERT INTO t1 VALUES (999.999)').code).toBe('ORA-01438');
    good(s, 'INSERT INTO t1 VALUES (99.995)');
    expect(rows(s, 'SELECT c FROM t1')).toEqual([[100]]);
  });

  it('Oracle: NUMBER(3) làm tròn về số nguyên', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (c NUMBER(3))');
    good(s, 'INSERT INTO t1 VALUES (2.5)');
    expect(rows(s, 'SELECT c FROM t1')).toEqual([[3]]);
  });
});

describe('DEFAULT', () => {
  for (const d of BOTH) {
    describe(d, () => {
      const T = d === 'mysql' ? 'CREATE TABLE t (a INT DEFAULT 5, b VARCHAR(5) DEFAULT \'hi\', c DATE DEFAULT \'2026-03-09\', d INT)' : "CREATE TABLE t (a NUMBER DEFAULT 5, b VARCHAR2(5) DEFAULT 'hi', c DATE DEFAULT DATE '2026-03-09', d NUMBER)";

      it('INSERT bỏ qua column thì tự điền DEFAULT', () => {
        const s = S(d);
        good(s, T);
        good(s, 'INSERT INTO t (d) VALUES (1)');
        expect(rows(s, 'SELECT a, b, c, d FROM t')).toEqual([[5, 'hi', '2026-03-09', 1]]);
      });

      it('từ khóa DEFAULT trong VALUES lấy giá trị mặc định', () => {
        const s = S(d);
        good(s, T);
        good(s, 'INSERT INTO t VALUES (DEFAULT, DEFAULT, DEFAULT, 4)');
        expect(rows(s, 'SELECT a, b, d FROM t')).toEqual([[5, 'hi', 4]]);
      });

      it('NULL viết rõ thì vào đúng NULL, không lấy DEFAULT', () => {
        const s = S(d);
        good(s, T);
        good(s, 'INSERT INTO t (a, d) VALUES (NULL, 1)');
        expect(rows(s, 'SELECT a FROM t')).toEqual([[null]]);
      });

      it('UPDATE ... SET column = DEFAULT trả về giá trị mặc định', () => {
        // MySQL thật: update dflt set a = default, b = 'zz' -> a về 5
        const s = S(d);
        good(s, T);
        good(s, 'INSERT INTO t (a, d) VALUES (99, 1)');
        good(s, "UPDATE t SET a = DEFAULT, b = 'zz'");
        expect(rows(s, 'SELECT a, b FROM t')).toEqual([[5, 'zz']]);
      });

      it('column NOT NULL có DEFAULT: bỏ qua thì dùng DEFAULT, đưa NULL thì lỗi', () => {
        const s = S(d);
        good(s, `CREATE TABLE n (a ${INT[d]}, b ${TEXT[d]}(10) DEFAULT 'x' NOT NULL)`);
        good(s, 'INSERT INTO n (a) VALUES (1)');
        expect(rows(s, 'SELECT b FROM n')).toEqual([['x']]);
        expect(err(s, 'INSERT INTO n (a, b) VALUES (2, NULL)').code).toBe(d === 'mysql' ? '1048' : 'ORA-01400');
      });
    });
  }

  it('MySQL: column NOT NULL không có DEFAULT mà INSERT bỏ qua là 1364', () => {
    // MySQL thật: ERROR 1364 (HY000): Field 'a' doesn't have a default value
    const s = S('mysql');
    good(s, "CREATE TABLE t1 (a INT NOT NULL, b VARCHAR(10) NOT NULL DEFAULT 'x')");
    const e = err(s, "INSERT INTO t1 (b) VALUES ('q')");
    expect(e.dbMessage).toBe("ERROR 1364 (HY000): Field 'a' doesn't have a default value");
  });

  it('MySQL: từ khóa DEFAULT đứng cho column NOT NULL không có DEFAULT cũng là 1364', () => {
    // MySQL thật: insert into h values (1, default) -> ERROR 1364 Field 'b' doesn't have a default value
    const s = S('mysql');
    good(s, 'CREATE TABLE h (a INT, b VARCHAR(3) NOT NULL)');
    expect(err(s, 'INSERT INTO h VALUES (1, DEFAULT)').code).toBe('1364');
  });

  it('MySQL: INSERT bỏ qua column primary key của table mới tạo là 1364', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY, name VARCHAR(10))');
    expect(err(s, "INSERT INTO p (name) VALUES ('x')").code).toBe('1364');
  });

  it('Oracle: column NOT NULL không có DEFAULT mà INSERT bỏ qua là ORA-01400', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE t1 (a NUMBER NOT NULL, b NUMBER)');
    const e = err(s, 'INSERT INTO t1 (b) VALUES (1)');
    expect(e.dbMessage).toBe('ORA-01400: cannot insert NULL into ("LAB"."T1"."A")');
  });

  it('MySQL: DEFAULT sai data type là 1067', () => {
    // MySQL thật: create table d1 (a int default 'abc') -> ERROR 1067 (42000): Invalid default value for 'a'
    expect(err(S('mysql'), "CREATE TABLE d1 (a INT DEFAULT 'abc')").dbMessage).toBe("ERROR 1067 (42000): Invalid default value for 'a'");
    // cũng 1067: NOT NULL DEFAULT NULL, DEFAULT dài quá độ dài, ngày không có thật
    expect(err(S('mysql'), 'CREATE TABLE d2 (a INT NOT NULL DEFAULT NULL)').code).toBe('1067');
    expect(err(S('mysql'), "CREATE TABLE d3 (a VARCHAR(3) DEFAULT 'toolong')").code).toBe('1067');
    expect(err(S('mysql'), "CREATE TABLE d4 (a DATE DEFAULT '2026-13-45')").code).toBe('1067');
  });

  it('MySQL: DEFAULT nhận số âm, CURRENT_TIMESTAMP và biểu thức trong ngoặc', () => {
    // MySQL thật: create table d5 (a datetime default current_timestamp, b int default (1+2), c int default -5, ...) chạy được
    const s = S('mysql');
    good(s, "CREATE TABLE d5 (a DATETIME DEFAULT CURRENT_TIMESTAMP, b INT DEFAULT (1+2), c INT DEFAULT -5, d VARCHAR(5) DEFAULT 'x', e DECIMAL(4,1) DEFAULT 2)");
    good(s, "INSERT INTO d5 (d) VALUES ('q')");
    expect(rows(s, 'SELECT a, b, c, d, e FROM d5')).toEqual([['2026-03-09 10:30:00', 3, -5, 'q', 2]]);
  });

  it('MySQL: DEFAULT 1+2 không có ngoặc là lỗi cú pháp', () => {
    // MySQL thật: DEFAULT chỉ nhận một giá trị hoặc biểu thức trong ngoặc
    expect(err(S('mysql'), 'CREATE TABLE d (b INT DEFAULT 1+2)').code).toBe('1064');
  });

  it('Oracle: DEFAULT nhận biểu thức và SYSDATE', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE d (a NUMBER DEFAULT 1+2, b DATE DEFAULT SYSDATE)');
    good(s, 'INSERT INTO d (a) VALUES (NULL)');
    good(s, 'INSERT INTO d (b) VALUES (DEFAULT)');
    expect(rows(s, 'SELECT a FROM d')).toEqual([[null], [3]]);
  });

  it('Oracle: NOT NULL đứng trước DEFAULT là lỗi', () => {
    // Đã kiểm trên Oracle XE 21c thật: cú pháp column của Oracle đặt DEFAULT trước inline constraint, nên NOT NULL DEFAULT 5 báo ORA-00907.
    expect(err(S('oracle'), 'CREATE TABLE x11 (a NUMBER NOT NULL DEFAULT 5)').code).toBe('ORA-00907');
  });

  it('Oracle: DEFAULT sai data type là ORA-01722', () => {
    expect(err(S('oracle'), "CREATE TABLE x15 (a NUMBER DEFAULT 'abc')").code).toBe('ORA-01722');
  });
});

describe('Constraint có tên', () => {
  it('MySQL: CONSTRAINT đặt tên cho UNIQUE và tên đó hiện trong lỗi 1062', () => {
    // MySQL thật: Duplicate entry 'a' for key 'p.uq_p'
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT, name VARCHAR(10), CONSTRAINT pk_p PRIMARY KEY (id), CONSTRAINT uq_p UNIQUE (name))');
    good(s, "INSERT INTO p VALUES (1, 'a')");
    expect(err(s, "INSERT INTO p VALUES (2, 'a')").dbMessage).toBe("ERROR 1062 (23000): Duplicate entry 'a' for key 'p.uq_p'");
  });

  it('MySQL: primary key luôn tên PRIMARY dù đặt tên khác', () => {
    // MySQL thật: Duplicate entry '1' for key 'p.PRIMARY' (dù viết constraint pk_p)
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT, CONSTRAINT pk_p PRIMARY KEY (id))');
    good(s, 'INSERT INTO p VALUES (1)');
    expect(err(s, 'INSERT INTO p VALUES (1)').dbMessage).toBe("ERROR 1062 (23000): Duplicate entry '1' for key 'p.PRIMARY'");
  });

  it('Oracle: tên constraint hiện trong ORA-00001 (mức column và mức table)', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE x16 (id NUMBER CONSTRAINT pk_x16 PRIMARY KEY, n VARCHAR2(10) CONSTRAINT nn_x NOT NULL CONSTRAINT uq_x UNIQUE, p NUMBER CONSTRAINT ck_p CHECK (p > 0))');
    good(s, "INSERT INTO x16 VALUES (1, 'a', 1)");
    expect(err(s, "INSERT INTO x16 VALUES (1, 'b', 1)").dbMessage).toBe('ORA-00001: unique constraint (LAB.PK_X16) violated');
    expect(err(s, "INSERT INTO x16 VALUES (2, 'a', 1)").dbMessage).toBe('ORA-00001: unique constraint (LAB.UQ_X) violated');
    expect(err(s, "INSERT INTO x16 VALUES (3, 'c', 0)").dbMessage).toBe('ORA-02290: check constraint (LAB.CK_P) violated');
    good(s, 'CREATE TABLE y (a NUMBER, CONSTRAINT y_pk PRIMARY KEY (a))');
    good(s, 'INSERT INTO y VALUES (1)');
    expect(err(s, 'INSERT INTO y VALUES (1)').dbMessage).toBe('ORA-00001: unique constraint (LAB.Y_PK) violated');
  });

  it('MySQL: CHECK có tên hiện trong lỗi 3819', () => {
    // MySQL thật: ERROR 3819 (HY000): Check constraint 'ck_b' is violated.
    const s = S('mysql');
    good(s, 'CREATE TABLE ck (a INT CHECK (a > 0), b INT, CONSTRAINT ck_b CHECK (b < 10), CHECK (a < b))');
    expect(err(s, 'INSERT INTO ck VALUES (1, 20)').dbMessage).toBe("ERROR 3819 (HY000): Check constraint 'ck_b' is violated.");
  });

  it('MySQL: CHECK không tên đặt tên t_chk_1, t_chk_2 theo thứ tự viết, tên riêng không chiếm số', () => {
    // MySQL thật: (0,1) -> 'ck_chk_1', (5,3) -> 'ck_chk_2'
    const s = S('mysql');
    good(s, 'CREATE TABLE ck (a INT CHECK (a > 0), b INT, CONSTRAINT ck_b CHECK (b < 10), CHECK (a < b))');
    expect(err(s, 'INSERT INTO ck VALUES (0, 1)').dbMessage).toContain("'ck_chk_1'");
    expect(err(s, 'INSERT INTO ck VALUES (5, 3)').dbMessage).toContain("'ck_chk_2'");
    good(s, 'INSERT INTO ck VALUES (1, 2)');
  });

  it('MySQL: UNIQUE không tên lấy tên column, key thứ hai trùng tên thêm _2', () => {
    // MySQL thật: Duplicate entry '1' for key 'p2.b'
    const s = S('mysql');
    good(s, 'CREATE TABLE p2 (a INT, b INT, PRIMARY KEY (a, b), UNIQUE KEY u_ab (a, b), UNIQUE (b), UNIQUE (b))');
    expect(s.db().tables[0].constraints?.map((c) => c.name)).toEqual(['PRIMARY', 'u_ab', 'b', 'b_2']);
    good(s, 'INSERT INTO p2 VALUES (1, 1)');
    expect(err(s, 'INSERT INTO p2 VALUES (2, 1)').dbMessage).toBe("ERROR 1062 (23000): Duplicate entry '1' for key 'p2.b'");
  });

  it('Oracle: constraint không tên được đặt tên SYS_C00nnnnnn', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE x17 (a NUMBER PRIMARY KEY, b NUMBER UNIQUE, c NUMBER CHECK (c > 0))');
    good(s, 'INSERT INTO x17 VALUES (1, 1, 1)');
    expect(err(s, 'INSERT INTO x17 VALUES (1, 2, 1)').dbMessage).toMatch(/^ORA-00001: unique constraint \(LAB\.SYS_C00\d+\) violated$/);
    expect(err(s, 'INSERT INTO x17 VALUES (3, 3, -1)').dbMessage).toMatch(/^ORA-02290: check constraint \(LAB\.SYS_C00\d+\) violated$/);
  });

  it('Oracle: bộ đếm SYS_C nằm trong Database, mỗi constraint một số khác nhau', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE a (x NUMBER PRIMARY KEY, y NUMBER UNIQUE)');
    const names = s.db().tables[0].constraints!.map((c) => c.name);
    expect(new Set(names).size).toBe(2);
    expect(typeof s.db().sysName).toBe('number');
  });

  it('PRIMARY KEY ghép: trùng cả cặp mới lỗi', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE k (a ${INT[d]}, b ${INT[d]}, PRIMARY KEY (a, b))`);
      good(s, 'INSERT INTO k VALUES (1, 1)');
      good(s, 'INSERT INTO k VALUES (1, 2)');
      const e = err(s, 'INSERT INTO k VALUES (1, 1)');
      expect(e.code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      if (d === 'mysql') expect(e.dbMessage).toBe("ERROR 1062 (23000): Duplicate entry '1-1' for key 'k.PRIMARY'");
    }
  });

  it('PRIMARY KEY ghép: column nào NULL cũng lỗi', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE k (a ${INT[d]}, b ${INT[d]}, PRIMARY KEY (a, b))`);
      expect(err(s, 'INSERT INTO k (a) VALUES (1)').code).toBe(d === 'mysql' ? '1364' : 'ORA-01400');
      expect(err(s, 'INSERT INTO k VALUES (1, NULL)').code).toBe(d === 'mysql' ? '1048' : 'ORA-01400');
    }
  });

  it('UNIQUE ghép: row có NULL không bị coi là trùng', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, `CREATE TABLE u (a ${INT[d]}, b ${INT[d]}, UNIQUE (a, b))`);
      good(s, 'INSERT INTO u VALUES (1, NULL)');
      good(s, 'INSERT INTO u VALUES (1, NULL)');
      good(s, 'INSERT INTO u VALUES (1, 2)');
      expect(err(s, 'INSERT INTO u VALUES (1, 2)').code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
    }
  });

  it('tên constraint trùng: MySQL 1826 (foreign key), 3822 (CHECK), Oracle ORA-02264', () => {
    // MySQL thật: Duplicate foreign key constraint name 'fk2'; Duplicate check constraint name 'ckx'. (tên CHECK trùng cả giữa hai table)
    const m = S('mysql');
    all(m, ['CREATE TABLE p (id INT PRIMARY KEY)', 'CREATE TABLE c2 (id INT, CONSTRAINT fk2 FOREIGN KEY (id) REFERENCES p(id))', 'CREATE TABLE dupck1 (a INT, CONSTRAINT ckx CHECK (a > 0))']);
    expect(err(m, 'CREATE TABLE dupfk (id INT, CONSTRAINT fk2 FOREIGN KEY (id) REFERENCES p(id))').dbMessage).toBe("ERROR 1826 (HY000): Duplicate foreign key constraint name 'fk2'");
    expect(err(m, 'CREATE TABLE dupck2 (a INT, CONSTRAINT ckx CHECK (a > 0))').dbMessage).toBe("ERROR 3822 (HY000): Duplicate check constraint name 'ckx'.");
    const o = S('oracle');
    good(o, 'CREATE TABLE emp (id NUMBER, CONSTRAINT emp_pk PRIMARY KEY (id))');
    expect(err(o, 'CREATE TABLE bad8 (a NUMBER, CONSTRAINT emp_pk PRIMARY KEY (a))').dbMessage).toBe('ORA-02264: name already used by an existing constraint');
  });

  it('MySQL: tên UNIQUE chỉ cần khác nhau trong cùng table', () => {
    // MySQL thật: hai table cùng có constraint ux unique chạy được
    const m = S('mysql');
    good(m, 'CREATE TABLE dupu1 (a INT, CONSTRAINT ux UNIQUE (a))');
    good(m, 'CREATE TABLE dupu2 (a INT, CONSTRAINT ux UNIQUE (a))');
    // MySQL thật: Duplicate key name 'a' không xảy ra vì tên tự đổi; đặt trùng thủ công thì 1061
    expect(err(m, 'CREATE TABLE dupu3 (a INT, b INT, CONSTRAINT ux UNIQUE (a), CONSTRAINT ux UNIQUE (b))').code).toBe('1061');
  });

  it('hai primary key trong một table: MySQL 1068, Oracle ORA-02260', () => {
    // MySQL thật: ERROR 1068 (42000): Multiple primary key defined
    expect(err(S('mysql'), 'CREATE TABLE bad2 (a INT PRIMARY KEY, b INT PRIMARY KEY)').dbMessage).toBe('ERROR 1068 (42000): Multiple primary key defined');
    expect(err(S('mysql'), 'CREATE TABLE d8 (a INT, b INT, PRIMARY KEY (a), PRIMARY KEY (b))').code).toBe('1068');
    expect(err(S('oracle'), 'CREATE TABLE bad2 (a NUMBER PRIMARY KEY, b NUMBER PRIMARY KEY)').dbMessage).toBe('ORA-02260: table can have only one primary key');
  });

  it('constraint nhắc tới column không có: MySQL 1072, Oracle ORA-00904', () => {
    // MySQL thật: ERROR 1072 (42000): Key column 'zz' doesn't exist in table
    expect(err(S('mysql'), 'CREATE TABLE bad (a INT, PRIMARY KEY (zz))').dbMessage).toBe("ERROR 1072 (42000): Key column 'zz' doesn't exist in table");
    expect(err(S('oracle'), 'CREATE TABLE bad1 (a NUMBER, PRIMARY KEY (zz))').dbMessage).toBe('ORA-00904: "ZZ": invalid identifier');
  });

  it('CHECK nhắc tới column không có: MySQL 3820 và 3813, Oracle ORA-00904', () => {
    // MySQL thật: CHECK cấp table -> 3820 refers to non-existing column 'b'; CHECK cấp column nhắc column khác -> 3813
    expect(err(S('mysql'), 'CREATE TABLE cc (a INT, CHECK (a > b))').dbMessage).toBe("ERROR 3820 (HY000): Check constraint 'cc_chk_1' refers to non-existing column 'b'.");
    expect(err(S('mysql'), 'CREATE TABLE cc2 (a INT CHECK (zz > 0))').dbMessage).toBe("ERROR 3813 (HY000): Column check constraint 'cc2_chk_1' references other column.");
    expect(err(S('oracle'), 'CREATE TABLE bad9 (a NUMBER CHECK (zz > 0))').dbMessage).toBe('ORA-00904: "ZZ": invalid identifier');
  });

  it('MySQL: NOT NULL ghi đúng vào column, primary key kéo theo NOT NULL', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE n (a INT PRIMARY KEY, b INT NOT NULL, c INT)');
    expect(s.db().tables[0].columns.map((c) => !!c.notNull)).toEqual([true, true, false]);
  });
});

describe('FOREIGN KEY khi tạo table', () => {
  const PARENT: Record<Dialect, string> = { mysql: 'CREATE TABLE p (id INT PRIMARY KEY, name VARCHAR(10), code INT, UNIQUE (code))', oracle: 'CREATE TABLE p (id NUMBER PRIMARY KEY, name VARCHAR2(10), code NUMBER, UNIQUE (code))' };

  for (const d of BOTH) {
    it(`${d}: foreign key mức table đặt tên, hiện trong lỗi khi row con trỏ vào chỗ trống`, () => {
      const s = S(d);
      good(s, PARENT[d]);
      good(s, `CREATE TABLE c1 (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_c1 FOREIGN KEY (pid) REFERENCES p(id))`);
      good(s, "INSERT INTO p (id, name) VALUES (3, 'z')");
      good(s, 'INSERT INTO c1 VALUES (1, 3)');
      const e = err(s, 'INSERT INTO c1 VALUES (2, 99)');
      if (d === 'mysql') {
        // MySQL thật: ... (`lab`.`c1`, CONSTRAINT `fk_c1` FOREIGN KEY (`pid`) REFERENCES `p` (`id`))
        expect(e.dbMessage).toBe('ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails (`lab`.`c1`, CONSTRAINT `fk_c1` FOREIGN KEY (`pid`) REFERENCES `p` (`id`))');
      } else expect(e.dbMessage).toBe('ORA-02291: integrity constraint (LAB.FK_C1) violated - parent key not found');
    });

    it(`${d}: xóa row cha đang có row con là bị chặn`, () => {
      const s = S(d);
      good(s, PARENT[d]);
      good(s, `CREATE TABLE c1 (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_c1 FOREIGN KEY (pid) REFERENCES p(id))`);
      good(s, "INSERT INTO p (id, name) VALUES (3, 'z')");
      good(s, 'INSERT INTO c1 VALUES (1, 3)');
      const e = err(s, 'DELETE FROM p WHERE id = 3');
      expect(e.code).toBe(d === 'mysql' ? '1451' : 'ORA-02292');
      expect(e.dbMessage).toContain(d === 'mysql' ? 'CONSTRAINT `fk_c1`' : 'LAB.FK_C1');
    });

    it(`${d}: UPDATE đổi mã của row cha đang có row con là bị chặn`, () => {
      const s = S(d);
      good(s, PARENT[d]);
      good(s, `CREATE TABLE c1 (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_c1 FOREIGN KEY (pid) REFERENCES p(id))`);
      good(s, "INSERT INTO p (id, name) VALUES (3, 'z')");
      good(s, 'INSERT INTO c1 VALUES (1, 3)');
      expect(err(s, 'UPDATE p SET id = 10 WHERE id = 3').code).toBe(d === 'mysql' ? '1451' : 'ORA-02292');
      good(s, "UPDATE p SET name = 'y' WHERE id = 3");
    });

    it(`${d}: foreign key trỏ về chính table đang tạo (manager_id)`, () => {
      const s = S(d);
      good(s, `CREATE TABLE employees (employee_id ${INT[d]} PRIMARY KEY, manager_id ${INT[d]}, FOREIGN KEY (manager_id) REFERENCES employees(employee_id))`);
      good(s, 'INSERT INTO employees VALUES (1, NULL)');
      good(s, 'INSERT INTO employees VALUES (2, 1)');
      expect(err(s, 'INSERT INTO employees VALUES (3, 9)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
      expect(err(s, 'DELETE FROM employees WHERE employee_id = 1').code).toBe(d === 'mysql' ? '1451' : 'ORA-02292');
      good(s, 'DELETE FROM employees WHERE employee_id = 2');
      good(s, 'DELETE FROM employees WHERE employee_id = 1');
    });

    it(`${d}: row tự trỏ vào chính nó (1, 1) được nhận`, () => {
      // MySQL thật: insert into self values (1, 1) chạy được
      const s = S(d);
      good(s, `CREATE TABLE self (id ${INT[d]} PRIMARY KEY, mgr ${INT[d]}, FOREIGN KEY (mgr) REFERENCES self(id))`);
      good(s, 'INSERT INTO self VALUES (1, 1)');
      good(s, 'INSERT INTO self VALUES (2, 1)');
    });

    it(`${d}: foreign key viết trước primary key trong cùng câu vẫn hiểu đúng`, () => {
      const s = S(d);
      good(s, `CREATE TABLE e (mgr ${INT[d]}, id ${INT[d]}, FOREIGN KEY (mgr) REFERENCES e(id), PRIMARY KEY (id))`);
      good(s, 'INSERT INTO e VALUES (NULL, 1)');
    });

    it(`${d}: foreign key ghép (a, b) trỏ tới UNIQUE (a, b)`, () => {
      const s = S(d);
      good(s, `CREATE TABLE p2 (a ${INT[d]}, b ${INT[d]}, PRIMARY KEY (a, b))`);
      good(s, `CREATE TABLE c2 (x ${INT[d]}, y ${INT[d]}, CONSTRAINT fk2 FOREIGN KEY (x, y) REFERENCES p2(a, b))`);
      good(s, 'INSERT INTO p2 VALUES (1, 2)');
      good(s, 'INSERT INTO c2 VALUES (1, 2)');
      good(s, 'INSERT INTO c2 VALUES (1, NULL)');
      expect(err(s, 'INSERT INTO c2 VALUES (1, 3)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
    });
  }

  it('MySQL: lỗi 1452 của foreign key ghép liệt kê đủ các column', () => {
    // MySQL thật: FOREIGN KEY (`a`, `b`) REFERENCES `p` (`id`, `id2`) ON DELETE CASCADE
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY, id2 INT, UNIQUE (id, id2))');
    good(s, 'CREATE TABLE c (a INT, b INT, CONSTRAINT fkc FOREIGN KEY (a, b) REFERENCES p(id, id2) ON DELETE CASCADE)');
    expect(err(s, 'INSERT INTO c VALUES (1, 2)').dbMessage).toBe('ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails (`lab`.`c`, CONSTRAINT `fkc` FOREIGN KEY (`a`, `b`) REFERENCES `p` (`id`, `id2`) ON DELETE CASCADE)');
  });

  it('MySQL: foreign key không tên được đặt t_ibfk_1', () => {
    // MySQL thật: CONSTRAINT `self_ibfk_1` FOREIGN KEY (`mgr`) REFERENCES `self` (`id`)
    const s = S('mysql');
    good(s, 'CREATE TABLE self (id INT PRIMARY KEY, mgr INT, FOREIGN KEY (mgr) REFERENCES self(id))');
    expect(err(s, 'INSERT INTO self VALUES (3, 9)').dbMessage).toContain('CONSTRAINT `self_ibfk_1` FOREIGN KEY (`mgr`) REFERENCES `self` (`id`)');
  });

  it('MySQL: foreign key trỏ tới column có UNIQUE (không phải primary key)', () => {
    // MySQL thật: create table ch2 (x int, foreign key (x) references p(c)) chạy được khi p có unique (c)
    const s = S('mysql');
    good(s, PARENT.mysql);
    good(s, 'CREATE TABLE ch2 (x INT, FOREIGN KEY (x) REFERENCES p(code))');
  });

  it('MySQL: parent không có table đó: 1824', () => {
    // MySQL thật: ERROR 1824 (HY000): Failed to open the referenced table 'nope'
    const s = S('mysql');
    expect(err(s, 'CREATE TABLE bad3 (a INT, FOREIGN KEY (a) REFERENCES nope(id))').dbMessage).toBe("ERROR 1824 (HY000): Failed to open the referenced table 'nope'");
  });

  it('MySQL: parent không có column đó: 3734', () => {
    // MySQL thật: Failed to add the foreign key constraint. Missing column 'nope' for constraint 'bad4_ibfk_1' in the referenced table 'p'
    const s = S('mysql');
    good(s, PARENT.mysql);
    expect(err(s, 'CREATE TABLE bad4 (a INT, FOREIGN KEY (a) REFERENCES p(nope))').dbMessage).toBe("ERROR 3734 (HY000): Failed to add the foreign key constraint. Missing column 'nope' for constraint 'bad4_ibfk_1' in the referenced table 'p'");
  });

  it('MySQL: parent column không phải primary key hay UNIQUE: 1822', () => {
    // MySQL thật: Failed to add the foreign key constraint. Missing index for constraint 'ch1_ibfk_1' in the referenced table 'p'
    const s = S('mysql');
    good(s, 'CREATE TABLE p (a INT PRIMARY KEY, b INT, c INT)');
    expect(err(s, 'CREATE TABLE ch1 (x INT, FOREIGN KEY (x) REFERENCES p(b))').dbMessage).toBe("ERROR 1822 (HY000): Failed to add the foreign key constraint. Missing index for constraint 'ch1_ibfk_1' in the referenced table 'p'");
  });

  it('MySQL: hai column khác data type: 3780', () => {
    // MySQL thật: Referencing column 'a' and referenced column 'id' in foreign key constraint 'bad5_ibfk_1' are incompatible.
    const s = S('mysql');
    good(s, PARENT.mysql);
    expect(err(s, 'CREATE TABLE bad5 (a VARCHAR(5), FOREIGN KEY (a) REFERENCES p(id))').dbMessage).toBe("ERROR 3780 (HY000): Referencing column 'a' and referenced column 'id' in foreign key constraint 'bad5_ibfk_1' are incompatible.");
  });

  it('MySQL: INT và BIGINT cũng không nối với nhau được', () => {
    // MySQL thật: alter table f9 modify id bigint -> ERROR 3780 (hai kiểu số nguyên phải giống hệt)
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY)');
    expect(err(s, 'CREATE TABLE c (x BIGINT, FOREIGN KEY (x) REFERENCES p(id))').code).toBe('3780');
  });

  it('MySQL: số column hai bên khác nhau: 1239', () => {
    // MySQL thật: Incorrect foreign key definition for 'foreign key without name': Key reference and table reference don't match
    const s = S('mysql');
    good(s, PARENT.mysql);
    expect(err(s, 'CREATE TABLE ch3 (x INT, y INT, FOREIGN KEY (x, y) REFERENCES p(id))').dbMessage).toBe("ERROR 1239 (42000): Incorrect foreign key definition for 'foreign key without name': Key reference and table reference don't match");
  });

  it('Oracle: parent không có table đó: ORA-00942', () => {
    expect(err(S('oracle'), 'CREATE TABLE bad3 (a NUMBER, FOREIGN KEY (a) REFERENCES nope(id))').code).toBe('ORA-00942');
  });

  it('Oracle: parent không có column đó: ORA-00904', () => {
    const s = S('oracle');
    good(s, PARENT.oracle);
    expect(err(s, 'CREATE TABLE bad4 (a NUMBER, FOREIGN KEY (a) REFERENCES p(nope))').dbMessage).toBe('ORA-00904: "NOPE": invalid identifier');
  });

  it('Oracle: parent column không phải primary key hay UNIQUE: ORA-02270', () => {
    const s = S('oracle');
    good(s, PARENT.oracle);
    expect(err(s, 'CREATE TABLE bad6 (a VARCHAR2(5), FOREIGN KEY (a) REFERENCES p(name))').dbMessage).toBe('ORA-02270: no matching unique or primary key for this column-list');
  });

  it('Oracle: hai column khác data type: ORA-02267', () => {
    const s = S('oracle');
    good(s, PARENT.oracle);
    expect(err(s, 'CREATE TABLE bad5 (a VARCHAR2(5), FOREIGN KEY (a) REFERENCES p(id))').dbMessage).toBe('ORA-02267: column type incompatible with referenced column type');
  });

  it('Oracle: số column hai bên khác nhau: ORA-02256', () => {
    const s = S('oracle');
    good(s, PARENT.oracle);
    expect(err(s, 'CREATE TABLE bad7 (a NUMBER, b NUMBER, FOREIGN KEY (a, b) REFERENCES p(id))').dbMessage).toBe('ORA-02256: number of referencing columns must match referenced columns');
  });

  it('Oracle: REFERENCES p không ghi column thì trỏ tới primary key của p', () => {
    const s = S('oracle');
    good(s, PARENT.oracle);
    good(s, 'CREATE TABLE c3 (id NUMBER PRIMARY KEY, pid NUMBER REFERENCES p)');
    good(s, "INSERT INTO p (id, name) VALUES (1, 'a')");
    good(s, 'INSERT INTO c3 VALUES (1, 1)');
    expect(err(s, 'INSERT INTO c3 VALUES (2, 5)').code).toBe('ORA-02291');
  });

  it('REFERENCES ở mức column cũng được kiểm', () => {
    for (const d of BOTH) {
      const s = S(d);
      good(s, PARENT[d]);
      good(s, `CREATE TABLE c4 (id ${INT[d]} PRIMARY KEY, pid ${INT[d]} REFERENCES p(id))`);
      expect(err(s, 'INSERT INTO c4 VALUES (1, 77)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
    }
  });
});

describe('ON DELETE', () => {
  for (const d of BOTH) {
    const make = (s: Session) =>
      all(s, [
        `CREATE TABLE p (id ${INT[d]} PRIMARY KEY, name ${TEXT[d]}(10))`,
        `CREATE TABLE c_cascade (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_cas FOREIGN KEY (pid) REFERENCES p(id) ON DELETE CASCADE)`,
        `CREATE TABLE c_null (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_nul FOREIGN KEY (pid) REFERENCES p(id) ON DELETE SET NULL)`,
        "INSERT INTO p VALUES (1, 'a')",
        "INSERT INTO p VALUES (2, 'b')",
        'INSERT INTO c_cascade VALUES (1, 1)',
        'INSERT INTO c_cascade VALUES (2, 1)',
        'INSERT INTO c_cascade VALUES (3, 2)',
        'INSERT INTO c_null VALUES (1, 1)',
        'INSERT INTO c_null VALUES (2, 2)',
      ]);

    it(`${d}: ON DELETE CASCADE xóa luôn row con`, () => {
      // MySQL thật: delete from p where id = 1 xóa luôn 2 row con của c2
      const s = S(d);
      make(s);
      good(s, 'DELETE FROM p WHERE id = 1');
      expect(rows(s, 'SELECT id FROM c_cascade')).toEqual([[3]]);
    });

    it(`${d}: ON DELETE SET NULL đặt NULL cho row con`, () => {
      // MySQL thật: sau khi xóa row cha, c3.pid thành NULL
      const s = S(d);
      make(s);
      good(s, 'DELETE FROM p WHERE id = 1');
      expect(rows(s, 'SELECT id, pid FROM c_null ORDER BY id')).toEqual([[1, null], [2, 2]]);
    });

    it(`${d}: ROLLBACK hoàn lại cả row con bị CASCADE`, () => {
      const s = S(d);
      make(s);
      good(s, 'COMMIT');
      good(s, d === 'mysql' ? 'START TRANSACTION' : 'COMMIT');
      good(s, 'DELETE FROM p WHERE id = 1');
      good(s, 'ROLLBACK');
      expect(rows(s, 'SELECT COUNT(*) FROM c_cascade')).toEqual([[3]]);
      expect(rows(s, 'SELECT COUNT(*) FROM p')).toEqual([[2]]);
    });

    it(`${d}: mặc định (không ghi ON DELETE) là chặn, dù table khác đã CASCADE`, () => {
      // MySQL thật: nếu một table con dùng RESTRICT thì cả lệnh DELETE bị 1451 và không row nào bị xóa
      const s = S(d);
      make(s);
      good(s, `CREATE TABLE c_block (id ${INT[d]} PRIMARY KEY, pid ${INT[d]}, CONSTRAINT fk_blk FOREIGN KEY (pid) REFERENCES p(id))`);
      good(s, 'INSERT INTO c_block VALUES (1, 1)');
      const e = err(s, 'DELETE FROM p WHERE id = 1');
      expect(e.code).toBe(d === 'mysql' ? '1451' : 'ORA-02292');
      expect(rows(s, 'SELECT COUNT(*) FROM c_cascade')).toEqual([[3]]);
      expect(rows(s, 'SELECT COUNT(*) FROM p')).toEqual([[2]]);
    });

    it(`${d}: CASCADE nhiều tầng, tầng dưới có luật chặn thì chặn cả chuỗi`, () => {
      // MySQL thật: delete from p where id = 1 -> 1451 nêu table g2 (fkg), không row nào bị xóa
      const s = S(d);
      make(s);
      good(s, `CREATE TABLE g2 (id ${INT[d]} PRIMARY KEY, cid ${INT[d]}, CONSTRAINT fkg FOREIGN KEY (cid) REFERENCES c_cascade(id))`);
      good(s, 'INSERT INTO g2 VALUES (1, 1)');
      const e = err(s, 'DELETE FROM p WHERE id = 1');
      expect(e.code).toBe(d === 'mysql' ? '1451' : 'ORA-02292');
      expect(e.dbMessage).toContain(d === 'mysql' ? '`g2`' : 'FKG');
      good(s, 'DELETE FROM g2');
      good(s, 'DELETE FROM p WHERE id = 1');
      expect(rows(s, 'SELECT COUNT(*) FROM c_cascade')).toEqual([[1]]);
    });

    it(`${d}: CASCADE trên foreign key tự trỏ vào chính table`, () => {
      // MySQL thật: delete from org where id = 1 chỉ còn row id 5
      const s = S(d);
      good(s, `CREATE TABLE org (id ${INT[d]} PRIMARY KEY, boss ${INT[d]}, CONSTRAINT fk_boss FOREIGN KEY (boss) REFERENCES org(id) ON DELETE CASCADE)`);
      all(s, ['INSERT INTO org VALUES (1, NULL)', 'INSERT INTO org VALUES (2, 1)', 'INSERT INTO org VALUES (3, 2)', 'INSERT INTO org VALUES (4, 1)', 'INSERT INTO org VALUES (5, NULL)']);
      good(s, 'DELETE FROM org WHERE id = 1');
      expect(rows(s, 'SELECT id FROM org ORDER BY id')).toEqual([[5]]);
    });
  }

  it('MySQL: ON DELETE SET NULL với column NOT NULL là 1830', () => {
    // MySQL thật: ERROR 1830 (HY000): Column 'pid' cannot be NOT NULL: needed in a foreign key constraint 'fk5' SET NULL
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY)');
    expect(err(s, 'CREATE TABLE c5 (id INT PRIMARY KEY, pid INT NOT NULL, CONSTRAINT fk5 FOREIGN KEY (pid) REFERENCES p(id) ON DELETE SET NULL)').dbMessage).toBe("ERROR 1830 (HY000): Column 'pid' cannot be NOT NULL: needed in a foreign key constraint 'fk5' SET NULL");
  });

  it('MySQL: ON DELETE RESTRICT và NO ACTION chạy được, hành vi như mặc định', () => {
    // MySQL thật: create table c7 (... on delete no action) chạy được
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY)');
    good(s, 'CREATE TABLE c6 (id INT PRIMARY KEY, pid INT, FOREIGN KEY (pid) REFERENCES p(id) ON DELETE RESTRICT)');
    good(s, 'CREATE TABLE c7 (id INT PRIMARY KEY, pid INT, FOREIGN KEY (pid) REFERENCES p(id) ON DELETE NO ACTION)');
    good(s, 'INSERT INTO p VALUES (1)');
    good(s, 'INSERT INTO c6 VALUES (1, 1)');
    expect(err(s, 'DELETE FROM p').code).toBe('1451');
  });

  it('MySQL: ON UPDATE CASCADE khóa học chưa dạy', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY)');
    const e = err(s, 'CREATE TABLE c8 (id INT, FOREIGN KEY (id) REFERENCES p(id) ON UPDATE CASCADE)');
    expect(e.code).toBe('CHUA-HOC');
  });

  it('MySQL: ON DELETE chữ lạ là lỗi 1064', () => {
    // MySQL thật: ... on delete foo) -> ERROR 1064 near 'foo)'
    const s = S('mysql');
    good(s, 'CREATE TABLE p (id INT PRIMARY KEY)');
    expect(err(s, 'CREATE TABLE ch5 (x INT, FOREIGN KEY (x) REFERENCES p(id) ON DELETE foo)').dbMessage).toContain("near 'foo)'");
  });

  it('Oracle: ON DELETE RESTRICT và ON UPDATE đều là lỗi ORA-00905', () => {
    // Đã kiểm trên Oracle XE 21c thật: Oracle chỉ có ON DELETE CASCADE và ON DELETE SET NULL, hai câu này báo ORA-00905.
    const s = S('oracle');
    good(s, 'CREATE TABLE p (id NUMBER PRIMARY KEY)');
    expect(err(s, 'CREATE TABLE b10 (a NUMBER, FOREIGN KEY (a) REFERENCES p(id) ON DELETE RESTRICT)').code).toBe('ORA-00905');
    expect(err(s, 'CREATE TABLE b11 (a NUMBER, FOREIGN KEY (a) REFERENCES p(id) ON UPDATE CASCADE)').code).toBe('ORA-00905');
  });
});

describe('AUTO_INCREMENT và identity', () => {
  it('MySQL: bộ đếm AUTO_INCREMENT không lùi lại khi DELETE', () => {
    // MySQL thật: insert 3 row, delete from e1, insert tiếp -> id = 4
    const s = S('mysql');
    good(s, 'CREATE TABLE e1 (id INT AUTO_INCREMENT PRIMARY KEY, v INT)');
    good(s, 'INSERT INTO e1 (v) VALUES (1), (2), (3)');
    good(s, 'DELETE FROM e1');
    good(s, 'INSERT INTO e1 (v) VALUES (9)');
    expect(rows(s, 'SELECT id, v FROM e1')).toEqual([[4, 9]]);
    expect(s.db().tables[0].autoInc).toBe(5);
  });

  it('MySQL: đưa mã lớn hơn bộ đếm thì bộ đếm nhảy theo; NULL và 0 thì tự sinh', () => {
    // MySQL thật: id 1, 2, rồi 10 -> kế tiếp 11; đưa 5 giữ nguyên; NULL -> 13, 0 -> 14
    const s = S('mysql');
    good(s, 'CREATE TABLE s (id INT AUTO_INCREMENT PRIMARY KEY, v VARCHAR(3))');
    good(s, "INSERT INTO s (v) VALUES ('a')");
    good(s, "INSERT INTO s (v) VALUES ('b')");
    good(s, "INSERT INTO s (id, v) VALUES (10, 'c')");
    good(s, "INSERT INTO s (v) VALUES ('d')");
    good(s, "INSERT INTO s (id, v) VALUES (5, 'e')");
    good(s, "INSERT INTO s (v) VALUES ('f')");
    good(s, "INSERT INTO s (id, v) VALUES (NULL, 'g')");
    good(s, "INSERT INTO s (id, v) VALUES (0, 'h')");
    expect(rows(s, 'SELECT id FROM s ORDER BY id')).toEqual([[1], [2], [5], [10], [11], [12], [13], [14]]);
  });

  it('MySQL: INSERT lỗi độ dài thì không tốn mã', () => {
    // MySQL thật: 'toolong' vào VARCHAR(3) bị 1406, mã kế tiếp vẫn là 2
    const s = S('mysql');
    good(s, 'CREATE TABLE s (id INT AUTO_INCREMENT PRIMARY KEY, v VARCHAR(3))');
    good(s, "INSERT INTO s (v) VALUES ('a')");
    err(s, "INSERT INTO s (v) VALUES ('toolong')");
    good(s, "INSERT INTO s (v) VALUES ('b')");
    expect(rows(s, 'SELECT id FROM s ORDER BY id')).toEqual([[1], [2]]);
  });

  it('MySQL: AUTO_INCREMENT = 100 sau dấu ngoặc đặt số bắt đầu', () => {
    // MySQL thật: create table a1 (...) auto_increment = 100; insert -> id 100
    const s = S('mysql');
    good(s, 'CREATE TABLE a1 (id INT AUTO_INCREMENT PRIMARY KEY, v INT) AUTO_INCREMENT = 100');
    good(s, 'INSERT INTO a1 (v) VALUES (1)');
    expect(rows(s, 'SELECT id FROM a1')).toEqual([[100]]);
  });

  it('MySQL: AUTO_INCREMENT phải là key: 1075', () => {
    // MySQL thật: ERROR 1075 (42000): Incorrect table definition; there can be only one auto column and it must be defined as a key
    expect(err(S('mysql'), 'CREATE TABLE d7 (a INT AUTO_INCREMENT)').dbMessage).toBe('ERROR 1075 (42000): Incorrect table definition; there can be only one auto column and it must be defined as a key');
    expect(err(S('mysql'), 'CREATE TABLE d6 (a INT PRIMARY KEY AUTO_INCREMENT, b INT AUTO_INCREMENT)').code).toBe('1075');
  });

  it('MySQL: AUTO_INCREMENT trên column UNIQUE được', () => {
    // MySQL thật: create table inc2 (a int auto_increment unique, b int) -> a = 1, 2
    const s = S('mysql');
    good(s, 'CREATE TABLE inc2 (a INT AUTO_INCREMENT UNIQUE, b INT)');
    good(s, 'INSERT INTO inc2 (b) VALUES (1), (2)');
    expect(rows(s, 'SELECT a FROM inc2')).toEqual([[1], [2]]);
  });

  it('MySQL: ROLLBACK không hoàn lại bộ đếm', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE e1 (id INT AUTO_INCREMENT PRIMARY KEY, v INT)');
    good(s, 'START TRANSACTION');
    good(s, 'INSERT INTO e1 (v) VALUES (1)');
    good(s, 'ROLLBACK');
    good(s, 'INSERT INTO e1 (v) VALUES (2)');
    expect(rows(s, 'SELECT id FROM e1')).toEqual([[2]]);
  });

  it('Oracle: GENERATED AS IDENTITY đếm tiếp sau DELETE', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE e1 (id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v NUMBER)');
    good(s, 'INSERT INTO e1 (v) VALUES (1)');
    good(s, 'INSERT INTO e1 (v) VALUES (2)');
    good(s, 'DELETE FROM e1');
    good(s, 'INSERT INTO e1 (v) VALUES (3)');
    expect(rows(s, 'SELECT id FROM e1')).toEqual([[3]]);
  });

  it('Oracle: ROLLBACK không hoàn lại bộ đếm identity', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE e1 (id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, v NUMBER)');
    good(s, 'INSERT INTO e1 (v) VALUES (1)');
    good(s, 'ROLLBACK');
    good(s, 'INSERT INTO e1 (v) VALUES (2)');
    expect(rows(s, 'SELECT id FROM e1')).toEqual([[2]]);
  });

  // Đã kiểm trên Oracle XE 21c thật: BY DEFAULT ghi NULL tường minh báo ORA-01400.
  it('Oracle: BY DEFAULT ghi NULL tường minh thì ORA-01400, bỏ column hay ghi giá trị thì được', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE i1 (id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, v NUMBER)');
    expect(err(s, 'INSERT INTO i1 (id, v) VALUES (NULL, 1)').code).toBe('ORA-01400');
    good(s, 'INSERT INTO i1 (v) VALUES (1)');
    good(s, 'INSERT INTO i1 (id, v) VALUES (10, 2)');
    expect(rows(s, 'SELECT id FROM i1 ORDER BY id')).toEqual([[1], [10]]);
  });

  it('Oracle: BY DEFAULT ON NULL tự điền mã khi INSERT ghi NULL', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE i2 (id NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY, v NUMBER)');
    good(s, 'INSERT INTO i2 (id, v) VALUES (NULL, 1)');
    good(s, 'INSERT INTO i2 (id, v) VALUES (NULL, 2)');
    expect(rows(s, 'SELECT id FROM i2 ORDER BY id')).toEqual([[1], [2]]);
  });

  it('Oracle: GENERATED ALWAYS ghi giá trị thì ORA-32795, bỏ column thì được', () => {
    const s = S('oracle');
    good(s, 'CREATE TABLE i3 (id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v NUMBER)');
    expect(err(s, 'INSERT INTO i3 (id, v) VALUES (5, 1)').code).toBe('ORA-32795');
    good(s, 'INSERT INTO i3 (v) VALUES (1)');
    expect(rows(s, 'SELECT id FROM i3')).toEqual([[1]]);
  });
});
