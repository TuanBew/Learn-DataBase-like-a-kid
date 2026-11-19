import { describe, expect, it } from 'vitest';
import { teashop } from './teashop';
import { teashopBig } from './teashop-big';

const t = (name: string) => teashopBig.tables.find((x) => x.name === name)!.rows;
const orders = t('orders');
const items = t('order_items');
const products = t('products');
const staff = t('staff');

describe('teashop-big', () => {
  it('dùng lại 4 table gốc và đúng 6 table', () => {
    expect(teashopBig.name).toBe('trasua');
    expect(teashopBig.tables.map((x) => x.name)).toEqual(teashop.tables.map((x) => x.name));
    for (const n of ['stores', 'staff', 'customers', 'products']) {
      expect(teashopBig.tables.find((x) => x.name === n)).toBe(teashop.tables.find((x) => x.name === n));
    }
  });

  it('có đúng số row và pk không trùng', () => {
    expect(orders).toHaveLength(200);
    expect(items.length).toBeGreaterThanOrEqual(370);
    expect(items.length).toBeLessThanOrEqual(390);
    for (const rows of [orders, items]) {
      expect(new Set(rows.map((r) => r[0])).size).toBe(rows.length);
    }
    expect(orders[0][0]).toBe(2001);
    expect(orders[199][0]).toBe(2200);
  });

  it('foreign key trỏ tới row có thật và nhân viên thuộc đúng tiệm', () => {
    const customers = new Set(t('customers').map((r) => r[0]));
    const stores = new Set(t('stores').map((r) => r[0]));
    const staffStore = new Map(staff.map((r) => [r[0], r[3]]));
    for (const o of orders) {
      if (o[1] !== null) expect(customers.has(o[1])).toBe(true);
      expect(stores.has(o[2])).toBe(true);
      expect(staffStore.get(o[3])).toBe(o[2]);
    }
    const orderIds = new Set(orders.map((r) => r[0]));
    const price = new Map(products.map((r) => [r[0], r[3]]));
    for (const i of items) {
      expect(orderIds.has(i[1])).toBe(true);
      expect(price.has(i[2])).toBe(true);
      expect(i[4]).toBe(price.get(i[2]));
      expect(i[3] as number).toBeGreaterThanOrEqual(1);
      expect(i[3] as number).toBeLessThanOrEqual(4);
    }
  });

  it('ngày giờ nằm trong tháng 3 và giờ mở cửa', () => {
    for (const o of orders) {
      const s = o[4] as string;
      expect(s >= '2026-03-01 08:00:00' && s <= '2026-03-31 21:30:00').toBe(true);
      const hm = s.slice(11, 16);
      expect(hm >= '08:00' && hm <= '21:30').toBe(true);
    }
    const days = new Set(orders.map((o) => (o[4] as string).slice(0, 10)));
    expect(days.size).toBe(31);
  });

  it('cuối tuần đông hơn ngày thường', () => {
    let weekend = 0;
    let weekendDays = 0;
    let weekday = 0;
    let weekdayDays = 0;
    const perDay = new Map<string, number>();
    for (const o of orders) {
      const d = (o[4] as string).slice(0, 10);
      perDay.set(d, (perDay.get(d) ?? 0) + 1);
    }
    for (const [d, n] of perDay) {
      const dow = new Date(d + 'T00:00:00Z').getUTCDay();
      if (dow === 0 || dow === 6) { weekend += n; weekendDays++; } else { weekday += n; weekdayDays++; }
    }
    expect(weekend / weekendDays).toBeGreaterThan((weekday / weekdayDays) * 1.3);
  });

  it('4 tiệm đông vắng khác nhau', () => {
    const c = new Map<number, number>();
    for (const o of orders) c.set(o[2] as number, (c.get(o[2] as number) ?? 0) + 1);
    const v = [...c.values()];
    expect(c.size).toBe(4);
    expect(Math.max(...v) / Math.min(...v)).toBeGreaterThan(2);
  });

  it('khoảng 8% cancelled, khoảng 20% customer_id NULL', () => {
    const cancelled = orders.filter((o) => o[5] === 'cancelled').length;
    const nulls = orders.filter((o) => o[1] === null).length;
    expect(cancelled).toBeGreaterThanOrEqual(12);
    expect(cancelled).toBeLessThanOrEqual(20);
    expect(nulls).toBeGreaterThanOrEqual(32);
    expect(nulls).toBeLessThanOrEqual(48);
    expect(orders.every((o) => o[5] === 'done' || o[5] === 'cancelled')).toBe(true);
  });

  it('mỗi đơn 1 đến 4 món, không lặp món trong một đơn', () => {
    const per = new Map<number, number[]>();
    for (const i of items) per.set(i[1] as number, [...(per.get(i[1] as number) ?? []), i[2] as number]);
    expect(per.size).toBe(200);
    for (const ps of per.values()) {
      expect(ps.length).toBeGreaterThanOrEqual(1);
      expect(ps.length).toBeLessThanOrEqual(4);
      expect(new Set(ps).size).toBe(ps.length);
    }
  });

  it('có món bán chạy, món bán ít, và món 13, 14 chưa bán', () => {
    const sold = new Map<number, number>();
    for (const i of items) sold.set(i[2] as number, (sold.get(i[2] as number) ?? 0) + (i[3] as number));
    expect(sold.has(13)).toBe(false);
    expect(sold.has(14)).toBe(false);
    const top = Math.max(...sold.values());
    const low = Math.min(...sold.values());
    expect(top).toBeGreaterThan(low * 8);
    expect(sold.size).toBe(12);
  });
});
