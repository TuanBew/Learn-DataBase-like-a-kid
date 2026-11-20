import type { ResultSet } from '../engine';
import { show } from '../engine';
import { uiExercise } from '../content/ui-exercise';
import { ScrollHint, useOverflowX } from './ScrollHint';
import './result-table.css';

export interface ResultTableProps {
  result: ResultSet;
  caption?: string;
  /** Khóa là vị trí row trong `result.rows`. */
  rowMarks?: Record<number, 'extra' | 'missing'>;
  emptyText?: string;
  maxRows?: number;
}

const T = uiExercise.table;

export function ResultTable({ result, caption, rowMarks, emptyText, maxRows }: ResultTableProps) {
  const total = result.rows.length;
  const shown = maxRows !== undefined && maxRows >= 0 ? Math.min(total, maxRows) : total;
  const rows = result.rows.slice(0, shown);
  const isNum = result.types.map((t) => t === 'int' || t === 'decimal');
  const title = caption ?? T.defaultCaption;
  const [scrollRef, overflows] = useOverflowX<HTMLDivElement>();

  return (
    <figure className="rtab">
      <div className="rtab__scroll" role="region" aria-label={title} tabIndex={0} ref={scrollRef}>
        <table className="rtab__table">
          <caption className="rtab__caption">{title}</caption>
          <thead>
            <tr>
              {result.columns.map((c, i) => (
                <th key={i} scope="col" className={isNum[i] ? 'rtab__num' : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => {
              const mark = rowMarks?.[r];
              return (
                <tr key={r} className={mark ? `rtab__row rtab__row--${mark}` : 'rtab__row'}>
                  {row.map((v, i) => {
                    const cls = [isNum[i] ? 'rtab__num' : '', v === null ? 'rtab__null' : ''].filter(Boolean).join(' ');
                    return (
                      <td key={i} className={cls || undefined}>
                        {i === 0 && mark && <span className="sr-only">{mark === 'extra' ? T.markExtra : T.markMissing} </span>}
                        {v === null ? T.nullText : show(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {total === 0 && <p className="rtab__empty">{emptyText ?? T.empty}</p>}
      </div>
      <figcaption className="rtab__count">
        <span className="mono">{T.counts(total, result.columns.length)}.</span>
        {shown < total && <span> {T.truncated(shown, total)}</span>}
        <ScrollHint show={overflows} />
      </figcaption>
    </figure>
  );
}
