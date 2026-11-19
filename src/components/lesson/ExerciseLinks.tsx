import { Link } from 'wouter';

/** Tạm thời: lối sang bài tập của bài. */
export function ExerciseLinks({ ids }: { ids: string[] }) {
  return (
    <p>
      {ids.map((id) => (
        <Link key={id} href={`/tap/${id}`} className="btn btn--sm btn--paper">
          {id}
        </Link>
      ))}
    </p>
  );
}
