import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import { Confetti } from '../../components/Confetti';
import { Icon } from '../../components/Icon';
import { Mascot, Says } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { SchemaChips } from '../../components/sql/parts';
import { exerciseMap } from '../../content/exercise-map';
import { exercises } from '../../content/exercises';
import type { Exercise } from '../../content/types';
import { uiApp } from '../../content/ui-app';
import type { Database, Dialect } from '../../engine/types';
import { BOSS_IDS } from '../../lib/certificate';
import { play } from '../../sfx/sfx';

const U = uiApp.exercise;

/** Bài học mà bài tập này thuộc về. */
export function lessonOf(id: string): string | null {
  for (const [lesson, ids] of Object.entries(exerciseMap)) if (ids.includes(id)) return lesson;
  return null;
}

/**
 * Bài tập đứng ngay sau bài này trong cùng bài học, nếu có.
 * Không nhảy sang bài tập của bài học khác: người học chưa học lý thuyết của bài đó.
 */
export function nextExerciseId(id: string): string | null {
  const lesson = lessonOf(id);
  if (!lesson) return null;
  const ids = exerciseMap[lesson];
  const next = ids[ids.indexOf(id) + 1];
  return next && next in exercises ? next : null;
}

/** Thẻ đề bài: lời Bi, các yêu cầu, và dữ liệu của bài. */
export function TaskCard({ exercise, db, dialect }: { exercise: Exercise; db?: Database; dialect?: Dialect }) {
  const note = U.kindNote[exercise.kind];
  const tables = db && exercise.kind !== 'quiz' && exercise.kind !== 'build' ? db.tables.filter((t) => exercise.tables.includes(t.name)) : [];
  return (
    <section className="ex-task sheet" aria-labelledby="ex-task">
      <h2 id="ex-task" className="ex-h">
        {U.task}
      </h2>
      <div className="ex-task__say">
        <Mascot size={56} mood="idle" />
        <p>
          <Rich text={exercise.prompt} />
        </p>
      </div>
      {exercise.asks.length > 0 && (
        <ul className="ex-asks">
          {exercise.asks.map((a) => (
            <li key={a}>
              <Rich text={a} />
            </li>
          ))}
        </ul>
      )}
      {note && <p className="ex-kindnote pen">{note}</p>}
      {tables.length > 0 && dialect && (
        <div className="ex-data">
          <h3 className="ex-h ex-h--sm">{U.data}</h3>
          <SchemaChips tables={tables} dialect={dialect} />
        </div>
      )}
    </section>
  );
}

/** Thẻ ăn mừng khi làm đúng. Bài boss thì ăn mừng cả chương. */
export function DoneCard({ exercise, why, children, actions }: { exercise: Exercise; why: string; children?: ReactNode; actions?: ReactNode }) {
  const boss = exercise.id.endsWith('-boss');
  const next = nextExerciseId(exercise.id);
  const lesson = lessonOf(exercise.id);
  useEffect(() => {
    play(boss ? 'chapter' : 'ok');
  }, [boss]);
  return (
    <section className={`ex-verdict ex-verdict--ok sheet ${boss ? 'ex-verdict--boss' : ''}`}>
      <Confetti count={boss ? 44 : 28} />
      <h2 className="ex-verdict__title">
        <span className="pen ex-stamp">10</span>
        {boss ? U.chapterDone(exercise.chapter) : U.correctTitle}
      </h2>
      <Says mood="cheer" size={72}>
        <Rich text={why} />
        {boss && <span className="ex-verdict__boss"> {U.chapterSay(exercise.chapter)}</span>}
      </Says>
      {children}
      <div className="ex-verdict__actions">
        {actions}
        {next && (
          <Link href={`/tap/${next}`} className="btn btn--sm">
            {U.next}
            <Icon name="arrow" size={18} />
          </Link>
        )}
        {boss && exercise.id === BOSS_IDS[BOSS_IDS.length - 1] && (
          <Link href="/chung-nhan" className="btn btn--sm btn--matcha">
            {U.certificate}
            <Icon name="arrow" size={18} />
          </Link>
        )}
        {lesson ? (
          <Link href={`/bai/${lesson}`} className={`btn btn--sm ${next ? 'btn--paper' : ''}`}>
            {U.backLesson}
            {!next && <Icon name="arrow" size={18} />}
          </Link>
        ) : (
          <Link href="/#muc-luc" className="btn btn--sm btn--paper">
            {U.backToc}
          </Link>
        )}
      </div>
    </section>
  );
}
