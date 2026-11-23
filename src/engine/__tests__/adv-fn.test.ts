import { describe, expect, it } from 'vitest';
import { bad, each, sel, sess } from './adv-util';

/**
 * Các function sửa hoặc thêm cho chương báo cáo: REPLACE, NVL, LTRIM, RTRIM, TRIM(... FROM ...), TRUNC(ngày, 'DAY').
 * MySQL: đã kiểm trên MySQL 8.0.46 thật. Oracle: theo tài liệu 19c (SQL Language Reference: từng function).
 */

const T = (name: string, fn: Parameters<typeof each>[2]) => each(it, name, fn);
const one = (d: 'mysql' | 'oracle', expr: string) => sel(sess(d), `SELECT ${expr} AS x FROM ${d === 'oracle' ? 'DUAL' : 'DUAL'}`)[0][0];

describe('REPLACE', () => {
  it('oracle: bỏ tham số thứ ba, hoặc để chuỗi rỗng, thì xóa chuỗi tìm ra', () => {
    expect(one('oracle', "REPLACE('a-b-c', '-')")).toBe('abc');
    expect(one('oracle', "REPLACE('a-b-c', '-', '')")).toBe('abc');
    expect(one('oracle', "REPLACE('a-b-c', '-', '+')")).toBe('a+b+c');
  });

  it('oracle: kết quả rỗng là NULL', () => {
    expect(one('oracle', "REPLACE('aaa', 'a')")).toBeNull();
    expect(one('oracle', "REPLACE('aaa', 'a', '')")).toBeNull();
  });

  it('oracle: chuỗi tìm là NULL thì giữ nguyên chuỗi gốc', () => {
    expect(one('oracle', "REPLACE('abc', NULL, 'x')")).toBe('abc');
  });

  it('mysql: vẫn cần đủ ba tham số, kết quả rỗng là chuỗi rỗng', () => {
    expect(one('mysql', "REPLACE('aaa', 'a', '')")).toBe('');
    expect(bad(sess('mysql'), "SELECT REPLACE('abc', 'b') FROM DUAL").code).toBe('1064');
  });
});

describe('NVL', () => {
  it('oracle: NVL(số, chữ không phải số) là ORA-01722, chữ là số thì đổi được', () => {
    const e = bad(sess('oracle'), "SELECT NVL(salary, 'abc') FROM employees");
    expect(e.code).toBe('ORA-01722');
    expect(one('oracle', "NVL(5, '7')")).toBe(5);
  });

  it('oracle: NVL bình thường', () => {
    expect(sel(sess('oracle'), 'SELECT NVL(dept, \'none\') FROM employees WHERE id = 5')).toEqual([['none']]);
  });
});

describe('LTRIM, RTRIM, TRIM', () => {
  it('oracle: LTRIM và RTRIM nhận chuỗi các chữ cần cắt', () => {
    expect(one('oracle', "LTRIM('xyxabcxy', 'xy')")).toBe('abcxy');
    expect(one('oracle', "RTRIM('xyxabcxy', 'xy')")).toBe('xyxabc');
    expect(one('oracle', "LTRIM('   ab')")).toBe('ab');
  });

  it('mysql: LTRIM và RTRIM chỉ nhận một tham số (1582)', () => {
    expect(bad(sess('mysql'), "SELECT LTRIM('xxab', 'x') FROM DUAL").code).toBe('1582');
  });

  T('TRIM(LEADING | TRAILING | BOTH x FROM s)', (d) => {
    expect(one(d, "TRIM(LEADING 'x' FROM 'xxabcxx')")).toBe('abcxx');
    expect(one(d, "TRIM(TRAILING 'x' FROM 'xxabcxx')")).toBe('xxabc');
    expect(one(d, "TRIM(BOTH 'x' FROM 'xxabcxx')")).toBe('abc');
    expect(one(d, "TRIM('x' FROM 'xxabcxx')")).toBe('abc');
  });

  T('TRIM không có chữ cần cắt thì cắt dấu cách', (d) => {
    expect(one(d, "TRIM(LEADING FROM '  ab ')")).toBe('ab ');
    expect(one(d, "TRIM(BOTH FROM '  ab ')")).toBe('ab');
  });

  T('TRIM của một giá trị NULL là NULL', (d) => {
    expect(one(d, "TRIM(LEADING 'x' FROM NULL)")).toBeNull();
  });

  it('mysql: chữ cần cắt dài nhiều ký tự thì cắt cả cụm', () => {
    expect(one('mysql', "TRIM(LEADING 'xy' FROM 'xyxyabxy')")).toBe('abxy');
  });

  it('oracle: chữ cần cắt dài hơn một ký tự thì ORA-30001', () => {
    expect(bad(sess('oracle'), "SELECT TRIM(LEADING 'xy' FROM 'xyab') FROM DUAL").code).toBe('ORA-30001');
  });

  T('TRIM(a, b) không phải cú pháp hợp lệ', (d) => {
    expect(bad(sess(d), "SELECT TRIM('a', 'b') FROM DUAL").friendly).toContain('TRIM');
  });
});

describe("TRUNC(ngày, 'DAY')", () => {
  it('oracle: cắt về ngày đầu tuần (Chủ nhật)', () => {
    // 2026-03-04 là thứ Tư, Chủ nhật đầu tuần là 2026-03-01.
    expect(one('oracle', "TRUNC(DATE '2026-03-04', 'DAY')")).toEqual({ kind: 'date', iso: '2026-03-01 00:00:00' }.iso);
    expect(one('oracle', "TRUNC(DATE '2026-03-01', 'DAY')")).toEqual('2026-03-01 00:00:00');
  });
});
