import { describe, expect, it } from 'vitest';
import { run } from '../index';
import { fails, rows, sales } from './fn-util';

/**
 * Gom nhóm mở rộng. Table `s` (xem fn-util.ts): 7 row, region có một NULL thật, qty có một NULL.
 * Kết quả MySQL lấy từ MySQL 8.0.46 chạy thật. Oracle theo tài liệu 19c (LISTAGG, ROLLUP, GROUPING).
 */

const my = (sql: string) => rows(sql, 'mysql').rows;
const or = (sql: string) => rows(sql, 'oracle').rows;

describe('GROUP_CONCAT (MySQL)', () => {
  it('mặc định nối bằng dấu phẩy, bỏ NULL, giữ thứ tự row', () => {
    expect(my('SELECT GROUP_CONCAT(prod), GROUP_CONCAT(qty) FROM s')).toEqual([['Tra,Sua,Sua,Tra,Tra,Tra,Tra', '5,3,7,2,4,1']]);
  });
  it('DISTINCT, ORDER BY và SEPARATOR', () => {
    expect(my('SELECT GROUP_CONCAT(DISTINCT prod) FROM s')).toEqual([['Tra,Sua']]);
    expect(my("SELECT GROUP_CONCAT(prod ORDER BY qty DESC SEPARATOR ' | ') FROM s")).toEqual([['Sua | Tra | Tra | Sua | Tra | Tra | Tra']]); // NULL xếp cuối khi giảm dần
    expect(my("SELECT GROUP_CONCAT(prod SEPARATOR '') FROM s")).toEqual([['TraSuaSuaTraTraTraTra']]);
    expect(my('SELECT region, GROUP_CONCAT(DISTINCT prod ORDER BY prod DESC) FROM s GROUP BY region ORDER BY region')).toEqual([
      [null, 'Tra'],
      ['Bac', 'Tra,Sua'],
      ['Nam', 'Tra,Sua'],
    ]);
  });
  it('nhiều tham số nối với nhau, row có NULL bị bỏ cả row', () => {
    expect(my("SELECT GROUP_CONCAT(region, '-', prod) FROM s")).toEqual([['Nam-Tra,Bac-Sua,Nam-Sua,Bac-Tra,Nam-Tra,Bac-Tra']]);
    expect(my('SELECT GROUP_CONCAT(DISTINCT region, prod) FROM s')).toEqual([['NamTra,BacSua,NamSua,BacTra']]);
  });
  it('không còn row nào thì ra NULL', () => {
    expect(my('SELECT GROUP_CONCAT(qty) FROM s WHERE id < 0')).toEqual([[null]]);
    expect(my('SELECT GROUP_CONCAT(NULL) FROM s')).toEqual([[null]]);
  });
  it('dài hơn 1024 byte thì bị cắt, kèm cảnh báo 1260', () => {
    const r = rows("SELECT LENGTH(GROUP_CONCAT(REPEAT('x', 300) SEPARATOR ',')) FROM s", 'mysql');
    expect(r.rows).toEqual([[1024]]);
    expect(r.warnings).toEqual([{ code: 1260, message: 'Row 4 was cut by GROUP_CONCAT()' }]);
  });
  it('lỗi cú pháp và sai dialect', () => {
    expect(fails('SELECT GROUP_CONCAT(qty SEPARATOR) FROM s', 'mysql').code).toBe('1064');
    expect(fails('SELECT GROUP_CONCAT() FROM s', 'mysql').code).toBe('1064');
    expect(fails('SELECT id FROM s WHERE GROUP_CONCAT(prod) = 1', 'mysql').code).toBe('1111');
    const e = fails('SELECT GROUP_CONCAT(prod) FROM s', 'oracle');
    expect(e.code).toBe('ORA-00904');
    expect(e.friendly).toContain('LISTAGG');
  });
});

describe('LISTAGG (Oracle)', () => {
  it('nối theo ORDER BY, mặc định không có chuỗi nối', () => {
    expect(or("SELECT prod, LISTAGG(qty, ',') WITHIN GROUP (ORDER BY qty DESC) FROM s GROUP BY prod ORDER BY prod")).toEqual([
      ['Sua', '7,3'],
      ['Tra', '5,4,2,1'], // NULL bị bỏ
    ]);
    expect(or('SELECT LISTAGG(prod) WITHIN GROUP (ORDER BY id) FROM s')).toEqual([['TraSuaSuaTraTraTraTra']]);
  });
  it('DISTINCT (19c)', () => {
    expect(or("SELECT LISTAGG(DISTINCT prod, ', ') WITHIN GROUP (ORDER BY prod) FROM s")).toEqual([['Sua, Tra']]);
  });
  it('không còn row nào thì ra NULL', () => {
    expect(or("SELECT LISTAGG(prod, ',') WITHIN GROUP (ORDER BY id) FROM s WHERE id < 0")).toEqual([[null]]);
  });
  it('dài hơn 4000 byte: ORA-01489', () => {
    const e = fails("SELECT LISTAGG(RPAD('x', 3000, 'x'), ',') WITHIN GROUP (ORDER BY id) FROM s", 'oracle');
    expect(e.code).toBe('ORA-01489');
  });
  it('lỗi: thiếu WITHIN GROUP, sai dialect', () => {
    // CHỜ KIỂM TÀI LIỆU: trang LISTAGG chỉ cho cú pháp có WITHIN GROUP, không nêu mã lỗi khi thiếu
    expect(fails("SELECT LISTAGG(prod, ',') FROM s", 'oracle').hint).toBe('listagg-within');
    const e = fails("SELECT LISTAGG(prod, ',') WITHIN GROUP (ORDER BY id) FROM s", 'mysql');
    expect(e.code).toBe('1305');
    expect(e.friendly).toContain('GROUP_CONCAT');
  });
});

describe('ROLLUP và GROUPING', () => {
  it('MySQL: WITH ROLLUP thêm dòng tổng, dòng tổng đứng sau dòng chi tiết của nó', () => {
    expect(my('SELECT region, prod, SUM(qty), COUNT(*), GROUPING(region), GROUPING(prod), GROUPING(region, prod) FROM s GROUP BY region, prod WITH ROLLUP')).toEqual([
      [null, 'Tra', 4, 1, 0, 0, 0], // NULL thật của dữ liệu: GROUPING ra 0
      [null, null, 4, 1, 0, 1, 1],
      ['Bac', 'Sua', 3, 1, 0, 0, 0],
      ['Bac', 'Tra', 1, 2, 0, 0, 0],
      ['Bac', null, 4, 3, 0, 1, 1],
      ['Nam', 'Sua', 7, 1, 0, 0, 0],
      ['Nam', 'Tra', 7, 2, 0, 0, 0],
      ['Nam', null, 14, 3, 0, 1, 1],
      [null, null, 22, 7, 1, 1, 3],
    ]);
  });
  it('MySQL: một column, HAVING và ORDER BY dùng được trên dòng tổng', () => {
    expect(my('SELECT region, SUM(qty), GROUPING(region) FROM s GROUP BY region WITH ROLLUP')).toEqual([
      [null, 4, 0],
      ['Bac', 4, 0],
      ['Nam', 14, 0],
      [null, 22, 1],
    ]);
    expect(my('SELECT region, SUM(qty) FROM s GROUP BY region WITH ROLLUP HAVING SUM(qty) > 5')).toEqual([
      ['Nam', 14],
      [null, 22],
    ]);
    expect(my('SELECT region, SUM(qty) t FROM s GROUP BY region WITH ROLLUP ORDER BY t DESC')).toEqual([
      [null, 22],
      ['Nam', 14],
      [null, 4],
      ['Bac', 4],
    ]);
    expect(my('SELECT region, prod, SUM(qty) FROM s GROUP BY region, prod WITH ROLLUP ORDER BY region, prod').slice(0, 3)).toEqual([
      [null, null, 4],
      [null, null, 22],
      [null, 'Tra', 4],
    ]);
  });
  it('MySQL: function gom khác cũng tính trên dòng tổng', () => {
    expect(my('SELECT region, GROUP_CONCAT(prod ORDER BY id) FROM s GROUP BY region WITH ROLLUP')).toEqual([
      [null, 'Tra'],
      ['Bac', 'Sua,Tra,Tra'],
      ['Nam', 'Tra,Sua,Tra'],
      [null, 'Tra,Sua,Sua,Tra,Tra,Tra,Tra'],
    ]);
  });
  it('Oracle: ROLLUP(a, b) và GROUPING (không NULL thật ở region, để thứ tự không phụ thuộc cách xếp NULL)', () => {
    expect(or('SELECT region, prod, SUM(qty), GROUPING(region), GROUPING(prod) FROM s WHERE region IS NOT NULL GROUP BY ROLLUP(region, prod) ORDER BY region, prod')).toEqual([
      ['Bac', 'Sua', 3, 0, 0],
      ['Bac', 'Tra', 1, 0, 0],
      ['Bac', null, 4, 0, 1],
      ['Nam', 'Sua', 7, 0, 0],
      ['Nam', 'Tra', 7, 0, 0],
      ['Nam', null, 14, 0, 1],
      [null, null, 18, 1, 1],
    ]);
  });
  it('Oracle: ROLLUP đứng sau một key thường chỉ cuộn key trong ROLLUP', () => {
    expect(or('SELECT region, prod, SUM(qty) FROM s WHERE region IS NOT NULL GROUP BY region, ROLLUP(prod) ORDER BY region, prod')).toEqual([
      ['Bac', 'Sua', 3],
      ['Bac', 'Tra', 1],
      ['Bac', null, 4],
      ['Nam', 'Sua', 7],
      ['Nam', 'Tra', 7],
      ['Nam', null, 14],
    ]);
  });
  it('trace của bước group mang rollup, và dòng tổng gom lại row của các nhóm con', () => {
    const r = run('SELECT region, SUM(qty) FROM s GROUP BY region WITH ROLLUP', sales, 'mysql');
    if (!r.ok) throw new Error(r.error.dbMessage);
    const step = r.trace.steps.find((x) => x.kind === 'group');
    if (step?.kind !== 'group') throw new Error('không có bước group');
    expect(step.rollup).toBe(1);
    expect(step.groups).toHaveLength(4);
    expect(step.groups[3].rowIds).toHaveLength(7); // dòng tổng cộng gom cả 7 row
  });
  it('lỗi: viết kiểu của dialect kia, GROUPING sai chỗ', () => {
    expect(fails('SELECT region FROM s GROUP BY ROLLUP(region)', 'mysql').hint).toBe('rollup-in-mysql');
    // CHỜ KIỂM TÀI LIỆU: mã ORA-00933 cho WITH ROLLUP ở Oracle chưa có nguồn xác nhận
    expect(fails('SELECT region, SUM(qty) FROM s GROUP BY region WITH ROLLUP', 'oracle').hint).toBe('rollup-in-oracle');
    expect(fails('SELECT region, GROUPING(qty) FROM s GROUP BY region WITH ROLLUP', 'mysql').code).toBe('3602');
    expect(fails('SELECT GROUPING(region) FROM s', 'mysql').code).toBe('1111');
    expect(fails('SELECT region, GROUPING(qty) FROM s GROUP BY ROLLUP(region)', 'oracle').code).toBe('ORA-00979');
  });
});

describe('kiểm lại GROUP BY, HAVING, ORDER BY với biểu thức', () => {
  it('GROUP BY theo tháng, ba cách viết', () => {
    const months = [
      ['2026-01', 2],
      ['2026-02', 3],
      ['2026-03', 2],
    ];
    expect(my("SELECT DATE_FORMAT(d, '%Y-%m'), COUNT(*) FROM s GROUP BY DATE_FORMAT(d, '%Y-%m')")).toEqual(months);
    expect(or("SELECT TO_CHAR(d, 'YYYY-MM'), COUNT(*) FROM s GROUP BY TO_CHAR(d, 'YYYY-MM') ORDER BY 1")).toEqual(months);
    expect(or("SELECT TRUNC(d, 'MM'), COUNT(*) FROM s GROUP BY TRUNC(d, 'MM') ORDER BY 1")).toEqual([
      ['2026-01-01 00:00:00', 2],
      ['2026-02-01 00:00:00', 3],
      ['2026-03-01 00:00:00', 2],
    ]);
  });
  it('MySQL cho GROUP BY alias và số thứ tự (đã kiểm), Oracle thì không', () => {
    expect(my("SELECT DATE_FORMAT(d, '%Y-%m') m, COUNT(*) FROM s GROUP BY m")).toHaveLength(3);
    expect(my('SELECT region, prod, COUNT(*) FROM s GROUP BY 1, 2')).toHaveLength(5);
    expect(my('SELECT qty q, COUNT(*) FROM s GROUP BY q ORDER BY q')[1]).toEqual([1, 1]);
    expect(fails('SELECT COUNT(*) c FROM s GROUP BY c', 'mysql').code).toBe('1056');
    expect(fails('SELECT region, COUNT(*) FROM s GROUP BY 5', 'mysql').code).toBe('1054');
    expect(fails("SELECT TO_CHAR(d, 'YYYY-MM') m, COUNT(*) FROM s GROUP BY m", 'oracle').code).toBe('ORA-00904');
    expect(fails('SELECT region, prod, COUNT(*) FROM s GROUP BY 1, 2', 'oracle').code).toBe('ORA-00979');
  });
  it('GROUP BY nhiều column', () => {
    expect(or('SELECT region, prod, COUNT(*) FROM s GROUP BY region, prod ORDER BY region, prod')).toEqual([
      ['Bac', 'Sua', 1],
      ['Bac', 'Tra', 2],
      ['Nam', 'Sua', 1],
      ['Nam', 'Tra', 2],
      [null, 'Tra', 1],
    ]);
  });
  it('function gom bọc CASE', () => {
    expect(my('SELECT SUM(CASE WHEN qty > 3 THEN 1 ELSE 0 END), COUNT(CASE WHEN qty > 3 THEN 1 END), SUM(CASE WHEN qty > 100 THEN 1 END) FROM s')).toEqual([[3, 3, null]]);
    expect(or('SELECT SUM(CASE WHEN qty > 3 THEN 1 ELSE 0 END), COUNT(CASE WHEN qty > 3 THEN 1 END) FROM s')).toEqual([[3, 3]]);
  });
  it('HAVING và ORDER BY theo biểu thức gom', () => {
    expect(my('SELECT region, SUM(qty) FROM s GROUP BY region HAVING SUM(qty) > 5 ORDER BY SUM(qty) DESC')).toEqual([['Nam', 14]]);
    expect(my('SELECT region, SUM(qty) FROM s GROUP BY region HAVING SUM(CASE WHEN qty > 3 THEN 1 ELSE 0 END) > 0 ORDER BY SUM(qty) DESC')).toEqual([
      ['Nam', 14],
      [null, 4],
    ]);
    expect(or('SELECT region, SUM(qty) FROM s GROUP BY region ORDER BY COUNT(*) DESC, region')).toEqual([
      ['Bac', 4],
      ['Nam', 14],
      [null, 4],
    ]);
  });
});
