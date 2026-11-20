import { useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Says } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/data-street';
import type { DataStreetCopy } from '../../content/types';
import { uiApp } from '../../content/ui-app';
import { play } from '../../sfx/sfx';
import './data-street.css';

type PlaceId = DataStreetCopy['places'][number]['id'];

/* ---------- vẽ khối isometric ---------- */
const COS = Math.cos(Math.PI / 6);
const OX = 60;
const OY = 46;
const pt = (x: number, y: number, z: number) => `${(OX + (x - y) * COS).toFixed(1)},${(OY + (x + y) * 0.5 - z).toFixed(1)}`;

function Box({ x = 0, y = 0, z = 0, w, d, h, top, left, right }: { x?: number; y?: number; z?: number; w: number; d: number; h: number; top: string; left: string; right: string }) {
  const P = (a: number, b: number, c: number) => pt(x + a, y + b, z + c);
  return (
    <g stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round">
      <polygon points={[P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)].join(' ')} fill={left} />
      <polygon points={[P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)].join(' ')} fill={right} />
      <polygon points={[P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)].join(' ')} fill={top} />
    </g>
  );
}
/** Một ô cửa trên mặt bên phải (mặt x = w). */
const door = (w: number, y1: number, y2: number, z1: number, z2: number) => [pt(w, y1, z1), pt(w, y2, z1), pt(w, y2, z2), pt(w, y1, z2)].join(' ');
/** Một ô cửa sổ trên mặt bên trái (mặt y = d). */
const win = (d: number, x1: number, x2: number, z1: number, z2: number) => [pt(x1, d, z1), pt(x2, d, z1), pt(x2, d, z2), pt(x1, d, z2)].join(' ');

function Building({ id }: { id: PlaceId }) {
  const ink = { fill: 'var(--ink)' };
  const glass = { fill: 'var(--sheet)', stroke: 'var(--ink)', strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 120 100" width="120" height="100" aria-hidden="true">
      <ellipse cx="60" cy="88" rx="46" ry="9" fill="var(--ink)" opacity=".12" />
      {id === 'tea' && (
        <>
          <Box w={40} d={40} h={30} top="var(--milk-soft)" left="var(--milk)" right="var(--milk-deep)" />
          <polygon points={door(40, 8, 20, 0, 20)} {...ink} />
          <polygon points={win(40, 8, 30, 10, 22)} {...glass} />
          <Box x={-3} y={-3} z={30} w={46} d={46} h={5} top="var(--peach)" left="var(--peach)" right="var(--peach-deep)" />
          <Box x={16} y={16} z={35} w={10} d={10} h={15} top="var(--sky)" left="var(--sky)" right="var(--sky-deep)" />
          <path d={`M${pt(22, 20, 50)} l6 -13`} stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {id === 'ride' && (
        <>
          <Box w={46} d={36} h={20} top="var(--sky-soft)" left="var(--sky)" right="var(--sky-deep)" />
          <polygon points={door(46, 6, 30, 0, 14)} {...ink} />
          <polygon points={win(36, 6, 20, 6, 15)} {...glass} />
          <polygon points={win(36, 26, 40, 6, 15)} {...glass} />
          <g transform="translate(60 14)">
            <path d="M0 26 C-13 10 -11 -6 0 -6 C11 -6 13 10 0 26 Z" fill="var(--red)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="0" cy="5" r="4" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="1.6" />
          </g>
        </>
      )}
      {id === 'bank' && (
        <>
          <Box w={40} d={40} h={36} top="var(--taro-soft)" left="var(--taro)" right="var(--taro-deep)" />
          <polygon points={door(40, 14, 26, 0, 22)} {...ink} />
          {[6, 16, 26].map((x) => (
            <polygon key={x} points={win(40, x, x + 6, 6, 28)} {...glass} />
          ))}
          <Box x={-3} y={-3} z={36} w={46} d={46} h={5} top="var(--sheet)" left="var(--sheet)" right="var(--ink-line)" />
          <g transform="translate(60 12)">
            <ellipse cx="0" cy="0" rx="12" ry="12" fill="var(--mango)" stroke="var(--ink)" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="15" fill="var(--ink)">
              đ
            </text>
          </g>
        </>
      )}
      {id === 'school' && (
        <>
          <Box w={48} d={36} h={24} top="var(--mango-soft)" left="var(--mango)" right="var(--mango-deep)" />
          <polygon points={door(48, 12, 24, 0, 16)} {...ink} />
          {[6, 20, 34].map((x) => (
            <polygon key={x} points={win(36, x, x + 8, 8, 18)} {...glass} />
          ))}
          <path d={`M${pt(24, 18, 24)} v-30`} stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
          <path d={`M${pt(24, 18, 54)} l18 5 l-18 6 z`} fill="var(--red)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** Cảnh "Phố dữ liệu": chạm vào một nơi, nơi đó ghi một row vào sổ của mình. */
export default function DataStreet() {
  const [counts, setCounts] = useState<Partial<Record<PlaceId, number>>>({});
  const [last, setLast] = useState<PlaceId | null>(null);
  const [full, setFull] = useState(false);

  const total = copy.places.reduce((n, p) => n + (counts[p.id] ?? 0), 0);
  const allTouched = copy.places.every((p) => (counts[p.id] ?? 0) > 0);
  const lastPlace = copy.places.find((p) => p.id === last);
  const caption = full ? uiApp.scenes.ledgerFull : allTouched ? copy.done : lastPlace ? lastPlace.caption : copy.hint;

  const tap = (id: PlaceId, max: number) => {
    const n = counts[id] ?? 0;
    if (n >= max) {
      play('bonk');
      setFull(true);
      return;
    }
    play('fly');
    window.setTimeout(() => play('ting'), 300);
    setFull(false);
    setCounts((c) => ({ ...c, [id]: n + 1 }));
    setLast(id);
  };

  return (
    <div className="street">
      <div className="street__top">
        <Says mood={allTouched ? 'cheer' : last ? 'happy' : 'idle'} size={56}>
          <Rich text={caption} />
        </Says>
        <span className="chip street__count">
          <b>{total}</b> {copy.counterLabel}
        </span>
      </div>
      <div className="street__places">
        {copy.places.map((p) => {
          const n = counts[p.id] ?? 0;
          return (
            <div key={p.id} className={`place place--${p.id} ${last === p.id ? 'place--last' : ''}`}>
              <button type="button" className="place__btn" onClick={() => tap(p.id, p.rows.length)}>
                <m.span key={n} className="place__art" initial={n === 0 ? false : { scaleY: 0.8, scaleX: 1.12 }} animate={{ scaleY: 1, scaleX: 1 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.6 }}>
                  <Building id={p.id} />
                </m.span>
                <span className="place__name">{p.name}</span>
                <span className="btn btn--sm place__action">{p.action}</span>
              </button>
              <div className="ledger" role="table" aria-label={p.ledger}>
                <div className="ledger__title">
                  <span className="chip">{p.ledger}</span>
                  <span className="ledger__count">{uiApp.scenes.rows(n)}</span>
                </div>
                <div className="ledger__head" role="row" style={{ gridTemplateColumns: `repeat(${p.columns.length}, minmax(0, 1fr))` }}>
                  {p.columns.map((c) => (
                    <span key={c} role="columnheader">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="ledger__rows" style={{ minHeight: p.rows.length * 30 }}>
                  <AnimatePresence initial={false}>
                    {p.rows.slice(0, n).map((r, i) => (
                      <m.div
                        key={i}
                        role="row"
                        className="ledger__row"
                        style={{ gridTemplateColumns: `repeat(${p.columns.length}, minmax(0, 1fr))` }}
                        initial={{ y: -46, opacity: 0, scale: 0.7, rotate: -5 }}
                        animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 0.55, bounce: 0.35 }}
                      >
                        {r.map((cell, j) => (
                          <span key={j} role="cell">
                            {cell}
                          </span>
                        ))}
                      </m.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
