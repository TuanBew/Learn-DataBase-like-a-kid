import { useState } from 'react';
import { Says } from '../components/Mascot';
import type { Mood } from '../components/Mascot';
import { chapters } from '../content/course';
import { exercisesOfChapter } from '../content/exercise-map';
import { uiProgress as T } from '../content/ui-progress';
import { exportCode, importCode, resetProgress, useProgress } from '../lib/progress';
import { play } from '../sfx/sfx';
import './progress.css';

interface Note {
  mood: Mood;
  text: string;
}

export default function ProgressPage() {
  const progress = useProgress();
  const [code, setCode] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [paste, setPaste] = useState('');
  const [note, setNote] = useState<Note | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const rows = chapters.map((c) => {
    const lessons = c.lessons;
    const exs = exercisesOfChapter(c.id);
    const doneLessons = lessons.filter((l) => progress.lessons[l.id]).length;
    const doneExs = exs.filter((id) => {
      const e = progress.exercises[id];
      return Boolean(e && (e.mysql || e.oracle));
    }).length;
    return { c, total: lessons.length + exs.length, done: doneLessons + doneExs, lessons: lessons.length, doneLessons, exs: exs.length, doneExs };
  });
  const sum = (k: 'lessons' | 'doneLessons' | 'exs' | 'doneExs') => rows.reduce((n, r) => n + r[k], 0);
  const totalLessons = sum('lessons');
  const doneLessons = sum('doneLessons');
  const totalExs = sum('exs');
  const doneExs = sum('doneExs');

  const make = () => {
    play('tap');
    setCode(exportCode());
    setCopyMsg('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      play('ok');
      setCopyMsg(T.transfer.copied);
    } catch {
      setCopyMsg(T.transfer.copyFail);
    }
  };

  const doImport = () => {
    if (!paste.trim()) {
      setNote({ mood: 'think', text: T.transfer.emptyCode });
      play('bad');
      return;
    }
    const r = importCode(paste);
    if (r.ok) {
      play('ok');
      setNote({ mood: 'cheer', text: T.transfer.ok(r.added) });
      setPaste('');
    } else {
      play('bad');
      setNote({ mood: 'think', text: r.reason === 'version' ? T.transfer.errVersion : T.transfer.errFormat });
    }
  };

  const doReset = () => {
    resetProgress();
    play('tap');
    setConfirming(false);
    setCode('');
    setResetMsg(T.reset.done);
  };

  const nothing = doneLessons + doneExs === 0;

  return (
    <div className="wrap prg">
      <header className="prg__head">
        <h1>{T.title}</h1>
        <Says mood="happy" size={72}>
          {T.bi}
        </Says>
      </header>

      <section className="prg-sum" aria-labelledby="prg-sum">
        <h2 id="prg-sum" className="sr-only">
          {T.title}
        </h2>
        <div className="sheet prg-stat">
          <p className="prg-stat__label">{T.lessonsLabel}</p>
          <p className="prg-stat__num">
            <b>{doneLessons}</b> {T.of} {totalLessons}
          </p>
        </div>
        <div className="sheet prg-stat">
          <p className="prg-stat__label">{T.exercisesLabel}</p>
          <p className="prg-stat__num">
            <b>{doneExs}</b> {T.of} {totalExs}
          </p>
        </div>
        {nothing && <p className="pen prg-sum__empty">{T.empty}</p>}
      </section>

      <section aria-labelledby="prg-ch">
        <h2 id="prg-ch" className="prg__h2">
          {T.chaptersTitle}
        </h2>
        <ul className="prg-ch">
          {rows.map((r) => (
            <li key={r.c.id} className="prg-ch__row">
              <div className="prg-ch__top">
                <span className="prg-ch__name">
                  {T.chapterWord} {r.c.id}: {r.c.title}
                </span>
                <span className="chip">{T.chapterDone(r.done, r.total)}</span>
              </div>
              <div
                className="prg-bar"
                role="progressbar"
                aria-label={`${T.chapterWord} ${r.c.id}: ${r.c.title}`}
                aria-valuemin={0}
                aria-valuemax={r.total}
                aria-valuenow={r.done}
                aria-valuetext={T.chapterDone(r.done, r.total)}
              >
                <span className="prg-bar__fill" style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="sheet prg-box" aria-labelledby="prg-tr">
        <h2 id="prg-tr" className="prg__h2">
          {T.transfer.title}
        </h2>
        <p className="prg-box__lead">{T.transfer.lead}</p>

        <div className="prg-field">
          <button type="button" className="btn" onClick={make}>
            {T.transfer.make}
          </button>
          {code && (
            <>
              <label htmlFor="prg-code">{T.transfer.codeLabel}</label>
              <textarea id="prg-code" className="prg-text" readOnly rows={3} value={code} onFocus={(e) => e.currentTarget.select()} />
              <div className="prg-row">
                <button type="button" className="btn btn--paper" onClick={copy}>
                  {T.transfer.copy}
                </button>
                <span className="prg-msg" role="status" aria-live="polite">
                  {copyMsg}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="prg-field">
          <label htmlFor="prg-paste">{T.transfer.pasteLabel}</label>
          <textarea
            id="prg-paste"
            className="prg-text"
            rows={3}
            value={paste}
            placeholder={T.transfer.pastePlaceholder}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setPaste(e.target.value)}
          />
          <div className="prg-row">
            <button type="button" className="btn btn--matcha" onClick={doImport}>
              {T.transfer.import}
            </button>
          </div>
          {note && (
            <Says mood={note.mood} size={64} className="prg-says">
              {note.text}
            </Says>
          )}
        </div>
      </section>

      <section className="sheet prg-box prg-box--danger" aria-labelledby="prg-rs">
        <h2 id="prg-rs" className="prg__h2">
          {T.reset.title}
        </h2>
        <p className="prg-box__lead">{T.reset.lead}</p>
        {confirming ? (
          <div className="prg-confirm" role="group" aria-label={T.reset.confirm}>
            <p className="prg-confirm__q">{T.reset.confirm}</p>
            <div className="prg-row">
              <button type="button" className="btn prg-danger" onClick={doReset} autoFocus>
                {T.reset.confirmBtn}
              </button>
              <button type="button" className="btn btn--paper" onClick={() => setConfirming(false)}>
                {T.reset.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="prg-row">
            <button
              type="button"
              className="btn btn--paper"
              onClick={() => {
                setResetMsg('');
                setConfirming(true);
              }}
            >
              {T.reset.ask}
            </button>
          </div>
        )}
        <p className="prg-msg" role="status" aria-live="polite">
          {resetMsg}
        </p>
      </section>
    </div>
  );
}
