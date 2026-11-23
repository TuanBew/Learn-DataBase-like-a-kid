import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect } from '../index';
import { teashop } from '../../data/teashop';

/**
 * Mỗi khác biệt MySQL 8 và Oracle 19c trong phạm vi mốc 1 có test riêng.
 * Kết quả mong đợi viết tay từ dữ liệu trong src/data/teashop.ts và từ hành vi của DBMS thật.
 */

const ok = (sql: string, d: Dialect) => {
  const r = run(sql, teashop, d);
  if (!r.ok) throw new Error(`[${d}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return r.result;
};
const fail = (sql: string, d: Dialect) => {
  const r = run(sql, teashop, d);
  if (r.ok) throw new Error(`[${d}] ${sql}\n   -> expected error, got ${r.result.rows.length} rows`);
  return r.error;
};
/** Chữ nằm trong query tại vị trí span của lỗi. */
const at = (sql: string, e: { span: { s: number; e: number } }) => sql.slice(e.span.s, e.span.e);

const IDS_BY_ID = 'SELECT product_id FROM products ORDER BY product_id';

describe('LIMIT và FETCH', () => {
  it('Oracle không hiểu LIMIT: ORA-00933', () => {
    const sql = 'SELECT * FROM products LIMIT 3';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00933');
    expect(e.dbMessage).toBe('ORA-00933: SQL command not properly ended');
    expect(at(sql, e)).toBe('LIMIT');
  });

  it('MySQL không hiểu FETCH FIRST: lỗi 1064 tại chữ FETCH', () => {
    const sql = 'SELECT * FROM products FETCH FIRST 3 ROWS ONLY';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'FETCH FIRST 3 ROWS ONLY'");
    expect(at(sql, e)).toBe('FETCH');
  });

  it('MySQL: LIMIT 3 lấy 3 row đầu', () => {
    expect(ok(`${IDS_BY_ID} LIMIT 3`, 'mysql').rows).toEqual([[1], [2], [3]]);
  });

  it('MySQL: LIMIT m, n bỏ m row rồi lấy n row', () => {
    expect(ok(`${IDS_BY_ID} LIMIT 2, 3`, 'mysql').rows).toEqual([[3], [4], [5]]);
  });

  it('MySQL: LIMIT n OFFSET m cho cùng kết quả với LIMIT m, n', () => {
    expect(ok(`${IDS_BY_ID} LIMIT 3 OFFSET 2`, 'mysql').rows).toEqual([[3], [4], [5]]);
  });

  it('MySQL: OFFSET vượt quá số row còn lại thì chỉ trả phần còn lại', () => {
    expect(ok(`${IDS_BY_ID} LIMIT 5 OFFSET 12`, 'mysql').rows).toEqual([[13], [14]]);
  });

  it('Oracle: OFFSET m ROWS FETCH NEXT n ROWS ONLY', () => {
    expect(ok(`${IDS_BY_ID} OFFSET 2 ROWS FETCH NEXT 3 ROWS ONLY`, 'oracle').rows).toEqual([[3], [4], [5]]);
  });

  it('Oracle: FETCH FIRST n ROWS ONLY lấy n row đầu', () => {
    expect(ok(`${IDS_BY_ID} FETCH FIRST 3 ROWS ONLY`, 'oracle').rows).toEqual([[1], [2], [3]]);
  });

  it('Oracle: FETCH FIRST ROW ONLY lấy đúng 1 row', () => {
    expect(ok(`${IDS_BY_ID} FETCH FIRST ROW ONLY`, 'oracle').rows).toEqual([[1]]);
  });

  it('Oracle: FETCH FIRST 1 ROWS ONLY (số nhiều) vẫn lấy 1 row', () => {
    expect(ok(`${IDS_BY_ID} FETCH FIRST 1 ROWS ONLY`, 'oracle').rows).toEqual([[1]]);
  });

  it('Oracle: OFFSET vượt quá số row còn lại thì chỉ trả phần còn lại', () => {
    expect(ok(`${IDS_BY_ID} OFFSET 12 ROWS FETCH NEXT 5 ROWS ONLY`, 'oracle').rows).toEqual([[13], [14]]);
  });
});

describe('chuỗi rỗng', () => {
  it("Oracle: '' là NULL", () => {
    expect(ok("SELECT '' FROM DUAL", 'oracle').rows).toEqual([[null]]);
  });

  it("MySQL: '' là chuỗi rỗng, không phải NULL", () => {
    expect(ok("SELECT '' FROM DUAL", 'mysql').rows).toEqual([['']]);
  });

  it("'' IS NULL đúng ở Oracle, sai ở MySQL", () => {
    const sql = "SELECT product_id FROM products WHERE '' IS NULL";
    expect(ok(sql, 'oracle').rows.length).toBe(14);
    expect(ok(sql, 'mysql').rows.length).toBe(0);
  });

  it('Oracle: so sánh với chuỗi rỗng không bao giờ đúng', () => {
    expect(ok("SELECT product_id FROM products WHERE name = ''", 'oracle').rows).toEqual([]);
    expect(ok("SELECT product_id FROM products WHERE name = ''", 'mysql').rows).toEqual([]);
  });
});

describe('so sánh chuỗi', () => {
  it('MySQL: = không phân biệt hoa thường', () => {
    expect(ok("SELECT product_id FROM products WHERE name = 'CÀ PHÊ MUỐI'", 'mysql').rows).toEqual([[6]]);
  });

  it('MySQL: = không phân biệt dấu', () => {
    expect(ok("SELECT product_id FROM products WHERE name = 'ca phe muoi'", 'mysql').rows).toEqual([[6]]);
  });

  it('Oracle: = phân biệt hoa thường', () => {
    expect(ok("SELECT product_id FROM products WHERE name = 'cà phê muối'", 'oracle').rows).toEqual([]);
    expect(ok("SELECT product_id FROM products WHERE name = 'Cà phê muối'", 'oracle').rows).toEqual([[6]]);
  });

  it('Oracle: = phân biệt dấu', () => {
    expect(ok("SELECT product_id FROM products WHERE name = 'Ca phe muoi'", 'oracle').rows).toEqual([]);
  });

  it('MySQL: LIKE không phân biệt hoa thường và dấu', () => {
    const sql = "SELECT product_id FROM products WHERE name LIKE 'ca phe%' ORDER BY product_id";
    expect(ok(sql, 'mysql').rows).toEqual([[3], [6], [12]]);
    expect(ok("SELECT product_id FROM products WHERE name LIKE 'CÀ%' ORDER BY product_id", 'mysql').rows).toEqual([[3], [6], [12]]);
  });

  it('Oracle: LIKE phân biệt hoa thường', () => {
    expect(ok("SELECT product_id FROM products WHERE name LIKE 'cà%'", 'oracle').rows).toEqual([]);
    expect(ok("SELECT product_id FROM products WHERE name LIKE 'Cà%' ORDER BY product_id", 'oracle').rows).toEqual([[3], [6], [12]]);
  });

  it('Oracle: LIKE phân biệt dấu', () => {
    expect(ok("SELECT product_id FROM products WHERE name LIKE 'Ca %'", 'oracle').rows).toEqual([]);
  });

  // Đã kiểm trên MySQL 8.0.46 thật với COLLATE utf8mb4_0900_ai_ci: cả bảy biểu thức ra đúng các số dưới đây.
  it('MySQL: chữ đ bằng chữ d, ở cả = và LIKE', () => {
    const sql = "SELECT 'đ' = 'd', 'Đ' = 'd', 'Đ' = 'đ', 'Hà' = 'ha', 'a' = 'a ', 'Đỗ Linh' LIKE 'd%', 'Đỗ Linh' LIKE 'đ%'";
    expect(ok(sql, 'mysql').rows).toEqual([[1, 1, 1, 1, 0, 1, 1]]);
  });

  // Hệ quả của dòng trên khi xếp: bốn món cùng bán 5 ly, tên có chữ đ đứng ở chỗ của chữ d.
  it('MySQL: ORDER BY xếp chữ đ như chữ d, Oracle xếp chữ đ sau mọi chữ không dấu', () => {
    const sql = "SELECT name FROM products WHERE name LIKE 'Trà %' ORDER BY name";
    const names = (d: Dialect) => ok(sql, d).rows.map((r) => r[0]);
    const my = names('mysql');
    const ora = names('oracle');
    expect(my.indexOf('Trà đào cam sả')).toBeLessThan(my.indexOf('Trà sữa matcha'));
    expect(my.indexOf('Trà đào cam sả')).toBeGreaterThan(my.indexOf('Trà chanh mật ong'));
    expect(ora.indexOf('Trà đào cam sả')).toBeGreaterThan(ora.indexOf('Trà sữa trân châu'));
  });

  it('Oracle: chữ đ khác chữ d', () => {
    expect(ok("SELECT product_id FROM products WHERE 'đ' = 'd'", 'oracle').rows).toEqual([]);
    expect(ok("SELECT COUNT(*) FROM products WHERE 'đ' = 'đ'", 'oracle').rows).not.toEqual([[0]]);
  });
});

describe('dấu nháy', () => {
  it('MySQL: nháy kép là chuỗi', () => {
    const sql = 'SELECT product_id FROM products WHERE category = "Topping" ORDER BY product_id';
    expect(ok(sql, 'mysql').rows).toEqual([[8], [9], [10], [14]]);
    expect(ok('SELECT "abc"', 'mysql').rows).toEqual([['abc']]);
  });

  it('Oracle: nháy kép là tên, nên "Topping" ra ORA-00904', () => {
    const sql = 'SELECT product_id FROM products WHERE category = "Topping"';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00904');
    expect(e.dbMessage).toBe('ORA-00904: "Topping": invalid identifier');
    expect(at(sql, e)).toBe('"Topping"');
  });

  it('Oracle: nháy kép đứng sau SELECT cũng là tên', () => {
    expect(fail('SELECT "abc" FROM DUAL', 'oracle').code).toBe('ORA-00904');
  });

  it('MySQL: backtick bao tên column', () => {
    const r = ok('SELECT `name` FROM products ORDER BY `product_id` LIMIT 1', 'mysql');
    expect(r.columns).toEqual(['name']);
    expect(r.rows).toEqual([['Trà sữa trân châu']]);
  });

  it('Oracle: backtick ra ORA-00911 tại chính ký tự đó', () => {
    const sql = 'SELECT `name` FROM products';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00911');
    expect(e.dbMessage).toBe('ORA-00911: invalid character');
    expect(at(sql, e)).toBe('`');
  });
});

describe('tiêu đề column', () => {
  it('MySQL: giữ nguyên chữ viết hoa thường của tên column và alias', () => {
    const r = ok('SELECT name, price AS GiaBan FROM products LIMIT 1', 'mysql');
    expect(r.columns).toEqual(['name', 'GiaBan']);
  });

  it('Oracle: tên column và alias không có nháy hiện chữ in hoa', () => {
    const r = ok('SELECT name, price AS gia_ban FROM products FETCH FIRST 1 ROW ONLY', 'oracle');
    expect(r.columns).toEqual(['NAME', 'GIA_BAN']);
  });

  it('Oracle: alias trong nháy kép giữ nguyên chữ hoa thường và khoảng trắng', () => {
    const r = ok('SELECT name AS "Tên Món", price AS "gia" FROM products FETCH FIRST 1 ROW ONLY', 'oracle');
    expect(r.columns).toEqual(['Tên Món', 'gia']);
  });

  it('SELECT * ở Oracle cho tiêu đề in hoa, ở MySQL giữ chữ thường', () => {
    expect(ok('SELECT * FROM stores', 'mysql').columns).toEqual(['store_id', 'name', 'district', 'city', 'opened_on']);
    expect(ok('SELECT * FROM stores', 'oracle').columns).toEqual(['STORE_ID', 'NAME', 'DISTRICT', 'CITY', 'OPENED_ON']);
  });

  // Đã kiểm trên Oracle XE 21c thật: tiêu đề của biểu thức ở Oracle bỏ khoảng trắng và in hoa ('PRICE*2', 'COUNT(*)' cho COUNT( * )).
  // Vế MySQL đã kiểm trên MySQL 8.0.46: tiêu đề giữ nguyên chữ gõ, kể cả khoảng trắng và chữ hoa ('price * 2', 'price*2', 'PRICE * 2', 'count( * )').
  it('tiêu đề của biểu thức không có alias', () => {
    expect(ok('SELECT price * 2 FROM products LIMIT 1', 'mysql').columns).toEqual(['price * 2']);
    expect(ok('SELECT price * 2 FROM products FETCH FIRST 1 ROW ONLY', 'oracle').columns).toEqual(['PRICE*2']);
  });

  // Đã kiểm trên MySQL 8.0.46 thật: SELECT 'abc', 1 + 1 cho hai tiêu đề abc và 1 + 1.
  it('MySQL: tiêu đề của một chuỗi đứng riêng là nội dung chuỗi, không kèm dấu nháy', () => {
    expect(ok("SELECT 'abc', 1 + 1", 'mysql').columns).toEqual(['abc', '1 + 1']);
    expect(ok("SELECT 'abc' = 'x'", 'mysql').columns).toEqual(["'abc' = 'x'"]);
    expect(ok("SELECT 'abc' AS chu", 'mysql').columns).toEqual(['chu']);
  });
});

describe('alias của table', () => {
  it('MySQL: AS trước alias của table chạy được', () => {
    const r = ok('SELECT p.name FROM products AS p WHERE p.product_id = 1', 'mysql');
    expect(r.rows).toEqual([['Trà sữa trân châu']]);
  });

  it('Oracle: AS trước alias của table ra ORA-00933 tại chữ AS', () => {
    const sql = 'SELECT p.name FROM products AS p';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00933');
    expect(at(sql, e)).toBe('AS');
  });

  it('Oracle: alias của table không có AS chạy được', () => {
    const r = ok('SELECT p.name FROM products p WHERE p.product_id = 1', 'oracle');
    expect(r.rows).toEqual([['Trà sữa trân châu']]);
  });

  it('MySQL: alias không có AS cũng chạy được', () => {
    expect(ok('SELECT p.name FROM products p WHERE p.product_id = 1', 'mysql').rows).toEqual([['Trà sữa trân châu']]);
  });
});

describe('thứ tự NULL', () => {
  const asc = 'SELECT product_id, calories FROM products ORDER BY calories, product_id';
  const desc = 'SELECT product_id, calories FROM products ORDER BY calories DESC, product_id';
  const ids = (r: { rows: unknown[][] }) => r.rows.map((x) => x[0]);

  // calories NULL ở món 5, 9, 12. Các món còn lại, calories tăng dần: 10, 8, 11, 14, 3, 2, 6, 13, 4, 1, 7.
  const withValueAsc = [10, 8, 11, 14, 3, 2, 6, 13, 4, 1, 7];
  const withValueDesc = [...withValueAsc].reverse();

  it('MySQL: ASC đặt NULL đứng đầu', () => {
    expect(ids(ok(asc, 'mysql'))).toEqual([5, 9, 12, ...withValueAsc]);
  });

  it('Oracle: ASC đặt NULL đứng cuối', () => {
    expect(ids(ok(asc, 'oracle'))).toEqual([...withValueAsc, 5, 9, 12]);
  });

  it('MySQL: DESC đặt NULL đứng cuối', () => {
    expect(ids(ok(desc, 'mysql'))).toEqual([...withValueDesc, 5, 9, 12]);
  });

  it('Oracle: DESC đặt NULL đứng đầu', () => {
    expect(ids(ok(desc, 'oracle'))).toEqual([5, 9, 12, ...withValueDesc]);
  });

  it('Oracle: NULLS FIRST đưa NULL lên đầu khi ASC', () => {
    const sql = 'SELECT product_id FROM products ORDER BY calories NULLS FIRST, product_id';
    expect(ok(sql, 'oracle').rows.map((r) => r[0])).toEqual([5, 9, 12, ...withValueAsc]);
  });

  it('Oracle: NULLS LAST đưa NULL xuống cuối khi DESC', () => {
    const sql = 'SELECT product_id FROM products ORDER BY calories DESC NULLS LAST, product_id';
    expect(ok(sql, 'oracle').rows.map((r) => r[0])).toEqual([...withValueDesc, 5, 9, 12]);
  });

  it('Oracle: NULLS LAST giữ NULL ở cuối khi ASC', () => {
    const sql = 'SELECT product_id FROM products ORDER BY calories ASC NULLS LAST, product_id';
    expect(ok(sql, 'oracle').rows.map((r) => r[0])).toEqual([...withValueAsc, 5, 9, 12]);
  });

  it('MySQL không có NULLS FIRST: lỗi 1064 tại chữ NULLS', () => {
    const sql = 'SELECT product_id FROM products ORDER BY calories NULLS FIRST';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'NULLS FIRST'");
    expect(at(sql, e)).toBe('NULLS');
  });
});

describe('SELECT không có FROM và DUAL', () => {
  it('MySQL: SELECT 1 + 1 chạy', () => {
    expect(ok('SELECT 1 + 1', 'mysql').rows).toEqual([[2]]);
  });

  it('Oracle: SELECT 1 + 1 thiếu FROM nên ra ORA-00923', () => {
    const e = fail('SELECT 1 + 1', 'oracle');
    expect(e.code).toBe('ORA-00923');
    expect(e.dbMessage).toBe('ORA-00923: FROM keyword not found where expected');
  });

  it('SELECT 1 + 1 FROM DUAL chạy ở cả hai dialect', () => {
    expect(ok('SELECT 1 + 1 FROM DUAL', 'mysql').rows).toEqual([[2]]);
    expect(ok('SELECT 1 + 1 FROM DUAL', 'oracle').rows).toEqual([[2]]);
  });
});

describe('toán tử || và function nối chuỗi', () => {
  it('MySQL: || là OR', () => {
    // price > 30000: món 1, 2, 4, 5, 7, 12. price < 10000: món 8.
    const sql = 'SELECT product_id FROM products WHERE price > 30000 || price < 10000 ORDER BY product_id';
    expect(ok(sql, 'mysql').rows).toEqual([[1], [2], [4], [5], [7], [8], [12]]);
  });

  it('MySQL: 0 || 1 bằng 1 (đúng)', () => {
    const v = ok('SELECT 0 || 1', 'mysql').rows[0][0];
    expect(Number(v)).toBe(1);
  });

  it('Oracle: || nối chuỗi', () => {
    const r = ok("SELECT name || ' - ' || category FROM products WHERE product_id = 1", 'oracle');
    expect(r.rows).toEqual([['Trà sữa trân châu - Trà sữa']]);
    expect(ok("SELECT 'a' || 'b' FROM DUAL", 'oracle').rows).toEqual([['ab']]);
  });

  it('Oracle: || với số cho ra chuỗi', () => {
    expect(ok('SELECT 1 || 2 FROM DUAL', 'oracle').rows).toEqual([['12']]);
  });

  it('Oracle: || với NULL coi NULL là chuỗi rỗng', () => {
    const r = ok("SELECT 'cal:' || calories FROM products WHERE product_id = 5", 'oracle');
    expect(r.rows).toEqual([['cal:']]);
  });

  it('MySQL: CONCAT nhận 3 tham số', () => {
    const r = ok("SELECT CONCAT(name, ' - ', category) FROM products WHERE product_id = 1", 'mysql');
    expect(r.rows).toEqual([['Trà sữa trân châu - Trà sữa']]);
  });

  it('Oracle: CONCAT 3 tham số ra ORA-00909', () => {
    const sql = "SELECT CONCAT(name, ' - ', category) FROM products";
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00909');
    expect(e.dbMessage).toBe('ORA-00909: invalid number of arguments');
  });

  it('CONCAT 2 tham số chạy ở cả hai dialect', () => {
    const sql = "SELECT CONCAT(name, category) FROM products WHERE product_id = 8";
    expect(ok(sql, 'mysql').rows).toEqual([['Trân châu đenTopping']]);
    expect(ok(sql, 'oracle').rows).toEqual([['Trân châu đenTopping']]);
  });

  // MySQL: CONCAT trả NULL nếu có tham số NULL (https://dev.mysql.com/doc/refman/8.0/en/string-functions.html). Oracle: nối chuỗi rỗng với toán hạng khác ra chính toán hạng đó, CONCAT tương đương || (https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Concatenation-Operator.html)
  it('CONCAT với NULL: MySQL ra NULL, Oracle bỏ qua NULL', () => {
    const sql = "SELECT CONCAT('cal:', calories) FROM products WHERE product_id = 5";
    expect(ok(sql, 'mysql').rows).toEqual([[null]]);
    expect(ok(sql, 'oracle').rows).toEqual([['cal:']]);
  });
});

describe('function chỉ có ở một dialect', () => {
  it('MySQL: IFNULL thay NULL bằng giá trị khác', () => {
    expect(ok('SELECT IFNULL(calories, 0) FROM products WHERE product_id = 5', 'mysql').rows).toEqual([[0]]);
    expect(ok('SELECT IFNULL(calories, 0) FROM products WHERE product_id = 1', 'mysql').rows).toEqual([[320]]);
  });

  it('Oracle: IFNULL không tồn tại, ra ORA-00904 "IFNULL"', () => {
    const sql = 'SELECT IFNULL(calories, 0) FROM products';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00904');
    expect(e.dbMessage).toBe('ORA-00904: "IFNULL": invalid identifier');
    expect(at(sql, e)).toBe('IFNULL');
  });

  it('Oracle: NVL thay NULL bằng giá trị khác', () => {
    expect(ok('SELECT NVL(calories, 0) FROM products WHERE product_id = 5', 'oracle').rows).toEqual([[0]]);
    expect(ok('SELECT NVL(calories, 0) FROM products WHERE product_id = 1', 'oracle').rows).toEqual([[320]]);
  });

  it('MySQL: NVL không tồn tại, ra lỗi 1305', () => {
    const sql = 'SELECT NVL(calories, 0) FROM products';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1305');
    expect(e.dbMessage).toBe('ERROR 1305 (42000): FUNCTION trasua.NVL does not exist');
    expect(at(sql, e)).toBe('NVL');
  });

  it('COALESCE chạy ở cả hai dialect', () => {
    const sql = 'SELECT COALESCE(calories, -1) FROM products WHERE product_id = 5';
    expect(ok(sql, 'mysql').rows).toEqual([[-1]]);
    expect(ok(sql, 'oracle').rows).toEqual([[-1]]);
  });
});

describe('ngày tháng', () => {
  const sqlText = "SELECT product_id FROM products WHERE launched_on > '2026-02-15' ORDER BY product_id";
  const sqlDate = "SELECT product_id FROM products WHERE launched_on > DATE '2026-02-15' ORDER BY product_id";

  it('MySQL: so sánh ngày với chuỗi ISO chạy được', () => {
    expect(ok(sqlText, 'mysql').rows).toEqual([[12], [13], [14]]);
  });

  // Tài liệu xác nhận chuỗi được đổi ngầm sang DATE bằng default date format (NLS_DATE_FORMAT), https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Type-Comparison-Rules.html ; ORA-01861 = literal không khớp format (https://docs.oracle.com/en/error-help/db/ora-01861/). Tài liệu không nói rõ mã lỗi cho đúng chuỗi ISO này, và không nêu giá trị mặc định DD-MON-RR.
  it('Oracle: so sánh ngày với chuỗi ISO ra ORA-01861', () => {
    const e = fail(sqlText, 'oracle');
    expect(e.code).toBe('ORA-01861');
    expect(e.dbMessage).toBe('ORA-01861: literal does not match format string');
  });

  it("DATE '2026-02-15' chạy ở cả hai dialect", () => {
    expect(ok(sqlDate, 'mysql').rows).toEqual([[12], [13], [14]]);
    expect(ok(sqlDate, 'oracle').rows).toEqual([[12], [13], [14]]);
  });
});

describe('toán tử chia dư', () => {
  it('MySQL: % chạy', () => {
    expect(ok('SELECT 10 % 3', 'mysql').rows).toEqual([[1]]);
  });

  // Tài liệu chỉ liệt kê + - * / là toán tử số học của Oracle (https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Arithmetic-Operators.html) và ORA-00911 là invalid character (https://docs.oracle.com/en/error-help/db/ora-00911/). Tài liệu không nói rõ mã lỗi cho `10 % 3` (CHỜ KIỂM bằng Oracle thật).
  it('Oracle: % là lỗi, tại chính ký tự đó', () => {
    const sql = 'SELECT 10 % 3 FROM DUAL';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00911');
    expect(at(sql, e)).toBe('%');
  });

  it('MOD chạy ở cả hai dialect', () => {
    expect(ok('SELECT MOD(10, 3) FROM DUAL', 'mysql').rows).toEqual([[1]]);
    expect(ok('SELECT MOD(10, 3) FROM DUAL', 'oracle').rows).toEqual([[1]]);
  });
});

describe('tên không tồn tại', () => {
  it('MySQL: sai tên table ra 1146 kèm tên database', () => {
    const sql = 'SELECT * FROM product';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1146');
    expect(e.dbMessage).toBe("ERROR 1146 (42S02): Table 'trasua.product' doesn't exist");
    expect(at(sql, e)).toBe('product');
    expect(e.tip).toContain('products');
  });

  it('Oracle: sai tên table ra ORA-00942', () => {
    const sql = 'SELECT * FROM product';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00942');
    expect(e.dbMessage).toBe('ORA-00942: table or view does not exist');
    expect(at(sql, e)).toBe('product');
    expect(e.tip).toContain('products');
  });

  it('gợi ý tên table gần đúng cho cả stores gõ thiếu', () => {
    expect(fail('SELECT * FROM store', 'mysql').tip).toContain('stores');
    expect(fail('SELECT * FROM customer', 'oracle').tip).toContain('customers');
  });

  it("MySQL: sai tên column trong SELECT ra 1054 'field list'", () => {
    const sql = 'SELECT nam FROM products';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1054');
    expect(e.dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'nam' in 'field list'");
    expect(at(sql, e)).toBe('nam');
    expect(e.tip).toContain('name');
  });

  it("MySQL: sai tên column trong WHERE ra 1054 'where clause'", () => {
    const sql = 'SELECT * FROM products WHERE prise > 1';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1054');
    expect(e.dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'prise' in 'where clause'");
    expect(at(sql, e)).toBe('prise');
    expect(e.tip).toContain('price');
  });

  it("MySQL: sai tên column trong ORDER BY ra 1054 'order clause'", () => {
    const sql = 'SELECT * FROM products ORDER BY prise';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1054');
    expect(e.dbMessage).toBe("ERROR 1054 (42S22): Unknown column 'prise' in 'order clause'");
    expect(at(sql, e)).toBe('prise');
  });

  it('Oracle: sai tên column ở SELECT, WHERE, ORDER BY đều ra ORA-00904', () => {
    const cases: [string, string][] = [
      ['SELECT nam FROM products', 'nam'],
      ['SELECT * FROM products WHERE prise > 1', 'prise'],
      ['SELECT * FROM products ORDER BY prise', 'prise'],
    ];
    for (const [sql, word] of cases) {
      const e = fail(sql, 'oracle');
      expect(e.code).toBe('ORA-00904');
      expect(e.dbMessage).toBe(`ORA-00904: "${word.toUpperCase()}": invalid identifier`);
      expect(at(sql, e)).toBe(word);
    }
  });
});

describe('lỗi cú pháp', () => {
  it('Oracle: thiếu biểu thức sau SELECT ra ORA-00936', () => {
    const sql = 'SELECT FROM products';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00936');
    expect(e.dbMessage).toBe('ORA-00936: missing expression');
  });

  it('Oracle: dấu phẩy thừa trước FROM ra ORA-00936', () => {
    const e = fail('SELECT name, FROM products', 'oracle');
    expect(e.code).toBe('ORA-00936');
  });

  it('Oracle: WHERE không có điều kiện ra ORA-00936', () => {
    expect(fail('SELECT * FROM products WHERE', 'oracle').code).toBe('ORA-00936');
  });

  // MySQL trích phần "near" từ chữ đứng sai chỗ (FROM). Site vẫn gạch chân dấu phẩy thừa để người học dễ sửa.
  it('MySQL: dấu phẩy thừa trước FROM ra 1064, trích từ chữ FROM', () => {
    const sql = 'SELECT name, FROM products';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'FROM products'");
    expect(sql.slice(e.span.s, e.span.e)).toBe(',');
  });

  it('Oracle: thiếu FROM ra ORA-00923', () => {
    const sql = 'SELECT * products';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00923');
    expect(e.dbMessage).toBe('ORA-00923: FROM keyword not found where expected');
  });

  it('MySQL: thiếu FROM ra 1064 tại chữ đứng sai chỗ', () => {
    const e = fail('SELECT name price products', 'mysql');
    expect(e.code).toBe('1064');
  });

  it('Oracle: chuỗi chưa đóng nháy ra ORA-01756', () => {
    const sql = "SELECT * FROM products WHERE name = 'Trà";
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-01756');
    expect(e.dbMessage).toBe('ORA-01756: quoted string not properly terminated');
    expect(at(sql, e)).toBe("'Trà");
  });

  it('MySQL: chuỗi chưa đóng nháy ra 1064 và trích từ dấu nháy mở', () => {
    const sql = "SELECT * FROM products WHERE name = 'Trà";
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near ''Trà'");
  });

  it('Oracle: ORDER thiếu BY ra ORA-00924', () => {
    const sql = 'SELECT * FROM products ORDER price';
    const e = fail(sql, 'oracle');
    expect(e.code).toBe('ORA-00924');
    expect(at(sql, e)).toBe('price');
  });

  it('dấu chấm phẩy cuối câu được chấp nhận', () => {
    expect(ok('SELECT * FROM stores;', 'mysql').rows.length).toBe(4);
    expect(ok('SELECT * FROM stores;', 'oracle').rows.length).toBe(4);
  });
});

describe('query rỗng và nhiều câu lệnh', () => {
  it('MySQL: query rỗng ra 1065', () => {
    const e = fail('', 'mysql');
    expect(e.code).toBe('1065');
    expect(e.dbMessage).toBe('ERROR 1065 (42000): Query was empty');
    expect(fail('   \n ', 'mysql').code).toBe('1065');
  });

  // Đã kiểm trên MySQL 8.0.46 thật bằng PyMySQL: gửi ";" ra 1065, gửi "SELECT 1;" chạy được.
  it('MySQL: chỉ có dấu ; cũng là query rỗng', () => {
    const e = fail(';', 'mysql');
    expect(e.code).toBe('1065');
    expect(e.dbMessage).toBe('ERROR 1065 (42000): Query was empty');
    expect(fail('  ;\n', 'mysql').code).toBe('1065');
    expect(ok('SELECT 1;', 'mysql').rows).toEqual([[1]]);
  });

  // Đã kiểm trên Oracle XE 21c thật qua EXECUTE IMMEDIATE ' ': server báo ORA-00900. Chuỗi rỗng hẳn thì tùy client (PL/SQL báo ORA-06535, OCI báo lỗi độ dài), nên site coi như câu lệnh trắng.
  it('Oracle: query rỗng ra ORA-00900', () => {
    const e = fail('', 'oracle');
    expect(e.code).toBe('ORA-00900');
    expect(e.dbMessage).toBe('ORA-00900: invalid SQL statement');
  });

  // Chạy nhiều câu lệnh một lần cần cờ CLIENT_MULTI_STATEMENTS (https://dev.mysql.com/doc/c-api/8.0/en/c-api-multiple-queries.html). Đã kiểm trên MySQL 8.0.46 bằng PyMySQL (cờ mặc định): lỗi 1064 near 'SELECT 2' at line 1.
  it('MySQL: hai câu lệnh trong một lần chạy ra 1064 tại câu thứ hai', () => {
    const sql = 'SELECT 1 FROM DUAL; SELECT 2 FROM DUAL';
    const e = fail(sql, 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near 'SELECT 2 FROM DUAL'");
    expect(at(sql, e)).toBe('SELECT');
  });

  // Đã kiểm trên Oracle XE 21c thật: server nhận cả chuỗi 'SELECT 1 FROM DUAL; SELECT 2 FROM DUAL' (EXECUTE IMMEDIATE, và sqlplus khi hai câu nằm chung một dòng) báo ORA-00933 ở dấu chấm phẩy.
  it('Oracle: hai câu lệnh trong một lần chạy ra ORA-00933', () => {
    const e = fail('SELECT * FROM stores; SELECT * FROM staff', 'oracle');
    expect(e.code).toBe('ORA-00933');
  });
});

