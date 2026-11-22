import { describe, expect, it } from 'vitest';
import { type Case, bad, fails, rows, val } from './fn-util';

/**
 * Function của MySQL 8. Mọi kết quả mong đợi lấy từ MySQL 8.0.46 chạy thật (mysql -uroot --default-character-set=utf8mb4),
 * gồm cả trường hợp NULL, số âm, chữ có dấu tiếng Việt và mã lỗi.
 * 2026-03-09 là thứ Hai.
 */

const check = (name: string, cases: Case[]) =>
  describe(name, () => {
    it.each(cases)('%s', (expr, expected) => {
      expect(val(expr, 'mysql')).toEqual(expected);
    });
  });

describe('chuỗi', () => {
  check('INSTR, LOCATE, POSITION', [
    ["INSTR('Trà sữa Trà', 'Trà')", 1],
    ["INSTR('Trà sữa', 'SỮA')", 5], // không phân biệt hoa thường
    ["INSTR('á', 'a')", 0], // có phân biệt dấu
    ["INSTR('abc', 'z')", 0],
    ["INSTR(NULL, 'a')", null],
    ["LOCATE('a', 'banana')", 2],
    ["LOCATE('a', 'banana', 3)", 4],
    ["LOCATE(NULL, 'a')", null],
    ["POSITION('an' IN 'banana')", 2],
  ]);
  check('LPAD, RPAD', [
    ["LPAD('5', 3, '0')", '005'],
    ["LPAD('abcde', 3, '0')", 'abc'],
    ["LPAD('x', 5, 'ab')", 'ababx'],
    ["LPAD('đá', 5, '*')", '***đá'],
    ["LPAD('x', -1, 'a')", null],
    ["LPAD(NULL, 3, '0')", null],
    ["RPAD('x', 5, 'ab')", 'xabab'],
    ["RPAD(NULL, 3, '0')", null],
  ]);
  check('REVERSE', [
    ["REVERSE('Trà')", 'àrT'],
    ['REVERSE(123)', '321'],
    ['REVERSE(NULL)', null],
  ]);
  check('CONCAT_WS', [
    ["CONCAT_WS('-', 'a', 'b', 'c')", 'a-b-c'],
    ["CONCAT_WS('-', 'a', NULL, 'c')", 'a-c'],
    ["CONCAT_WS(NULL, 'a', 'b')", null],
    ["CONCAT_WS('-', NULL, NULL)", ''],
  ]);
  check('REPEAT', [
    ["REPEAT('ab', 3)", 'ababab'],
    ["REPEAT('ab', 0)", ''],
    ["REPEAT('ab', -1)", ''],
    ["REPEAT(NULL, 2)", null],
  ]);
  check('ASCII, CHAR', [
    ["ASCII('A')", 65],
    ["ASCII('abc')", 97],
    ["ASCII('')", 0],
    ["ASCII('đ')", 196], // byte đầu của chữ trong UTF-8
    ['ASCII(NULL)', null],
    ['CHAR(65)', 'A'],
    ['CHAR(72, 105)', 'Hi'],
    ['CHAR(65.7)', 'B'],
  ]);
  it('sai số tham số: 1582 hoặc 1064 tùy function', () => {
    expect(bad("INSTR('a')", 'mysql').code).toBe('1582');
    expect(bad("LPAD('a', 3)", 'mysql').code).toBe('1582');
    expect(bad("CONCAT_WS(',')", 'mysql').code).toBe('1582');
    const e = bad("REVERSE('a', 'b')", 'mysql');
    expect(e.code).toBe('1064');
    expect(e.dbMessage).toContain("near ', 'b')'");
    expect(bad('ASCII()', 'mysql').code).toBe('1064');
  });
});

describe('số', () => {
  check('POWER, POW, SQRT, SIGN', [
    ['POWER(2, 10)', 1024],
    ['POW(2, 0.5)', 1.4142135623730951],
    ['POWER(2, -1)', 0.5],
    ['POWER(NULL, 2)', null],
    ['SQRT(16)', 4],
    ['SQRT(-1)', null],
    ['SQRT(NULL)', null],
    ['SIGN(-5)', -1],
    ['SIGN(0)', 0],
    ['SIGN(3.2)', 1],
    ['SIGN(NULL)', null],
  ]);
  it('POWER không tính được: 1690', () => {
    const e = bad('POWER(-8, 1/3)', 'mysql');
    expect(e.code).toBe('1690');
    expect(e.dbMessage).toContain('DOUBLE value is out of range');
  });
  check('ROUND với số chữ số âm', [
    ['ROUND(1234.567, -2)', 1200],
    ['ROUND(1250, -2)', 1300],
    ['ROUND(-1250, -2)', -1300],
    ['ROUND(15, -1)', 20],
    ['ROUND(1234.5678, -5)', 0],
    ['ROUND(-2.5)', -3],
    ['ROUND(1.005, 2)', 1.01],
    ['ROUND(NULL, 1)', null],
  ]);
  check('TRUNCATE', [
    ['TRUNCATE(1234.567, 2)', 1234.56],
    ['TRUNCATE(1234.567, -2)', 1200],
    ['TRUNCATE(-1.999, 1)', -1.9],
    ['TRUNCATE(NULL, 1)', null],
    ['TRUNCATE(5, NULL)', null],
  ]);
  check('GREATEST, LEAST', [
    ['GREATEST(1, 5, 3)', 5],
    ['LEAST(1, 5, 3)', 1],
    ['GREATEST(1, NULL, 3)', null], // có NULL thì ra NULL
    ['LEAST(1, NULL, 3)', null],
    ["GREATEST('apple', 'Banana')", 'Banana'], // so không phân biệt hoa thường
    ["GREATEST(10, '9')", '9'], // có một chuỗi thì so như chuỗi
    ["GREATEST(DATE '2026-01-01', '2027-01-01')", '2027-01-01'],
  ]);
  check('FORMAT', [
    ['FORMAT(1234567.891, 2)', '1,234,567.89'],
    ['FORMAT(1234567.891, 0)', '1,234,568'],
    ['FORMAT(2.5, 0)', '3'],
    ['FORMAT(-1234.567, 2)', '-1,234.57'],
    ['FORMAT(12, 3)', '12.000'],
    ['FORMAT(1234.5, -1)', '1,235'],
    ['FORMAT(NULL, 2)', null],
  ]);
  it('sai số tham số', () => {
    expect(bad('POWER(2)', 'mysql').code).toBe('1582');
    expect(bad('GREATEST(1)', 'mysql').code).toBe('1582');
    expect(bad('TRUNCATE(1)', 'mysql').code).toBe('1064');
    expect(bad('FORMAT(1)', 'mysql').code).toBe('1064');
  });
});

describe('NULL và rẽ nhánh', () => {
  check('IF', [
    ["IF(1 > 0, 'a', 'b')", 'a'],
    ["IF(NULL, 'a', 'b')", 'b'],
    ["IF('abc', 'a', 'b')", 'b'],
    ["IF('1abc', 'a', 'b')", 'a'],
    ['IF(1, NULL, 2)', null],
  ]);
  check('NULLIF, COALESCE', [
    ['NULLIF(1, 1)', null],
    ['NULLIF(1, 2)', 1],
    ["NULLIF('a', 'A')", null], // MySQL so chữ không phân biệt hoa thường
    ["NULLIF(1, '1')", null],
    ["NULLIF('x ', 'x')", 'x '],
    ['NULLIF(NULL, 1)', null],
    ['COALESCE(NULL, NULL, 3, 4)', 3],
    ['COALESCE(NULL, NULL)', null],
    ['COALESCE(7)', 7],
  ]);
  it('IF sai số tham số: 1064', () => {
    expect(bad('IF(1, 2)', 'mysql').code).toBe('1064');
    expect(bad('COALESCE()', 'mysql').code).toBe('1064');
  });
});

describe('đổi data type', () => {
  check('CAST AS SIGNED, UNSIGNED', [
    ["CAST('12' AS SIGNED)", 12],
    ["CAST('12abc' AS SIGNED)", 12],
    ["CAST('abc' AS SIGNED)", 0],
    ['CAST(-3.7 AS SIGNED)', -4],
    ['CAST(2.5 AS SIGNED)', 3],
    ["CAST('3.9' AS SIGNED)", 3], // chuỗi bị cắt, không làm tròn
    ['CAST(NULL AS SIGNED)', null],
    ["CAST('-5' AS UNSIGNED)", '18446744073709551611'],
  ]);
  check('CAST AS DECIMAL', [
    ["CAST('12.345' AS DECIMAL(10, 2))", 12.35],
    ["CAST('12.345' AS DECIMAL(10, 1))", 12.3],
    ['CAST(12.5 AS DECIMAL)', 13],
    ['CAST(-2.5 AS DECIMAL(5, 0))', -3],
    ['CAST(1234 AS DECIMAL(3, 0))', 999],
    ["CAST('abc' AS DECIMAL(5, 2))", 0],
    ['CAST(NULL AS DECIMAL(5, 2))', null],
  ]);
  check('CAST AS CHAR, DATE, DATETIME', [
    ['CAST(123 AS CHAR)', '123'],
    ["CAST('abc' AS CHAR(2))", 'ab'],
    ["CAST('2026-03-09 10:20:30' AS DATE)", '2026-03-09'],
    ["CAST('2026-03-09' AS DATETIME)", '2026-03-09 00:00:00'],
    ["CAST('2026-03-09 10:20' AS DATETIME)", '2026-03-09 10:20:00'],
    ["CAST('20260309' AS DATE)", '2026-03-09'],
    ["CAST('2026-3-9' AS DATE)", '2026-03-09'],
    ['CAST(20260309 AS DATE)', '2026-03-09'],
    ["CAST('2026-02-30' AS DATE)", null], // ngày không có thật
    ["CAST('abc' AS DATE)", null],
    ['CAST(5 AS DATE)', null],
    ['CAST(NULL AS DATE)', null],
  ]);
  check('CONVERT', [
    ["CONVERT('12', SIGNED)", 12],
    ['CONVERT(5, CHAR)', '5'],
    ["CONVERT('1.5', DECIMAL(5, 1))", 1.5],
  ]);
  it('data type của Oracle trong CAST: 1064', () => {
    for (const t of ['INT', 'NUMBER', 'VARCHAR(5)']) {
      const e = bad(`CAST('12' AS ${t})`, 'mysql');
      expect(e.code).toBe('1064');
      expect(e.hint).toBe('bad-cast-type-mysql');
    }
    expect(bad('CAST(1)', 'mysql').code).toBe('1064');
  });
  describe('đổi ngầm chuỗi sang số: dễ tính, kèm cảnh báo 1292', () => {
    check('phép tính và so sánh', [
      ["'12abc' + 1", 13],
      ["'5' + '6'", 11],
      ["'abc' + 1", 1],
      ["'1e2' + 1", 101],
      ["1 = '1abc'", 1],
      ["'abc' = 0", 1],
      ["'2' < '10'", 0], // hai chuỗi thì so như chuỗi
      ["2 < '10'", 1],
    ]);
    it("có cảnh báo, và chỉ MySQL mới có", () => {
      const r = rows("SELECT '12abc' + 1, 1 = '1abc'", 'mysql');
      expect(r.warnings).toEqual([
        { code: 1292, message: "Truncated incorrect DOUBLE value: '12abc'" },
        { code: 1292, message: "Truncated incorrect DOUBLE value: '1abc'" },
      ]);
      expect(rows("SELECT '5' + 1", 'mysql').warnings).toBeUndefined();
      expect(rows("SELECT CAST('abc' AS DATE)", 'mysql').warnings).toEqual([{ code: 1292, message: "Incorrect datetime value: 'abc'" }]);
    });
  });
});

describe('ngày giờ', () => {
  check('DATE_ADD, DATE_SUB', [
    ["DATE_ADD('2026-03-09', INTERVAL 7 DAY)", '2026-03-16'],
    ["DATE_ADD('2026-01-31', INTERVAL 1 MONTH)", '2026-02-28'], // lùi về cuối tháng
    ["DATE_ADD('2024-02-29', INTERVAL 1 YEAR)", '2025-02-28'],
    ["DATE_ADD('2026-03-09', INTERVAL 1 QUARTER)", '2026-06-09'],
    ["DATE_ADD('2026-03-09 10:30:00', INTERVAL 2 HOUR)", '2026-03-09 12:30:00'],
    ["DATE_ADD('2026-03-09', INTERVAL 2 HOUR)", '2026-03-09 02:00:00'], // ngày thuần cộng giờ thì ra ngày giờ
    ["DATE_ADD('2026-03-09', INTERVAL 30 MINUTE)", '2026-03-09 00:30:00'],
    ["DATE_ADD('2026-03-09', INTERVAL 1.5 DAY)", '2026-03-11'],
    ["DATE_SUB(DATE '2026-03-09', INTERVAL 2 WEEK)", '2026-02-23'],
    ["DATE_SUB('2026-03-09', INTERVAL 1 YEAR)", '2025-03-09'],
    ["DATE_ADD(NULL, INTERVAL 1 DAY)", null],
    ["DATE_ADD('2026-03-09', INTERVAL NULL DAY)", null],
    ["DATE_ADD('abc', INTERVAL 1 DAY)", null],
  ]);
  check('d + INTERVAL, d - INTERVAL', [
    ["DATE '2026-03-09' + INTERVAL 1 DAY", '2026-03-10'],
    ["DATE '2026-03-09' - INTERVAL 1 MONTH", '2026-02-09'],
    ["DATE '2026-03-31' - INTERVAL 1 MONTH", '2026-02-28'],
    ["INTERVAL 1 DAY + DATE '2026-03-09'", '2026-03-10'],
    ["'2026-03-09' + INTERVAL 1 DAY", '2026-03-10'],
    ["DATE '2026-03-09' + INTERVAL 1 HOUR", '2026-03-09 01:00:00'],
    ["DATE '2026-03-09' + INTERVAL 2 * 3 DAY", '2026-03-15'],
  ]);
  it('INTERVAL sai: 1064', () => {
    const e = bad("DATE_ADD('2026-03-09', INTERVAL 1 FOO)", 'mysql');
    expect(e.code).toBe('1064');
    expect(e.hint).toBe('bad-interval-unit');
    expect(bad("DATE_ADD('2026-03-09', 1)", 'mysql').code).toBe('1064');
    expect(fails("SELECT DATE_ADD('2026-03-09', INTERVAL 1 DAY_HOUR)", 'mysql').code).toBe('CHUA-HOC');
  });
  check('TIMESTAMPDIFF', [
    ["TIMESTAMPDIFF(DAY, '2026-03-01', '2026-03-09')", 8],
    ["TIMESTAMPDIFF(DAY, '2026-03-09', '2026-03-01')", -8],
    ["TIMESTAMPDIFF(DAY, '2026-03-01 12:00:00', '2026-03-02 11:00:00')", 0], // chưa đủ một ngày
    ["TIMESTAMPDIFF(MONTH, '2026-01-31', '2026-02-28')", 0],
    ["TIMESTAMPDIFF(MONTH, '2026-01-15', '2026-03-14')", 1],
    ["TIMESTAMPDIFF(MONTH, '2026-03-09', '2026-01-10')", -1],
    ["TIMESTAMPDIFF(YEAR, '2020-03-10', '2026-03-09')", 5],
    ["TIMESTAMPDIFF(QUARTER, '2026-01-01', '2026-12-01')", 3],
    ["TIMESTAMPDIFF(WEEK, '2026-03-01', '2026-03-20')", 2],
    ["TIMESTAMPDIFF(HOUR, '2026-03-09 08:00:00', '2026-03-09 10:30:00')", 2],
    ["TIMESTAMPDIFF(MINUTE, '2026-03-09 08:00:00', '2026-03-09 10:30:00')", 150],
    ["TIMESTAMPDIFF(DAY, NULL, '2026-03-01')", null],
  ]);
  check('LAST_DAY, DAYNAME, MONTHNAME, DAYOFWEEK, WEEKDAY, QUARTER', [
    ["LAST_DAY('2026-02-10')", '2026-02-28'],
    ["LAST_DAY('2024-02-10')", '2024-02-29'],
    ["LAST_DAY('2026-03-09 10:00:00')", '2026-03-31'], // bỏ giờ
    ["LAST_DAY('abc')", null],
    ["DAYNAME('2026-03-09')", 'Monday'],
    ["MONTHNAME('2026-03-09')", 'March'],
    ["DAYOFWEEK('2026-03-09')", 2], // Chủ nhật là 1
    ["DAYOFWEEK('2026-03-08')", 1],
    ["WEEKDAY('2026-03-09')", 0], // thứ Hai là 0
    ["WEEKDAY('2026-03-08')", 6],
    ["QUARTER('2026-12-31')", 4],
    ['DAYNAME(NULL)', null],
  ]);
  check('DATE_FORMAT', [
    ["DATE_FORMAT('2026-03-09 14:05:07', '%d/%m/%Y')", '09/03/2026'],
    ["DATE_FORMAT('2026-03-09 14:05:07', '%m/%Y')", '03/2026'],
    ["DATE_FORMAT('2026-03-09 14:05:07', '%W %a %b %M')", 'Monday Mon Mar March'],
    ["DATE_FORMAT('2026-03-09 14:05:07', '%H:%i:%s')", '14:05:07'],
    ["DATE_FORMAT('2026-03-09 14:05:07', '%h %p')", '02 PM'],
    ["DATE_FORMAT('2026-03-09 00:05:07', '%h %p')", '12 AM'],
    ["DATE_FORMAT('2026-03-09 12:05:07', '%h %p')", '12 PM'],
    ["DATE_FORMAT('2026-03-09 14:05:07', '%j %w %y %D %e %c %r')", '068 1 26 9th 9 3 02:05:07 PM'],
    ["DATE_FORMAT('2026-03-09', '%H:%i')", '00:00'],
  ]);
});

describe('function của Oracle ở MySQL: báo 1305 kèm lời chỉ sang function tương đương', () => {
  it.each([
    ["NVL2(1, 2, 3)", 'IF'],
    ["DECODE(1, 1, 2)", 'CASE'],
    ["ADD_MONTHS('2026-01-01', 1)", 'DATE_ADD'],
    ["MONTHS_BETWEEN('2026-01-01', '2026-02-01')", 'TIMESTAMPDIFF'],
    ["NEXT_DAY('2026-03-09', 'MONDAY')", 'WEEKDAY'],
    ["CHR(65)", 'CHAR'],
    ["TO_NUMBER('1')", 'CAST'],
    ["TRUNC(1.5)", 'TRUNCATE'],
  ])('%s', (expr, use) => {
    const e = bad(expr, 'mysql');
    expect(e.code).toBe('1305');
    expect(e.hint).toBe('function-other-dialect');
    expect(e.friendly).toContain(use);
  });
  it('SYSTIMESTAMP viết không ngoặc không có ở MySQL', () => {
    expect(fails('SELECT SYSTIMESTAMP', 'mysql').code).toBe('1054');
  });
});
