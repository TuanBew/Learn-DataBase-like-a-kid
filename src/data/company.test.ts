import { describe, expect, it } from 'vitest';
import { run } from '../engine';
import type { Dialect, RawValue } from '../engine/types';
import { company } from './company';

const t = (name: string) => {
  const tb = company.tables.find((x) => x.name === name);
  if (!tb) throw new Error(`thiếu table ${name}`);
  return tb;
};
/** Giá trị của một column, theo tên. */
const col = (table: string, c: string): RawValue[] => {
  const i = t(table).columns.findIndex((x) => x.name === c);
  if (i < 0) throw new Error(`thiếu column ${table}.${c}`);
  return t(table).rows.map((r) => r[i]);
};
const set = (table: string, c: string) => new Set(col(table, c));

describe('company: cấu trúc', () => {
  it('tên database và số row', () => {
    expect(company.name).toBe('congty');
    const counts = Object.fromEntries(company.tables.map((x) => [x.name, x.rows.length]));
    expect(counts).toMatchObject({
      regions: 4, countries: 8, locations: 6, departments: 8, jobs: 10, employees: 40,
      job_history: 12, customers: 30, products: 20, orders: 80,
    });
    expect(counts.order_items).toBeGreaterThanOrEqual(180);
    expect(counts.order_items).toBeLessThanOrEqual(220);
    expect(company.tables).toHaveLength(11);
  });

  it('mỗi row đủ column, mỗi column có label, mỗi table có about', () => {
    for (const tb of company.tables) {
      expect(tb.about).toBeTruthy();
      for (const c of tb.columns) expect(c.label).toBeTruthy();
      for (const r of tb.rows) expect(r).toHaveLength(tb.columns.length);
    }
  });

  it('chữ tiếng Việt không dùng từ cấm', () => {
    const banned = /\b(bảng|cột|hàng|dòng|khóa chính|khóa ngoại|truy vấn)\b/i;
    for (const tb of company.tables) {
      expect(tb.about!).not.toMatch(banned);
      for (const c of tb.columns) expect(c.label!).not.toMatch(banned);
    }
  });

  it('primary key không trùng, không NULL (kể cả primary key ghép)', () => {
    for (const tb of company.tables) {
      const idx = tb.columns.map((c, i) => (c.pk ? i : -1)).filter((i) => i >= 0);
      expect(idx.length).toBeGreaterThan(0);
      const keys = tb.rows.map((r) => idx.map((i) => r[i]));
      for (const k of keys) for (const v of k) expect(v).not.toBeNull();
      expect(new Set(keys.map((k) => k.join('|'))).size).toBe(tb.rows.length);
    }
    expect(t('job_history').columns.filter((c) => c.pk).map((c) => c.name)).toEqual(['employee_id', 'start_date']);
    expect(t('order_items').columns.filter((c) => c.pk).map((c) => c.name)).toEqual(['order_id', 'line_no']);
  });

  it('email nhân viên không trùng; country_id là CHAR(2)', () => {
    expect(set('employees', 'email').size).toBe(40);
    expect(col('countries', 'country_id').every((v) => typeof v === 'string' && v.length === 2)).toBe(true);
  });

  it('mọi foreign key khai báo trỏ tới row có thật', () => {
    for (const tb of company.tables) {
      tb.columns.forEach((c, i) => {
        if (!c.fk) return;
        const target = set(c.fk.table, c.fk.column);
        for (const r of tb.rows) if (r[i] !== null) expect(target.has(r[i]), `${tb.name}.${c.name}=${r[i]}`).toBe(true);
      });
    }
    // khai báo đủ các foreign key theo đề
    const fkOf = (tb: string) => t(tb).columns.filter((c) => c.fk).map((c) => `${c.name}>${c.fk!.table}`);
    expect(fkOf('employees')).toEqual(['job_id>jobs', 'manager_id>employees', 'department_id>departments']);
    expect(fkOf('orders')).toEqual(['customer_id>customers', 'sales_rep_id>employees']);
    expect(fkOf('order_items')).toEqual(['order_id>orders', 'product_id>products']);
  });
});

describe('company: tình huống để dạy', () => {
  const emps = t('employees').rows;
  const byId = new Map(emps.map((e) => [e[0] as number, e]));
  const [E_JOB, E_SAL, E_COMM, E_MGR, E_DEPT] = [6, 7, 8, 9, 10];

  it('đúng 1 nhân viên không có sếp', () => {
    expect(emps.filter((e) => e[E_MGR] === null)).toHaveLength(1);
  });

  it('2 nhân viên chưa thuộc phòng nào', () => {
    expect(emps.filter((e) => e[E_DEPT] === null)).toHaveLength(2);
  });

  it('1 phòng chưa có nhân viên, 1 phòng chưa có trưởng phòng', () => {
    const used = set('employees', 'department_id');
    expect(col('departments', 'department_id').filter((d) => !used.has(d))).toHaveLength(1);
    expect(col('departments', 'manager_id').filter((m) => m === null)).toHaveLength(1);
  });

  it('cây quản lý sâu ít nhất 3 tầng và không có vòng', () => {
    const depth = (id: number): number => {
      let d = 1;
      let cur = byId.get(id)!;
      const seen = new Set<number>();
      while (cur[E_MGR] !== null) {
        expect(seen.has(cur[0] as number)).toBe(false);
        seen.add(cur[0] as number);
        cur = byId.get(cur[E_MGR] as number)!;
        d++;
      }
      return d;
    };
    expect(Math.max(...emps.map((e) => depth(e[0] as number)))).toBeGreaterThanOrEqual(3);
  });

  it('3 khách chưa có đơn nào, 2 sản phẩm chưa từng bán', () => {
    const buyers = set('orders', 'customer_id');
    expect(col('customers', 'customer_id').filter((c) => !buyers.has(c))).toHaveLength(3);
    const sold = set('order_items', 'product_id');
    expect(col('products', 'product_id').filter((p) => !sold.has(p))).toHaveLength(2);
  });

  it('khoảng 10 đơn không có nhân viên bán, người bán là nhân viên phòng kinh doanh', () => {
    const noRep = col('orders', 'sales_rep_id').filter((v) => v === null).length;
    expect(noRep).toBe(10);
    const salesDept = departmentIdOf('Kinh doanh');
    for (const v of col('orders', 'sales_rep_id')) if (v !== null) expect(byId.get(v as number)![E_DEPT]).toBe(salesDept);
  });

  function departmentIdOf(name: string) {
    return t('departments').rows.find((d) => d[1] === name)![0];
  }

  it('chỉ nhân viên phòng kinh doanh có commission_pct', () => {
    const sales = departmentIdOf('Kinh doanh');
    for (const e of emps) {
      if (e[E_DEPT] === sales) expect(e[E_COMM]).not.toBeNull();
      else expect(e[E_COMM]).toBeNull();
    }
  });

  it('đúng 2 nhân viên có lương ngoài khoảng min/max của job', () => {
    const range = new Map(t('jobs').rows.map((j) => [j[0], [j[2] as number, j[3] as number]]));
    const out = emps.filter((e) => {
      const [lo, hi] = range.get(e[E_JOB])!;
      return (e[E_SAL] as number) < lo || (e[E_SAL] as number) > hi;
    });
    expect(out).toHaveLength(2);
  });

  it('2 cặp nhân viên trùng last_name', () => {
    const count = new Map<RawValue, number>();
    for (const n of col('employees', 'last_name')) count.set(n, (count.get(n) ?? 0) + 1);
    expect([...count.values()].filter((c) => c > 1).sort()).toEqual([2, 2]);
  });

  it('có đơn cancelled, mỗi đơn có 1 tới 5 dòng', () => {
    const st = col('orders', 'status');
    expect(st.filter((s) => s === 'cancelled').length).toBeGreaterThanOrEqual(3);
    expect(new Set(st)).toEqual(new Set(['delivered', 'cancelled', 'shipped', 'processing']));
    const lines = new Map<RawValue, number>();
    for (const o of col('order_items', 'order_id')) lines.set(o, (lines.get(o) ?? 0) + 1);
    expect(lines.size).toBe(80);
    for (const n of lines.values()) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
    // line_no chạy liên tục từ 1
    const mx = new Map<RawValue, number>();
    for (const r of t('order_items').rows) mx.set(r[0], Math.max(mx.get(r[0]) ?? 0, r[1] as number));
    for (const [o, m] of mx) expect(m).toBe(lines.get(o));
  });

  it('một sản phẩm xuất hiện ở rất nhiều đơn', () => {
    const per = new Map<RawValue, Set<RawValue>>();
    for (const r of t('order_items').rows) per.set(r[2], (per.get(r[2]) ?? new Set()).add(r[0]));
    expect(Math.max(...[...per.values()].map((s) => s.size))).toBeGreaterThanOrEqual(40);
  });

  it('có giá trị trùng để GROUP BY và có NULL rải rác', () => {
    expect(new Set(col('products', 'category')).size).toBeLessThan(20);
    expect(new Set(col('products', 'category')).size).toBeGreaterThanOrEqual(3);
    expect(col('customers', 'email').some((v) => v === null)).toBe(true);
    expect(col('locations', 'state_province').some((v) => v === null)).toBe(true);
  });

  it('ngày hợp lệ, tiền tròn nghìn, đơn nằm trong khoảng cho phép', () => {
    const dates = col('orders', 'order_date') as string[];
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(dates.every((d) => d >= '2025-01-01' && d < '2026-03-09')).toBe(true);
    expect(dates.some((d) => d.startsWith('2025-01'))).toBe(true);
    for (const e of emps) expect(e[5]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const money = [...col('employees', 'salary'), ...col('products', 'list_price'), ...col('order_items', 'unit_price'),
      ...col('jobs', 'min_salary'), ...col('jobs', 'max_salary'), ...col('customers', 'credit_limit')];
    for (const m of money) expect((m as number) % 1000).toBe(0);
  });

  it('đơn giá lúc bán không vượt giá niêm yết và không lệch quá 10%', () => {
    const price = new Map(t('products').rows.map((p) => [p[0], p[3] as number]));
    for (const r of t('order_items').rows) {
      const list = price.get(r[2])!;
      expect(r[4] as number).toBeLessThanOrEqual(list);
      expect(r[4] as number).toBeGreaterThanOrEqual(list * 0.9);
    }
  });

  it('job_history hợp lệ: ngày kết thúc sau ngày bắt đầu, và trước hôm nay', () => {
    for (const r of t('job_history').rows) {
      expect((r[2] as string) >= (r[1] as string)).toBe(true);
      expect((r[2] as string) < '2026-03-09').toBe(true);
      expect((r[1] as string) >= (byId.get(r[0] as number)![5] as string)).toBe(true);
    }
  });
});

describe('company: query chạy thật qua engine', () => {
  const both: Dialect[] = ['mysql', 'oracle'];
  const rows = (sql: string, d: Dialect) => {
    const r = run(sql, company, d);
    if (!r.ok) throw new Error(`${d}: ${r.error.code} ${r.error.message}`);
    return r.result.rows.map((x) => x.map((v) => (v !== null && typeof v === 'object' ? v.iso : v)));
  };

  it.each(both)('đếm row và lọc, %s', (d) => {
    expect(rows('SELECT COUNT(*) FROM employees', d)).toEqual([[40]]);
    expect(rows('SELECT COUNT(*) FROM employees WHERE manager_id IS NULL', d)).toEqual([[1]]);
    expect(rows('SELECT COUNT(*) FROM employees WHERE department_id IS NULL', d)).toEqual([[2]]);
  });

  it.each(both)('LEFT JOIN tìm khách chưa có đơn, %s', (d) => {
    const r = rows(
      'SELECT c.customer_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL ORDER BY c.customer_id',
      d,
    );
    expect(r).toHaveLength(3);
  });

  it.each(both)('GROUP BY số đơn theo status, %s', (d) => {
    const r = rows('SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status', d);
    expect(r.reduce((s, x) => s + (x[1] as number), 0)).toBe(80);
    expect(r.map((x) => x[0])).toEqual(['cancelled', 'delivered', 'processing', 'shipped']);
  });

  it.each(both)('nối 5 table order_items, orders, customers, countries, regions, %s', (d) => {
    const sql = `SELECT r.region_name, COUNT(*), SUM(oi.quantity * oi.unit_price)
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN countries co ON c.country_id = co.country_id
JOIN regions r ON co.region_id = r.region_id
GROUP BY r.region_name
ORDER BY r.region_name`;
    const r = rows(sql, d);
    expect(r.length).toBeGreaterThanOrEqual(3);
    expect(r.reduce((s, x) => s + (x[1] as number), 0)).toBe(t('order_items').rows.length);
    const total = t('order_items').rows.reduce((s, x) => s + (x[3] as number) * (x[4] as number), 0);
    expect(r.reduce((s, x) => s + (x[2] as number), 0)).toBe(total);
  });

  it.each(both)('self join nhân viên với sếp, %s', (d) => {
    const r = rows('SELECT e.employee_id, m.employee_id FROM employees e JOIN employees m ON e.manager_id = m.employee_id', d);
    expect(r).toHaveLength(39);
  });
});
