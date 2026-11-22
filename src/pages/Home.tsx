import { Link } from 'wouter';
import { Icon } from '../components/Icon';
import { chapters, totalHours } from '../content/course';
import { exerciseMap } from '../content/exercise-map';
import { exercises } from '../content/exercises';
import { lessons } from '../content/lessons';
import { homeAsk, homeFlow, homeInside } from '../content/home';
import { uiApp } from '../content/ui-app';
import { useProgress } from '../lib/progress';
import { HomeFlow } from '../scenes/HomeFlow';
import { HomeInside } from '../scenes/HomeInside';
import './home.css';
import { useTitle } from '../lib/useTitle';

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
  useTitle(null);
  const progress = useProgress();
  const lessonCount = chapters.reduce((n, c) => n + c.lessons.filter((l) => !l.exercise).length, 0);
  // Người quay lại thì nút đầu trang dẫn tới bài học tiếp theo. Nút này không bao giờ dẫn thẳng vào bài tập.
  const started = Object.keys(progress.lessons).length > 0;
  const upNext = chapters.flatMap((c) => c.lessons).find((l) => !l.exercise && progress.lessons[l.id] === undefined);

  return (
    <>
      {/* 1. Database đứng sau mọi ứng dụng */}
      <section className="wrap home-hero">
        <div className="home-hero__text">
          <h1>{U.title}</h1>
          <p className="home-hero__lead">{U.lead}</p>
          <div className="home-hero__cta">
            <Link href={!started ? '/bai/c1-b1' : upNext ? `/bai/${upNext.id}` : '/chung-nhan'} className="btn">
              {!started ? U.start : upNext ? U.resume : U.allDone}
              <Icon name="arrow" />
            </Link>
            <a href="#muc-luc" className="btn btn--paper">
              {U.toToc}
            </a>
          </div>
          {started && <p className="home-hero__resume">{upNext ? U.resumeNote(upNext.title) : U.allDoneNote(lessonCount)}</p>}
          <div className="home-hero__facts">
            <span className="chip">
              <b>{chapters.length}</b> {U.facts.chapters}
            </span>
            <span className="chip">
              <b>{lessonCount}</b> {U.facts.lessons}
            </span>
            <span className="chip">
              {U.facts.hours(totalHours)}
            </span>
            <span className="chip">{U.facts.dialects}</span>
          </div>
        </div>
        <div className="home-hero__play">
          <p className="pen home-hero__pen" aria-hidden="true">
            {homeFlow.pen}
            <svg viewBox="0 0 60 40" width="52" height="36">
              <path d="M4 6 Q34 2 44 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M34 26 L45 32 L49 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <HomeFlow />
        </div>
      </section>

      {/* 2. Bên trong database */}
      <section className="wrap home-band">
        <div className="home-band__text">
          <h2>{homeInside.title}</h2>
          <p>{homeInside.lead}</p>
          <p className="home-band__hint">{homeInside.hint}</p>
        </div>
        <HomeInside />
      </section>

      {/* 3. Hiểu database rồi mới tới SQL */}
      <section className="wrap home-band">
        <div className="home-band__text">
          <h2>{homeAsk.title}</h2>
          <p>{homeAsk.lead}</p>
          <p>{homeAsk.note}</p>
        </div>
        <div className="home-order sheet" aria-hidden="true">
          <div className="home-order__col">
            <p className="home-order__label">{homeAsk.youWrite}</p>
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
            <p className="home-order__label">{homeAsk.dbRuns}</p>
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
          <p>{U.tocLead(chapters.length)}</p>
          <Link href="/tien-trinh" className="home-toc__progress">
            {U.seeProgress}
            <Icon name="arrow" size={16} />
          </Link>
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
                    const ready = l.exercise ? l.id in exercises : l.id in lessons;
                    const done = l.exercise ? progress.exercises[l.id] !== undefined : progress.lessons[l.id] !== undefined;
                    const tasks = exerciseMap[l.id] ?? [];
                    const tasksDone = tasks.filter((id) => progress.exercises[id] !== undefined).length;
                    return (
                      <li key={l.id} className={`toc-l ${ready ? '' : 'toc-l--soon'}`}>
                        {ready ? (
                          <Link href={l.exercise ? `/tap/${l.id}` : `/bai/${l.id}`} className="toc-l__link">
                            <span className="toc-l__title">{l.title}</span>
                            <span className="toc-l__dots" aria-hidden="true" />
                            {tasks.length > 0 && <span className={`toc-l__ex ${tasksDone === tasks.length ? 'toc-l__ex--done' : ''}`}>{U.exercisesOf(tasksDone, tasks.length)}</span>}
                            <span className={`toc-l__go ${done ? 'toc-l__go--done pen' : ''} ${l.exercise && !done ? 'toc-l__go--preview' : ''}`}>
                              {done ? U.done : l.exercise ? U.preview : U.open}
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

    </>
  );
}
