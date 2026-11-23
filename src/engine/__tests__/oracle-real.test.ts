import { appendFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { databases } from '../../data';
import type { DbId } from '../../data';
import { exercises } from '../../content/exercises';
import { lessons } from '../../content/lessons';
import type { BuildExercise, SqlExercise } from '../../content/types';
import { createSession, run, splitStatements } from '../index';
import type { Database, ResultSet, RunResult } from '../index';
import { CLEAN, diffRows, load, normOra, normValue, runMany, sqlplus } from './oracle-real-util';
import type { OraResult } from './oracle-real-util';

/**
 * Đối chiếu dialect `oracle` của engine với Oracle thật. Chỉ chạy khi có `ORACLE_REAL=1` (cần container Docker, xem
 * `docs/dialect-verification.md`, mục Oracle). Mật khẩu đọc từ `ORA_PW`.
 *
 * Ba việc:
 * 1. Query của bài tập SQL (lời giải, đáp án sai hay gặp) và của khối playground: kết quả engine so với Oracle thật.
 *    Không có ORDER BY thì so như tập row. Tên column không phân biệt hoa thường. Ngày về YYYY-MM-DD. Số bỏ số 0 ở đuôi.
 * 2. Bài tập `rehearsal` (UPDATE, DELETE): table đích sau khi chạy lời giải, rồi ROLLBACK.
 * 3. Bài tập `build` và khối `workshop` trong bài học: chạy được hay báo lỗi, và mã ORA, từng lệnh một.
 *
 * Điểm lệch đã biết ghi ở `KNOWN`, mỗi điểm kèm lý do. Lệch mới thì test báo lỗi.
 */

/** Khóa là nhãn của điểm lệch. Giá trị là lý do chưa sửa. */
const KNOWN: Record<string, string> = {
  'c10-b2 workshop 1': 'Oracle XE 21c cho UPDATE ... SET c = (subquery nhiều row) chạy qua (5 rows updated); Oracle 18c báo ORA-01427 như engine. Coi 19c giống 18c.',
};

const REAL = !!process.env.ORACLE_REAL;
/** In số liệu ra console, và ghi thêm vào file `ORACLE_REAL_SUMMARY` nếu có (vitest có thể ẩn console). */
const report = (line: string) => {
  console.info(line);
  if (process.env.ORACLE_REAL_SUMMARY) appendFileSync(process.env.ORACLE_REAL_SUMMARY, `${line}\n`);
};

const colsEqual = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x.toLowerCase() === b[i].toLowerCase());

/** Engine chạy với giờ cố định (DEFAULT_ENV). Oracle thật cũng phải thấy giờ đó: thay SYSDATE và CURRENT_DATE bằng ngày giờ cố định. */
const NOW = "TO_DATE('2026-03-09 10:30:00', 'YYYY-MM-DD HH24:MI:SS')";
const pinTime = (sql: string) => sql.replace(/\b(SYSDATE|CURRENT_DATE)\b/gi, NOW);

/** So kết quả SELECT của engine với Oracle thật. Trả mô tả lệch, hoặc null. */
function compareSelect(eng: ResultSet, ora: OraResult, ordered: boolean): string | null {
  if (ora.code) return `Oracle báo ${ora.code} (${ora.message}), engine chạy được`;
  // Oracle không in tiêu đề khi không có row nào.
  if (ora.columns.length === 0) return eng.rows.length === 0 ? null : `số row: engine ${eng.rows.length}, Oracle 0`;
  if (!colsEqual(eng.columns, ora.columns)) return `tiêu đề: engine [${eng.columns.join(', ')}], Oracle [${ora.columns.join(', ')}]`;
  return diffRows(
    eng.rows.map((r) => r.map(normValue)),
    ora.rows.map((r) => r.map(normOra)),
    ordered,
  );
}

type Item = { label: string; sql: string; ordered: boolean };

/** FETCH FIRST hoặc ROWNUM mà không có ORDER BY: Oracle chọn row nào cũng được, chỉ so tiêu đề và số row. */
const picksArbitrary = (sql: string) => /\b(FETCH\s+FIRST|ROWNUM)\b/i.test(sql) && !/\bORDER\s+BY\b/i.test(sql);

/** Chạy một nhóm query trên engine và Oracle thật, trên database đã nạp. Trả các điểm lệch. */
function compareGroup(db: Database, items: Item[]): { bad: string[]; ok: number } {
  // Schema của database mẫu (ví dụ CONGTY) khác schema thật (HOC): đổi tên schema đứng trước dấu chấm.
  const schema = new RegExp(`\\b${db.name}\\.`, 'gi');
  const ora = runMany(items.map((i) => pinTime(i.sql).replace(schema, 'HOC.')));
  const bad: string[] = [];
  let ok = 0;
  items.forEach((it, k) => {
    const e = run(it.sql, db, 'oracle');
    const o = ora[k];
    let msg: string | null;
    if (!e.ok) msg = o.code === e.error.code ? null : `engine báo ${e.error.code}, Oracle ${o.code ?? 'chạy được'}`;
    else if (picksArbitrary(it.sql)) msg = o.code ? `Oracle báo ${o.code}` : o.columns.length && !colsEqual(e.result.columns, o.columns) ? 'tiêu đề lệch' : e.result.rows.length === o.rows.length ? null : `số row: engine ${e.result.rows.length}, Oracle ${o.rows.length}`;
    else msg = compareSelect(e.result, o, it.ordered);
    if (msg === null) ok++;
    else if (!KNOWN[it.label]) bad.push(`${it.label}: ${msg}`);
    else ok++;
  });
  return { bad, ok };
}

describe.skipIf(!REAL)('Oracle thật qua Docker', () => {
  it('query của bài tập SQL và playground ra cùng kết quả', { timeout: 900_000 }, async () => {
    const byDb = new Map<DbId, Item[]>();
    const rehearsals: { id: string; db: DbId; sql: string; target: string }[] = [];
    const add = (db: DbId, item: Item) => byDb.set(db, [...(byDb.get(db) ?? []), item]);

    for (const id of Object.keys(exercises).sort()) {
      const ex = await exercises[id]();
      if (ex.kind === 'quiz' || ex.kind === 'build') continue;
      const sx = ex as SqlExercise;
      if (!sx.dialects.includes('oracle')) continue;
      const sol = sx.solution.oracle;
      if (!sol) continue;
      if (sx.kind === 'rehearsal') {
        rehearsals.push({ id, db: sx.database, sql: sol, target: sx.target ?? sx.tables[0] });
        continue;
      }
      add(sx.database, { label: `${id} (lời giải)`, sql: sol, ordered: sx.check.orderMatters });
      for (const w of sx.wrong) if (w.sql.oracle) add(sx.database, { label: `${id} (sai: ${w.id})`, sql: w.sql.oracle, ordered: sx.check.orderMatters });
    }
    for (const id of Object.keys(lessons).sort()) {
      const lesson = await lessons[id]();
      for (const b of lesson.blocks) {
        if (b.type !== 'playground' || !b.dialects.includes('oracle') || b.session) continue;
        [b.sql, ...(b.tries ?? []).map((t) => t.sql)].forEach((q, n) => {
          if (q.oracle) add(b.database, { label: `${id} playground ${n === 0 ? 'sql' : `thử ${n}`}`, sql: q.oracle, ordered: false });
        });
      }
    }

    const bad: string[] = [];
    let total = 0;
    let good = 0;
    for (const [dbId, items] of byDb) {
      const db = await databases[dbId]();
      load(db);
      const r = compareGroup(db, items);
      total += items.length;
      good += r.ok;
      bad.push(...r.bad);
    }

    // Bài rehearsal: chạy lời giải rồi đọc table đích, mỗi bài ROLLBACK để bài sau thấy dữ liệu gốc.
    let rtotal = 0;
    let rgood = 0;
    const rbad: string[] = [];
    for (const dbId of new Set(rehearsals.map((r) => r.db))) {
      const db = await databases[dbId]();
      load(db);
      const list = rehearsals.filter((r) => r.db === dbId);
      const ora = runMany(list.flatMap((r) => [r.sql, `SELECT * FROM ${r.target}`, 'ROLLBACK']));
      list.forEach((r, k) => {
        rtotal++;
        const o = ora[k * 3];
        const after = ora[k * 3 + 1];
        const s = createSession(db, 'oracle').run(r.sql);
        let msg: string | null = null;
        if (!s.ok) msg = o.code === s.error.code ? null : `engine báo ${s.error.code}, Oracle ${o.code ?? 'chạy được'}`;
        else if (o.code) msg = `Oracle báo ${o.code} (${o.message}), engine chạy được`;
        else if (s.kind !== 'dml') msg = 'engine không trả kết quả dml';
        else msg = diffRows(s.dml.after.map((row) => row.cells.map(normValue)), after.rows.map((row) => row.map(normOra)), false);
        if (msg === null || KNOWN[`${r.id} (rehearsal)`]) rgood++;
        else rbad.push(`${r.id} (rehearsal): ${msg}`);
      });
    }
    const all = [...byDb.values()].flat();
    report(
      `query: ${good}/${total} khớp (lời giải ${all.filter((i) => i.label.endsWith('(lời giải)')).length}, đáp án sai ${all.filter((i) => i.label.includes('(sai:')).length}, playground ${all.filter((i) => i.label.includes('playground')).length}); rehearsal: ${rgood}/${rtotal} khớp`,
    );
    expect([...bad, ...rbad]).toEqual([]);
  });

  /** Chạy một chuỗi lệnh trên session engine và Oracle thật (schema đã dọn), so từng lệnh. */
  function compareScripts(label: string, scripts: string[]): { bad: string[]; n: number } {
    const s = createSession({ name: 'hoc', tables: [] }, 'oracle');
    const ran: { sql: string; r: RunResult }[] = [];
    for (const script of scripts) {
      for (const p of splitStatements(script, 'oracle')) {
        const r = s.run(p.sql);
        ran.push({ sql: p.sql, r });
        if (!r.ok) break; // như nút Chạy: dừng ở lệnh lỗi đầu tiên của mỗi lần Chạy
      }
    }
    const ora = ran.length ? runMany(ran.map((x) => x.sql)) : [];
    const bad: string[] = [];
    ran.forEach((x, i) => {
      const o = ora[i];
      const eCode = x.r.ok ? undefined : x.r.error.code;
      if (eCode !== o.code && !KNOWN[label]) bad.push(`${label}: «${x.sql.replace(/\s+/g, ' ').slice(0, 90)}» engine ${eCode ?? 'chạy được'}, Oracle ${o.code ?? 'chạy được'}${o.message ? ` (${o.message})` : ''}`);
    });
    return { bad, n: ran.length };
  }

  it('bài tập build và workshop: chạy được hay báo lỗi, cùng mã ORA', { timeout: 900_000 }, async () => {
    const bad: string[] = [];
    let builds = 0;
    let shops = 0;
    let stmts = 0;
    for (const id of Object.keys(exercises).sort()) {
      const ex = await exercises[id]();
      if (ex.kind !== 'build' || !ex.dialects.includes('oracle')) continue;
      const bx = ex as BuildExercise;
      sqlplus(CLEAN);
      const r = compareScripts(`${id} (build)`, [bx.base?.oracle ?? '', bx.solution.oracle ?? ''].filter(Boolean));
      builds++;
      stmts += r.n;
      bad.push(...r.bad);
    }
    for (const id of Object.keys(lessons).sort()) {
      const lesson = await lessons[id]();
      let k = 0;
      for (const b of lesson.blocks) {
        if (b.type !== 'workshop' || !b.dialects.includes('oracle')) continue;
        k++;
        sqlplus(CLEAN);
        const scripts = [b.setup?.oracle, b.sql.oracle, ...(b.tries ?? []).map((t) => t.sql.oracle)].filter((x): x is string => !!x);
        const r = compareScripts(`${id} workshop ${k}`, scripts);
        shops++;
        stmts += r.n;
        bad.push(...r.bad);
      }
    }
    report(`build: ${builds} bài, workshop: ${shops} khối, ${stmts} lệnh so từng lệnh, lệch ${bad.length}`);
    expect(bad).toEqual([]);
  });
});
