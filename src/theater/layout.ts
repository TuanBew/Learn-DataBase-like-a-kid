import type { StageCol } from './frames';

export interface ColBox {
  key: string;
  x: number;
  w: number;
  /** Column gập lại thành một dải hẹp vì màn hình không đủ chỗ. */
  sliver: boolean;
}

const SLIVER = 12;

function minWidth(c: StageCol, narrow: boolean): number {
  const char = narrow ? 6.3 : 8;
  const head = c.header.length * char + 18;
  const isId = c.type === 'int' && /id$/i.test(c.header);
  if (isId) return narrow ? 46 : Math.max(56, Math.min(head, 96));
  const base =
    c.type === 'text' ? (narrow ? 122 : 150) : c.type === 'date' ? (narrow ? 92 : 108) : c.type === 'datetime' ? (narrow ? 142 : 170) : narrow ? 68 : 84;
  return Math.max(base, Math.min(head, narrow ? 110 : 220));
}

/**
 * Chia chiều ngang của sân khấu cho các column.
 * Đủ chỗ thì mọi column hiện đầy đủ. Thiếu chỗ thì ưu tiên các column mà query nhắc tới,
 * các column còn lại gập thành dải hẹp.
 */
export function layoutCols(cols: StageCol[], width: number, focus: Set<string>): ColBox[] {
  if (cols.length === 0 || width <= 0) return [];
  const narrow = width < 560;
  const mins = cols.map((c) => minWidth(c, narrow));
  const full = cols.map(() => true);
  const total = () => cols.reduce((sum, _c, i) => sum + (full[i] ? mins[i] : SLIVER), 0);

  if (total() > width) {
    full.fill(false);
    const firstText = cols.findIndex((c) => c.type === 'text');
    const rank = (c: StageCol, i: number) => (focus.has(c.key.split('#')[0]) || c.state === 'new' ? 0 : i === firstText ? 1 : 2);
    const order = cols.map((_c, i) => i).sort((a, b) => rank(cols[a], a) - rank(cols[b], b) || a - b);
    for (const i of order) {
      full[i] = true;
      if (total() > width) full[i] = false;
    }
    if (!full.some(Boolean)) full[order[0]] = true;
  }

  const used = total();
  const extra = Math.max(0, width - used);
  const weight = cols.reduce((sum, c, i) => sum + (full[i] ? (c.type === 'text' ? 2.4 : 1) : 0), 0);
  let x = 0;
  return cols.map((c, i) => {
    const w = full[i] ? mins[i] + (extra * (c.type === 'text' ? 2.4 : 1)) / weight : SLIVER;
    const box = { key: c.key, x, w, sliver: !full[i] };
    x += w;
    return box;
  });
}
