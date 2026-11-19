import { useMemo, useState } from 'react';
import { DmlView } from '../../components/DmlView';
import { HintLadder } from '../../components/HintLadder';
import { Icon } from '../../components/Icon';
import { Says } from '../../components/Mascot';
import { OrderPieces } from '../../components/OrderPieces';
import { ChoiceQuiz } from '../../components/quiz/ChoiceQuiz';
import { MatchQuiz } from '../../components/quiz/MatchQuiz';
import { ResultTable } from '../../components/ResultTable';
import { Rich } from '../../components/Rich';
import { DialectToggle, EditorBox, ErrorCard } from '../../components/sql/parts';
import type { QuizExercise, SqlExercise } from '../../content/types';
import { uiApp } from '../../content/ui-app';
import { type DmlTrace, type ResultSet, type Session, type SqlError, type Trace, createSession, run } from '../../engine';
import type { Database, Dialect, Value } from '../../engine/types';
import { show } from '../../engine/values';
import { markExercise } from '../../lib/progress';
import { play } from '../../sfx/sfx';
import { Theater } from '../../theater/Theater';
import { DoneCard, TaskCard } from './shared';

const U = uiApp.exercise;

/* ---------- Xếp các mẩu của query ---------- */

export function OrderWork({ exercise, db }: { exercise: SqlExercise; db: Database }) {
  const [dialect, setDialect] = useState<Dialect>(exercise.dialects[0]);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [ended, setEnded] = useState(false);
  const pieces = exercise.pieces?.[dialect] ?? [];

  const done = () => {
    const r = run(exercise.solution[dialect] ?? pieces.join('\n'), db, dialect);
    if (r.ok) setTrace(r.trace);
    markExercise(exercise.id, dialect);
  };

  return (
    <div className="ex-stack">
      <TaskCard exercise={exercise} db={db} dialect={dialect} />
      <DialectToggle
        dialects={exercise.dialects}
        value={dialect}
        onChange={(d) => {
          setDialect(d);
          setTrace(null);
          setEnded(false);
        }}
      />
      <section className="ex-work sheet">
        <OrderPieces key={dialect} pieces={pieces} mono onDone={done} labels={U.order} />
      </section>
      {trace && <Theater trace={trace} onEnd={() => setEnded(true)} />}
      {trace && ended && <DoneCard exercise={exercise} why={exercise.why} />}
    </div>
  );
}

/* ---------- Đoán row nào còn lại ---------- */

export function PredictWork({ exercise, db }: { exercise: SqlExercise; db: Database }) {
  const [dialect, setDialect] = useState<Dialect>(exercise.dialects[0]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [ran, setRan] = useState<{ trace: Trace; ids: Set<number> } | null>(null);
  const [runId, setRunId] = useState(0);
  const [ended, setEnded] = useState(false);

  const sql = exercise.solution[dialect] ?? '';
  const base = useMemo(() => {
    const r = run(`SELECT * FROM ${exercise.tables[0]}`, db, dialect);
    return r.ok ? r.result : null;
  }, [exercise, db, dialect]);

  const toggle = (id: number) => {
    play('tap');
    setRan(null);
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const check = () => {
    play('tap');
    const r = run(sql, db, dialect);
    if (!r.ok) return;
    setRan({ trace: r.trace, ids: new Set(r.result.rowIds) });
    setRunId((x) => x + 1);
    setEnded(false);
  };

  const missed = ran ? [...ran.ids].filter((id) => !picked.has(id)).length : 0;
  const extra = ran ? [...picked].filter((id) => !ran.ids.has(id)).length : 0;
  const right = ran !== null && missed === 0 && extra === 0;
  const state = (id: number) => (!ran || !ended ? (picked.has(id) ? 'pick' : '') : ran.ids.has(id) ? (picked.has(id) ? 'right' : 'missed') : picked.has(id) ? 'extra' : '');

  return (
    <div className="ex-stack">
      <TaskCard exercise={exercise} db={db} dialect={dialect} />
      <DialectToggle
        dialects={exercise.dialects}
        value={dialect}
        onChange={(d) => {
          setDialect(d);
          setRan(null);
          setPicked(new Set());
        }}
      />
      <section className="ex-from">
        <h2 className="ex-h ex-h--sm">{U.queryLabel}</h2>
        <pre>{sql}</pre>
      </section>

      {base && (
        <section className="ex-work sheet">
          <div className="ex-pick" role="group" aria-label={U.predictPick(picked.size)}>
            <div className="ex-pick__head" style={{ gridTemplateColumns: `28px repeat(${base.columns.length}, minmax(0, 1fr))` }}>
              <span />
              {base.columns.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            {base.rows.map((r, i) => (
              <button key={i} type="button" className={`ex-pick__row ex-pick__row--${state(base.rowIds[i])}`} aria-pressed={picked.has(base.rowIds[i])} onClick={() => toggle(base.rowIds[i])} style={{ gridTemplateColumns: `28px repeat(${base.columns.length}, minmax(0, 1fr))` }}>
                <span className="ex-pick__box" aria-hidden="true">
                  {picked.has(base.rowIds[i]) && <Icon name="check" size={14} />}
                </span>
                {r.map((v: Value, j: number) => (
                  <span key={j}>{show(v)}</span>
                ))}
              </button>
            ))}
          </div>
          <div className="ex-actions">
            <button type="button" className="btn ex-run" onClick={check}>
              <Icon name="play" />
              {U.predictRun}
            </button>
            <span className="chip">{U.predictPick(picked.size)}</span>
          </div>
        </section>
      )}

      {ran && (
        <Theater
          key={runId}
          trace={ran.trace}
          onEnd={() => {
            setEnded(true);
            if (missed === 0 && extra === 0) markExercise(exercise.id, dialect);
            else play('bad');
          }}
        />
      )}
      {ran && ended && right && <DoneCard exercise={exercise} why={exercise.why} />}
      {ran && ended && !right && (
        <section className="ex-verdict sheet">
          <Says mood="think" size={64}>
            {U.predictWrong(missed, extra)}
          </Says>
          <ul className="ex-legend">
            <li className="ex-legend--right">{U.predictLegend.right}</li>
            <li className="ex-legend--missed">{U.predictLegend.missed}</li>
            <li className="ex-legend--extra">{U.predictLegend.extra}</li>
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------- Diễn tập UPDATE và DELETE ---------- */

const stateKey = (rows: { cells: Value[] }[]) =>
  rows
    .map((r) => r.cells.map((v) => show(v)).join('\u0001'))
    .sort()
    .join('\u0002');

type RehearsalOut =
  | { kind: 'error'; error: SqlError }
  | { kind: 'dml'; dml: DmlTrace; ok: boolean; hint?: string; session: Session; rolledBack?: ResultSet }
  | { kind: 'select'; result: ResultSet }
  | { kind: 'other' };

export function RehearsalWork({ exercise, db }: { exercise: SqlExercise; db: Database }) {
  const [dialect, setDialect] = useState<Dialect>(exercise.dialects[0]);
  const [texts, setTexts] = useState<Record<Dialect, string>>({ mysql: exercise.starter.mysql ?? '', oracle: exercise.starter.oracle ?? '' });
  const [out, setOut] = useState<RehearsalOut | null>(null);
  const R = U.rehearsal;
  const target = exercise.target ?? exercise.tables[0];
  const solution = exercise.solution[dialect] ?? '';
  const schema = useMemo(() => Object.fromEntries(db.tables.map((t) => [t.name, t.columns.map((c) => c.name)])), [db]);

  const after = (sql: string): string | null => {
    const r = createSession(db, dialect).run(sql);
    return r.ok && r.kind === 'dml' && r.dml.table === target ? stateKey(r.dml.after) : null;
  };
  const expected = useMemo(() => after(solution), [solution, db, dialect]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = useMemo(() => {
    const r = run(`SELECT * FROM ${target}`, db, dialect);
    return r.ok ? r.result : null;
  }, [target, db, dialect]);

  const doRun = (sql: string) => {
    play('tap');
    const session = createSession(db, dialect);
    const r = session.run(sql);
    if (!r.ok) {
      play('bonk');
      setOut({ kind: 'error', error: r.error });
      return;
    }
    if (r.kind === 'select') {
      play('pop');
      setOut({ kind: 'select', result: r.result });
      return;
    }
    if (r.kind !== 'dml') {
      setOut({ kind: 'other' });
      return;
    }
    const ok = r.dml.table === target && stateKey(r.dml.after) === expected;
    let hint: string | undefined;
    if (!ok) {
      for (const w of exercise.wrong) {
        const s = w.sql[dialect];
        if (s && after(s) === stateKey(r.dml.after)) {
          hint = w.hint;
          break;
        }
      }
      play(r.dml.noWhere ? 'alarm' : 'bad');
    } else markExercise(exercise.id, dialect);
    setOut({ kind: 'dml', dml: r.dml, ok, hint, session });
  };

  const rollback = () => {
    if (out?.kind !== 'dml') return;
    play('whoosh');
    out.session.run('ROLLBACK');
    const r = out.session.run(`SELECT * FROM ${target}`);
    if (r.ok && r.kind === 'select') setOut({ ...out, rolledBack: r.result });
  };

  const text = texts[dialect];
  const dml = out?.kind === 'dml' ? out : null;
  return (
    <div className="ex-grid">
      <div className="ex-left">
        <TaskCard exercise={exercise} db={db} dialect={dialect} />
        <section className="ex-editor" aria-labelledby="ex-editor">
          <div className="ex-editor__bar">
            <h2 id="ex-editor" className="ex-h">
              {U.editor}
            </h2>
            <DialectToggle
              dialects={exercise.dialects}
              value={dialect}
              onChange={(d) => {
                setDialect(d);
                setOut(null);
              }}
            />
          </div>
          <EditorBox value={text} onChange={(v) => setTexts((t) => ({ ...t, [dialect]: v }))} dialect={dialect} schema={schema} onRun={() => doRun(texts[dialect])} error={out?.kind === 'error' ? out.error.span : null} label={U.editor} />
          <div className="ex-actions">
            <button type="button" className="btn ex-run" onClick={() => doRun(text)}>
              <Icon name="play" />
              {U.run}
              <kbd>{U.runHint}</kbd>
            </button>
            <button
              type="button"
              className="btn btn--paper btn--sm"
              onClick={() => {
                play('tap');
                setTexts((t) => ({ ...t, [dialect]: exercise.starter[dialect] ?? '' }));
                setOut(null);
              }}
            >
              <Icon name="reset" size={18} />
              {U.reset}
            </button>
          </div>
        </section>
        {out?.kind === 'error' && <ErrorCard error={out.error} dialect={dialect} />}
      </div>

      <div className="ex-right">
        {!dml && preview && (
          <section className="ex-preview sheet">
            {out?.kind === 'select' ? (
              <>
                <Says mood="happy" size={56}>
                  {R.selectFirst}
                </Says>
                <ResultTable result={out.result} caption={U.yourResult} maxRows={20} />
              </>
            ) : (
              <>
                {out?.kind === 'other' && (
                  <Says mood="think" size={56}>
                    {R.notDml}
                  </Says>
                )}
                <ResultTable result={preview} caption={R.copyOf(target)} maxRows={20} />
              </>
            )}
          </section>
        )}

        {dml && (
          <>
            <div className="ex-rehearsal__chips">
              <span className="chip">{R.copyOf(dml.dml.table)}</span>
              <span className="chip">{R.touched(dml.dml.touched.length)}</span>
              <span className="chip">{dml.dml.pending ? R.pending : R.saved}</span>
            </div>
            {dml.rolledBack ? (
              <>
                <Says mood="happy" size={64}>
                  {R.rolledBack}
                </Says>
                <ResultTable result={dml.rolledBack} caption={R.copyOf(dml.dml.table)} maxRows={20} />
              </>
            ) : (
              <DmlView dml={dml.dml} labels={{ more: R.more, old: R.old }} />
            )}

            {dml.ok && <DoneCard exercise={exercise} why={exercise.why} />}

            {!dml.ok && !dml.rolledBack && (
              <section className="ex-verdict sheet">
                <Says mood={dml.dml.noWhere ? 'panic' : 'think'} size={64}>
                  {dml.dml.noWhere ? (
                    <>
                      {R.alarm} {dml.dml.pending ? R.alarmOracle : R.alarmMysql}
                    </>
                  ) : dml.hint ? (
                    <Rich text={dml.hint} />
                  ) : (
                    R.wrong
                  )}
                </Says>
                {dml.dml.pending && (
                  <div className="ex-actions">
                    <button type="button" className="btn" onClick={rollback}>
                      <Icon name="replay" />
                      {R.rollback}
                    </button>
                  </div>
                )}
                <HintLadder light={exercise.hints.light} specific={exercise.hints.specific} skeleton={exercise.hints.skeleton[dialect] ?? ''} solution={solution} resetKey={`${exercise.id}:${dialect}`} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Nhóm câu hỏi nhanh ---------- */

export function QuizWork({ exercise }: { exercise: QuizExercise }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const finish = (i: number) =>
    setDone((d) => {
      if (d.has(i)) return d;
      const n = new Set(d).add(i);
      if (n.size === exercise.items.length) markExercise(exercise.id, 'mysql');
      return n;
    });
  const all = done.size === exercise.items.length;
  return (
    <div className="ex-stack">
      <TaskCard exercise={exercise} />
      <span className="chip ex-quizcount">{U.quizDone(done.size, exercise.items.length)}</span>
      {exercise.items.map((q, i) => (
        <section key={i} className="ex-work sheet">
          {q.kind === 'choice' ? <ChoiceQuiz quiz={q} onDone={() => finish(i)} /> : <MatchQuiz quiz={q} onDone={() => finish(i)} />}
        </section>
      ))}
      {all && <DoneCard exercise={exercise} why={exercise.why} />}
    </div>
  );
}
