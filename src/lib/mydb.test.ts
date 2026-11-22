import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSession } from '../engine';
import type { Database } from '../engine/types';

function fakeStorage(opts: { throwOn?: 'get' | 'set' | 'both' } = {}) {
  const data = new Map<string, string>();
  return {
    data,
    getItem(k: string) {
      if (opts.throwOn === 'get' || opts.throwOn === 'both') throw new Error('blocked');
      return data.has(k) ? data.get(k)! : null;
    },
    setItem(k: string, v: string) {
      if (opts.throwOn === 'set' || opts.throwOn === 'both') throw new Error('quota');
      data.set(k, v);
    },
    removeItem(k: string) {
      data.delete(k);
    },
  };
}

type Mod = typeof import('./mydb');
async function load(storage: ReturnType<typeof fakeStorage>): Promise<Mod> {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage);
  return import('./mydb');
}

const built = (): Database => {
  const s = createSession({ name: 'saomai', tables: [] }, 'mysql');
  s.runScript("CREATE TABLE departments (department_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE); INSERT INTO departments (name) VALUES ('Kế toán');");
  return s.db();
};

describe('mydb', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('chưa lưu thì trả null', async () => {
    const m = await load(fakeStorage());
    expect(m.loadMyDb()).toBeNull();
  });

  it('lưu rồi nạp lại ra đúng database, và chạy tiếp được', async () => {
    const m = await load(fakeStorage());
    expect(m.saveMyDb(built())).toBe(true);
    const back = m.loadMyDb();
    expect(back?.tables.map((t) => t.name)).toEqual(['departments']);
    const s = createSession(back!, 'mysql');
    const r = s.run("INSERT INTO departments (name) VALUES ('Kỹ thuật')");
    expect(r.ok).toBe(true);
    expect(s.schema().tables[0].rows).toBe(2);
  });

  it('ghi JSON có số phiên bản dưới khóa ldb:mydb', async () => {
    const st = fakeStorage();
    const m = await load(st);
    m.saveMyDb(built());
    expect(JSON.parse(st.data.get('ldb:mydb')!).v).toBe(1);
  });

  it('dữ liệu hỏng hoặc khác phiên bản thì coi như chưa có', async () => {
    for (const raw of ['{not json', '[]', '{"v":99,"db":{"name":"x","tables":[]}}', '{"v":1,"db":{"name":"x"}}', '{"v":1,"db":{"name":"x","tables":[1]}}']) {
      const st = fakeStorage();
      st.data.set('ldb:mydb', raw);
      const m = await load(st);
      expect(m.loadMyDb()).toBeNull();
    }
  });

  it('clearMyDb xóa dữ liệu', async () => {
    const m = await load(fakeStorage());
    m.saveMyDb(built());
    m.clearMyDb();
    expect(m.loadMyDb()).toBeNull();
  });

  it('localStorage bị chặn thì không ném lỗi', async () => {
    const m = await load(fakeStorage({ throwOn: 'both' }));
    expect(m.loadMyDb()).toBeNull();
    expect(m.saveMyDb(built())).toBe(false);
    expect(() => m.clearMyDb()).not.toThrow();
  });
});
