import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Confetti } from '../components/Confetti';
import { Says } from '../components/Mascot';
import { chapters } from '../content/course';
import { uiCertificate as T } from '../content/ui-certificate';
import { canvasToPng, certificateStatus, drawCertificate, formatDate } from '../lib/certificate';
import { useProgress } from '../lib/progress';
import { play } from '../sfx/sfx';
import './certificate.css';
import { useTitle } from '../lib/useTitle';
import { uiApp } from '../content/ui-app';

function readName(): string {
  try {
    return (localStorage.getItem(T.storageKey) ?? '').slice(0, T.open.maxLength);
  } catch {
    return '';
  }
}

function saveName(name: string): void {
  try {
    localStorage.setItem(T.storageKey, name);
  } catch {
    // không lưu được thì thôi
  }
}

export default function CertificatePage() {
  useTitle(uiApp.nav.certificate);
  const progress = useProgress();
  const st = certificateStatus(progress);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(readName);
  const [msg, setMsg] = useState('');
  const played = useRef(false);
  const trimmed = name.trim();

  useEffect(() => {
    if (st.unlocked && !played.current) {
      played.current = true;
      play('chapter');
    }
  }, [st.unlocked]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void drawCertificate(canvas, {
      name: trimmed,
      date: formatDate(new Date()),
      chapters: chapters.map((c) => c.title),
      preview: !st.unlocked,
    });
  }, [trimmed, st.unlocked]);

  const onName = (value: string) => {
    const v = value.slice(0, T.open.maxLength);
    setName(v);
    saveName(v);
    setMsg('');
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !trimmed) return;
    const blob = await canvasToPng(canvas);
    if (!blob) {
      setMsg(T.open.downloadFail);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = T.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    play('ok');
  };

  return (
    <div className="wrap cert">
      <header className="cert__head">
        <h1>{T.title}</h1>
        {st.unlocked ? (
          <>
            <Confetti count={44} />
            <Says mood="cheer" size={72}>
              {trimmed ? T.open.bi : T.open.biNeedName}
            </Says>
          </>
        ) : (
          <Says mood="think" size={72}>
            {T.locked.bi(st.lessonsDone, st.lessonsTotal, st.bossDone, st.bossTotal)}
          </Says>
        )}
      </header>

      {!st.unlocked && (
        <div className="cert-chips">
          <span className="chip">
            {T.locked.lessonsChip}: <b>{st.lessonsDone}</b>/{st.lessonsTotal}
          </span>
          <span className="chip">
            {T.locked.bossChip}: <b>{st.bossDone}</b>/{st.bossTotal}
          </span>
        </div>
      )}

      <div className="sheet cert-paper">
        <canvas
          ref={canvasRef}
          className={st.unlocked ? 'cert-canvas' : 'cert-canvas cert-canvas--locked'}
          width={1600}
          height={1130}
          role="img"
          aria-label={T.alt(st.unlocked ? trimmed : '')}
        />
      </div>

      {st.unlocked ? (
        <div className="cert-field">
          <label htmlFor="cert-name">{T.open.nameLabel}</label>
          <input
            id="cert-name"
            className="cert-input"
            type="text"
            value={name}
            maxLength={T.open.maxLength}
            placeholder={T.open.namePlaceholder}
            autoComplete="name"
            onChange={(e) => onName(e.target.value)}
          />
          <div className="cert-actions">
            <button type="button" className="btn" disabled={!trimmed} onClick={() => void download()}>
              {T.open.download}
            </button>
            <span className="cert-msg" role="status" aria-live="polite">
              {msg}
            </span>
          </div>
        </div>
      ) : (
        <>
          <p className="cert-note">{T.locked.previewNote}</p>
          <div className="cert-actions">
            <Link href="/#muc-luc" className="btn">
              {T.locked.back}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
