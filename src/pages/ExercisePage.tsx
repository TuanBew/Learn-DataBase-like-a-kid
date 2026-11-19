import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Chau, Says } from '../components/Chau';
import { Confetti } from '../components/Confetti';
import { HintLadder } from '../components/HintLadder';
import { Icon } from '../components/Icon';
import { ResultCompare } from '../components/ResultCompare';
import { ResultTable } from '../components/ResultTable';
import { Rich } from '../components/Rich';
import { exercises } from '../content/exercises';
import type { Exercise } from '../content/types';
import { uiApp } from '../content/ui-app';
import { databases } from '../data';
import { type GradeReport, type ResultSet, type SqlError, type Trace, grade, run } from '../engine';
import type { ColumnType, Database, Dialect } from '../engine/types';
import { markExercise } from '../lib/progress';
import { useLoad } from '../lib/useLoad';
import { play } from '../sfx/sfx';
import { Theater } from '../theater/Theater';
import './exercise.css';

const U = uiApp.exercise;

/* CodeMirror nặng nhất trang, nên tải riêng, sau khi đề bài đã hiện. */
const SqlEditor = lazy(() => import('../components/SqlEditor'));

const TYPE_NAME: Record<Dialect, Record<ColumnType, string>> = {
  mysql: { int: 'INT', decimal: 'DECIMAL', text: 'VARCHAR', date: 'DATE', datetime: 'DATETIME' },
  oracle: { int: 'NUMBER', decimal: 'NUMBER', text: 'VARCHAR2', date: 'DATE', datetime: 'DATE' },
};

export default function ExercisePage({ id }: { id: string }) {
  const exercise = useLoad(exercises[id], `ex:${id}`);
  const db = useLoad(exercise ? databases[exercise.database] : undefined, `db:${exercise?.database ?? ''}`);
  if (exercise === null) {
    return (
      <div className="wrap ex-missing">
        <Says mood="think">{U.notFound}</Says>
        <Link href="/" className="btn btn--paper">
          {uiApp.lesson.backHome}
        </Link>
      </div>
    );
  }
  if (!exercise) return <div className="wrap" style={{ minHeight: '70vh' }} />;
  return (
    <div className="wrap ex">
      <header className="ex-top">
        <p className="ex-kicker">{U.kicker(exercise.chapter)}</p>
        <h1 className="ex-title">{exercise.title}</h1>
      </header>
      {db ? <ExerciseView exercise={exercise} db={db} /> : <div style={{ minHeight: '60vh' }} />}
    </div>
  );
}

type Outcome =
  | { kind: 'error'; error: SqlError }
  | { kind: 'ran'; trace: Trace; result: ResultSet; report: GradeReport; wrongHint?: string; solution: boolean };

function ExerciseView({ exercise, db }: { exercise: Exercise; db: Database }) {
  const [dialect, setDialect] = useState<Dialect>(exercise.dialects[0]);
  const [texts, setTexts] = useState<Record<Dialect, string>>({ mysql: exercise.starter.mysql ?? '', oracle: exercise.starter.oracle ?? '' });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [runId, setRunId] = useState(0);
  const [ended, setEnded] = useState(false);
  const theaterRef = useRef<HTMLDivElement>(null);

  /* Vẽ đề bài xong mới gọi editor, để chunk nặng không tranh đường với phần chữ. */
  const [editorReady, setEditorReady] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => window.setTimeout(() => setEditorReady(true), 0));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const text = texts[dialect];
  const solution = exercise.solution[dialect] ?? '';
  const expected = useMemo(() => {
    const r = run(solution, db, dialect);
    return r.ok ? r.result : null;
  }, [solution, db, dialect]);
  const schema = useMemo(() => Object.fromEntries(db.tables.map((t) => [t.name, t.columns.map((c) => c.name)])), [db]);
  const tables = db.tables.filter((t) => exercise.tables.includes(t.name));
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
        if (o.report.ok) {
          play('ok');
          markExercise(exercise.id, dialect);
        } else play('bad');
      }
      return o;
    });
  }, [exercise.id, dialect]);

  const switchDialect = (d: Dialect) => {
    if (d === dialect) return;
    play('tap');
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
          <section className="ex-task sheet" aria-labelledby="ex-task">
            <h2 id="ex-task" className="ex-h">
              {U.task}
            </h2>
            <div className="ex-task__say">
              <Chau size={56} mood="idle" />
              <p>
                <Rich text={exercise.prompt} />
              </p>
            </div>
            <ul className="ex-asks">
              {exercise.asks.map((a) => (
                <li key={a}>
                  <Rich text={a} />
                </li>
              ))}
            </ul>
            <div className="ex-data">
              <h3 className="ex-h ex-h--sm">{U.data}</h3>
              {tables.map((t) => (
                <div key={t.name} className="ex-schema">
                  <span className="chip ex-schema__name">{t.name}</span>
                  <ul>
                    {t.columns.map((c) => (
                      <li key={c.name}>
                        <code>{c.name}</code>
                        <span>{TYPE_NAME[dialect][c.type]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="ex-editor" aria-labelledby="ex-editor">
            <div className="ex-editor__bar">
              <h2 id="ex-editor" className="ex-h">
                {U.editor}
              </h2>
              <div className="ex-dialect" role="group" aria-label={U.dialect}>
                {exercise.dialects.map((d) => (
                  <button key={d} type="button" aria-pressed={d === dialect} onClick={() => switchDialect(d)}>
                    {uiApp.dialects[d]}
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<pre className="ex-editor__wait">{text}</pre>}>
              {!editorReady ? (
                <pre className="ex-editor__wait">{text}</pre>
              ) : (
              <SqlEditor
                key={dialect}
                value={text}
                onChange={(v) => setTexts((t) => ({ ...t, [dialect]: v }))}
                dialect={dialect}
                schema={schema}
                onRun={() => doRun(texts[dialect], false)}
                error={error ? error.span : null}
                label={U.editor}
              />
              )}
            </Suspense>
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

          {error && (
            <section className="ex-error sheet" role="alert">
              <h2 className="ex-h">{error.kind === 'unsupported' ? U.outOfScope : U.errorTitle}</h2>
              <div className="ex-error__say">
                <Chau size={52} mood="think" />
                <p>
                  {error.friendly} {error.tip && <strong>{error.tip}</strong>}
                </p>
              </div>
              {error.dbMessage && (
                <div className="ex-error__real">
                  <span>{U.errorReal(uiApp.dialects[dialect])}</span>
                  <code>{error.dbMessage}</code>
                </div>
              )}
              {error.kind !== 'unsupported' && <p className="ex-error__cheer">{U.errorSay}</p>}
            </section>
          )}
        </div>

        <div className="ex-right" ref={theaterRef}>
          {!ran && preview && (
            <section className="ex-preview sheet">
              <div className="ex-preview__say">
                <Chau size={64} mood="happy" />
                <p>{U.previewSay}</p>
              </div>
              <ResultTable result={preview} caption={U.previewTitle(exercise.tables[0])} />
            </section>
          )}

          {ran && (
            <>
              {ran.solution && <p className="ex-note pen">{U.solutionNote}</p>}
              <Theater key={runId} trace={ran.trace} onEnd={onEnd} />

              {!ended && <p className="ex-wait">{U.watchFirst}</p>}

              {ended && !ran.solution && ran.report.ok && (
                <section className="ex-verdict ex-verdict--ok sheet">
                  <Confetti />
                  <h2 className="ex-verdict__title">
                    <span className="pen ex-stamp">10</span>
                    {U.correctTitle}
                  </h2>
                  <Says mood="cheer" size={72}>
                    <Rich text={exercise.why} />
                  </Says>
                  <ResultTable result={ran.result} caption={U.yourResult} />
                  <div className="ex-verdict__actions">
                    <button type="button" className="btn btn--paper btn--sm" onClick={() => { play('tap'); setRunId((x) => x + 1); setEnded(false); }}>
                      <Icon name="replay" size={18} />
                      {U.replay}
                    </button>
                    {other && (
                      <button type="button" className="btn btn--sm" onClick={() => switchDialect(other)}>
                        {U.tryOther(uiApp.dialects[other])}
                        <Icon name="arrow" size={18} />
                      </button>
                    )}
                  </div>
                </section>
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
