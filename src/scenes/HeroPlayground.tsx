import { useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says } from '../components/Chau';
import { Icon } from '../components/Icon';
import { heroDb, heroQuery } from '../content/hero';
import { uiApp } from '../content/ui-app';
import { run } from '../engine';
import { show } from '../engine/values';
import { play } from '../sfx/sfx';
import './hero.css';

const U = uiApp.home;
const CUP: Record<string, string> = { 'Trà sữa': 'var(--milk-deep)', 'Trà trái cây': 'var(--peach-deep)', 'Cà phê': 'var(--pearl)' };
const TOTAL = heroDb.tables[0].rows.length;

type PieceId = (typeof heroQuery.pieces)[number]['id'];

/**
 * Cảnh ở trang chủ: bật tắt từng mẩu của query, các row phản hồi ngay.
 * Kết quả do chính SQL engine tính, không dựng sẵn.
 */
export function HeroPlayground() {
  const [on, setOn] = useState<Record<PieceId, boolean>>({ where: false, order: false, limit: false });
  const [touched, setTouched] = useState(false);
  const reduced = useReducedMotion() ?? false;

  const sql = [heroQuery.base, ...heroQuery.pieces.filter((p) => on[p.id]).map((p) => p.sql)].join(' ');
  const rows = useMemo(() => {
    const r = run(sql, heroDb, 'mysql');
    return r.ok ? r.result.rows.map((cells, i) => ({ id: r.result.rowIds[i], name: String(cells[1]), category: String(cells[2]), price: cells[3] })) : [];
  }, [sql]);

  const anyOn = on.where || on.order || on.limit;
  const toggle = (id: PieceId, sfx: (typeof heroQuery.pieces)[number]['sfx']) => {
    const next = !on[id];
    setOn((s) => ({ ...s, [id]: next }));
    setTouched(true);
    play('tap');
    window.setTimeout(() => play(next ? sfx : 'pop'), 90);
  };

  return (
    <div className="hero-play sheet">
      <div className="hero-play__query" aria-label={U.heroQueryLabel}>
        <code className="hero-play__base">{heroQuery.base}</code>
        {heroQuery.pieces.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`hero-piece hero-piece--${p.tone} ${!touched && i === 0 ? 'hero-piece--nudge' : ''}`}
            aria-pressed={on[p.id]}
            onClick={() => toggle(p.id, p.sfx)}
          >
            <span className="hero-piece__pin" aria-hidden="true">
              {on[p.id] && <Icon name="check" size={12} />}
            </span>
            <code>{p.sql}</code>
          </button>
        ))}
      </div>

      <div className="hero-play__meta">
        <span className="chip hero-play__table">{U.heroTable}</span>
        <span className="chip">
          <b>{rows.length}</b> row
        </span>
        {anyOn && (
          <button
            type="button"
            className="hero-play__reset"
            onClick={() => {
              play('pop');
              setOn({ where: false, order: false, limit: false });
            }}
          >
            {U.heroReset}
          </button>
        )}
      </div>

      <div className="hero-rows" style={{ minHeight: TOTAL * 50 + (on.limit ? 22 : 0) }}>
        <AnimatePresence initial={!reduced}>
          {rows.map((r, i) => (
            <m.div
              key={r.id}
              layout={reduced ? false : 'position'}
              className="hero-row"
              initial={{ opacity: 0, y: -26, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', duration: 0.55, bounce: 0.3, delay: touched ? 0 : 0.12 + i * 0.07 } }}
              exit={{ opacity: 0, y: 70, rotate: r.id % 2 ? 7 : -7, transition: { duration: 0.42, ease: 'easeIn' } }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.25 }}
            >
              <svg className="hero-cup" viewBox="0 0 28 34" width="24" height="29" aria-hidden="true">
                <path d="M4 9h20l-2.4 21.5a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z" fill={CUP[r.category] ?? 'var(--taro-deep)'} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
                <path d="M2.5 9h23" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M17 9l3-7.5" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="10.5" cy="26" r="2" fill="var(--ink)" />
                <circle cx="15.5" cy="27.5" r="2" fill="var(--ink)" />
              </svg>
              <span className="hero-row__name">{r.name}</span>
              <span className="hero-row__price">{show(r.price)}</span>
              {on.limit && i === rows.length - 1 && <span className="hero-gate" aria-hidden="true" />}
            </m.div>
          ))}
        </AnimatePresence>
      </div>

      <Says mood={!touched ? 'idle' : anyOn ? 'happy' : 'wow'} size={54} className="hero-play__say">
        {!touched ? U.heroSay : anyOn ? U.heroSayDone(rows.length) : U.heroSayAll}
      </Says>
    </div>
  );
}
