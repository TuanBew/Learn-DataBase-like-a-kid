import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Icon } from '../../components/Icon';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/index-race';
import { niceNumber } from '../../engine/values';
import { play } from '../../sfx/sfx';
import './index-race.css';

const T = copy.targetAt;
/** Thời gian chạy của scan theo cỡ table, tính bằng ms. Con số trên màn hình mới là số thật. */
const SCAN_MS: Record<number, number> = { 100: 1700, 10000: 3400, 1000000: 5600 };
const STEP_MS = 150;

const stepsOf = (n: number) => Math.ceil(Math.log2(n));
const scanCountOf = (n: number) => Math.round(n * T);

/** Khoảng còn lại của index sau `k` lần so: mỗi lần bỏ đi nửa không chứa row cần tìm. */
function rangeAfter(k: number): [number, number] {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < k; i++) {
    const mid = (lo + hi) / 2;
    if (T < mid) hi = mid;
    else lo = mid;
  }
  return [lo, hi];
}

type Phase = 'idle' | 'running' | 'done';

/** Cảnh "Cuộc đua tìm row": scan đọc từng row, index mỗi lần bỏ đi một nửa. */
export default function IndexRace() {
  const reduce = useReducedMotion();
  const [size, setSize] = useState(copy.sizes[0]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [scan, setScan] = useState(0);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const steps = stepsOf(size);
  const scanCount = scanCountOf(size);

  const stop = () => cancelAnimationFrame(raf.current);

  const run = () => {
    stop();
    play('tap');
    if (reduce) {
      setScan(1);
      setStep(steps);
      setPhase('done');
      play('ting');
      return;
    }
    setScan(0);
    setStep(0);
    setPhase('running');
    const t0 = performance.now();
    const total = SCAN_MS[size] ?? 3000;
    let lastStep = 0;
    const tick = (now: number) => {
      const dt = now - t0;
      const s = Math.min(1, dt / total);
      const k = Math.min(steps, Math.floor(dt / STEP_MS));
      setScan(s);
      if (k !== lastStep) {
        lastStep = k;
        setStep(k);
        play(k === steps ? 'ok' : 'tick');
      }
      if (s < 1) raf.current = requestAnimationFrame(tick);
      else {
        setPhase('done');
        play('ting');
      }
    };
    raf.current = requestAnimationFrame(tick);
  };

  const pick = (n: number) => {
    stop();
    play('tap');
    setSize(n);
    setPhase('idle');
    setScan(0);
    setStep(0);
    setTouched(true);
  };

  const reset = () => {
    stop();
    play('pop');
    setSize(copy.sizes[0]);
    setPhase('idle');
    setScan(0);
    setStep(0);
    setTouched(false);
  };

  const [lo, hi] = rangeAfter(step);
  const indexDone = step >= steps && phase !== 'idle';
  const scanDone = scan >= 1;
  const nSize = niceNumber(size);
  const nScan = niceNumber(scanCount);

  let say = touched ? copy.says.picked(nSize) : copy.says.start;
  let mood: Mood = 'idle';
  if (phase === 'running') {
    say = copy.says.running;
    mood = 'think';
  } else if (phase === 'done') {
    say = size === copy.sizes[0] ? copy.says.small(nScan, String(steps)) : size === copy.sizes[1] ? copy.says.big(nSize, nScan, String(steps)) : copy.says.huge(nSize, nScan, String(steps));
    mood = size === copy.sizes[0] ? 'happy' : 'wow';
  }

  return (
    <div className="sk idx">
      <div className="idx__top">
        <div className="idx__group">
          <span className="sk-label" id="idx-size">
            {copy.sizeLabel}
          </span>
          <div className="sk-picks" role="radiogroup" aria-labelledby="idx-size">
            {copy.sizes.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={size === n} className="sk-pick sk-pick--mono" onClick={() => pick(n)}>
                {niceNumber(n)}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn idx__run" onClick={run} disabled={phase === 'running'}>
          {copy.run}
        </button>
      </div>

      <div className="sk-stage idx__stage">
        {/* Làn scan */}
        <div className="idx-lane">
          <div className="idx-lane__head">
            <svg className="idx-lane__art" viewBox="0 0 44 36" aria-hidden="true">
              <path d="M22 8C17 4 9 4 4 6v24c5-2 13-2 18 2 5-4 13-4 18-2V6c-5-2-13-2-18 2z" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
              <path d="M22 8v24M9 13h8M9 19h8M27 13h8M27 19h8" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="idx-lane__name">
              <b>{copy.scan.name}</b> {copy.scan.how}
            </span>
            {scanDone && phase !== 'idle' && (
              <span className="chip idx-lane__flag">
                <Icon name="check" size={13} />
                {copy.finished}
              </span>
            )}
          </div>
          <div className="idx-track">
            <span className="idx-track__read" style={{ width: `${scan * T * 100}%` }} />
            <span className="idx-track__target" style={{ left: `${T * 100}%` }} />
            <span className="idx-track__runner" style={{ left: `${scan * T * 100}%` }} />
          </div>
          <span className="idx-lane__count">{copy.scan.count(niceNumber(Math.round(scan * scanCount)))}</span>
        </div>

        {/* Làn index */}
        <div className="idx-lane">
          <div className="idx-lane__head">
            <svg className="idx-lane__art" viewBox="0 0 44 36" aria-hidden="true">
              <rect x="5" y="3" width="34" height="30" rx="5" fill="var(--mango)" stroke="var(--ink)" strokeWidth="3" />
              <path d="M11 11h6M11 18h6M11 25h6M23 11h10M23 18h10M23 25h10" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="idx-lane__name">
              <b>{copy.index.name}</b> {copy.index.how}
            </span>
            {indexDone && (
              <span className="chip idx-lane__flag">
                <Icon name="check" size={13} />
                {copy.finished}
              </span>
            )}
          </div>
          <div className="idx-track">
            <span className="idx-track__range" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
            <span className="idx-track__target" style={{ left: `${T * 100}%` }} />
            {phase !== 'idle' && <span className={`idx-track__runner idx-track__runner--hop ${indexDone ? 'is-done' : ''}`} style={{ left: `${(indexDone ? T : (lo + hi) / 2) * 100}%` }} />}
          </div>
          <span className="idx-lane__count">{copy.index.count(String(step))}</span>
        </div>

        <span className="idx__target">
          <i aria-hidden="true" />
          {copy.target}
        </span>
      </div>

      <div className="sk-bar idx__foot">
        <Says mood={mood} size={56} className="sk-say">
          <Rich text={say} />
        </Says>
        <button type="button" className="btn btn--sm btn--paper sk-bar__end" onClick={reset} disabled={!touched && phase === 'idle'}>
          {copy.reset}
        </button>
      </div>
    </div>
  );
}
