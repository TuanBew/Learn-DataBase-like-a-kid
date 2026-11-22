import { describe, expect, it } from 'vitest';
import { type Case, bad, fails, rows, val } from './fn-util';

/**
 * Function của Oracle 19c. Nguồn: Oracle Database SQL Language Reference 19c
 * (https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/): trang của từng function,
 * Format-Models.html (bảng Number Conversions). Chỗ tài liệu không nói rõ có comment "CHỜ KIỂM TÀI LIỆU".
 * Bảng Number Conversions của tài liệu in kết quả đã cắt khoảng trắng đầu, nên test dùng `trim` ở các mẫu có đệm.
 */

const check = (name: string, cases: Case[]) =>
  describe(name, () => {
    it.each(cases)('%s', (expr, expected) => {
      expect(val(expr, 'oracle')).toEqual(expected);
    });
  });

const trimmed = (expr: string) => (val(expr, 'oracle') as string).trim();

describe('chuỗi', () => {
  check('INSTR', [
    ["INSTR('Trà sữa Trà', 'Trà')", 1],
    ["INSTR('Trà sữa', 'SỮA')", 0], // Oracle phân biệt hoa thường
    ["INSTR('banana', 'a', 3)", 4],
    ["INSTR('banana', 'a', 1, 2)", 4], // lần thứ hai
    ["INSTR('banana', 'a', -1)", 6], // vị trí âm: tìm ngược từ cuối
    ["INSTR('abc', 'z')", 0],
    ["INSTR(NULL, 'a')", null],
    ["INSTR('abc', '')", null], // '' là NULL
  ]);
  it('INSTR lần thứ nhỏ hơn 1: ORA-01428', () => {
    expect(bad("INSTR('banana', 'a', 1, 0)", 'oracle').code).toBe('ORA-01428');
  });
  check('LPAD, RPAD', [
    ["LPAD('5', 3, '0')", '005'],
    ["LPAD('abcde', 3, '0')", 'abc'],
    ["LPAD('x', 5, 'ab')", 'ababx'],
    ["LPAD('x', 3)", '  x'], // không có pad thì đệm dấu cách
    ["RPAD('x', 3, 'ab')", 'xab'],
    ["LPAD('x', 0, 'a')", null], // chuỗi rỗng là NULL
    ["LPAD('x', 3, '')", null],
    ["LPAD(NULL, 3, '0')", null],
  ]);
  check('ASCII, CHR', [
    ["ASCII('A')", 65],
    ["ASCII('abc')", 97],
    ['ASCII(NULL)', null],
    ['CHR(65)', 'A'],
    ['CHR(NULL)', null],
    // CHỜ KIỂM TÀI LIỆU: database UTF-8 trả mã byte của chữ (tài liệu chỉ nói "in the database character set")
    ["ASCII('đ')", 50321],
  ]);
  it('sai số tham số: ORA-00909', () => {
    expect(bad("LPAD('x')", 'oracle').code).toBe('ORA-00909');
    expect(bad("INSTR('a')", 'oracle').code).toBe('ORA-00909');
  });
});

describe('số', () => {
  check('POWER, SQRT, SIGN', [
    ['POWER(2, 10)', 1024],
    ['POWER(2, -1)', 0.5],
    ['POWER(NULL, 2)', null],
    ['SQRT(16)', 4],
    ['SQRT(NULL)', null],
    ['SIGN(-5)', -1],
    ['SIGN(0)', 0],
    ['SIGN(NULL)', null],
  ]);
  it('SQRT số âm: ORA-01428', () => {
    const e = bad('SQRT(-1)', 'oracle');
    expect(e.code).toBe('ORA-01428');
    expect(e.dbMessage).toBe("ORA-01428: argument '-1' is out of range");
  });
  check('ROUND, TRUNC với số chữ số âm', [
    ['ROUND(1234.567, -2)', 1200],
    ['ROUND(-2.5)', -3],
    ['ROUND(1.005, 2)', 1.01],
    ['TRUNC(1234.567, -2)', 1200],
    ['TRUNC(-1.999, 1)', -1.9],
    ['TRUNC(1.999)', 1],
    ['TRUNC(NULL, 1)', null],
  ]);
  check('GREATEST, LEAST', [
    ['GREATEST(1, 5, 3)', 5],
    ['LEAST(1, 5, 3)', 1],
    ["GREATEST('a', 'b')", 'b'],
    ["GREATEST(1, '5')", 5], // tham số đầu là số: các tham số sau đổi sang số
    // CHỜ KIỂM TÀI LIỆU: trang GREATEST không nói NULL; Oracle 19c thật cho NULL khi có một tham số NULL
    ['GREATEST(1, NULL, 3)', null],
    ['LEAST(1, NULL, 3)', null],
  ]);
});

describe('NULL và rẽ nhánh', () => {
  check('NVL2, DECODE, NULLIF, COALESCE', [
    ["NVL2(1, 'a', 'b')", 'a'],
    ["NVL2(NULL, 'a', 'b')", 'b'],
    ["DECODE(1, 1, 'a', 'b')", 'a'],
    ["DECODE(3, 1, 'a', 2, 'b', 'z')", 'z'], // mặc định
    ["DECODE(3, 1, 'a', 2, 'b')", null], // không có mặc định
    ["DECODE(NULL, NULL, 'x', 'y')", 'x'], // DECODE coi NULL bằng NULL
    ["DECODE('1', 1, 'ok', 'no')", 'ok'],
    ['NULLIF(1, 1)', null],
    ["NULLIF('a', 'A')", 'a'], // Oracle phân biệt hoa thường
    ['COALESCE(NULL, NULL, 3)', 3],
  ]);
  it('COALESCE cần từ 2 tham số', () => {
    expect(bad('COALESCE(1)', 'oracle').code).toBe('ORA-00909');
  });
});

describe('đổi data type', () => {
  check('TO_NUMBER', [
    ["TO_NUMBER('12')", 12],
    ["TO_NUMBER('12.5')", 12.5],
    ["TO_NUMBER(' 7 ')", 7],
    ["TO_NUMBER('1E3')", 1000],
    ["TO_NUMBER('-5')", -5],
    ['TO_NUMBER(NULL)', null],
  ]);
  it('chuỗi không phải số: ORA-01722, cả khi đổi ngầm', () => {
    expect(bad("TO_NUMBER('12abc')", 'oracle').code).toBe('ORA-01722');
    expect(bad("'12abc' + 1", 'oracle').code).toBe('ORA-01722');
    expect(fails("SELECT id FROM s WHERE qty > '3abc'", 'oracle').code).toBe('ORA-01722');
    expect(rows("SELECT id FROM s WHERE qty = '4'", 'oracle').rows).toEqual([[6]]);
    expect(rows("SELECT 1 FROM dual", 'oracle').warnings).toBeUndefined();
  });
  check('CAST', [
    ["CAST('12' AS NUMBER)", 12],
    ["CAST('12.567' AS NUMBER(10, 2))", 12.57],
    ['CAST(12.5 AS NUMBER(5))', 13],
    ['CAST(123 AS VARCHAR2(10))', '123'],
    ["CAST('abcdef' AS VARCHAR2(3))", 'abc'],
    ['CAST(0.5 AS VARCHAR2(5))', '.5'],
    ["CAST(DATE '2026-03-09' AS VARCHAR2(20))", '09-MAR-26'],
    ["CAST('09-MAR-26' AS DATE)", '2026-03-09 00:00:00'],
    ['CAST(NULL AS NUMBER)', null],
  ]);
  it('CAST sai: ORA-01722, ORA-01438, ORA-01861, ORA-00932, ORA-00902', () => {
    expect(bad("CAST('abc' AS NUMBER)", 'oracle').code).toBe('ORA-01722');
    expect(bad('CAST(1234 AS NUMBER(3))', 'oracle').code).toBe('ORA-01438');
    expect(bad("CAST('2026-03-09' AS DATE)", 'oracle').code).toBe('ORA-01861');
    expect(bad('CAST(5 AS DATE)', 'oracle').dbMessage).toBe('ORA-00932: inconsistent datatypes: expected DATE got NUMBER');
    // CHỜ KIỂM TÀI LIỆU: tài liệu có ORA-00902 cho data type sai, chưa thấy ví dụ riêng cho CAST sang SIGNED
    const e = bad("CAST('1' AS SIGNED)", 'oracle');
    expect(e.code).toBe('ORA-00902');
    expect(e.hint).toBe('bad-cast-type-oracle');
    expect(bad("CONVERT('1', SIGNED)", 'oracle').hint).toBe('function-other-dialect');
  });
  describe('TO_CHAR với số', () => {
    // Số dương có một ô dấu đứng đầu, số âm có dấu trừ sát chữ số đầu. Số 9 thừa ra dấu cách.
    it('9 và dấu phẩy', () => {
      expect(val("TO_CHAR(1234, '999,999,999')", 'oracle')).toBe('       1,234');
      expect(val("TO_CHAR(1234, '999G999G999')", 'oracle')).toBe('       1,234');
      expect(val("TO_CHAR(-1234567, '999,999,999')", 'oracle')).toBe('  -1,234,567');
      expect(val("TO_CHAR(-5, '999')", 'oracle')).toBe('  -5');
    });
    check('FM bỏ khoảng trắng', [
      ["TO_CHAR(1234, 'FM999,999,999')", '1,234'],
      ["TO_CHAR(1234567.891, 'FM999,999,999.00')", '1,234,567.89'],
      ["TO_CHAR(0.5, 'FM999990.00')", '0.50'],
      ["TO_CHAR(1234.5, 'FM999990.00')", '1234.50'],
      ["TO_CHAR(0, 'FM999990.00')", '0.00'],
    ]);
    check('0 giữ số 0 đứng đầu', [
      ["TO_CHAR(5, '0000')", ' 0005'],
      ["TO_CHAR(12345, '999')", '####'], // số dài hơn mẫu
    ]);
    it('các dòng của bảng Number Conversions trong tài liệu', () => {
      expect(trimmed("TO_CHAR(0, '99.99')")).toBe('.00');
      expect(trimmed("TO_CHAR(0.1, '99.99')")).toBe('.10');
      expect(trimmed("TO_CHAR(-0.2, '99.99')")).toBe('-.20');
      expect(trimmed("TO_CHAR(0, '90.99')")).toBe('0.00');
      expect(trimmed("TO_CHAR(-0.2, '90.99')")).toBe('-0.20');
      expect(trimmed("TO_CHAR(0, '9999')")).toBe('0');
      expect(trimmed("TO_CHAR(123.456, '999.999')")).toBe('123.456');
      expect(trimmed("TO_CHAR(-123.456, '999.999')")).toBe('-123.456');
      expect(val("TO_CHAR(123.456, 'FM999.009')", 'oracle')).toBe('123.456');
      expect(val("TO_CHAR(123.45, 'FM999.009')", 'oracle')).toBe('123.45');
      expect(val("TO_CHAR(123.0, 'FM999.009')", 'oracle')).toBe('123.00');
    });
    it('không có mẫu: bỏ số 0 đứng trước dấu phẩy, như Oracle', () => {
      expect(val('TO_CHAR(0.5)', 'oracle')).toBe('.5');
      expect(val('TO_CHAR(-0.5)', 'oracle')).toBe('-.5');
      expect(val('TO_CHAR(12)', 'oracle')).toBe('12');
      expect(val('TO_CHAR(NULL)', 'oracle')).toBeNull();
    });
    it('mẫu lạ: ORA-01481', () => {
      expect(bad("TO_CHAR(1, 'abc')", 'oracle').code).toBe('ORA-01481');
    });
    // CHỜ KIỂM TÀI LIỆU: tài liệu không có ví dụ FM mà mọi ô sau dấu chấm đều là 9
    it('FM9999.99 với số nguyên', () => {
      expect(val("TO_CHAR(1234, 'FM9999.99')", 'oracle')).toBe('1234.');
    });
  });
});

describe('ngày giờ', () => {
  check('ADD_MONTHS', [
    ["ADD_MONTHS(DATE '2026-01-31', 1)", '2026-02-28'], // tháng sau ngắn hơn: về cuối tháng
    ["ADD_MONTHS(DATE '2026-02-28', 1)", '2026-03-31'], // ngày cuối tháng giữ là ngày cuối tháng
    ["ADD_MONTHS(DATE '2026-03-09', -2)", '2026-01-09'],
    ["ADD_MONTHS(DATE '2026-03-09', 12)", '2027-03-09'],
    ["ADD_MONTHS(NULL, 1)", null],
    ["ADD_MONTHS(DATE '2026-03-09', NULL)", null],
  ]);
  check('MONTHS_BETWEEN', [
    ["MONTHS_BETWEEN(DATE '2026-03-09', DATE '2026-01-09')", 2], // cùng ngày trong tháng: số nguyên
    ["MONTHS_BETWEEN(DATE '2026-03-31', DATE '2026-02-28')", 1], // cùng là ngày cuối tháng
    ["MONTHS_BETWEEN(DATE '2026-01-09', DATE '2026-03-09')", -2],
    ["ROUND(MONTHS_BETWEEN(DATE '2026-03-09', DATE '2026-01-24'), 4)", 1.5161], // phần lẻ tính trên tháng 31 ngày
    ["ROUND(MONTHS_BETWEEN(TO_DATE('02-02-1995', 'MM-DD-YYYY'), TO_DATE('01-01-1995', 'MM-DD-YYYY')), 8)", 1.03225806], // ví dụ trong tài liệu
    ['MONTHS_BETWEEN(NULL, SYSDATE)', null],
  ]);
  check('LAST_DAY, NEXT_DAY', [
    ["LAST_DAY(DATE '2026-02-10')", '2026-02-28'],
    ["LAST_DAY(TO_DATE('2026-03-09 10:30:00', 'YYYY-MM-DD HH24:MI:SS'))", '2026-03-31 10:30:00'], // giữ giờ
    ["NEXT_DAY(DATE '2026-03-09', 'MONDAY')", '2026-03-16'], // thứ Hai kế tiếp, không tính ngày hôm nay
    ["NEXT_DAY(DATE '2026-03-09', 'FRI')", '2026-03-13'],
    ["NEXT_DAY(DATE '2026-03-09', 'sunday')", '2026-03-15'],
    ["NEXT_DAY(DATE '2026-03-09', NULL)", null],
  ]);
  it('NEXT_DAY tên thứ lạ: ORA-01846', () => {
    expect(bad("NEXT_DAY(DATE '2026-03-09', 'XYZ')", 'oracle').code).toBe('ORA-01846');
  });
  check('TRUNC với ngày', [
    ["TRUNC(DATE '2026-03-09', 'MM')", '2026-03-01 00:00:00'],
    ["TRUNC(DATE '2026-03-09', 'mon')", '2026-03-01 00:00:00'],
    ["TRUNC(DATE '2026-03-09', 'YYYY')", '2026-01-01 00:00:00'],
    ["TRUNC(DATE '2026-05-09', 'Q')", '2026-04-01 00:00:00'],
    ["TRUNC(DATE '2026-03-09', 'DD')", '2026-03-09 00:00:00'],
    ['TRUNC(SYSDATE)', '2026-03-09 00:00:00'],
    ["TRUNC(NULL, 'MM')", null],
  ]);
  it('TRUNC mẫu lạ: ORA-01899', () => {
    expect(bad("TRUNC(DATE '2026-03-09', 'XX')", 'oracle').code).toBe('ORA-01899');
  });
  check('TO_CHAR với ngày (SYSDATE = 2026-03-09 10:30:00, thứ Hai)', [
    ["TO_CHAR(SYSDATE, 'DD/MM/YYYY')", '09/03/2026'],
    ["TO_CHAR(SYSDATE, 'MM/YYYY')", '03/2026'],
    ["TO_CHAR(SYSDATE, 'Q')", '1'],
    ["TO_CHAR(SYSDATE, 'DY')", 'MON'],
    ["TO_CHAR(SYSDATE, 'Dy')", 'Mon'],
    ["TO_CHAR(SYSDATE, 'MON')", 'MAR'],
    ["TO_CHAR(SYSDATE, 'DAY')", 'MONDAY   '], // đệm cho đủ 9 chữ
    ["TO_CHAR(SYSDATE, 'MONTH')", 'MARCH    '],
    ["TO_CHAR(SYSDATE, 'FMDAY')", 'MONDAY'], // FM bỏ phần đệm
    ["TO_CHAR(SYSDATE, 'FMMonth')", 'March'],
    ["TO_CHAR(SYSDATE, 'HH24:MI:SS')", '10:30:00'],
    ["TO_CHAR(SYSDATE, 'HH12:MI AM')", '10:30 AM'],
    ["TO_CHAR(TO_DATE('2026-03-09 14:05:07', 'YYYY-MM-DD HH24:MI:SS'), 'HH12:MI:SS PM')", '02:05:07 PM'],
    ["TO_CHAR(TO_DATE('2026-03-09 00:05:07', 'YYYY-MM-DD HH24:MI:SS'), 'HH12 AM')", '12 AM'],
    ["TO_CHAR(SYSDATE, 'FMDD/FMMM/YYYY')", '9/03/2026'], // FM bật rồi tắt ở FM thứ hai
    ["TO_CHAR(SYSDATE, 'DDD')", '068'],
    ["TO_CHAR(SYSDATE, 'YYYY-MM')", '2026-03'],
  ]);
  check('SYSTIMESTAMP', [["TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')", '2026-03-09 10:30:00']]);
  check('d + n, d - n, d1 - d2', [
    ["DATE '2026-03-09' + 7", '2026-03-16'],
    ["DATE '2026-03-09' - 7", '2026-03-02'],
    ["7 + DATE '2026-03-09'", '2026-03-16'],
    ["DATE '2026-03-09' + 1.5", '2026-03-10 12:00:00'],
    ["DATE '2026-03-09' - DATE '2026-03-01'", 8],
    ["DATE '2026-03-09' - NULL", null],
  ]);
  it('ngày cộng ngày: ORA-00975', () => {
    expect(bad("DATE '2026-03-09' + DATE '2026-03-01'", 'oracle').code).toBe('ORA-00975');
  });
  check('TO_DATE không có mẫu dùng DD-MON-RR', [["TO_DATE('09-MAR-26')", '2026-03-09 00:00:00']]);
});

describe('function của MySQL ở Oracle: báo ORA-00904 kèm lời chỉ sang function tương đương', () => {
  it.each([
    ["LOCATE('a', 'banana')", 'INSTR'],
    ["POSITION('a' IN 'banana')", 'INSTR'],
    ["REVERSE('abc')", 'SUBSTR'],
    ["CONCAT_WS('-', 'a', 'b')", '||'],
    ["REPEAT('a', 3)", 'RPAD'],
    ['CHAR(65)', 'CHR'],
    ['POW(2, 3)', 'POWER'],
    ['TRUNCATE(1.5, 0)', 'TRUNC'],
    ['FORMAT(1234.5, 2)', 'TO_CHAR'],
    ["IF(1 = 1, 'a', 'b')", 'CASE'],
    ["DATE_ADD(DATE '2026-03-09', INTERVAL 1 DAY)", 'ADD_MONTHS'],
    ["DATE_SUB(DATE '2026-03-09', INTERVAL 1 DAY)", 'ADD_MONTHS'],
    ["TIMESTAMPDIFF(DAY, DATE '2026-03-01', DATE '2026-03-09')", 'MONTHS_BETWEEN'],
    ['DAYNAME(SYSDATE)', 'TO_CHAR'],
    ['QUARTER(SYSDATE)', "'Q'"],
    ["CONVERT('1', SIGNED)", 'CAST'],
  ])('%s', (expr, use) => {
    const e = bad(expr, 'oracle');
    expect(e.code).toBe('ORA-00904');
    expect(e.hint).toBe('function-other-dialect');
    expect(e.friendly).toContain(use);
  });
});
