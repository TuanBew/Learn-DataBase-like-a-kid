import { Suspense, lazy, useEffect, useState } from 'react';
import { uiApp } from '../../content/ui-app';
import type { SqlError } from '../../engine';
import type { ColumnType, Dialect, TableDef } from '../../engine/types';
import { play } from '../../sfx/sfx';
import { Mascot } from '../Mascot';
// Các khối này dùng chung kiểu dáng với trang bài tập.
import '../../pages/exercise.css';

const U = uiApp.exercise;

const TYPE_NAME: Record<Dialect, Record<ColumnType, string>> = {
  mysql: { int: 'INT', decimal: 'DECIMAL', text: 'VARCHAR', date: 'DATE', datetime: 'DATETIME' },
  oracle: { int: 'NUMBER', decimal: 'NUMBER', text: 'VARCHAR2', date: 'DATE', datetime: 'DATE' },
};

/* CodeMirror nặng nhất trang, nên tải riêng, sau khi phần chữ đã hiện. */
const SqlEditor = lazy(() => import('../SqlEditor'));

/** Tên table kèm các column và data type theo dialect đang chọn. */
export function SchemaChips({ tables, dialect }: { tables: TableDef[]; dialect: Dialect }) {
  return (
    <>
      {tables.map((t) => (
        <div key={t.name} className="ex-schema">
          <span className="chip ex-schema__name">{t.name}</span>
          <ul>
            {t.columns.map((c) => (
              <li key={c.name}>
                <code>{c.name}</code>
                <span>{TYPE_NAME[dialect][c.type]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function DialectToggle({ dialects, value, onChange }: { dialects: Dialect[]; value: Dialect; onChange: (d: Dialect) => void }) {
  if (dialects.length < 2) return <span className="chip">{uiApp.dialects[value]}</span>;
  return (
    <div className="ex-dialect" role="group" aria-label={U.dialect}>
      {dialects.map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={d === value}
          onClick={() => {
            if (d !== value) {
              play('tap');
              onChange(d);
            }
          }}
        >
          {uiApp.dialects[d]}
        </button>
      ))}
    </div>
  );
}

interface EditorProps {
  value: string;
  onChange: (v: string) => void;
  dialect: Dialect;
  schema: Record<string, string[]>;
  onRun: () => void;
  error: { s: number; e: number } | null;
  label: string;
  readOnly?: boolean;
}

/** Editor SQL. Trong lúc CodeMirror đang tải, chỗ của editor hiện sẵn câu query. */
export function EditorBox(props: EditorProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => window.setTimeout(() => setReady(true), 0));
    return () => window.cancelAnimationFrame(id);
  }, []);
  const wait = <pre className="ex-editor__wait">{props.value}</pre>;
  if (props.readOnly) return wait;
  return <Suspense fallback={wait}>{ready ? <SqlEditor key={props.dialect} {...props} /> : wait}</Suspense>;
}

/** Thẻ báo lỗi: lời dễ hiểu của Bi, kèm nguyên văn dòng lỗi của DBMS thật. */
export function ErrorCard({ error, dialect, title }: { error: SqlError; dialect: Dialect; title?: string }) {
  return (
    <section className="ex-error sheet" role="alert">
      <h3 className="ex-h">{error.kind === 'unsupported' ? U.outOfScope : (title ?? U.errorTitle)}</h3>
      <div className="ex-error__say">
        <Mascot size={52} mood="think" />
        <p>
          {error.friendly} {error.tip && <strong>{error.tip}</strong>}
        </p>
      </div>
      {error.dbMessage && (
        <div className="ex-error__real">
          <span>{U.errorReal(uiApp.dialects[dialect])}</span>
          <code>{error.dbMessage}</code>
        </div>
      )}
      {error.kind !== 'unsupported' && <p className="ex-error__cheer">{U.errorSay}</p>}
    </section>
  );
}
