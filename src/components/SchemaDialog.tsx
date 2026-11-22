import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { uiApp } from '../content/ui-app';
import type { Database } from '../engine/types';
import { play } from '../sfx/sfx';
import { Icon } from './Icon';
import { SchemaMap, hasSchemaMap } from './SchemaMap';
import './schema-dialog.css';

const T = uiApp.schemaMap;

/** Nút "Xem sơ đồ" và hộp thoại chứa sơ đồ. Không hiện gì khi database chưa có sơ đồ. */
export function SchemaDialogButton({ db }: { db: Database | null | undefined }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  if (!hasSchemaMap(db)) return null;
  return (
    <>
      <button
        ref={opener}
        type="button"
        className="btn btn--paper btn--sm"
        aria-haspopup="dialog"
        onClick={() => {
          play('tap');
          setOpen(true);
        }}
      >
        {T.open}
      </button>
      {open && (
        <Dialog
          db={db}
          onClose={() => {
            setOpen(false);
            opener.current?.focus();
          }}
        />
      )}
    </>
  );
}

function Dialog({ db, onClose }: { db: Database; onClose: () => void }) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])')];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="sdlg" onKeyDown={onKey}>
      <div className="sdlg__back" onClick={onClose} aria-hidden="true" />
      <div className="sdlg__box" ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="sdlg__head">
          <h2 id={titleId} className="sdlg__title">
            {T.title}
          </h2>
          <button ref={closeBtn} type="button" className="btn btn--paper btn--sm" aria-label={T.closeLabel} onClick={onClose}>
            <Icon name="cross" size={18} />
            {T.close}
          </button>
        </div>
        <div className="sdlg__body">
          <SchemaMap db={db} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
