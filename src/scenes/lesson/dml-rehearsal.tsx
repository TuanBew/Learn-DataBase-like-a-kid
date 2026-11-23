import { HangLines } from '../../components/HangLines';
import { useMemo, useRef, useState } from 'react';
import { DmlView } from '../../components/DmlView';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/dml-rehearsal';
import { uiApp } from '../../content/ui-app';
import { teashop } from '../../data/teashop';
import { type Database, type DmlTrace, type Session, createSession } from '../../engine';
import { play } from '../../sfx/sfx';
import './dml-rehearsal.css';

const LABELS = { more: uiApp.exercise.rehearsal.more, old: uiApp.exercise.rehearsal.old };

/** Bản sao rút gọn của table products: chỉ giữ vài column. */
function makeCopy(): Database {
  const t = teashop.tables.find((x) => x.name === copy.table);
  if (!t) return { name: teashop.name, tables: [] };
  const idx = copy.columns.map((c) => t.columns.findIndex((x) => x.name === c));
  return { name: teashop.name, tables: [{ name: t.name, columns: idx.map((i) => t.columns[i]), rows: t.rows.map((r) => idx.map((i) => r[i])) }] };
}

/** Table lúc chưa có lệnh nào chạy, vẽ bằng cùng khuôn với DmlView. */
function still(db: Database): DmlTrace {
  const t = db.tables[0];
  const rows = t.rows.map((cells, id) => ({ id, cells }));
  return {
    op: 'update',
    dialect: 'mysql',
    sql: '',
    table: t.name,
    columns: t.columns.map((c, i) => ({ key: `c${i}`, header: c.name, type: c.type })),
    before: rows,
    after: rows,
    touched: [],
    changed: [],
    noWhere: false,
    pending: false,
  };
}

type State = { kind: 'idle' } | { kind: 'picked' } | { kind: 'ran'; dml: DmlTrace; say: string } | { kind: 'rolledBack' } | { kind: 'error'; text: string };

/** Cảnh "Diễn tập UPDATE và DELETE": có WHERE thì chỉ vài row đổi, quên WHERE thì mọi row đổi. */
export default function DmlRehearsal() {
  const base = useMemo(makeCopy, []);
  const idle = useMemo(() => still(base), [base]);
  const [presetId, setPresetId] = useState(copy.presets[0].id);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [runs, setRuns] = useState(0);
  const session = useRef<Session | null>(null);

  const preset = copy.presets.find((p) => p.id === presetId) ?? copy.presets[0];

  const pick = (id: string) => {
    play('tap');
    setPresetId(id);
    setState({ kind: 'picked' });
  };

  const run = () => {
    // Mỗi lần chạy dùng một bản sao mới, và chưa lưu thay đổi để còn ROLLBACK được.
    const s = createSession(base, 'mysql');
    s.run('START TRANSACTION');
    const r = s.run(preset.sql);
    session.current = s;
    setRuns((n) => n + 1);
    if (!r.ok) {
      play('bonk');
      setState({ kind: 'error', text: r.error.friendly });
      return;
    }
    if (r.kind !== 'dml') {
      setState({ kind: 'error', text: copy.says.error });
      return;
    }
    play(r.dml.noWhere ? 'alarm' : 'ok');
    setState({ kind: 'ran', dml: r.dml, say: preset.say });
  };

  const rollback = () => {
    session.current?.run('ROLLBACK');
    play('whoosh');
    window.setTimeout(() => play('ting'), 260);
    setRuns((n) => n + 1);
    setState({ kind: 'rolledBack' });
  };

  const dml = state.kind === 'ran' ? state.dml : idle;
  const alarm = state.kind === 'ran' && state.dml.noWhere;
  const rowCount = state.kind === 'ran' ? state.dml.after.length : idle.after.length;

  let say = copy.says.start;
  let mood: Mood = 'idle';
  if (state.kind === 'picked') say = copy.says.picked;
  else if (state.kind === 'ran') {
    say = state.say;
    mood = state.dml.noWhere ? 'panic' : 'happy';
  } else if (state.kind === 'rolledBack') {
    say = copy.says.rolledBack;
    mood = 'cheer';
  } else if (state.kind === 'error') {
    say = state.text;
    mood = 'think';
  }

  return (
    <div className="sk dmr">
      <div className="dmr__top">
        <div className="dmr__presets" role="radiogroup" aria-label={copy.presetsLabel}>
          {copy.presets.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={presetId === p.id} className="sk-pick" onClick={() => pick(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="dmr__sql">
          <span className="sk-label">{copy.sqlLabel}</span>
          <pre className="sk-sql"><HangLines text={preset.sql} /></pre>
          <button type="button" className="btn dmr__run" onClick={run}>
            {copy.run}
          </button>
        </div>
      </div>

      <div className="sk-bar dmr__chips" aria-live="polite">
        <span className="chip dmr__copy">{copy.copyChip}</span>
        <span className="chip">{copy.rowsChip(rowCount)}</span>
        {state.kind === 'ran' && <span className={`chip ${alarm ? 'dmr__hit--alarm' : 'dmr__hit'}`}>{copy.touchedChip(state.dml.touched.length)}</span>}
      </div>

      {alarm && (
        <div className="dmr__alarm" role="alert">
          <span>{copy.alarm}</span>
          <button type="button" className="btn btn--sm dmr__rollback" onClick={rollback}>
            {copy.rollback}
          </button>
        </div>
      )}

      <DmlView key={runs} dml={dml} labels={LABELS} />

      <Says mood={mood} size={56} className="sk-say">
        <Rich text={say} />
      </Says>
    </div>
  );
}
