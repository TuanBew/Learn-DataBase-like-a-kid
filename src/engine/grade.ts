import type { Value } from './types';
import type { ResultSet } from './trace';
import { isDate } from './values';

export interface GradeOptions {
  /** true nếu đề bài yêu cầu ORDER BY. */
  orderMatters: boolean;
  /** true nếu đề bài bắt đặt tên column. */
  aliasMatters?: boolean;
}

export type GradeProblem =
  | { kind: 'column-count'; expected: number; actual: number; extra: string[]; missing: string[] }
  | { kind: 'column-order' }
  | { kind: 'column-names'; at: number[] }
  | { kind: 'rows'; missing: number; extra: number }
  | { kind: 'row-order' };

export interface GradeReport {
  ok: boolean;
  problems: GradeProblem[];
  /** Vị trí các row còn thiếu, tính trong kết quả mong đợi. */
  missingIdx: number[];
  /** Vị trí các row thừa, tính trong kết quả của người học. */
  extraIdx: number[];
}

function cellKey(v: Value): string {
  if (v === null) return 'N';
  if (typeof v === 'number') return `n${Math.round(v * 1e6) / 1e6}`;
  if (typeof v === 'boolean') return `n${v ? 1 : 0}`;
  if (isDate(v)) return `d${v.iso.length === 10 ? `${v.iso} 00:00:00` : v.iso}`;
  return `s${v}`;
}

const rowKey = (r: Value[]) => r.map(cellKey).join('\u0001');

/** So kết quả của người học với kết quả mong đợi, và nói rõ khác ở đâu. */
export function grade(actual: ResultSet, expected: ResultSet, opt: GradeOptions): GradeReport {
  const report: GradeReport = { ok: false, problems: [], missingIdx: [], extraIdx: [] };
  const low = (s: string) => s.toLowerCase();

  if (actual.columns.length !== expected.columns.length) {
    const exp = expected.columns.map(low);
    const act = actual.columns.map(low);
    report.problems.push({
      kind: 'column-count',
      expected: expected.columns.length,
      actual: actual.columns.length,
      extra: actual.columns.filter((c) => !exp.includes(low(c))),
      missing: expected.columns.filter((c) => !act.includes(low(c))),
    });
    return report;
  }

  const want = new Map<string, number[]>();
  expected.rows.forEach((r, i) => {
    const k = rowKey(r);
    want.set(k, [...(want.get(k) ?? []), i]);
  });
  actual.rows.forEach((r, i) => {
    const left = want.get(rowKey(r));
    if (left && left.length > 0) left.shift();
    else report.extraIdx.push(i);
  });
  for (const left of want.values()) report.missingIdx.push(...left);
  report.missingIdx.sort((a, b) => a - b);

  if (report.missingIdx.length > 0 || report.extraIdx.length > 0) {
    const a = [...actual.columns.map(low)].sort().join('|');
    const e = [...expected.columns.map(low)].sort().join('|');
    const sameSet = a === e && actual.columns.map(low).join('|') !== expected.columns.map(low).join('|');
    if (sameSet) report.problems.push({ kind: 'column-order' });
    else report.problems.push({ kind: 'rows', missing: report.missingIdx.length, extra: report.extraIdx.length });
    return report;
  }

  if (opt.orderMatters) {
    const same = actual.rows.every((r, i) => rowKey(r) === rowKey(expected.rows[i]));
    if (!same) {
      report.problems.push({ kind: 'row-order' });
      return report;
    }
  }

  if (opt.aliasMatters) {
    const at = expected.columns.map((c, i) => (low(c) === low(actual.columns[i]) ? -1 : i)).filter((i) => i >= 0);
    if (at.length > 0) {
      report.problems.push({ kind: 'column-names', at });
      return report;
    }
  }

  report.ok = true;
  return report;
}
