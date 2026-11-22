import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Says } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import { Icon } from '../components/Icon';
import { AnnotatedCode } from '../components/lesson/AnnotatedCode';
import { KeyPoints, OracleCard, RealWorldCard, SourcesLine, StoryBlock, TextBlock } from '../components/lesson/blocks';
import { ExerciseLinks } from '../components/lesson/ExerciseLinks';
import { ChoiceQuiz } from '../components/quiz/ChoiceQuiz';
import { MatchQuiz } from '../components/quiz/MatchQuiz';
import { Rich } from '../components/Rich';
import { chapters } from '../content/course';
import { exerciseMap } from '../content/exercise-map';
import { lessons } from '../content/lessons';
import type { Lesson, LessonBlock } from '../content/types';
import { uiApp } from '../content/ui-app';
import { markLesson, useProgress } from '../lib/progress';
import { useLoad } from '../lib/useLoad';
import { useTitle } from '../lib/useTitle';
import { scenes } from '../scenes';
import { play } from '../sfx/sfx';
import './lesson.css';

const U = uiApp.lesson;

const Playground = lazy(() => import('../components/Playground'));
const Workshop = lazy(() => import('../components/Workshop'));

export default function LessonPage({ id }: { id: string }) {
  const lesson = useLoad(lessons[id], `lesson:${id}`);
  useTitle(lesson?.title);
  if (lesson === null) {
    return (
      <div className="wrap lesson-missing">
        <Says mood="think">{U.notFound}</Says>
        <Link href="/#muc-luc" className="btn btn--paper">
          {U.backHome}
        </Link>
      </div>
    );
  }
  if (!lesson) return <div className="wrap" style={{ minHeight: '70vh' }} />;
  return <LessonView lesson={lesson} />;
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'story':
      return <StoryBlock title={block.title} paragraphs={block.paragraphs} />;
    case 'text':
      return <TextBlock title={block.title} paragraphs={block.paragraphs} />;
    case 'scene': {
      const Scene = scenes[block.scene];
      return (
        <section className="scene sheet" aria-label={uiApp.scenes.sceneLabel}>
          <h2 className="scene__title">{block.title}</h2>
          <p className="scene__intro">
            <Rich text={block.intro} />
          </p>
          {Scene && (
            <Suspense fallback={<div className="scene__wait" />}>
              <Scene />
            </Suspense>
          )}
        </section>
      );
    }
    case 'playground':
      return (
        <section className="scene sheet" aria-label={uiApp.scenes.sceneLabel}>
          <h2 className="scene__title">{block.title}</h2>
          <p className="scene__intro">
            <Rich text={block.intro} />
          </p>
          <Suspense fallback={<div className="scene__wait" />}>
            <Playground block={block} />
          </Suspense>
        </section>
      );
    case 'workshop':
      return (
        <section className="scene sheet" aria-label={uiApp.scenes.sceneLabel}>
          <h2 className="scene__title">{block.title}</h2>
          <p className="scene__intro">
            <Rich text={block.intro} />
          </p>
          <Suspense fallback={<div className="scene__wait" />}>
            <Workshop block={block} />
          </Suspense>
        </section>
      );
    case 'code':
      return <AnnotatedCode title={block.title} intro={block.intro} code={block.code} notes={block.notes} />;
    case 'quiz':
      return (
        <section className="lesson-quiz">
          <h2>{block.title}</h2>
          {block.items.map((q, i) => (q.kind === 'choice' ? <ChoiceQuiz key={i} quiz={q} /> : <MatchQuiz key={i} quiz={q} />))}
        </section>
      );
    case 'realworld':
      return <RealWorldCard title={block.title} paragraphs={block.paragraphs} source={block.source} />;
    case 'oracle':
      return <OracleCard body={block.body} mysql={block.mysql} oracle={block.oracle} />;
    case 'keypoints':
      return <KeyPoints items={block.items} />;
    case 'sources':
      return <SourcesLine items={block.items} />;
    case 'exercise':
      return <ExerciseLinks ids={block.exerciseIds} />;
  }
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const progress = useProgress();
  const done = progress.lessons[lesson.id] !== undefined;
  const [justDone, setJustDone] = useState(false);
  const chapter = chapters.find((c) => c.id === lesson.chapter);
  // Bài tập gắn với bài này, trừ những bài đã có sẵn trong một block `exercise`.
  const listed = new Set(lesson.blocks.flatMap((b) => (b.type === 'exercise' ? b.exerciseIds : [])));
  const extra = (exerciseMap[lesson.id] ?? []).filter((id) => !listed.has(id));

  /* Thanh tiến độ theo vị trí cuộn. */
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bài đứng ngay sau bài này trong khóa học, và bài này có phải bài cuối chương không.
  const order = chapters.flatMap((c) => c.lessons.map((l) => ({ ...l, chapter: c.id })));
  const at = order.findIndex((l) => l.id === lesson.id);
  const next = at >= 0 ? order[at + 1] : undefined;
  const lastOfChapter = !next || next.chapter !== lesson.chapter;
  const left = (exerciseMap[lesson.id] ?? []).filter((id) => progress.exercises[id] === undefined).length;

  // Chương xong khi mọi bài của chương đã xong, không kể học theo thứ tự nào.
  const isDone = (id: string) => progress.lessons[id] !== undefined;
  const chapterLessons = chapter?.lessons ?? [];
  const chapterComplete = chapterLessons.length > 0 && chapterLessons.every((l) => isDone(l.id));
  const chaptersDone = chapters.filter((c) => c.lessons.every((l) => isDone(l.id))).length;
  const [closedChapter, setClosedChapter] = useState(false);
  const showStamp = chapterComplete && (lastOfChapter || closedChapter);

  const finish = () => {
    const closes = chapterLessons.every((l) => l.id === lesson.id || isDone(l.id));
    play(closes ? 'chapter' : 'lesson');
    setClosedChapter(closes);
    markLesson(lesson.id);
    setJustDone(true);
  };

  return (
    <div className="wrap lesson">
      <div className="lesson-bar" role="progressbar" aria-label={U.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scroll * 100)}>
        <span style={{ transform: `scaleX(${scroll})` }} />
      </div>
      <header className="lesson-top">
        <p className="lesson-kicker">{chapter ? U.chapter(chapter.id, chapter.title) : ''}</p>
        <h1>{lesson.title}</h1>
        <p className="lesson-lead">
          <Rich text={lesson.lead} />
        </p>
      </header>

      <div className="lesson-grid">
        <aside className="lesson-side">
          <div className="lesson-goals sheet">
            <h2>{U.goals}</h2>
            <ul>
              {lesson.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <span className="chip">{U.minutes(lesson.minutes)}</span>
          </div>
        </aside>

        <article className="lesson-main">
          {lesson.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}

          {extra.length > 0 && <ExerciseLinks ids={extra} />}

          <section className="lesson-end sheet">
            {justDone && <Confetti count={showStamp ? 64 : 34} />}
            {done ? (
              <>
                <div className="lesson-end__top">
                  <Says mood="cheer" size={showStamp ? 96 : 72}>
                    {chaptersDone === chapters.length ? U.courseSay(chapters.length) : showStamp && chapter ? U.chapterSay(chapter.id, chapter.title) : U.finishSay}
                  </Says>
                  {showStamp && chapter && (
                    <div className={`chapter-stamp ${justDone ? 'is-fresh' : ''}`}>
                      <svg viewBox="0 0 160 160" role="img" aria-label={`${U.stampTop(chapter.id)}: ${U.stampMain}`}>
                        <path d="M80 9C41 8 10 39 11 79c1 41 30 71 70 71 41 0 70-31 69-71C149 38 120 10 80 9z" fill="none" stroke="var(--red)" strokeWidth="6" strokeLinecap="round" />
                        <path d="M79 21C47 22 22 47 23 80c1 32 26 57 58 56 33-1 57-27 56-58-1-32-27-58-58-57z" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round" />
                        <text x="80" y="66" textAnchor="middle" className="chapter-stamp__top">
                          {U.stampTop(chapter.id)}
                        </text>
                        <text x="80" y="112" textAnchor="middle" className="chapter-stamp__main">
                          {U.stampMain}
                        </text>
                      </svg>
                    </div>
                  )}
                </div>
                {showStamp && (
                  <div className="chapter-pips" role="img" aria-label={U.chaptersDone(chaptersDone, chapters.length)}>
                    {chapters.map((c) => (
                      <span key={c.id} className={c.lessons.every((l) => isDone(l.id)) ? 'is-done' : ''}>
                        {c.id}
                      </span>
                    ))}
                    <em>{U.chaptersDone(chaptersDone, chapters.length)}</em>
                  </div>
                )}
                {left > 0 && <p className="lesson-end__note">{U.exercisesLeft(left)}</p>}
                <div className="lesson-end__links">
                  {next ? (
                    <Link href={`/bai/${next.id}`} className="btn lesson-end__btn">
                      {lastOfChapter ? U.nextChapter(next.chapter) : U.nextLesson}
                      <Icon name="arrow" />
                    </Link>
                  ) : (
                    <>
                      <Link href="/chung-nhan" className="btn lesson-end__btn">
                        {U.toCertificate}
                        <Icon name="arrow" />
                      </Link>
                      <Link href="/hoc-tiep" className="btn btn--paper">
                        {U.toNextSteps}
                      </Link>
                    </>
                  )}
                  <Link href="/#muc-luc" className="btn btn--paper">
                    {U.backHome}
                  </Link>
                </div>
                {next && !lastOfChapter && <p className="lesson-end__note lesson-end__next">{next.title}</p>}
              </>
            ) : (
              <button type="button" className="btn lesson-end__btn" onClick={finish}>
                <Icon name="check" />
                {U.finish}
              </button>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}
