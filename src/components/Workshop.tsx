import { useCallback, useMemo, useState } from 'react';
import type { WorkshopBlock } from '../content/types';
import { uiWorkshop } from '../content/ui-workshop';
import { type Session, createSession } from '../engine';
import type { Dialect } from '../engine/types';
import { emptyDb, loadMyDb } from '../lib/mydb';
import { play } from '../sfx/sfx';
import { Icon } from './Icon';
import { Says } from './Mascot';
import { Rich } from './Rich';
import { SchemaPanel } from './SchemaPanel';
import { type ScriptOut, ScriptOutput, runScript } from './ScriptOutput';
import { DialectToggle, EditorBox } from './sql/parts';
import './playground.css';
import './workshop.css';

const U = uiWorkshop;

/** "Xưởng dựng table": database giữ nguyên giữa các lần Chạy, một lần Chạy nhận nhiều lệnh. */
export default function Workshop({ block }: { block: WorkshopBlock }) {
  const [dialect, setDialect] = useState<Dialect>(block.dialects[0]);
  const [texts, setTexts] = useState<Record<Dialect, string>>({ mysql: block.sql.mysql ?? '', oracle: block.sql.oracle ?? '' });
  const [out, setOut] = useState<ScriptOut | null>(null);

  /** Session mới ở trạng thái ngay sau `setup`. */
  const make = useCallback(
    (d: Dialect): Session => {
      const source = block.start === 'mine' ? (loadMyDb() ?? emptyDb()) : emptyDb();
      const s = createSession(source, d);
      const setup = block.setup?.[d];
      if (setup) s.runScript(setup);
      return s;
    },
    [block],
  );
  const [session, setSession] = useState<Session>(() => make(block.dialects[0]));
  const [view, setView] = useState(() => session.schema());

  const swap = (d: Dialect) => {
    const s = make(d);
    setSession(s);
    setView(s.schema());
    setOut(null);
  };

  const doRun = (sql: string) => {
    play('tap');
    const o = runScript(session, sql, dialect);
    setOut(o);
    setView(session.schema());
    if (o.failedAt !== undefined) play('bonk');
  };

  const schema = useMemo(() => Object.fromEntries(view.tables.map((t) => [t.name, t.columns.map((c) => c.name)])), [view]);
  const text = texts[dialect];
  const failed = out && out.failedAt !== undefined ? out.results[out.failedAt] : null;
  const error = failed && !failed.ok ? failed.error.span : null;

  return (
    <div className="ws">
      <div className="ws__main">
        <div className="pg__top">
          <DialectToggle
            dialects={block.dialects}
            value={dialect}
            onChange={(d) => {
              setDialect(d);
              swap(d);
            }}
          />
        </div>

        <EditorBox value={text} onChange={(v) => setTexts((t) => ({ ...t, [dialect]: v }))} dialect={dialect} schema={schema} onRun={() => doRun(texts[dialect])} error={error} label={U.editor} />

        <div className="pg__actions">
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
              setTexts((t) => ({ ...t, [dialect]: block.sql[dialect] ?? '' }));
              swap(dialect);
            }}
          >
            <Icon name="reset" size={18} />
            {U.restart}
          </button>
        </div>

        {block.tries && block.tries.length > 0 && (
          <div className="pg__tries">
            <p className="pg__trylabel">{U.tries}</p>
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

        {out && <ScriptOutput out={out} dialect={dialect} />}
      </div>

      <SchemaPanel view={view} />
    </div>
  );
}
