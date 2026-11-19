import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Says } from '../../components/Mascot';
import { copy } from '../../content/scenes/erd';
import { teashop } from '../../data/teashop';
import { play } from '../../sfx/sfx';
import './erd.css';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Side = 'l' | 'r' | 't' | 'b';
interface Edge {
  key: string;
  child: string;
  parent: string;
}
interface Drawn {
  key: string;
  child: string;
  parent: string;
  d: string;
  one: { x: number; y: number };
  many: { x: number; y: number };
}

const NORMAL: Record<Side, [number, number]> = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
const RELATIONS: Record<string, { parent: string; child: string }> = copy.relations;

/** Mỗi foreign key là một quan hệ: table giữ foreign key ở phía n, table được trỏ tới ở phía 1. */
const edges: Edge[] = teashop.tables.flatMap((t) =>
  t.columns.filter((c) => c.fk).map((c) => ({ key: `${t.name}.${c.name}`, child: t.name, parent: c.fk!.table })),
);

const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Tính đường nối từ vị trí thật của các hộp. Nhiều đường chung một cạnh thì chia đều dọc cạnh đó. */
function layout(rects: Record<string, Rect>): Drawn[] {
  const usable = edges.filter((e) => rects[e.parent] && rects[e.child]);
  const ends: { edge: number; end: 0 | 1; box: string; side: Side; sort: number }[] = [];
  usable.forEach((e, i) => {
    const a = rects[e.parent];
    const b = rects[e.child];
    const apart = a.x + a.w <= b.x || b.x + b.w <= a.x;
    let sa: Side;
    let sb: Side;
    if (apart) {
      const aLeft = a.x < b.x;
      sa = aLeft ? 'r' : 'l';
      sb = aLeft ? 'l' : 'r';
    } else {
      const aTop = a.y < b.y;
      sa = aTop ? 'b' : 't';
      sb = aTop ? 't' : 'b';
    }
    const ca = center(a);
    const cb = center(b);
    ends.push({ edge: i, end: 0, box: e.parent, side: sa, sort: sa === 'l' || sa === 'r' ? cb.y : cb.x });
    ends.push({ edge: i, end: 1, box: e.child, side: sb, sort: sb === 'l' || sb === 'r' ? ca.y : ca.x });
  });

  const pts: { x: number; y: number; side: Side }[][] = usable.map(() => []);
  const groups = new Map<string, typeof ends>();
  for (const en of ends) {
    const g = groups.get(`${en.box}|${en.side}`) ?? [];
    g.push(en);
    groups.set(`${en.box}|${en.side}`, g);
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

  const off = 11;
  return usable.map((e, i) => {
    const [p, q] = pts[i];
    const n1 = NORMAL[p.side];
    const n2 = NORMAL[q.side];
    const k = Math.max(22, Math.hypot(q.x - p.x, q.y - p.y) * 0.4);
    const d = `M${p.x} ${p.y} C${p.x + n1[0] * k} ${p.y + n1[1] * k} ${q.x + n2[0] * k} ${q.y + n2[1] * k} ${q.x} ${q.y}`;
    return {
      key: e.key,
      child: e.child,
      parent: e.parent,
      d,
      one: { x: p.x + n1[0] * off, y: p.y + n1[1] * off },
      many: { x: q.x + n2[0] * off, y: q.y + n2[1] * off },
    };
  });
}

function KeyIcon() {
  return (
    <svg className="erd__icon" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label={copy.pkLabel}>
      <circle cx="5" cy="8" r="3.2" fill="var(--mango)" stroke="var(--ink)" strokeWidth="1.6" />
      <path d="M8.2 8 H14.5 M12 8 V11 M14.5 8 V10.5" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="erd__icon" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label={copy.fkLabel}>
      <rect x="1.5" y="5.2" width="8" height="5.6" rx="2.8" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
      <rect x="6.5" y="5.2" width="8" height="5.6" rx="2.8" fill="none" stroke="var(--sky-deep)" strokeWidth="1.6" />
    </svg>
  );
}

/** Cảnh "Sơ đồ ERD": sáu table của tiệm trà sữa, bấm một table để xem nó nối với ai. */
export default function Erd() {
  const [sel, setSel] = useState<string | null>(null);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const boxes = useRef<Record<string, HTMLButtonElement | null>>({});

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const measure = () => {
      const b = board.getBoundingClientRect();
      const next: Record<string, Rect> = {};
      for (const t of teashop.tables) {
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
  }, []);

  const lines = useMemo(() => layout(rects), [rects]);
  const related = (key: string) => {
    const l = lines.find((x) => x.key === key);
    return !!l && sel !== null && (l.child === sel || l.parent === sel);
  };
  const near = new Set<string>();
  if (sel) {
    near.add(sel);
    for (const e of edges) {
      if (e.child === sel) near.add(e.parent);
      if (e.parent === sel) near.add(e.child);
    }
  }
  const active = edges.filter((e) => sel !== null && (e.child === sel || e.parent === sel));

  const pick = (name: string) => {
    if (sel === name) {
      play('tap');
      setSel(null);
    } else {
      play('pop');
      setSel(name);
    }
  };

  return (
    <div className="erd">
      <div className="erd__board" ref={boardRef} role="group" aria-label={copy.ariaBoard}>
        {teashop.tables.map((t) => (
          <button
            key={t.name}
            type="button"
            ref={(el) => {
              boxes.current[t.name] = el;
            }}
            className={`erd__box erd__box--${t.name}${sel === t.name ? ' is-sel' : ''}${sel && !near.has(t.name) ? ' is-dim' : ''}${sel && sel !== t.name && near.has(t.name) ? ' is-near' : ''}`}
            aria-pressed={sel === t.name}
            onClick={() => pick(t.name)}
          >
            <span className="erd__name">{t.name}</span>
            {t.columns.map((c) => (
              <span key={c.name} className={`erd__col${c.pk ? ' is-pk' : ''}${c.fk ? ' is-fk' : ''}`}>
                <span className="erd__slot">{c.pk ? <KeyIcon /> : c.fk ? <LinkIcon /> : null}</span>
                <span className="erd__cname">{c.name}</span>
              </span>
            ))}
          </button>
        ))}
        {size.w > 0 && (
          <svg className="erd__lines" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
            {lines.map((l) => {
              const on = related(l.key);
              const cls = `erd__line${on ? ' is-on' : sel ? ' is-off' : ''}`;
              return (
                <g key={l.key} className={cls}>
                  <path d={l.d} fill="none" />
                  <g className="erd__card">
                    <circle cx={l.one.x} cy={l.one.y} r="8" />
                    <text x={l.one.x} y={l.one.y} textAnchor="middle" dominantBaseline="central">
                      1
                    </text>
                    <circle cx={l.many.x} cy={l.many.y} r="8" />
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

      <ul className="erd__legend">
        <li>
          <KeyIcon /> {copy.legendPk}
        </li>
        <li>
          <LinkIcon /> {copy.legendFk}
        </li>
        <li>
          <b>1</b> {copy.legendOne}, <b>n</b> {copy.legendMany}
        </li>
      </ul>

      <Says mood={sel ? 'happy' : 'idle'} size={54} className="erd__say">
        {sel ? (
          <>
            <p className="erd__lead">{copy.selected(sel, active.length)}</p>
            <ul className="erd__says">
              {active.map((e) => (
                <li key={e.key}>{sel === e.parent ? RELATIONS[e.key]?.parent : RELATIONS[e.key]?.child}</li>
              ))}
            </ul>
            <p className="erd__hint">{copy.hint}</p>
          </>
        ) : (
          <p>{copy.idle}</p>
        )}
      </Says>
    </div>
  );
}
