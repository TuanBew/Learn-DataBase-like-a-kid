import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy, type GateCard, type RuleId } from '../../content/scenes/constraint-gate';
import { niceNumber } from '../../engine/values';
import { play } from '../../sfx/sfx';
import './constraint-gate.css';

const CARDS: readonly GateCard[] = copy.cards;
const RULES = copy.rules;

type Light = 'ok' | 'bad';
type Phase = 'in' | 'pass' | 'fail';
interface Outcome {
  id: string;
  passed: boolean;
}

const SLIDE = 600;
const BEAT = 420;
const cardOf = (id: string) => CARDS.find((c) => c.id === id);

/** Ba ô của một row: product_id, name, price. */
function Cells({ row }: { row: GateCard['row'] }) {
  return (
    <>
      <span className="cgt-id">{row.id}</span>
      {row.name === null ? <span className="cgt-null">{copy.nullText}</span> : <span>{row.name}</span>}
      <span className="cgt-num">{niceNumber(row.price)}</span>
    </>
  );
}

/** Cảnh "Cổng constraint": row phạm luật của table thì database không nhận. */
export default function ConstraintGate() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [inside, setInside] = useState<string[]>([]);
  const [tried, setTried] = useState<string[]>([]);
  const [blocked, setBlocked] = useState(0);
  const [lights, setLights] = useState<Partial<Record<RuleId, Light>>>({});
  const [run, setRun] = useState<{ id: string; phase: Phase } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const busy = run !== null;
  const lightOf = (card: GateCard, id: RuleId): Light => (card.breaks === id ? 'bad' : 'ok');

  const go = () => {
    const card = selected ? cardOf(selected) : undefined;
    if (!card || busy) return;
    play('tap');
    setSelected(null);
    setOutcome(null);
    setLights({});

    const finish = () => {
      const passed = card.breaks === null;
      setOutcome({ id: card.id, passed });
      setTried((t) => (t.includes(card.id) ? t : [...t, card.id]));
      if (passed) {
        play('ting');
        setInside((i) => [...i, card.id]);
      } else {
        play('bonk');
        setBlocked((b) => b + 1);
      }
      return passed;
    };

    if (reduce) {
      setLights(Object.fromEntries(RULES.map((r) => [r.id, lightOf(card, r.id)])));
      finish();
      return;
    }

    setRun({ id: card.id, phase: 'in' });
    RULES.forEach((r, i) => {
      later(() => {
        play('tap');
        setLights((l) => ({ ...l, [r.id]: lightOf(card, r.id) }));
      }, SLIDE + i * BEAT);
    });
    later(() => {
      const passed = finish();
      setRun({ id: card.id, phase: passed ? 'pass' : 'fail' });
    }, SLIDE + RULES.length * BEAT + 120);
    later(() => setRun(null), SLIDE + RULES.length * BEAT + 800);
  };

  const reset = () => {
    clearTimers();
    play('pop');
    setSelected(null);
    setInside([]);
    setTried([]);
    setBlocked(0);
    setLights({});
    setRun(null);
    setOutcome(null);
  };

  const pick = (id: string) => {
    if (busy || inside.includes(id)) return;
    play('tap');
    setSelected(id);
  };

  const outCard = outcome ? cardOf(outcome.id) : undefined;
  const allTried = tried.length >= CARDS.length;
  let say: string = copy.says.start;
  let mood: Mood = 'idle';
  if (busy && !outcome) {
    say = copy.says.running;
    mood = 'think';
  } else if (selected) {
    say = copy.says.picked;
  } else if (outCard) {
    say = outCard.say;
    mood = outcome?.passed ? 'happy' : 'think';
  }
  const showDone = allTried && !busy && !selected;

  const tableRows = [...copy.rows, ...inside.map((id) => cardOf(id)?.row).filter((r): r is GateCard['row'] => !!r).map((r) => ({ id: r.id, name: r.name ?? '', price: r.price }))];
  const fresh = (i: number) => i >= copy.rows.length;
  const dirty = inside.length > 0 || tried.length > 0 || selected !== null;

  return (
    <div className="cgt">
      <div className="cgt__side">
        <div className="cgt__qhead">
          <span className="chip">{copy.queueLabel}</span>
        </div>
        <div className="cgt__cols" aria-hidden="true">
          {copy.columns.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="cgt__queue" role="radiogroup" aria-label={copy.queueLabel}>
          {CARDS.map((c) => {
            const isIn = inside.includes(c.id);
            const isRun = run?.id === c.id;
            if (isIn || isRun) {
              return (
                <div key={c.id} className="cgt-card cgt-card--slot">
                  {isIn ? copy.slotIn : copy.slotRunning}
                </div>
              );
            }
            return (
              <button key={c.id} type="button" role="radio" aria-checked={selected === c.id} disabled={busy} className="cgt-card cgt-card--btn" onClick={() => pick(c.id)}>
                <Cells row={c.row} />
              </button>
            );
          })}
        </div>
        <button type="button" className="btn cgt__go" onClick={go} disabled={!selected || busy}>
          {copy.button}
        </button>
      </div>

      <div className="cgt__main">
        <div className="cgt__gate">
          <ul className="cgt__signs">
            {RULES.map((r) => {
              const st = lights[r.id];
              return (
                <li key={r.id} className="cgt__signwrap">
                  <span className="cgt__rope" aria-hidden="true" />
                  <div key={st ?? 'idle'} className={`cgt-sign ${st ? `cgt-sign--${st}` : ''}`}>
                    <span className="cgt-sign__col">{r.column}</span>
                    <span className="cgt-sign__rule">{r.text}</span>
                    <span className="cgt-sign__state">{st === 'ok' ? copy.signOk : st === 'bad' ? copy.signBad : ' '}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="cgt__lane">
            <AnimatePresence>
              {run && (
                <m.div
                  key={run.id}
                  className="cgt-card cgt-runner"
                  initial={{ x: -280, opacity: 0 }}
                  animate={
                    run.phase === 'pass'
                      ? { x: 0, y: 70, opacity: 0, scale: 0.8 }
                      : run.phase === 'fail'
                        ? { x: -280, y: 0, opacity: 0, rotate: -8 }
                        : { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }
                  }
                  transition={{ type: 'spring', duration: 0.55, bounce: run.phase === 'fail' ? 0.4 : 0.2 }}
                >
                  <Cells row={cardOf(run.id)?.row ?? CARDS[0].row} />
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="cgt__codes" aria-live="polite">
          {outCard && !outcome?.passed && outCard.codes && (
            <>
              <span className="cgt__codeslabel">{copy.codesLabel}</span>
              <span className="chip cgt__code">
                {copy.mysql} <b>{outCard.codes.mysql}</b>
              </span>
              <span className="chip cgt__code">
                {copy.oracle} <b>{outCard.codes.oracle}</b>
              </span>
            </>
          )}
        </div>

        <div className="cgt__thead">
          <span className="chip cgt__tname">table {copy.tableName}</span>
          <span className="chip">
            <b>{inside.length}</b> {copy.chipIn}
          </span>
          <span className="chip">
            <b>{blocked}</b> {copy.chipBlocked}
          </span>
          <button type="button" className="btn btn--sm btn--paper cgt__reset" onClick={reset} disabled={!dirty || busy}>
            {copy.reset}
          </button>
        </div>
        <div className="cgt__table" role="table" aria-label={copy.tableName}>
          <div className="cgt__tr cgt__tr--head" role="row">
            {copy.columns.map((c) => (
              <span key={c} role="columnheader">
                {c}
              </span>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {tableRows.map((r, i) => (
              <m.div
                key={r.id + '-' + i}
                role="row"
                className="cgt__tr"
                initial={fresh(i) && !reduce ? { y: -40, opacity: 0, scale: 0.8 } : false}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', duration: 0.55, bounce: 0.35 }}
              >
                <span role="cell" className="cgt-id">
                  {r.id}
                </span>
                <span role="cell">{r.name}</span>
                <span role="cell" className="cgt-num">
                  {niceNumber(r.price)}
                </span>
              </m.div>
            ))}
          </AnimatePresence>
        </div>

        <Says mood={mood} size={56} className="cgt__say">
          <Rich text={say} />
          {showDone && (
            <p className="cgt__done">
              <Rich text={copy.says.done} />
            </p>
          )}
        </Says>
      </div>
    </div>
  );
}
