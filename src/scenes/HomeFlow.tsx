import { useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says } from '../components/Mascot';
import { Icon } from '../components/Icon';
import { homeFlow } from '../content/home';
import { play } from '../sfx/sfx';
import './home-flow.css';

type App = (typeof homeFlow.apps)[number];
type Pt = { x: number; y: number };
interface Flight {
  id: number;
  app: App;
  /** Row thứ mấy của ứng dụng này. */
  n: number;
  /** Đường đi: ứng dụng, mép trên server, mép dưới server, database. */
  pts: [Pt, Pt, Pt, Pt];
  back: boolean;
}
interface SavedRow {
  key: number;
  table: string;
  tone: string;
  cells: readonly string[];
}

const L = homeFlow.labels;

const ICONS: Record<App['id'], React.ReactNode> = {
  shop: (
    <>
      <path d="M7 11h18l-2 16a2 2 0 0 1-2 1.7H11a2 2 0 0 1-2-1.7z" fill="#fff" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 12V9a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  ride: (
    <>
      <path d="M16 29C8 19 7 6 16 6s8 13 0 23z" fill="#fff" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="16" cy="13.5" r="3.2" fill="currentColor" />
    </>
  ),
  bank: (
    <>
      <path d="M5 13l11-7 11 7z" fill="#fff" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M8.5 14v10M16 14v10M23.5 14v10M5 27h22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  school: (
    <>
      <path d="M4 13l12-6 12 6-12 6z" fill="#fff" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M9 17v6c4 3.5 10 3.5 14 0v-6M28 13v8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

/**
 * Cảnh đầu trang chủ: chạm vào một ứng dụng, dữ liệu chạy qua server vào database
 * rồi thành một row. Database đứng sau mọi ứng dụng quanh ta.
 */
export function HomeFlow() {
  const reduced = useReducedMotion() ?? false;
  const track = useRef<HTMLDivElement>(null);
  const appRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const serverRef = useRef<HTMLDivElement>(null);
  const dbRef = useRef<HTMLDivElement>(null);

  const [flights, setFlights] = useState<Flight[]>([]);
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [requests, setRequests] = useState(0);
  const [used, setUsed] = useState<Partial<Record<App['id'], number>>>({});
  const [saved, setSaved] = useState<Partial<Record<App['id'], number>>>({});
  const [last, setLast] = useState<App | null>(null);
  const [pulse, setPulse] = useState({ server: 0, db: 0 });
  const nextId = useRef(1);

  const store = (app: App, n: number) => {
    play('ting');
    setRows((r) => [{ key: nextId.current++, table: app.table, tone: app.tone, cells: app.rows[n % app.rows.length] }, ...r].slice(0, 3));
    setPulse((p) => ({ ...p, db: p.db + 1 }));
    setLast(app);
  };

  const send = (app: App) => {
    const n = used[app.id] ?? 0;
    setUsed((u) => ({ ...u, [app.id]: n + 1 }));
    setRequests((r) => r + 1);
    play('tap');
    const t = track.current?.getBoundingClientRect();
    const a = appRefs.current[app.id]?.getBoundingClientRect();
    const s = serverRef.current?.getBoundingClientRect();
    const d = dbRef.current?.getBoundingClientRect();
    if (reduced || !t || !a || !s || !d) {
      store(app, n);
      setSaved((v) => ({ ...v, [app.id]: (v[app.id] ?? 0) + 1 }));
      return;
    }
    window.setTimeout(() => play('fly'), 60);
    const mid = (r: DOMRect) => r.left + r.width / 2 - t.left;
    const pts: Flight['pts'] = [
      { x: mid(a), y: a.top - t.top + 62 },
      { x: mid(s), y: s.top - t.top },
      { x: mid(s), y: s.bottom - t.top },
      { x: mid(d), y: d.top - t.top + 6 },
    ];
    setFlights((f) => [...f, { id: nextId.current++, app, n, pts, back: false }]);
    window.setTimeout(() => setPulse((p) => ({ ...p, server: p.server + 1 })), 480);
  };

  const arrived = (f: Flight) => {
    if (!f.back) {
      store(f.app, f.n);
      setFlights((all) => all.map((x) => (x.id === f.id ? { ...x, back: true } : x)));
    } else {
      play('pop');
      setSaved((v) => ({ ...v, [f.app.id]: (v[f.app.id] ?? 0) + 1 }));
      setFlights((all) => all.filter((x) => x.id !== f.id));
    }
  };

  const total = Object.values(saved).reduce((a, b) => a + (b ?? 0), 0);
  const allUsed = homeFlow.apps.every((a) => (saved[a.id] ?? 0) > 0);
  const caption = allUsed ? homeFlow.say.all : last ? last.say : homeFlow.say.start;

  return (
    <div className="flow sheet">
      <div className="flow__chips">
        <span className="chip">
          <b>{homeFlow.apps.length}</b> {L.apps}
        </span>
        <span className="chip">
          <b>{requests}</b> {L.requests}
        </span>
        <span className="chip flow__chip-rows">
          <b>{total}</b> {L.rows}
        </span>
      </div>

      <div className="flow__track" ref={track}>
        <div className="flow__apps">
          {homeFlow.apps.map((app, i) => (
            <button
              key={app.id}
              type="button"
              ref={(el) => {
                appRefs.current[app.id] = el;
              }}
              className={`flow-app flow-tone-${app.tone} ${requests === 0 && i === 0 ? 'flow-app--nudge' : ''}`}
              onClick={() => send(app)}
              aria-label={L.send(app.name)}
            >
              <span className="flow-app__icon">
                <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
                  {ICONS[app.id]}
                </svg>
                {(saved[app.id] ?? 0) > 0 && (
                  <span key={saved[app.id]} className="flow-app__ok" aria-hidden="true">
                    <Icon name="check" size={11} />
                  </span>
                )}
              </span>
              <span className="flow-app__name">{app.name}</span>
            </button>
          ))}
        </div>

        <svg className="flow__wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[12.5, 37.5, 62.5, 87.5].map((x) => (
            <path key={x} d={`M${x} 0 L50 100`} />
          ))}
        </svg>

        <div className="flow__server" ref={serverRef}>
          <div key={pulse.server} className={`flow-server ${pulse.server ? 'flow-server--pulse' : ''}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="chip">{L.server}</span>
        </div>

        <svg className="flow__wire2" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 0 L12.5 100" />
        </svg>

        <div className="flow__db">
          <div className="flow-db" ref={dbRef}>
            <svg key={pulse.db} className={pulse.db ? 'flow-db--pulse' : ''} viewBox="0 0 96 92" width="96" height="92" aria-hidden="true">
              <path d="M6 16v58a42 12 0 0 0 84 0V16z" fill="var(--taro)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
              <path d="M6 36a42 12 0 0 0 84 0M6 55a42 12 0 0 0 84 0" fill="none" stroke="var(--ink)" strokeWidth="2.4" />
              <ellipse cx="48" cy="16" rx="42" ry="12" fill="#f1eaff" stroke="var(--ink)" strokeWidth="3" />
              <circle cx="20" cy="48" r="3" fill="var(--matcha-deep)" stroke="var(--ink)" strokeWidth="1.4" />
              <circle cx="20" cy="67" r="3" fill="var(--mango)" stroke="var(--ink)" strokeWidth="1.4" />
            </svg>
            <span className="chip">{L.database}</span>
          </div>
          <div className="flow-rows" aria-live="polite">
            {rows.length === 0 && <p className="flow-rows__empty">{L.empty}</p>}
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <m.div key={r.key} layout={reduced ? false : 'position'} className="flow-row" initial={{ x: -40, opacity: 0, scale: 0.85 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}>
                  <span className={`flow-row__table flow-tone-${r.tone}`}>{r.table}</span>
                  {r.cells.map((c, i) => (
                    <span key={i} className="flow-row__cell">
                      {c}
                    </span>
                  ))}
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {flights.map((f) => {
          const p = f.back ? [...f.pts].reverse() : f.pts;
          return (
            <m.span
              key={`${f.id}${f.back ? 'b' : 'a'}`}
              className={`flow-dot ${f.back ? 'flow-dot--back' : `flow-tone-${f.app.tone}`}`}
              initial={{ x: p[0].x, y: p[0].y, scale: 0.4 }}
              animate={{ x: p.map((q) => q.x), y: p.map((q) => q.y), scale: 1 }}
              transition={{ duration: f.back ? 0.85 : 1.15, times: [0, 0.42, 0.6, 1], ease: 'easeInOut' }}
              onAnimationComplete={() => arrived(f)}
              aria-hidden="true"
            >
              {f.back && <Icon name="check" size={10} />}
            </m.span>
          );
        })}
      </div>

      <Says mood={allUsed ? 'cheer' : last ? 'happy' : 'idle'} size={58} className="flow__say">
        {caption}
      </Says>
    </div>
  );
}
