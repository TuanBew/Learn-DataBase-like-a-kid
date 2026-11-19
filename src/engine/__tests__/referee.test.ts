import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import type { Database as SqlJsDb } from 'sql.js';
import { run } from '../index';
import type { Dialect, Value } from '../index';
import { teashop } from '../../data/teashop';

/**
 * Trọng tài: SQLite (sql.js) chạy cùng query, rồi so với engine ở cả hai dialect.
 * Chỉ dùng query mà MySQL, Oracle và SQLite cho kết quả giống nhau:
 * không LIMIT/FETCH, không function, không chia, không so sánh chuỗi lệch hoa thường hay dấu,
 * không sắp xếp trên column có NULL hay giá trị trùng thiếu column phụ.
 */

const SQLITE_TYPE = { int: 'INTEGER', decimal: 'REAL', text: 'TEXT', date: 'TEXT', datetime: 'TEXT' } as const;

let sqlite: SqlJsDb;

beforeAll(async () => {
  const SQL = await initSqlJs();
  sqlite = new SQL.Database();
  for (const t of teashop.tables) {
    const cols = t.columns.map((c) => `${c.name} ${SQLITE_TYPE[c.type]}`).join(', ');
    sqlite.run(`CREATE TABLE ${t.name} (${cols})`);
    const ins = sqlite.prepare(`INSERT INTO ${t.name} VALUES (${t.columns.map(() => '?').join(', ')})`);
    for (const r of t.rows) ins.run(r);
    ins.free();
  }
});

type Cell = number | string | null;

const norm = (v: Value | Uint8Array): Cell => {
  if (v === null) return null;
  if (typeof v === 'object' && 'kind' in v) return v.iso;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v as Cell;
};

const asSet = (rows: Cell[][]) => rows.map((r) => JSON.stringify(r)).sort();

const queries: string[] = [
  // chọn column và biểu thức
  'SELECT * FROM products',
  'SELECT * FROM stores',
  'SELECT * FROM staff',
  'SELECT * FROM customers',
  'SELECT * FROM orders',
  'SELECT * FROM order_items',
  'SELECT name, price FROM products',
  'SELECT price * 2 FROM products',
  'SELECT name, price + 1000 AS price_up FROM products',
  'SELECT product_id, price - calories FROM products',
  'SELECT item_id, quantity * unit_price AS line_total FROM order_items',
  'SELECT salary + 500000, salary * 2 FROM staff',
  'SELECT name, launched_on FROM products',
  'SELECT ordered_at, status FROM orders',
  'SELECT opened_on FROM stores',
  'SELECT p.name, p.price FROM products p',
  'SELECT name AS ten_mon, price AS gia FROM products',
  // DISTINCT
  'SELECT DISTINCT category FROM products',
  'SELECT DISTINCT city FROM customers',
  'SELECT DISTINCT store_id FROM orders',
  'SELECT DISTINCT store_id, status FROM orders',
  'SELECT DISTINCT product_id FROM order_items',
  // WHERE: so sánh
  'SELECT name, price FROM products WHERE price > 30000',
  'SELECT name, price FROM products WHERE price >= 30000',
  'SELECT name, price FROM products WHERE price < 10000',
  'SELECT name, price FROM products WHERE price <= 10000',
  'SELECT name, price FROM products WHERE price = 25000',
  'SELECT name, price FROM products WHERE price <> 25000',
  'SELECT name, price FROM products WHERE price != 25000',
  "SELECT name FROM products WHERE category = 'Topping'",
  "SELECT name FROM products WHERE category = 'Cà phê'",
  "SELECT name FROM products WHERE category <> 'Trà sữa'",
  // AND, OR, NOT
  "SELECT name, price FROM products WHERE category = 'Topping' AND price > 9000",
  "SELECT name, price FROM products WHERE category = 'Cà phê' OR price > 45000",
  "SELECT name FROM products WHERE category = 'Topping' OR price > 40000 AND calories IS NOT NULL",
  "SELECT name FROM products WHERE (category = 'Topping' OR price > 40000) AND calories IS NOT NULL",
  'SELECT name FROM products WHERE NOT price > 30000',
  'SELECT name FROM products WHERE NOT (price > 30000 OR price < 10000)',
  'SELECT name FROM products WHERE calories > 100 AND NOT price > 40000',
  // NULL
  'SELECT name FROM products WHERE calories IS NULL',
  'SELECT name FROM products WHERE calories IS NOT NULL',
  'SELECT name, calories FROM products WHERE calories > 200',
  'SELECT name FROM products WHERE NOT calories > 200',
  'SELECT full_name FROM customers WHERE phone IS NULL',
  'SELECT order_id FROM orders WHERE customer_id IS NOT NULL AND status = \'done\'',
  'SELECT calories + 10 FROM products',
  // IN, BETWEEN, LIKE
  "SELECT name FROM products WHERE category IN ('Topping', 'Cà phê')",
  'SELECT name FROM products WHERE price IN (8000, 25000, 65000)',
  'SELECT name FROM products WHERE price NOT IN (8000, 25000, 65000)',
  'SELECT order_id FROM orders WHERE customer_id NOT IN (1, 2, 3)',
  'SELECT name, price FROM products WHERE price BETWEEN 25000 AND 40000',
  'SELECT name, price FROM products WHERE price NOT BETWEEN 25000 AND 40000',
  'SELECT item_id FROM order_items WHERE quantity BETWEEN 2 AND 3',
  "SELECT name FROM products WHERE category LIKE 'Top%'",
  "SELECT name FROM products WHERE category LIKE '%ping'",
  "SELECT full_name FROM customers WHERE phone LIKE '09%'",
  "SELECT full_name FROM customers WHERE phone LIKE '%7'",
  "SELECT full_name FROM customers WHERE phone LIKE '09_2%'",
  "SELECT full_name FROM customers WHERE phone NOT LIKE '09%'",
  "SELECT order_id FROM orders WHERE status LIKE 'can%' OR status LIKE 'do%'",
  // CASE
  "SELECT name, CASE WHEN price >= 40000 THEN 'dat' WHEN price >= 20000 THEN 'vua' ELSE 're' END AS muc FROM products",
  "SELECT order_id, CASE WHEN customer_id IS NULL THEN 'khach le' ELSE 'thanh vien' END FROM orders",
  "SELECT name, CASE WHEN calories IS NULL THEN 0 ELSE calories END FROM products",
  "SELECT product_id, CASE WHEN category = 'Topping' THEN price * 2 ELSE price END FROM products",
  // ORDER BY (luôn có column phụ duy nhất để phân định)
  'SELECT name, price FROM products ORDER BY price, product_id',
  'SELECT name, price FROM products ORDER BY price DESC, product_id',
  'SELECT name, price FROM products ORDER BY price ASC, product_id ASC',
  'SELECT product_id, price FROM products ORDER BY price DESC, product_id DESC',
  'SELECT name, price FROM products WHERE price > 30000 ORDER BY price, product_id',
  'SELECT staff_id, store_id, salary FROM staff ORDER BY store_id, salary DESC, staff_id',
  'SELECT order_id, store_id FROM orders ORDER BY store_id DESC, order_id',
  'SELECT order_id FROM orders ORDER BY ordered_at DESC',
  'SELECT product_id, launched_on FROM products ORDER BY launched_on, product_id',
  'SELECT customer_id, joined_on FROM customers ORDER BY joined_on DESC',
  'SELECT name, price FROM products ORDER BY 2, 1',
  'SELECT product_id, price FROM products ORDER BY 2 DESC, 1',
  'SELECT product_id, price * 2 AS gap_doi FROM products ORDER BY gap_doi DESC, product_id',
  'SELECT item_id, quantity * unit_price AS total FROM order_items ORDER BY total DESC, item_id',
  'SELECT item_id FROM order_items ORDER BY item_id DESC',
  "SELECT order_id, status FROM orders WHERE status = 'done' ORDER BY status, order_id DESC",
  'SELECT DISTINCT store_id FROM orders ORDER BY store_id DESC',
  'SELECT DISTINCT category, price FROM products ORDER BY price, category',
];

describe('trọng tài SQLite', () => {
  it('có ít nhất 40 query', () => {
    expect(queries.length).toBeGreaterThanOrEqual(40);
  });

  for (const sql of queries) {
    for (const dialect of ['mysql', 'oracle'] as Dialect[]) {
      it(`${dialect}: ${sql}`, () => {
        const ref = sqlite.exec(sql)[0];
        const expected: Cell[][] = ref ? ref.values.map((r) => r.map(norm)) : [];
        const got = run(sql, teashop, dialect);
        if (!got.ok) throw new Error(`engine lỗi ${got.error.code} ${got.error.dbMessage}`);
        const actual: Cell[][] = got.result.rows.map((r) => r.map(norm));
        if (/\bORDER BY\b/i.test(sql)) expect(actual).toEqual(expected);
        else expect(asSet(actual)).toEqual(asSet(expected));
      });
    }
  }
});
