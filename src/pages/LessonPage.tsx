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
import { scenes } from '../scenes';
import { play } from '../sfx/sfx';
import './lesson.css';

const U = uiApp.lesson;

const Playground = lazy(() => import('../components/Playground'));

export default function LessonPage({ id }: { id: string }) {
  const lesson = useLoad(lessons[id], `lesson:${id}`);
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

  const finish = () => {
    play(lastOfChapter ? 'chapter' : 'lesson');
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
            {justDone && <Confetti count={lastOfChapter ? 64 : 34} />}
            {done ? (
              <>
                <Says mood="cheer" size={lastOfChapter ? 96 : 72}>
                  {!next ? U.courseSay : lastOfChapter && chapter ? U.chapterSay(chapter.id, chapter.title) : U.finishSay}
                </Says>
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
