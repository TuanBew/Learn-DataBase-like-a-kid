import { Link } from 'wouter';
import { Says } from '../components/Mascot';
import { chapters } from '../content/course';
import { exercises } from '../content/exercises';
import { uiApp } from '../content/ui-app';
import { databases } from '../data';
import { useLoad } from '../lib/useLoad';
import { useTitle } from '../lib/useTitle';
import { OrderWork, PredictWork, QuizWork, RehearsalWork } from './exercise/OtherWork';
import { lessonOf } from './exercise/shared';
import { BuildWork } from './exercise/BuildWork';
import { SqlWork } from './exercise/SqlWork';
import './exercise.css';

const U = uiApp.exercise;

export default function ExercisePage({ id }: { id: string }) {
  const exercise = useLoad(exercises[id], `ex:${id}`);
  const sqlEx = exercise && exercise.kind !== 'quiz' && exercise.kind !== 'build' ? exercise : null;
  const db = useLoad(sqlEx ? databases[sqlEx.database] : undefined, `db:${sqlEx?.database ?? ''}`);
  useTitle(exercise?.title);
  const lessonId = lessonOf(id);
  const lesson = chapters.flatMap((c) => c.lessons).find((l) => l.id === lessonId);
  if (exercise === null) {
    return (
      <div className="wrap ex-missing">
        <Says mood="think">{U.notFound}</Says>
        <Link href="/#muc-luc" className="btn btn--paper">
          {uiApp.lesson.backHome}
        </Link>
      </div>
    );
  }
  if (!exercise) return <div className="wrap" style={{ minHeight: '70vh' }} />;
  const wide = exercise.kind === 'build' || sqlEx !== null && sqlEx.kind !== 'order' && sqlEx.kind !== 'predict';
  return (
    <div className={`wrap ex ${wide ? '' : 'ex--narrow'}`} key={id}>
      <header className="ex-top">
        <p className="ex-kicker">
          {U.kicker(exercise.chapter)}
          {lesson && (
            <Link href={`/bai/${lesson.id}`} className="ex-kicker__lesson">
              {U.fromLesson(lesson.title)}
            </Link>
          )}
        </p>
        <h1 className="ex-title">{exercise.title}</h1>
      </header>
      {exercise.kind === 'quiz' && <QuizWork exercise={exercise} />}
      {exercise.kind === 'build' && <BuildWork exercise={exercise} />}
      {sqlEx && !db && <div style={{ minHeight: '60vh' }} />}
      {sqlEx && db && sqlEx.kind === 'order' && <OrderWork exercise={sqlEx} db={db} />}
      {sqlEx && db && sqlEx.kind === 'predict' && <PredictWork exercise={sqlEx} db={db} />}
      {sqlEx && db && sqlEx.kind === 'rehearsal' && <RehearsalWork exercise={sqlEx} db={db} />}
      {sqlEx && db && ['write', 'fill', 'debug', 'translate'].includes(sqlEx.kind) && <SqlWork exercise={sqlEx} db={db} />}
    </div>
  );
}
