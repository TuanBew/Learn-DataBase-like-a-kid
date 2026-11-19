import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { play } from '../sfx/sfx';
import { Says } from './Mascot';
import { uiExercise } from '../content/ui-exercise';
import './hint-ladder.css';

export interface HintLadderProps {
  light: string;
  specific: string;
  skeleton: string;
  solution: string;
  onSolution?: () => void;
  /** Đổi giá trị này thì đóng hết các bậc. */
  resetKey?: string;
}

const T = uiExercise.hints;

/** Hiểu `**đậm**`, `code` và [[id|chữ]]. Không dùng dangerouslySetInnerHTML. */
function renderRich(text: string): ReactNode[] {
  const plain = text.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1');
  return plain.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function HintLadder({ light, specific, skeleton, solution, onSolution, resetKey }: HintLadderProps) {
  const [opened, setOpened] = useState(0);
  const [keyAtOpen, setKeyAtOpen] = useState(resetKey);

  // Đổi bài thì đóng lại hết, ngay trong lúc render để không nháy bậc cũ.
  if (keyAtOpen !== resetKey) {
    setKeyAtOpen(resetKey);
    setOpened(0);
  }

  const open = () => {
    if (opened >= 4) return;
    play('hint');
    setOpened(opened + 1);
  };

  const bodies: ReactNode[] = [
    <p key="1" className="hlad__text">{renderRich(light)}</p>,
    <p key="2" className="hlad__text">{renderRich(specific)}</p>,
    <pre key="3" className="hlad__code">{skeleton}</pre>,
    <pre key="4" className="hlad__code">{solution}</pre>,
  ];

  return (
    <section className="hlad sheet" aria-label={T.regionLabel}>
      <Says mood={opened >= 4 ? 'happy' : opened > 0 ? 'think' : 'idle'} size={56}>
        {T.mascot[opened]}
      </Says>

      <ol className="hlad__steps">
        {bodies.map((body, i) => {
          const isOpen = i < opened;
          return (
            <li key={i} className={`hlad__step${isOpen ? ' hlad__step--open' : ''}`}>
              <h3 className="hlad__title">
                <span className="hlad__num" aria-hidden="true">{i + 1}</span>
                <span>{T.levels[i]}</span>
                <span className="sr-only"> ({T.step(i + 1)})</span>
              </h3>
              {isOpen && (
                <div className="hlad__body">
                  {body}
                  {i === 3 && onSolution && (
                    <button type="button" className="btn btn--paper btn--sm hlad__run" onClick={onSolution}>
                      {T.runSolution}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <button type="button" className="btn btn--sm hlad__next" onClick={open} disabled={opened >= 4}>
        {opened >= 4 ? T.allOpen : T.open[opened]}
      </button>
    </section>
  );
}
