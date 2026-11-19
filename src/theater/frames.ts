import type { ClauseKind } from '../engine/ast';
import type { Trace, TraceCol } from '../engine/trace';
import type { ColumnType, Value } from '../engine/types';
import type { SfxName } from '../sfx/sfx';
import { theaterCopy as T } from './copy.vi';

export type RowMark = 'pass' | 'passed' | 'fail' | 'dup' | 'cut' | 'skip';

export interface StageCol {
  key: string;
  header: string;
  type: ColumnType | 'expr';
  state: 'on' | 'dim' | 'new';
  sort?: 'asc' | 'desc';
}

export interface StageRow {
  id: number;
  cells: Record<string, Value>;
  mark?: RowMark;
  /** Chữ ghi trên row: lý do đạt hay không đạt, hoặc giá trị dùng để sắp. */
  note?: string;
}

export type Phase = 'written' | 'run' | 'from' | 'where' | 'select' | 'order' | 'limit' | 'done';

export interface Frame {
  phase: Phase;
  /** Các clause đang xếp theo thứ tự viết hay thứ tự chạy. */
  rail: 'written' | 'run';
  /** Các clause đang hiện to giữa sân khấu. */
  big: boolean;
  /** Clause đang chạy, tính theo thứ tự chạy. null là chưa chạy hoặc đã xong. */
  active: number | null;
  /** Số clause đã chạy xong. */
  done: number;
  cols: StageCol[];
  rows: StageRow[];
  /** id của row đang nằm dưới máy soi. */
  scan: number | null;
  gate: { after: number; closed: boolean; label: string } | null;
  caption: string;
  sfx: { name: SfxName; at?: number }[];
  /** Số mili giây giữ khung hình này ở tốc độ 1x. */
  hold: number;
}

/** Trên số row này thì máy soi không đi từng row nữa. */
const SLOW_SCAN_MAX = 24;

const DIALECT = { mysql: 'MySQL', oracle: 'Oracle' } as const;

function toCols(cols: TraceCol[], state: StageCol['state'] = 'on'): StageCol[] {
  return cols.map((c) => ({ key: c.key, header: c.header, type: c.type, state }));
}

/** Dựng toàn bộ khung hình của Theater từ trace. Hàm thuần: cùng trace thì cùng kết quả. */
export function buildFrames(trace: Trace): Frame[] {
  const frames: Frame[] = [];
  const runIdx = (...kinds: ClauseKind[]) => trace.clauses.find((c) => kinds.includes(c.kind))?.run ?? null;
  const byRun = [...trace.clauses].sort((a, b) => a.run - b.run);

  let cols: StageCol[] = [];
  let rows: StageRow[] = [];
  let done = 0;

  const push = (f: Partial<Frame> & Pick<Frame, 'phase' | 'caption' | 'hold'>) => {
    frames.push({
      rail: 'run',
      big: false,
      active: null,
      done,
      cols,
      rows,
      scan: null,
      gate: null,
      sfx: [],
      ...f,
    });
  };

  /* Mở màn: thứ tự viết, rồi thứ tự chạy. */
  push({ phase: 'written', rail: 'written', big: true, caption: T.written, hold: 1500, sfx: [{ name: 'pop' }] });
  push({
    phase: 'run',
    big: true,
    caption: trace.clauses.length > 1 ? T.run(byRun[0].kind) : T.runSingle,
    hold: 2400,
    sfx: [{ name: 'whoosh' }, { name: 'tick', at: 0.45 }],
  });

  for (const step of trace.steps) {
    switch (step.kind) {
      case 'from': {
        cols = toCols(step.columns);
        rows = step.rows.map((r) => ({ id: r.id, cells: Object.fromEntries(step.columns.map((c, i) => [c.key, r.cells[i]])) }));
        push({ phase: 'from', active: runIdx('FROM'), caption: T.from(step.table, rows.length, cols.length), hold: 1700, sfx: [{ name: 'fly' }] });
        done++;
        break;
      }
      case 'where': {
        const active = runIdx('WHERE');
        const kept = step.verdicts.filter((v) => v.pass).length;
        const dropped = step.verdicts.length - kept;
        const base = rows;
        if (step.verdicts.length <= SLOW_SCAN_MAX) {
          push({ phase: 'where', active, caption: T.whereIntro, hold: 1300, sfx: [{ name: 'pop' }] });
          step.verdicts.forEach((v, i) => {
            const gone = new Set(step.verdicts.slice(0, i).filter((x) => !x.pass).map((x) => x.id));
            const seen = new Set(step.verdicts.slice(0, i).map((x) => x.id));
            rows = base
              .filter((r) => !gone.has(r.id))
              .map((r) => (r.id === v.id ? { ...r, mark: v.pass ? 'pass' : 'fail', note: v.reason } : seen.has(r.id) ? { ...r, mark: 'passed' as const } : r));
            push({
              phase: 'where',
              active,
              scan: v.id,
              caption: v.pass ? T.wherePass(v.reason) : T.whereFail(v.reason),
              hold: v.pass ? 900 : 1800,
              sfx: v.pass ? [{ name: 'tick' }] : [{ name: 'bonk' }, { name: 'drop', at: 0.95 }],
            });
          });
        } else {
          rows = base.map((r) => {
            const v = step.verdicts.find((x) => x.id === r.id)!;
            return { ...r, mark: v.pass ? 'passed' : 'fail', note: v.pass ? undefined : v.reason };
          });
          push({ phase: 'where', active, caption: T.whereBulk(kept, dropped), hold: 1900, sfx: [{ name: 'whoosh' }, { name: 'drop', at: 0.95 }] });
        }
        const pass = new Set(step.verdicts.filter((v) => v.pass).map((v) => v.id));
        rows = base.filter((r) => pass.has(r.id));
        done++;
        push({ phase: 'where', caption: T.whereDone(kept, dropped), hold: 1500, sfx: [{ name: 'ting' }] });
        break;
      }
      case 'select': {
        const active = runIdx('SELECT');
        const out = step.columns;
        const cell = new Map(step.rows.map((r) => [r.id, r.cells]));
        const plain = step.dropped.length === 0 && step.computed.length === 0 && out.every((c, i) => cols[i]?.key === c.key && cols.length === out.length);
        if (cols.length === 0) {
          // SELECT không có FROM
          cols = toCols(out, 'new');
          rows = step.rows.map((r) => ({ id: r.id, cells: Object.fromEntries(out.map((c, i) => [c.key, r.cells[i]])) }));
          push({ phase: 'select', active, caption: T.noFrom, hold: 1700, sfx: [{ name: 'pop' }] });
        } else if (plain) {
          push({ phase: 'select', active, caption: T.selectStar, hold: 1500, sfx: [{ name: 'tick' }] });
        } else {
          if (step.dropped.length > 0) {
            const gone = new Set(step.dropped);
            cols = cols.map((c) => (gone.has(c.key) ? { ...c, state: 'dim' } : c));
            const keptNames = out.filter((c) => !step.computed.includes(c.key)).map((c) => c.header);
            push({ phase: 'select', active, caption: T.selectDim(keptNames.join(', ')), hold: 1600, sfx: [{ name: 'pop' }] });
          }
          const hasNew = step.computed.length > 0;
          cols = out.map((c) => ({ key: c.key, header: c.header, type: c.type, state: step.computed.includes(c.key) ? 'new' : 'on' }));
          rows = rows.map((r) => ({ id: r.id, cells: Object.fromEntries(out.map((c, i) => [c.key, cell.get(r.id)?.[i] ?? null])) }));
          push({
            phase: 'select',
            active,
            caption: hasNew ? T.selectComputed(out.filter((c) => step.computed.includes(c.key)).map((c) => c.header).join(', ')) : T.selectDone(out.length),
            hold: 1600,
            sfx: [{ name: 'whoosh' }],
          });
        }
        cols = cols.map((c) => ({ ...c, state: 'on' }));
        if (step.duplicates.length > 0) {
          const dup = new Set(step.duplicates);
          const before = rows;
          rows = before.map((r) => (dup.has(r.id) ? { ...r, mark: 'dup', note: T.duplicate } : r));
          push({ phase: 'select', active, caption: T.distinct(dup.size), hold: 1700, sfx: [{ name: 'bonk' }, { name: 'drop', at: 0.95 }] });
          rows = before.filter((r) => !dup.has(r.id));
        }
        done++;
        break;
      }
      case 'order': {
        const active = runIdx('ORDER BY');
        const first = step.keys[0];
        const hidden = new Map(step.hidden.map((h) => [h.id, h.text]));
        cols = cols.map((c) => {
          const k = step.keys.find((x) => x.col === c.key);
          return k ? { ...c, sort: k.desc ? 'desc' : 'asc' } : c;
        });
        rows = rows.map((r) => ({ id: r.id, cells: r.cells, note: hidden.get(r.id) }));
        push({ phase: 'order', active, caption: T.orderIntro(first.text, first.desc), hold: 1700, sfx: [{ name: 'pop' }] });
        const moved = step.before.some((id, i) => step.after[i] !== id);
        const byId = new Map(rows.map((r) => [r.id, r]));
        rows = step.after.map((id) => byId.get(id)!);
        const nulls = step.nulls ? ` ${T.orderNulls(step.nulls, DIALECT[trace.dialect])}` : '';
        push({ phase: 'order', active, caption: (moved ? T.orderDone : T.orderSame) + nulls, hold: 2000, sfx: moved ? [{ name: 'whoosh' }] : [{ name: 'tick' }] });
        cols = cols.map(({ sort: _sort, ...c }) => c);
        rows = rows.map((r) => ({ id: r.id, cells: r.cells }));
        done++;
        break;
      }
      case 'limit': {
        const active = runIdx('LIMIT', 'FETCH');
        const kw = step.style === 'limit' ? 'LIMIT' : 'FETCH FIRST';
        if (step.skipped.length > 0) {
          const skip = new Set(step.skipped);
          const before = rows;
          rows = before.map((r) => (skip.has(r.id) ? { ...r, mark: 'skip', note: T.skipped } : r));
          push({ phase: 'limit', active, caption: T.offset(skip.size), hold: 1700, sfx: [{ name: 'bonk' }, { name: 'drop', at: 0.95 }] });
          rows = before.filter((r) => !skip.has(r.id));
        }
        if (step.count !== null) {
          const n = step.kept.length;
          const label = T.gate(step.count);
          push({ phase: 'limit', active, gate: { after: n, closed: false, label }, caption: T.limitIntro(step.count, kw), hold: 1700, sfx: [{ name: 'pop' }] });
          const cut = new Set(step.cut);
          const before = rows;
          rows = before.map((r) => (cut.has(r.id) ? { ...r, mark: 'cut', note: T.outside } : r));
          push({
            phase: 'limit',
            active,
            gate: { after: n, closed: true, label },
            caption: T.limitDone(cut.size),
            hold: 1900,
            sfx: cut.size > 0 ? [{ name: 'gate' }, { name: 'drop', at: 0.95 }] : [{ name: 'gate' }],
          });
          rows = before.filter((r) => !cut.has(r.id));
        }
        done++;
        break;
      }
    }
  }

  push({ phase: 'done', caption: T.done(trace.result.rows.length, trace.result.columns.length), hold: 1600, sfx: [{ name: 'ting' }] });
  return frames;
}

/** Khung hình đầu tiên của từng clause, tính theo thứ tự chạy. Dùng khi người học bấm vào một clause. */
export function firstFrameOf(frames: Frame[], run: number): number {
  const i = frames.findIndex((f) => f.active === run);
  return i < 0 ? frames.length - 1 : i;
}
