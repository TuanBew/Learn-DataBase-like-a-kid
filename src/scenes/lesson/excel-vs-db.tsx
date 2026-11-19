import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/excel-vs-db';
import { play } from '../../sfx/sfx';
import './excel-vs-db.css';

type TabId = (typeof copy.tabs)[number]['id'];

const dots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function Side({ kind, children }: { kind: 'xl' | 'db'; children: ReactNode }) {
  const title = kind === 'xl' ? copy.excelTitle : copy.dbTitle;
  const sub = kind === 'xl' ? copy.excelSub : copy.dbSub;
  return (
    <section className={`xdb__side xdb__side--${kind}`} aria-label={title}>
      <h4 className="xdb__side-title">
        {title} <span>{sub}</span>
      </h4>
      <div className="xdb__side-body">{children}</div>
    </section>
  );
}

/* ---------- Thẻ 1: nhiều người cùng ghi ---------- */

function WriteCard() {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);
  const W = copy.write;
  const [lan, bao] = W.cashiers;

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const go = () => {
    if (run !== 0) return;
    if (reduce) {
      play('bonk');
      setRun(3);
      return;
    }
    play('fly');
    setRun(1);
    later(() => {
      play('bonk');
      window.setTimeout(() => play('ting'), 160);
      setRun(2);
    }, 650);
    later(() => setRun(3), 1250);
  };

  const redo = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    play('pop');
    setRun(0);
  };

  const say = run === 0 ? copy.start.write : run < 3 ? W.during : W.result;
  const mood: Mood = run === 0 ? 'idle' : run < 3 ? 'wow' : 'happy';
  const showLan = run === 1;
  const showBao = run >= 1;
  const dur = reduce ? 0 : 0.5;

  return (
    <div className="xdb__card">
      <p className="xdb__intro">{W.intro}</p>
      <div className="xdb__cashiers">
        {W.cashiers.map((c) => (
          <div key={c.id} className={`xdb__cashier xdb__cashier--${c.id}`}>
            <span className="xdb__avatar" aria-hidden="true">
              {c.name[0]}
            </span>
            <span className="xdb__cname">{c.name}</span>
            <span className="xdb__order">
              {c.orderId} · {c.drink}
            </span>
          </div>
        ))}
      </div>
      <div className="xdb__actions">
        <button type="button" className="btn" onClick={go} disabled={run !== 0}>
          {W.button}
        </button>
        {run === 3 && (
          <button type="button" className="xdb__reset" onClick={redo}>
            {copy.reset}
          </button>
        )}
      </div>

      <div className="xdb__cols">
        <Side kind="xl">
          <div className="xl">
            <div className="xl__letters" aria-hidden="true">
              <span />
              {W.sheetCols.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="xl__row xl__row--head">
              <span className="xl__no">1</span>
              {W.headers.map((h) => (
                <span key={h} className="xl__cell">
                  {h}
                </span>
              ))}
            </div>
            <div className="xl__row xl__row--slot">
              <span className="xl__no">{W.sheetRowNo}</span>
              <div className="xl__slot">
                <span className="xl__cell xl__cell--ghost" />
                <span className="xl__cell xl__cell--ghost" />
                <AnimatePresence>
                  {showLan && (
                    <m.div
                      key="lan"
                      className="xl__fly xl__fly--lan"
                      initial={reduce ? false : { x: -150, opacity: 0, rotate: -6 }}
                      animate={{ x: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: 90, rotate: 16, opacity: 0, transition: { duration: dur } }}
                      transition={{ duration: dur }}
                    >
                      <span>{lan.orderId}</span>
                      <span>{lan.drink}</span>
                    </m.div>
                  )}
                </AnimatePresence>
                {showBao && (
                  <m.div
                    key="bao"
                    className="xl__fly xl__fly--bao"
                    initial={reduce ? false : { x: 150, opacity: 0, rotate: 6 }}
                    animate={{ x: 0, opacity: 1, rotate: 0 }}
                    transition={{ duration: dur, delay: reduce ? 0 : 0.08 }}
                  >
                    <span>{bao.orderId}</span>
                    <span>{bao.drink}</span>
                  </m.div>
                )}
              </div>
            </div>
            <div className="xl__row">
              <span className="xl__no">{W.sheetRowNo + 1}</span>
              <span className="xl__cell xl__cell--ghost" />
              <span className="xl__cell xl__cell--ghost" />
            </div>
          </div>
          <p className="xdb__count">
            <b>{run >= 2 ? 1 : 0}</b> {W.countExcel}
          </p>
        </Side>

        <Side kind="db">
          <div className="dt">
            <div className="dt__head">
              <span className="chip dt__name">table {W.tableName}</span>
            </div>
            <div className="dt__cols">
              {W.headers.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            <div className="dt__rows">
              <AnimatePresence initial={false}>
                {[lan, bao].map((c, i) =>
                  run >= i + 1 ? (
                    <m.div
                      key={c.id}
                      className="dt__row"
                      initial={reduce ? false : { x: i === 0 ? -150 : 150, opacity: 0, scale: 0.7 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', duration: reduce ? 0 : 0.55, bounce: 0.25 }}
                    >
                      <span>{c.orderId}</span>
                      <span>{c.drink}</span>
                    </m.div>
                  ) : null,
                )}
              </AnimatePresence>
              {[0, 1].map((i) => (
                <span key={`e${i}`} className={`dt__row dt__row--ghost${run > i ? ' is-hidden' : ''}`} aria-hidden="true" />
              ))}
            </div>
          </div>
          <p className="xdb__count">
            <b>{Math.min(run, 2)}</b> {W.countDb}
          </p>
        </Side>
      </div>

      <Says mood={mood} size={54} className="xdb__say">
        <Rich text={say} />
      </Says>
    </div>
  );
}

/* ---------- Thẻ 2: luật giữ dữ liệu đúng ---------- */

type RuleValue = (typeof copy.rules.values)[number];

interface Reject {
  n: number;
  label: string;
  reason: string;
}

function RulesCard() {
  const reduce = useReducedMotion();
  const R = copy.rules;
  const [xl, setXl] = useState<RuleValue | null>(null);
  const [db, setDb] = useState<RuleValue | null>(null);
  const [reject, setReject] = useState<Reject | null>(null);
  const [lastId, setLastId] = useState<RuleValue['id'] | null>(null);
  const [tries, setTries] = useState(0);

  const write = (v: RuleValue) => {
    setXl(v);
    setLastId(v.id);
    setTries((t) => t + 1);
    const bad = v.num === null ? R.reasonText : v.num <= 0 ? R.reasonSign : null;
    if (bad) {
      play('bonk');
      setReject({ n: tries + 1, label: v.label, reason: bad });
    } else {
      play('ting');
      setDb(v);
      setReject(null);
    }
  };

  const redo = () => {
    play('pop');
    setXl(null);
    setDb(null);
    setReject(null);
    setLastId(null);
  };

  const total = xl === null ? null : xl.num === null ? R.error : dots(xl.num * 2);
  const say = lastId === null ? copy.start.rules : R.say[lastId];
  const mood: Mood = lastId === null ? 'idle' : lastId === 'ok' ? 'happy' : 'think';

  return (
    <div className="xdb__card">
      <p className="xdb__intro">{R.intro}</p>
      <div className="xdb__pick" role="group" aria-label={R.pickLabel}>
        <span className="xdb__pick-label">{R.pickLabel}</span>
        {R.values.map((v) => (
          <button key={v.id} type="button" className="btn btn--sm btn--paper xdb__val" onClick={() => write(v)}>
            {v.label}
          </button>
        ))}
        {lastId !== null && (
          <button type="button" className="xdb__reset" onClick={redo}>
            {copy.reset}
          </button>
        )}
      </div>

      <div className="xdb__cols">
        <Side kind="xl">
          <div className="xl">
            <div className="xl__letters" aria-hidden="true">
              <span />
              <span>A</span>
              <span>B</span>
            </div>
            <div className="xl__row xl__row--head">
              <span className="xl__no">1</span>
              <span className="xl__cell">{R.itemHead}</span>
              <span className="xl__cell">{R.priceHead}</span>
            </div>
            <div className="xl__row">
              <span className="xl__no">2</span>
              <span className="xl__cell xl__cell--soft">{R.item}</span>
              <span className={`xl__cell xl__cell--num${xl === null ? ' xl__cell--ghost' : ''}`}>
                {xl === null ? '' : xl.label}
              </span>
            </div>
            <div className="xl__row">
              <span className="xl__no">3</span>
              <span className="xl__cell xl__cell--soft">{R.totalHead}</span>
              <span
                className={`xl__cell xl__cell--num${total === R.error ? ' xl__cell--err' : ''}${total === null ? ' xl__cell--ghost' : ''}`}
                aria-live="polite"
              >
                {total ?? ''}
              </span>
            </div>
          </div>
          <p className="xdb__count">{R.totalFormula}</p>
        </Side>

        <Side kind="db">
          <div className="dt">
            <div className="dt__head">
              <span className="chip dt__name">table products</span>
            </div>
            <div className="dt__cols dt__cols--rules">
              <span>name</span>
              <span>
                {R.columnName} <i className="dt__type">INT</i>
              </span>
            </div>
            <div className="dt__rows">
              <div className="dt__row dt__row--rules">
                <span>{R.item}</span>
                <m.span
                  key={reject?.n ?? 'ok'}
                  className={`dt__val${reject ? ' dt__val--bad' : ''}`}
                  animate={reject && !reduce ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {db === null ? <em>{R.empty}</em> : db.label}
                </m.span>
              </div>
            </div>
            <AnimatePresence>
              {reject && (
                <m.p
                  key={reject.n}
                  className="dt__reject"
                  role="status"
                  initial={reduce ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <b>{R.rejected}</b> <code>{reject.label}</code>
                  <span>{reject.reason}</span>
                </m.p>
              )}
            </AnimatePresence>
          </div>
        </Side>
      </div>

      <Says mood={mood} size={54} className="xdb__say">
        <Rich text={say} />
      </Says>
    </div>
  );
}

/* ---------- Thẻ 3: dữ liệu rất lớn ---------- */

const S = copy.size;
const LOG_MIN = Math.log10(S.min);
const LOG_SPAN = Math.log10(S.max) - LOG_MIN;
const LIMIT_AT = ((Math.log10(S.limit) - LOG_MIN) / LOG_SPAN) * 100;

function rowsAt(v: number): number {
  const raw = Math.pow(10, LOG_MIN + (v / 400) * LOG_SPAN);
  const step = raw < 1e4 ? 10 : raw < 1e5 ? 100 : 1000;
  return Math.min(S.max, Math.round(raw / step) * step);
}

function levelOf(rows: number): 'small' | 'near' | 'over' | 'huge' {
  if (rows > S.limit) return rows >= 5_000_000 ? 'huge' : 'over';
  return rows >= 100_000 ? 'near' : 'small';
}

function SizeCard() {
  const [v, setV] = useState(100);
  const [touched, setTouched] = useState(false);
  const lastLevel = useRef<ReturnType<typeof levelOf>>('small');
  const rows = rowsAt(v);
  const level = levelOf(rows);
  const over = rows > S.limit;
  const pos = (Math.log10(rows) - LOG_MIN) / LOG_SPAN;
  const excelPct = Math.min(pos * 100, LIMIT_AT);
  const dbPct = pos * 100;

  const onChange = (next: number) => {
    setV(next);
    setTouched(true);
    const lv = levelOf(rowsAt(next));
    if (lv !== lastLevel.current) {
      play(lv === 'over' && lastLevel.current !== 'huge' ? 'bonk' : lv === 'small' ? 'tap' : lv === 'near' ? 'pop' : 'ting');
      lastLevel.current = lv;
    }
  };

  const say = touched ? S.say[level] : copy.start.size;
  const mood: Mood = !touched ? 'idle' : level === 'small' ? 'happy' : level === 'near' ? 'think' : level === 'over' ? 'panic' : 'wow';

  return (
    <div className="xdb__card">
      <p className="xdb__intro">{S.intro}</p>
      <div className="xdb__slider">
        <div className="xdb__slider-top">
          <label htmlFor="xdb-rows">{S.sliderLabel}</label>
          <span className="chip xdb__rows">
            {S.selected} <b>{dots(rows)}</b> {S.unit}
          </span>
        </div>
        <input
          id="xdb-rows"
          type="range"
          min={0}
          max={400}
          step={1}
          value={v}
          aria-valuetext={`${dots(rows)} ${S.unit}`}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="xdb__slider-ends" aria-hidden="true">
          <span>{dots(S.min)}</span>
          <span>{dots(S.max)}</span>
        </div>
      </div>

      <div className="xdb__bars">
        <div className="xbar xbar--xl">
          <span className="xbar__name">{S.barExcel}</span>
          <div className={`xbar__track${over ? ' is-full' : ''}`}>
            <span className="xbar__fill" style={{ width: `${excelPct}%` }} />
            <span className="xbar__limit" style={{ left: `${LIMIT_AT}%` }} aria-hidden="true" />
            {over && <span className="xbar__flag">{S.full}</span>}
          </div>
          <span className="xbar__note">{over ? S.full : S.accepts}</span>
        </div>
        <div className="xbar xbar--db">
          <span className="xbar__name">{S.barDb}</span>
          <div className="xbar__track">
            <span className="xbar__fill" style={{ width: `${dbPct}%` }} />
            <span className="xbar__limit" style={{ left: `${LIMIT_AT}%` }} aria-hidden="true" />
          </div>
          <span className="xbar__note">{S.dbOk}</span>
        </div>
        <p className="xbar__axis">
          <span style={{ left: `${LIMIT_AT}%` }}>{S.limitLabel}</span>
        </p>
        <p className="xdb__scale">{S.scaleNote}</p>
      </div>

      <Says mood={mood} size={54} className="xdb__say">
        <Rich text={say} />
      </Says>
    </div>
  );
}

/** Cảnh "Excel và database": ba thí nghiệm đặt Excel cạnh database. */
export default function ExcelVsDb() {
  const [tab, setTab] = useState<TabId>('write');

  return (
    <div className="xdb">
      <div className="xdb__tabs" role="group" aria-label={copy.tabsLabel}>
        {copy.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="btn btn--sm btn--paper xdb__tab"
            aria-pressed={tab === t.id}
            onClick={() => {
              if (tab !== t.id) {
                play('tap');
                setTab(t.id);
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'write' && <WriteCard />}
      {tab === 'rules' && <RulesCard />}
      {tab === 'size' && <SizeCard />}
      <p className="xdb__fair">{copy.fair}</p>
    </div>
  );
}
