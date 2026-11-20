import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy, type DialectTopic } from '../../content/scenes/dialect-table';
import { run, show, type Database, type Dialect } from '../../engine';
import { play } from '../../sfx/sfx';
import './dialect-table.css';

const TOPICS: readonly DialectTopic[] = copy.topics;
const PREVIEW = 3;

type Outcome = { ok: true; columns: string[]; rows: string[][]; total: number } | { ok: false; code: string; friendly: string };

/** Kết quả của bốn lần chạy: hai câu đúng và hai câu viết nhầm dialect. */
interface Ran {
  mysql: Outcome;
  oracle: Outcome;
  /** Câu của Oracle gõ vào MySQL. */
  wrongMysql: Outcome;
  /** Câu của MySQL gõ vào Oracle. */
  wrongOracle: Outcome;
}

function exec(sql: string, db: Database, dialect: Dialect): Outcome {
  const r = run(sql, db, dialect);
  if (!r.ok) return { ok: false, code: r.error.code, friendly: r.error.friendly };
  const { columns, rows } = r.result;
  return { ok: true, columns, rows: rows.slice(0, PREVIEW).map((row) => row.map(show)), total: rows.length };
}

function MiniTable({ out }: { out: Extract<Outcome, { ok: true }> }) {
  if (out.rows.length === 0) return <p className="dlt-none">{copy.noRows}</p>;
  return (
    <div className="dlt-res">
      <div className="dlt-res__scroll" tabIndex={0}>
        <table className="dlt-tbl">
          <thead>
            <tr>
              {out.columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {out.rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {out.total > PREVIEW && <p className="dlt-more">{copy.rowsMore(out.total - PREVIEW)}</p>}
    </div>
  );
}

function Pane({
  dialect,
  sql,
  out,
  wrong,
  wrongLabel,
  same,
}: {
  dialect: 'mysql' | 'oracle';
  sql: string;
  out?: Outcome;
  wrong?: Outcome;
  wrongLabel: string;
  same: boolean;
}) {
  return (
    <section className={`dlt-pane dlt-pane--${dialect}`} aria-label={copy[dialect]}>
      <h4 className="dlt-pane__name">{copy[dialect]}</h4>
      <pre className="dlt-code">{sql}</pre>
      {out && (
        <div className="dlt-out">
          {out.ok ? (
            <MiniTable out={out} />
          ) : (
            <p className="dlt-err">
              <span className="chip dlt-err__code">{out.code}</span> {out.friendly}
            </p>
          )}
          {!same && wrong && (
            <div className="dlt-wrong">
              <p className="dlt-wrong__head">
                <b className="dlt-wrong__label">{copy.mistake}</b>
                {wrongLabel}
              </p>
              {wrong.ok ? (
                <>
                  <p className="dlt-wrong__ok">{copy.mistakeOk}</p>
                  <MiniTable out={wrong} />
                </>
              ) : (
                <p className="dlt-err">
                  <span className="chip dlt-err__code">{wrong.code}</span> {wrong.friendly}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Cảnh "Bảng dialect": cùng một việc, MySQL và Oracle viết khác nhau, viết nhầm thì ra mã lỗi nào. */
export default function DialectTable() {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState<string>(TOPICS[0].id);
  const [seen, setSeen] = useState<string[]>([TOPICS[0].id]);
  const [results, setResults] = useState<Record<string, Ran>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'fail'>('idle');
  const [justRan, setJustRan] = useState(false);
  const dbRef = useRef<Database | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const topic = TOPICS.find((t) => t.id === current) ?? TOPICS[0];
  const same = topic.mysql === topic.oracle;
  const ran = results[topic.id];
  const allSeen = seen.length >= TOPICS.length;

  const pick = (id: string) => {
    play('tap');
    setCurrent(id);
    setJustRan(false);
    setSeen((s) => (s.includes(id) ? s : [...s, id]));
  };

  const go = async () => {
    if (status === 'loading') return;
    play('pop');
    const id = topic.id;
    if (!dbRef.current) {
      setStatus('loading');
      try {
        dbRef.current = (await import('../../data/teashop')).teashop;
      } catch {
        if (alive.current) setStatus('fail');
        return;
      }
      if (!alive.current) return;
    }
    const db = dbRef.current;
    setStatus('idle');
    setResults((r) => ({
      ...r,
      [id]: {
        mysql: exec(topic.mysql, db, 'mysql'),
        oracle: exec(topic.oracle, db, 'oracle'),
        wrongMysql: exec(topic.oracle, db, 'mysql'),
        wrongOracle: exec(topic.mysql, db, 'oracle'),
      },
    }));
    setJustRan(true);
  };

  let mood: Mood = 'idle';
  let hint: string = topic.run ? copy.says.ready : copy.noRun;
  if (justRan && ran) {
    mood = 'happy';
    hint = same ? copy.says.ranSame : copy.says.ran;
  }
  if (allSeen) mood = 'cheer';
  if (status === 'loading') {
    mood = 'think';
    hint = copy.loading;
  } else if (status === 'fail') {
    mood = 'panic';
    hint = copy.loadFail;
  }

  return (
    <div className={`dlt ${reduce ? 'dlt--still' : ''}`}>
      <div className="dlt__top">
        <span className="chip">
          {copy.seen} <b>{`${seen.length}/${TOPICS.length}`}</b>
        </span>
      </div>

      <nav className="dlt__list" aria-label={copy.listLabel}>
        <ul className="dlt__topics">
          {TOPICS.map((t) => (
            <li key={t.id}>
              <button type="button" className="dlt-topic" aria-pressed={t.id === current} data-seen={seen.includes(t.id)} onClick={() => pick(t.id)}>
                {t.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="dlt__main">
        <div className="dlt__card" key={topic.id}>
          <h3 className="dlt__title">{topic.title}</h3>
          <div className="dlt__panes">
            <Pane dialect="mysql" sql={topic.mysql} out={ran?.mysql} wrong={ran?.wrongMysql} wrongLabel={copy.mistakeInMysql} same={same} />
            <Pane dialect="oracle" sql={topic.oracle} out={ran?.oracle} wrong={ran?.wrongOracle} wrongLabel={copy.mistakeInOracle} same={same} />
          </div>
          {topic.run && (
            <div className="dlt__actions">
              <button type="button" className="btn dlt__go" onClick={go} disabled={status === 'loading'}>
                {ran ? copy.rerun : copy.run}
              </button>
              {same && ran && <span className="dlt__same">{copy.sameSql}</span>}
            </div>
          )}
        </div>

        <Says mood={mood} size={56} className="dlt__say">
          <p>
            <Rich text={topic.say} />
          </p>
          <p className="dlt__hint">{allSeen && !justRan ? copy.says.done : hint}</p>
        </Says>
      </div>
    </div>
  );
}
