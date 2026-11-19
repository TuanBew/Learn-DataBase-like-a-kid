import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { exercises } from '../../content/exercises';
import { uiLesson } from '../../content/ui-lesson';
import { useProgress } from '../../lib/progress';
import './exercise-links.css';

function Tick() {
  return (
    <svg className="exlink__tick" viewBox="0 0 28 28" width="24" height="24" role="img" aria-label={uiLesson.exerciseDone}>
      <path d="M4 15 Q8 17 11 23 Q15 11 25 4" fill="none" stroke="var(--red)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Thẻ link tới một bài tập. Tên bài tải khi cần, trong lúc chờ hiện id. */
function ExerciseCard({ id }: { id: string }) {
  const progress = useProgress();
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    exercises[id]?.().then((e) => alive && setTitle(e.title));
    return () => {
      alive = false;
    };
  }, [id]);
  const done = progress.exercises[id] !== undefined;
  return (
    <li>
      <Link href={`/tap/${id}`} className={`exlink${done ? ' is-done' : ''}`}>
        <span className="exlink__name">{title ?? id}</span>
        {id.endsWith('-boss') && <span className="chip exlink__boss">{uiLesson.exerciseBoss}</span>}
        {done && <Tick />}
      </Link>
    </li>
  );
}

/** Lối sang các bài tập của bài học. */
export function ExerciseLinks({ ids }: { ids: string[] }) {
  const valid = ids.filter((id) => exercises[id]);
  if (valid.length === 0) return null;
  return (
    <section className="lb exlinks">
      <h3 className="exlinks__title">{uiLesson.exerciseLinks}</h3>
      <ul className="exlinks__list">
        {valid.map((id) => (
          <ExerciseCard key={id} id={id} />
        ))}
      </ul>
    </section>
  );
}
