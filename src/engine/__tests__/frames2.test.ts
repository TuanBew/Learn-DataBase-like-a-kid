import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect, Trace } from '../index';
import { buildFrames } from '../../theater/frames';
import { teashop } from '../../data/teashop';

/**
 * Khung hình Theater cho các bước mới: JOIN, GROUP BY, HAVING, subquery.
 * Mỗi query chạy ở cả MySQL và Oracle (không dùng alias table có AS, không LIMIT).
 */

const queries: { name: string; sql: string }[] = [
  { name: 'INNER JOIN hai table', sql: 'SELECT o.order_id, c.full_name FROM orders o JOIN customers c ON c.customer_id = o.customer_id ORDER BY o.order_id' },
  { name: 'INNER JOIN ba table với WHERE', sql: "SELECT o.order_id, p.name, i.quantity FROM orders o JOIN order_items i ON i.order_id = o.order_id JOIN products p ON p.product_id = i.product_id WHERE o.status = 'done' AND i.quantity > 1" },
  { name: 'LEFT JOIN tìm row không khớp', sql: 'SELECT p.name FROM products p LEFT JOIN order_items i ON i.product_id = p.product_id WHERE i.item_id IS NULL ORDER BY p.product_id' },
  { name: 'nối bằng dấu phẩy', sql: 'SELECT o.order_id, s.name FROM orders o, stores s WHERE o.store_id = s.store_id AND s.city = \'Hà Nội\'' },
  { name: 'GROUP BY với COUNT', sql: 'SELECT category, COUNT(*) AS so_mon FROM products GROUP BY category' },
  { name: 'GROUP BY với HAVING', sql: 'SELECT category, SUM(price) AS tong FROM products GROUP BY category HAVING SUM(price) > 100000 ORDER BY tong DESC' },
  { name: 'JOIN, GROUP BY, ORDER BY', sql: "SELECT p.name, SUM(i.quantity) AS ly FROM orders o JOIN order_items i ON i.order_id = o.order_id JOIN products p ON p.product_id = i.product_id WHERE o.status = 'done' GROUP BY p.name ORDER BY ly DESC, p.name" },
  { name: 'function gom không GROUP BY', sql: 'SELECT COUNT(*), SUM(price), AVG(price), MIN(price), MAX(price) FROM products' },
  { name: 'LEFT JOIN, GROUP BY, HAVING', sql: 'SELECT c.customer_id, COUNT(o.order_id) AS don FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id HAVING COUNT(o.order_id) >= 2 ORDER BY c.customer_id' },
  { name: 'IN (subquery)', sql: "SELECT full_name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled') ORDER BY customer_id" },
  { name: 'NOT IN (subquery)', sql: 'SELECT name FROM products WHERE product_id NOT IN (SELECT product_id FROM order_items) ORDER BY product_id' },
  { name: 'scalar subquery trong WHERE', sql: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price' },
  { name: 'subquery trong HAVING', sql: 'SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id HAVING SUM(quantity) > (SELECT AVG(quantity) FROM order_items)' },
];

function trace(sql: string, d: Dialect): Trace {
  const r = run(sql, teashop, d);
  if (!r.ok) throw new Error(`[${d}] ${sql} -> ${r.error.code} ${r.error.dbMessage}`);
  return r.trace;
}

it('có ít nhất 10 query', () => {
  expect(queries.length).toBeGreaterThanOrEqual(10);
});

for (const dialect of ['mysql', 'oracle'] as Dialect[]) {
  describe(`khung hình Theater cho bước mới (${dialect})`, () => {
    for (const q of queries) {
      describe(q.name, () => {
        it('buildFrames không ném lỗi và có khung', () => {
          const frames = buildFrames(trace(q.sql, dialect));
          expect(frames.length).toBeGreaterThan(2);
        });

        it('khung đầu là written, khung cuối là done', () => {
          const frames = buildFrames(trace(q.sql, dialect));
          expect(frames[0].phase).toBe('written');
          expect(frames[frames.length - 1].phase).toBe('done');
        });

        it('row và column của khung cuối khớp kết quả của trace', () => {
          const t = trace(q.sql, dialect);
          const last = buildFrames(t).at(-1)!;
          expect(last.cols.map((col) => col.header)).toEqual(t.result.columns);
          expect(last.rows.map((r) => last.cols.map((col) => r.cells[col.key]))).toEqual(t.result.rows);
          expect(last.rows.map((r) => r.id)).toEqual(t.result.rowIds);
        });

        it('không khung nào có hai row trùng id', () => {
          const frames = buildFrames(trace(q.sql, dialect));
          for (const [i, f] of frames.entries()) {
            const ids = f.rows.map((r) => r.id);
            expect(new Set(ids).size, `khung ${i} (${f.phase})`).toBe(ids.length);
          }
        });
      });
    }
  });
}
