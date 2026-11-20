import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { Says, type Mood } from '../../components/Mascot';
import { Rich } from '../../components/Rich';
import { copy } from '../../content/scenes/table-anatomy';
import { play } from '../../sfx/sfx';
import './table-anatomy.css';

type PartId = (typeof copy.parts)[number]['id'];
type Focus = { kind: 'table' } | { kind: 'row'; i: number } | { kind: 'column'; j: number } | { kind: 'cell'; i: number; j: number };

const ROWS = copy.rows.length;
const COLS = copy.columns.length;
const TYPE_CLASS: Record<string, string> = { INT: 'ta__type--int', VARCHAR: 'ta__type--text', DATE: 'ta__type--date' };

function Type({ t }: { t: string }) {
  return <span className={`ta__type ${TYPE_CLASS[t] ?? ''}`}>{t}</span>;
}

/* ---------- Phần 1: gọi tên từng phần ---------- */

function NameParts() {
  const [focus, setFocus] = useState<Focus | null>(null);

  const pickPart = (id: PartId) => {
    play('tap');
    setFocus((f) => {
      if (id === 'table') return { kind: 'table' };
      if (id === 'row') return { kind: 'row', i: f?.kind === 'row' ? (f.i + 1) % ROWS : 1 };
      if (id === 'column') return { kind: 'column', j: f?.kind === 'column' ? (f.j + 1) % COLS : 2 };
      return { kind: 'cell', i: 1, j: f?.kind === 'cell' ? (f.j + 1) % COLS : 2 };
    });
  };

  const lit = (i: number, j: number) => {
    if (!focus) return false;
    if (focus.kind === 'table') return true;
    if (focus.kind === 'row') return focus.i === i;
    if (focus.kind === 'column') return focus.j === j;
    return focus.i === i && focus.j === j;
  };
  const headLit = (j: number) => focus !== null && (focus.kind === 'table' || (focus.kind === 'column' && focus.j === j));

  const say = (() => {
    if (!focus) return copy.startSay;
    if (focus.kind === 'table') return copy.say.table;
    if (focus.kind === 'row') return copy.say.row.replace('{name}', copy.rows[focus.i][1]);
    if (focus.kind === 'column') return copy.say.column.replace('{col}', `\`${copy.columns[focus.j].name}\``);
    return copy.say.cell.replace('{value}', `\`${copy.rows[focus.i][focus.j]}\``);
  })();
  const mood: Mood = focus ? 'happy' : 'idle';
  const active: PartId | null = focus ? focus.kind : null;

  return (
    <div className="ta__part">
      <h4 className="ta__h">{copy.part1Title}</h4>
      <p className="ta__intro">{copy.part1Intro}</p>
      <div className="ta__btns" role="group" aria-label={copy.partsLabel}>
        {copy.parts.map((p) => (
          <button key={p.id} type="button" className="btn btn--sm btn--paper ta__btn" aria-pressed={active === p.id} onClick={() => pickPart(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="ta__wrap">
        <div className={`ta ${focus?.kind === 'table' ? 'ta--lit' : ''}`} role="group" aria-label={`table ${copy.tableName}`}>
          <div className="ta__tname">
            <span className="chip">table {copy.tableName}</span>
          </div>
          <div className="ta__grid ta__grid--head">
            <span className="ta__gutter" aria-hidden="true" />
            {copy.columns.map((c, j) => (
              <button
                key={c.name}
                type="button"
                className={`ta__th${headLit(j) ? ' is-lit' : ''}`}
                aria-pressed={focus?.kind === 'column' && focus.j === j}
                onClick={() => {
                  play('tap');
                  setFocus({ kind: 'column', j });
                }}
              >
                <span className="ta__cname">{c.name}</span>
                <Type t={c.type} />
              </button>
            ))}
          </div>
          {copy.rows.map((r, i) => (
            <div key={r[0]} className="ta__grid">
              <button
                type="button"
                className={`ta__gutter ta__gutter--btn${focus?.kind === 'row' && focus.i === i ? ' is-lit' : ''}`}
                aria-label={`${copy.rowLabel} ${i + 1}`}
                aria-pressed={focus?.kind === 'row' && focus.i === i}
                onClick={() => {
                  play('tap');
                  setFocus({ kind: 'row', i });
                }}
              />
              {r.map((v, j) => (
                <button
                  key={copy.columns[j].name}
                  type="button"
                  className={`ta__cell${lit(i, j) ? ' is-lit' : ''}${j === 0 || j === 2 ? ' ta__cell--num' : ''}`}
                  aria-label={`${v}, ${copy.cellLabel} ${copy.columns[j].name}, row ${i + 1}`}
                  aria-pressed={focus?.kind === 'cell' && focus.i === i && focus.j === j}
                  onClick={() => {
                    play('tap');
                    setFocus({ kind: 'cell', i, j });
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="ta__count">
        <span className="chip">
          <b>{ROWS}</b> {copy.counter.row}
        </span>
        <span className="chip">
          <b>{COLS}</b> {copy.counter.column}
        </span>
      </p>
      <Says mood={mood} size={54} className="ta__say">
        <Rich text={say} />
      </Says>
    </div>
  );
}

/* ---------- Phần 2: thử ghi sai data type ---------- */

type Col2 = 'price' | 'launched_on';
const COL2: { key: Col2; idx: number }[] = [
  { key: 'price', idx: 2 },
  { key: 'launched_on', idx: 3 },
];
type Val = (typeof copy.values)[number];

function TryWrite() {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<{ i: number; col: Col2 } | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [bounce, setBounce] = useState<{ key: string; n: number } | null>(null);
  const [say, setSay] = useState<{ text: string; mood: Mood }>({ text: copy.part2Start, mood: 'idle' });
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const write = (v: Val) => {
    if (!sel) {
      play('bad');
      setSay({ text: copy.chooseFirst, mood: 'think' });
      return;
    }
    const okKind = sel.col === 'price' ? 'int' : 'date';
    const key = `${sel.i}:${sel.col}`;
    if (v.kind === okKind) {
      play('ting');
      setEdits((e) => ({ ...e, [key]: v.label }));
      setBounce(null);
      setSay({ text: copy.accept[sel.col], mood: 'cheer' });
      return;
    }
    play('bonk');
    setBounce((b) => ({ key, n: (b?.n ?? 0) + 1 }));
    const table = copy.reject[sel.col] as Record<string, string>;
    setSay({ text: table[v.kind], mood: 'panic' });
  };

  const changed = Object.keys(edits).length > 0;

  return (
    <div className="ta__part">
      <h4 className="ta__h">{copy.part2Title}</h4>
      <p className="ta__intro">{copy.part2Intro}</p>

      <div className="ta__wrap">
        <div className="ta ta--mini" role="group" aria-label={`table ${copy.tableName}`}>
          <div className="ta__grid ta__grid--mini ta__grid--head">
            <span className="ta__th ta__th--static">
              <span className="ta__cname">{copy.nameHead}</span>
              <Type t="VARCHAR" />
            </span>
            {COL2.map((c) => (
              <span key={c.key} className="ta__th ta__th--static">
                <span className="ta__cname">{c.key}</span>
                <Type t={copy.columns[c.idx].type} />
              </span>
            ))}
          </div>
          {copy.rows.map((r, i) => (
            <div key={r[0]} className="ta__grid ta__grid--mini">
              <span className="ta__cell ta__cell--static">
                {r[1]}
              </span>
              {COL2.map((c) => {
                const key = `${i}:${c.key}`;
                const on = sel?.i === i && sel.col === c.key;
                const val = edits[key] ?? r[c.idx];
                const bad = bounce?.key === key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    className={`ta__cell ta__cell--pick${on ? ' is-lit' : ''}${edits[key] ? ' is-new' : ''}`}
                    aria-pressed={on}
                    aria-label={`${val}, ${copy.cellPickLabel}: ${c.key}, row ${i + 1}`}
                    onClick={() => {
                      play('tap');
                      setSel({ i, col: c.key });
                    }}
                  >
                    <m.span
                      key={bad ? `b${bounce?.n}` : 'n'}
                      className="ta__val"
                      animate={bad && !reduce ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {val}
                    </m.span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ta__vals" role="group" aria-label={copy.valuesLabel}>
        {copy.values.map((v) => (
          <button key={v.id} type="button" className="btn btn--sm btn--paper ta__valbtn" onClick={() => write(v)}>
            {v.label}
          </button>
        ))}
        {changed && (
          <button
            type="button"
            className="ta__reset"
            onClick={() => {
              play('pop');
              setEdits({});
              setBounce(null);
              setSay({ text: copy.part2Start, mood: 'idle' });
            }}
          >
            {copy.reset}
          </button>
        )}
      </div>
      <Says mood={say.mood} size={54} className="ta__say">
        <Rich text={say.text} />
      </Says>
    </div>
  );
}

/** Cảnh "table, row, column": gọi tên từng phần, rồi thử ghi sai data type. */
export default function TableAnatomy() {
  return (
    <div className="tanat">
      <NameParts />
      <TryWrite />
    </div>
  );
}
