import { describe, expect, it } from 'vitest';
import { functionCatalog } from '../engine';
import type { Dialect } from '../engine';
import { runExample } from '../lib/reference-run';
import { chapters } from './course';
import { reference } from './reference';

const lessonIds = new Set(chapters.flatMap((c) => c.lessons.map((l) => l.id)));
const words = (s: string) => s.toUpperCase().split(/[^A-Z0-9_]+/).filter(Boolean);

describe('trang Tra cứu', () => {
  it('id không trùng', () => {
    const ids = reference.map((e) => e.id);
    expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
  });

  it('mọi lesson có trong course.ts', () => {
    expect(reference.filter((e) => e.lesson && !lessonIds.has(e.lesson)).map((e) => `${e.id}: ${e.lesson}`)).toEqual([]);
  });

  it('mỗi mục có ít nhất một dialect hoặc note', () => {
    expect(reference.filter((e) => !e.mysql && !e.oracle).map((e) => e.id)).toEqual([]);
    expect(reference.filter((e) => (!e.mysql || !e.oracle) && !e.note).map((e) => e.id)).toEqual([]);
  });

  for (const dialect of ['mysql', 'oracle'] as Dialect[]) {
    it(`mọi function của ${dialect} có mục`, () => {
      const known = new Set(reference.flatMap((e) => [...words(e.title), ...e.keys.flatMap(words)]));
      expect(functionCatalog(dialect).filter((f) => !known.has(f.name)).map((f) => f.name)).toEqual([]);
    });

    it(`mọi ví dụ chạy được ở ${dialect}`, async () => {
      const bad: string[] = [];
      for (const e of reference) {
        const form = e[dialect];
        if (!form) continue;
        const r = await runExample(e.group, form.example, dialect);
        if (!r.ok) bad.push(`${e.id}: ${r.error.dbMessage ?? r.error.message}`);
      }
      expect(bad).toEqual([]);
    });
  }
});
