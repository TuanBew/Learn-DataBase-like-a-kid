import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/pk-bonk';
import { play } from '../../sfx/sfx';
import './pk-bonk.css';

interface Row {
  id: number;
  name: string;
}
type Outcome = { kind: 'dup'; id: number } | { kind: 'null' } | { kind: 'ok'; id: number; sameName: boolean };

const COLS = 'minmax(84px, 0.6fr) minmax(0, 1.4fr)';

/** Cảnh "Số báo danh bật ra": row trùng primary key hoặc để trống primary key thì database không nhận. */
export default function PkBonk() {
  const reduce = useReducedMotion();
  const [added, setAdded] = useState<Row[]>([]);
  const [pick, setPick] = useState<number | null | undefined>(undefined);
  const [out, setOut] = useState<Outcome | null>(null);
  const [bump, setBump] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const rows: Row[] = [...copy.rows, ...added];
  const name = copy.candidates[added.length];
  const finished = name === undefined;
  const clash = out?.kind === 'dup' ? out.id : null;

  const choose = (id: number | null) => {
    if (finished) return;
    play('tap');
    setPick(id);
    setOut(null);
  };

  const add = () => {
    if (pick === undefined || finished) return;
    play('fly');
    const land = (fn: () => void) => {
      if (reduce) fn();
      else timer.current = window.setTimeout(fn, 260);
    };
    if (pick === null) {
      setOut({ kind: 'null' });
      setBump((b) => b + 1);
      land(() => play('bonk'));
      return;
    }
    if (rows.some((r) => r.id === pick)) {
      setOut({ kind: 'dup', id: pick });
      setBump((b) => b + 1);
      land(() => play('bonk'));
      return;
    }
    const sameName = rows.some((r) => r.name.split(' ').pop() === name.split(' ').pop());
    setAdded((a) => [...a, { id: pick, name }]);
    setOut({ kind: 'ok', id: pick, sameName });
    setPick(undefined);
    land(() => play('ting'));
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    play('pop');
    setAdded([]);
    setPick(undefined);
    setOut(null);
  };

  let say = copy.says.start;
  let mood: Mood = 'idle';
  if (out?.kind === 'dup') {
    say = copy.says.dup(out.id);
    mood = 'wow';
  } else if (out?.kind === 'null') {
    say = copy.says.null;
    mood = 'wow';
  } else if (out?.kind === 'ok') {
    say = out.sameName ? copy.says.okSameName(out.id) : copy.says.ok(out.id);
    mood = 'happy';
  } else if (pick !== undefined) {
    say = copy.says.picked;
  }
  const bad = out?.kind === 'dup' || out?.kind === 'null';
  const codes = out?.kind === 'dup' ? copy.codes.dup : out?.kind === 'null' ? copy.codes.null : null;

  return (
    <div className="sk pkb" style={{ ['--cols' as string]: COLS }}>
      <div className="pkb__form">
        <span className="sk-label" id="pkb-ids">
          {copy.idLabel}
        </span>
        <div className="sk-picks" role="radiogroup" aria-labelledby="pkb-ids">
          {copy.ids.map((id) => (
            <button key={String(id)} type="button" role="radio" aria-checked={pick === id} disabled={finished} className="sk-pick sk-pick--mono" onClick={() => choose(id)}>
              {id === null ? copy.nullPick : id}
            </button>
          ))}
        </div>
      </div>

      <div className="sk-stage pkb__stage">
        <div className="pkb__pad">
          <span className="sk-label">{copy.newLabel}</span>
          {!finished && (
            <div key={bump} className={`sk-tr pkb-new ${bad && !reduce ? 'is-bonk' : ''} ${bad ? 'is-bad' : ''}`}>
              <span className={`pkb-id ${pick === null ? 'sk-null' : ''}`}>{pick === undefined ? copy.unset : pick === null ? copy.nullText : pick}</span>
              <span>{name}</span>
            </div>
          )}
          <button type="button" className="btn pkb__add" onClick={add} disabled={pick === undefined || finished}>
            {copy.add}
          </button>
        </div>

        <div className="sk-bar pkb__thead">
          <span className="chip pkb__tname">table {copy.tableName}</span>
          <span className="chip">{copy.rowsChip(rows.length)}</span>
          <span className="chip pkb__pk">
            {copy.columns[0]}: {copy.pkNote}
          </span>
        </div>
        <div className="sk-table" role="table" aria-label={copy.tableName}>
          <div className="sk-tr sk-tr--head" role="row">
            {copy.columns.map((c) => (
              <span key={c} role="columnheader">
                {c}
              </span>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <m.div
                key={r.id}
                role="row"
                className={`sk-tr ${clash === r.id ? 'is-clash' : ''}`}
                initial={reduce ? false : { y: -46, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.55, bounce: 0.35 }}
              >
                <span role="cell" className="pkb-id pkb-id--glow">
                  {r.id}
                </span>
                <span role="cell">{r.name}</span>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="sk-codes" aria-live="polite">
        {codes && (
          <>
            <span>{copy.codesLabel}</span>
            <span className="chip">
              {copy.mysql} <b>{codes.mysql}</b>
            </span>
            <span className="chip">
              {copy.oracle} <b>{codes.oracle}</b>
            </span>
          </>
        )}
      </div>

      <div className="sk-bar pkb__foot">
        <Says mood={finished ? 'cheer' : mood} size={56} className="sk-say">
          <Rich text={say} />
          {out?.kind === 'ok' && (
            <p className="pkb__more">
              <Rich text={finished ? copy.says.done : copy.says.next} />
            </p>
          )}
        </Says>
        <button type="button" className="btn btn--sm btn--paper sk-bar__end" onClick={reset} disabled={added.length === 0 && out === null && pick === undefined}>
          {copy.reset}
        </button>
      </div>
    </div>
  );
}
