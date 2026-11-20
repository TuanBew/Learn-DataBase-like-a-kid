import { useMemo, useRef, useState } from 'react';
import type { MatchQuiz as MatchQuizData } from '../../content/types';
import { uiLesson } from '../../content/ui-lesson';
import { play } from '../../sfx/sfx';
import { Says } from '../Mascot';
import { Rich } from '../Rich';
import './quiz.css';

const COLORS = ['matcha', 'taro', 'mango', 'peach'] as const;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Xáo cố định theo seed: cùng đề thì luôn ra cùng thứ tự. */
function seededOrder(n: number, seed: number): number[] {
  const rnd = mulberry32(seed);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (n > 1 && a.every((v, i) => v === i)) a.push(a.shift() as number);
  return a;
}

export function MatchQuiz({ quiz, onDone }: { quiz: MatchQuizData; onDone?: () => void }) {
  const order = useMemo(
    () => seededOrder(quiz.pairs.length, hash(quiz.question + quiz.pairs.map((p) => p.left + p.right).join('|'))),
    [quiz],
  );
  const [sel, setSel] = useState<number | null>(null);
  /** pair index -> số thứ tự ghép (bắt đầu từ 1) */
  const [matched, setMatched] = useState<Record<number, number>>({});
  const [shake, setShake] = useState<{ left: number; right: number; n: number } | null>(null);
  const doneRef = useRef(false);
  const count = Object.keys(matched).length;
  const finished = count === quiz.pairs.length;

  const pickLeft = (i: number) => {
    if (matched[i] !== undefined) return;
    play('tap');
    setSel((s) => (s === i ? null : i));
  };

  const pickRight = (p: number) => {
    if (matched[p] !== undefined || sel === null) return;
    if (sel === p) {
      const num = count + 1;
      setMatched((m) => ({ ...m, [p]: num }));
      setSel(null);
      if (num === quiz.pairs.length) {
        play('ok');
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      } else {
        play('pop');
      }
    } else {
      play('bonk');
      setShake((s) => ({ left: sel, right: p, n: (s?.n ?? 0) + 1 }));
    }
  };

  const colorOf = (p: number) => (matched[p] === undefined ? '' : COLORS[(matched[p] - 1) % COLORS.length]);

  const cell = (side: 'left' | 'right', p: number, text: string, onClick: () => void) => {
    const num = matched[p];
    const isMatched = num !== undefined;
    const shaking = shake && ((side === 'left' && shake.left === p) || (side === 'right' && shake.right === p));
    return (
      <li key={`${side}-${p}`}>
        <button
          type="button"
          className={`btn btn--paper qz-cell${isMatched ? ` is-matched qz-cell--${colorOf(p)}` : ''}${
            side === 'left' && sel === p ? ' is-selected' : ''
          }${shaking ? (shake.n % 2 ? ' is-shake-a' : ' is-shake-b') : ''}`}
          aria-pressed={isMatched || (side === 'left' && sel === p)}
          aria-label={isMatched ? `${text}, ${uiLesson.quizPairNumber} ${num}` : undefined}
          disabled={isMatched}
          onClick={onClick}
        >
          {isMatched && <span className="qz-cell__num">{num}</span>}
          <span className="qz-cell__text">
            <Rich text={text} />
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="qz qz-match">
      <p className="qz__question">
        <Rich text={quiz.question} />
      </p>
      {!finished && <p className="pen qz-match__hint">{uiLesson.quizMatchHint}</p>}
      <div className="qz-match__cols">
        <ul className="qz-match__col" aria-label={uiLesson.quizLeft}>
          {quiz.pairs.map((pr, i) => cell('left', i, pr.left, () => pickLeft(i)))}
        </ul>
        <ul className="qz-match__col" aria-label={uiLesson.quizRight}>
          {order.map((p) => cell('right', p, quiz.pairs[p].right, () => pickRight(p)))}
        </ul>
      </div>
      <p className="chip qz-match__count">
        <b>
          {count}/{quiz.pairs.length}
        </b>{' '}
        {uiLesson.quizMatched}
      </p>
      {finished && (
        <Says mood="cheer">
          <Rich text={quiz.done} />
        </Says>
      )}
    </div>
  );
}
