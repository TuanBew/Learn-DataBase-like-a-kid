import { describe, it, expect } from 'vitest';
import { teashop } from './teashop';

const t = (name: string) => {
  const tb = teashop.tables.find((x) => x.name === name);
  if (!tb) throw new Error(`thiếu table ${name}`);
  return tb;
};
const col = (name: string, c: string) => {
  const tb = t(name);
  const i = tb.columns.findIndex((x) => x.name === c);
  return tb.rows.map((r) => r[i]);
};
const products = t('products').rows;
const prices = col('products', 'price') as number[];
const names = col('products', 'name') as string[];

describe('teashop: cấu trúc', () => {
  it('tên database và số row', () => {
    expect(teashop.name).toBe('trasua');
    const counts = Object.fromEntries(teashop.tables.map((x) => [x.name, x.rows.length]));
    expect(counts).toMatchObject({ stores: 4, staff: 10, customers: 12, products: 14, orders: 20 });
    expect(counts.order_items).toBeGreaterThanOrEqual(40);
    expect(counts.order_items).toBeLessThanOrEqual(50);
  });
  it('số column của mỗi row khớp', () => {
    for (const tb of teashop.tables) for (const r of tb.rows) expect(r.length).toBe(tb.columns.length);
  });
  it('mỗi column có label, mỗi table có about', () => {
    for (const tb of teashop.tables) {
      expect(tb.about).toBeTruthy();
      for (const c of tb.columns) expect(c.label).toBeTruthy();
    }
  });
  it('pk không trùng và không NULL', () => {
    for (const tb of teashop.tables) {
      const i = tb.columns.findIndex((c) => c.pk);
      const ids = tb.rows.map((r) => r[i]);
      expect(ids.every((v) => v !== null)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('mọi fk trỏ tới row có thật', () => {
    for (const tb of teashop.tables)
      tb.columns.forEach((c, i) => {
        if (!c.fk) return;
        const targets = new Set(col(c.fk.table, c.fk.column));
        for (const r of tb.rows) if (r[i] !== null) expect(targets.has(r[i])).toBe(true);
      });
  });
});

describe('teashop: nhất quán', () => {
  it('staff của đơn thuộc đúng store', () => {
    const staffStore = new Map(t('staff').rows.map((r) => [r[0], r[3]]));
    for (const o of t('orders').rows) expect(staffStore.get(o[3])).toBe(o[2]);
  });
  it('unit_price khớp price', () => {
    const price = new Map(products.map((r) => [r[0], r[3]]));
    for (const it of t('order_items').rows) expect(it[4]).toBe(price.get(it[2]));
  });
  it('mỗi đơn có 1 tới 4 dòng, quantity 1 tới 4', () => {
    const n = new Map<unknown, number>();
    for (const it of t('order_items').rows) {
      n.set(it[1], (n.get(it[1]) ?? 0) + 1);
      expect(it[3] as number).toBeGreaterThanOrEqual(1);
      expect(it[3] as number).toBeLessThanOrEqual(4);
    }
    for (const o of t('orders').rows) {
      expect(n.get(o[0])).toBeGreaterThanOrEqual(1);
      expect(n.get(o[0])).toBeLessThanOrEqual(4);
    }
  });
  it('có product chưa bán và ít nhất 2 customer chưa đặt đơn', () => {
    const sold = new Set(col('order_items', 'product_id'));
    expect(products.some((r) => !sold.has(r[0]))).toBe(true);
    const ordered = new Set(col('orders', 'customer_id'));
    expect(t('customers').rows.filter((r) => !ordered.has(r[0])).length).toBeGreaterThanOrEqual(2);
  });
});

describe('teashop: yêu cầu sư phạm', () => {
  it('order_id từ 1001, ngày và giờ hợp lệ', () => {
    const ids = col('orders', 'order_id') as number[];
    expect(Math.min(...ids)).toBe(1001);
    for (const at of col('orders', 'ordered_at') as string[]) {
      expect(at >= '2026-03-02 00:00:00' && at <= '2026-03-08 23:59:59').toBe(true);
      const hm = at.slice(11, 16);
      expect(hm >= '08:00' && hm <= '21:30').toBe(true);
    }
  });
  it('NULL và status của orders', () => {
    expect(col('orders', 'customer_id').filter((v) => v === null).length).toBe(4);
    expect(col('orders', 'status').filter((v) => v === 'cancelled').length).toBe(3);
    expect(new Set(col('orders', 'status'))).toEqual(new Set(['done', 'cancelled']));
    expect(new Set(col('orders', 'payment'))).toEqual(new Set(['tiền mặt', 'thẻ', 'ví điện tử']));
  });
  it('customers: 3 phone NULL, có Hường và Hà', () => {
    expect(col('customers', 'phone').filter((v) => v === null).length).toBe(3);
    const n = col('customers', 'full_name') as string[];
    expect(n).toContain('Nguyễn Thị Hường');
    expect(n.some((x) => x.endsWith(' Hà'))).toBe(true);
    expect(new Set(col('customers', 'city'))).toEqual(new Set(['Hà Nội', 'TP. Hồ Chí Minh']));
  });
  it('staff: role hợp lệ, lương bội số 500000', () => {
    for (const r of col('staff', 'role')) expect(['Quản lý', 'Pha chế', 'Thu ngân']).toContain(r);
    for (const s of col('staff', 'salary') as number[]) expect(s % 500000).toBe(0);
  });
  it('products: 4 row đầu cố định', () => {
    expect(products.slice(0, 4).map((r) => r.slice(0, 4))).toEqual([
      [1, 'Trà sữa trân châu', 'Trà sữa', 35000],
      [2, 'Trà đào cam sả', 'Trà trái cây', 45000],
      [3, 'Cà phê sữa đá', 'Cà phê', 25000],
      [4, 'Trà sữa matcha', 'Trà sữa', 42000],
    ]);
  });
  it('products: giá, nhóm, calories', () => {
    expect(products.length).toBe(14);
    expect(Math.min(...prices)).toBe(8000);
    expect(Math.max(...prices)).toBe(65000);
    for (const p of prices) expect(p % 1000).toBe(0);
    for (const c of col('products', 'category'))
      expect(['Trà sữa', 'Trà trái cây', 'Cà phê', 'Topping']).toContain(c);
    expect(col('products', 'calories').filter((v) => v === null).length).toBe(3);
  });
  it('products: đúng một món giá 30000, đúng 6 món giá > 30000', () => {
    expect(prices.filter((p) => p === 30000).length).toBe(1);
    expect(prices.filter((p) => p > 30000).length).toBe(6);
  });
  it('products: có ít nhất hai cặp trùng giá', () => {
    const cnt = new Map<number, number>();
    for (const p of prices) cnt.set(p, (cnt.get(p) ?? 0) + 1);
    expect([...cnt.values()].filter((v) => v >= 2).length).toBeGreaterThanOrEqual(2);
  });
  it('products: 3 Topping giá dưới 15000', () => {
    const cats = col('products', 'category');
    expect(prices.filter((p, i) => cats[i] === 'Topping' && p < 15000).length).toBe(3);
  });
  it('products: ít nhất 5 món bắt đầu bằng Trà, tên tối đa 22 ký tự', () => {
    expect(names.filter((n) => n.startsWith('Trà')).length).toBeGreaterThanOrEqual(5);
    for (const n of names) expect([...n].length).toBeLessThanOrEqual(22);
  });
  it('products: thứ tự product_id không trùng thứ tự giá', () => {
    const asc = [...prices].sort((a, b) => a - b);
    const desc = [...prices].sort((a, b) => b - a);
    expect(prices).not.toEqual(asc);
    expect(prices).not.toEqual(desc);
  });
});
