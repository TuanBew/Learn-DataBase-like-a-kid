import * as m from 'motion/react-m';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import type { DmlTrace } from '../engine';
import { columnFormatter } from '../engine/values';
import { ScrollHint, useOverflowX } from './ScrollHint';
import './dml-view.css';

const MAX = 14;

/**
 * Diễn lại một lệnh INSERT, UPDATE hoặc DELETE trên bản sao của table:
 * row bị nhắm tới nháy lên rồi đổi. Quên WHERE thì mọi row đỏ rực.
 */
export function DmlView({ dml, labels }: { dml: DmlTrace; labels: { more: (n: number) => string; old: string } }) {
  const reduced = useReducedMotion() ?? false;
  const touched = new Set(dml.touched);
  const beforeById = new Map(dml.before.map((r) => [r.id, r.cells]));
  // DELETE: vẽ các row lúc trước để thấy row nào biến mất. Lệnh khác: vẽ các row lúc sau.
  const source = dml.op === 'delete' ? dml.before : dml.after;
  // Table lớn thì ưu tiên các row bị đụng tới.
  const ordered = source.length > MAX ? [...source.filter((r) => touched.has(r.id)), ...source.filter((r) => !touched.has(r.id))] : source;
  const rows = ordered.slice(0, MAX);
  const rest = source.length - rows.length;
  const cols = dml.columns.map((c) => c.key);
  const fmts = cols.map((_, i) => columnFormatter([...source, ...dml.after].map((r) => r.cells[i])));
  const [scrollRef, overflows] = useOverflowX<HTMLDivElement>();

  return (
    <div className={`dmlv ${dml.noWhere ? 'dmlv--alarm' : ''}`}>
      <div className="dmlv__scroll" tabIndex={0} ref={scrollRef}>
        <table className="dmlv__table">
          <thead>
            <tr>
              {dml.columns.map((c) => (
                <th key={c.key} scope="col" className={`${dml.changed.includes(c.key) ? 'is-set' : ''} ${c.type === 'int' || c.type === 'decimal' ? 'is-num' : ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={!reduced}>
              {rows.map((r, n) => {
                const hit = touched.has(r.id);
                const old = beforeById.get(r.id);
                return (
                  <m.tr
                    key={r.id}
                    className={hit ? `is-hit is-${dml.op}` : ''}
                    initial={hit && dml.op === 'insert' ? { opacity: 0, y: -24 } : false}
                    animate={{ opacity: hit && dml.op === 'delete' ? 0.5 : 1, y: 0 }}
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: hit ? Math.min(n, 10) * 0.05 : 0 }}
                  >
                    {r.cells.map((v, i) => {
                      const changed = hit && dml.op === 'update' && dml.changed.includes(cols[i]) && old !== undefined;
                      return (
                        <td key={i} className={`${typeof v === 'number' ? 'is-num' : ''} ${changed ? 'is-changed' : ''} ${v === null ? 'is-null' : ''}`}>
                          {changed && <s title={labels.old}>{fmts[i](old[i])}</s>}
                          <span>{fmts[i](v)}</span>
                        </td>
                      );
                    })}
                  </m.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {rest > 0 && <p className="dmlv__more">{labels.more(rest)}</p>}
      {overflows && (
        <div className="dmlv__hint">
          <ScrollHint show />
        </div>
      )}
    </div>
  );
}
