import { useCallback, useMemo, useRef, useState } from 'react';
import { HintLadder } from '../../components/HintLadder';
import { Icon } from '../../components/Icon';
import { Mascot, Says } from '../../components/Mascot';
import { ResultCompare } from '../../components/ResultCompare';
import { ResultTable } from '../../components/ResultTable';
import { Rich } from '../../components/Rich';
import { DialectToggle, EditorBox, ErrorCard } from '../../components/sql/parts';
import type { SqlExercise } from '../../content/types';
import { uiApp } from '../../content/ui-app';
import { type GradeReport, type ResultSet, type SqlError, type Trace, grade, run } from '../../engine';
import type { Database, Dialect } from '../../engine/types';
import { markExercise } from '../../lib/progress';
import { play } from '../../sfx/sfx';
import { Theater } from '../../theater/Theater';
import { DoneCard, TaskCard } from './shared';

const U = uiApp.exercise;

type Outcome = { kind: 'error'; error: SqlError } | { kind: 'ran'; trace: Trace; result: ResultSet; report: GradeReport; wrongHint?: string; solution: boolean };

/** Bài viết query: viết từ đầu, điền chỗ trống, tìm lỗi, hoặc viết lại bằng Oracle. */
export function SqlWork({ exercise, db }: { exercise: SqlExercise; db: Database }) {
  const [dialect, setDialect] = useState<Dialect>(exercise.dialects[0]);
  const [texts, setTexts] = useState<Record<Dialect, string>>({ mysql: exercise.starter.mysql ?? '', oracle: exercise.starter.oracle ?? '' });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [runId, setRunId] = useState(0);
  const [ended, setEnded] = useState(false);
  const theaterRef = useRef<HTMLDivElement>(null);

  const text = texts[dialect];
  const solution = exercise.solution[dialect] ?? '';
  const expected = useMemo(() => {
    const r = run(solution, db, dialect);
    return r.ok ? r.result : null;
  }, [solution, db, dialect]);
  const schema = useMemo(() => Object.fromEntries(db.tables.map((t) => [t.name, t.columns.map((c) => c.name)])), [db]);
  const preview = useMemo(() => {
    const r = run(`SELECT * FROM ${exercise.tables[0]}`, db, dialect);
    return r.ok ? r.result : null;
  }, [exercise, db, dialect]);

  const doRun = useCallback(
    (sqlText: string, isSolution: boolean) => {
      play('tap');
      const r = run(sqlText, db, dialect);
      if (!r.ok) {
        setOutcome({ kind: 'error', error: r.error });
        play('bonk');
        return;
      }
      if (!expected) return;
      const report = grade(r.result, expected, exercise.check);
      let wrongHint: string | undefined;
      if (!report.ok) {
        for (const w of exercise.wrong) {
          const sql = w.sql[dialect];
          const wr = sql ? run(sql, db, dialect) : null;
          if (wr?.ok && grade(r.result, wr.result, { orderMatters: true }).ok) {
            wrongHint = w.hint;
            break;
          }
        }
      }
      setOutcome({ kind: 'ran', trace: r.trace, result: r.result, report, wrongHint, solution: isSolution });
      setRunId((x) => x + 1);
      setEnded(false);
      window.requestAnimationFrame(() => {
        const el = theaterRef.current;
        if (el && window.matchMedia('(max-width: 1079px)').matches) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [db, dialect, expected, exercise],
  );

  const onEnd = useCallback(() => {
    setEnded(true);
    setOutcome((o) => {
      if (o?.kind === 'ran' && !o.solution) {
        if (o.report.ok) markExercise(exercise.id, dialect);
        else play('bad');
      }
      return o;
    });
  }, [exercise.id, dialect]);

  const switchDialect = (d: Dialect) => {
    setDialect(d);
    setOutcome(null);
  };
  const reset = () => {
    play('tap');
    setTexts((t) => ({ ...t, [dialect]: exercise.starter[dialect] ?? '' }));
    setOutcome(null);
  };

  const error = outcome?.kind === 'error' ? outcome.error : null;
  const ran = outcome?.kind === 'ran' ? outcome : null;
  const other = exercise.dialects.find((d) => d !== dialect);

  return (
    <div className="ex-grid">
      <div className="ex-left">
        <TaskCard exercise={exercise} db={db} dialect={dialect} />

        {exercise.kind === 'translate' && exercise.from && (
          <section className="ex-from">
            <h2 className="ex-h ex-h--sm">{U.fromLabel}</h2>
            <pre tabIndex={0}>{exercise.from}</pre>
          </section>
        )}

        <section className="ex-editor" aria-labelledby="ex-editor">
          <div className="ex-editor__bar">
            <h2 id="ex-editor" className="ex-h">
              {U.editor}
            </h2>
            <DialectToggle dialects={exercise.dialects} value={dialect} onChange={switchDialect} />
          </div>
          <EditorBox value={text} onChange={(v) => setTexts((t) => ({ ...t, [dialect]: v }))} dialect={dialect} schema={schema} onRun={() => doRun(texts[dialect], false)} error={error ? error.span : null} label={U.editor} />
          <div className="ex-actions">
            <button type="button" className="btn ex-run" onClick={() => doRun(text, false)}>
              <Icon name="play" />
              {U.run}
              <kbd>{U.runHint}</kbd>
            </button>
            <button type="button" className="btn btn--paper btn--sm" onClick={reset}>
              <Icon name="reset" size={18} />
              {U.reset}
            </button>
          </div>
        </section>

        {error && <ErrorCard error={error} dialect={dialect} />}
      </div>

      <div className="ex-right" ref={theaterRef}>
        {!ran && preview && (
          <section className="ex-preview sheet">
            <div className="ex-preview__say">
              <Mascot size={64} mood="happy" />
              <p>{U.previewSay}</p>
            </div>
            <ResultTable result={preview} caption={U.previewTitle(exercise.tables[0])} maxRows={20} />
          </section>
        )}

        {ran && (
          <>
            {ran.solution && <p className="ex-note pen">{U.solutionNote}</p>}
            <Theater key={runId} trace={ran.trace} onEnd={onEnd} />
            {!ended && <p className="ex-wait">{U.watchFirst}</p>}

            {ended && !ran.solution && ran.report.ok && (
              <DoneCard
                exercise={exercise}
                why={exercise.why}
                actions={
                  <>
                    <button
                      type="button"
                      className="btn btn--paper btn--sm"
                      onClick={() => {
                        play('tap');
                        setRunId((x) => x + 1);
                        setEnded(false);
                      }}
                    >
                      <Icon name="replay" size={18} />
                      {U.replay}
                    </button>
                    {other && (
                      <button type="button" className="btn btn--sm btn--paper" onClick={() => switchDialect(other)}>
                        {U.tryOther(uiApp.dialects[other])}
                      </button>
                    )}
                  </>
                }
              >
                <ResultTable result={ran.result} caption={U.yourResult} maxRows={12} />
              </DoneCard>
            )}

            {ended && !ran.solution && !ran.report.ok && expected && (
              <section className="ex-verdict sheet">
                <h2 className="ex-verdict__title">{U.wrongTitle}</h2>
                <Says mood="think" size={64}>
                  {ran.wrongHint ? <Rich text={ran.wrongHint} /> : U.wrongSay}
                </Says>
                <ResultCompare actual={ran.result} expected={expected} report={ran.report} />
                <HintLadder
                  light={exercise.hints.light}
                  specific={exercise.hints.specific}
                  skeleton={exercise.hints.skeleton[dialect] ?? ''}
                  solution={solution}
                  onSolution={() => doRun(solution, true)}
                  resetKey={`${exercise.id}:${dialect}`}
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
