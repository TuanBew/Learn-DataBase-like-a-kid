import { useState } from 'react';
import { uiWorkshop } from '../content/ui-workshop';
import type { SchemaColumn, SchemaTable, SchemaView } from '../engine';
import { Icon } from './Icon';
import './schema-panel.css';

const T = uiWorkshop.schema;

/** Các table có nội dung khác so với lần trước: table mới, đổi cấu trúc, hoặc đổi số row. */
function changedTables(prev: SchemaView, next: SchemaView): string[] {
  const old = new Map(prev.tables.map((t) => [t.name, JSON.stringify(t)]));
  return next.tables.filter((t) => old.get(t.name) !== JSON.stringify(t)).map((t) => t.name);
}

function Tags({ c, t }: { c: SchemaColumn; t: SchemaTable }) {
  const inCompound = !!t.primaryKey && t.primaryKey.some((n) => n.toLowerCase() === c.name.toLowerCase());
  return (
    <span className="sp-tags">
      {c.pk && (
        <span className="sp-tag sp-tag--pk">
          <Icon name="key" size={14} />
          {inCompound ? T.pkCompound(t.primaryKey!) : T.pk}
        </span>
      )}
      {c.fk && <span className="sp-tag sp-tag--fk">{T.fk(c.fk.table, c.fk.column)}</span>}
      {!c.nullable && !c.pk && <span className="sp-tag">{T.notNull}</span>}
      {c.unique && <span className="sp-tag">{T.unique}</span>}
      {c.identity && <span className="sp-tag">{T.identity}</span>}
      {c.default !== undefined && <span className="sp-tag sp-tag--code">{T.default(c.default)}</span>}
    </span>
  );
}

/** Khung "Database của bạn": mỗi table một thẻ. Table mới hoặc vừa đổi nháy sáng một nhịp. */
export function SchemaPanel({ view }: { view: SchemaView }) {
  // Tính phần nháy ngay lúc render khi `view` đổi, để không bị trễ một nhịp.
  const [state, setState] = useState({ view, flashed: [] as string[], gen: 0 });
  if (state.view !== view) setState({ view, flashed: changedTables(state.view, view), gen: state.gen + 1 });

  return (
    <aside className="sp sheet" aria-label={T.region}>
      <h3 className="sp__title">{T.title}</h3>
      <p className="sr-only" role="status">
        {state.flashed.length > 0 ? T.changed(state.flashed) : ''}
      </p>
      {view.tables.length === 0 && <p className="sp__none">{T.none}</p>}
      {view.tables.map((t) => {
        const flash = state.flashed.includes(t.name);
        return (
          <section key={flash ? `${t.name}#${state.gen}` : t.name} className={`sp-table${flash ? ' sp-table--flash' : ''}`} aria-label={T.tableLabel(t.name, t.rows)}>
            <header className="sp-table__head">
              <h4>{t.name}</h4>
              <span className="sp-table__rows">{T.rows(t.rows)}</span>
            </header>
            <ul className="sp-cols">
              {t.columns.map((c) => (
                <li key={c.name} className="sp-col">
                  <span className="sp-col__main">
                    <code className="sp-col__name">{c.name}</code>
                    <span className="sp-col__type">{c.type}</span>
                  </span>
                  <Tags c={c} t={t} />
                </li>
              ))}
            </ul>
            {t.checks.length > 0 && (
              <ul className="sp-checks">
                {t.checks.map((k, i) => (
                  <li key={i}>
                    <span className="sp-tag">{T.check}</span> <code>{k.expr}</code>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {view.sequences.length > 0 && (
        <section className="sp-table" aria-label={T.sequences}>
          <header className="sp-table__head">
            <h4>{T.sequences}</h4>
          </header>
          <ul className="sp-checks">
            {view.sequences.map((s) => (
              <li key={s.name}>
                <code>{s.name}</code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
