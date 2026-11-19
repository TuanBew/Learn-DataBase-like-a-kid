import { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { type BoxValue, type Truth, copy } from '../../content/scenes/null-box';
import { play } from '../../sfx/sfx';
import '../kit.css';
import './null-box.css';

type Mode = 'eq' | 'isnull';
interface Asked {
  mode: Mode;
  truth: Truth;
  /** Tăng sau mỗi lần hỏi, để thẻ kết quả lật lại. */
  n: number;
}

/** Một hộp quà. Hộp NULL có nét đứt và dấu hỏi. */
function Gift({ value, dim }: { value: BoxValue; dim?: boolean }) {
  const empty = value === null;
  const fill = empty ? 'var(--sheet)' : value === 0 ? 'var(--sky)' : 'var(--matcha)';
  return (
    <svg className={`nbx-gift ${empty ? 'is-null' : ''} ${dim ? 'is-dim' : ''}`} viewBox="0 0 110 104" aria-hidden="true">
      <rect x="13" y="40" width="84" height="56" rx="6" fill={fill} stroke="var(--ink)" strokeWidth="3" strokeDasharray={empty ? '7 6' : undefined} />
      <rect x="7" y="26" width="96" height="18" rx="5" fill={fill} stroke="var(--ink)" strokeWidth="3" strokeDasharray={empty ? '7 6' : undefined} />
      {!empty && (
        <>
          <path d="M55 26v70" stroke="var(--red)" strokeWidth="7" />
          <path d="M55 26c-8-16-26-14-22-4 3 7 14 6 22 4zM55 26c8-16 26-14 22-4-3 7-14 6-22 4z" fill="var(--red)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
      <circle cx="55" cy="68" r="17" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="2.5" />
      <text x="55" y="76" textAnchor="middle" className="nbx-gift__text">
        {empty ? '?' : value}
      </text>
    </svg>
  );
}

/** Cảnh "Hộp quà rỗng": so sánh với NULL không ra TRUE cũng không ra FALSE. Muốn hỏi thì dùng IS NULL. */
export default function NullBox() {
  const reduce = useReducedMotion();
  const [left, setLeft] = useState<BoxValue>(null);
  const [right, setRight] = useState<BoxValue>(null);
  const [asked, setAsked] = useState<Asked | null>(null);
  const [touched, setTouched] = useState(false);

  const change = (side: 'left' | 'right', v: BoxValue) => {
    play('tap');
    if (side === 'left') setLeft(v);
    else setRight(v);
    setAsked(null);
    setTouched(true);
  };

  const ask = (mode: Mode) => {
    let truth: Truth;
    if (mode === 'isnull') truth = left === null ? 'TRUE' : 'FALSE';
    else truth = left === null || right === null ? 'NULL' : left === right ? 'TRUE' : 'FALSE';
    play('whoosh');
    window.setTimeout(() => play(truth === 'TRUE' ? 'ok' : truth === 'FALSE' ? 'tick' : 'bonk'), reduce ? 0 : 380);
    setAsked({ mode, truth, n: (asked?.n ?? 0) + 1 });
    setTouched(true);
  };

  const reset = () => {
    play('pop');
    setLeft(null);
    setRight(null);
    setAsked(null);
    setTouched(false);
  };

  let say = touched ? copy.says.changed : copy.says.start;
  let mood: Mood = 'idle';
  if (asked?.mode === 'eq') {
    if (asked.truth === 'TRUE') {
      say = copy.says.eqTrue(left);
      mood = 'happy';
    } else if (asked.truth === 'FALSE') {
      say = copy.says.eqFalse(left, right);
      mood = 'think';
    } else if (left === null && right === null) {
      say = copy.says.eqBothNull;
      mood = 'wow';
    } else {
      say = copy.says.eqOneNull;
      mood = 'think';
    }
  } else if (asked?.mode === 'isnull') {
    say = asked.truth === 'TRUE' ? copy.says.isNullTrue : copy.says.isNullFalse(left);
    mood = asked.truth === 'TRUE' ? 'happy' : 'think';
  }

  const mode: Mode = asked?.mode ?? 'eq';
  const expr = mode === 'isnull' ? copy.exprIsNull(left) : copy.exprEq(left, right);
  const surprise = asked?.mode === 'eq' && left === null && right === null;

  const picks = (side: 'left' | 'right', value: BoxValue, label: string) => (
    <div className="sk-picks nbx__picks" role="radiogroup" aria-label={label}>
      {copy.values.map((v) => (
        <button key={String(v)} type="button" role="radio" aria-checked={value === v} className="sk-pick sk-pick--mono" onClick={() => change(side, v)}>
          {copy.text(v)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="sk nbx">
      <div className="sk-stage nbx__stage">
        <div className="nbx__side">
          <span className="sk-label">{copy.leftLabel}</span>
          <Gift value={left} />
          {picks('left', left, copy.leftLabel)}
        </div>

        <div className="nbx__mid" aria-live="polite">
          <code className="nbx__expr">{expr}</code>
          <div key={asked?.n ?? 0} className={`nbx-card ${asked ? 'is-open' : ''} ${surprise ? 'is-surprise' : ''} ${reduce ? 'is-still' : ''}`}>
            <span className="nbx-card__face nbx-card__front">{copy.hidden}</span>
            <span className={`nbx-card__face nbx-card__back nbx-card__back--${(asked?.truth ?? 'NULL').toLowerCase()}`}>
              <b>{asked?.truth}</b>
              {asked?.truth === 'NULL' && <small>{copy.unknown}</small>}
            </span>
          </div>
          <span className="sk-label">{copy.resultLabel}</span>
        </div>

        <div className="nbx__side">
          <span className="sk-label">{copy.rightLabel}</span>
          <Gift value={right} dim={mode === 'isnull' && asked !== null} />
          {picks('right', right, copy.rightLabel)}
        </div>
      </div>

      <div className="sk-bar">
        <button type="button" className="btn nbx__eq" onClick={() => ask('eq')}>
          {copy.compare}
        </button>
        <button type="button" className="btn nbx__is" onClick={() => ask('isnull')}>
          {copy.isNull}
        </button>
        <button type="button" className="btn btn--sm btn--paper sk-bar__end" onClick={reset} disabled={!touched}>
          {copy.reset}
        </button>
      </div>

      <Says mood={mood} size={56} className="sk-say">
        <Rich text={say} />
      </Says>
    </div>
  );
}
