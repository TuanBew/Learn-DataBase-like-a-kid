import { describe, expect, it } from 'vitest';
import { databases } from '../data';
import { type ResultSet, createSession, grade, run } from '../engine';
import type { Database, Dialect, Value } from '../engine/types';
import { show } from '../engine/values';
import { exercises } from './exercises';
import { glossary } from './glossary';
import type { Exercise, Quiz, SqlExercise } from './types';

/**
 * Mọi bài tập phải giữ đúng lời hứa của nó:
 * lời giải mẫu chạy đúng ở mọi dialect đã khai, mỗi đáp án sai ra một kết quả khác lời giải
 * và khác nhau từng đôi (để mỗi lỗi ra đúng gợi ý của nó).
 */
const ids = Object.keys(exercises).sort();

const selectOf = (sql: string | undefined, db: Database, d: Dialect): ResultSet => {
  if (!sql) throw new Error(`${d}: thiếu query`);
  const r = run(sql, db, d);
  if (!r.ok) throw new Error(`${d}: ${sql} -> ${r.error.code} ${r.error.friendly}`);
  return r.result;
};

const stateOf = (sql: string | undefined, db: Database, d: Dialect, target: string): string => {
  if (!sql) throw new Error(`${d}: thiếu lệnh`);
  const r = createSession(db, d).run(sql);
  if (!r.ok) throw new Error(`${d}: ${sql} -> ${r.error.code} ${r.error.friendly}`);
  if (r.kind !== 'dml' || r.dml.table !== target) throw new Error(`${d}: ${sql} không sửa table ${target}`);
  return r.dml.after
    .map((row) => row.cells.map((v: Value) => show(v)).join('|'))
    .sort()
    .join('\n');
};

function checkQuiz(items: Quiz[]) {
  expect(items.length).toBeGreaterThanOrEqual(3);
  for (const q of items) {
    if (q.kind === 'choice') {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.options.filter((o) => o.correct).length).toBe(1);
      for (const o of q.options) expect(o.feedback.length).toBeGreaterThan(0);
    } else {
      expect(q.pairs.length).toBeGreaterThanOrEqual(3);
      expect(new Set(q.pairs.map((p) => p.left)).size).toBe(q.pairs.length);
      expect(new Set(q.pairs.map((p) => p.right)).size).toBe(q.pairs.length);
    }
  }
}

async function checkSql(ex: SqlExercise) {
  const db = await databases[ex.database]();
  expect(ex.dialects.length).toBeGreaterThan(0);
  for (const t of ex.tables) expect(db.tables.some((x) => x.name === t), `table ${t}`).toBe(true);
  expect(ex.hints.light.length).toBeGreaterThan(0);
  expect(ex.hints.specific.length).toBeGreaterThan(0);
  expect(ex.why.length).toBeGreaterThan(0);

  for (const d of ex.dialects) {
    expect(ex.hints.skeleton[d], `khung query cho ${d}`).toBeTruthy();
    expect(ex.starter[d], `starter cho ${d}`).toBeDefined();

    if (ex.kind === 'rehearsal') {
      const target = ex.target ?? ex.tables[0];
      const good = stateOf(ex.solution[d], db, d, target);
      const seen = new Map<string, string>([[good, 'lời giải']]);
      expect(ex.wrong.length).toBeGreaterThanOrEqual(1);
      for (const w of ex.wrong) {
        const s = stateOf(w.sql[d], db, d, target);
        expect(seen.get(s), `đáp án sai ${w.id} (${d}) trùng kết quả với ${seen.get(s)}`).toBeUndefined();
        seen.set(s, w.id);
      }
      continue;
    }

    const good = selectOf(ex.solution[d], db, d);
    expect(grade(good, good, ex.check).ok).toBe(true);

    if (ex.kind === 'order') {
      const pieces = ex.pieces?.[d] ?? [];
      expect(pieces.length).toBeGreaterThanOrEqual(3);
      expect(grade(selectOf(pieces.join('\n'), db, d), good, { orderMatters: true }).ok).toBe(true);
      continue;
    }
    if (ex.kind === 'predict') {
      // Người học chọn row của table đầu tiên, nên kết quả phải là một phần của table đó.
      const base = selectOf(`SELECT * FROM ${ex.tables[0]}`, db, d);
      expect(good.rows.length).toBeGreaterThan(0);
      expect(good.rows.length).toBeLessThan(base.rows.length);
      for (const id of good.rowIds) expect(base.rowIds.includes(id)).toBe(true);
      continue;
    }
    if (ex.kind === 'translate') {
      expect(ex.from, 'query gốc MySQL').toBeTruthy();
      const db2 = db;
      expect(grade(good, selectOf(ex.from, db2, 'mysql'), { orderMatters: ex.check.orderMatters }).ok, 'bản Oracle phải ra cùng kết quả với bản MySQL').toBe(true);
    }
    if (ex.kind === 'fill') expect(ex.starter[d]).toContain('____');
    if (ex.kind === 'debug') {
      const r = run(ex.starter[d] ?? '', db, d);
      // Query có lỗi: hoặc không chạy được, hoặc chạy ra kết quả sai.
      if (r.ok) expect(grade(r.result, good, ex.check).ok).toBe(false);
    }

    expect(ex.wrong.length, 'ít nhất 2 đáp án sai hay gặp').toBeGreaterThanOrEqual(2);
    const results: { id: string; r: ResultSet }[] = [];
    for (const w of ex.wrong) {
      const r = selectOf(w.sql[d], db, d);
      expect(grade(r, good, ex.check).ok, `đáp án sai ${w.id} (${d}) lại ra kết quả đúng`).toBe(false);
      for (const other of results) {
        expect(grade(r, other.r, { orderMatters: true }).ok, `đáp án sai ${w.id} và ${other.id} (${d}) ra cùng một kết quả`).toBe(false);
      }
      results.push({ id: w.id, r });
    }
  }
}

describe('bài tập', () => {
  it('có ít nhất một bài', () => {
    expect(ids.length).toBeGreaterThan(0);
  });

  for (const id of ids) {
    it(id, async () => {
      const ex: Exercise = await exercises[id]();
      expect(ex.id).toBe(id);
      expect(ex.chapter).toBe(Number(/^c(\d+)-/.exec(id)?.[1]));
      expect(ex.title.length).toBeGreaterThan(0);
      expect(ex.prompt.length).toBeGreaterThan(0);
      const text = JSON.stringify(ex);
      for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) expect(glossary[m[1]], `thuật ngữ [[${m[1]}]]`).toBeDefined();
      if (ex.kind === 'quiz') checkQuiz(ex.items);
      else await checkSql(ex);
    });
  }
});
