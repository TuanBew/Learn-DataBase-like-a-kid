import { describe, expect, it } from 'vitest';
import { databases } from '../data';
import { run } from '../engine';
import { glossary } from './glossary';
import { lessons } from './lessons';
import type { Lesson, LessonBlock } from './types';

/** Mọi chuỗi chữ của một block, để soát thuật ngữ. */
function texts(b: LessonBlock): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(b);
  return out;
}

const ids = Object.keys(lessons).sort();

describe('nội dung bài học', () => {
  it('có ít nhất một bài', () => {
    expect(ids.length).toBeGreaterThan(0);
  });

  for (const id of ids) {
    describe(id, () => {
      let lesson: Lesson;
      it('tải được và đúng id', async () => {
        lesson = await lessons[id]();
        expect(lesson.id).toBe(id);
        expect(lesson.goals.length).toBeGreaterThanOrEqual(3);
        expect(lesson.blocks.some((b) => b.type === 'keypoints')).toBe(true);
        expect(lesson.blocks.some((b) => b.type === 'sources')).toBe(true);
      });

      it('mọi [[thuật ngữ]] đều có trong glossary', async () => {
        lesson ??= await lessons[id]();
        const missing = new Set<string>();
        for (const b of lesson.blocks) {
          for (const t of texts(b)) {
            for (const m of t.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) if (!glossary[m[1]]) missing.add(m[1]);
          }
        }
        expect([...missing]).toEqual([]);
      });

      it('mọi query trong playground chạy được ở dialect đã khai', async () => {
        lesson ??= await lessons[id]();
        const bad: string[] = [];
        for (const b of lesson.blocks) {
          if (b.type !== 'playground') continue;
          const db = await databases[b.database]();
          for (const d of b.dialects) {
            for (const q of [b.sql, ...(b.tries ?? []).map((t) => t.sql)]) {
              const sql = q[d];
              if (!sql) {
                bad.push(`${d}: thiếu query`);
                continue;
              }
              const r = run(sql, db, d);
              if (!r.ok) bad.push(`${d}: ${sql} -> ${r.error.code} ${r.error.friendly}`);
            }
          }
        }
        expect(bad).toEqual([]);
      });
    });
  }
});
