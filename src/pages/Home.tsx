import { Link } from 'wouter';
import { Icon } from '../components/Icon';
import { chapters } from '../content/course';
import { uiApp } from '../content/ui-app';
import { useProgress } from '../lib/progress';
import { HeroPlayground } from '../scenes/HeroPlayground';
import './home.css';

const U = uiApp.home;

const WRITTEN = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'LIMIT'];
const RUN = [
  { kw: 'FROM', tone: 'sky' },
  { kw: 'WHERE', tone: 'mango' },
  { kw: 'SELECT', tone: 'taro' },
  { kw: 'ORDER BY', tone: 'matcha' },
  { kw: 'LIMIT', tone: 'peach' },
];
const ROW = 46;

export function Home() {
  const progress = useProgress();
  const lessonCount = chapters.reduce((n, c) => n + c.lessons.length, 0);

  return (
    <>
      <section className="wrap home-hero">
        <div className="home-hero__text">
          <h1>
            {U.title.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </h1>
          <p className="home-hero__lead">{U.lead}</p>
          <div className="home-hero__cta">
            <Link href="/bai/c1-b1" className="btn">
              {U.start}
              <Icon name="arrow" />
            </Link>
            <Link href="/tap/c3-e6" className="btn btn--paper">
              {U.tryTheater}
            </Link>
          </div>
          <div className="home-hero__facts">
            <span className="chip">
              <b>{chapters.length}</b> {U.facts.chapters}
            </span>
            <span className="chip">
              <b>{lessonCount}</b> {U.facts.lessons}
            </span>
            <span className="chip">
              <b>{U.facts.hoursValue}</b> {U.facts.hours}
            </span>
            <span className="chip">{U.facts.dialects}</span>
          </div>
        </div>
        <div className="home-hero__play">
          <p className="pen home-hero__pen" aria-hidden="true">
            {U.heroPen}
            <svg viewBox="0 0 60 40" width="52" height="36">
              <path d="M4 6 Q34 2 44 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M34 26 L45 32 L49 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <HeroPlayground />
        </div>
      </section>

      <section className="wrap home-theater">
        <div className="home-theater__text">
          <h2>{U.theaterTitle}</h2>
          <p>{U.theaterLead}</p>
          <Link href="/tap/c3-e6" className="btn btn--ink">
            {U.theaterCta}
            <Icon name="arrow" />
          </Link>
        </div>
        <div className="home-order sheet" aria-hidden="true">
          <div className="home-order__col">
            <p className="home-order__label">{U.youWrite}</p>
            {WRITTEN.map((kw) => (
              <code key={kw} className="home-order__item">
                {kw}
              </code>
            ))}
          </div>
          <svg className="home-order__lines" viewBox={`0 0 100 ${ROW * WRITTEN.length}`} preserveAspectRatio="none">
            {WRITTEN.map((kw, i) => {
              const j = RUN.findIndex((r) => r.kw === kw);
              return <path key={kw} d={`M0 ${ROW * i + ROW / 2} C 50 ${ROW * i + ROW / 2}, 50 ${ROW * j + ROW / 2}, 100 ${ROW * j + ROW / 2}`} />;
            })}
          </svg>
          <div className="home-order__col">
            <p className="home-order__label">{U.dbRuns}</p>
            {RUN.map((r, i) => (
              <code key={r.kw} className={`home-order__item home-order__item--run home-tone-${r.tone}`}>
                <span>{i + 1}</span>
                {r.kw}
              </code>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap home-toc" id="muc-luc">
        <div className="home-toc__head">
          <h2>{U.tocTitle}</h2>
          <p>{U.tocLead}</p>
        </div>
        <ol className="home-toc__page sheet">
          {chapters.map((c) => (
            <li key={c.id} className="toc-ch">
              <span className="toc-ch__num pen" aria-hidden="true">
                {c.id}
              </span>
              <div className="toc-ch__body">
                <h3>
                  <span className="sr-only">{U.chapter(c.id)}: </span>
                  {c.title}
                </h3>
                <p className="toc-ch__about">{c.about}</p>
                <ul>
                  {c.lessons.map((l) => {
                    const done = progress.lessons[l.id] !== undefined;
                    return (
                      <li key={l.id} className={`toc-l ${l.ready ? '' : 'toc-l--soon'}`}>
                        {l.ready ? (
                          <Link href={`/bai/${l.id}`} className="toc-l__link">
                            <span className="toc-l__title">{l.title}</span>
                            <span className="toc-l__dots" aria-hidden="true" />
                            <span className={`toc-l__go ${done ? 'toc-l__go--done pen' : ''}`}>
                              {done ? U.done : U.open}
                              <Icon name={done ? 'check' : 'arrow'} size={16} />
                            </span>
                          </Link>
                        ) : (
                          <span className="toc-l__link">
                            <span className="toc-l__title">{l.title}</span>
                            <span className="toc-l__dots" aria-hidden="true" />
                            <span className="toc-l__soon">{U.soon}</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="wrap home-foot">
        <p>{U.footer}</p>
      </footer>
    </>
  );
}
