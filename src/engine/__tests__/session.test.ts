import { describe, expect, it } from 'vitest';
import { createSession, run } from '../index';
import type { Dialect, DmlTrace, Session, Value } from '../index';
import { teashop } from '../../data/teashop';

/**
 * Lệnh sửa dữ liệu qua createSession. Kết quả mong đợi viết tay từ dữ liệu trong src/data/teashop.ts
 * và từ tài liệu: M insert.html (nhiều row trong một INSERT), M commit.html (autocommit bật mặc định),
 * O COMMIT.html (DDL tự COMMIT ngầm), ME server-error-reference (1048, 1050, 1062, 1136, 1366, 1451, 1452, 3819),
 * E ora-00001, 00902, 00913, 00947, 00955, 01400, 01407, 01722, 01861, 02290, 02291, 02292.
 */

const cell = (v: Value) => (typeof v === 'object' && v !== null ? v.iso : v);
const dml = (s: Session, sql: string): DmlTrace => {
  const r = s.run(sql);
  if (!r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  if (r.kind !== 'dml') throw new Error(`[${s.dialect}] ${sql} -> kind ${r.kind}`);
  return r.dml;
};
const err = (s: Session, sql: string) => {
  const r = s.run(sql);
  if (r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> expected error, got ${r.kind}`);
  return r.error;
};
const good = (s: Session, sql: string) => {
  const r = s.run(sql);
  if (!r.ok) throw new Error(`[${s.dialect}] ${sql}\n   -> ${r.error.code} ${r.error.dbMessage}`);
  return r;
};
const rows = (s: Session, sql: string) => {
  const r = s.run(sql);
  if (!r.ok || r.kind !== 'select') throw new Error(`[${s.dialect}] ${sql} -> không phải SELECT thành công`);
  return r.result.rows.map((row) => row.map(cell));
};
const MYSQL = (): Session => createSession(teashop, 'mysql');
const ORACLE = (): Session => createSession(teashop, 'oracle');
const price = (s: Session, id: number) => rows(s, `SELECT price FROM products WHERE product_id = ${id}`)[0][0];
const count = (s: Session, t: string) => rows(s, `SELECT COUNT(*) FROM ${t}`)[0][0];

// Ngày trong INSERT: MySQL nhận chuỗi, Oracle cần DATE '...' hoặc TO_DATE.
const NEW_STORE: Record<Dialect, string> = {
  mysql: "INSERT INTO stores VALUES (5, 'Trà Mây Thủ Đức', 'Thủ Đức', 'TP. Hồ Chí Minh', '2026-03-01')",
  oracle: "INSERT INTO stores VALUES (5, 'Trà Mây Thủ Đức', 'Thủ Đức', 'TP. Hồ Chí Minh', DATE '2026-03-01')",
};

describe('INSERT', () => {
  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`${d}: INSERT đủ column thêm 1 row cuối table`, () => {
      const s = createSession(teashop, d);
      const t = dml(s, NEW_STORE[d]);
      expect(t.op).toBe('insert');
      expect(t.table).toBe('stores');
      expect(t.before.length).toBe(4);
      expect(t.after.length).toBe(5);
      expect(t.touched).toEqual([4]);
      expect(t.changed).toEqual([]);
      expect(t.noWhere).toBe(false);
      expect(rows(s, 'SELECT store_id, name, opened_on FROM stores WHERE store_id = 5')).toEqual([[5, 'Trà Mây Thủ Đức', '2026-03-01']]);
      expect(count(s, 'stores')).toBe(5);
    });

    it(`${d}: INSERT có danh sách column, column bỏ qua là NULL`, () => {
      const s = createSession(teashop, d);
      const t = dml(s, "INSERT INTO stores (store_id, name, city) VALUES (6, 'Trà Mây Đà Nẵng', 'Đà Nẵng')");
      expect(t.touched).toEqual([4]);
      expect(rows(s, 'SELECT store_id, name, district, city, opened_on FROM stores WHERE store_id = 6')).toEqual([[6, 'Trà Mây Đà Nẵng', null, 'Đà Nẵng', null]]);
    });

    it(`${d}: INSERT đổi thứ tự column theo danh sách`, () => {
      const s = createSession(teashop, d);
      dml(s, "INSERT INTO stores (name, store_id) VALUES ('Trà Mây Huế', 7)");
      expect(rows(s, 'SELECT store_id, name FROM stores WHERE store_id = 7')).toEqual([[7, 'Trà Mây Huế']]);
    });
  }

  it('MySQL: INSERT nhiều row trong một câu', () => {
    const s = MYSQL();
    const t = dml(s, "INSERT INTO stores (store_id, name) VALUES (5, 'A'), (6, 'B'), (7, 'C')");
    expect(t.touched).toEqual([4, 5, 6]);
    expect(t.after.length).toBe(7);
    expect(count(s, 'stores')).toBe(7);
  });

  it('Oracle 19c: INSERT nhiều row trong một câu ra ORA-00933', () => {
    const s = ORACLE();
    const e = err(s, "INSERT INTO stores (store_id, name) VALUES (5, 'A'), (6, 'B')");
    expect(e.code).toBe('ORA-00933');
    expect(count(s, 'stores')).toBe(4);
  });
});

describe('UPDATE', () => {
  it('UPDATE có WHERE chỉ đổi row khớp', () => {
    const s = MYSQL();
    const t = dml(s, "UPDATE products SET price = price + 1000 WHERE category = 'Topping'");
    expect(t.op).toBe('update');
    expect(t.noWhere).toBe(false);
    expect(t.where).toBe("category = 'Topping'");
    // Topping là mã 8, 9, 10, 14: vị trí 7, 8, 9, 13 trong table
    expect(t.touched).toEqual([7, 8, 9, 13]);
    // price là column thứ 4 (c3)
    expect(t.changed).toEqual(['c3']);
    expect(t.before.length).toBe(14);
    expect(t.after.length).toBe(14);
    expect(t.before.find((r) => r.id === 7)!.cells[3]).toBe(8000);
    expect(t.after.find((r) => r.id === 7)!.cells[3]).toBe(9000);
    expect(t.after.find((r) => r.id === 0)!.cells[3]).toBe(35000);
    expect(rows(s, "SELECT price FROM products WHERE category = 'Topping' ORDER BY product_id")).toEqual([[9000], [11000], [11000], [16000]]);
    expect(price(s, 1)).toBe(35000);
  });

  it('UPDATE nhiều column, changed liệt kê đủ', () => {
    const s = ORACLE();
    const t = dml(s, "UPDATE products SET price = 30000, calories = 100 WHERE product_id = 1");
    expect(t.touched).toEqual([0]);
    expect(t.changed).toEqual(['c3', 'c4']);
    expect(rows(s, 'SELECT price, calories FROM products WHERE product_id = 1')).toEqual([[30000, 100]]);
  });

  it('UPDATE WHERE không khớp row nào thì touched rỗng', () => {
    const s = MYSQL();
    const t = dml(s, 'UPDATE products SET price = 1 WHERE product_id = 999');
    expect(t.touched).toEqual([]);
    expect(price(s, 1)).toBe(35000);
  });

  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`${d}: UPDATE không WHERE đụng mọi row và có noWhere`, () => {
      const s = createSession(teashop, d);
      const t = dml(s, 'UPDATE products SET price = 0');
      expect(t.noWhere).toBe(true);
      expect(t.where).toBeUndefined();
      expect(t.touched.length).toBe(14);
      expect(rows(s, 'SELECT COUNT(*) FROM products WHERE price = 0')).toEqual([[14]]);
    });
  }
});

describe('DELETE', () => {
  it('DELETE có WHERE chỉ xóa row khớp, row còn lại giữ id cũ', () => {
    const s = MYSQL();
    const t = dml(s, 'DELETE FROM order_items WHERE item_id = 48');
    expect(t.op).toBe('delete');
    expect(t.noWhere).toBe(false);
    expect(t.where).toBe('item_id = 48');
    expect(t.touched).toEqual([47]);
    expect(t.before.length).toBe(48);
    expect(t.after.length).toBe(47);
    expect(t.after.some((r) => r.id === 47)).toBe(false);
    expect(t.after[46].id).toBe(46);
    expect(count(s, 'order_items')).toBe(47);
  });

  it('DELETE nhiều row theo điều kiện', () => {
    const s = ORACLE();
    // order_items của đơn 1001 là mã dòng 1 và 2
    const t = dml(s, 'DELETE FROM order_items WHERE order_id = 1001');
    expect(t.touched).toEqual([0, 1]);
    expect(count(s, 'order_items')).toBe(46);
  });

  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`${d}: DELETE không WHERE xóa hết row và có noWhere`, () => {
      const s = createSession(teashop, d);
      const t = dml(s, 'DELETE FROM order_items');
      expect(t.noWhere).toBe(true);
      expect(t.touched.length).toBe(48);
      expect(t.after.length).toBe(0);
      expect(count(s, 'order_items')).toBe(0);
    });
  }
});

describe('lưu thay đổi: autocommit, COMMIT, ROLLBACK', () => {
  it('MySQL: tự lưu sau mỗi lệnh, pending false, ROLLBACK không lấy lại được', () => {
    const s = MYSQL();
    const t = dml(s, 'DELETE FROM order_items');
    expect(t.pending).toBe(false);
    expect(s.pending()).toBe(0);
    const rb = good(s, 'ROLLBACK');
    expect(rb).toMatchObject({ kind: 'tx', op: 'rollback', changes: 0 });
    expect(count(s, 'order_items')).toBe(0);
  });

  it('Oracle: thay đổi chờ COMMIT, pending true, session.pending() tăng dần', () => {
    const s = ORACLE();
    expect(s.pending()).toBe(0);
    expect(dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1').pending).toBe(true);
    expect(s.pending()).toBe(1);
    expect(dml(s, 'UPDATE products SET price = 2 WHERE product_id = 2').pending).toBe(true);
    expect(s.pending()).toBe(2);
  });

  it('Oracle: ROLLBACK trả lại dữ liệu cũ', () => {
    const s = ORACLE();
    dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    dml(s, 'DELETE FROM order_items');
    expect(price(s, 1)).toBe(1);
    expect(count(s, 'order_items')).toBe(0);
    const rb = good(s, 'ROLLBACK');
    expect(rb).toMatchObject({ kind: 'tx', op: 'rollback', changes: 2 });
    expect(s.pending()).toBe(0);
    expect(price(s, 1)).toBe(35000);
    expect(count(s, 'order_items')).toBe(48);
  });

  it('Oracle: COMMIT lưu hẳn, ROLLBACK sau đó không trả lại', () => {
    const s = ORACLE();
    dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    const c = good(s, 'COMMIT');
    expect(c).toMatchObject({ kind: 'tx', op: 'commit', changes: 1 });
    expect(s.pending()).toBe(0);
    const rb = good(s, 'ROLLBACK');
    expect(rb).toMatchObject({ kind: 'tx', op: 'rollback', changes: 0 });
    expect(price(s, 1)).toBe(1);
  });

  it('Oracle: thay đổi sau COMMIT vẫn chờ COMMIT tiếp theo', () => {
    const s = ORACLE();
    dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    good(s, 'COMMIT');
    dml(s, 'UPDATE products SET price = 2 WHERE product_id = 2');
    good(s, 'ROLLBACK');
    expect(price(s, 1)).toBe(1);
    expect(price(s, 2)).toBe(45000);
  });

  it('MySQL: START TRANSACTION giữ thay đổi chờ, ROLLBACK trả lại', () => {
    const s = MYSQL();
    expect(good(s, 'START TRANSACTION')).toMatchObject({ kind: 'tx', op: 'begin' });
    const t = dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    expect(t.pending).toBe(true);
    expect(s.pending()).toBe(1);
    expect(price(s, 1)).toBe(1);
    expect(good(s, 'ROLLBACK')).toMatchObject({ kind: 'tx', op: 'rollback', changes: 1 });
    expect(price(s, 1)).toBe(35000);
  });

  it('MySQL: START TRANSACTION rồi COMMIT lưu hẳn, lệnh sau lại tự lưu', () => {
    const s = MYSQL();
    good(s, 'START TRANSACTION');
    dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    expect(good(s, 'COMMIT')).toMatchObject({ kind: 'tx', op: 'commit', changes: 1 });
    expect(price(s, 1)).toBe(1);
    const after = dml(s, 'UPDATE products SET price = 2 WHERE product_id = 2');
    expect(after.pending).toBe(false);
    good(s, 'ROLLBACK');
    expect(price(s, 2)).toBe(2);
  });

  it('MySQL: BEGIN mở transaction như START TRANSACTION', () => {
    const s = MYSQL();
    expect(good(s, 'BEGIN')).toMatchObject({ kind: 'tx', op: 'begin' });
    dml(s, 'DELETE FROM order_items');
    good(s, 'ROLLBACK');
    expect(count(s, 'order_items')).toBe(48);
  });
});

describe('lỗi constraint trên table có sẵn', () => {
  const NEW_ORDER: Record<Dialect, (cust: number) => string> = {
    mysql: (c) => `INSERT INTO orders VALUES (2000, ${c}, 1, 101, '2026-03-09 09:00:00', 'done', 'thẻ')`,
    oracle: (c) => `INSERT INTO orders VALUES (2000, ${c}, 1, 101, TO_DATE('2026-03-09 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), 'done', 'thẻ')`,
  };

  it('trùng primary key: 1062 và ORA-00001', () => {
    const sql = "INSERT INTO products (product_id, name, price) VALUES (1, 'Trà mới', 20000)";
    const m = err(MYSQL(), sql);
    expect(m.code).toBe('1062');
    expect(m.dbMessage).toContain('Duplicate entry');
    expect(err(ORACLE(), sql).code).toBe('ORA-00001');
  });

  it('UPDATE primary key thành giá trị đã có: 1062 và ORA-00001', () => {
    // order_items không có table nào trỏ tới, nên chỉ còn lỗi trùng key
    const sql = 'UPDATE order_items SET item_id = 2 WHERE item_id = 1';
    expect(err(MYSQL(), sql).code).toBe('1062');
    expect(err(ORACLE(), sql).code).toBe('ORA-00001');
  });

  it('NULL vào column là primary key: 1048 và ORA-01400', () => {
    const sql = "INSERT INTO products (product_id, name, price) VALUES (NULL, 'Trà mới', 20000)";
    const m = err(MYSQL(), sql);
    expect(m.code).toBe('1048');
    expect(m.dbMessage).toContain("Column 'product_id' cannot be null");
    expect(err(ORACLE(), sql).code).toBe('ORA-01400');
  });

  it('INSERT bỏ qua column primary key (thành NULL): 1048 và ORA-01400', () => {
    const sql = "INSERT INTO products (name, price) VALUES ('Trà mới', 20000)";
    expect(err(MYSQL(), sql).code).toBe('1048');
    expect(err(ORACLE(), sql).code).toBe('ORA-01400');
  });

  it('UPDATE column primary key thành NULL: MySQL 1048, Oracle ORA-01407', () => {
    const sql = 'UPDATE order_items SET item_id = NULL WHERE item_id = 1';
    expect(err(MYSQL(), sql).code).toBe('1048');
    expect(err(ORACLE(), sql).code).toBe('ORA-01407');
  });

  it('foreign key trỏ vào row không có: 1452 và ORA-02291', () => {
    const m = err(MYSQL(), NEW_ORDER.mysql(99));
    expect(m.code).toBe('1452');
    expect(m.dbMessage).toContain('Cannot add or update a child row');
    expect(err(ORACLE(), NEW_ORDER.oracle(99)).code).toBe('ORA-02291');
  });

  it('foreign key trỏ vào row có thì INSERT chạy', () => {
    const m = MYSQL();
    dml(m, NEW_ORDER.mysql(1));
    expect(count(m, 'orders')).toBe(21);
    const o = ORACLE();
    dml(o, NEW_ORDER.oracle(1));
    expect(count(o, 'orders')).toBe(21);
  });

  it('foreign key NULL được phép', () => {
    const m = MYSQL();
    dml(m, NEW_ORDER.mysql(0).replace('2000, 0,', '2000, NULL,'));
    expect(rows(m, 'SELECT customer_id FROM orders WHERE order_id = 2000')).toEqual([[null]]);
  });

  it('UPDATE foreign key sang giá trị không có: 1452 và ORA-02291', () => {
    const sql = 'UPDATE orders SET customer_id = 99 WHERE order_id = 1001';
    expect(err(MYSQL(), sql).code).toBe('1452');
    expect(err(ORACLE(), sql).code).toBe('ORA-02291');
  });

  it('xóa row đang có row khác trỏ tới: 1451 và ORA-02292', () => {
    // khách 1 có đơn 1001, 1006, 1020
    const sql = 'DELETE FROM customers WHERE customer_id = 1';
    const m = err(MYSQL(), sql);
    expect(m.code).toBe('1451');
    expect(m.dbMessage).toContain('Cannot delete or update a parent row');
    expect(err(ORACLE(), sql).code).toBe('ORA-02292');
  });

  it('xóa row không ai trỏ tới thì chạy (khách 3 có đơn nên dùng khách không có đơn)', () => {
    // khách 10, 11, 12 chưa có đơn nào
    const s = MYSQL();
    dml(s, 'DELETE FROM customers WHERE customer_id = 10');
    expect(count(s, 'customers')).toBe(11);
  });

  it('UPDATE đổi primary key của row đang được trỏ tới: 1451 và ORA-02292', () => {
    const sql = 'UPDATE stores SET store_id = 99 WHERE store_id = 1';
    expect(err(MYSQL(), sql).code).toBe('1451');
    expect(err(ORACLE(), sql).code).toBe('ORA-02292');
  });

  it('lỗi thì không đổi dữ liệu và không tăng pending', () => {
    const o = ORACLE();
    err(o, 'DELETE FROM customers WHERE customer_id = 1');
    expect(o.pending()).toBe(0);
    expect(count(o, 'customers')).toBe(12);
  });

  it('sai số giá trị: MySQL 1136; Oracle ORA-00947 khi thiếu, ORA-00913 khi thừa', () => {
    const few = "INSERT INTO stores (store_id, name) VALUES (5)";
    const many = "INSERT INTO stores (store_id, name) VALUES (5, 'A', 'B')";
    const fewAll = "INSERT INTO stores VALUES (5, 'A')";
    for (const sql of [few, many, fewAll]) expect(err(MYSQL(), sql).code).toBe('1136');
    expect(err(MYSQL(), few).dbMessage).toContain("Column count doesn't match value count at row 1");
    expect(err(ORACLE(), few).code).toBe('ORA-00947');
    expect(err(ORACLE(), fewAll).code).toBe('ORA-00947');
    expect(err(ORACLE(), many).code).toBe('ORA-00913');
  });

  it('chữ vào column số: MySQL 1366, Oracle ORA-01722', () => {
    const sql = "INSERT INTO products (product_id, name, price) VALUES (15, 'Trà mới', 'abc')";
    const m = err(MYSQL(), sql);
    expect(m.code).toBe('1366');
    expect(m.dbMessage).toContain('Incorrect');
    expect(err(ORACLE(), sql).code).toBe('ORA-01722');
  });

  it('UPDATE chữ vào column số: 1366 và ORA-01722', () => {
    const sql = "UPDATE products SET price = 'abc' WHERE product_id = 1";
    expect(err(MYSQL(), sql).code).toBe('1366');
    expect(err(ORACLE(), sql).code).toBe('ORA-01722');
  });

  it('Oracle: chuỗi ngày vào column DATE ra ORA-01861', () => {
    const sql = "INSERT INTO stores VALUES (5, 'Trà Mây Thủ Đức', 'Thủ Đức', 'TP. Hồ Chí Minh', '2026-03-01')";
    expect(err(ORACLE(), sql).code).toBe('ORA-01861');
    expect(count(ORACLE(), 'stores')).toBe(4);
  });

  it("Oracle: DATE '2026-03-01' và TO_DATE chạy", () => {
    const s = ORACLE();
    dml(s, NEW_STORE.oracle);
    dml(s, "INSERT INTO stores VALUES (6, 'B', 'B', 'B', TO_DATE('01/03/2026', 'DD/MM/YYYY'))");
    expect(rows(s, 'SELECT store_id, opened_on FROM stores WHERE store_id >= 5 ORDER BY store_id')).toEqual([
      [5, '2026-03-01'],
      [6, '2026-03-01'],
    ]);
  });

  it('MySQL: chuỗi ngày vào column DATE chạy', () => {
    const s = MYSQL();
    dml(s, NEW_STORE.mysql);
    expect(rows(s, 'SELECT opened_on FROM stores WHERE store_id = 5')).toEqual([['2026-03-01']]);
  });
});

describe('CREATE TABLE', () => {
  const CREATE: Record<Dialect, string> = {
    mysql: 'CREATE TABLE vouchers (voucher_id INT PRIMARY KEY, code VARCHAR(20) NOT NULL UNIQUE, percent INT CHECK (percent > 0 AND percent <= 100), valid_from DATE, made_at DATETIME)',
    oracle: 'CREATE TABLE vouchers (voucher_id NUMBER PRIMARY KEY, code VARCHAR2(20) NOT NULL UNIQUE, percent NUMBER CHECK (percent > 0 AND percent <= 100), valid_from DATE, made_at DATE)',
  };
  const DATE_LIT: Record<Dialect, string> = { mysql: "'2026-04-01'", oracle: "DATE '2026-04-01'" };
  const V = (d: Dialect, id: number, code: string, pct: string) => `INSERT INTO vouchers (voucher_id, code, percent, valid_from) VALUES (${id}, '${code}', ${pct}, ${DATE_LIT[d]})`;

  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    describe(d, () => {
      const fresh = () => {
        const s = createSession(teashop, d);
        good(s, CREATE[d]);
        return s;
      };

      it('data type đúng dialect: table mới tạo được, INSERT và SELECT được', () => {
        const s = createSession(teashop, d);
        const r = good(s, CREATE[d]);
        expect(r).toMatchObject({ kind: 'ddl', table: 'vouchers' });
        if (r.kind !== 'ddl') throw new Error('x');
        expect(r.columns.map((c) => c.name)).toEqual(['voucher_id', 'code', 'percent', 'valid_from', 'made_at']);
        expect(rows(s, 'SELECT COUNT(*) FROM vouchers')).toEqual([[0]]);
        dml(s, V(d, 1, 'TET', '10'));
        dml(s, V(d, 2, 'HE', '20'));
        expect(rows(s, 'SELECT voucher_id, code, percent, valid_from FROM vouchers ORDER BY voucher_id')).toEqual([
          [1, 'TET', 10, '2026-04-01'],
          [2, 'HE', 20, '2026-04-01'],
        ]);
      });

      it('CHECK chặn giá trị sai: 3819 và ORA-02290', () => {
        const s = fresh();
        const e = err(s, V(d, 1, 'TET', '0'));
        expect(e.code).toBe(d === 'mysql' ? '3819' : 'ORA-02290');
        expect(err(s, V(d, 1, 'TET', '101')).code).toBe(d === 'mysql' ? '3819' : 'ORA-02290');
        expect(rows(s, 'SELECT COUNT(*) FROM vouchers')).toEqual([[0]]);
        dml(s, V(d, 1, 'TET', '100'));
        expect(err(s, 'UPDATE vouchers SET percent = 200 WHERE voucher_id = 1').code).toBe(d === 'mysql' ? '3819' : 'ORA-02290');
      });

      it('UNIQUE chặn giá trị trùng: 1062 và ORA-00001', () => {
        const s = fresh();
        dml(s, V(d, 1, 'TET', '10'));
        expect(err(s, V(d, 2, 'TET', '20')).code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      });

      it('NOT NULL chặn NULL: 1048 và ORA-01400, UPDATE thành NULL là 1048 và ORA-01407', () => {
        const s = fresh();
        expect(err(s, `INSERT INTO vouchers (voucher_id, code, percent) VALUES (1, NULL, 10)`).code).toBe(d === 'mysql' ? '1048' : 'ORA-01400');
        dml(s, V(d, 1, 'TET', '10'));
        expect(err(s, 'UPDATE vouchers SET code = NULL WHERE voucher_id = 1').code).toBe(d === 'mysql' ? '1048' : 'ORA-01407');
      });

      it('column không có NOT NULL nhận NULL, CHECK bỏ qua NULL', () => {
        const s = fresh();
        dml(s, `INSERT INTO vouchers (voucher_id, code) VALUES (1, 'TET')`);
        expect(rows(s, 'SELECT percent, valid_from FROM vouchers')).toEqual([[null, null]]);
      });

      it('PRIMARY KEY của table mới chặn trùng', () => {
        const s = fresh();
        dml(s, V(d, 1, 'TET', '10'));
        expect(err(s, V(d, 1, 'HE', '20')).code).toBe(d === 'mysql' ? '1062' : 'ORA-00001');
      });

      it('tạo trùng tên table: 1050 và ORA-00955', () => {
        const s = fresh();
        expect(err(s, CREATE[d]).code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
        expect(err(s, 'CREATE TABLE products (a INT)'.replace('INT', d === 'mysql' ? 'INT' : 'NUMBER')).code).toBe(d === 'mysql' ? '1050' : 'ORA-00955');
      });

      it('FOREIGN KEY của table mới trỏ về table có sẵn', () => {
        const s = createSession(teashop, d);
        const type = d === 'mysql' ? 'INT' : 'NUMBER';
        good(s, `CREATE TABLE reviews (review_id ${type} PRIMARY KEY, product_id ${type} REFERENCES products (product_id))`);
        dml(s, 'INSERT INTO reviews VALUES (1, 3)');
        expect(err(s, 'INSERT INTO reviews VALUES (2, 99)').code).toBe(d === 'mysql' ? '1452' : 'ORA-02291');
        expect(err(s, 'DELETE FROM products WHERE product_id = 3').code).toBe(d === 'mysql' ? '1451' : 'ORA-02292');
      });
    });
  }

  it('MySQL: DATETIME nhận chuỗi ngày giờ', () => {
    const s = MYSQL();
    good(s, CREATE.mysql);
    dml(s, "INSERT INTO vouchers (voucher_id, code, made_at) VALUES (1, 'TET', '2026-03-09 10:30:00')");
    expect(rows(s, 'SELECT made_at FROM vouchers')).toEqual([['2026-03-09 10:30:00']]);
  });

  it('Oracle: DATETIME không phải data type (ORA-00902)', () => {
    const e = err(ORACLE(), 'CREATE TABLE vouchers (voucher_id NUMBER PRIMARY KEY, made_at DATETIME)');
    expect(e.code).toBe('ORA-00902');
  });

  it('MySQL: VARCHAR2 không phải data type (1064)', () => {
    const e = err(MYSQL(), 'CREATE TABLE vouchers (voucher_id INT PRIMARY KEY, code VARCHAR2(20))');
    expect(e.code).toBe('1064');
  });

  it('Oracle: NUMBER không có ở MySQL (1064) và INT chạy ở Oracle', () => {
    expect(err(MYSQL(), 'CREATE TABLE t1 (a NUMBER)').code).toBe('1064');
    good(ORACLE(), 'CREATE TABLE t1 (a INT)');
  });

  it('Oracle: AUTO_INCREMENT là lỗi', () => {
    err(ORACLE(), 'CREATE TABLE vouchers (voucher_id NUMBER PRIMARY KEY AUTO_INCREMENT, code VARCHAR2(20))');
  });

  it('MySQL: GENERATED AS IDENTITY là lỗi 1064', () => {
    const e = err(MYSQL(), 'CREATE TABLE vouchers (voucher_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code VARCHAR(20))');
    expect(e.code).toBe('1064');
  });

  it('MySQL: AUTO_INCREMENT chạy khi tạo table', () => {
    const s = MYSQL();
    good(s, 'CREATE TABLE vouchers (voucher_id INT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(20) NOT NULL)');
    dml(s, "INSERT INTO vouchers (voucher_id, code) VALUES (1, 'TET')");
    expect(rows(s, 'SELECT voucher_id, code FROM vouchers')).toEqual([[1, 'TET']]);
  });

  it('Oracle: GENERATED AS IDENTITY chạy khi tạo table', () => {
    const s = ORACLE();
    good(s, 'CREATE TABLE vouchers (voucher_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code VARCHAR2(20) NOT NULL)');
    expect(rows(s, 'SELECT COUNT(*) FROM vouchers')).toEqual([[0]]);
  });

  // Tài liệu MySQL (example-auto-increment.html): AUTO_INCREMENT sinh mã cho row mới khi INSERT không đưa mã.
  // LỖI ENGINE: session.ts không sinh mã cho AUTO_INCREMENT, INSERT bỏ qua column đó bị 1048 (NULL vào primary key).
  it('MySQL: INSERT không đưa mã thì AUTO_INCREMENT sinh mã 1, 2', () => {
    const s = MYSQL();
    good(s, 'CREATE TABLE vouchers (voucher_id INT PRIMARY KEY AUTO_INCREMENT, code VARCHAR(20) NOT NULL)');
    dml(s, "INSERT INTO vouchers (code) VALUES ('TET')");
    dml(s, "INSERT INTO vouchers (code) VALUES ('HE')");
    expect(rows(s, 'SELECT voucher_id, code FROM vouchers ORDER BY voucher_id')).toEqual([[1, 'TET'], [2, 'HE']]);
  });

  // Tài liệu Oracle (CREATE-TABLE.html): identity column nhận giá trị tăng dần ở mỗi INSERT.
  // LỖI ENGINE: session.ts không sinh mã cho identity column, INSERT bỏ qua column đó bị ORA-01400.
  it('Oracle: INSERT không đưa mã thì identity column sinh mã 1, 2', () => {
    const s = ORACLE();
    good(s, 'CREATE TABLE vouchers (voucher_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code VARCHAR2(20) NOT NULL)');
    dml(s, "INSERT INTO vouchers (code) VALUES ('TET')");
    dml(s, "INSERT INTO vouchers (code) VALUES ('HE')");
    expect(rows(s, 'SELECT voucher_id, code FROM vouchers ORDER BY voucher_id')).toEqual([[1, 'TET'], [2, 'HE']]);
  });

  it('Oracle: CREATE TABLE tự COMMIT ngầm, kéo theo thay đổi đang chờ', () => {
    const s = ORACLE();
    dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    expect(s.pending()).toBe(1);
    good(s, 'CREATE TABLE t1 (a NUMBER)');
    expect(s.pending()).toBe(0);
    good(s, 'ROLLBACK');
    expect(price(s, 1)).toBe(1);
  });

  it('MySQL: CREATE TABLE cũng chốt transaction đang mở', () => {
    const s = MYSQL();
    good(s, 'START TRANSACTION');
    dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1');
    good(s, 'CREATE TABLE t1 (a INT)');
    good(s, 'ROLLBACK');
    expect(price(s, 1)).toBe(1);
  });
});

describe('reset, database gốc, run()', () => {
  it('reset() trả về dữ liệu gốc, bỏ cả table mới và thay đổi chờ', () => {
    for (const d of ['mysql', 'oracle'] as Dialect[]) {
      const s = createSession(teashop, d);
      dml(s, 'DELETE FROM order_items');
      dml(s, 'UPDATE products SET price = 0');
      good(s, 'COMMIT');
      dml(s, 'UPDATE stores SET name = \'x\'');
      good(s, d === 'mysql' ? 'CREATE TABLE t1 (a INT)' : 'CREATE TABLE t1 (a NUMBER)');
      s.reset();
      expect(s.pending()).toBe(0);
      expect(count(s, 'order_items')).toBe(48);
      expect(price(s, 1)).toBe(35000);
      expect(rows(s, 'SELECT name FROM stores WHERE store_id = 1')).toEqual([['Trà Mây Cầu Giấy']]);
      expect(s.db().tables.map((t) => t.name)).toEqual(teashop.tables.map((t) => t.name));
      expect(err(s, 'SELECT * FROM t1').code).toBe(d === 'mysql' ? '1146' : 'ORA-00942');
    }
  });

  it('reset() thoát transaction của MySQL: lệnh sau lại tự lưu', () => {
    const s = MYSQL();
    good(s, 'START TRANSACTION');
    s.reset();
    expect(dml(s, 'UPDATE products SET price = 1 WHERE product_id = 1').pending).toBe(false);
  });

  it('database gốc truyền vào không bị đổi', () => {
    const before = JSON.stringify(teashop);
    for (const d of ['mysql', 'oracle'] as Dialect[]) {
      const s = createSession(teashop, d);
      dml(s, 'UPDATE products SET price = 0');
      dml(s, 'DELETE FROM order_items');
      dml(s, d === 'mysql' ? NEW_STORE.mysql : NEW_STORE.oracle);
      good(s, d === 'mysql' ? 'CREATE TABLE t1 (a INT)' : 'CREATE TABLE t1 (a NUMBER)');
      good(s, 'COMMIT');
      s.reset();
    }
    expect(JSON.stringify(teashop)).toBe(before);
    expect(teashop.tables.length).toBe(6);
  });

  it('hai session trên cùng database không ảnh hưởng nhau', () => {
    const a = MYSQL();
    const b = MYSQL();
    dml(a, 'UPDATE products SET price = 0');
    expect(price(b, 1)).toBe(35000);
  });

  it('db() phản ánh cả thay đổi chưa COMMIT', () => {
    const s = ORACLE();
    dml(s, 'UPDATE products SET price = 7 WHERE product_id = 1');
    expect(s.db().tables.find((t) => t.name === 'products')!.rows[0][3]).toBe(7);
  });

  for (const d of ['mysql', 'oracle'] as Dialect[]) {
    it(`${d}: run() thường từ chối INSERT, UPDATE, DELETE với hint select-only`, () => {
      for (const sql of ["INSERT INTO stores (store_id, name) VALUES (5, 'A')", 'UPDATE products SET price = 0', 'DELETE FROM order_items']) {
        const r = run(sql, teashop, d);
        expect(r.ok).toBe(false);
        if (!r.ok) {
          expect(r.error.hint).toBe('select-only');
          expect(r.error.kind).toBe('unsupported');
        }
      }
    });
  }

  it('session.run SELECT trả kind select', () => {
    const r = good(MYSQL(), 'SELECT COUNT(*) FROM products');
    expect(r.kind).toBe('select');
  });
});
