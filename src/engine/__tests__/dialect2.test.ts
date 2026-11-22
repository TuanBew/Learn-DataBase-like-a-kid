import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect, Value } from '../index';
import { teashop } from '../../data/teashop';

/**
 * Khác biệt MySQL 8 và Oracle 19c của JOIN, GROUP BY, subquery, function chuỗi, số, ngày giờ, ROWNUM.
 * Kết quả mong đợi viết tay theo tài liệu và theo dữ liệu trong src/data/teashop.ts, không lấy từ output của engine.
 * Nguồn (M = https://dev.mysql.com/doc/refman/8.0/en/, O = https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/,
 * E = https://docs.oracle.com/en/error-help/db/, ME = https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html):
 *  - M string-functions.html (CONCAT, LENGTH, CHAR_LENGTH, SUBSTRING), O CONCAT.html, O Concatenation-Operator.html, O SUBSTR.html, O LENGTH.html
 *  - M date-and-time-functions.html, O SYSDATE.html, O CURRENT_DATE.html, O TO_CHAR-datetime.html, O TO_DATE.html, O TRUNC-date.html,
 *    O EXTRACT-datetime.html, O Data-Types.html (mục Datetime/Interval Arithmetic)
 *  - M group-by-handling.html, M join.html, M arithmetic-functions.html, O ROWNUM-Pseudocolumn.html
 *  - ME (mã 1055, 1140, 1111, 1052, 1242, 1241), E ora-00979, 00937, 00934, 00918, 00905, 01427, 00913, 01476, 00909, 00904
 * Điểm tài liệu không nói rõ mã lỗi được đánh dấu "mã theo engine" và chỉ kiểm có lỗi.
 */

const cell = (v: Value) => (typeof v === 'object' && v !== null ? v.iso : v);
const ok = (sql: string, d: Dialect) => {
  const r = run(sql, teashop, d);
  if (!r.ok) throw new Error(`[${d}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return { rows: r.result.rows.map((row) => row.map(cell)), columns: r.result.columns };
};
const fail = (sql: string, d: Dialect) => {
  const r = run(sql, teashop, d);
  if (r.ok) throw new Error(`[${d}] ${sql}\n   -> expected error, got ${r.result.rows.length} rows`);
  return r.error;
};
const one = (sql: string, d: Dialect) => ok(sql, d).rows[0][0];

describe('CONCAT và ||', () => {
  it('MySQL: CONCAT nhận nhiều tham số', () => {
    expect(one("SELECT CONCAT('a', 'b', 'c')", 'mysql')).toBe('abc');
    expect(one("SELECT CONCAT(name, ' - ', category) FROM products WHERE product_id = 1", 'mysql')).toBe('Trà sữa trân châu - Trà sữa');
  });

  it('Oracle: CONCAT chỉ nhận 2 tham số, ba tham số ra ORA-00909', () => {
    expect(one("SELECT CONCAT('a', 'b') FROM DUAL", 'oracle')).toBe('ab');
    const e = fail("SELECT CONCAT('a', 'b', 'c') FROM DUAL", 'oracle');
    expect(e.code).toBe('ORA-00909');
  });

  it("Oracle: || nối chuỗi", () => {
    expect(one("SELECT name || ' - ' || category FROM products WHERE product_id = 3", 'oracle')).toBe('Cà phê sữa đá - Cà phê');
  });

  it('MySQL: || là OR logic, mặc định không nối chuỗi', () => {
    expect(one('SELECT 1 || 0', 'mysql')).toBe(1);
    expect(one('SELECT 0 || 0', 'mysql')).toBe(0);
    expect(one('SELECT 0 || 1', 'mysql')).toBe(1);
    // chữ không đọc ra số thì coi là 0: 'a' || 'b' là 0 OR 0
    expect(one("SELECT 'a' || 'b'", 'mysql')).toBe(0);
  });

  it('MySQL: CONCAT có tham số NULL thì ra NULL', () => {
    // sản phẩm 5 có calories NULL
    expect(one('SELECT CONCAT(name, calories) FROM products WHERE product_id = 5', 'mysql')).toBeNull();
    expect(one("SELECT CONCAT('a', NULL)", 'mysql')).toBeNull();
  });

  it('Oracle: NULL khi nối coi như chuỗi rỗng, ra phần còn lại', () => {
    expect(one('SELECT CONCAT(name, calories) FROM products WHERE product_id = 5', 'oracle')).toBe('Trà vải hoa hồng');
    expect(one("SELECT 'a' || NULL FROM DUAL", 'oracle')).toBe('a');
    expect(one("SELECT CONCAT('a', NULL) FROM DUAL", 'oracle')).toBe('a');
    // '' là NULL ở Oracle
    expect(one("SELECT 'a' || '' FROM DUAL", 'oracle')).toBe('a');
  });

  it('MySQL: chuỗi rỗng là giá trị, CONCAT với chuỗi rỗng vẫn ra chuỗi', () => {
    expect(one("SELECT CONCAT('a', '')", 'mysql')).toBe('a');
    expect(one("SELECT CONCAT('', '')", 'mysql')).toBe('');
  });
});

describe('LENGTH, CHAR_LENGTH, SUBSTR', () => {
  // M string-functions: "a multibyte character counts as multiple bytes". 'à' = 2 byte, 'ữ' = 3 byte (UTF-8).
  it('MySQL: LENGTH đếm byte', () => {
    expect(one("SELECT LENGTH('Hà')", 'mysql')).toBe(3);
    expect(one("SELECT LENGTH('sữa')", 'mysql')).toBe(5);
    expect(one("SELECT LENGTH('abc')", 'mysql')).toBe(3);
  });

  it('MySQL: CHAR_LENGTH đếm ký tự', () => {
    expect(one("SELECT CHAR_LENGTH('Hà')", 'mysql')).toBe(2);
    expect(one("SELECT CHAR_LENGTH('sữa')", 'mysql')).toBe(3);
  });

  it('Oracle: LENGTH đếm ký tự', () => {
    expect(one("SELECT LENGTH('Hà') FROM DUAL", 'oracle')).toBe(2);
    expect(one("SELECT LENGTH('sữa') FROM DUAL", 'oracle')).toBe(3);
  });

  it('Oracle: không có CHAR_LENGTH (ORA-00904)', () => {
    expect(fail("SELECT CHAR_LENGTH('Hà') FROM DUAL", 'oracle').code).toBe('ORA-00904');
  });

  it('LENGTH của NULL là NULL ở cả hai dialect', () => {
    expect(one('SELECT LENGTH(calories) FROM products WHERE product_id = 5', 'mysql')).toBeNull();
    expect(one('SELECT LENGTH(calories) FROM products WHERE product_id = 5', 'oracle')).toBeNull();
  });

  // Ví dụ của chính tài liệu MySQL: SUBSTRING('Sakila', -3) = 'ila', SUBSTRING('Sakila', -5, 3) = 'aki'.
  it('MySQL: SUBSTR với vị trí âm đếm từ cuối chuỗi', () => {
    expect(one("SELECT SUBSTR('Sakila', -3)", 'mysql')).toBe('ila');
    expect(one("SELECT SUBSTR('Sakila', -5, 3)", 'mysql')).toBe('aki');
    expect(one("SELECT SUBSTRING('Sakila', -3)", 'mysql')).toBe('ila');
  });

  it('Oracle: SUBSTR với vị trí âm đếm ngược từ cuối chuỗi', () => {
    expect(one("SELECT SUBSTR('Sakila', -3) FROM DUAL", 'oracle')).toBe('ila');
    expect(one("SELECT SUBSTR('Sakila', -5, 3) FROM DUAL", 'oracle')).toBe('aki');
  });

  it('SUBSTR vị trí 0: MySQL ra chuỗi rỗng, Oracle coi như vị trí 1', () => {
    expect(one("SELECT SUBSTR('Sakila', 0, 3)", 'mysql')).toBe('');
    expect(one("SELECT SUBSTR('Sakila', 0, 3) FROM DUAL", 'oracle')).toBe('Sak');
  });

  it('SUBSTR tính theo ký tự ở cả hai dialect', () => {
    expect(one('SELECT SUBSTR(name, 1, 3) FROM products WHERE product_id = 1', 'mysql')).toBe('Trà');
    expect(one('SELECT SUBSTR(name, 1, 3) FROM products WHERE product_id = 1', 'oracle')).toBe('Trà');
  });
});

describe('thay NULL: IFNULL, NVL, COALESCE', () => {
  it('MySQL: IFNULL thay NULL', () => {
    expect(one('SELECT IFNULL(calories, 0) FROM products WHERE product_id = 5', 'mysql')).toBe(0);
    expect(one('SELECT IFNULL(calories, 0) FROM products WHERE product_id = 1', 'mysql')).toBe(320);
  });

  it('Oracle: NVL thay NULL', () => {
    expect(one('SELECT NVL(calories, 0) FROM products WHERE product_id = 5', 'oracle')).toBe(0);
    expect(one('SELECT NVL(calories, 0) FROM products WHERE product_id = 1', 'oracle')).toBe(320);
  });

  it('Oracle: IFNULL không có (ORA-00904)', () => {
    expect(fail('SELECT IFNULL(calories, 0) FROM products', 'oracle').code).toBe('ORA-00904');
  });

  it('MySQL: NVL không có (1305 FUNCTION ... does not exist)', () => {
    const e = fail('SELECT NVL(calories, 0) FROM products', 'mysql');
    expect(e.code).toBe('1305');
    expect(e.dbMessage).toContain('NVL does not exist');
  });

  it('COALESCE chạy ở cả hai dialect', () => {
    expect(one('SELECT COALESCE(calories, 0) FROM products WHERE product_id = 5', 'mysql')).toBe(0);
    expect(one('SELECT COALESCE(calories, 0) FROM products WHERE product_id = 5', 'oracle')).toBe(0);
  });
});

describe('ngày giờ hiện tại (cố định 2026-03-09 10:30:00)', () => {
  it('MySQL: NOW() có cả giờ', () => {
    expect(one('SELECT NOW()', 'mysql')).toBe('2026-03-09 10:30:00');
  });

  it('MySQL: CURDATE() và CURRENT_DATE chỉ có ngày', () => {
    expect(one('SELECT CURDATE()', 'mysql')).toBe('2026-03-09');
    expect(one('SELECT CURRENT_DATE', 'mysql')).toBe('2026-03-09');
    expect(one('SELECT CURRENT_DATE()', 'mysql')).toBe('2026-03-09');
  });

  it('Oracle: SYSDATE là kiểu DATE có cả giờ', () => {
    expect(one("SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL", 'oracle')).toBe('2026-03-09 10:30:00');
  });

  it('Oracle: CURRENT_DATE viết không ngoặc, cũng là DATE có giờ', () => {
    expect(one("SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL", 'oracle')).toBe('2026-03-09 10:30:00');
  });

  it('Oracle: NOW() và CURDATE() không có (ORA-00904)', () => {
    expect(fail('SELECT NOW() FROM DUAL', 'oracle').code).toBe('ORA-00904');
    expect(fail('SELECT CURDATE() FROM DUAL', 'oracle').code).toBe('ORA-00904');
  });

  it('MySQL: SYSDATE không ngoặc là lỗi (mã theo engine, tài liệu chỉ ghi SYSDATE([fsp]))', () => {
    fail('SELECT SYSDATE', 'mysql');
  });

  it('MySQL: SYSDATE() có ngoặc chạy', () => {
    expect(one('SELECT SYSDATE()', 'mysql')).toBe('2026-03-09 10:30:00');
  });
});

describe('định dạng và chuyển ngày', () => {
  // Đơn 1001 đặt lúc 2026-03-02 08:15:00.
  it('MySQL: DATE_FORMAT dùng %Y %m %d %H %i', () => {
    expect(one("SELECT DATE_FORMAT(ordered_at, '%Y-%m-%d %H:%i') FROM orders WHERE order_id = 1001", 'mysql')).toBe('2026-03-02 08:15');
    expect(one("SELECT DATE_FORMAT(ordered_at, '%d/%m/%Y') FROM orders WHERE order_id = 1001", 'mysql')).toBe('02/03/2026');
  });

  it('Oracle: TO_CHAR dùng YYYY MM DD HH24 MI', () => {
    expect(one("SELECT TO_CHAR(ordered_at, 'YYYY-MM-DD HH24:MI') FROM orders WHERE order_id = 1001", 'oracle')).toBe('2026-03-02 08:15');
    expect(one("SELECT TO_CHAR(ordered_at, 'DD/MM/YYYY') FROM orders WHERE order_id = 1001", 'oracle')).toBe('02/03/2026');
  });

  it('dùng nhầm: DATE_FORMAT ở Oracle ra ORA-00904, TO_CHAR ở MySQL ra 1305', () => {
    expect(fail("SELECT DATE_FORMAT(ordered_at, '%Y') FROM orders", 'oracle').code).toBe('ORA-00904');
    expect(fail("SELECT TO_CHAR(ordered_at, 'YYYY') FROM orders", 'mysql').code).toBe('1305');
  });

  it('MySQL: STR_TO_DATE đọc ngày theo format', () => {
    expect(one("SELECT STR_TO_DATE('02/03/2026', '%d/%m/%Y')", 'mysql')).toMatch(/^2026-03-02/);
    expect(one("SELECT DATE_FORMAT(STR_TO_DATE('15/01/2026', '%d/%m/%Y'), '%Y-%m-%d')", 'mysql')).toBe('2026-01-15');
  });

  it('Oracle: TO_DATE đọc ngày theo format', () => {
    expect(one("SELECT TO_DATE('02/03/2026', 'DD/MM/YYYY') FROM DUAL", 'oracle')).toMatch(/^2026-03-02/);
    expect(one("SELECT TO_CHAR(TO_DATE('15/01/2026', 'DD/MM/YYYY'), 'YYYY-MM-DD') FROM DUAL", 'oracle')).toBe('2026-01-15');
  });

  it('dùng nhầm: STR_TO_DATE ở Oracle ra ORA-00904, TO_DATE ở MySQL ra 1305', () => {
    expect(fail("SELECT STR_TO_DATE('02/03/2026', '%d/%m/%Y') FROM DUAL", 'oracle').code).toBe('ORA-00904');
    expect(fail("SELECT TO_DATE('02/03/2026', 'DD/MM/YYYY')", 'mysql').code).toBe('1305');
  });
});

describe('so sánh ngày giờ với ngày', () => {
  // Đơn 1001, 1002, 1003 đặt ngày 2026-03-02 (08:15, 09:40, 12:05). Không đơn nào đặt đúng 00:00:00.
  it("Oracle: ordered_at = DATE '2026-03-02' không ra row nào vì DATE là 00:00:00", () => {
    expect(ok("SELECT order_id FROM orders WHERE ordered_at = DATE '2026-03-02'", 'oracle').rows).toEqual([]);
  });

  it("Oracle: TRUNC(ordered_at) = DATE '2026-03-02' ra 3 đơn", () => {
    expect(ok("SELECT order_id FROM orders WHERE TRUNC(ordered_at) = DATE '2026-03-02' ORDER BY order_id", 'oracle').rows).toEqual([[1001], [1002], [1003]]);
  });

  it("MySQL: DATE(ordered_at) = '2026-03-02' ra 3 đơn", () => {
    expect(ok("SELECT order_id FROM orders WHERE DATE(ordered_at) = '2026-03-02' ORDER BY order_id", 'mysql').rows).toEqual([[1001], [1002], [1003]]);
  });

  it("MySQL: ordered_at = '2026-03-02' so với 00:00:00 nên không ra row nào", () => {
    expect(ok("SELECT order_id FROM orders WHERE ordered_at = '2026-03-02'", 'mysql').rows).toEqual([]);
  });

  it('MySQL: không có TRUNC cho ngày (1305). Oracle không có DATE() như function', () => {
    expect(fail('SELECT TRUNC(ordered_at) FROM orders', 'mysql').code).toBe('1305');
    fail('SELECT DATE(ordered_at) FROM orders', 'oracle');
  });
});

describe('EXTRACT, YEAR, MONTH, DAY', () => {
  it('EXTRACT chạy ở cả hai dialect', () => {
    for (const [d, from] of [['mysql', ''], ['oracle', ' FROM DUAL']] as [Dialect, string][]) {
      expect(one(`SELECT EXTRACT(YEAR FROM DATE '2026-03-02')${from}`, d)).toBe(2026);
      expect(one(`SELECT EXTRACT(MONTH FROM DATE '2026-03-02')${from}`, d)).toBe(3);
      expect(one(`SELECT EXTRACT(DAY FROM DATE '2026-03-02')${from}`, d)).toBe(2);
    }
    expect(one('SELECT EXTRACT(MONTH FROM ordered_at) FROM orders WHERE order_id = 1001', 'mysql')).toBe(3);
    expect(one('SELECT EXTRACT(MONTH FROM ordered_at) FROM orders WHERE order_id = 1001', 'oracle')).toBe(3);
  });

  it('MySQL: YEAR, MONTH, DAY, HOUR', () => {
    expect(ok('SELECT YEAR(ordered_at), MONTH(ordered_at), DAY(ordered_at), HOUR(ordered_at) FROM orders WHERE order_id = 1001', 'mysql').rows).toEqual([[2026, 3, 2, 8]]);
  });

  it('Oracle: YEAR() không có (ORA-00904)', () => {
    expect(fail('SELECT YEAR(ordered_at) FROM orders', 'oracle').code).toBe('ORA-00904');
  });

  it('Oracle: lấy năm bằng TO_CHAR ra chữ', () => {
    expect(one("SELECT TO_CHAR(ordered_at, 'YYYY') FROM orders WHERE order_id = 1001", 'oracle')).toBe('2026');
  });
});

describe('cộng trừ ngày', () => {
  it('Oracle: ngày trừ ngày ra số ngày', () => {
    expect(one("SELECT DATE '2026-03-09' - DATE '2026-03-02' FROM DUAL", 'oracle')).toBe(7);
  });

  it('Oracle: ngày giờ trừ nhau ra số ngày có phần lẻ (2 giờ 15 phút = 135/1440 ngày)', () => {
    // 2026-03-09 10:30:00 - 2026-03-02 08:15:00 = 7 ngày 2 giờ 15 phút
    expect(one('SELECT SYSDATE - ordered_at FROM orders WHERE order_id = 1001', 'oracle')).toBeCloseTo(7 + 135 / 1440, 9);
  });

  it('Oracle: ngày cộng số là cộng số ngày', () => {
    expect(one("SELECT TO_CHAR(DATE '2026-03-02' + 7, 'YYYY-MM-DD') FROM DUAL", 'oracle')).toBe('2026-03-09');
    expect(one("SELECT TO_CHAR(ordered_at + 7, 'YYYY-MM-DD HH24:MI') FROM orders WHERE order_id = 1001", 'oracle')).toBe('2026-03-09 08:15');
    expect(one("SELECT TO_CHAR(SYSDATE - 7, 'YYYY-MM-DD') FROM DUAL", 'oracle')).toBe('2026-03-02');
  });

  it('MySQL: DATEDIFF(a, b) ra a trừ b theo ngày, bỏ qua phần giờ', () => {
    expect(one("SELECT DATEDIFF('2026-03-09', '2026-03-02')", 'mysql')).toBe(7);
    expect(one("SELECT DATEDIFF('2026-03-02', '2026-03-09')", 'mysql')).toBe(-7);
    expect(one('SELECT DATEDIFF(NOW(), ordered_at) FROM orders WHERE order_id = 1001', 'mysql')).toBe(7);
  });

  it('Oracle: DATEDIFF không có (ORA-00904)', () => {
    expect(fail("SELECT DATEDIFF(SYSDATE, ordered_at) FROM orders", 'oracle').code).toBe('ORA-00904');
  });
});

describe('ROWNUM', () => {
  it('Oracle: ROWNUM <= 3 lấy 3 row đầu rồi mới sắp (ORDER BY chạy sau)', () => {
    // 3 row đầu của products là mã 1, 2, 3 (giá 35000, 45000, 25000). Sắp giá giảm dần: 2, 1, 3.
    expect(ok('SELECT product_id FROM products WHERE ROWNUM <= 3 ORDER BY price DESC', 'oracle').rows).toEqual([[2], [1], [3]]);
  });

  it('Oracle: FETCH FIRST 3 ROWS ONLY sắp trước rồi mới lấy, ra 3 giá cao nhất', () => {
    expect(ok('SELECT product_id FROM products ORDER BY price DESC FETCH FIRST 3 ROWS ONLY', 'oracle').rows).toEqual([[12], [5], [2]]);
  });

  it('Oracle: ROWNUM > 1 không ra row nào (tài liệu: row đầu được gán ROWNUM 1 nên điều kiện sai)', () => {
    expect(ok('SELECT product_id FROM products WHERE ROWNUM > 1', 'oracle').rows).toEqual([]);
  });

  it('Oracle: ROWNUM = 1 ra đúng 1 row', () => {
    expect(ok('SELECT product_id FROM products WHERE ROWNUM = 1', 'oracle').rows).toEqual([[1]]);
  });

  it('MySQL: ROWNUM là lỗi', () => {
    const e = fail('SELECT product_id FROM products WHERE ROWNUM <= 3', 'mysql');
    expect(e.code).toBe('1054');
  });
});

describe('GROUP BY: column ngoài nhóm', () => {
  it('có GROUP BY, chọn column không nằm trong nhóm: MySQL 1055, Oracle ORA-00979', () => {
    const sql = 'SELECT category, name, COUNT(*) FROM products GROUP BY category';
    const m = fail(sql, 'mysql');
    expect(m.code).toBe('1055');
    expect(m.dbMessage).toContain('nonaggregated column');
    expect(fail(sql, 'oracle').code).toBe('ORA-00979');
  });

  it('không GROUP BY, function gom đi cùng column: MySQL 1140, Oracle ORA-00937', () => {
    const sql = 'SELECT name, COUNT(*) FROM products';
    expect(fail(sql, 'mysql').code).toBe('1140');
    expect(fail(sql, 'oracle').code).toBe('ORA-00937');
  });

  it('GROUP BY primary key: MySQL cho chọn column khác của table, Oracle không', () => {
    const sql = 'SELECT product_id, name, COUNT(*) FROM products GROUP BY product_id ORDER BY product_id';
    const rows = ok(sql, 'mysql').rows;
    expect(rows.length).toBe(14);
    expect(rows[0]).toEqual([1, 'Trà sữa trân châu', 1]);
    expect(rows[13]).toEqual([14, 'Kem cheese', 1]);
    expect(fail(sql, 'oracle').code).toBe('ORA-00979');
  });

  it('MySQL: GROUP BY column thường (không phải primary key) không đủ để chọn column khác', () => {
    expect(fail('SELECT category, name FROM products GROUP BY category', 'mysql').code).toBe('1055');
  });

  it('function gom trong WHERE: MySQL 1111, Oracle ORA-00934', () => {
    const sql = 'SELECT name FROM products WHERE COUNT(*) > 1';
    expect(fail(sql, 'mysql').code).toBe('1111');
    expect(fail(sql, 'oracle').code).toBe('ORA-00934');
  });

  it('chọn column có trong GROUP BY thì chạy ở cả hai dialect', () => {
    const sql = 'SELECT category, COUNT(*) FROM products GROUP BY category ORDER BY category';
    const expected = [['Cà phê', 3], ['Topping', 4], ['Trà sữa', 4], ['Trà trái cây', 3]];
    expect(ok(sql, 'mysql').rows).toEqual(expected);
    expect(ok(sql, 'oracle').rows).toEqual(expected);
  });
});

describe('JOIN', () => {
  it('column trùng tên ở hai table: MySQL 1052, Oracle ORA-00918', () => {
    const sql = 'SELECT product_id FROM products p JOIN order_items i ON p.product_id = i.product_id';
    const m = fail(sql, 'mysql');
    expect(m.code).toBe('1052');
    expect(m.dbMessage).toContain('ambiguous');
    expect(fail(sql, 'oracle').code).toBe('ORA-00918');
  });

  it('thêm tên table trước column thì hết lỗi', () => {
    const sql = 'SELECT COUNT(p.product_id) FROM products p JOIN order_items i ON p.product_id = i.product_id';
    expect(one(sql, 'mysql')).toBe(48);
    expect(one(sql, 'oracle')).toBe(48);
  });

  it('JOIN thiếu ON: MySQL ghép mọi row với mọi row (14 x 48 = 672), Oracle ORA-00905', () => {
    const sql = 'SELECT COUNT(*) FROM products p JOIN order_items i';
    expect(one(sql, 'mysql')).toBe(672);
    expect(fail(sql, 'oracle').code).toBe('ORA-00905');
  });

  it('AS trước alias của table: MySQL chạy, Oracle ORA-00933 (mã theo engine, tài liệu chỉ ghi alias không có AS)', () => {
    const sql = 'SELECT COUNT(*) FROM orders o JOIN customers AS c ON c.customer_id = o.customer_id';
    // 20 đơn, 4 đơn có customer_id NULL (1003, 1008, 1012, 1017) nên còn 16 đơn có khách
    expect(one(sql, 'mysql')).toBe(16);
    expect(fail(sql, 'oracle').code).toBe('ORA-00933');
  });

  it('alias của column dùng AS được ở cả hai dialect', () => {
    expect(ok('SELECT price AS gia FROM products WHERE product_id = 1', 'mysql').rows).toEqual([[35000]]);
    expect(ok('SELECT price AS gia FROM products WHERE product_id = 1', 'oracle').rows).toEqual([[35000]]);
  });
});

describe('subquery', () => {
  it('scalar subquery ra nhiều row: MySQL 1242, Oracle ORA-01427', () => {
    const sql = 'SELECT name FROM products WHERE price = (SELECT price FROM products)';
    const m = fail(sql, 'mysql');
    expect(m.code).toBe('1242');
    expect(m.dbMessage).toContain('Subquery returns more than 1 row');
    expect(fail(sql, 'oracle').code).toBe('ORA-01427');
  });

  it('subquery nhiều column so với một giá trị: MySQL 1241, Oracle ORA-00913', () => {
    const sql = 'SELECT name FROM products WHERE price = (SELECT price, name FROM products WHERE product_id = 1)';
    const m = fail(sql, 'mysql');
    expect(m.code).toBe('1241');
    expect(m.dbMessage).toContain('Operand should contain 1 column');
    expect(fail(sql, 'oracle').code).toBe('ORA-00913');
  });

  it('IN (subquery nhiều column): MySQL 1241, Oracle ORA-00913', () => {
    const sql = 'SELECT name FROM products WHERE product_id IN (SELECT product_id, name FROM products)';
    expect(fail(sql, 'mysql').code).toBe('1241');
    expect(fail(sql, 'oracle').code).toBe('ORA-00913');
  });

  it('scalar subquery ra đúng 1 row chạy ở cả hai dialect', () => {
    const sql = 'SELECT name FROM products WHERE price = (SELECT MAX(price) FROM products)';
    expect(ok(sql, 'mysql').rows).toEqual([['Cà phê cacao đá xay']]);
    expect(ok(sql, 'oracle').rows).toEqual([['Cà phê cacao đá xay']]);
  });

  it('scalar subquery ra 0 row thì so sánh với NULL, không ra row nào', () => {
    const sql = 'SELECT name FROM products WHERE price = (SELECT price FROM products WHERE product_id = 999)';
    expect(ok(sql, 'mysql').rows).toEqual([]);
    expect(ok(sql, 'oracle').rows).toEqual([]);
  });

  it('NOT IN với subquery có NULL không ra row nào', () => {
    // orders.customer_id có NULL; NOT IN (..., NULL) không bao giờ đúng
    const sql = 'SELECT full_name FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM orders)';
    expect(ok(sql, 'mysql').rows).toEqual([]);
    expect(ok(sql, 'oracle').rows).toEqual([]);
  });
});

describe('phép chia và chia lấy dư', () => {
  it('chia cho 0: MySQL ra NULL, Oracle ORA-01476', () => {
    expect(one('SELECT 1 / 0', 'mysql')).toBeNull();
    expect(one('SELECT price / 0 FROM products WHERE product_id = 1', 'mysql')).toBeNull();
    expect(fail('SELECT 1 / 0 FROM DUAL', 'oracle').code).toBe('ORA-01476');
    expect(fail('SELECT price / 0 FROM products', 'oracle').code).toBe('ORA-01476');
  });

  it('MySQL: % và MOD cho cùng số dư', () => {
    expect(one('SELECT 7 % 3', 'mysql')).toBe(1);
    expect(one('SELECT MOD(7, 3)', 'mysql')).toBe(1);
    expect(one('SELECT MOD(price, 10000) FROM products WHERE product_id = 1', 'mysql')).toBe(5000);
  });

  it('Oracle: MOD chạy, % là lỗi (mã theo engine, tài liệu chỉ liệt kê + - * /)', () => {
    expect(one('SELECT MOD(7, 3) FROM DUAL', 'oracle')).toBe(1);
    expect(one('SELECT MOD(price, 10000) FROM products WHERE product_id = 1', 'oracle')).toBe(5000);
    fail('SELECT 7 % 3 FROM DUAL', 'oracle');
  });
});

describe('phần engine chưa dạy ra kind unsupported', () => {
  const cases: [string, string][] = [
    ['INTERSECT ALL', 'SELECT name FROM products INTERSECT ALL SELECT name FROM stores'],
    ['window function', 'SELECT name, ROW_NUMBER() OVER (ORDER BY price) FROM products'],
    ['ngoặc quanh JOIN trong FROM', 'SELECT * FROM (products p JOIN order_items i ON i.product_id = p.product_id)'],
  ];
  for (const [name, sql] of cases) {
    for (const d of ['mysql', 'oracle'] as Dialect[]) {
      it(`${d}: ${name}`, () => {
        expect(fail(sql, d).kind).toBe('unsupported');
      });
    }
  }
});
