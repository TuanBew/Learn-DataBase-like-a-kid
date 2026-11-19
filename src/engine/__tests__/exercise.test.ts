import { describe, expect, it } from 'vitest';
import { grade, run } from '../index';
import type { Dialect } from '../index';
import { exercises } from '../../content/exercises';
import { databases } from '../../data';

/** Mọi bài tập trong src/content/exercises: lời giải, đáp án sai và starter phải chạy đúng như bài hứa. */

describe('bài tập', () => {
  it('có ít nhất một bài', () => {
    expect(Object.keys(exercises).length).toBeGreaterThan(0);
  });

  for (const id of Object.keys(exercises)) {
    describe(id, () => {
      it('id trong file khớp với khóa trong map', async () => {
        expect((await exercises[id]()).id).toBe(id);
      });

      it('mỗi dialect của bài đều có lời giải, starter và đáp án sai', async () => {
        const ex = await exercises[id]();
        if (ex.kind === 'quiz') return;
        expect(ex.dialects.length).toBeGreaterThan(0);
        for (const d of ex.dialects) {
          expect(ex.solution[d], `solution ${d}`).toBeTruthy();
          expect(ex.starter[d], `starter ${d}`).toBeTruthy();
          expect(ex.hints.skeleton[d], `skeleton ${d}`).toBeTruthy();
          for (const w of ex.wrong) expect(w.sql[d], `wrong ${w.id} ${d}`).toBeTruthy();
        }
      });

      for (const d of ['mysql', 'oracle'] as Dialect[]) {
        it(`${d}: lời giải mẫu chạy không lỗi và tự chấm ra đúng`, async () => {
          const ex = await exercises[id]();
          if (ex.kind === 'quiz') return;
          if (!ex.dialects.includes(d)) return;
          const db = await databases[ex.database]();
          const sol = run(ex.solution[d]!, db, d);
          if (!sol.ok) throw new Error(`lời giải lỗi: ${sol.error.code} ${sol.error.dbMessage}`);
          expect(grade(sol.result, sol.result, ex.check).ok).toBe(true);
        });

        it(`${d}: mỗi đáp án sai chạy không lỗi và bị chấm sai`, async () => {
          const ex = await exercises[id]();
          if (ex.kind === 'quiz') return;
          if (!ex.dialects.includes(d)) return;
          const db = await databases[ex.database]();
          const sol = run(ex.solution[d]!, db, d);
          if (!sol.ok) throw new Error('lời giải lỗi');
          for (const w of ex.wrong) {
            const r = run(w.sql[d]!, db, d);
            if (!r.ok) throw new Error(`đáp án sai "${w.id}" lỗi: ${r.error.code} ${r.error.dbMessage}`);
            expect(grade(r.result, sol.result, ex.check).ok, `đáp án sai "${w.id}" lại được chấm đúng`).toBe(false);
          }
        });

        it(`${d}: kết quả của các đáp án sai khác nhau từng đôi`, async () => {
          const ex = await exercises[id]();
          if (ex.kind === 'quiz') return;
          if (!ex.dialects.includes(d)) return;
          const db = await databases[ex.database]();
          const results = ex.wrong.map((w) => {
            const r = run(w.sql[d]!, db, d);
            if (!r.ok) throw new Error(`đáp án sai "${w.id}" lỗi`);
            return { id: w.id, result: r.result };
          });
          for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
              const same = grade(results[i].result, results[j].result, ex.check).ok;
              expect(same, `"${results[i].id}" và "${results[j].id}" ra cùng kết quả, nên gợi ý sẽ lẫn`).toBe(false);
            }
          }
        });

        it(`${d}: starter chạy được hoặc báo lỗi có lời giải thích`, async () => {
          const ex = await exercises[id]();
          if (ex.kind === 'quiz') return;
          if (!ex.dialects.includes(d)) return;
          const db = await databases[ex.database]();
          const r = run(ex.starter[d]!, db, d);
          if (!r.ok) expect(r.error.friendly.trim().length).toBeGreaterThan(0);
        });
      }
    });
  }
});
