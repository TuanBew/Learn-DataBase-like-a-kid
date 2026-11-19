import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { Icon } from '../../components/Icon';
import { Mascot, Says } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy, type CsNode } from '../../content/scenes/client-server';
import { play } from '../../sfx/sfx';
import '../kit.css';
import './client-server.css';

const X: Record<CsNode, string> = { client: '16.667%', server: '50%', database: '83.333%' };
const TOTAL = copy.steps.length;

/** Cảnh "Yêu cầu đi đâu": một yêu cầu đi từ client tới server, tới database, rồi quay về. */
export default function ClientServer() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [arrived, setArrived] = useState(true);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const cur = step > 0 ? copy.steps[step - 1] : null;
  const done = step === TOTAL;

  const next = () => {
    if (done || !arrived) return;
    const n = step + 1;
    setStep(n);
    if (reduce) {
      play(n === TOTAL ? 'ting' : 'pop');
      return;
    }
    play('fly');
    setArrived(false);
    timer.current = window.setTimeout(() => {
      setArrived(true);
      play(n === TOTAL ? 'ting' : 'pop');
    }, 620);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    play('pop');
    setStep(0);
    setArrived(true);
  };

  const lit = (id: CsNode) => (cur ? arrived && cur.to === id : id === 'client');
  const showMenu = done && arrived;

  return (
    <div className="sk cs">
      <div className="sk-stage cs__stage">
        <div className="cs__wire cs__wire--a" aria-hidden="true">
          <span>{copy.wire}</span>
        </div>
        <div className="cs__wire cs__wire--b" aria-hidden="true" />

        <div className="cs__nodes">
          <div className={`cs-node ${lit('client') ? 'is-lit' : ''}`}>
            <div className="cs-phone">
              <span className="cs-phone__notch" aria-hidden="true" />
              <span className="cs-phone__title">{copy.appTitle}</span>
              {showMenu ? (
                <ul className="cs-phone__menu">
                  {copy.menu.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                  <li className="cs-phone__more">{copy.menuMore}</li>
                </ul>
              ) : (
                <>
                  <span className="cs-phone__btn">{copy.appButton}</span>
                  {step > 0 && (
                    <span className="cs-phone__wait">
                      {copy.appWaiting}
                      <i aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`cs-node ${lit('server') ? 'is-lit' : ''}`}>
            <svg className="cs-art" viewBox="0 0 84 96" aria-hidden="true">
              <rect x="10" y="6" width="64" height="84" rx="8" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="3" />
              {[16, 40, 64].map((y) => (
                <g key={y}>
                  <rect x="17" y={y} width="50" height="18" rx="4" fill="var(--taro)" stroke="var(--ink)" strokeWidth="2.5" />
                  <circle className="cs-led" cx="26" cy={y + 9} r="3" />
                  <path d={`M36 ${y + 9}h24`} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              ))}
            </svg>
          </div>

          <div className={`cs-node ${lit('database') ? 'is-lit' : ''}`}>
            <div className="cs-db">
              <svg className="cs-art" viewBox="0 0 84 96" aria-hidden="true">
                <path d="M12 22v52c0 8 13 14 30 14s30-6 30-14V22" fill="var(--sky)" stroke="var(--ink)" strokeWidth="3" />
                <ellipse cx="42" cy="22" rx="30" ry="13" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="3" />
                <path d="M12 40c0 8 13 14 30 14s30-6 30-14M12 58c0 8 13 14 30 14s30-6 30-14" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
              </svg>
              <Mascot mood={lit('database') ? 'happy' : 'idle'} size={46} className="cs-db__bi" />
            </div>
          </div>
        </div>

        <div className="cs__labels">
          {copy.nodes.map((n) => (
            <div key={n.id} className="cs-label">
              <b>{n.name}</b>
              <span>{n.note}</span>
            </div>
          ))}
        </div>

        {cur && !reduce && (
          <m.div
            key={step}
            className={`cs-packet cs-packet--${cur.tone}`}
            initial={{ left: X[cur.from], opacity: 1, scale: 0.6 }}
            animate={{ left: X[cur.to], opacity: [1, 1, 0], scale: [0.6, 1, 0.7] }}
            transition={{ duration: 0.66, ease: [0.45, 0, 0.2, 1], times: [0, 0.82, 1] }}
            aria-hidden="true"
          >
            {cur.packet}
          </m.div>
        )}
      </div>

      <div className={`cs__sql ${step >= 2 ? '' : 'is-hidden'}`}>
        <span className="sk-label">{copy.sqlLabel}</span>
        <pre className="sk-sql">{copy.sql}</pre>
      </div>

      <div className="sk-bar">
        <button type="button" className="btn cs__next" onClick={next} disabled={done || !arrived}>
          {copy.next}
          <Icon name="arrow" />
        </button>
        <span className="chip">{copy.stepOf(step, TOTAL)}</span>
        <button type="button" className="btn btn--sm btn--paper sk-bar__end" onClick={reset} disabled={step === 0}>
          {copy.reset}
        </button>
      </div>

      <Says mood={showMenu ? 'cheer' : step === 0 ? 'idle' : 'happy'} size={56} className="sk-say">
        <Rich text={cur ? cur.say : copy.says.start} />
        {showMenu && (
          <p className="cs__done">
            <Rich text={copy.says.done} />
          </p>
        )}
      </Says>
    </div>
  );
}
