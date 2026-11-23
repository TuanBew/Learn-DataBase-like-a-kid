import { describe, expect, it } from 'vitest';
import { createSession } from '../index';
import type { Database, Dialect, Session } from '../index';
import { BOTH, EMPTY, S, all, err, good, rows } from './ddl-util';

/**
 * Xem cấu trúc (SHOW, DESCRIBE, DESC, data dictionary của Oracle), Session.schema(), lưu và nạp database.
 * Kết quả MySQL ghi lại từ MySQL 8.0.46 thật (mysql -uroot -t, database tên lab).
 * Oracle theo Oracle Database 19c SQL*Plus DESCRIBE và Database Reference (USER_TAB_COLUMNS...).
 */

const MY_P = [
  'CREATE TABLE p (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE, price DECIMAL(12,2) DEFAULT 0, n NUMERIC(4), b BIGINT, t TEXT,',
  "dt DATETIME DEFAULT CURRENT_TIMESTAMP, ts TIMESTAMP NULL, s VARCHAR(10) DEFAULT 'x y', k INT DEFAULT 5, ii INTEGER)",
].join(' ');
const MY_C = "CREATE TABLE c (id INT, pid INT, qty INT, note VARCHAR(20), CONSTRAINT pk_c PRIMARY KEY (id, pid), CONSTRAINT fk_c FOREIGN KEY (pid) REFERENCES p(id) ON DELETE CASCADE, UNIQUE KEY uq (qty, note), CHECK (qty > 0))";
const MY_E = 'CREATE TABLE e (a INT, b INT NOT NULL, c INT UNIQUE, d INT, FOREIGN KEY (a) REFERENCES p(id) ON DELETE SET NULL, FOREIGN KEY (d) REFERENCES p(id))';

const my = (): Session => {
  const s = S('mysql');
  all(s, [MY_P, MY_C, MY_E]);
  return s;
};

const OR_SETUP = [
  "CREATE TABLE cust (id NUMBER(5) PRIMARY KEY, name VARCHAR2(50) NOT NULL, email VARCHAR2(80) CONSTRAINT cust_email_uk UNIQUE, city VARCHAR2(20 CHAR) DEFAULT 'Hue', born DATE, note CLOB, score NUMBER(6,2), n INTEGER)",
  'CREATE TABLE ord (id NUMBER, cust_id NUMBER(5), qty NUMBER, CONSTRAINT ord_pk PRIMARY KEY (id), CONSTRAINT ord_cust_fk FOREIGN KEY (cust_id) REFERENCES cust(id) ON DELETE CASCADE, CONSTRAINT ord_qty_ck CHECK (qty > 0))',
  'CREATE SEQUENCE ord_seq START WITH 100 INCREMENT BY 5',
];
const ora = (): Session => {
  const s = S('oracle');
  all(s, OR_SETUP);
  return s;
};

describe('MySQL: SHOW TABLES, DESCRIBE, SHOW COLUMNS', () => {
  it('SHOW TABLES: một column tên Tables_in_<database>, xếp theo tên', () => {
    const r = good(my(), 'SHOW TABLES');
    if (r.kind !== 'select') throw new Error('x');
    expect(r.result.columns).toEqual(['Tables_in_lab']);
    expect(r.result.rows).toEqual([['c'], ['e'], ['p']]);
  });

  it('DESCRIBE: sáu column Field, Type, Null, Key, Default, Extra (khớp MySQL thật)', () => {
    const r = good(my(), 'DESCRIBE p');
    if (r.kind !== 'select') throw new Error('x');
    expect(r.result.columns).toEqual(['Field', 'Type', 'Null', 'Key', 'Default', 'Extra']);
    expect(r.result.rows).toEqual([
      ['id', 'int', 'NO', 'PRI', null, 'auto_increment'],
      ['name', 'varchar(50)', 'NO', 'UNI', null, ''],
      ['price', 'decimal(12,2)', 'YES', '', '0.00', ''],
      ['n', 'decimal(4,0)', 'YES', '', null, ''],
      ['b', 'bigint', 'YES', '', null, ''],
      ['t', 'text', 'YES', '', null, ''],
      ['dt', 'datetime', 'YES', '', 'CURRENT_TIMESTAMP', 'DEFAULT_GENERATED'],
      ['ts', 'timestamp', 'YES', '', null, ''],
      ['s', 'varchar(10)', 'YES', '', 'x y', ''],
      ['k', 'int', 'YES', '', '5', ''],
      ['ii', 'int', 'YES', '', null, ''],
    ]);
  });

  it('DESC và SHOW COLUMNS FROM cho cùng kết quả với DESCRIBE', () => {
    const s = my();
    const a = rows(s, 'DESCRIBE p');
    expect(rows(s, 'DESC p')).toEqual(a);
    expect(rows(s, 'SHOW COLUMNS FROM p')).toEqual(a);
    expect(rows(s, 'show fields in p;')).toEqual(a);
    expect(rows(s, 'desc `P`')).toEqual(a);
  });

  it('Key: primary key ghép đều là PRI, UNIQUE ghép chỉ column đầu là MUL', () => {
    expect(rows(my(), 'DESC c')).toEqual([
      ['id', 'int', 'NO', 'PRI', null, ''],
      ['pid', 'int', 'NO', 'PRI', null, ''],
      ['qty', 'int', 'YES', 'MUL', null, ''],
      ['note', 'varchar(20)', 'YES', '', null, ''],
    ]);
  });

  it('Key: foreign key là MUL, UNIQUE đơn là UNI', () => {
    expect(rows(my(), 'SHOW COLUMNS FROM e').map((r) => [r[0], r[3]])).toEqual([['a', 'MUL'], ['b', ''], ['c', 'UNI'], ['d', 'MUL']]);
  });

  it('DEFAULT: số âm, DEFAULT NULL, số làm tròn theo scale', () => {
    const s = S('mysql');
    good(s, 'CREATE TABLE z (c VARCHAR(5) DEFAULT NULL, d INT NOT NULL DEFAULT -3, f DECIMAL(5,1) NOT NULL DEFAULT 1.55, g DECIMAL)');
    expect(rows(s, 'DESC z')).toEqual([
      ['c', 'varchar(5)', 'YES', '', null, ''],
      ['d', 'int', 'NO', '', '-3', ''],
      ['f', 'decimal(5,1)', 'NO', '', '1.6', ''],
      ['g', 'decimal(10,0)', 'YES', '', null, ''],
    ]);
  });

  it('DESCRIBE table không có: lỗi 1146 như MySQL thật', () => {
    const e = err(my(), 'DESCRIBE zzz');
    expect(e.code).toBe('1146');
    expect(e.dbMessage).toBe("ERROR 1146 (42S02): Table 'lab.zzz' doesn't exist");
    expect(err(my(), 'SHOW CREATE TABLE zzz').code).toBe('1146');
    expect(err(my(), 'SHOW COLUMNS FROM zzz').code).toBe('1146');
  });

  it('kết quả là kind select, không có cờ tool, thấy ngay thay đổi của DDL', () => {
    const s = my();
    const r = good(s, 'DESC e');
    expect(r.kind).toBe('select');
    expect('tool' in r).toBe(false);
    good(s, 'ALTER TABLE e ADD COLUMN z INT');
    expect(rows(s, 'DESC e').map((x) => x[0])).toEqual(['a', 'b', 'c', 'd', 'z']);
  });
});

describe('MySQL: SHOW CREATE TABLE', () => {
  const create = (s: Session, t: string) => {
    const r = good(s, `SHOW CREATE TABLE ${t}`);
    if (r.kind !== 'select') throw new Error('x');
    expect(r.result.columns).toEqual(['Table', 'Create Table']);
    expect(r.result.rows[0][0]).toBe(t);
    return String(r.result.rows[0][1]);
  };

  it('table có primary key, UNIQUE, DEFAULT: giống từng chữ với MySQL thật', () => {
    expect(create(my(), 'p')).toBe(
      [
        'CREATE TABLE `p` (',
        '  `id` int NOT NULL AUTO_INCREMENT,',
        '  `name` varchar(50) NOT NULL,',
        "  `price` decimal(12,2) DEFAULT '0.00',",
        '  `n` decimal(4,0) DEFAULT NULL,',
        '  `b` bigint DEFAULT NULL,',
        '  `t` text,',
        '  `dt` datetime DEFAULT CURRENT_TIMESTAMP,',
        '  `ts` timestamp NULL DEFAULT NULL,',
        "  `s` varchar(10) DEFAULT 'x y',",
        "  `k` int DEFAULT '5',",
        '  `ii` int DEFAULT NULL,',
        '  PRIMARY KEY (`id`),',
        '  UNIQUE KEY `name` (`name`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
      ].join('\n'),
    );
  });

  it('foreign key: có dòng KEY và CONSTRAINT, ON DELETE SET NULL', () => {
    expect(create(my(), 'e')).toBe(
      [
        'CREATE TABLE `e` (',
        '  `a` int DEFAULT NULL,',
        '  `b` int NOT NULL,',
        '  `c` int DEFAULT NULL,',
        '  `d` int DEFAULT NULL,',
        '  UNIQUE KEY `c` (`c`),',
        '  KEY `e_ibfk_1` (`a`),',
        '  KEY `e_ibfk_2` (`d`),',
        '  CONSTRAINT `e_ibfk_1` FOREIGN KEY (`a`) REFERENCES `p` (`id`) ON DELETE SET NULL,',
        '  CONSTRAINT `e_ibfk_2` FOREIGN KEY (`d`) REFERENCES `p` (`id`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
      ].join('\n'),
    );
  });

  it('có row thì thêm AUTO_INCREMENT=số kế tiếp; CHECK in trong hai cặp ngoặc', () => {
    const s = S('mysql');
    good(s, "CREATE TABLE q (id INT AUTO_INCREMENT PRIMARY KEY, v VARCHAR(5) NOT NULL DEFAULT '', f DECIMAL(5,1) NOT NULL DEFAULT 1.55, u INT NOT NULL UNIQUE, CONSTRAINT pos CHECK (u > 0))");
    good(s, 'INSERT INTO q (u) VALUES (1), (2)');
    const sql = create(s, 'q');
    expect(sql).toContain("  `v` varchar(5) NOT NULL DEFAULT '',");
    expect(sql).toContain("  `f` decimal(5,1) NOT NULL DEFAULT '1.6',");
    expect(sql).toContain('  CONSTRAINT `pos` CHECK ((`u` > 0))');
    expect(sql.endsWith(') ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci')).toBe(true);
  });

  it('chạy lại câu SHOW CREATE TABLE trên database trống thì dựng lại đúng table', () => {
    const s = my();
    const fresh = S('mysql');
    for (const t of ['p', 'c', 'e']) good(fresh, create(s, t));
    for (const t of ['p', 'c', 'e']) {
      expect(create(fresh, t)).toBe(create(s, t));
      expect(rows(fresh, `DESC ${t}`)).toEqual(rows(s, `DESC ${t}`));
    }
  });

  it('SHOW TABLES, DESCRIBE bằng nháy ngược và chữ hoa chạy được', () => {
    expect(rows(my(), 'SHOW CREATE TABLE `P`').length).toBe(1);
  });
});

describe('Oracle: DESC và SHOW TABLES', () => {
  it('DESC: column Name, Null?, Type và có cờ tool', () => {
    const r = good(ora(), 'DESC cust');
    if (r.kind !== 'select') throw new Error('x');
    expect(r.tool).toBe(true);
    expect(r.result.columns).toEqual(['Name', 'Null?', 'Type']);
    expect(r.result.rows).toEqual([
      ['ID', 'NOT NULL', 'NUMBER(5)'],
      ['NAME', 'NOT NULL', 'VARCHAR2(50)'],
      ['EMAIL', null, 'VARCHAR2(80)'],
      ['CITY', null, 'VARCHAR2(20 CHAR)'],
      ['BORN', null, 'DATE'],
      ['NOTE', null, 'CLOB'],
      ['SCORE', null, 'NUMBER(6,2)'],
      ['N', null, 'NUMBER(38)'],
    ]);
  });

  it('DESCRIBE, có ; và chữ thường: cùng kết quả; NUMBER trơn và TIMESTAMP', () => {
    const s = ora();
    good(s, 'CREATE TABLE t (a NUMBER, b TIMESTAMP, c CHAR(3), d VARCHAR(7))');
    expect(rows(s, 'describe ORD;')).toEqual(rows(s, 'DESC ord'));
    expect(rows(s, 'DESC t')).toEqual([['A', null, 'NUMBER'], ['B', null, 'TIMESTAMP(6)'], ['C', null, 'CHAR(3)'], ['D', null, 'VARCHAR2(7)']]);
  });

  it('DESC table không có: ORA-04043', () => {
    const e = err(ora(), 'DESC zzz');
    expect(e.code).toBe('ORA-04043');
    expect(e.dbMessage).toBe('ORA-04043: object zzz does not exist');
  });

  it('DESC đọc được cả view data dictionary', () => {
    expect(rows(ora(), 'DESC user_tables')).toEqual([['TABLE_NAME', null, 'VARCHAR2(128)']]);
  });

  it('SHOW TABLES: lỗi ORA-00900, lời giải thích chỉ sang USER_TABLES', () => {
    const e = err(ora(), 'SHOW TABLES');
    expect(e.code).toBe('ORA-00900');
    expect(e.friendly).toContain('USER_TABLES');
    expect(e.friendly).not.toMatch(/bảng|cột|hàng|dòng|khóa chính|khóa ngoại|ràng buộc/);
  });

  it('MySQL: DESC và SHOW của dialect kia không thành lệnh', () => {
    expect(err(ora(), 'SHOW COLUMNS FROM cust').code).toBe('CHUA-HOC');
    expect(err(my(), 'SHOW DATABASES').code).toBe('CHUA-HOC');
  });
});

describe('Oracle: data dictionary', () => {
  it('USER_TABLES: SELECT thường, WHERE và ORDER BY đều chạy', () => {
    const s = ora();
    expect(rows(s, 'SELECT * FROM user_tables')).toEqual([['CUST'], ['ORD']]);
    expect(rows(s, "SELECT table_name FROM user_tables WHERE table_name LIKE 'O%'")).toEqual([['ORD']]);
    expect(rows(s, 'SELECT table_name FROM USER_TABLES ORDER BY table_name DESC')).toEqual([['ORD'], ['CUST']]);
    const r = good(s, 'SELECT * FROM USER_TABLES');
    if (r.kind !== 'select') throw new Error('x');
    expect(r.result.columns).toEqual(['TABLE_NAME']);
  });

  it('USER_TAB_COLUMNS: tên data type, độ dài, độ chính xác, NULLABLE, COLUMN_ID, DATA_DEFAULT', () => {
    const r = good(ora(), "SELECT * FROM user_tab_columns WHERE table_name = 'CUST' ORDER BY column_id");
    if (r.kind !== 'select') throw new Error('x');
    expect(r.result.columns).toEqual(['TABLE_NAME', 'COLUMN_NAME', 'DATA_TYPE', 'DATA_LENGTH', 'DATA_PRECISION', 'DATA_SCALE', 'NULLABLE', 'COLUMN_ID', 'DATA_DEFAULT']);
    expect(r.result.rows.map((x) => x.slice(1))).toEqual([
      ['ID', 'NUMBER', 22, 5, 0, 'N', 1, null],
      ['NAME', 'VARCHAR2', 50, null, null, 'N', 2, null],
      ['EMAIL', 'VARCHAR2', 80, null, null, 'Y', 3, null],
      // Đã kiểm trên Oracle XE 21c thật: DATA_LENGTH của VARCHAR2(20 CHAR) là 80 (4 byte một ký tự, AL32UTF8).
      ['CITY', 'VARCHAR2', 80, null, null, 'Y', 4, "'Hue'"],
      ['BORN', 'DATE', 7, null, null, 'Y', 5, null],
      ['NOTE', 'CLOB', 4000, null, null, 'Y', 6, null],
      ['SCORE', 'NUMBER', 22, 6, 2, 'Y', 7, null],
      ['N', 'NUMBER', 22, null, 0, 'Y', 8, null],
    ]);
  });

  it('USER_CONSTRAINTS: P, U, R, C, kèm R_CONSTRAINT_NAME và DELETE_RULE', () => {
    const s = ora();
    const r = rows(s, "SELECT constraint_name, constraint_type, table_name, search_condition, r_constraint_name, delete_rule FROM user_constraints WHERE table_name = 'ORD' ORDER BY constraint_name");
    expect(r).toEqual([
      ['ORD_CUST_FK', 'R', 'ORD', null, expect.stringMatching(/^SYS_C00\d+$/), 'CASCADE'],
      ['ORD_PK', 'P', 'ORD', null, null, null],
      ['ORD_QTY_CK', 'C', 'ORD', 'qty > 0', null, null],
    ]);
    // R_CONSTRAINT_NAME là tên primary key của CUST.
    const pk = rows(s, "SELECT constraint_name FROM user_constraints WHERE table_name = 'CUST' AND constraint_type = 'P'");
    expect(pk[0][0]).toBe(r[0][4]);
    expect(rows(s, "SELECT constraint_name FROM user_constraints WHERE constraint_type = 'U'")).toEqual([['CUST_EMAIL_UK']]);
  });

  it('USER_CONS_COLUMNS: column của từng constraint, POSITION với primary key ghép', () => {
    const s = ora();
    good(s, 'CREATE TABLE line (a NUMBER, b NUMBER, CONSTRAINT line_pk PRIMARY KEY (a, b))');
    expect(rows(s, "SELECT column_name, position FROM user_cons_columns WHERE constraint_name = 'LINE_PK' ORDER BY position")).toEqual([['A', 1], ['B', 2]]);
    expect(rows(s, "SELECT table_name, column_name FROM user_cons_columns WHERE constraint_name = 'ORD_CUST_FK'")).toEqual([['ORD', 'CUST_ID']]);
  });

  it('JOIN hai view: column của foreign key và table nó trỏ tới', () => {
    const r = rows(
      ora(),
      "SELECT c.table_name, cc.column_name FROM user_constraints c JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name WHERE c.constraint_type = 'R'",
    );
    expect(r).toEqual([['ORD', 'CUST_ID']]);
  });

  it('USER_SEQUENCES: INCREMENT_BY và LAST_NUMBER đi theo NEXTVAL', () => {
    const s = ora();
    // Đã kiểm trên Oracle XE 21c và 18c thật: CACHE 20 mặc định, nên LAST_NUMBER nhảy theo lô: START 100 INCREMENT 5, sau NEXTVAL đầu là 200.
    expect(rows(s, 'SELECT sequence_name, increment_by, last_number FROM user_sequences')).toEqual([['ORD_SEQ', 5, 100]]);
    good(s, 'SELECT ord_seq.NEXTVAL FROM DUAL');
    expect(rows(s, 'SELECT last_number FROM user_sequences')).toEqual([[200]]);
    good(s, 'SELECT ord_seq.NEXTVAL FROM DUAL');
    expect(rows(s, 'SELECT last_number FROM user_sequences')).toEqual([[200]]);
  });

  it('USER_SEQUENCES: NOCACHE và CACHE n, CACHE 1 là ORA-04010', () => {
    // Đã kiểm trên Oracle XE 21c và 18c thật: NOCACHE sau NEXTVAL đầu là 2. CACHE 3 sau NEXTVAL đầu là 4, sau NEXTVAL thứ tư (giá trị 4) là 7.
    const s = S('oracle');
    all(s, ['CREATE SEQUENCE a1 NOCACHE', 'CREATE SEQUENCE a2 CACHE 3']);
    good(s, 'SELECT a1.NEXTVAL FROM DUAL');
    good(s, 'SELECT a2.NEXTVAL FROM DUAL');
    expect(rows(s, 'SELECT sequence_name, last_number FROM user_sequences ORDER BY 1')).toEqual([['A1', 2], ['A2', 4]]);
    for (let i = 0; i < 3; i++) good(s, 'SELECT a2.NEXTVAL FROM DUAL');
    expect(rows(s, "SELECT last_number FROM user_sequences WHERE sequence_name = 'A2'")).toEqual([[7]]);
    expect(err(s, 'CREATE SEQUENCE a3 CACHE 1').dbMessage).toBe('ORA-04010: the number of values to CACHE must be greater than 1');
  });

  it('ALL_TABLES và ALL_TAB_COLUMNS: thêm column OWNER đứng đầu', () => {
    const s = ora();
    const t = good(s, 'SELECT * FROM all_tables');
    if (t.kind !== 'select') throw new Error('x');
    expect(t.result.columns).toEqual(['OWNER', 'TABLE_NAME']);
    expect(t.result.rows).toEqual([['LAB', 'CUST'], ['LAB', 'ORD']]);
    const c = good(s, "SELECT * FROM all_tab_columns WHERE table_name = 'ORD'");
    if (c.kind !== 'select') throw new Error('x');
    expect(c.result.columns[0]).toBe('OWNER');
    expect(c.result.rows.length).toBe(3);
  });

  it('view đổi theo DDL, và subquery trên view chạy được', () => {
    const s = ora();
    good(s, 'DROP TABLE ord');
    expect(rows(s, 'SELECT COUNT(*) FROM user_tables')).toEqual([[1]]);
    expect(rows(s, "SELECT column_name FROM user_tab_columns WHERE table_name IN (SELECT table_name FROM user_tables) AND column_id = 1")).toEqual([['ID']]);
  });

  it('table của người học trùng tên view thì che view', () => {
    const s = ora();
    good(s, 'CREATE TABLE user_tables (x NUMBER)');
    expect(rows(s, 'SELECT COUNT(*) FROM user_tables')).toEqual([[0]]);
  });

  for (const v of ['user_tables', 'user_tab_columns', 'user_constraints', 'user_cons_columns', 'user_sequences', 'all_tables', 'all_tab_columns']) {
    it(`MySQL: ${v} là table không tồn tại (1146)`, () => {
      expect(err(my(), `SELECT * FROM ${v}`).code).toBe('1146');
    });
  }
});

describe('Session.schema()', () => {
  it('MySQL: table, column, data type, key, default, foreign key, CHECK, primary key ghép', () => {
    const v = my().schema();
    expect(v.dialect).toBe('mysql');
    expect(v.sequences).toEqual([]);
    expect(v.tables.map((t) => [t.name, t.rows])).toEqual([['p', 0], ['c', 0], ['e', 0]]);
    const p = v.tables[0];
    expect(p.primaryKey).toBeUndefined();
    expect(p.columns[0]).toEqual({ name: 'id', type: 'INT', nullable: false, pk: true, unique: false, identity: true });
    expect(p.columns[1]).toEqual({ name: 'name', type: 'VARCHAR(50)', nullable: false, pk: false, unique: true, identity: false });
    expect(p.columns[2]).toMatchObject({ type: 'DECIMAL(12,2)', nullable: true, default: '0' });
    const c = v.tables[1];
    expect(c.primaryKey).toEqual(['id', 'pid']);
    expect(c.columns[1]).toMatchObject({ name: 'pid', pk: true, fk: { table: 'p', column: 'id', onDelete: 'cascade' } });
    expect(c.checks).toEqual([{ name: 'c_chk_1', expr: 'qty > 0' }]);
    expect(v.tables[2].columns[0].fk).toEqual({ table: 'p', column: 'id', onDelete: 'set null' });
    expect(v.tables[2].columns[3].fk).toEqual({ table: 'p', column: 'id' });
  });

  it('Oracle: tên data type của Oracle, số row, sequence', () => {
    const s = ora();
    good(s, "INSERT INTO cust (id, name) VALUES (1, 'An')");
    const v = s.schema();
    expect(v.dialect).toBe('oracle');
    expect(v.tables[0].rows).toBe(1);
    expect(v.tables[0].columns.map((c) => c.type)).toEqual(['NUMBER(5)', 'VARCHAR2(50)', 'VARCHAR2(80)', 'VARCHAR2(20 CHAR)', 'DATE', 'CLOB', 'NUMBER(6,2)', 'NUMBER(38)']);
    expect(v.tables[0].columns[3].default).toBe("'Hue'");
    expect(v.tables[1].checks).toEqual([{ name: 'ord_qty_ck', expr: 'qty > 0' }]);
    expect(v.sequences).toEqual([{ name: 'ord_seq', start: 100, increment: 5 }]);
    good(s, 'SELECT ord_seq.NEXTVAL FROM DUAL');
    expect(s.schema().sequences[0].last).toBe(100);
  });

  it('cùng database, đổi dialect thì đổi cách viết data type', () => {
    const src = my().db();
    const o = createSession(JSON.parse(JSON.stringify(src)), 'oracle').schema();
    expect(o.tables[0].columns.map((c) => c.type)).toEqual(['NUMBER(38)', 'VARCHAR2(50)', 'NUMBER(12,2)', 'NUMBER(4)', 'NUMBER(38)', 'CLOB', 'TIMESTAMP(6)', 'TIMESTAMP(6)', 'VARCHAR2(10)', 'NUMBER(38)', 'NUMBER(38)']);
  });

  it('kết quả là JSON thuần', () => {
    const v = ora().schema();
    expect(JSON.parse(JSON.stringify(v))).toEqual(v);
  });
});

describe('Lưu và nạp database', () => {
  const roundTrip = (s: Session, d: Dialect): Session => createSession(JSON.parse(JSON.stringify(s.db())) as Database, d);

  const busy = (d: Dialect): Session => {
    const s = S(d);
    const text = d === 'mysql' ? 'VARCHAR' : 'VARCHAR2';
    const num = d === 'mysql' ? 'INT' : 'NUMBER(5)';
    const dec = d === 'mysql' ? 'DECIMAL(8,2)' : 'NUMBER(8,2)';
    const id = d === 'mysql' ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY';
    all(s, [
      `CREATE TABLE shop (id ${id}, name ${text}(30) NOT NULL, tier ${text}(10) DEFAULT 'std', CONSTRAINT shop_name_uk UNIQUE (name))`,
      `CREATE TABLE item (id ${num}, shop_id ${d === 'mysql' ? 'INT' : 'NUMBER'}, price ${dec}, CONSTRAINT item_pk PRIMARY KEY (id), CONSTRAINT item_shop_fk FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE SET NULL, CONSTRAINT item_price_ck CHECK (price >= 0))`,
    ]);
    if (d === 'oracle') all(s, ['CREATE SEQUENCE s1 START WITH 10 INCREMENT BY 2', 'SELECT s1.NEXTVAL FROM DUAL', 'SELECT s1.NEXTVAL FROM DUAL']);
    all(s, ["INSERT INTO shop (name) VALUES ('A')", "INSERT INTO shop (name, tier) VALUES ('B', 'vip')", 'INSERT INTO item VALUES (1, 1, 9.5)', 'INSERT INTO item VALUES (2, 2, 3)', 'DELETE FROM shop WHERE name = ' + "'B'"]);
    if (d === 'oracle') good(s, 'COMMIT');
    return s;
  };

  for (const d of BOTH) {
    it(`${d}: db() qua JSON rồi nạp lại ra đúng y nguyên`, () => {
      const s = busy(d);
      const before = JSON.parse(JSON.stringify(s.db()));
      const s2 = roundTrip(s, d);
      expect(s2.db()).toEqual(before);
      expect(s2.schema()).toEqual(s.schema());
    });

    it(`${d}: bộ đếm tự tăng và sequence đi tiếp đúng số`, () => {
      const s2 = roundTrip(busy(d), d);
      // shop đã cấp mã 1, 2 rồi xóa row 2: row kế tiếp là 3.
      good(s2, "INSERT INTO shop (name) VALUES ('C')");
      expect(rows(s2, "SELECT id FROM shop WHERE name = 'C'")).toEqual([[3]]);
      if (d === 'oracle') expect(rows(s2, 'SELECT s1.NEXTVAL FROM DUAL')).toEqual([[14]]);
    });

    it(`${d}: constraint có tên, DEFAULT và độ dài còn nguyên`, () => {
      const s2 = roundTrip(busy(d), d);
      expect(err(s2, "INSERT INTO shop (name) VALUES ('A')").dbMessage).toContain(d === 'mysql' ? "'shop.shop_name_uk'" : 'SHOP_NAME_UK');
      expect(err(s2, 'INSERT INTO item VALUES (9, 1, -1)').dbMessage).toContain(d === 'mysql' ? "'item_price_ck'" : 'ITEM_PRICE_CK');
      expect(err(s2, "INSERT INTO shop (name) VALUES ('" + 'x'.repeat(31) + "')").code).toBe(d === 'mysql' ? '1406' : 'ORA-12899');
      good(s2, "INSERT INTO shop (name) VALUES ('D')");
      expect(rows(s2, "SELECT tier FROM shop WHERE name = 'D'")).toEqual([['std']]);
      // ON DELETE SET NULL vẫn chạy.
      good(s2, "DELETE FROM shop WHERE name = 'A'");
      expect(rows(s2, 'SELECT shop_id FROM item WHERE id = 1')).toEqual([[null]]);
    });

    it(`${d}: db() gồm cả thay đổi chưa COMMIT, nạp lại thì giữ nguyên`, () => {
      const s = busy(d);
      good(s, d === 'mysql' ? 'START TRANSACTION' : 'SELECT 1 FROM DUAL');
      good(s, 'DELETE FROM item');
      const s2 = roundTrip(s, d);
      expect(rows(s2, 'SELECT COUNT(*) FROM item')).toEqual([[0]]);
    });
  }

  it('database tạo ở mysql nạp vào session oracle vẫn chạy SELECT, INSERT', () => {
    const s = busy('mysql');
    const o = roundTrip(s, 'oracle');
    expect(o.dialect).toBe('oracle');
    expect(rows(o, 'SELECT name FROM shop ORDER BY id')).toEqual([['A']]);
    good(o, "INSERT INTO shop (name) VALUES ('Z')");
    good(o, 'INSERT INTO item VALUES (5, 1, 12.5)');
    expect(rows(o, 'SELECT COUNT(*) FROM item')).toEqual([[3]]);
    expect(err(o, 'INSERT INTO item VALUES (5, 1, 1)').kind).toBe('runtime');
    expect(rows(o, 'SELECT table_name FROM user_tables')).toEqual([['SHOP'], ['ITEM']]);
  });

  it('database tạo ở oracle nạp vào session mysql vẫn chạy SELECT, INSERT', () => {
    const m = roundTrip(busy('oracle'), 'mysql');
    expect(rows(m, 'SELECT name FROM shop')).toEqual([['A']]);
    good(m, "INSERT INTO shop (name) VALUES ('Z')");
    expect(rows(m, 'SELECT COUNT(*) FROM shop')).toEqual([[2]]);
    expect(rows(m, 'DESC item').map((r) => r[1])).toEqual(['decimal(5,0)', 'decimal(10,0)', 'decimal(8,2)']);
  });

  it('reset() quay về database đã nạp', () => {
    const s = roundTrip(busy('mysql'), 'mysql');
    good(s, 'DELETE FROM item');
    s.reset();
    expect(rows(s, 'SELECT COUNT(*) FROM item')).toEqual([[2]]);
  });

  it('database rỗng khứ hồi được', () => {
    expect(createSession(JSON.parse(JSON.stringify(createSession(EMPTY, 'mysql').db())), 'mysql').db()).toEqual({ name: 'lab', tables: [] });
  });
});
