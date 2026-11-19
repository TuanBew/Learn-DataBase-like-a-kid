import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { glossary } from '../content/glossary';
import { uiLesson } from '../content/ui-lesson';
import { play } from '../sfx/sfx';
import './term.css';

export function Term({ id, children }: { id: string; children: ReactNode }) {
  const entry = glossary[id];
  const popId = useId();
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const show = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen((o) => {
      if (!o) play('pop');
      return true;
    });
  }, []);
  const hide = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
  }, []);
  const hideSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  // Căn popover theo vị trí của thuật ngữ để không tràn khỏi màn hình.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const w = Math.min(300, vw - 32);
    const left = Math.min(Math.max(r.left, 16), vw - 16 - w);
    setShift(left - r.left);
  }, [open]);

  if (!entry) return <>{children}</>;

  return (
    <span
      className="term"
      ref={wrapRef}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      <button
        type="button"
        className="term__btn"
        aria-expanded={open}
        aria-describedby={open ? popId : undefined}
        onFocus={show}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) hide();
        }}
        onClick={() => (open ? hide() : show())}
      >
        {children}
      </button>
      {open && (
        <span
          id={popId}
          role="tooltip"
          className="term__pop"
          style={{ left: shift }}
          aria-label={uiLesson.termPopoverLabel}
        >
          <span className="term__name">{entry.term}</span>
          <span className="term__short">{entry.short}</span>
          {entry.example && (
            <span className="term__example">
              <span className="pen term__ex-label">{uiLesson.example}:</span> {entry.example}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
