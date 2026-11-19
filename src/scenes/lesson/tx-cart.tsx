import { useMemo, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy, type TxCommand } from '../../content/scenes/tx-cart';
import { teashop } from '../../data/teashop';
import { type Database, type Dialect, type Session, createSession } from '../../engine';
import { niceNumber } from '../../engine/values';
import { play } from '../../sfx/sfx';
import '../kit.css';
import './tx-cart.css';

type Cells = (string | number | null)[];
type Mark = 'new' | 'changed' | 'gone' | undefined;

function makeCopy(): Database {
  const t = teashop.tables.find((x) => x.name === copy.table);
  if (!t) return { name: teashop.name, tables: [] };
  const idx = copy.columns.map((c) => t.columns.findIndex((x) => x.name === c));
  return { name: teashop.name, tables: [{ name: t.name, columns: idx.map((i) => t.columns[i]), rows: t.rows.slice(0, copy.take).map((r) => idx.map((i) => r[i])) }] };
}

const rowsOf = (s: Session): Cells[] => s.db().tables[0].rows.map((r) => [...r]);

function Table({ title, tone, rows, marks }: { title: string; tone: string; rows: Cells[]; marks?: Map<unknown, Mark> }) {
  const reduce = useReducedMotion();
  return (
    <div className="txc-view">
      <span className={`chip txc-view__title txc-view__title--${tone}`}>{title}</span>
      <div className="sk-table" role="table" aria-label={title}>
        <div className="sk-tr sk-tr--head" role="row">
          {copy.columns.map((c, i) => (
            <span key={c} role="columnheader" className={i === 2 ? 'sk-num' : ''}>
              {c}
            </span>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const mark = marks?.get(r[0]);
            return (
              <m.div
                key={String(r[0])}
                role="row"
                className={`sk-tr ${mark ? `is-${mark}` : ''}`}
                initial={reduce ? false : { opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.28 }}
              >
                <span role="cell" className="sk-key">
                  {r[0]}
                </span>
                <span role="cell">{r[1]}</span>
                <span role="cell" className="sk-num">
                  {typeof r[2] === 'number' ? niceNumber(r[2]) : r[2]}
                </span>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Cảnh "Giỏ thay đổi": thay đổi nằm trong giỏ cho tới khi COMMIT. MySQL tự COMMIT, trừ khi mở transaction. */
export default function TxCart() {
  const reduce = useReducedMotion();
  const base = useMemo(makeCopy, []);
  const [dialect, setDialect] = useState<Dialect>('oracle');
  const [first] = useState(() => createSession(base, 'oracle'));
  const session = useRef<Session>(first);
  const [mine, setMine] = useState<Cells[]>(() => rowsOf(first));
  const [theirs, setTheirs] = useState<Cells[]>(() => rowsOf(first));
  const [cart, setCart] = useState<TxCommand[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [inTx, setInTx] = useState(false);
  const [say, setSay] = useState<{ text: string; mood: Mood } | null>(null);
  const [last, setLast] = useState('');

  const start = (d: Dialect) => {
    session.current = createSession(base, d);
    const rows = rowsOf(session.current);
    setDialect(d);
    setMine(rows);
    setTheirs(rows);
    setCart([]);
    setDone([]);
    setInTx(false);
    setSay(null);
    setLast('');
  };

  const runCommand = (c: TxCommand) => {
    const s = session.current;
    const r = s.run(c.sql);
    setLast(c.sql);
    if (!r.ok || r.kind !== 'dml') {
      play('bonk');
      setSay({ text: r.ok ? copy.says.error : r.error.friendly, mood: 'think' });
      return;
    }
    const rows = rowsOf(s);
    setMine(rows);
    setDone((d) => [...d, c.id]);
    if (r.dml.pending) {
      play('drop');
      setCart((x) => [...x, c]);
      setSay({ text: copy.says.pending, mood: 'think' });
    } else {
      play('ting');
      setTheirs(rows);
      setSay({ text: copy.says.auto, mood: 'wow' });
    }
  };

  const begin = () => {
    session.current.run('START TRANSACTION');
    play('tap');
    setInTx(true);
    setLast(`${copy.begin};`);
    setSay({ text: copy.says.begin, mood: 'happy' });
  };

  const end = (op: 'commit' | 'rollback') => {
    const s = session.current;
    const r = s.run(op === 'commit' ? 'COMMIT' : 'ROLLBACK');
    const n = r.ok && r.kind === 'tx' ? r.changes : 0;
    const rows = rowsOf(s);
    setLast(op === 'commit' ? `${copy.commit};` : `${copy.rollback};`);
    setInTx(false);
    if (n === 0) {
      play('tick');
      setSay({ text: op === 'commit' ? copy.says.commitEmpty : done.length > 0 ? copy.says.rollbackTooLate : copy.says.rollbackEmpty, mood: 'think' });
      return;
    }
    setMine(rows);
    if (op === 'commit') {
      play('ok');
      setTheirs(rows);
      setSay({ text: copy.says.commit(n), mood: 'cheer' });
    } else {
      play('whoosh');
      const back = new Set(cart.map((c) => c.id));
      setDone((d) => d.filter((id) => !back.has(id)));
      setSay({ text: copy.says.rollback(n), mood: 'happy' });
    }
    setCart([]);
  };

  // So table của bạn với table người khác thấy, để tô các row đang chờ COMMIT.
  const theirById = new Map(theirs.map((r) => [r[0], r]));
  const marks = new Map<unknown, Mark>();
  for (const r of mine) {
    const old = theirById.get(r[0]);
    if (!old) marks.set(r[0], 'new');
    else if (old.some((v, i) => v !== r[i])) marks.set(r[0], 'changed');
  }
  const mineIds = new Set(mine.map((r) => r[0]));
  const shown = [...mine];
  theirs.forEach((r, i) => {
    if (!mineIds.has(r[0])) {
      marks.set(r[0], 'gone');
      shown.splice(Math.min(i, shown.length), 0, r);
    }
  });

  const dirty = done.length > 0 || inTx || say !== null;
  const text = say?.text ?? (dialect === 'oracle' ? copy.says.startOracle : copy.says.startMysql);

  return (
    <div className="sk txc" style={{ ['--cols' as string]: '78px minmax(0, 1fr) 62px' }}>
      <div className="txc__top">
        <div className="txc__group">
          <span className="sk-label" id="txc-dbms">
            {copy.dialectLabel}
          </span>
          <div className="sk-picks" role="radiogroup" aria-labelledby="txc-dbms">
            {copy.dialects.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={dialect === d.id}
                className="sk-pick"
                onClick={() => {
                  play('tap');
                  start(d.id);
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
        <div className="txc__group">
          <span className="sk-label">{copy.commandsLabel}</span>
          <div className="sk-picks">
            {copy.commands.map((c) => (
              <button key={c.id} type="button" className="btn btn--sm btn--paper" disabled={done.includes(c.id)} onClick={() => runCommand(c)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`txc__sql ${last ? '' : 'is-hidden'}`}>
        <span className="sk-label">{copy.lastSql}</span>
        <pre className="sk-sql">{last || ' '}</pre>
      </div>

      <div className="sk-stage txc__stage">
        <Table title={copy.mine} tone="mine" rows={shown} marks={marks} />
        <Table title={copy.theirs} tone="theirs" rows={theirs} />

        <div className={`txc-cart ${cart.length > 0 ? 'is-full' : ''}`} aria-live="polite">
          <svg className="txc-cart__art" viewBox="0 0 64 56" aria-hidden="true">
            <path d="M4 8h9l8 28h28l7-20H17" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="25" cy="46" r="5" fill="var(--mango)" stroke="var(--ink)" strokeWidth="3" />
            <circle cx="45" cy="46" r="5" fill="var(--mango)" stroke="var(--ink)" strokeWidth="3" />
          </svg>
          <div className="txc-cart__body">
            <span className="sk-label">
              {copy.cart}: {cart.length > 0 ? copy.cartCount(cart.length) : copy.cartEmpty}
            </span>
            <div className="txc-cart__items">
              <AnimatePresence>
                {cart.map((c) => (
                  <m.span
                    key={c.id}
                    className="txc-item"
                    initial={reduce ? false : { y: -30, opacity: 0, rotate: -6 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: 'spring', duration: 0.45, bounce: 0.4 }}
                  >
                    {c.chip}
                  </m.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="txc-cart__actions">
            {dialect === 'mysql' && (
              <button type="button" className="btn btn--sm btn--paper txc__mono" onClick={begin} disabled={inTx}>
                {copy.begin}
              </button>
            )}
            <button type="button" className="btn btn--sm txc__mono txc__commit" onClick={() => end('commit')}>
              {copy.commit}
            </button>
            <button type="button" className="btn btn--sm txc__mono txc__rollback" onClick={() => end('rollback')}>
              {copy.rollback}
            </button>
          </div>
        </div>
      </div>

      <div className="sk-bar txc__foot">
        <Says mood={say?.mood ?? 'idle'} size={56} className="sk-say">
          <Rich text={text} />
        </Says>
        <button
          type="button"
          className="btn btn--sm btn--paper sk-bar__end"
          disabled={!dirty}
          onClick={() => {
            play('pop');
            start(dialect);
          }}
        >
          {copy.reset}
        </button>
      </div>
    </div>
  );
}
