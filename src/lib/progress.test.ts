import { beforeEach, describe, expect, it, vi } from 'vitest';

/** localStorage giả, đủ dùng cho test. */
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

type Mod = typeof import('./progress');

/** Nạp lại module để mỗi test có bộ nhớ đệm sạch. */
async function load(storage: ReturnType<typeof fakeStorage>): Promise<Mod> {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage);
  return import('./progress');
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ghi và đọc', () => {
  it('ghi rồi đọc lại', async () => {
    const st = fakeStorage();
    const p = await load(st);
    expect(p.getProgress()).toEqual({ v: 1, lessons: {}, exercises: {} });
    p.markLesson('c1-l1');
    p.markExercise('c3-e6', 'mysql');
    expect(p.isLessonDone('c1-l1')).toBe(true);
    expect(p.isLessonDone('c1-l2')).toBe(false);
    expect(p.isExerciseDone('c3-e6', 'mysql')).toBe(true);
    expect(p.isExerciseDone('c3-e6', 'oracle')).toBe(false);
    expect(p.isExerciseDone('c3-e6')).toBe(true);
    expect(JSON.parse(st.data.get('ldb:progress')!).v).toBe(1);
    // Máy khác nạp lại từ cùng localStorage
    const again = await load(st);
    expect(again.isLessonDone('c1-l1')).toBe(true);
  });

  it('giữ mốc đầu tiên và giữ nguyên tham chiếu khi không đổi', async () => {
    const p = await load(fakeStorage());
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    p.markLesson('a');
    const snap = p.getProgress();
    vi.setSystemTime(2000);
    p.markLesson('a');
    expect(p.getProgress()).toBe(snap);
    expect(p.getProgress().lessons.a).toBe(1000);
  });

  it('subscribe nhận thông báo và hủy được', async () => {
    const p = await load(fakeStorage());
    const fn = vi.fn();
    const off = p.subscribe(fn);
    p.markLesson('a');
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    p.markLesson('b');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resetProgress xóa hết', async () => {
    const p = await load(fakeStorage());
    p.markLesson('a');
    p.resetProgress();
    expect(p.isLessonDone('a')).toBe(false);
  });
});

describe('dữ liệu hỏng và localStorage lỗi', () => {
  it('JSON hỏng thì trả về trạng thái trống', async () => {
    const st = fakeStorage();
    st.data.set('ldb:progress', '{not json');
    const p = await load(st);
    expect(p.getProgress()).toEqual({ v: 1, lessons: {}, exercises: {} });
    p.markLesson('a');
    expect(p.isLessonDone('a')).toBe(true);
  });

  it('hình dạng sai thì bỏ phần sai', async () => {
    const st = fakeStorage();
    st.data.set('ldb:progress', JSON.stringify({ v: 1, lessons: { a: 'x', b: 5 }, exercises: { c: 3, d: { mysql: 7, oracle: 'no' } } }));
    const p = await load(st);
    expect(p.getProgress().lessons).toEqual({ b: 5 });
    expect(p.getProgress().exercises).toEqual({ d: { mysql: 7 } });
  });

  it('getItem ném lỗi thì không ném ra ngoài', async () => {
    const p = await load(fakeStorage({ throwOn: 'get' }));
    expect(p.getProgress()).toEqual({ v: 1, lessons: {}, exercises: {} });
    expect(() => p.markLesson('a')).not.toThrow();
  });

  it('setItem ném lỗi thì vẫn giữ trong bộ nhớ', async () => {
    const p = await load(fakeStorage({ throwOn: 'set' }));
    expect(() => p.markLesson('a')).not.toThrow();
    expect(p.isLessonDone('a')).toBe(true);
  });

  it('không có localStorage cũng không ném lỗi', async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', undefined);
    const p = await import('./progress');
    expect(() => p.markLesson('a')).not.toThrow();
    expect(p.isLessonDone('a')).toBe(true);
  });
});

describe('mã chuyển tiến trình', () => {
  it('export rồi import sang máy trống', async () => {
    const a = await load(fakeStorage());
    a.markLesson('c1-l1');
    a.markExercise('c3-e6', 'mysql');
    a.markExercise('c3-e6', 'oracle');
    const code = a.exportCode();
    expect(code).toMatch(/^LDB1-[A-Za-z0-9_-]+$/);
    const b = await load(fakeStorage());
    expect(b.importCode(code)).toEqual({ ok: true, added: 3 });
    expect(b.getProgress().lessons).toEqual(a.getProgress().lessons);
    expect(b.getProgress().exercises).toEqual(a.getProgress().exercises);
  });

  it('mã có tên tiếng Việt vẫn đi và về nguyên vẹn', async () => {
    const st = fakeStorage();
    st.data.set('ldb:progress', JSON.stringify({ v: 1, lessons: {}, exercises: {}, name: 'Ngọc Ánh' }));
    const a = await load(st);
    const code = a.exportCode();
    expect(/^[\x21-\x7e]+$/.test(code)).toBe(true);
    const b = await load(fakeStorage());
    b.importCode(code);
    expect(b.getProgress().name).toBe('Ngọc Ánh');
  });

  it('import gộp, giữ mốc sớm hơn, không xóa gì', async () => {
    const a = await load(fakeStorage());
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    a.markLesson('x');
    vi.setSystemTime(5000);
    a.markLesson('y');
    const code = a.exportCode();

    const b = await load(fakeStorage());
    vi.setSystemTime(3000);
    b.markLesson('x'); // muộn hơn mốc 1000
    b.markLesson('z');
    b.markExercise('e1', 'oracle');
    const r = b.importCode(code);
    expect(r).toEqual({ ok: true, added: 1 }); // chỉ y là mới
    expect(b.getProgress().lessons).toEqual({ x: 1000, y: 5000, z: 3000 });
    expect(b.isExerciseDone('e1', 'oracle')).toBe(true);
  });

  it('mã sai dạng thì không đổi dữ liệu', async () => {
    const p = await load(fakeStorage());
    p.markLesson('a');
    const before = p.getProgress();
    for (const bad of ['', 'hello', 'LDB1-', 'LDB1-!!!', 'LDB1-' + btoa('[1,2]'), 'LDB1-' + btoa('{"v":1,"l":5}')]) {
      expect(p.importCode(bad)).toEqual({ ok: false, reason: 'format' });
    }
    expect(p.getProgress()).toBe(before);
  });

  it('mã của phiên bản khác báo version', async () => {
    const p = await load(fakeStorage());
    expect(p.importCode('LDB2-abc')).toEqual({ ok: false, reason: 'version' });
    const future = btoa(JSON.stringify({ v: 2 })).replace(/=+$/, '');
    expect(p.importCode('LDB1-' + future)).toEqual({ ok: false, reason: 'version' });
  });
});

describe('migrate', () => {
  it('dữ liệu cũ chưa có v được đưa lên bản hiện tại', async () => {
    const p = await load(fakeStorage());
    const out = p.migrate({ lessons: { a: 10 }, exercises: { e: { mysql: 20 } } });
    expect(out).toEqual({ v: 1, lessons: { a: 10 }, exercises: { e: { mysql: 20 } } });
  });

  it('rác thì thành trạng thái trống', async () => {
    const p = await load(fakeStorage());
    for (const junk of [null, 5, 'x', [], undefined]) expect(p.migrate(junk)).toEqual({ v: 1, lessons: {}, exercises: {} });
  });
});
