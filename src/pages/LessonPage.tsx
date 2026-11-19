import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Says } from '../components/Mascot';
import { Confetti } from '../components/Confetti';
import { Icon } from '../components/Icon';
import { KeyPoints, OracleCard, RealWorldCard, SourcesLine, StoryBlock, TextBlock } from '../components/lesson/blocks';
import { ChoiceQuiz } from '../components/quiz/ChoiceQuiz';
import { MatchQuiz } from '../components/quiz/MatchQuiz';
import { Rich } from '../components/Rich';
import { chapters } from '../content/course';
import { lessons } from '../content/lessons';
import type { Lesson, LessonBlock } from '../content/types';
import { uiApp } from '../content/ui-app';
import { markLesson, useProgress } from '../lib/progress';
import { useLoad } from '../lib/useLoad';
import { DataStreet } from '../scenes/DataStreet';
import { OrderPhone } from '../scenes/OrderPhone';
import { play } from '../sfx/sfx';
import './lesson.css';

const U = uiApp.lesson;

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
    case 'scene':
      return (
        <section className="scene sheet" aria-label={uiApp.scenes.sceneLabel}>
          <h2 className="scene__title">{block.title}</h2>
          <p className="scene__intro">
            <Rich text={block.intro} />
          </p>
          {block.scene === 'data-street' ? <DataStreet copy={block.copy} /> : <OrderPhone copy={block.copy} />}
        </section>
      );
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
      return (
        <Link href={`/tap/${block.exerciseId}`} className="btn">
          {U.toExercise}
        </Link>
      );
  }
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const progress = useProgress();
  const done = progress.lessons[lesson.id] !== undefined;
  const [justDone, setJustDone] = useState(false);
  const chapter = chapters.find((c) => c.id === lesson.chapter);

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

  const finish = () => {
    play('lesson');
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

          <section className="lesson-end sheet">
            {justDone && <Confetti count={34} />}
            {done ? (
              <>
                <Says mood="cheer" size={72}>
                  {U.finishSay}
                </Says>
                <p className="lesson-end__note">{U.nextSoon}</p>
                <Link href="/#muc-luc" className="btn btn--paper">
                  {U.backHome}
                </Link>
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
