import { useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/fk-rope';
import { play } from '../../sfx/sfx';
import './fk-rope.css';

const HEAD = 22;
const ROW = 38;
const GAP = 5;
/** Tâm của row thứ i, tính từ mép trên của table. */
const yOf = (i: number) => HEAD + GAP + i * (ROW + GAP) + ROW / 2;

type Note = { kind: 'picked' | 'blocked' | 'deleted' | 'ordersGone'; id: number; n: number };

/** Cảnh "Sợi dây giữa đơn và khách": foreign key nối row ở orders tới row ở customers. */
export default function FkRope() {
  const reduce = useReducedMotion();
  const [customers, setCustomers] = useState(copy.customers.rows);
  const [orders, setOrders] = useState(copy.orders.rows);
  const [sel, setSel] = useState<number | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [shake, setShake] = useState(0);

  const countOf = (id: number) => orders.filter((o) => o.customer === id).length;
  const tense = note?.kind === 'blocked' ? note.id : null;

  const pick = (id: number) => {
    play('tap');
    setSel(id);
    setNote({ kind: 'picked', id, n: countOf(id) });
  };

  const deleteCustomer = () => {
    if (sel === null) return;
    const n = countOf(sel);
    if (n > 0) {
      play('alarm');
      setNote({ kind: 'blocked', id: sel, n });
      setShake((s) => s + 1);
      return;
    }
    play('drop');
    setCustomers((c) => c.filter((x) => x.id !== sel));
    setNote({ kind: 'deleted', id: sel, n: 0 });
    setSel(null);
  };

  const deleteOrders = () => {
    if (sel === null) return;
    const n = countOf(sel);
    if (n === 0) return;
    play('whoosh');
    setOrders((o) => o.filter((x) => x.customer !== sel));
    setNote({ kind: 'ordersGone', id: sel, n });
  };

  const reset = () => {
    play('pop');
    setCustomers(copy.customers.rows);
    setOrders(copy.orders.rows);
    setSel(null);
    setNote(null);
  };

  const height = HEAD + GAP + Math.max(customers.length, orders.length, 1) * (ROW + GAP);
  const ropes = orders.flatMap((o, i) => {
    const j = customers.findIndex((c) => c.id === o.customer);
    if (j < 0) return [];
    const a = yOf(i);
    const b = yOf(j);
    const taut = tense === o.customer;
    const sag = taut ? 0 : 16;
    return [{ id: o.id, customer: o.customer, taut, d: `M0 ${a} Q50 ${(a + b) / 2 + sag} 100 ${b}` }];
  });

  let say = copy.says.start;
  let mood: Mood = 'idle';
  if (customers.length === 0) say = copy.says.empty;
  else if (note?.kind === 'picked') say = copy.says.picked(note.id, note.n);
  else if (note?.kind === 'blocked') {
    say = copy.says.blocked(note.id, note.n);
    mood = 'panic';
  } else if (note?.kind === 'deleted') {
    say = copy.says.deleted(note.id);
    mood = 'happy';
  } else if (note?.kind === 'ordersGone') {
    say = copy.says.ordersGone(note.id, note.n);
    mood = 'think';
  }
  const dirty = customers.length !== copy.customers.rows.length || orders.length !== copy.orders.rows.length || sel !== null;

  return (
    <div className="sk fkr" style={{ ['--row' as string]: `${ROW}px`, ['--head' as string]: `${HEAD}px`, ['--gap' as string]: `${GAP}px` }}>
      <div className="sk-stage fkr__stage">
        <div className="fkr__names">
          <div className="sk-bar">
            <span className="chip fkr__tname">table {copy.orders.name}</span>
            <span className="chip">{copy.rowsChip(orders.length)}</span>
          </div>
          <span />
          <div className="sk-bar">
            <span className="chip fkr__tname">table {copy.customers.name}</span>
            <span className="chip">{copy.rowsChip(customers.length)}</span>
          </div>
        </div>

        <div className="fkr__tables" style={{ minHeight: height }}>
          <div className="sk-table fkr__orders" role="table" aria-label={copy.orders.name}>
            <div className="sk-tr sk-tr--head" role="row">
              {copy.orders.columns.map((c) => (
                <span key={c} role="columnheader">
                  {c}
                </span>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {orders.map((o) => (
                <m.div key={o.id} role="row" layout={!reduce} className={`sk-tr fkr-order ${sel === o.customer ? 'is-linked' : ''} ${tense === o.customer ? 'is-tense' : ''}`} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  <span role="cell" className="sk-key">
                    {o.id}
                  </span>
                  <span role="cell" className="fkr-fk">
                    {o.customer}
                  </span>
                </m.div>
              ))}
            </AnimatePresence>
          </div>

          <svg className="fkr__ropes" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ height }} aria-hidden="true">
            {ropes.map((r) => (
              <m.path
                key={r.id}
                className={`fkr-rope ${sel === r.customer ? 'is-linked' : ''} ${r.taut ? 'is-tense' : ''}`}
                initial={false}
                animate={{ d: r.d }}
                transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.5, bounce: r.taut ? 0.6 : 0.2 }}
              />
            ))}
          </svg>

          <div className="sk-table fkr__customers" role="radiogroup" aria-label={copy.pickLabel}>
            <div className="sk-tr sk-tr--head" aria-hidden="true">
              {copy.customers.columns.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {customers.map((c) => (
                <m.button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={sel === c.id}
                  layout={!reduce}
                  className={`sk-tr fkr-customer ${tense === c.id ? 'is-tense' : ''}`}
                  onClick={() => pick(c.id)}
                  exit={{ opacity: 0, x: 40, rotate: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <span key={tense === c.id ? shake : 0} className={`fkr-pk ${tense === c.id && !reduce ? 'is-shake' : ''}`}>
                    {c.id}
                  </span>
                  <span>{c.name}</span>
                </m.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="fkr__names fkr__notes">
          <span className="fkr-note">{copy.fkNote}</span>
          <span />
          <span className="fkr-note">{copy.pkNote}</span>
        </div>
      </div>

      <div className="sk-bar">
        <button type="button" className="btn fkr__del" onClick={deleteCustomer} disabled={sel === null}>
          {copy.deleteCustomer}
        </button>
        <button type="button" className="btn btn--sm btn--paper" onClick={deleteOrders} disabled={sel === null || countOf(sel) === 0}>
          {copy.deleteOrders}
        </button>
        <button type="button" className="btn btn--sm btn--paper sk-bar__end" onClick={reset} disabled={!dirty}>
          {copy.reset}
        </button>
      </div>

      <div className="sk-codes" aria-live="polite">
        {note?.kind === 'blocked' && (
          <>
            <span>{copy.codesLabel}</span>
            <span className="chip">
              {copy.mysql} <b>{copy.codes.mysql}</b>
            </span>
            <span className="chip">
              {copy.oracle} <b>{copy.codes.oracle}</b>
            </span>
          </>
        )}
      </div>

      <Says mood={mood} size={56} className="sk-say">
        <Rich text={say} />
      </Says>
    </div>
  );
}
