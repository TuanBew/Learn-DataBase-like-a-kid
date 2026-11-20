import { useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says } from '../../components/Mascot';
import { Icon } from '../../components/Icon';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/order-phone';
import { uiApp } from '../../content/ui-app';
import { niceNumber } from '../../engine/values';
import { play } from '../../sfx/sfx';
import './order-phone.css';

const MAX = 6;
const STEP_MINUTES = [0, 4, 9, 11, 16, 22];
const S = uiApp.scenes;

interface Order {
  id: number;
  drink: string;
  price: number;
  time: string;
}

const clock = (n: number) => {
  const total = 8 * 60 + 15 + STEP_MINUTES[n % STEP_MINUTES.length];
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Cảnh "Đặt một ly": mỗi lần bấm Đặt món, một row bay từ điện thoại vào table orders. */
export default function OrderPhone() {
  const [pick, setPick] = useState(copy.drinks[0]?.id ?? '');
  const reduce = useReducedMotion();
  const [orders, setOrders] = useState<Order[]>([]);
  const full = orders.length >= MAX;

  const order = () => {
    const d = copy.drinks.find((x) => x.id === pick);
    if (!d) return;
    if (full) {
      play('bonk');
      return;
    }
    play('fly');
    window.setTimeout(() => play('ting'), 330);
    setOrders((o) => [...o, { id: o.length + 1, drink: d.name, price: d.price, time: clock(o.length) }]);
  };

  const n = orders.length;
  const say = n === 0 ? copy.empty : full ? S.tableFull : copy.afterEach[Math.min(n, copy.afterEach.length) - 1];

  return (
    <div className="ophone">
      <div className="ophone__phone">
        <span className="ophone__notch" aria-hidden="true" />
        <p className="ophone__title">{copy.phoneTitle}</p>
        <div className="ophone__menu" role="radiogroup" aria-label={S.choose}>
          {copy.drinks.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={pick === d.id}
              className="ophone__drink"
              onClick={() => {
                play('tap');
                setPick(d.id);
              }}
            >
              <span className="ophone__dot" aria-hidden="true" />
              <span className="ophone__name">{d.name}</span>
              <span className="ophone__price">{niceNumber(d.price)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn ophone__order" onClick={order}>
          {copy.orderButton}
          <Icon name="arrow" />
        </button>
      </div>

      <div className="ophone__db">
        <div className="ophone__tablehead">
          <span className="chip ophone__tname">table {copy.tableName}</span>
          <span className="chip">
            <b>{n}</b> row
          </span>
          {n > 0 && (
            <button
              type="button"
              className="ophone__reset"
              onClick={() => {
                play('pop');
                setOrders([]);
              }}
            >
              {S.reset}
            </button>
          )}
        </div>
        <div className="otable" role="table" aria-label={copy.tableName}>
          <div className="otable__head" role="row">
            {S.orderColumns.map((c) => (
              <span key={c} role="columnheader">
                {c}
              </span>
            ))}
          </div>
          <div className="otable__rows">
            <AnimatePresence initial={false}>
              {orders.map((o) => (
                <m.div
                  key={o.id}
                  role="row"
                  className="otable__row"
                  initial={reduce ? false : { x: -180, y: -30, opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', duration: 0.6, bounce: 0.3 }}
                >
                  <span role="cell" className="otable__id">
                    {o.id}
                  </span>
                  <span role="cell">{o.drink}</span>
                  <span role="cell" className="otable__num">
                    {niceNumber(o.price)}
                  </span>
                  <span role="cell">{o.time}</span>
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <Says mood={n === 0 ? 'idle' : n >= copy.afterEach.length ? 'cheer' : 'happy'} size={54} className="ophone__say">
          <Rich text={say} />
        </Says>
      </div>
    </div>
  );
}
