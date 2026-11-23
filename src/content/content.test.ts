import { describe, expect, it } from 'vitest';
import { databases } from '../data';
import { createSession, run } from '../engine';
import { chapters, totalHours, totalMinutes } from './course';
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

  it('số phút trong mục lục khớp file bài, và số giờ trang chủ tính từ đó', async () => {
    const bad: string[] = [];
    let sum = 0;
    for (const c of chapters) {
      for (const l of c.lessons) {
        if (l.exercise) continue;
        const lesson = await lessons[l.id]();
        if (lesson.minutes !== l.minutes) bad.push(`${l.id}: mục lục ${l.minutes}, file bài ${lesson.minutes}`);
        sum += l.minutes;
      }
    }
    expect(bad).toEqual([]);
    expect(totalMinutes).toBe(sum);
    expect(totalHours).toBe(Math.max(1, Math.round(sum / 60)));
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

      it('mọi lệnh trong workshop chạy được ở dialect đã khai', async () => {
        lesson ??= await lessons[id]();
        const bad: string[] = [];
        for (const b of lesson.blocks) {
          if (b.type !== 'workshop') continue;
          for (const d of b.dialects) {
            const s = createSession({ name: 'saomai', tables: [] }, d);
            const exec = (label: string, sql: string | undefined, expect: 'ok' | 'error') => {
              if (!sql) {
                bad.push(`${d}: thiếu lệnh cho "${label}"`);
                return;
              }
              const { failedAt, results } = s.runScript(sql);
              const last = results[results.length - 1];
              if (expect === 'ok' && failedAt !== undefined) {
                bad.push(`${d} [${label}]: lẽ ra chạy được -> ${!last.ok ? `${last.error.code} ${last.error.friendly}` : ''}`);
              }
              if (expect === 'error' && failedAt === undefined) bad.push(`${d} [${label}]: lẽ ra phải báo lỗi mà chạy qua`);
            };
            if (b.setup) exec('setup', b.setup[d], 'ok');
            exec('sql', b.sql[d], 'ok');
            for (const t of b.tries ?? []) exec(t.label, t.sql[d], (typeof t.expect === 'object' ? t.expect[d] : t.expect) ?? 'ok');
          }
        }
        expect(bad).toEqual([]);
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
              const r = b.session ? createSession(db, d).run(sql) : run(sql, db, d);
              if (!r.ok) bad.push(`${d}: ${sql} -> ${r.error.code} ${r.error.friendly}`);
            }
          }
        }
        expect(bad).toEqual([]);
      });
    });
  }
});
