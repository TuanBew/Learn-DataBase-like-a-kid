import { useRef, useState } from 'react';
import type { ChoiceQuiz as ChoiceQuizData } from '../../content/types';
import { play } from '../../sfx/sfx';
import { Says } from '../Mascot';
import { Rich } from '../Rich';
import './quiz.css';

export function ChoiceQuiz({ quiz, onDone }: { quiz: ChoiceQuizData; onDone?: () => void }) {
  const [last, setLast] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const doneRef = useRef(false);

  const pick = (i: number) => {
    if (solved) return;
    const opt = quiz.options[i];
    setLast(i);
    if (opt.correct) {
      play('ok');
      setSolved(true);
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    } else {
      play('bonk');
      setWrong((w) => (w.includes(i) ? w : [...w, i]));
    }
  };

  const picked = last === null ? null : quiz.options[last];

  return (
    <div className="qz qz-choice">
      <p className="qz__question">
        <Rich text={quiz.question} />
      </p>
      <div className="qz-choice__opts">
        {quiz.options.map((o, i) => {
          const isWrong = wrong.includes(i) && !solved;
          const isRight = solved && o.correct;
          return (
            <button
              key={i}
              type="button"
              className={`btn btn--paper qz-opt${isWrong ? ' is-wrong' : ''}${isRight ? ' is-right' : ''}`}
              disabled={solved && !o.correct}
              aria-pressed={last === i}
              onClick={() => pick(i)}
            >
              <Rich text={o.text} />
            </button>
          );
        })}
      </div>
      {picked && (
        <Says mood={picked.correct ? 'happy' : 'think'}>
          <Rich text={picked.feedback} />
        </Says>
      )}
    </div>
  );
}
