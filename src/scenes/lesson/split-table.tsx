import { useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/split-table';
import { play } from '../../sfx/sfx';
import './split-table.css';

/** 0 table to, 1 đã sửa một row, 2 đã tách, 3 đã sửa ở table mới. */
type Stage = 0 | 1 | 2 | 3;

const SAY: Record<Stage, string> = {
  0: copy.says.start,
  1: copy.says.afterEditBig,
  2: copy.says.afterSplit,
  3: copy.says.afterEditSplit,
};
const MOOD: Record<Stage, Mood> = { 0: 'idle', 1: 'think', 2: 'happy', 3: 'cheer' };

const customerOf = (id: string) => copy.customers.find((c) => c.id === id) ?? copy.customers[0];

/** Cảnh "Vì sao phải tách table": một số điện thoại chép ở ba row thì sửa một row là lệch. */
export default function SplitTable() {
  const [stage, setStage] = useState<Stage>(0);
  const reduce = useReducedMotion();
  const split = stage >= 2;

  const edit = () => {
    play('tap');
    if (stage === 0) {
      setStage(1);
      window.setTimeout(() => play('bad'), 260);
    } else if (stage === 2) {
      setStage(3);
      window.setTimeout(() => play('ting'), 200);
    }
  };
  const doSplit = () => {
    play('whoosh');
    setStage(2);
  };
  const reset = () => {
    play('pop');
    setStage(0);
  };

  /** Số điện thoại hiện ở một row của table to. */
  const bigPhone = (orderId: number, customerId: string) => {
    const c = customerOf(customerId);
    if (stage === 1 && c.id === 'C1' && orderId === copy.editedOrderId) return copy.newPhone;
    return c.phone;
  };

  return (
    <div className="stt">
      <div className="stt__bar">
        <button type="button" className="btn btn--sm" onClick={edit} disabled={stage === 1 || stage === 3}>
          {copy.buttons.edit}
        </button>
        <button type="button" className="btn btn--sm btn--matcha" onClick={doSplit} disabled={stage !== 1}>
          {copy.buttons.split}
        </button>
        <button type="button" className="btn btn--sm btn--paper stt__reset" onClick={reset} disabled={stage === 0}>
          {copy.buttons.reset}
        </button>
      </div>

      <div className={`stt__stage ${split ? 'stt__stage--split' : ''}`}>
        <div className="stt__block">
          <div className="stt__head">
            <span className="chip stt__tname">table {copy.tables.orders}</span>
            <span className="chip">
              <b>{copy.orders.length}</b> {copy.rowUnit}
            </span>
          </div>
          {!split ? (
            <div className="stt__table" role="table" aria-label={copy.tables.orders}>
              <div className="stt__tr stt__tr--head stt__cols--big" role="row">
                {copy.columns.big.map((c) => (
                  <span key={c} role="columnheader">
                    {c}
                  </span>
                ))}
              </div>
              {copy.orders.map((o) => {
                const c = customerOf(o.customer);
                const phone = bigPhone(o.id, o.customer);
                const isEdit = stage === 1 && o.id === copy.editedOrderId;
                const isStale = stage === 1 && c.id === 'C1' && !isEdit;
                return (
                  <div key={o.id} className="stt__tr stt__cols--big" role="row">
                    <span role="cell" className="stt__id">
                      {o.id}
                    </span>
                    <span role="cell">{c.name}</span>
                    <span
                      key={`${o.id}-${stage}`}
                      role="cell"
                      className={`stt__phone ${isEdit ? 'stt__cell--flash' : ''} ${isStale ? 'stt__cell--bad' : ''}`}
                      aria-label={isEdit ? `${phone}, ${copy.aria.fresh}` : isStale ? `${phone}, ${copy.aria.stale}` : undefined}
                    >
                      {phone}
                    </span>
                    <span role="cell">{o.drink}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="stt__table" role="table" aria-label={copy.tables.orders}>
              <div className="stt__tr stt__tr--head stt__cols--orders" role="row">
                {copy.columns.orders.map((c) => (
                  <span key={c} role="columnheader">
                    {c}
                  </span>
                ))}
              </div>
              {copy.orders.map((o) => {
                const c = customerOf(o.customer);
                const good = stage === 3 && c.id === 'C1';
                return (
                  <div key={o.id} className={`stt__tr stt__cols--orders stt__tag stt__tag--${c.tag} ${good ? 'stt__row--good' : ''}`} role="row">
                    <span role="cell" className="stt__id">
                      {o.id}
                    </span>
                    <span role="cell" className="stt__cid">
                      {c.id}
                    </span>
                    <span role="cell">{o.drink}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {split && (
          <m.div
            className="stt__block"
            initial={reduce ? false : { x: -90, y: -40, opacity: 0, scale: 0.85 }}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.7, bounce: 0.3 }}
          >
            <div className="stt__head">
              <span className="chip stt__tname stt__tname--new">table {copy.tables.customers}</span>
              <span className="chip">
                <b>{copy.customers.length}</b> {copy.rowUnit}
              </span>
            </div>
            <div className="stt__table" role="table" aria-label={copy.tables.customers}>
              <div className="stt__tr stt__tr--head stt__cols--customers" role="row">
                {copy.columns.customers.map((c) => (
                  <span key={c} role="columnheader">
                    {c}
                  </span>
                ))}
              </div>
              {copy.customers.map((c, i) => {
                const fresh = stage === 3 && c.id === 'C1';
                return (
                  <m.div
                    key={c.id}
                    role="row"
                    className={`stt__tr stt__cols--customers stt__tag stt__tag--${c.tag}`}
                    initial={reduce ? false : { y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: reduce ? 0 : 0.25 + i * 0.08, duration: 0.3 }}
                  >
                    <span role="cell" className="stt__cid">
                      {c.id}
                    </span>
                    <span role="cell">{c.name}</span>
                    <span
                      key={fresh ? 'new' : 'old'}
                      role="cell"
                      className={`stt__phone ${fresh ? 'stt__cell--flash' : ''}`}
                      aria-label={fresh ? `${copy.newPhone}, ${copy.aria.fresh}` : undefined}
                    >
                      {fresh ? copy.newPhone : c.phone}
                    </span>
                  </m.div>
                );
              })}
            </div>
          </m.div>
        )}
      </div>

      <Says mood={MOOD[stage]} size={56} className="stt__say">
        <Rich text={SAY[stage]} />
      </Says>
    </div>
  );
}
