import { useMemo, useState } from 'react';
import type { PlaygroundBlock } from '../content/types';
import { uiApp } from '../content/ui-app';
import { databases } from '../data';
import { type ResultSet, type SqlError, type Trace, createSession, run } from '../engine';
import type { Dialect } from '../engine/types';
import { useLoad } from '../lib/useLoad';
import { play } from '../sfx/sfx';
import { Theater } from '../theater/Theater';
import { Icon } from './Icon';
import { SchemaDialogButton } from './SchemaDialog';
import { Says } from './Mascot';
import { ResultTable } from './ResultTable';
import { Rich } from './Rich';
import { DialectToggle, EditorBox, ErrorCard, SchemaChips } from './sql/parts';
import './playground.css';

const U = uiApp.exercise;
const P = uiApp.playground;

type Out = { kind: 'error'; error: SqlError } | { kind: 'ran'; trace: Trace } | { kind: 'table'; result: ResultSet };

/** "Thử tay ngay": một editor nhỏ kèm Query Theater, chạy trên dữ liệu thật của bài. */
export default function Playground({ block }: { block: PlaygroundBlock }) {
  const db = useLoad(databases[block.database], `db:${block.database}`);
  const [dialect, setDialect] = useState<Dialect>(block.dialects[0]);
  const [texts, setTexts] = useState<Record<Dialect, string>>({ mysql: block.sql.mysql ?? '', oracle: block.sql.oracle ?? '' });
  const [out, setOut] = useState<Out | null>(null);
  const [runId, setRunId] = useState(0);
  const [ended, setEnded] = useState(false);

  const schema = useMemo(() => (db ? Object.fromEntries(db.tables.map((t) => [t.name, t.columns.map((c) => c.name)])) : {}), [db]);
  const tables = db ? db.tables.filter((t) => block.tables.includes(t.name)) : [];

  const doRun = (sql: string) => {
    if (!db) return;
    play('tap');
    if (block.session) {
      const r = createSession(db, dialect).run(sql);
      if (!r.ok) {
        play('bonk');
        setOut({ kind: 'error', error: r.error });
      } else if (r.kind === 'select') setOut({ kind: 'table', result: r.result });
      else setOut(null);
      return;
    }
    const r = run(sql, db, dialect);
    if (!r.ok) {
      play('bonk');
      setOut({ kind: 'error', error: r.error });
      return;
    }
    setOut({ kind: 'ran', trace: r.trace });
    setRunId((x) => x + 1);
    setEnded(false);
  };

  const text = texts[dialect];
  return (
    <div className="pg">
      <div className="pg__top">
        <div className="pg__schema">
          <div className="pg__schemahead">
            <SchemaDialogButton db={db} />
          </div>
          {db && <SchemaChips tables={tables} dialect={dialect} />}
        </div>
        <DialectToggle
          dialects={block.dialects}
          value={dialect}
          onChange={(d) => {
            setDialect(d);
            setOut(null);
          }}
        />
      </div>

      <EditorBox value={text} onChange={(v) => setTexts((t) => ({ ...t, [dialect]: v }))} dialect={dialect} schema={schema} onRun={() => doRun(texts[dialect])} error={out?.kind === 'error' ? out.error.span : null} label={U.editor} />

      <div className="pg__actions">
        <button type="button" className="btn ex-run" onClick={() => doRun(text)} disabled={!db}>
          <Icon name="play" />
          {U.run}
          <kbd>{U.runHint}</kbd>
        </button>
        <button
          type="button"
          className="btn btn--paper btn--sm"
          onClick={() => {
            play('tap');
            setTexts((t) => ({ ...t, [dialect]: block.sql[dialect] ?? '' }));
            setOut(null);
          }}
        >
          <Icon name="reset" size={18} />
          {U.reset}
        </button>
      </div>

      {block.tries && block.tries.length > 0 && (
        <div className="pg__tries">
          <p className="pg__trylabel">{P.tries}</p>
          {block.tries.map((t) => (
            <button
              key={t.label}
              type="button"
              className="pg__try"
              onClick={() => {
                const sql = t.sql[dialect] ?? '';
                setTexts((x) => ({ ...x, [dialect]: sql }));
                doRun(sql);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {block.say && (
        <Says size={52} className="pg__say">
          <Rich text={block.say} />
        </Says>
      )}

      {out?.kind === 'error' && <ErrorCard error={out.error} dialect={dialect} />}

      {out?.kind === 'table' && <ResultTable result={out.result} caption={U.yourResult} maxRows={12} />}

      {out?.kind === 'ran' && (
        <>
          <Theater key={runId} trace={out.trace} onEnd={() => setEnded(true)} />
          {ended && <ResultTable result={out.trace.result} caption={U.yourResult} maxRows={12} />}
        </>
      )}
    </div>
  );
}
