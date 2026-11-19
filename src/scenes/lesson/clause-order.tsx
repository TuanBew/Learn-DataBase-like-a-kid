import { useState } from 'react';
import { OrderPieces } from '../../components/OrderPieces';
import { Says, type Mood } from '../../components/Mascot';
import { copy } from '../../content/scenes/clause-order';
import './clause-order.css';

/** Cảnh "Thứ tự query chạy thật": xếp bảy clause theo thứ tự database chạy. */
export default function ClauseOrder() {
  const total = copy.pieces.length;
  const [say, setSay] = useState<{ mood: Mood; text: string }>({ mood: 'think', text: copy.idle });
  const pieces = [...copy.pieces];

  return (
    <div className="corder">
      <div className="corder__top">
        <p className="corder__cap">{copy.writtenTitle}</p>
        <pre className="corder__code" aria-label={copy.writtenTitle}>
          {copy.query.map((line) => (
            <code key={line} className="corder__line">
              {line}
            </code>
          ))}
        </pre>
      </div>

      <div className="corder__play">
        <h4 className="corder__title">{copy.ranTitle}</h4>
        <p>{copy.task}</p>
        <OrderPieces
          pieces={pieces}
          labels={copy.labels}
          onChange={(n) =>
            setSay(
              n === 0 ? { mood: 'think', text: copy.idle } : n === total ? { mood: 'idle', text: copy.full } : { mood: 'happy', text: copy.progress(n, total) },
            )
          }
          onWrong={() => setSay({ mood: 'think', text: copy.wrong })}
          onDone={() => setSay({ mood: 'cheer', text: copy.done })}
        />
      </div>

      <Says mood={say.mood} size={54} className="corder__say">
        {say.text}
      </Says>
    </div>
  );
}
