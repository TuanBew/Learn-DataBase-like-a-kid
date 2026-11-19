import { useState } from 'react';
import { homeInside } from '../content/home';
import { play } from '../sfx/sfx';
import './home-inside.css';

type PartId = (typeof homeInside.parts)[number]['id'];

/** Cảnh thứ hai của trang chủ: bấm table, row, column để thấy từng thứ nằm ở đâu. */
export function HomeInside() {
  const [part, setPart] = useState<PartId>('table');
  const [rowAt, setRowAt] = useState(1);
  const t = homeInside.table;
  const current = homeInside.parts.find((p) => p.id === part)!;

  const pick = (id: PartId) => {
    play('pop');
    // Bấm lại "row" thì row được tô chuyển xuống row kế tiếp.
    if (id === 'row' && part === 'row') setRowAt((r) => (r + 1) % t.rows.length);
    setPart(id);
  };

  return (
    <div className={`inside inside--${part}`}>
      <div className="inside__parts" role="group" aria-label={homeInside.hint}>
        {homeInside.parts.map((p) => (
          <button key={p.id} type="button" className="inside__part" aria-pressed={part === p.id} onClick={() => pick(p.id)}>
            {p.term}
          </button>
        ))}
      </div>
      <div className="inside__sheet sheet">
        <span className="chip inside__name">table {t.name}</span>
        <table className="inside__table">
          <thead>
            <tr>
              {t.columns.map((c, j) => (
                <th key={c} scope="col" className={part === 'column' && j === 2 ? 'is-on' : ''}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={r[0]} className={part === 'row' && i === rowAt ? 'is-on' : ''}>
                {r.map((cell, j) => (
                  <td key={j} className={part === 'column' && j === 2 ? 'is-on' : ''}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="inside__say pen" aria-live="polite">
        {current.say}
      </p>
    </div>
  );
}
