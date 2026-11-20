import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Icon } from '../../components/Icon';
import { Mascot, Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy, type WhBox, type WhSlip } from '../../content/scenes/warehouse';
import { play } from '../../sfx/sfx';
import './warehouse.css';

type Phase = 'go' | 'pick' | 'back' | 'done';

function Box({ box, className = '' }: { box: WhBox; className?: string }) {
  return (
    <div className={`wh-box ${className}`}>
      <span className="wh-box__title">{box.title}</span>
      <span className="wh-box__sub">{box.sub}</span>
    </div>
  );
}

/** Cảnh "Nhà kho của Bi": bạn đưa phiếu, DBMS tìm kệ, chép row mang ra hoặc xếp row mới lên kệ. */
export default function Warehouse() {
  const reduce = useReducedMotion();
  const [slipId, setSlipId] = useState(copy.slips[0].id);
  const [run, setRun] = useState<{ slip: WhSlip; phase: Phase } | null>(null);
  const [stored, setStored] = useState(false);
  const [tried, setTried] = useState<string[]>([]);
  const [biY, setBiY] = useState(0);
  const shelfRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const slip = copy.slips.find((s) => s.id === slipId) ?? copy.slips[0];
  const busy = run !== null && run.phase !== 'done';
  const blocked = slip.kind === 'store' && stored;

  const give = () => {
    if (busy || blocked) return;
    clearTimers();
    play('tap');
    const finish = () => {
      setRun({ slip, phase: 'done' });
      setTried((t) => (t.includes(slip.id) ? t : [...t, slip.id]));
      play('ting');
    };
    if (reduce) {
      if (slip.kind === 'store') setStored(true);
      finish();
      return;
    }
    const shelf = shelfRefs.current[slip.shelf];
    const tray = trayRef.current;
    const dist = shelf && tray ? tray.offsetTop + tray.offsetHeight / 2 - (shelf.offsetTop + shelf.offsetHeight / 2) : 0;
    setRun({ slip, phase: 'go' });
    setBiY(-dist);
    play('whoosh');
    later(() => {
      setRun({ slip, phase: 'pick' });
      if (slip.kind === 'store') setStored(true);
      play('pop');
    }, 750);
    later(() => {
      setRun({ slip, phase: 'back' });
      setBiY(0);
      play('fly');
    }, 1600);
    later(finish, 2300);
  };

  const pick = (id: string) => {
    if (busy) return;
    play('tap');
    setSlipId(id);
    setRun(null);
  };

  const reset = () => {
    clearTimers();
    play('pop');
    setRun(null);
    setStored(false);
    setTried([]);
    setBiY(0);
    setSlipId(copy.slips[0].id);
  };

  const phase = run?.phase;
  const reached = phase === 'pick' || phase === 'back' || phase === 'done';
  const isTaken = (shelf: number, id: number) => !!run && reached && run.slip.kind === 'fetch' && run.slip.shelf === shelf && run.slip.take.includes(id);
  const carrying = !!run && ((run.slip.kind === 'fetch' && phase === 'back') || (run.slip.kind === 'store' && phase === 'go'));
  const carryCount = run?.slip.kind === 'fetch' ? run.slip.take.length : 1;
  const trayBoxes = run && phase === 'done' && run.slip.kind === 'fetch' ? copy.shelves[run.slip.shelf].boxes.filter((b) => run.slip.take.includes(b.id)) : [];
  const storedDone = !!run && phase === 'done' && run.slip.kind === 'store';

  let say = copy.says.start;
  let mood: Mood = 'idle';
  if (run && (phase === 'go' || phase === 'pick')) {
    say = run.slip.going;
    mood = 'think';
  } else if (run) {
    say = run.slip.done;
    mood = 'happy';
  } else if (blocked) {
    say = copy.says.storedAlready;
  } else if (tried.length > 0 || slipId !== copy.slips[0].id) {
    say = copy.says.picked;
  }
  const all = tried.length >= copy.slips.length && phase === 'done';
  const dirty = run !== null || stored || tried.length > 0;

  return (
    <div className="sk wh">
      <div className="wh__slips" role="radiogroup" aria-label={copy.slipsLabel}>
        {copy.slips.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={slipId === s.id} disabled={busy} className="sk-pick wh-slip" onClick={() => pick(s.id)}>
            {s.text}
          </button>
        ))}
      </div>

      <div className="wh__ask">
        <div className="wh__sql">
          <span className="sk-label">{copy.sqlLabel}</span>
          <pre className="sk-sql">{slip.sql}</pre>
        </div>
        <button type="button" className="btn wh__give" onClick={give} disabled={busy || blocked}>
          {copy.give}
          <Icon name="arrow" />
        </button>
      </div>

      <div className="sk-stage wh__stage">
        {copy.shelves.map((sh, i) => {
          const here = !!run && run.slip.shelf === i && (phase === 'go' || phase === 'pick');
          const extra = stored && copy.slips.find((s) => s.kind === 'store' && s.shelf === i)?.box;
          const total = sh.total + (extra ? 1 : 0);
          return (
            <div
              key={sh.table}
              ref={(el) => {
                shelfRefs.current[i] = el;
              }}
              className={`wh-shelf ${here ? 'is-here' : ''}`}
            >
              <div className="wh-shelf__head">
                <span className="chip wh-shelf__name">table {sh.table}</span>
                <span className="chip">{copy.rows(total)}</span>
              </div>
              <div className="wh-shelf__boxes">
                {sh.boxes.map((b) => (
                  <Box key={b.id} box={b} className={isTaken(i, b.id) ? 'is-taken' : ''} />
                ))}
                {extra && (
                  <m.div initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.45 }}>
                    <Box box={extra} className="is-new" />
                  </m.div>
                )}
                <div className="wh-box wh-box--more">{copy.more(sh.total - sh.boxes.length)}</div>
              </div>
            </div>
          );
        })}

        <div className="wh__tray" ref={trayRef} aria-live="polite">
          <span className="sk-label">{copy.trayLabel}</span>
          <div className="wh__traybox">
            <AnimatePresence>
              {trayBoxes.map((b, n) => (
                <m.div
                  key={`${run?.slip.id}-${b.id}`}
                  initial={reduce ? false : { y: -18, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', duration: 0.45, bounce: 0.35, delay: n * 0.07 }}
                >
                  <Box box={b} className="is-copy" />
                </m.div>
              ))}
            </AnimatePresence>
            {storedDone && (
              <span className="wh__stored">
                <Icon name="check" size={16} />
                {copy.storedNote}
              </span>
            )}
            {trayBoxes.length === 0 && !storedDone && <span className="wh__empty">{copy.trayEmpty}</span>}
          </div>
        </div>

        <m.div className="wh__bi" initial={false} animate={{ y: biY }} transition={{ type: 'spring', duration: 0.7, bounce: 0.18 }} aria-hidden="true">
          <Mascot mood={phase === 'go' || phase === 'back' ? 'wow' : phase === 'pick' ? 'think' : phase === 'done' ? 'happy' : 'idle'} size={56} />
          {carrying && <span className="wh__carry">{carryCount}</span>}
        </m.div>
      </div>

      <div className="sk-bar">
        <Says mood={all ? 'cheer' : mood} size={56} className="sk-say">
          <Rich text={say} />
          {all && (
            <p className="wh__all">
              <Rich text={copy.says.all} />
            </p>
          )}
        </Says>
        <button type="button" className="btn btn--sm btn--paper sk-bar__end" onClick={reset} disabled={!dirty || busy}>
          {copy.reset}
        </button>
      </div>
    </div>
  );
}
