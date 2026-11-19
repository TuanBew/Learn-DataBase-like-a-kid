import { describe, expect, it } from 'vitest';
import { grade } from '../index';
import type { ResultSet, Value } from '../index';

const rs = (columns: string[], rows: Value[][]): ResultSet => ({
  columns,
  types: columns.map(() => 'expr' as const),
  rows,
  rowIds: rows.map((_, i) => i),
});

const expected = rs(['name', 'price'], [
  ['Cà phê muối', 30000],
  ['Trà sữa trân châu', 35000],
  ['Trà sữa khoai môn', 38000],
]);

const ordered = { orderMatters: true };
const unordered = { orderMatters: false };

describe('grade', () => {
  it('kết quả giống hệt thì đúng', () => {
    const g = grade(expected, expected, ordered);
    expect(g.ok).toBe(true);
    expect(g.problems).toEqual([]);
    expect(g.missingIdx).toEqual([]);
    expect(g.extraIdx).toEqual([]);
  });

  it('thiếu row: báo thiếu và chỉ vị trí row thiếu trong kết quả mong đợi', () => {
    const actual = rs(['name', 'price'], [
      ['Cà phê muối', 30000],
      ['Trà sữa khoai môn', 38000],
    ]);
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'rows', missing: 1, extra: 0 }]);
    expect(g.missingIdx).toEqual([1]);
    expect(g.extraIdx).toEqual([]);
  });

  it('thừa row: báo thừa và chỉ vị trí row thừa trong kết quả của người học', () => {
    const actual = rs(['name', 'price'], [
      ['Cà phê muối', 30000],
      ['Trà sữa trân châu', 35000],
      ['Trân châu đen', 8000],
      ['Trà sữa khoai môn', 38000],
    ]);
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'rows', missing: 0, extra: 1 }]);
    expect(g.extraIdx).toEqual([2]);
    expect(g.missingIdx).toEqual([]);
  });

  it('vừa thiếu vừa thừa khi cùng số row nhưng khác nội dung', () => {
    const actual = rs(['name', 'price'], [
      ['Cà phê muối', 30000],
      ['Trà sữa trân châu', 35000],
      ['Trà sữa matcha', 42000],
    ]);
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'rows', missing: 1, extra: 1 }]);
    expect(g.missingIdx).toEqual([2]);
    expect(g.extraIdx).toEqual([2]);
  });

  it('row trùng nhiều hơn mong đợi tính là thừa', () => {
    const actual = rs(['name', 'price'], [...expected.rows, ['Cà phê muối', 30000]]);
    const g = grade(actual, expected, unordered);
    expect(g.ok).toBe(false);
    expect(g.extraIdx).toEqual([3]);
  });

  it('đủ row nhưng sai thứ tự: lỗi khi orderMatters', () => {
    const actual = rs(['name', 'price'], [expected.rows[2], expected.rows[0], expected.rows[1]]);
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'row-order' }]);
    expect(g.missingIdx).toEqual([]);
    expect(g.extraIdx).toEqual([]);
  });

  it('đủ row nhưng sai thứ tự: vẫn đúng khi orderMatters là false', () => {
    const actual = rs(['name', 'price'], [expected.rows[2], expected.rows[0], expected.rows[1]]);
    expect(grade(actual, expected, unordered).ok).toBe(true);
  });

  it('khác số column: báo column thừa và column thiếu', () => {
    const actual = rs(['name', 'price', 'calories'], [
      ['Cà phê muối', 30000, 210],
      ['Trà sữa trân châu', 35000, 320],
      ['Trà sữa khoai môn', 38000, 340],
    ]);
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'column-count', expected: 2, actual: 3, extra: ['calories'], missing: [] }]);
  });

  it('ít column hơn mong đợi: báo column thiếu', () => {
    const actual = rs(['name'], expected.rows.map((r) => [r[0]]));
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'column-count', expected: 2, actual: 1, extra: [], missing: ['price'] }]);
  });

  it('so tên column không phân biệt hoa thường khi tìm column thừa và thiếu', () => {
    const actual = rs(['NAME', 'PRICE', 'calories'], expected.rows.map((r) => [...r, 1]));
    const g = grade(actual, expected, ordered);
    expect(g.problems).toEqual([{ kind: 'column-count', expected: 2, actual: 3, extra: ['calories'], missing: [] }]);
  });

  it('đủ column nhưng sai thứ tự: báo column-order', () => {
    const actual = rs(['price', 'name'], expected.rows.map(([n, p]) => [p, n]));
    const g = grade(actual, expected, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'column-order' }]);
  });

  it('tên column khác khi aliasMatters: báo vị trí column sai tên', () => {
    const actual = rs(['name', 'gia'], expected.rows);
    const g = grade(actual, expected, { orderMatters: true, aliasMatters: true });
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'column-names', at: [1] }]);
  });

  it('báo mọi vị trí column sai tên', () => {
    const actual = rs(['ten', 'gia'], expected.rows);
    const g = grade(actual, expected, { orderMatters: true, aliasMatters: true });
    expect(g.problems).toEqual([{ kind: 'column-names', at: [0, 1] }]);
  });

  it('tên column khác nhưng aliasMatters tắt: vẫn đúng', () => {
    const actual = rs(['ten', 'gia'], expected.rows);
    expect(grade(actual, expected, ordered).ok).toBe(true);
    expect(grade(actual, expected, { orderMatters: true, aliasMatters: false }).ok).toBe(true);
  });

  it('aliasMatters không phân biệt hoa thường (Oracle in hoa tiêu đề)', () => {
    const actual = rs(['NAME', 'PRICE'], expected.rows);
    expect(grade(actual, expected, { orderMatters: true, aliasMatters: true }).ok).toBe(true);
  });

  it('sai lệch số thập phân rất nhỏ vẫn đúng', () => {
    const a = rs(['x'], [[0.1 + 0.2], [1 / 3]]);
    const e = rs(['x'], [[0.3], [0.333333333]]);
    expect(grade(a, e, ordered).ok).toBe(true);
  });

  it('sai lệch số thập phân đủ lớn thì sai', () => {
    const a = rs(['x'], [[0.3]]);
    const e = rs(['x'], [[0.31]]);
    const g = grade(a, e, ordered);
    expect(g.ok).toBe(false);
    expect(g.problems).toEqual([{ kind: 'rows', missing: 1, extra: 1 }]);
  });

  it('NULL khớp NULL, NULL không khớp 0 hay chuỗi rỗng', () => {
    const e = rs(['x'], [[null]]);
    expect(grade(rs(['x'], [[null]]), e, ordered).ok).toBe(true);
    expect(grade(rs(['x'], [[0]]), e, ordered).ok).toBe(false);
    expect(grade(rs(['x'], [['']]), e, ordered).ok).toBe(false);
  });

  it('ngày không giờ khớp ngày có giờ 00:00:00', () => {
    const a = rs(['d'], [[{ kind: 'date', iso: '2026-02-15' }]]);
    const e = rs(['d'], [[{ kind: 'date', iso: '2026-02-15 00:00:00' }]]);
    expect(grade(a, e, ordered).ok).toBe(true);
    const other = rs(['d'], [[{ kind: 'date', iso: '2026-02-16' }]]);
    expect(grade(other, e, ordered).ok).toBe(false);
  });

  it('kết quả rỗng khớp kết quả rỗng', () => {
    expect(grade(rs(['x'], []), rs(['x'], []), ordered).ok).toBe(true);
    const g = grade(rs(['x'], []), rs(['x'], [[1]]), ordered);
    expect(g.problems).toEqual([{ kind: 'rows', missing: 1, extra: 0 }]);
  });
});
