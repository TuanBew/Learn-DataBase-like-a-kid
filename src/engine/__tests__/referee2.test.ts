import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import type { Database as SqlJsDb } from 'sql.js';
import { run } from '../index';
import type { Database, Dialect, Value } from '../index';
import { teashop } from '../../data/teashop';
import { teashopBig } from '../../data/teashop-big';

/**
 * Trọng tài SQLite cho phần mới: JOIN, GROUP BY, HAVING, function gom, subquery, CASE, function đơn giản.
 * Chỉ dùng query chạy giống nhau ở MySQL, Oracle và SQLite:
 * không LIMIT/FETCH, không so chữ lệch hoa thường hay dấu, không LIKE với chữ có dấu, không chia số,
 * không function ngày, không nối chuỗi, không LENGTH/SUBSTR trên chữ có dấu,
 * ORDER BY đủ column để thứ tự duy nhất và không sắp trên column có NULL.
 * UPPER/LOWER chỉ dùng trên chữ ASCII (status). AVG so với sai lệch 1e-6.
 */

const SQLITE_TYPE = { int: 'INTEGER', decimal: 'REAL', text: 'TEXT', date: 'TEXT', datetime: 'TEXT' } as const;

const load = (SQL: { Database: new () => SqlJsDb }, db: Database): SqlJsDb => {
  const s = new SQL.Database();
  for (const t of db.tables) {
    const cols = t.columns.map((c) => `${c.name} ${SQLITE_TYPE[c.type]}`).join(', ');
    s.run(`CREATE TABLE ${t.name} (${cols})`);
    const ins = s.prepare(`INSERT INTO ${t.name} VALUES (${t.columns.map(() => '?').join(', ')})`);
    for (const r of t.rows) ins.run(r);
    ins.free();
  }
  return s;
};

let small: SqlJsDb;
let big: SqlJsDb;

beforeAll(async () => {
  const SQL = await initSqlJs();
  small = load(SQL, teashop);
  big = load(SQL, teashopBig);
});

type Cell = number | string | null;

/** Đổi về kiểu so được. Số làm tròn 6 chữ số thập phân để chịu sai lệch 1e-6 của AVG. */
const norm = (v: Value | Uint8Array): Cell => {
  if (v === null) return null;
  if (typeof v === 'object' && 'kind' in v) return v.iso;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return Math.round(v * 1e6) / 1e6;
  return v as Cell;
};

const asSet = (rows: Cell[][]) => rows.map((r) => JSON.stringify(r)).sort();

interface Q {
  sql: string;
  db?: 'big';
}
const queries: Q[] = [
  // INNER JOIN hai table
  { sql: 'SELECT o.order_id, c.full_name FROM orders o INNER JOIN customers c ON c.customer_id = o.customer_id' },
  { sql: 'SELECT o.order_id, c.full_name FROM orders o JOIN customers c ON o.customer_id = c.customer_id ORDER BY o.order_id' },
  { sql: 'SELECT s.name, st.full_name FROM staff st JOIN stores s ON s.store_id = st.store_id' },
  { sql: 'SELECT i.item_id, p.name, i.quantity FROM order_items i JOIN products p ON p.product_id = i.product_id ORDER BY i.item_id' },
  { sql: "SELECT o.order_id, s.district FROM orders o JOIN stores s ON s.store_id = o.store_id WHERE o.status = 'done' AND s.city = 'Hà Nội' ORDER BY o.order_id" },
  { sql: 'SELECT p.name, i.quantity * i.unit_price AS line_total FROM products p JOIN order_items i ON i.product_id = p.product_id WHERE i.quantity > 1 ORDER BY i.item_id' },
  { sql: 'SELECT a.staff_id, b.staff_id FROM staff a JOIN staff b ON a.store_id = b.store_id AND a.staff_id < b.staff_id ORDER BY a.staff_id, b.staff_id' },
  // INNER JOIN ba table
  { sql: 'SELECT o.order_id, p.name, i.quantity FROM orders o JOIN order_items i ON i.order_id = o.order_id JOIN products p ON p.product_id = i.product_id ORDER BY i.item_id' },
  { sql: "SELECT o.order_id, st.full_name, s.name FROM orders o JOIN staff st ON st.staff_id = o.staff_id JOIN stores s ON s.store_id = o.store_id WHERE o.payment = 'thẻ' ORDER BY o.order_id" },
  { sql: 'SELECT c.full_name, p.name FROM customers c JOIN orders o ON o.customer_id = c.customer_id JOIN order_items i ON i.order_id = o.order_id JOIN products p ON p.product_id = i.product_id WHERE p.price > 40000 ORDER BY i.item_id' },
  // LEFT JOIN
  { sql: 'SELECT o.order_id, c.full_name FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id ORDER BY o.order_id' },
  { sql: 'SELECT c.customer_id, o.order_id FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id ORDER BY c.customer_id, o.order_id' },
  { sql: 'SELECT c.full_name FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL ORDER BY c.customer_id' },
  { sql: 'SELECT p.name FROM products p LEFT JOIN order_items i ON i.product_id = p.product_id WHERE i.item_id IS NULL ORDER BY p.product_id' },
  { sql: 'SELECT p.product_id, i.item_id FROM products p LEFT OUTER JOIN order_items i ON i.product_id = p.product_id ORDER BY p.product_id, i.item_id' },
  { sql: 'SELECT o.order_id, i.item_id FROM orders o LEFT JOIN order_items i ON i.order_id = o.order_id AND i.quantity > 1 ORDER BY o.order_id, i.item_id' },
  { sql: 'SELECT o.order_id, c.full_name, s.name FROM orders o LEFT JOIN customers c ON c.customer_id = o.customer_id LEFT JOIN stores s ON s.store_id = o.store_id ORDER BY o.order_id' },
  { sql: 'SELECT s.store_id, o.order_id, i.item_id FROM stores s LEFT JOIN orders o ON o.store_id = s.store_id LEFT JOIN order_items i ON i.order_id = o.order_id WHERE o.status = \'cancelled\' ORDER BY i.item_id' },
  // nối bằng dấu phẩy
  { sql: 'SELECT o.order_id, s.name FROM orders o, stores s WHERE o.store_id = s.store_id' },
  { sql: 'SELECT o.order_id, s.name FROM orders o, stores s WHERE o.store_id = s.store_id AND s.store_id = 3 ORDER BY o.order_id' },
  { sql: 'SELECT o.order_id, p.name FROM orders o, order_items i, products p WHERE i.order_id = o.order_id AND p.product_id = i.product_id AND p.category = \'Topping\' ORDER BY i.item_id' },
  { sql: 'SELECT st.staff_id, s.store_id FROM staff st, stores s WHERE st.store_id = s.store_id AND st.salary > 8000000 ORDER BY st.staff_id' },
  // hàm gom không GROUP BY
  { sql: 'SELECT COUNT(*) FROM orders' },
  { sql: 'SELECT COUNT(customer_id) FROM orders' },
  { sql: 'SELECT COUNT(DISTINCT customer_id) FROM orders' },
  { sql: 'SELECT COUNT(*), COUNT(calories), COUNT(DISTINCT category) FROM products' },
  { sql: 'SELECT SUM(quantity), SUM(quantity * unit_price) FROM order_items' },
  { sql: 'SELECT MIN(price), MAX(price) FROM products' },
  { sql: 'SELECT AVG(price), AVG(calories) FROM products' },
  { sql: 'SELECT MIN(launched_on), MAX(launched_on) FROM products' },
  { sql: 'SELECT MIN(ordered_at), MAX(ordered_at) FROM orders' },
  { sql: 'SELECT COUNT(*), SUM(price), MIN(price), MAX(price) FROM products WHERE price > 1000000' },
  { sql: 'SELECT COUNT(*), SUM(i.quantity) FROM orders o JOIN order_items i ON i.order_id = o.order_id WHERE o.status = \'done\'' },
  // GROUP BY
  { sql: 'SELECT category, COUNT(*) FROM products GROUP BY category' },
  { sql: 'SELECT category, COUNT(*), SUM(price), MIN(price), MAX(price) FROM products GROUP BY category' },
  { sql: 'SELECT category, AVG(price) FROM products GROUP BY category ORDER BY category' },
  { sql: 'SELECT store_id, COUNT(*) FROM orders GROUP BY store_id ORDER BY store_id' },
  { sql: 'SELECT store_id, status, COUNT(*) FROM orders GROUP BY store_id, status ORDER BY store_id, status' },
  { sql: 'SELECT status, payment, COUNT(*), COUNT(DISTINCT store_id) FROM orders GROUP BY status, payment' },
  { sql: 'SELECT store_id, SUM(salary), AVG(salary) FROM staff GROUP BY store_id ORDER BY store_id' },
  { sql: 'SELECT s.name, COUNT(*) FROM orders o JOIN stores s ON s.store_id = o.store_id GROUP BY s.name ORDER BY s.name' },
  { sql: 'SELECT p.category, SUM(i.quantity) FROM order_items i JOIN products p ON p.product_id = i.product_id GROUP BY p.category ORDER BY p.category' },
  // HAVING
  { sql: 'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) >= 4 ORDER BY category' },
  { sql: 'SELECT category, SUM(price) AS tong FROM products GROUP BY category HAVING SUM(price) > 100000 ORDER BY tong DESC, category' },
  { sql: 'SELECT store_id, COUNT(*) FROM orders GROUP BY store_id HAVING COUNT(*) > 4 AND MAX(order_id) > 1015 ORDER BY store_id' },
  { sql: 'SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id HAVING SUM(quantity) >= 4 ORDER BY product_id' },
  { sql: 'SELECT product_id, COUNT(*) FROM order_items GROUP BY product_id HAVING COUNT(*) = 1' },
  { sql: 'SELECT category, AVG(price) FROM products GROUP BY category HAVING AVG(price) < 40000' },
  // WHERE + JOIN + GROUP BY
  // Món bằng số ly thì xếp theo product_id, không theo tên: SQLite xếp chữ đ theo mã ký tự, còn MySQL coi đ như d (xem dialect.test.ts).
  { sql: "SELECT p.name, SUM(i.quantity) AS ly FROM orders o JOIN order_items i ON i.order_id = o.order_id JOIN products p ON p.product_id = i.product_id WHERE o.status = 'done' GROUP BY p.product_id, p.name ORDER BY ly DESC, p.product_id" },
  { sql: "SELECT o.store_id, COUNT(*), SUM(i.quantity * i.unit_price) FROM orders o JOIN order_items i ON i.order_id = o.order_id WHERE o.status = 'done' AND o.payment <> 'thẻ' GROUP BY o.store_id ORDER BY o.store_id" },
  { sql: "SELECT c.customer_id, COUNT(*) AS don FROM customers c JOIN orders o ON o.customer_id = c.customer_id WHERE o.status = 'done' GROUP BY c.customer_id HAVING COUNT(*) >= 2 ORDER BY c.customer_id" },
  { sql: 'SELECT c.customer_id, COUNT(o.order_id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id ORDER BY c.customer_id' },
  { sql: 'SELECT p.product_id, COUNT(i.item_id), SUM(i.quantity) FROM products p LEFT JOIN order_items i ON i.product_id = p.product_id GROUP BY p.product_id ORDER BY p.product_id' },
  { sql: 'SELECT s.store_id, COUNT(*) FROM stores s, orders o WHERE o.store_id = s.store_id GROUP BY s.store_id ORDER BY s.store_id' },
  { sql: 'SELECT o.status, COUNT(*) FROM orders o, order_items i WHERE i.order_id = o.order_id AND i.quantity >= 2 GROUP BY o.status' },
  // IN, NOT IN, scalar subquery
  { sql: 'SELECT name FROM products WHERE product_id IN (SELECT product_id FROM order_items WHERE quantity >= 3)' },
  { sql: 'SELECT name FROM products WHERE product_id NOT IN (SELECT product_id FROM order_items) ORDER BY product_id' },
  { sql: 'SELECT order_id FROM orders WHERE order_id IN (SELECT order_id FROM order_items GROUP BY order_id HAVING SUM(quantity) >= 4) ORDER BY order_id' },
  { sql: "SELECT full_name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE status = 'cancelled') ORDER BY customer_id" },
  { sql: 'SELECT full_name FROM customers WHERE customer_id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL) ORDER BY customer_id' },
  { sql: "SELECT staff_id FROM staff WHERE store_id IN (SELECT store_id FROM stores WHERE city = 'Hà Nội') ORDER BY staff_id" },
  { sql: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products) ORDER BY price, product_id' },
  { sql: 'SELECT name FROM products WHERE price = (SELECT MAX(price) FROM products)' },
  { sql: 'SELECT name FROM products WHERE price < (SELECT MIN(unit_price) FROM order_items WHERE quantity = 3)' },
  { sql: 'SELECT order_id FROM orders WHERE store_id = (SELECT store_id FROM stores WHERE name = \'Trà Mây Quận 3\') ORDER BY order_id' },
  { sql: 'SELECT item_id FROM order_items WHERE unit_price > (SELECT AVG(price) FROM products WHERE category = \'Topping\') AND quantity > 1 ORDER BY item_id' },
  { sql: 'SELECT product_id FROM order_items GROUP BY product_id HAVING SUM(quantity) > (SELECT AVG(quantity) FROM order_items) ORDER BY product_id' },
  // CASE
  { sql: "SELECT name, CASE WHEN price >= 40000 THEN 'dat' WHEN price >= 20000 THEN 'vua' ELSE 're' END AS muc FROM products" },
  { sql: "SELECT CASE WHEN price >= 40000 THEN 'dat' ELSE 'thuong' END AS muc, COUNT(*) FROM products GROUP BY CASE WHEN price >= 40000 THEN 'dat' ELSE 'thuong' END" },
  { sql: "SELECT CASE WHEN calories IS NULL THEN 'chua ro' WHEN calories > 200 THEN 'nhieu' ELSE 'it' END AS calo, COUNT(*), SUM(price) FROM products GROUP BY CASE WHEN calories IS NULL THEN 'chua ro' WHEN calories > 200 THEN 'nhieu' ELSE 'it' END" },
  { sql: "SELECT SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) FROM orders" },
  { sql: "SELECT store_id, SUM(CASE WHEN payment = 'thẻ' THEN 1 ELSE 0 END) AS the FROM orders GROUP BY store_id ORDER BY store_id" },
  { sql: "SELECT i.order_id, CASE WHEN i.quantity > 1 THEN i.quantity * i.unit_price ELSE 0 END FROM order_items i ORDER BY i.item_id" },
  // UPPER, LOWER, ABS, ROUND, COALESCE
  { sql: 'SELECT UPPER(status), LOWER(status) FROM orders ORDER BY order_id' },
  { sql: "SELECT order_id FROM orders WHERE UPPER(status) = 'DONE' AND LOWER(status) = 'done' ORDER BY order_id" },
  { sql: 'SELECT UPPER(status), COUNT(*) FROM orders GROUP BY UPPER(status)' },
  { sql: 'SELECT product_id, ABS(price - 30000), ABS(calories - 200) FROM products ORDER BY product_id' },
  { sql: 'SELECT ABS(-5), ABS(0), ABS(price - 100000) FROM products WHERE product_id = 1' },
  { sql: 'SELECT product_id, ROUND(price), ROUND(calories) FROM products ORDER BY product_id' },
  { sql: 'SELECT category, ROUND(SUM(price)) FROM products GROUP BY category' },
  { sql: 'SELECT product_id, COALESCE(calories, 0), COALESCE(calories, price) FROM products ORDER BY product_id' },
  { sql: 'SELECT customer_id, COALESCE(phone, \'khong co\') FROM customers ORDER BY customer_id' },
  { sql: 'SELECT SUM(COALESCE(calories, 0)), COUNT(COALESCE(calories, 0)) FROM products' },
  { sql: 'SELECT c.customer_id, COALESCE(c.phone, \'khong co\'), COUNT(o.order_id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id, c.phone ORDER BY c.customer_id' },
  // báo cáo trên bản lớn
  { db: 'big', sql: 'SELECT COUNT(*), COUNT(customer_id), COUNT(DISTINCT customer_id) FROM orders' },
  { db: 'big', sql: 'SELECT store_id, status, COUNT(*) FROM orders GROUP BY store_id, status ORDER BY store_id, status' },
  { db: 'big', sql: "SELECT s.name, COUNT(*) AS don, SUM(i.quantity * i.unit_price) AS doanh_thu FROM orders o JOIN stores s ON s.store_id = o.store_id JOIN order_items i ON i.order_id = o.order_id WHERE o.status = 'done' GROUP BY s.name ORDER BY doanh_thu DESC, s.name" },
  { db: 'big', sql: "SELECT p.category, SUM(i.quantity), AVG(i.unit_price) FROM order_items i JOIN products p ON p.product_id = i.product_id JOIN orders o ON o.order_id = i.order_id WHERE o.status = 'done' GROUP BY p.category ORDER BY p.category" },
  { db: 'big', sql: 'SELECT p.product_id, SUM(i.quantity) AS ly FROM products p LEFT JOIN order_items i ON i.product_id = p.product_id GROUP BY p.product_id HAVING SUM(i.quantity) > 20 ORDER BY ly DESC, p.product_id' },
  { db: 'big', sql: 'SELECT customer_id, COUNT(*) FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id HAVING COUNT(*) >= 15 ORDER BY customer_id' },
  { db: 'big', sql: 'SELECT order_id FROM order_items GROUP BY order_id HAVING SUM(quantity * unit_price) > (SELECT AVG(quantity * unit_price) FROM order_items) * 3 ORDER BY order_id' },
  { db: 'big', sql: 'SELECT name FROM products WHERE product_id NOT IN (SELECT product_id FROM order_items) ORDER BY product_id' },
];

const usable = queries;

describe('trọng tài SQLite: JOIN, GROUP BY, subquery', () => {
  it('có ít nhất 60 query', () => {
    expect(usable.length).toBeGreaterThanOrEqual(60);
  });

  for (const q of usable) {
    for (const dialect of ['mysql', 'oracle'] as Dialect[]) {
      it(`${dialect}${q.db ? ' (big)' : ''}: ${q.sql}`, () => {
        const ref = (q.db ? big : small).exec(q.sql)[0];
        const expected: Cell[][] = ref ? ref.values.map((r) => r.map(norm)) : [];
        const got = run(q.sql, q.db ? teashopBig : teashop, dialect);
        if (!got.ok) throw new Error(`engine lỗi ${got.error.code} ${got.error.dbMessage}`);
        const actual: Cell[][] = got.result.rows.map((r) => r.map(norm));
        if (/\bORDER BY\b/i.test(q.sql)) expect(actual).toEqual(expected);
        else expect(asSet(actual)).toEqual(asSet(expected));
      });
    }
  }
});
