import { describe, expect, it } from 'vitest';
import { createSession, run } from '../index';
import { teashop } from '../../data/teashop';

type D = 'mysql' | 'oracle';
const rows = (sql: string, d: D = 'mysql') => {
  const r = run(sql, teashop, d);
  if (!r.ok) throw new Error(`${r.error.code} ${r.error.dbMessage} | ${r.error.friendly}`);
  return r;
};
const err = (sql: string, d: D = 'mysql') => {
  const r = run(sql, teashop, d);
  if (r.ok) throw new Error('expected error: ' + sql);
  return r.error;
};

describe('Mốc 2: engine', () => {
  it('JOIN và GROUP BY', () => {
    const r = rows('SELECT p.category, COUNT(*) AS so_mon, SUM(p.price) FROM products p GROUP BY p.category HAVING COUNT(*) >= 4 ORDER BY so_mon DESC, p.category');
    expect(r.result.rows).toEqual([['Topping', 4, 43000], ['Trà sữa', 4, 143000]]);
    expect(r.trace.steps.map((s) => s.kind)).toEqual(['from', 'group', 'having', 'select', 'order']);
    const j = rows('SELECT o.order_id, c.full_name FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id WHERE o.order_id <= 1003 ORDER BY o.order_id', 'oracle');
    expect(j.result.rows.length).toBe(3);
    expect(j.result.columns).toEqual(['ORDER_ID', 'FULL_NAME']);
    const three = rows('SELECT p.name, SUM(i.quantity) AS ly FROM orders o JOIN order_items i ON i.order_id = o.order_id JOIN products p ON p.product_id = i.product_id WHERE o.status = \'done\' GROUP BY p.name ORDER BY ly DESC LIMIT 3');
    expect(three.result.rows.length).toBe(3);
    expect(three.trace.steps.map((s) => s.kind)).toEqual(['from', 'join', 'join', 'where', 'group', 'select', 'order', 'limit']);
    const never = rows('SELECT p.name FROM products p LEFT JOIN order_items i ON i.product_id = p.product_id WHERE i.item_id IS NULL ORDER BY p.product_id');
    expect(never.result.rows).toEqual([['Trà ô long sữa'], ['Kem cheese']]);
  });
  it('subquery', () => {
    const r = rows('SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price');
    expect(r.result.rows.length).toBeGreaterThan(0);
    expect(r.trace.steps[1].kind).toBe('subquery');
    const i = rows("SELECT full_name FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL) ORDER BY customer_id");
    expect(i.result.rows.length).toBe(3);
  });
  it('function', () => {
    expect(rows("SELECT UPPER(name), LENGTH('Hà'), SUBSTR(name, 1, 3), CONCAT(name, ' - ', category) FROM products WHERE product_id = 1").result.rows[0]).toEqual(['TRÀ SỮA TRÂN CHÂU', 3, 'Trà', 'Trà sữa trân châu - Trà sữa']);
    expect(rows("SELECT name || ' - ' || category, LENGTH('Hà'), NVL(calories, 0) FROM products WHERE product_id = 5", 'oracle').result.rows[0]).toEqual(['Trà vải hoa hồng - Trà trái cây', 2, 0]);
    expect(rows("SELECT DATE_FORMAT(ordered_at, '%Y-%m-%d'), YEAR(ordered_at) FROM orders WHERE order_id = 1001").result.rows[0]).toEqual(['2026-03-02', 2026]);
    expect(rows("SELECT TO_CHAR(ordered_at, 'YYYY-MM-DD HH24:MI'), EXTRACT(MONTH FROM ordered_at) FROM orders WHERE order_id = 1001", 'oracle').result.rows[0][1]).toBe(3);
    expect(rows("SELECT COUNT(*) FROM orders WHERE ordered_at = DATE '2026-03-02'", 'oracle').result.rows).toEqual([[0]]);
    expect(rows("SELECT COUNT(*) FROM orders WHERE TRUNC(ordered_at) = DATE '2026-03-02'", 'oracle').result.rows[0][0]).toBeGreaterThan(0);
    expect(rows("SELECT COUNT(*) FROM orders WHERE DATE(ordered_at) = '2026-03-02'").result.rows[0][0]).toBeGreaterThan(0);
    expect(rows('SELECT name FROM products WHERE ROWNUM <= 3', 'oracle').result.rows.length).toBe(3);
    expect(rows("SELECT CASE WHEN price >= 40000 THEN 'cao' ELSE 'vừa' END AS muc, COUNT(*) FROM products GROUP BY CASE WHEN price >= 40000 THEN 'cao' ELSE 'vừa' END ORDER BY muc").result.rows).toEqual([['cao', 4], ['vừa', 10]]);
    expect(rows('SELECT COUNT(*), COUNT(calories), COUNT(DISTINCT category), MIN(price), MAX(price), AVG(price) FROM products').result.rows[0].slice(0, 5)).toEqual([14, 11, 4, 8000, 65000]);
  });
  it('lỗi', () => {
    for (const [sql, d] of [
      ['SELECT category, name, COUNT(*) FROM products GROUP BY category', 'mysql'],
      ['SELECT category, name, COUNT(*) FROM products GROUP BY category', 'oracle'],
      ['SELECT name, COUNT(*) FROM products', 'oracle'],
      ['SELECT name FROM products WHERE COUNT(*) > 1', 'oracle'],
      ['SELECT name FROM products p JOIN order_items i ON p.product_id = i.product_id WHERE product_id = 1', 'mysql'],
      ['SELECT name FROM products p JOIN order_items i', 'oracle'],
      ['SELECT * FROM orders o JOIN customers AS c ON c.customer_id = o.customer_id', 'oracle'],
      ['SELECT name FROM products WHERE price = (SELECT price FROM products)', 'oracle'],
      ['SELECT NOW() FROM DUAL', 'oracle'],
      ['SELECT SYSDATE', 'mysql'],
    ] as [string, D][]) {
      const e = err(sql, d);
      console.log(`[${d}] ${sql}\n   ${e.code} | ${e.dbMessage.slice(0, 110)}\n   ${e.friendly}`);
    }
  });
  it('sửa dữ liệu', () => {
    const o = createSession(teashop, 'oracle');
    const u = o.run('UPDATE products SET price = price + 1000 WHERE category = \'Topping\'');
    if (!u.ok || u.kind !== 'dml') throw new Error('x');
    expect(u.dml.touched.length).toBe(4);
    expect(u.dml.pending).toBe(true);
    expect(o.pending()).toBe(1);
    const all = o.run('UPDATE products SET price = 0');
    expect(all.ok && all.kind === 'dml' && all.dml.noWhere && all.dml.touched.length).toBe(14);
    const rb = o.run('ROLLBACK');
    expect(rb.ok && rb.kind === 'tx' && rb.changes).toBe(2);
    const back = o.run('SELECT price FROM products WHERE product_id = 8');
    expect(back.ok && back.kind === 'select' && back.result.rows).toEqual([[8000]]);
    const m = createSession(teashop, 'mysql');
    const del = m.run('DELETE FROM customers WHERE customer_id = 1');
    console.log(del.ok ? 'deleted?!' : `${del.error.code} | ${del.error.friendly}`);
    const ins = m.run("INSERT INTO products (product_id, name, category, price, launched_on) VALUES (1, 'Trà mới', 'Trà sữa', 30000, '2026-03-05')");
    console.log(ins.ok ? 'inserted?!' : `${ins.error.code} | ${ins.error.dbMessage} | ${ins.error.friendly}`);
    const ok = m.run("INSERT INTO products (product_id, name, category, price, launched_on) VALUES (15, 'Trà mới', 'Trà sữa', 30000, '2026-03-05'), (16, 'Trà mới 2', 'Trà sữa', 31000, '2026-03-06')");
    expect(ok.ok && ok.kind === 'dml' && ok.dml.after.length).toBe(16);
    const c = m.run('CREATE TABLE vouchers (voucher_id INT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(20) NOT NULL UNIQUE, percent INT CHECK (percent > 0))');
    expect(c.ok && c.kind).toBe('ddl');
    const bad = m.run("INSERT INTO vouchers VALUES (1, 'TET', 0)");
    console.log(bad.ok ? 'check missed' : `${bad.error.code} | ${bad.error.friendly}`);
    const oc = o.run('CREATE TABLE vouchers (voucher_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code VARCHAR2(20) NOT NULL, made DATETIME)');
    console.log(oc.ok ? 'x' : `${oc.error.code} | ${oc.error.friendly}`);
  });
});
