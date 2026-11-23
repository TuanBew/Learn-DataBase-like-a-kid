import { describe, expect, it } from 'vitest';
import { columnFormatter } from '../values';
import type { Value } from '../types';

const fmt = (vals: Value[]) => {
  const f = columnFormatter(vals);
  return vals.map(f);
};

describe('columnFormatter', () => {
  it('chấm mọi số từ 1.000 khi column có số từ 10.000', () => {
    expect(fmt([24000, 4800, 3100, 900])).toEqual(['24.000', '4.800', '3.100', '900']);
  });
  it('chấm khi mọi số từ 1.000 đều tròn 500', () => {
    expect(fmt([1500, 2000, 300])).toEqual(['1.500', '2.000', '300']);
  });
  it('không chấm khi có số lẻ và không có số từ 10.000', () => {
    expect(fmt([1000, 1100, 1200])).toEqual(['1000', '1100', '1200']);
    expect(fmt([2026, 2025])).toEqual(['2026', '2025']);
  });
  it('giữ số thập phân và chuỗi', () => {
    expect(fmt([12000.5, 'abc', 15000])).toEqual(['12000.5', 'abc', '15.000']);
  });
});
