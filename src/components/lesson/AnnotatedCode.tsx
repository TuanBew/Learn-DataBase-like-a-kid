import { Fragment, useMemo, useState } from 'react';
import { play } from '../../sfx/sfx';
import { Rich } from '../Rich';
import './annotated-code.css';

interface Note {
  find: string;
  text: string;
}
interface Span {
  start: number;
  end: number;
  note: number;
}

/** Tìm vị trí của mỗi `find` trong `code`. Đoạn không có trong code, hoặc đè lên đoạn trước, thì bỏ qua. */
function place(code: string, notes: Note[]): Span[] {
  const spans: Span[] = [];
  notes.forEach((n, note) => {
    if (!n.find) return;
    let from = 0;
    for (;;) {
      const start = code.indexOf(n.find, from);
      if (start < 0) return;
      const end = start + n.find.length;
      if (!spans.some((s) => start < s.end && end > s.start)) {
        spans.push({ start, end, note });
        return;
      }
      from = start + 1;
    }
  });
  return spans.sort((a, b) => a.start - b.start);
}

/** Đoạn code có chú thích: bấm vào một đoạn để đọc chú thích của nó. */
export function AnnotatedCode({ title, intro, code, notes }: { title: string; intro?: string; code: string; notes: Note[] }) {
  const spans = useMemo(() => place(code, notes), [code, notes]);
  const first = spans.reduce((m, s) => Math.min(m, s.note), Infinity);
  const [picked, setPicked] = useState<number | null>(null);
  const cur = picked !== null && spans.some((s) => s.note === picked) ? picked : Number.isFinite(first) ? first : null;

  const parts: React.ReactNode[] = [];
  let at = 0;
  spans.forEach((s) => {
    if (s.start > at) parts.push(<Fragment key={`t${at}`}>{code.slice(at, s.start)}</Fragment>);
    parts.push(
      <button
        key={`n${s.start}`}
        type="button"
        className={`acode__hit${cur === s.note ? ' is-on' : ''}`}
        aria-pressed={cur === s.note}
        onClick={() => {
          play('pop');
          setPicked(s.note);
        }}
      >
        {code.slice(s.start, s.end)}
      </button>,
    );
    at = s.end;
  });
  if (at < code.length) parts.push(<Fragment key={`t${at}`}>{code.slice(at)}</Fragment>);

  const note = cur !== null ? notes[cur] : null;

  return (
    <section className="lb acode">
      <h3 className="acode__title">{title}</h3>
      {intro && (
        <p className="lb-p acode__intro">
          <Rich text={intro} />
        </p>
      )}
      <div className="acode__grid">
        <pre className="acode__pre" tabIndex={0}>
          <code>{parts}</code>
        </pre>
        {note && (
          <div className="acode__note" aria-live="polite">
            <code className="acode__find">{note.find}</code>
            <p>
              <Rich text={note.text} />
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
