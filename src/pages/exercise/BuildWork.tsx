import { useMemo, useState } from 'react';
import { HintLadder } from '../../components/HintLadder';
import { Icon } from '../../components/Icon';
import { Says } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { SchemaPanel } from '../../components/SchemaPanel';
import { type ScriptOut, ScriptOutput, runScript } from '../../components/ScriptOutput';
import { DialectToggle, EditorBox } from '../../components/sql/parts';
import type { BuildExercise } from '../../content/types';
import { uiApp } from '../../content/ui-app';
import { uiWorkshop } from '../../content/ui-workshop';
import { type SchemaReport, type Session, createSession, gradeSchema } from '../../engine';
import type { Database, Dialect } from '../../engine/types';
import { emptyDb, loadMyDb, saveMyDb } from '../../lib/mydb';
import { markExercise, useProgress } from '../../lib/progress';
import { play } from '../../sfx/sfx';
import { DoneCard } from './shared';
import './build-work.css';
import '../../components/playground.css';
import '../../components/workshop.css';

const U = uiApp.exercise;
const W = uiWorkshop;
const B = uiWorkshop.build;

const hasTable = (db: Database, name: string) => db.tables.some((t) => t.name.toLowerCase() === name.toLowerCase());

/** Mở bài: database trống, hoặc "Database của bạn" khi bài làm tiếp các bài trước. */
function openDb(ex: BuildExercise): { db: Database; missing: string[] } {
  if (ex.start !== 'mine') return { db: emptyDb(), missing: [] };
  const db = loadMyDb() ?? emptyDb();
  return { db, missing: (ex.needs ?? []).filter((n) => !hasTable(db, n)) };
}

/** Bài dựng table: viết lệnh tạo table, máy chấm so cấu trúc với `spec` sau mỗi lần Chạy. */
export function BuildWork({ exercise }: { exercise: BuildExercise }) {
  const [dialect, setDialect] = useState<Dialect>(exercise.dialects[0]);
  const [texts, setTexts] = useState<Record<Dialect, string>>({ mysql: exercise.starter.mysql ?? '', oracle: exercise.starter.oracle ?? '' });
  const [boot] = useState(() => openDb(exercise));
  const [missing, setMissing] = useState(boot.missing);
  const [session, setSession] = useState<Session>(() => createSession(boot.db, exercise.dialects[0]));
  const [view, setView] = useState(() => session.schema());
  const [out, setOut] = useState<ScriptOut | null>(null);
  const [report, setReport] = useState<SchemaReport | null>(null);
  const [solutionRun, setSolutionRun] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const progress = useProgress();

  const fresh = (d: Dialect, useBase = false) => {
    const { db, missing: miss } = useBase ? { db: emptyDb(), missing: [] as string[] } : openDb(exercise);
    const s = createSession(db, d);
    if (useBase) s.runScript(exercise.base?.[d] ?? '');
    setSession(s);
    setView(s.schema());
    setMissing(miss);
    setOut(null);
    setReport(null);
    setSolutionRun(false);
    setSaved(null);
  };

  const doRun = (sql: string, isSolution: boolean) => {
    play('tap');
    const o = runScript(session, sql, dialect);
    const rep = gradeSchema(session.db(), exercise.spec, dialect);
    setOut(o);
    setView(session.schema());
    setReport(rep);
    setSolutionRun(isSolution);
    if (o.failedAt !== undefined) play('bonk');
    else if (rep.ok && !isSolution) {
      markExercise(exercise.id, dialect);
      setSaved(exercise.save ? saveMyDb(session.db()) : null);
    } else play('bad');
  };

  const schema = useMemo(() => Object.fromEntries(view.tables.map((t) => [t.name, t.columns.map((c) => c.name)])), [view]);
  const text = texts[dialect];
  const solution = exercise.solution[dialect] ?? '';
  const failed = out && out.failedAt !== undefined ? out.results[out.failedAt] : null;
  const error = failed && !failed.ok ? failed.error : null;
  const done = !!report?.ok && !solutionRun && !error;
  const wrongHint = report && !report.ok && !error ? exercise.wrong.find((w) => report.checks.some((c) => c.id === w.failed && !c.ok))?.hint : undefined;
  const okCount = report ? report.checks.filter((c) => c.ok).length : 0;
  const doneBefore = progress.exercises[exercise.id]?.[dialect] !== undefined;
  const baseSql = exercise.base?.[dialect];

  return (
    <div className="ex-grid">
      <div className="ex-left">
        <section className="ex-task sheet" aria-labelledby="bw-task">
          <h2 id="bw-task" className="ex-h">
            {U.task}
          </h2>
          <div className="ex-task__say">
            <Says size={56}>
              <Rich text={exercise.prompt} />
            </Says>
          </div>
          <p className="ex-kindnote pen">{U.kindNote.build}</p>
          {doneBefore && <p className="chip bw-before">{B.alreadyDone(uiApp.dialects[dialect])}</p>}
        </section>

        <section className="bw-asks sheet" aria-labelledby="bw-asks">
          <h2 id="bw-asks" className="ex-h">
            {B.asks}
          </h2>
          <ul className="bw-list">
            {(report ? report.checks : exercise.spec.tables.length ? initialChecks(exercise, dialect) : []).map((c) => (
              <li key={c.id} className={`bw-ask${report ? (c.ok ? ' is-ok' : ' is-no') : ''}`}>
                <span className="bw-box" aria-hidden="true">
                  {report && <Icon name={c.ok ? 'check' : 'cross'} size={16} />}
                </span>
                <span className="bw-ask__text">
                  <Rich text={c.label} />
                  {report && <span className="sr-only"> ({c.ok ? B.askOk : B.askNo})</span>}
                  {report && !c.ok && c.note && <span className="bw-ask__note">{c.note}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="bw-progress" aria-live="polite">
            {report ? B.progress(okCount, report.checks.length) : B.waitRun}
          </p>
        </section>
      </div>

      <div className="ex-right">
        {missing.length > 0 ? (
          <section className="ex-verdict sheet">
            <h2 className="ex-verdict__title">{B.missingTitle}</h2>
            <Says mood="think" size={64}>
              {B.missingSay(missing)}
            </Says>
            {exercise.dialects.length > 1 && (
              <DialectToggle
                dialects={exercise.dialects}
                value={dialect}
                onChange={(d) => {
                  setDialect(d);
                  fresh(d);
                }}
              />
            )}
            {baseSql && (
              <>
                <pre className="hlad__code" tabIndex={0}>
                  {baseSql}
                </pre>
                <div className="ex-verdict__actions">
                  <button type="button" className="btn btn--sm" onClick={() => fresh(dialect, true)}>
                    {B.useBase}
                  </button>
                </div>
              </>
            )}
          </section>
        ) : (
          <>
            <div className="ws">
              <div className="ws__main">
                <div className="pg__top">
                  <DialectToggle
                    dialects={exercise.dialects}
                    value={dialect}
                    onChange={(d) => {
                      setDialect(d);
                      fresh(d);
                    }}
                  />
                </div>
                <EditorBox value={text} onChange={(v) => setTexts((t) => ({ ...t, [dialect]: v }))} dialect={dialect} schema={schema} onRun={() => doRun(texts[dialect], false)} error={error ? error.span : null} label={W.editor} />
                <div className="pg__actions">
                  <button type="button" className="btn ex-run" onClick={() => doRun(text, false)}>
                    <Icon name="play" />
                    {W.run}
                    <kbd>{W.runHint}</kbd>
                  </button>
                  <button
                    type="button"
                    className="btn btn--paper btn--sm"
                    onClick={() => {
                      play('tap');
                      setTexts((t) => ({ ...t, [dialect]: exercise.starter[dialect] ?? '' }));
                      fresh(dialect);
                    }}
                  >
                    <Icon name="reset" size={18} />
                    {W.restart}
                  </button>
                </div>
                {out && <ScriptOutput out={out} dialect={dialect} />}
              </div>
              <SchemaPanel view={view} />
            </div>

            {report && solutionRun && <p className="ex-note pen">{B.solutionNote}</p>}

            {done && (
              <DoneCard exercise={exercise} why={exercise.why}>
                {saved !== null && <p className="bw-saved">{saved ? B.saved : B.notSaved}</p>}
              </DoneCard>
            )}

            {!done && (
              <>
                {report && !report.ok && !solutionRun && (
                  <section className="ex-verdict sheet">
                    <h2 className="ex-verdict__title">{B.wrongTitle}</h2>
                    <Says mood="think" size={64}>
                      {error ? B.errorSay : wrongHint ? <Rich text={wrongHint} /> : B.wrongSay}
                    </Says>
                  </section>
                )}
                <HintLadder
                  light={exercise.hints.light}
                  specific={exercise.hints.specific}
                  skeleton={exercise.hints.skeleton[dialect] ?? ''}
                  solution={solution}
                  onSolution={() => {
                    setTexts((t) => ({ ...t, [dialect]: solution }));
                    doRun(solution, true);
                  }}
                  resetKey={`${exercise.id}:${dialect}`}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Danh sách yêu cầu trước lần Chạy đầu: nhãn lấy thẳng từ spec. */
function initialChecks(ex: BuildExercise, d: Dialect): { id: string; label: string; ok: boolean; note?: string }[] {
  const out: { id: string; label: string; ok: boolean; note?: string }[] = [];
  for (const t of ex.spec.tables) {
    out.push({ id: `table:${t.name}`, label: `Có table \`${t.name}\``, ok: false });
    for (const c of t.columns) out.push({ id: `${t.name}.${c.name}`, label: c.label, ok: false });
    if (t.primaryKey) out.push({ id: `${t.name}:pk`, label: `Primary key ghép (${t.primaryKey.join(', ')})`, ok: false });
  }
  for (const p of ex.spec.probes ?? []) if (p.sql[d] !== undefined) out.push({ id: p.id, label: p.label, ok: false });
  return out;
}
