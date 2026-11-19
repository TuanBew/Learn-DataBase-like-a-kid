import { describe, expect, it } from 'vitest';
import { run } from '../index';
import type { Dialect, Trace } from '../index';
import { buildFrames } from '../../theater/frames';
import { teashop } from '../../data/teashop';

interface Case {
  name: string;
  mysql: string;
  oracle: string;
  /** Table gốc của query, hoặc null nếu không có FROM thật. */
  table: string | null;
  where: boolean;
  order: boolean;
  limit: boolean;
}

const cases: Case[] = [
  {
    name: 'SELECT * không điều kiện',
    mysql: 'SELECT * FROM products',
    oracle: 'SELECT * FROM products',
    table: 'products',
    where: false,
    order: false,
    limit: false,
  },
  {
    name: 'chọn column với WHERE',
    mysql: 'SELECT name, price FROM products WHERE price > 30000',
    oracle: 'SELECT name, price FROM products WHERE price > 30000',
    table: 'products',
    where: true,
    order: false,
    limit: false,
  },
  {
    name: 'DISTINCT',
    mysql: 'SELECT DISTINCT category FROM products',
    oracle: 'SELECT DISTINCT category FROM products',
    table: 'products',
    where: false,
    order: false,
    limit: false,
  },
  {
    name: 'column tính toán, WHERE, ORDER BY alias',
    mysql: "SELECT name, price * 2 AS gap_doi FROM products WHERE category = 'Topping' ORDER BY gap_doi DESC",
    oracle: "SELECT name, price * 2 AS gap_doi FROM products WHERE category = 'Topping' ORDER BY gap_doi DESC",
    table: 'products',
    where: true,
    order: true,
    limit: false,
  },
  {
    name: 'ORDER BY column có NULL',
    mysql: 'SELECT name, calories FROM products ORDER BY calories, product_id',
    oracle: 'SELECT name, calories FROM products ORDER BY calories, product_id',
    table: 'products',
    where: false,
    order: true,
    limit: false,
  },
  {
    name: 'WHERE, ORDER BY, giới hạn row',
    mysql: 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price LIMIT 3',
    oracle: 'SELECT name, price FROM products WHERE price > 30000 ORDER BY price FETCH FIRST 3 ROWS ONLY',
    table: 'products',
    where: true,
    order: true,
    limit: true,
  },
  {
    name: 'bỏ row đầu rồi lấy n row',
    mysql: 'SELECT product_id FROM products ORDER BY product_id LIMIT 2, 3',
    oracle: 'SELECT product_id FROM products ORDER BY product_id OFFSET 2 ROWS FETCH NEXT 3 ROWS ONLY',
    table: 'products',
    where: false,
    order: true,
    limit: true,
  },
  {
    name: 'giới hạn row không ORDER BY',
    mysql: 'SELECT name FROM products LIMIT 2',
    oracle: 'SELECT name FROM products FETCH FIRST 2 ROWS ONLY',
    table: 'products',
    where: false,
    order: false,
    limit: true,
  },
  {
    name: 'WHERE IS NULL trên table có row NULL',
    mysql: 'SELECT full_name FROM customers WHERE phone IS NULL',
    oracle: 'SELECT full_name FROM customers WHERE phone IS NULL',
    table: 'customers',
    where: true,
    order: false,
    limit: false,
  },
  {
    name: 'không có FROM thật',
    mysql: 'SELECT 1 + 1 FROM DUAL',
    oracle: 'SELECT 1 + 1 FROM DUAL',
    table: null,
    where: false,
    order: false,
    limit: false,
  },
];

function trace(sql: string, d: Dialect): Trace {
  const r = run(sql, teashop, d);
  if (!r.ok) throw new Error(`[${d}] ${sql} -> ${r.error.code} ${r.error.dbMessage}`);
  return r.trace;
}

for (const dialect of ['mysql', 'oracle'] as Dialect[]) {
  describe(`khung hình Theater (${dialect})`, () => {
    for (const c of cases) {
      describe(c.name, () => {
        const sql = c[dialect];
        const t = trace(sql, dialect);
        const frames = buildFrames(t);

        it('dựng được khung hình', () => {
          expect(frames.length).toBeGreaterThan(2);
        });

        it('khung đầu là written, khung cuối là done', () => {
          expect(frames[0].phase).toBe('written');
          expect(frames[frames.length - 1].phase).toBe('done');
        });

        it('row và column của khung cuối khớp kết quả của trace', () => {
          const last = frames[frames.length - 1];
          expect(last.cols.map((col) => col.header)).toEqual(t.result.columns);
          const got = last.rows.map((r) => last.cols.map((col) => r.cells[col.key]));
          expect(got).toEqual(t.result.rows);
          expect(last.rows.map((r) => r.id)).toEqual(t.result.rowIds);
        });

        it('không khung nào có hai row trùng id', () => {
          for (const [i, f] of frames.entries()) {
            const ids = f.rows.map((r) => r.id);
            expect(new Set(ids).size, `khung ${i} (${f.phase})`).toBe(ids.length);
          }
        });

        if (c.where && c.table) {
          it('máy soi đi qua từng row của table khi có WHERE', () => {
            const total = teashop.tables.find((x) => x.name === c.table)!.rows.length;
            expect(frames.filter((f) => f.scan !== null).length).toBe(total);
          });
        } else {
          it('không có máy soi khi không có WHERE', () => {
            expect(frames.filter((f) => f.scan !== null).length).toBe(0);
          });
        }

        it('chỉ có khung của phase mà query thật sự có', () => {
          const phases = new Set(frames.map((f) => f.phase));
          expect(phases.has('where')).toBe(c.where);
          expect(phases.has('order')).toBe(c.order);
          expect(phases.has('limit')).toBe(c.limit);
          expect(phases.has('from')).toBe(c.table !== null);
          expect(phases.has('select')).toBe(true);
        });

        it('khung limit có cổng chặn khi có giới hạn row', () => {
          if (!c.limit) {
            expect(frames.some((f) => f.gate !== null)).toBe(false);
          } else {
            expect(frames.some((f) => f.gate !== null)).toBe(true);
          }
        });
      });
    }
  });
}
