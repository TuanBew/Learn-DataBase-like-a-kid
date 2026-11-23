import { describe, expect, it } from 'vitest';
import { functionCatalog } from '../index';
import type { Dialect } from '../index';
import { rows } from './fn-util';

/**
 * Mỗi tên trong danh mục phải gọi được. Thêm function mới thì thêm một mẫu gọi vào đây,
 * không thì test "mọi tên đều có mẫu" báo thiếu.
 * Mẫu viết không ngoặc cho function bare (SYSDATE...). Mọi mẫu chạy trên table `s` của fn-util.ts.
 */
const COMMON: Record<string, string> = {
  ABS: 'ABS(-1)',
  ASCII: "ASCII('A')",
  AVG: 'AVG(qty)',
  CAST: "CAST('1' AS CHAR(3))",
  CEIL: 'CEIL(1.2)',
  COALESCE: 'COALESCE(NULL, 1)',
  CONCAT: "CONCAT('a', 'b')",
  COUNT: 'COUNT(qty)',
  CURRENT_DATE: 'CURRENT_DATE',
  CURRENT_TIMESTAMP: 'CURRENT_TIMESTAMP',
  EXTRACT: 'EXTRACT(YEAR FROM d)',
  FLOOR: 'FLOOR(1.8)',
  GREATEST: 'GREATEST(1, 2)',
  GROUPING: 'GROUPING(region)',
  INSTR: "INSTR('abc', 'b')",
  LAST_DAY: 'LAST_DAY(d)',
  LEAST: 'LEAST(1, 2)',
  LENGTH: "LENGTH('abc')",
  LOWER: "LOWER('ABC')",
  LPAD: "LPAD('a', 3, '*')",
  LTRIM: "LTRIM(' a')",
  MAX: 'MAX(qty)',
  MIN: 'MIN(qty)',
  MOD: 'MOD(7, 3)',
  NULLIF: 'NULLIF(1, 2)',
  POWER: 'POWER(2, 3)',
  REPLACE: "REPLACE('abc', 'b', 'x')",
  ROUND: 'ROUND(1.5)',
  RPAD: "RPAD('a', 3, '*')",
  RTRIM: "RTRIM('a ')",
  SIGN: 'SIGN(-3)',
  SQRT: 'SQRT(9)',
  SUBSTR: "SUBSTR('abc', 2)",
  SUM: 'SUM(qty)',
  TRIM: "TRIM(' a ')",
  UPPER: "UPPER('abc')",
};

const SAMPLES: Record<Dialect, Record<string, string>> = {
  mysql: {
    ...COMMON,
    CEILING: 'CEILING(1.2)',
    CHAR: 'CHAR(65)',
    CHAR_LENGTH: "CHAR_LENGTH('abc')",
    CONCAT_WS: "CONCAT_WS(',', 'a', 'b')",
    CONVERT: "CONVERT('1', SIGNED)",
    CURDATE: 'CURDATE()',
    DATE: 'DATE(d)',
    DATEDIFF: "DATEDIFF(d, '2026-01-01')",
    DATE_ADD: 'DATE_ADD(d, INTERVAL 1 DAY)',
    DATE_FORMAT: "DATE_FORMAT(d, '%Y-%m')",
    DATE_SUB: 'DATE_SUB(d, INTERVAL 1 DAY)',
    DAY: 'DAY(d)',
    DAYNAME: 'DAYNAME(d)',
    DAYOFWEEK: 'DAYOFWEEK(d)',
    FORMAT: 'FORMAT(1234.5, 1)',
    GROUP_CONCAT: 'GROUP_CONCAT(prod)',
    HOUR: "HOUR('2026-03-09 10:00:00')",
    IF: "IF(qty > 3, 'a', 'b')",
    IFNULL: 'IFNULL(qty, 0)',
    LEFT: "LEFT('abc', 2)",
    LOCATE: "LOCATE('b', 'abc')",
    MONTH: 'MONTH(d)',
    MONTHNAME: 'MONTHNAME(d)',
    NOW: 'NOW()',
    POSITION: "POSITION('b' IN 'abc')",
    POW: 'POW(2, 3)',
    QUARTER: 'QUARTER(d)',
    REPEAT: "REPEAT('a', 2)",
    REVERSE: "REVERSE('abc')",
    RIGHT: "RIGHT('abc', 2)",
    STR_TO_DATE: "STR_TO_DATE('09/03/2026', '%d/%m/%Y')",
    SYSDATE: 'SYSDATE()',
    SUBSTRING: "SUBSTRING('abc', 2)",
    TIMESTAMPDIFF: 'TIMESTAMPDIFF(DAY, d, NOW())',
    TRUNCATE: 'TRUNCATE(1.55, 1)',
    WEEKDAY: 'WEEKDAY(d)',
    YEAR: 'YEAR(d)',
  },
  oracle: {
    ...COMMON,
    ADD_MONTHS: 'ADD_MONTHS(d, 1)',
    CHR: 'CHR(65)',
    DECODE: "DECODE(qty, 1, 'a', 'b')",
    INITCAP: "INITCAP('abc')",
    LISTAGG: "LISTAGG(prod, ',') WITHIN GROUP (ORDER BY id)",
    MONTHS_BETWEEN: 'MONTHS_BETWEEN(SYSDATE, d)',
    NEXT_DAY: "NEXT_DAY(d, 'MONDAY')",
    NVL: 'NVL(qty, 0)',
    NVL2: "NVL2(qty, 'a', 'b')",
    SYSDATE: 'SYSDATE',
    SYSTIMESTAMP: 'SYSTIMESTAMP',
    TO_CHAR: "TO_CHAR(d, 'YYYY-MM')",
    TO_DATE: "TO_DATE('09/03/2026', 'DD/MM/YYYY')",
    TO_NUMBER: "TO_NUMBER('12')",
    TRUNC: "TRUNC(d, 'MM')",
    USER: 'USER',
  },
};

describe.each<Dialect>(['mysql', 'oracle'])('functionCatalog(%s)', (d) => {
  const catalog = functionCatalog(d);
  const names = catalog.map((f) => f.name);

  it('không trùng tên, xếp theo tên', () => {
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('mọi tên đều có mẫu gọi, và mọi mẫu đều có trong danh mục', () => {
    expect([...names].sort()).toEqual(Object.keys(SAMPLES[d]).sort());
  });

  it('min và max hợp lệ', () => {
    for (const f of catalog) {
      expect(f.min).toBeGreaterThanOrEqual(0);
      if (f.max !== null) expect(f.max).toBeGreaterThanOrEqual(f.min);
    }
  });

  it.each(names)('%s gọi được', (name) => {
    const expr = SAMPLES[d][name];
    const rollup = d === 'oracle' ? ' GROUP BY ROLLUP(region)' : ' GROUP BY region WITH ROLLUP';
    const sql = `SELECT ${expr} FROM s${name === 'GROUPING' ? rollup : ''}`;
    expect(() => rows(sql, d)).not.toThrow();
  });

  it('function gom có kind aggregate, function thường có kind scalar', () => {
    const kinds = Object.fromEntries(catalog.map((f) => [f.name, f.kind]));
    for (const n of ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUPING', d === 'mysql' ? 'GROUP_CONCAT' : 'LISTAGG']) expect(kinds[n]).toBe('aggregate');
    for (const n of ['UPPER', 'ROUND', 'CAST', 'EXTRACT']) expect(kinds[n]).toBe('scalar');
  });
});

describe('khác biệt giữa hai dialect trong danh mục', () => {
  const find = (d: Dialect, n: string) => functionCatalog(d).find((f) => f.name === n);
  it('function chỉ có một bên', () => {
    expect(find('mysql', 'GROUP_CONCAT')).toBeDefined();
    expect(find('oracle', 'GROUP_CONCAT')).toBeUndefined();
    expect(find('oracle', 'DECODE')).toBeDefined();
    expect(find('mysql', 'DECODE')).toBeUndefined();
  });
  it('số tham số khác nhau theo dialect', () => {
    expect(find('mysql', 'LPAD')).toMatchObject({ min: 3, max: 3 });
    expect(find('oracle', 'LPAD')).toMatchObject({ min: 2, max: 3 });
    expect(find('mysql', 'CONCAT')).toMatchObject({ min: 1, max: null });
    expect(find('oracle', 'CONCAT')).toMatchObject({ min: 2, max: 2 });
    expect(find('mysql', 'TIMESTAMPDIFF')).toMatchObject({ min: 3, max: 3 });
  });
});
