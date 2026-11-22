import { useState } from 'react';
import { Says, type Mood } from '../../components/Mascot';
import { SchemaMap, type PathPick } from '../../components/SchemaMap';
import { conditionOf } from '../../components/schema-graph';
import { copy } from '../../content/scenes/schema-path';
import { company } from '../../data/company';
import { play } from '../../sfx/sfx';
import './schema-path.css';

type Note = { kind: 'wait'; table: string } | { kind: 'wrong' } | { kind: 'found'; pick: PathPick };

/** Cảnh "Tìm đường nối": ba nhiệm vụ nhỏ trên sơ đồ database công ty. */
export default function SchemaPath() {
  const [n, setN] = useState(0);
  const [round, setRound] = useState(0);
  const [note, setNote] = useState<Note | null>(null);
  const [done, setDone] = useState(false);
  const mission = copy.missions[n];
  const total = copy.missions.length;

  const onPick = (pick: PathPick | null) => {
    if (!pick) {
      setNote(null);
      return;
    }
    const ok = [pick.from, pick.to].sort().join() === [mission.from, mission.to].sort().join() && pick.path;
    if (ok) {
      play('ok');
      setNote({ kind: 'found', pick });
      if (n === total - 1) setDone(true);
    } else {
      play('bad');
      setNote({ kind: 'wrong' });
    }
  };

  const reset = () => {
    play('tap');
    setN(0);
    setRound((r) => r + 1);
    setNote(null);
    setDone(false);
  };
  const next = () => {
    play('tap');
    setN(n + 1);
    setRound((r) => r + 1);
    setNote(null);
  };

  const found = note?.kind === 'found' ? note.pick.path : null;
  const mood: Mood = done ? 'cheer' : note?.kind === 'found' ? 'happy' : note?.kind === 'wrong' ? 'think' : 'idle';

  return (
    <div className="spath" role="group" aria-label={copy.ariaScene}>
      <SchemaMap key={round} db={company} mode="path" lockMode hideResult onPick={onPick} />
      <Says mood={mood} size={54} className="spath__say">
        <p className="spath__lead">{mission && copy.mission(n + 1, total, mission.from, mission.to)}</p>
        {note?.kind === 'wrong' && <p>{copy.wrong(mission.from, mission.to)}</p>}
        {found && (
          <>
            <p>{copy.found(found.tables.length, found.edges.length)}</p>
            <p>{copy.readLead}</p>
            <ol className="spath__conds">
              {found.edges.map((e) => (
                <li key={e.key}>
                  <code>{conditionOf(e)}</code>
                </li>
              ))}
            </ol>
          </>
        )}
        {done && <p>{copy.allDone}</p>}
      </Says>
      <div className="sk-bar">
        {found && !done && (
          <button type="button" className="btn btn--sm" onClick={next}>
            {copy.next}
          </button>
        )}
        <button type="button" className="btn btn--paper btn--sm" onClick={reset}>
          {copy.reset}
        </button>
      </div>
    </div>
  );
}
