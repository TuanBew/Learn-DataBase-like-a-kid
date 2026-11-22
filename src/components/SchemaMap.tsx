import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { schemaMaps } from '../content/schema-maps';
import { uiApp } from '../content/ui-app';
import type { Database } from '../engine/types';
import { play } from '../sfx/sfx';
import { type SchemaEdge, type SchemaPath, conditionOf, edgesOf, findPath } from './schema-graph';
import './schema-map.css';

const T = uiApp.schemaMap;

export type SchemaMapMode = 'view' | 'path';
export interface PathPick {
  from: string;
  to: string;
  /** null khi hai table không có đường nối hoặc là cùng một table. */
  path: SchemaPath | null;
}

/** Database nào có sơ đồ xếp tay thì mới vẽ được. */
export const hasSchemaMap = (db: Database | null | undefined): db is Database => !!db && !!schemaMaps[db.name];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Side = 'l' | 'r' | 't' | 'b';
interface Drawn {
  key: string;
  child: string;
  parent: string;
  d: string;
  one: { x: number; y: number };
  many: { x: number; y: number };
}
const NORMAL: Record<Side, [number, number]> = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
const NARROW = '(max-width: 760px)';

/** Tính đường nối từ vị trí thật của các hộp. Nhiều đường chung một cạnh thì chia đều dọc cạnh đó. */
function layoutLines(edges: SchemaEdge[], rects: Record<string, Rect>): Drawn[] {
  const usable = edges.filter((e) => !e.self && rects[e.parent] && rects[e.child]);
  const ends: { edge: number; end: 0 | 1; box: string; side: Side; sort: number }[] = [];
  usable.forEach((e, i) => {
    const a = rects[e.parent];
    const b = rects[e.child];
    const apart = a.x + a.w <= b.x || b.x + b.w <= a.x;
    const sameRow = Math.abs(a.y - b.y) < 8;
    let sa: Side;
    let sb: Side;
    if (apart && (sameRow || Math.abs(a.y - b.y) < Math.max(a.h, b.h))) {
      const aLeft = a.x < b.x;
      sa = aLeft ? 'r' : 'l';
      sb = aLeft ? 'l' : 'r';
    } else {
      const aTop = a.y < b.y;
      sa = aTop ? 'b' : 't';
      sb = aTop ? 't' : 'b';
    }
    const ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    ends.push({ edge: i, end: 0, box: e.parent, side: sa, sort: sa === 'l' || sa === 'r' ? cb.y : cb.x });
    ends.push({ edge: i, end: 1, box: e.child, side: sb, sort: sb === 'l' || sb === 'r' ? ca.y : ca.x });
  });
  const pts: { x: number; y: number; side: Side }[][] = usable.map(() => []);
  const groups = new Map<string, typeof ends>();
  for (const en of ends) {
    const k = `${en.box}|${en.side}`;
    groups.set(k, [...(groups.get(k) ?? []), en]);
  }
  for (const g of groups.values()) {
    g.sort((p, q) => p.sort - q.sort);
    g.forEach((en, i) => {
      const r = rects[en.box];
      const f = (i + 1) / (g.length + 1);
      const p =
        en.side === 'l' ? { x: r.x, y: r.y + r.h * f } : en.side === 'r' ? { x: r.x + r.w, y: r.y + r.h * f } : en.side === 't' ? { x: r.x + r.w * f, y: r.y } : { x: r.x + r.w * f, y: r.y + r.h };
      pts[en.edge][en.end] = { ...p, side: en.side };
    });
  }
  const off = 10;
  return usable.map((e, i) => {
    const [p, q] = pts[i];
    const n1 = NORMAL[p.side];
    const n2 = NORMAL[q.side];
    const k = Math.max(24, Math.hypot(q.x - p.x, q.y - p.y) * 0.4);
    const d = `M${p.x} ${p.y} C${p.x + n1[0] * k} ${p.y + n1[1] * k} ${q.x + n2[0] * k} ${q.y + n2[1] * k} ${q.x} ${q.y}`;
    return { key: e.key, child: e.child, parent: e.parent, d, one: { x: p.x + n1[0] * off, y: p.y + n1[1] * off }, many: { x: q.x + n2[0] * off, y: q.y + n2[1] * off } };
  });
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(NARROW).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

function KeyIcon() {
  return (
    <svg className="sm__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="5" cy="8" r="3.2" fill="var(--mango)" stroke="var(--ink)" strokeWidth="1.6" />
      <path d="M8.2 8 H14.5 M12 8 V11 M14.5 8 V10.5" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg className="sm__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <rect x="1.5" y="5.2" width="8" height="5.6" rx="2.8" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
      <rect x="6.5" y="5.2" width="8" height="5.6" rx="2.8" fill="none" stroke="var(--sky-deep)" strokeWidth="1.6" />
    </svg>
  );
}

interface Props {
  db: Database;
  /** Chế độ lúc mở. Mặc định là xem. */
  mode?: SchemaMapMode;
  /** Ẩn nút đổi chế độ. */
  lockMode?: boolean;
  /** Không in danh sách điều kiện nối. Dùng khi nơi chứa tự đọc kết quả. */
  hideResult?: boolean;
  /** Gọi khi người học chọn đủ hai table (chế độ tìm đường), hoặc khi bỏ chọn (null). */
  onPick?: (pick: PathPick | null) => void;
}

/** Sơ đồ database: mỗi table là một hộp, mỗi foreign key là một đường nối. Xem một table, hoặc tìm đường giữa hai table. */
export function SchemaMap({ db, mode: initialMode = 'view', lockMode = false, hideResult = false, onPick }: Props) {
  const layout = schemaMaps[db.name];
  const narrow = useNarrow();
  const edges = useMemo(() => edgesOf(db), [db]);
  const [mode, setMode] = useState<SchemaMapMode>(initialMode);
  const [sel, setSel] = useState<string | null>(null);
  const [pair, setPair] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const boxes = useRef<Record<string, HTMLDivElement | null>>({});
  const heads = useRef<Record<string, HTMLButtonElement | null>>({});

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board || narrow) return;
    const measure = () => {
      const b = board.getBoundingClientRect();
      const next: Record<string, Rect> = {};
      for (const t of db.tables) {
        const el = boxes.current[t.name];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        next[t.name] = { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
      }
      setRects(next);
      setSize({ w: b.width, h: b.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    Object.values(boxes.current).forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [db, narrow]);

  const lines = useMemo(() => layoutLines(edges, rects), [edges, rects]);
  const path = useMemo(() => (mode === 'path' && pair.length === 2 ? findPath(edges, pair[0], pair[1]) : null), [mode, pair, edges]);

  /* Table sáng và đường nối sáng. */
  const litTables = new Set<string>();
  const litEdges = new Set<string>();
  if (mode === 'view' && sel) {
    litTables.add(sel);
    for (const e of edges) {
      if (e.self) continue;
      if (e.child === sel || e.parent === sel) {
        litEdges.add(e.key);
        litTables.add(e.child);
        litTables.add(e.parent);
      }
    }
  } else if (mode === 'path') {
    pair.forEach((t) => litTables.add(t));
    path?.tables.forEach((t) => litTables.add(t));
    path?.edges.forEach((e) => litEdges.add(e.key));
  }
  const active = litTables.size > 0;

  const changeMode = (m: SchemaMapMode) => {
    if (m === mode) return;
    play('tap');
    setMode(m);
    setSel(null);
    setPair([]);
    onPick?.(null);
  };

  const pick = (name: string) => {
    if (mode === 'view') {
      play(sel === name ? 'tap' : 'pop');
      setSel(sel === name ? null : name);
      return;
    }
    if (pair.length === 1) {
      const next = [pair[0], name];
      setPair(next);
      const p = pair[0] === name ? null : findPath(edges, pair[0], name);
      play(p ? 'ting' : 'bonk');
      onPick?.({ from: pair[0], to: name, path: p });
    } else {
      play('pop');
      setPair([name]);
      if (pair.length === 2) onPick?.(null);
    }
  };

  const clear = () => {
    play('tap');
    setSel(null);
    setPair([]);
    onPick?.(null);
  };

  const jump = useCallback((table: string) => {
    play('whoosh');
    const el = boxes.current[table];
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    heads.current[table]?.focus({ preventScroll: true });
    setFlash(table);
  }, []);
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 1400);
    return () => window.clearTimeout(id);
  }, [flash]);

  /* Dòng trạng thái cho người dùng đọc màn hình và cho mắt. */
  let status: string;
  if (mode === 'view') status = sel ? T.viewing(sel, new Set(edges.filter((e) => !e.self && (e.child === sel || e.parent === sel)).map((e) => (e.child === sel ? e.parent : e.child))).size) : T.hintView;
  else if (pair.length === 0) status = T.hintPath;
  else if (pair.length === 1) status = T.pickSecond(pair[0]);
  else if (pair[0] === pair[1]) status = T.sameTable;
  else if (!path) status = T.noPath;
  else status = T.steps(path.tables.length, path.edges.length);

  return (
    <div className={`sm${narrow ? ' sm--list' : ''}`}>
      <div className="sm__bar">
        {!lockMode && (
          <div className="sm__modes" role="group" aria-label={T.modeGroup}>
            {(['view', 'path'] as const).map((m) => (
              <button key={m} type="button" className="sm__mode" aria-pressed={mode === m} onClick={() => changeMode(m)}>
                {m === 'view' ? T.modeView : T.modePath}
              </button>
            ))}
          </div>
        )}
        {active && (
          <button type="button" className="btn btn--paper btn--sm" onClick={clear}>
            {T.clear}
          </button>
        )}
      </div>

      <p className="sm__status" role="status" aria-live="polite">
        {status}
      </p>

      <div
        className="sm__board"
        ref={boardRef}
        role="group"
        aria-label={T.board}
        style={narrow ? undefined : { gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}
      >
        {db.tables.map((t) => {
          const p = layout.pos[t.name];
          const isEnd = mode === 'path' && pair.includes(t.name);
          const cls = ['sm__box', mode === 'view' && sel === t.name || isEnd ? 'is-sel' : '', active && litTables.has(t.name) && !(mode === 'view' && sel === t.name) && !isEnd ? 'is-near' : '', active && !litTables.has(t.name) ? 'is-dim' : '', flash === t.name ? 'is-flash' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={t.name}
              ref={(el) => {
                boxes.current[t.name] = el;
              }}
              className={cls}
              style={narrow ? undefined : { gridColumn: p?.col, gridRow: p?.row }}
              onClick={() => pick(t.name)}
            >
              <button
                type="button"
                className="sm__name"
                ref={(el) => {
                  heads.current[t.name] = el;
                }}
                aria-pressed={mode === 'view' ? sel === t.name : isEnd}
                aria-label={T.tableLabel(t.name, t.columns.length)}
              >
                {t.name}
              </button>
              {t.columns.map((c) => (
                <span key={c.name} className={`sm__col${c.pk ? ' is-pk' : ''}${c.fk ? ' is-fk' : ''}`}>
                  <span className="sm__slot">{c.pk ? <KeyIcon /> : c.fk ? <LinkIcon /> : null}</span>
                  <span className="sm__cname">{c.name}</span>
                  {narrow && c.fk && (
                    <button
                      type="button"
                      className="sm__jump"
                      aria-label={c.fk.table === t.name ? `${T.jumpTo(c.fk.table, c.fk.column)}. ${T.selfFk}` : T.jumpTo(c.fk.table, c.fk.column)}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        jump(c.fk!.table);
                      }}
                    >
                      → {c.fk.table}.{c.fk.column}
                    </button>
                  )}
                </span>
              ))}
            </div>
          );
        })}
        {!narrow && size.w > 0 && (
          <svg className="sm__lines" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
            {lines.map((l) => {
              const on = litEdges.has(l.key);
              return (
                <g key={l.key} className={`sm__line${on ? ' is-on' : active ? ' is-off' : ''}`}>
                  <path d={l.d} fill="none" />
                  <g className="sm__card">
                    <circle cx={l.one.x} cy={l.one.y} r="7" />
                    <text x={l.one.x} y={l.one.y} textAnchor="middle" dominantBaseline="central">
                      1
                    </text>
                    <circle cx={l.many.x} cy={l.many.y} r="7" />
                    <text x={l.many.x} y={l.many.y} textAnchor="middle" dominantBaseline="central">
                      n
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <ul className="sm__legend">
        <li>
          <KeyIcon /> {T.legendPk}
        </li>
        <li>
          <LinkIcon /> {T.legendFk}
        </li>
      </ul>

      {!hideResult && path && path.edges.length > 0 && (
        <div className="sm__result">
          <p className="sm__rtitle">{T.conditions}</p>
          <ol>
            {path.edges.map((e) => (
              <li key={e.key}>
                <code>{conditionOf(e)}</code>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default SchemaMap;
