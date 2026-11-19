import { describe, expect, it } from 'vitest';
import { run } from '../index';
import { teashop } from '../../data/teashop';

const q = (sql: string, d: 'mysql' | 'oracle' = 'mysql') => run(sql, teashop, d);
const rows = (sql: string, d: 'mysql' | 'oracle' = 'mysql') => {
  const r = q(sql, d);
  if (!r.ok) throw new Error(`${r.error.code} ${r.error.dbMessage} | ${r.error.friendly}`);
  return r.result;
};
const err = (sql: string, d: 'mysql' | 'oracle' = 'mysql') => {
  const r = q(sql, d);
  if (r.ok) throw new Error('expected error');
  return r.error;
};

describe('smoke', () => {
  it('select star', () => {
    const r = rows('SELECT * FROM products;');
    expect(r.rows.length).toBe(14);
    expect(r.columns).toEqual(['product_id', 'name', 'category', 'price', 'calories', 'launched_on']);
    expect(rows('select * from products', 'oracle').columns[1]).toBe('NAME');
  });
  it('where + order + limit', () => {
    const r = rows('SELECT name, price FROM products WHERE price > 30000 ORDER BY price DESC LIMIT 3');
    expect(r.rows).toEqual([['Cà phê cacao đá xay', 65000], ['Trà vải hoa hồng', 48000], ['Trà đào cam sả', 45000]]);
    const o = rows('SELECT name, price FROM products WHERE price > 30000 ORDER BY price DESC FETCH FIRST 3 ROWS ONLY', 'oracle');
    expect(o.rows).toEqual(r.rows);
    expect(o.columns).toEqual(['NAME', 'PRICE']);
  });
  it('trace', () => {
    const r = q('SELECT name, price FROM products WHERE price > 30000 ORDER BY price DESC LIMIT 3');
    if (!r.ok) throw new Error('x');
    expect(r.trace.steps.map((s) => s.kind)).toEqual(['from', 'where', 'select', 'order', 'limit']);
    expect(r.trace.clauses.map((c) => `${c.kind}:${c.run}`)).toEqual(['SELECT:2', 'FROM:0', 'WHERE:1', 'ORDER BY:3', 'LIMIT:4']);
    const w = r.trace.steps[1];
    if (w.kind !== 'where') throw new Error('x');
    console.log(w.verdicts.slice(0, 6).map((v) => `${v.pass ? 'ok' : 'no'} ${v.reason}`).join('\n'));
  });
  it('errors', () => {
    const cases: [string, 'mysql' | 'oracle'][] = [
      ['SELECT * FROM products LIMIT 3', 'oracle'],
      ['SELECT * FROM products FETCH FIRST 3 ROWS ONLY', 'mysql'],
      ['SELECT * FROM product', 'mysql'],
      ['SELECT * FROM product', 'oracle'],
      ['SELECT nam FROM products', 'mysql'],
      ['SELECT nam FROM products', 'oracle'],
      ['SELECT name, FROM products', 'oracle'],
      ['SELECT name, FROM products', 'mysql'],
      ['SELECT name price products', 'oracle'],
      ['SELECT 1 + 1', 'oracle'],
      ['SELECT * FROM products AS p', 'oracle'],
      ['SELECT * FROM products WHERE name = "Trà"', 'oracle'],
      ['SELECT * FROM products WHERE', 'mysql'],
      ['SELECT * FROM products WHERE', 'oracle'],
      ['SELECT * FROM products ORDER BY price WHERE price > 1', 'mysql'],
      ['SELECT * FROM products WHERE price > 1 ORDER price', 'oracle'],
      ["SELECT * FROM products WHERE name = 'Trà", 'oracle'],
      ['SELECT COUNT(*) FROM products', 'mysql'],
      ['SELECT NVL(calories, 0) FROM products', 'mysql'],
      ["SELECT * FROM products WHERE launched_on > '2026-02-01'", 'oracle'],
      ['', 'mysql'],
      ['DROP TABLE products', 'mysql'],
      ['SELECT * FROM products WHERE price', 'oracle'],
      ['SELECT * FROM products WHERE price > 30000 AND', 'mysql'],
    ];
    for (const [sql, d] of cases) {
      const e = err(sql, d);
      console.log(`[${d}] ${sql}\n   ${e.code} | ${e.dbMessage}\n   ${e.friendly}${e.tip ? ' ' + e.tip : ''} @${e.span.s}-${e.span.e}`);
    }
  });
  it('dialect bits', () => {
    expect(rows("SELECT name FROM products WHERE name = 'cà phê muối'").rows.length).toBe(1);
    expect(rows("SELECT name FROM products WHERE name = 'cà phê muối'", 'oracle').rows.length).toBe(0);
    expect(rows("SELECT name FROM products WHERE name LIKE 'tra%'").rows.length).toBe(8);
    expect(rows('SELECT name, calories FROM products ORDER BY calories').rows[0][1]).toBe(null);
    expect(rows('SELECT name, calories FROM products ORDER BY calories', 'oracle').rows[13][1]).toBe(null);
    expect(rows('SELECT 1 + 1').rows).toEqual([[2]]);
    expect(rows('SELECT 1 + 1 FROM DUAL', 'oracle').rows).toEqual([[2]]);
    expect(rows("SELECT name FROM products WHERE launched_on > '2026-02-15'").rows.length).toBe(3);
    expect(rows("SELECT name FROM products WHERE launched_on > DATE '2026-02-15'", 'oracle').rows.length).toBe(3);
    expect(rows('SELECT price * 2 FROM products LIMIT 1', 'mysql').columns).toEqual(['price * 2']);
    expect(rows('SELECT price * 2 FROM products FETCH FIRST 1 ROW ONLY', 'oracle').columns).toEqual(['PRICE*2']);
  });
});
