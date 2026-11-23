import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import type { ClauseKind } from '../engine/ast';
import type { Trace, TraceClause } from '../engine/trace';
import { Mascot, type Mood } from '../components/Mascot';
import { Icon } from '../components/Icon';
import { play } from '../sfx/sfx';
import { theaterCopy as T } from './copy.vi';
import { type Frame, type Phase, buildFrames, firstFrameOf, screensOf } from './frames';
import { Stage } from './Stage';
import './theater.css';

const MOOD: Record<Phase, Mood> = { written: 'idle', run: 'wow', from: 'happy', setop: 'happy', where: 'think', group: 'wow', having: 'think', window: 'wow', select: 'idle', order: 'think', limit: 'idle', stash: 'happy', done: 'cheer' };
const SPEEDS = [0.5, 1, 2];

const TONE: Record<ClauseKind, string> = {
  FROM: 'sky',
  WHERE: 'mango',
  'GROUP BY': 'milk',
  HAVING: 'peach',
  SELECT: 'taro',
  'ORDER BY': 'matcha',
  LIMIT: 'peach',
  FETCH: 'peach',
};

interface Props {
  trace: Trace;
  /** Tự phát khi mở. Mặc định là có. */
  autoPlay?: boolean;
  /** Gọi một lần khi Theater tới khung hình cuối. */
  onEnd?: () => void;
}

/** Query Theater: diễn lại một query từng bước, dựng hoàn toàn từ trace của engine. */
export function Theater({ trace, autoPlay = true, onEnd }: Props) {
  const frames = useMemo(() => buildFrames(trace), [trace]);
  const screens = useMemo(() => screensOf(trace), [trace]);
  const reduced = useReducedMotion() ?? false;
  /* Subquery phụ thuộc query ngoài chạy lại cho từng row: Theater chỉ diễn query bên ngoài. */
  const partial = screens.some((sc) => sc.trace.partial === true);
  const last = frames.length - 1;

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(autoPlay && !reduced);
  const [speed, setSpeed] = useState(1);
  const frame: Frame = frames[Math.min(i, last)];
  const focus = useMemo(() => new Set(frame.focus), [frame.focus]);

  /* Đo chiều ngang của sân khấu. */
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Âm thanh của từng khung hình. */
  const speedRef = useRef(speed);
  speedRef.current = speed;
  useEffect(() => {
    const timers = frame.sfx.map((s) => window.setTimeout(() => play(s.name), ((s.at ?? 0) * 1000) / speedRef.current));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [frame]);

  /* Tự chuyển khung hình khi đang phát. */
  useEffect(() => {
    if (!playing) return;
    if (i >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setI((x) => Math.min(last, x + 1)), frame.hold / speed);
    return () => window.clearTimeout(t);
  }, [playing, i, last, speed, frame.hold]);

  const ended = useRef(false);
  useEffect(() => {
    if (i >= last && !ended.current) {
      ended.current = true;
      onEnd?.();
    }
  }, [i, last, onEnd]);

  const go = useCallback(
    (n: number) => {
      setPlaying(false);
      setI(Math.max(0, Math.min(last, n)));
    },
    [last],
  );
  const toggle = () => {
    play('tap');
    if (i >= last) {
      setI(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };
  const replay = () => {
    play('tap');
    setI(0);
    setPlaying(!reduced);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLButtonElement && (e.key === ' ' || e.key === 'Enter')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(i - 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const ordered = useMemo(() => [...frame.clauses].sort((a, b) => (frame.rail === 'written' ? a.written - b.written : a.run - b.run)), [frame.clauses, frame.rail]);
  const liveRows = frame.count;
  const sideFrame: Frame | null = frame.side
    ? { ...frame, cols: frame.side.cols, rows: frame.side.rows, count: frame.side.rows.length, more: frame.side.more > 0 ? { count: frame.side.more, text: T.more(frame.side.more) } : null, boxes: [], gate: null, scan: null, side: null }
    : null;
  const liveCols = frame.cols.filter((c) => c.state !== 'dim').length;

  /* Trên màn hình hẹp, clause đang chạy luôn nằm trong tầm nhìn. */
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>('[data-active="true"]');
    if (rail && el && !frame.big) rail.scrollTo({ left: el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [frame.active, frame.big, reduced]);

  return (
    <section className={`qt sheet ${frame.big ? 'qt--intro' : ''}`} aria-label={T.stage} onKeyDown={onKey}>
      {screens.length > 1 && (
        <ol className="qt-screens" aria-label={T.screens}>
          {screens.map((sc, n) => {
            const state = n < frame.screen.index ? 'done' : n === frame.screen.index ? 'active' : 'todo';
            return (
              <li key={n} className={`qt-screen qt-screen--${state}`} aria-current={state === 'active' ? 'step' : undefined} aria-label={T.screenChip(n + 1, screens.length)}>
                <span className="qt-screen__n" aria-hidden="true">
                  {state === 'done' ? <Icon name="check" size={12} /> : n + 1}
                </span>
                <span className="qt-screen__name">{sc.kind === 'main' ? T.screenMain : sc.name || T.noName}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={railRef} className={`qt-rail ${frame.big ? 'qt-rail--big' : ''} qt-rail--${frame.rail}`}>
        {ordered.map((c) => (
          <ClauseChip key={`${frame.screen.index}-${c.written}`} c={c} frame={frame} reduced={reduced} speed={speed} onJump={() => go(firstFrameOf(frames, c.run, frame.screen.index))} />
        ))}
      </div>

      <div className="qt-body">
        <div className="qt-side">
          <div className="qt-say">
            <Mascot mood={MOOD[frame.phase]} size={58} />
            <p className="qt-caption" aria-live="polite">
              {frame.caption}
            </p>
          </div>
          <div className="qt-counts">
            <span className="chip">
              <b>{liveRows}</b> {T.rowUnit}
            </span>
            <span className="chip">
              <b>{liveCols}</b> {T.colUnit}
            </span>
          </div>
          {reduced && <p className="qt-reduced">{T.reducedNote}</p>}
          {partial && <p className="qt-partial">{T.partialNote}</p>}
        </div>

        <div className="qt-floor">
          <div className="qt-stagewrap" ref={stageRef}>
            {frame.stash && (
              <p className="qt-stash">
                <span className="chip">{T.stashTable(frame.stash)}</span>
              </p>
            )}
            {width > 0 && <Stage frame={frame} width={width} focus={focus} speed={speed} reduced={reduced} emptyText={T.empty} />}
            {width > 0 && sideFrame && frame.side && (
              <div className="qt-sidetable">
                <span className="chip qt-sidetable__name">{frame.side.title}</span>
                <Stage frame={sideFrame} width={width} focus={focus} speed={speed} reduced={reduced} emptyText={T.empty} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="qt-bar">
        <div className="qt-progress" role="progressbar" aria-label={T.step(i + 1, frames.length)} aria-valuemin={1} aria-valuemax={frames.length} aria-valuenow={i + 1}>
          <span style={{ transform: `scaleX(${last === 0 ? 1 : i / last})` }} />
        </div>
        <div className="qt-controls">
          <button type="button" className="btn btn--sm btn--paper btn--icon" onClick={replay} aria-label={T.controls.replay} title={T.controls.replay}>
            <Icon name="replay" />
          </button>
          <button type="button" className="btn btn--sm btn--paper btn--icon" onClick={() => { play('tap'); go(i - 1); }} disabled={i === 0} aria-label={T.controls.back} title={T.controls.back}>
            <Icon name="back" />
          </button>
          <button type="button" className="btn btn--sm qt-playbtn" onClick={toggle}>
            <Icon name={playing ? 'pause' : 'play'} />
            {playing ? T.controls.pause : T.controls.play}
          </button>
          <button type="button" className="btn btn--sm btn--paper btn--icon" onClick={() => { play('tap'); go(i + 1); }} disabled={i >= last} aria-label={T.controls.next} title={T.controls.next}>
            <Icon name="next" />
          </button>
          <div className="qt-speed" role="group" aria-label={T.controls.speed}>
            {SPEEDS.map((s) => (
              <button key={s} type="button" className="qt-speed__opt" aria-pressed={speed === s} onClick={() => { play('tap'); setSpeed(s); }}>
                {s}x
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--sm btn--paper qt-skip" onClick={() => { play('tap'); go(last); }} disabled={i >= last}>
            <Icon name="skip" size={18} />
            {T.controls.skip}
          </button>
        </div>
      </div>
    </section>
  );
}

function ClauseChip({ c, frame, reduced, speed, onJump }: { c: TraceClause; frame: Frame; reduced: boolean; speed: number; onJump: () => void }) {
  const kwLen = c.kind === 'FETCH' ? (/^(OFFSET|FETCH\s+(FIRST|NEXT))/i.exec(c.text)?.[0].length ?? 5) : c.kind.length;
  const state = frame.big ? 'idle' : frame.active === c.run ? 'active' : c.run < frame.done ? 'done' : 'todo';
  return (
    <m.button
      type="button"
      layout={reduced ? false : 'position'}
      transition={{ type: 'spring', duration: 0.9 / speed, bounce: 0.22, delay: frame.big && frame.rail === 'run' ? c.run * 0.07 : 0 }}
      className={`qt-clause qt-clause--${state} qt-tone-${TONE[c.kind]}`}
      data-active={state === 'active'}
      onClick={onJump}
      disabled={frame.big}
      aria-label={T.jump(c.text)}
      aria-current={state === 'active' ? 'step' : undefined}
    >
      <span className="qt-clause__num" aria-hidden="true">
        {state === 'done' ? <Icon name="check" size={13} /> : c.run + 1}
      </span>
      <code>
        <b>{c.text.slice(0, kwLen)}</b>
        <span className="qt-clause__rest">{c.text.slice(kwLen)}</span>
      </code>
    </m.button>
  );
}
