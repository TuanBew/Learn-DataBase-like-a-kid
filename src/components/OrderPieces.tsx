import { type DragEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { play } from '../sfx/sfx';
import { Rich } from './Rich';
import './order-pieces.css';

export interface OrderPiecesLabels {
  pool: string;
  answer: string;
  check: string;
  reset: string;
  right: string;
  wrong: (n: number) => string;
}

export interface OrderPiecesProps {
  /** Thứ tự đúng. */
  pieces: string[];
  mono?: boolean;
  onDone?: () => void;
  /** Gọi mỗi khi số mẩu ở hàng trả lời đổi. */
  onChange?: (placed: number) => void;
  /** Gọi sau mỗi lần kiểm sai, kèm số mẩu sai vị trí. */
  onWrong?: (wrong: number) => void;
  labels: OrderPiecesLabels;
}

/** Xáo cố định theo nội dung: cùng `pieces` luôn ra cùng thứ tự, và không bao giờ trùng thứ tự đúng. */
function shuffled(pieces: string[]): number[] {
  let h = 2166136261;
  for (const ch of pieces.join('\u0001')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = pieces.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.length > 1 && order.every((v, i) => pieces[v] === pieces[i])) order.push(order.shift()!);
  return order;
}

/** Trò xếp thứ tự: bấm mẩu ở khay để đưa lên hàng trả lời, bấm lại để trả về khay. Dùng chuột thì kéo thả được. */
export function OrderPieces({ pieces, mono = false, onDone, onChange, onWrong, labels }: OrderPiecesProps) {
  const uid = useId();
  const key = pieces.join('\u0001');
  const order = useMemo(() => shuffled(pieces), [key]);
  const [answer, setAnswer] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const refs = useRef<Record<number, HTMLButtonElement | null>>({});
  const focusNext = useRef<number | null>(null);
  /** Mẩu đang bị kéo, và chỗ con trỏ đang đứng trên. Kéo thả dùng chuột, bấm vẫn chạy cho điện thoại và bàn phím. */
  const drag = useRef<number | null>(null);
  const [over, setOver] = useState<number | 'pool' | null>(null);

  useEffect(() => {
    if (focusNext.current !== null) {
      refs.current[focusNext.current]?.focus();
      focusNext.current = null;
    }
  });

  const pool = order.filter((i) => !answer.includes(i));
  const full = answer.length === pieces.length;

  const change = (next: number[], focus: number) => {
    focusNext.current = focus;
    setAnswer(next);
    setWrong([]);
    onChange?.(next.length);
  };
  const add = (i: number) => {
    if (done) return;
    play('tap');
    change([...answer, i], i);
  };
  const remove = (i: number) => {
    if (done) return;
    play('tap');
    change(
      answer.filter((x) => x !== i),
      i,
    );
  };
  /** Đặt mẩu `i` vào ô thứ `k` của hàng trả lời. Các mẩu phía sau lùi xuống một ô. */
  const place = (i: number, k: number) => {
    if (done) return;
    const rest = answer.filter((x) => x !== i);
    const at = Math.min(k, rest.length);
    play('tap');
    change([...rest.slice(0, at), i, ...rest.slice(at)], i);
  };
  const dragFrom = (i: number) =>
    done
      ? {}
      : {
          draggable: true,
          onDragStart: (e: DragEvent) => {
            drag.current = i;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(i));
          },
          onDragEnd: () => {
            drag.current = null;
            setOver(null);
          },
        };
  const dropOn = (target: number | 'pool') => ({
    onDragOver: (e: DragEvent) => {
      if (drag.current === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (over !== target) setOver(target);
    },
    onDragLeave: () => setOver((o) => (o === target ? null : o)),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const i = drag.current;
      drag.current = null;
      setOver(null);
      if (i === null) return;
      if (target === 'pool') {
        if (answer.includes(i)) remove(i);
      } else place(i, target);
    },
  });
  const reset = () => {
    play('pop');
    setAnswer([]);
    setWrong([]);
    setDone(false);
    onChange?.(0);
  };
  const check = () => {
    const bad = answer.map((p, k) => (pieces[p] === pieces[k] ? -1 : k)).filter((k) => k >= 0);
    if (bad.length === 0) {
      play('ok');
      setWrong([]);
      setDone(true);
      onDone?.();
    } else {
      play('bad');
      setWrong(bad);
      onWrong?.(bad.length);
    }
  };

  const text = (i: number) => <span className={mono ? 'opieces__text opieces__text--mono' : 'opieces__text'}><Rich text={pieces[i]} /></span>;

  return (
    <div className={`opieces${done ? ' is-done' : ''}`}>
      <p className="opieces__label" id={`${uid}-a`}>
        {labels.answer}
      </p>
      <ol className="opieces__answer" aria-labelledby={`${uid}-a`}>
        {pieces.map((_, k) => {
          const i = answer[k];
          const filled = i !== undefined;
          const bad = filled && wrong.includes(k);
          return (
            <li key={k} className={`opieces__slot${over === k ? ' is-over' : ''}`} {...dropOn(k)}>
              <span className="opieces__num" aria-hidden="true">
                {k + 1}
              </span>
              {filled ? (
                <button
                  type="button"
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  className={`opieces__piece${bad ? ' is-wrong' : ''}${done ? ' is-right' : ''}`}
                  disabled={done}
                  onClick={() => remove(i)}
                  {...dragFrom(i)}
                >
                  {text(i)}
                </button>
              ) : (
                <span className="opieces__empty" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      <p className="opieces__label" id={`${uid}-p`}>
        {labels.pool}
      </p>
      <div className={`opieces__pool${over === 'pool' ? ' is-over' : ''}`} role="group" aria-labelledby={`${uid}-p`} {...dropOn('pool')}>
        {pool.map((i) => (
          <button
            key={i}
            type="button"
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="opieces__piece opieces__piece--pool"
            onClick={() => add(i)}
            {...dragFrom(i)}
          >
            {text(i)}
          </button>
        ))}
      </div>

      <div className="opieces__bar">
        <button type="button" className="btn btn--matcha" disabled={!full || done} onClick={check}>
          {labels.check}
        </button>
        <button type="button" className="btn btn--sm btn--paper" disabled={answer.length === 0} onClick={reset}>
          {labels.reset}
        </button>
        <p className={`opieces__status${done ? ' is-right' : wrong.length ? ' is-wrong' : ''}`} role="status">
          {done ? labels.right : wrong.length ? labels.wrong(wrong.length) : ''}
        </p>
      </div>
    </div>
  );
}
