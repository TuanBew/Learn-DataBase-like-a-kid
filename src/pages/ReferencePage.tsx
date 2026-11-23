import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { DialectToggle, ErrorCard } from '../components/sql/parts';
import { Mascot } from '../components/Mascot';
import { HangLines } from '../components/HangLines';
import { ResultTable } from '../components/ResultTable';
import { chapters } from '../content/course';
import { type RefEntry, type RefGroup, refGroups, reference } from '../content/reference';
import { uiApp } from '../content/ui-app';
import { uiReference as T } from '../content/ui-reference';
import type { Dialect, RunResult } from '../engine';
import { runExample } from '../lib/reference-run';
import { useTitle } from '../lib/useTitle';
import { play } from '../sfx/sfx';
import './reference.css';

const KEY = 'ldb:ref-dialect';
const MAX_ROWS = 10;
const DIALECTS: Dialect[] = ['mysql', 'oracle'];
const lessonTitle: Record<string, string> = Object.fromEntries(chapters.flatMap((c) => c.lessons.map((l) => [l.id, l.title])));
const groupLabel = Object.fromEntries(refGroups.map((g) => [g.id, g.label])) as Record<RefGroup, string>;

/** Chữ thường, bỏ dấu, đ thành d: để gõ `do dai` vẫn ra `độ dài`. */
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();

const index = reference.map((e) => ({ e, title: norm(e.title), keys: e.keys.map(norm), what: norm(e.what) }));

/** Điểm càng thấp càng khớp. null là không khớp. */
function score(it: (typeof index)[number], q: string, tokens: string[]): number | null {
  const hay = `${it.title} ${it.keys.join(' ')} ${it.what}`;
  if (!tokens.every((t) => hay.includes(t))) return null;
  const words = it.title.split(/[^a-z0-9_]+/);
  if (words.includes(q) || it.keys.includes(q)) return 0;
  if (it.title.includes(q)) return 1;
  if (it.keys.some((k) => k.includes(q))) return 2;
  return 3;
}

function readDialect(): Dialect {
  try {
    return localStorage.getItem(KEY) === 'oracle' ? 'oracle' : 'mysql';
  } catch {
    return 'mysql';
  }
}

type RunState = { status: 'idle' } | { status: 'run' } | { status: 'done'; result: RunResult | null };

function Result({ state, title, dialect }: { state: RunState; title: string; dialect: Dialect }) {
  if (state.status === 'idle') return null;
  if (state.status === 'run') return <p className="ref-card__wait">{T.running}</p>;
  const r = state.result;
  if (!r) return <p className="ref-card__wait">{T.loadFail}</p>;
  if (!r.ok) return <ErrorCard error={r.error} dialect={dialect} />;
  if (r.kind === 'select') {
    const extra = r.result.rows.length - MAX_ROWS;
    return (
      <div className="ref-card__result">
        <ResultTable result={r.result} caption={T.resultCaption(title)} maxRows={MAX_ROWS} />
        {extra > 0 && <p className="ref-card__more">{T.moreRows(extra)}</p>}
      </div>
    );
  }
  return <p className="ref-card__wait">{T.done}</p>;
}

const Card = memo(function Card({ entry, dialect, showGroup }: { entry: RefEntry; dialect: Dialect; showGroup: boolean }) {
  const form = entry[dialect];
  const [state, setState] = useState<RunState>({ status: 'idle' });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const dName = uiApp.dialects[dialect];
  const run = () => {
    if (!form || state.status === 'run') return;
    play('tap');
    setState({ status: 'run' });
    runExample(entry.group, form.example, dialect)
      .then((result) => alive.current && setState({ status: 'done', result }))
      .catch(() => alive.current && setState({ status: 'done', result: null }));
  };
  const id = `ref-${entry.id}`;
  return (
    <article className="ref-card sheet" aria-labelledby={id}>
      <header className="ref-card__head">
        <h3 id={id}>{entry.title}</h3>
        {showGroup && <span className="chip">{groupLabel[entry.group]}</span>}
      </header>
      <p className="ref-card__what">{entry.what}</p>
      {form ? (
        <>
          <h4 className="ref-card__label">{T.syntax}</h4>
          <pre className="ref-code" tabIndex={0} aria-label={`${T.syntax} ${entry.title}, ${dName}`}>
            <code><HangLines text={form.syntax} /></code>
          </pre>
          <h4 className="ref-card__label">{T.example}</h4>
          <pre className="ref-code" tabIndex={0} aria-label={`${T.example} ${entry.title}, ${dName}`}>
            <code><HangLines text={form.example.replace(/; /g, ';\n')} /></code>
          </pre>
          <div className="ref-card__actions">
            <button type="button" className="btn btn--sm" onClick={run} disabled={state.status === 'run'} aria-label={`${T.run} ${T.example.toLowerCase()} ${entry.title}`}>
              {T.run}
            </button>
          </div>
          <div aria-live="polite">
            <Result state={state} title={entry.title} dialect={dialect} />
          </div>
        </>
      ) : (
        <p className="ref-card__missing">{T.missing(dName)}</p>
      )}
      {entry.note && (
        <p className="ref-card__note">
          <strong>{T.noteLabel}.</strong> {entry.note}
        </p>
      )}
      {entry.lesson && lessonTitle[entry.lesson] && (
        <p className="ref-card__lesson">
          {T.learn}: <Link href={`/bai/${entry.lesson}`}>{lessonTitle[entry.lesson]}</Link>
        </p>
      )}
    </article>
  );
});

export default function ReferencePage() {
  useTitle(T.title);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<RefGroup | 'all'>('all');
  const [dialect, setDialectState] = useState<Dialect>(readDialect);
  const dq = useDeferredValue(q);
  const setDialect = (d: Dialect) => {
    setDialectState(d);
    try {
      localStorage.setItem(KEY, d);
    } catch {
      /* không ghi được thì lựa chọn chỉ giữ tới khi đóng trang */
    }
  };

  const query = norm(dq).trim().replace(/\s+/g, ' ');
  const shown = useMemo(() => {
    const tokens = query ? query.split(' ') : [];
    const out: { e: RefEntry; s: number; i: number }[] = [];
    index.forEach((it, i) => {
      if (group !== 'all' && it.e.group !== group) return;
      const s = tokens.length ? score(it, query, tokens) : 0;
      if (s !== null) out.push({ e: it.e, s, i });
    });
    if (query) out.sort((a, b) => a.s - b.s || a.i - b.i);
    return out.map((x) => x.e);
  }, [query, group]);

  const sections = useMemo(() => {
    if (query) return null;
    return refGroups.map((g) => ({ g, items: shown.filter((e) => e.group === g.id) })).filter((s) => s.items.length > 0);
  }, [query, shown]);

  return (
    <div className="wrap ref">
      <header className="ref__head">
        <div>
          <h1>{T.title}</h1>
          <p className="ref__lead">{T.lead}</p>
        </div>
        <div className="ref__bi" aria-hidden="true">
          <Mascot size={72} mood="happy" />
        </div>
      </header>

      <div className="ref__tools" role="search">
        <div className="ref__search">
          <label htmlFor="ref-q">{T.searchLabel}</label>
          <div className="ref__field">
            <input id="ref-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.searchPlaceholder} autoComplete="off" autoCapitalize="off" spellCheck={false} />
            {q && (
              <button type="button" className="ref__clear" aria-label={T.clear} onClick={() => setQ('')}>
                ×
              </button>
            )}
          </div>
        </div>
        <div className="ref__dialect">
          <span id="ref-d">{T.dialectLabel}</span>
          <DialectToggle dialects={DIALECTS} value={dialect} onChange={setDialect} />
        </div>
      </div>

      <div className="ref__groups" role="group" aria-label={T.groupsLabel}>
        {(['all', ...refGroups.map((g) => g.id)] as const).map((id) => (
          <button key={id} type="button" className="ref__pill" aria-pressed={group === id} onClick={() => setGroup(id)}>
            {id === 'all' ? T.all : groupLabel[id]}
          </button>
        ))}
      </div>

      <p className="ref__count" role="status">
        {T.count(shown.length)}
      </p>

      {shown.length === 0 ? (
        <section className="ref__empty sheet">
          <Mascot size={64} mood="think" />
          <div>
            <p>
              <strong>{T.empty}</strong>
            </p>
            <p>{T.emptyTip}</p>
            <button
              type="button"
              className="btn btn--sm btn--paper"
              onClick={() => {
                setQ('');
                setGroup('all');
              }}
            >
              {T.emptyClear}
            </button>
          </div>
        </section>
      ) : sections ? (
        sections.map(({ g, items }) => (
          <section key={g.id} className="ref__section" aria-labelledby={`refg-${g.id}`}>
            <h2 id={`refg-${g.id}`}>{g.label}</h2>
            <div className="ref__list">
              {items.map((e) => (
                <Card key={`${e.id}-${dialect}`} entry={e} dialect={dialect} showGroup={false} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="ref__list">
          {shown.map((e) => (
            <Card key={`${e.id}-${dialect}`} entry={e} dialect={dialect} showGroup />
          ))}
        </div>
      )}
    </div>
  );
}
