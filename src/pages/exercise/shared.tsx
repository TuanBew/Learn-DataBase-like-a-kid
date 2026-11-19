import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import { Confetti } from '../../components/Confetti';
import { Icon } from '../../components/Icon';
import { Mascot, Says } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { SchemaChips } from '../../components/sql/parts';
import { exercises } from '../../content/exercises';
import type { Exercise } from '../../content/types';
import { uiApp } from '../../content/ui-app';
import type { Database, Dialect } from '../../engine/types';
import { play } from '../../sfx/sfx';

const U = uiApp.exercise;

/** Bài tập đứng ngay sau bài này trong cùng chương, nếu có. */
export function nextExerciseId(id: string): string | null {
  const m = /^(c\d+)-e(\d+)$/.exec(id);
  if (!m) return null;
  const next = `${m[1]}-e${Number(m[2]) + 1}`;
  if (next in exercises) return next;
  return `${m[1]}-boss` in exercises ? `${m[1]}-boss` : null;
}

/** Thẻ đề bài: lời Bi, các yêu cầu, và dữ liệu của bài. */
export function TaskCard({ exercise, db, dialect }: { exercise: Exercise; db?: Database; dialect?: Dialect }) {
  const note = U.kindNote[exercise.kind];
  const tables = db && exercise.kind !== 'quiz' ? db.tables.filter((t) => exercise.tables.includes(t.name)) : [];
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
        {boss && exercise.chapter === 7 && (
          <Link href="/chung-nhan" className="btn btn--sm btn--matcha">
            {U.certificate}
            <Icon name="arrow" size={18} />
          </Link>
        )}
        <Link href="/#muc-luc" className="btn btn--sm btn--paper">
          {U.backToc}
        </Link>
      </div>
    </section>
  );
}
