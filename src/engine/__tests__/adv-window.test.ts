import { describe, expect, it } from 'vitest';
import { bad, col0, each, exec, sel, sess } from './adv-util';

/**
 * Window function: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM, AVG, COUNT, MIN, MAX kèm OVER.
 * MySQL: kết quả, thứ tự row và mã lỗi đã kiểm trên MySQL 8.0.46 thật (database congty, xem adv-util.ts).
 * Oracle: theo tài liệu 19c (SQL Language Reference: Analytic Functions; Database Error Messages).
 */

const T = (name: string, fn: Parameters<typeof each>[2]) => each(it, name, fn);

describe('xếp hạng', () => {
  T('ROW_NUMBER, RANK, DENSE_RANK theo lương: row trùng giá trị thì cùng hạng', (d) => {
    const s = sess(d);
    const r = sel(s, 'SELECT name, ROW_NUMBER() OVER (ORDER BY salary) rn, RANK() OVER (ORDER BY salary) r, DENSE_RANK() OVER (ORDER BY salary) dr FROM employees');
    expect(r).toEqual([
      ['Em', 1, 1, 1],
      ['An', 2, 2, 2],
      ['Chi', 3, 3, 3],
      ['Dung', 4, 3, 3],
      ['Binh', 5, 5, 4],
    ]);
  });

  T('PARTITION BY: đánh số lại trong từng nhóm, NULL là một nhóm riêng', (d) => {
    const s = sess(d);
    const r = sel(s, 'SELECT name, dept, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY id) rn FROM employees ORDER BY dept, id');
    const byName = Object.fromEntries(r.map((x) => [x[0], x[2]]));
    expect(byName).toEqual({ An: 1, Binh: 2, Chi: 1, Dung: 2, Em: 1 });
  });

  T('ORDER BY giảm dần và NULL', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT RANK() OVER (ORDER BY dept DESC) FROM employees ORDER BY id')).toEqual(d === 'mysql' ? [1, 1, 3, 3, 5] : [2, 2, 4, 4, 1]);
  });

  it('mysql: ROW_NUMBER() OVER () đánh số theo thứ tự row, RANK() OVER () cho mọi row hạng 1', () => {
    const s = sess('mysql');
    expect(col0(s, 'SELECT ROW_NUMBER() OVER () FROM employees')).toEqual([1, 2, 3, 4, 5]);
    expect(col0(s, 'SELECT RANK() OVER () FROM employees')).toEqual([1, 1, 1, 1, 1]);
  });

  it('oracle: ROW_NUMBER, RANK, LAG không có ORDER BY trong OVER thì ORA-30485', () => {
    const s = sess('oracle');
    for (const f of ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'LAG(salary)']) {
      const e = bad(s, `SELECT ${f} OVER () FROM employees`);
      expect(e.code).toBe('ORA-30485');
      expect(e.friendly).toContain('ORDER BY');
    }
  });
});

describe('khung cộng dồn', () => {
  T('SUM có ORDER BY: row trùng giá trị ORDER BY nhận cùng kết quả', (d) => {
    const s = sess(d);
    expect(sel(s, 'SELECT name, SUM(salary) OVER (ORDER BY salary) s FROM employees')).toEqual([
      ['Em', 90],
      ['An', 190],
      ['Chi', 490],
      ['Dung', 490],
      ['Binh', 690],
    ]);
  });

  T('COUNT(*), MIN, MAX có ORDER BY cũng cộng dồn', (d) => {
    const s = sess(d);
    expect(sel(s, 'SELECT COUNT(*) OVER (ORDER BY salary) c, MAX(id) OVER (ORDER BY salary) m, MIN(id) OVER (ORDER BY salary) n FROM employees')).toEqual([
      [1, 5, 5],
      [2, 5, 1],
      [4, 5, 1],
      [4, 5, 1],
      [5, 5, 1],
    ]);
  });

  T('ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW: cộng từng row một, không gộp row trùng giá trị', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT SUM(salary) OVER (ORDER BY salary ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM employees')).toEqual([90, 190, 340, 490, 690]);
  });

  T('không có ORDER BY: tính trên cả partition', (d) => {
    const s = sess(d);
    const r = sel(s, 'SELECT name, AVG(salary) OVER (PARTITION BY dept) a, COUNT(*) OVER () c FROM employees ORDER BY id');
    expect(r.map((x) => x[1])).toEqual([150, 150, 150, 150, 90]);
    expect(r.map((x) => x[2])).toEqual([5, 5, 5, 5, 5]);
  });

  T('PARTITION BY kèm ORDER BY: cộng dồn trong từng nhóm', (d) => {
    const s = sess(d);
    const r = sel(s, 'SELECT id, SUM(salary) OVER (PARTITION BY dept ORDER BY id) s FROM employees ORDER BY id');
    expect(r).toEqual([[1, 100], [2, 300], [3, 150], [4, 300], [5, 90]]);
  });

  T('window function nằm trong biểu thức', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT salary - AVG(salary) OVER (PARTITION BY dept) FROM employees ORDER BY id')).toEqual([-50, 50, 0, 0, 0]);
  });
});

describe('LAG và LEAD', () => {
  T('LAG, LEAD với số row và giá trị mặc định', (d) => {
    const s = sess(d);
    const r = sel(s, "SELECT name, LAG(salary, 2, 0) OVER (ORDER BY id) a, LEAD(salary) OVER (ORDER BY id) b, LEAD(name, 1, 'none') OVER (ORDER BY id) c FROM employees");
    expect(r).toEqual([
      ['An', 0, 200, 'Binh'],
      ['Binh', 0, 150, 'Chi'],
      ['Chi', 100, 150, 'Dung'],
      ['Dung', 200, 90, 'Em'],
      ['Em', 150, null, 'none'],
    ]);
  });

  T('LAG không có giá trị mặc định thì ra NULL ở row đầu', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT LAG(salary) OVER (PARTITION BY dept ORDER BY id) FROM employees ORDER BY id')).toEqual([null, 100, null, 150, null]);
  });

  it('mysql: số row của LAG phải là số nguyên không âm viết thẳng (1064)', () => {
    const e = bad(sess('mysql'), 'SELECT LAG(salary, -1) OVER (ORDER BY id) FROM employees');
    expect(e.code).toBe('1064');
    expect(e.friendly).toContain('số nguyên');
  });
});

describe('window function trong query có GROUP BY, ORDER BY, subquery', () => {
  T('xếp hạng trên kết quả đã gom nhóm', (d) => {
    const s = sess(d);
    const r = sel(s, 'SELECT dept, SUM(salary) s, RANK() OVER (ORDER BY SUM(salary) DESC) r FROM employees GROUP BY dept ORDER BY dept');
    const m = Object.fromEntries(r.map((x) => [String(x[0]), x[2]]));
    expect(m).toEqual({ IT: 1, HR: 1, null: 3 });
  });

  T('ORDER BY nhận một window function', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT name FROM employees ORDER BY ROW_NUMBER() OVER (ORDER BY salary DESC)')).toEqual(['Binh', 'Chi', 'Dung', 'An', 'Em']);
  });

  T('muốn lọc theo window function: bọc trong subquery ở FROM', (d) => {
    const s = sess(d);
    const sub = 'SELECT name, ROW_NUMBER() OVER (ORDER BY salary DESC, id) AS rn FROM employees';
    expect(col0(s, `SELECT name FROM (${sub}) t WHERE rn <= 2 ORDER BY rn`)).toEqual(['Binh', 'Chi']);
  });

  T('không có ORDER BY ngoài: row ra theo thứ tự sắp của window cuối', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT name FROM employees WHERE id < 5 ORDER BY id')).toEqual(['An', 'Binh', 'Chi', 'Dung']);
    expect(col0(s, 'SELECT name, ROW_NUMBER() OVER (ORDER BY salary DESC) FROM employees')).toEqual(['Binh', 'Chi', 'Dung', 'An', 'Em']);
  });

  T('hai window khác thứ tự: lấy thứ tự của window đứng cuối', (d) => {
    const s = sess(d);
    expect(col0(s, 'SELECT name, ROW_NUMBER() OVER (ORDER BY name) b, ROW_NUMBER() OVER (ORDER BY salary DESC, id) a FROM employees')).toEqual(['Binh', 'Chi', 'Dung', 'An', 'Em']);
  });

  T('trace.partial là true khi có window function', (d) => {
    const s = sess(d);
    const r = exec(s, 'SELECT name, ROW_NUMBER() OVER (ORDER BY id) FROM employees');
    expect(r.kind === 'select' && r.trace.partial).toBe(true);
    const plain = exec(s, 'SELECT name FROM employees');
    expect(plain.kind === 'select' && plain.trace.partial).toBeFalsy();
  });

  it('mysql: tiêu đề column giữ nguyên chữ người học viết', () => {
    const r = exec(sess('mysql'), 'SELECT ROW_NUMBER() OVER (ORDER BY id) FROM employees');
    expect(r.kind === 'select' && r.result.columns).toEqual(['ROW_NUMBER() OVER (ORDER BY id)']);
  });
});

describe('window function đặt sai chỗ', () => {
  T('WHERE: báo đúng mã của từng DBMS, kèm cách bọc trong subquery', (d) => {
    const e = bad(sess(d), 'SELECT name FROM employees WHERE ROW_NUMBER() OVER (ORDER BY id) = 1');
    expect(e.code).toBe(d === 'mysql' ? '3593' : 'ORA-30483');
    expect(e.friendly).toContain('subquery ở FROM');
    expect(e.friendly).toContain('WHERE');
  });

  it('mysql: dbMessage đúng như MySQL in', () => {
    const e = bad(sess('mysql'), 'SELECT name FROM employees WHERE row_number() OVER (ORDER BY id) = 1');
    expect(e.dbMessage).toBe("ERROR 3593 (HY000): You cannot use the window function 'row_number' in this context.'");
  });

  T('HAVING và GROUP BY cũng không nhận window function', (d) => {
    const s = sess(d);
    const code = d === 'mysql' ? '3593' : 'ORA-30483';
    expect(bad(s, 'SELECT dept FROM employees GROUP BY dept HAVING RANK() OVER (ORDER BY dept) = 1').code).toBe(code);
    expect(bad(s, 'SELECT dept FROM employees GROUP BY ROW_NUMBER() OVER (ORDER BY id)').code).toBe(code);
  });

  T('ROW_NUMBER() không có OVER', (d) => {
    const e = bad(sess(d), 'SELECT name, ROW_NUMBER() FROM employees');
    expect(e.code).toBe(d === 'mysql' ? '1064' : 'ORA-30484');
    expect(e.friendly).toContain('OVER');
  });

  T('function thường không đi với OVER', (d) => {
    const e = bad(sess(d), 'SELECT UPPER(name) OVER () FROM employees');
    expect(e.code).toBe(d === 'mysql' ? '1064' : 'ORA-30484');
  });

  T('khung RANGE, khung ROWS dạng khác, DISTINCT trong window: khóa học chưa dạy', (d) => {
    const s = sess(d);
    expect(bad(s, 'SELECT SUM(salary) OVER (ORDER BY id RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM employees').kind).toBe('unsupported');
    expect(bad(s, 'SELECT SUM(salary) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) FROM employees').kind).toBe('unsupported');
    expect(bad(s, 'SELECT COUNT(DISTINCT dept) OVER () FROM employees').kind).toBe('unsupported');
  });
});

describe('COUNT(DISTINCT a, b)', () => {
  it('mysql: đếm các cặp khác nhau, bỏ cặp có NULL', () => {
    expect(col0(sess('mysql'), 'SELECT COUNT(DISTINCT dept, name) FROM employees')).toEqual([4]);
    expect(col0(sess('mysql'), 'SELECT COUNT(DISTINCT dept, salary) FROM employees')).toEqual([3]);
  });

  it('oracle: báo sai số tham số (ORA-00909)', () => {
    expect(bad(sess('oracle'), 'SELECT COUNT(DISTINCT dept, name) FROM employees').code).toBe('ORA-00909');
  });
});
