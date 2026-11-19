import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { uiApp } from '../content/ui-app';
import { isMuted, onMuteChange, play, setMuted } from '../sfx/sfx';
import { Mascot } from './Mascot';
import { Icon } from './Icon';
import './header.css';

export function Header() {
  const [muted, setM] = useState(isMuted());
  useEffect(() => onMuteChange(setM), []);
  return (
    <header className="hdr">
      <a className="sr-only hdr__skip" href="#main">
        {uiApp.nav.skip}
      </a>
      <div className="wrap hdr__in">
        <Link href="/" className="hdr__logo" aria-label={uiApp.nav.home}>
          <Mascot size={38} />
          <span>
            Learn <b>Database</b>
          </span>
        </Link>
        <nav className="hdr__nav">
          <Link href="/#muc-luc" className="hdr__link">
            {uiApp.nav.toc}
          </Link>
          <button
            type="button"
            className="btn btn--sm btn--paper btn--icon"
            aria-pressed={muted}
            aria-label={muted ? uiApp.nav.soundOff : uiApp.nav.soundOn}
            title={muted ? uiApp.nav.soundOff : uiApp.nav.soundOn}
            onClick={() => {
              setMuted(!muted);
              if (muted) play('pop');
            }}
          >
            <Icon name={muted ? 'mute' : 'sound'} />
          </button>
        </nav>
      </div>
    </header>
  );
}
