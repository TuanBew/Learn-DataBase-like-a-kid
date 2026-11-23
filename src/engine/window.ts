import type { Dialect, Value } from './types';
import type { Expr, OrderItem } from './ast';
import type { Span } from './errors';
import { compare, keyOf, toNumber } from './values';

type FnExpr = Extract<Expr, { t: 'fn' }>;

/** COUNT, SUM, AVG, MIN, MAX trên các giá trị đã lấy ra (gồm cả NULL). `star` là COUNT(*): đếm mọi row. */
export function foldValues(name: string, vals: Value[], d: Dialect, span: Span, star = false): Value {
  if (star) return vals.length;
  const some = vals.filter((v) => v !== null);
  switch (name) {
    case 'COUNT':
      return some.length;
    case 'SUM':
    case 'AVG': {
      if (some.length === 0) return null;
      const sum = some.reduce<number>((a, v) => a + (toNumber(v, d, span) ?? 0), 0);
      return Math.round((name === 'SUM' ? sum : sum / some.length) * 1e10) / 1e10;
    }
    default: {
      if (some.length === 0) return null;
      return some.reduce((best, v) => {
        const c = compare(v, best, d, span) ?? 0;
        return (name === 'MIN' ? c < 0 : c > 0) ? v : best;
      });
    }
  }
}

/** So hai bộ key theo ORDER BY. NULL nhỏ nhất ở MySQL, lớn nhất ở Oracle, trừ khi NULLS FIRST hay LAST nói khác. */
function cmpKeys(a: Value[], b: Value[], items: Pick<OrderItem, 'desc' | 'nulls'>[], d: Dialect, span: Span): number {
  for (let i = 0; i < items.length; i++) {
    const x = a[i];
    const y = b[i];
    const o = items[i];
    if (x === null || y === null) {
      if (x === null && y === null) continue;
      const first = o.nulls ? o.nulls === 'FIRST' : d === 'mysql' ? !o.desc : o.desc;
      return (x === null) === first ? -1 : 1;
    }
    const c = compare(x, y, d, span) ?? 0;
    if (c !== 0) return o.desc ? -c : c;
  }
  return 0;
}

export interface WindowUnit {
  cx: { win?: Map<Expr, Value> };
}

/**
 * Tính các window function trên các unit (row, hoặc nhóm khi đã GROUP BY) và ghi kết quả vào `cx.win` của từng unit.
 * Trả về thứ tự mà window cuối cùng sắp các unit: DBMS thật trả row theo thứ tự đó khi query không có ORDER BY.
 */
export function computeWindows(fns: FnExpr[], units: WindowUnit[], ev: (e: Expr, cx: never) => Value, d: Dialect): number[] | undefined {
  let last: number[] | undefined;
  for (const fn of fns) {
    const spec = fn.over!;
    const span = fn.span;
    const get = (e: Expr, u: WindowUnit) => ev(e, u.cx as never);
    const part = units.map((u) => spec.partition.map((p) => get(p, u)));
    const ord = units.map((u) => spec.orderBy.map((o) => get(o.e, u)));
    const asc = spec.partition.map(() => ({ desc: false }));

    // Nhóm các unit theo partition, giữ thứ tự gặp đầu tiên rồi sắp lại ở cuối.
    const groups = new Map<string, number[]>();
    units.forEach((_u, i) => {
      const k = part[i].map((v) => keyOf(v, d)).join('\u0001');
      const g = groups.get(k);
      if (g) g.push(i);
      else groups.set(k, [i]);
    });
    const parts = [...groups.values()].sort((a, b) => cmpKeys(part[a[0]], part[b[0]], asc, d, span) || a[0] - b[0]);
    const order: number[] = [];

    for (const idxs of parts) {
      const sorted = [...idxs].sort((a, b) => cmpKeys(ord[a], ord[b], spec.orderBy, d, span) || a - b);
      order.push(...sorted);
      const same = (a: number, b: number) => cmpKeys(ord[a], ord[b], spec.orderBy, d, span) === 0;
      // Với mỗi vị trí: đầu và cuối nhóm row cùng key ORDER BY.
      const first: number[] = [];
      const lastPeer: number[] = [];
      sorted.forEach((idx, p) => {
        first[p] = p > 0 && same(sorted[p - 1], idx) ? first[p - 1] : p;
      });
      for (let p = sorted.length - 1; p >= 0; p--) lastPeer[p] = p < sorted.length - 1 && same(sorted[p + 1], sorted[p]) ? lastPeer[p + 1] : p;

      const argAt = (p: number, k: number): Value => (fn.args[k] ? get(fn.args[k], units[sorted[p]]) : null);
      sorted.forEach((idx, p) => {
        let v: Value;
        switch (fn.name) {
          case 'ROW_NUMBER':
            v = p + 1;
            break;
          case 'RANK':
            v = first[p] + 1;
            break;
          case 'DENSE_RANK': {
            let n = 1;
            for (let q = 1; q <= p; q++) if (first[q] === q) n++;
            v = n;
            break;
          }
          case 'LAG':
          case 'LEAD': {
            const nv = fn.args[1] ? toNumber(argAt(p, 1), d, span) : 1;
            const n = nv === null ? 0 : Math.max(0, Math.trunc(nv));
            const at = fn.name === 'LAG' ? p - n : p + n;
            v = at >= 0 && at < sorted.length ? argAt(at, 0) : fn.args[2] ? argAt(p, 2) : null;
            break;
          }
          default: {
            // Có ORDER BY: khung mặc định chạy từ đầu partition tới row cuối cùng có cùng giá trị ORDER BY. ROWS: tới đúng row này. Không ORDER BY: cả partition.
            const end = spec.orderBy.length === 0 ? sorted.length - 1 : spec.rows ? p : lastPeer[p];
            const vals: Value[] = [];
            for (let q = 0; q <= end; q++) vals.push(fn.star ? 1 : argAt(q, 0));
            v = foldValues(fn.name, vals, d, span, !!fn.star);
          }
        }
        const u = units[idx];
        (u.cx.win ??= new Map()).set(fn, v);
      });
    }
    last = order;
  }
  return last;
}
