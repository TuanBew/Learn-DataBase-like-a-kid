import type { ClauseKind } from '../engine/ast';
import type { Trace, TraceCol, TraceRow } from '../engine/trace';
import type { ColumnType, Value } from '../engine/types';
import { show } from '../engine/values';
import type { SfxName } from '../sfx/sfx';
import { theaterCopy as T } from './copy.vi';

export type RowMark = 'pass' | 'passed' | 'fail' | 'dup' | 'cut' | 'skip';

export interface StageCol {
  key: string;
  header: string;
  type: ColumnType | 'expr';
  state: 'on' | 'dim' | 'new';
  sort?: 'asc' | 'desc';
  /** Con số trong column này chạy từ 0 lên. */
  count?: boolean;
}

export interface StageRow {
  id: number;
  cells: Record<string, Value>;
  mark?: RowMark;
  /** Chữ ghi trên row: lý do đạt hay không đạt, hoặc giá trị dùng để sắp. */
  note?: string;
  /** Màu của nhóm mà row thuộc về, từ 0 tới 5. */
  tone?: number;
  /** Row này đại diện cho cả một chồng row (chế độ gọn). */
  stack?: number;
}

export type Phase = 'written' | 'run' | 'from' | 'where' | 'group' | 'having' | 'select' | 'order' | 'limit' | 'done';

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
  /** Tổng số row đang có, kể cả các row không vẽ ra ở chế độ gọn. */
  count: number;
  /** Chế độ gọn: phần row không vẽ ra, gom thành một khối kèm số đếm. */
  more: { count: number; text: string } | null;
  /** Hộp nhóm của GROUP BY: mỗi hộp ôm một dải row liền nhau. */
  boxes: { label: string; start: number; size: number; tone: number }[];
  /** Table thứ hai đang bay vào để ghép (JOIN). */
  side: { title: string; cols: StageCol[]; rows: StageRow[]; more: number } | null;
  /** id của row đang nằm dưới máy soi. */
  scan: number | null;
  gate: { after: number; closed: boolean; label: string } | null;
  caption: string;
  sfx: { name: SfxName; at?: number }[];
  /** Số mili giây giữ khung hình này ở tốc độ 1x. */
  hold: number;
}

/** Trên số row này thì sân khấu chuyển sang chế độ gọn. */
const BIG = 24;
/** Số row vẽ ra ở chế độ gọn. */
const SHOWN = 10;
const FALL = new Set<RowMark>(['fail', 'dup', 'cut', 'skip']);
const DIALECT = { mysql: 'MySQL', oracle: 'Oracle' } as const;

const toCols = (cols: TraceCol[], state: StageCol['state'] = 'on'): StageCol[] => cols.map((c) => ({ key: c.key, header: c.header, type: c.type, state }));
const toRows = (rows: TraceRow[], cols: TraceCol[]): StageRow[] => rows.map((r) => ({ id: r.id, cells: Object.fromEntries(cols.map((c, i) => [c.key, r.cells[i]])) }));

/** Dựng toàn bộ khung hình của Theater từ trace. Hàm thuần: cùng trace thì cùng kết quả. */
export function buildFrames(trace: Trace): Frame[] {
  const frames: Frame[] = [];
  const runIdx = (...kinds: ClauseKind[]) => trace.clauses.find((c) => kinds.includes(c.kind))?.run ?? null;
  const byRun = [...trace.clauses].sort((a, b) => a.run - b.run);

  let cols: StageCol[] = [];
  let rows: StageRow[] = [];
  let done = 0;

  type Extra = Partial<Frame> & Pick<Frame, 'phase' | 'caption' | 'hold'>;
  const push = (f: Extra) => {
    const big = rows.length > BIG;
    const hidden = big ? rows.slice(SHOWN) : [];
    const live = (list: StageRow[]) => list.filter((r) => !(r.mark && FALL.has(r.mark))).length;
    const fail = hidden.length - live(hidden);
    frames.push({
      rail: 'run',
      big: false,
      active: null,
      done,
      cols,
      scan: null,
      gate: null,
      boxes: [],
      side: null,
      sfx: [],
      ...f,
      rows: big ? rows.slice(0, SHOWN) : rows,
      count: live(rows),
      more: big ? { count: hidden.length, text: fail > 0 ? T.moreVerdict(hidden.length - fail, fail) : T.more(hidden.length) } : null,
    });
  };

  /** Soi từng row (hoặc từng nhóm) theo một danh sách đạt hay không đạt. */
  const scan = (phase: 'where' | 'having', active: number | null, verdicts: { id: number; pass: boolean; reason: string }[], say: { intro: string; pass: (r: string) => string; fail: (r: string) => string; bulk: string }) => {
    const base = rows;
    if (verdicts.length <= BIG) {
      push({ phase, active, caption: say.intro, hold: 1300, sfx: [{ name: 'pop' }] });
      verdicts.forEach((v, i) => {
        const gone = new Set(verdicts.slice(0, i).filter((x) => !x.pass).map((x) => x.id));
        const seen = new Set(verdicts.slice(0, i).map((x) => x.id));
        rows = base
          .filter((r) => !gone.has(r.id))
          .map((r) => (r.id === v.id ? { ...r, mark: v.pass ? 'pass' : 'fail', note: v.reason } : seen.has(r.id) ? { ...r, mark: 'passed' as const } : r));
        push({ phase, active, scan: v.id, caption: v.pass ? say.pass(v.reason) : say.fail(v.reason), hold: v.pass ? 900 : 1800, sfx: v.pass ? [{ name: 'tick' }] : [{ name: 'bonk' }, { name: 'drop', at: 0.95 }] });
      });
    } else {
      const by = new Map(verdicts.map((v) => [v.id, v]));
      rows = base.map((r) => {
        const v = by.get(r.id)!;
        return { ...r, mark: v.pass ? 'passed' : 'fail', note: v.pass ? undefined : v.reason };
      });
      push({ phase, active, caption: say.bulk, hold: 2200, sfx: [{ name: 'whoosh' }, { name: 'drop', at: 0.95 }] });
    }
    const pass = new Set(verdicts.filter((v) => v.pass).map((v) => v.id));
    rows = base.filter((r) => pass.has(r.id)).map((r) => ({ id: r.id, cells: r.cells, stack: r.stack }));
  };

  /* Mở màn: thứ tự viết, rồi thứ tự chạy. */
  push({ phase: 'written', rail: 'written', big: true, caption: T.written, hold: 1500, sfx: [{ name: 'pop' }] });
  push({ phase: 'run', big: true, caption: trace.clauses.length > 1 ? T.run(byRun[0].kind) : T.runSingle, hold: 2400, sfx: [{ name: 'whoosh' }, { name: 'tick', at: 0.45 }] });

  for (const step of trace.steps) {
    switch (step.kind) {
      case 'from': {
        cols = toCols(step.columns);
        rows = toRows(step.rows, step.columns);
        push({ phase: 'from', active: runIdx('FROM'), caption: T.from(step.table, rows.length, cols.length), hold: 1700, sfx: [{ name: 'fly' }] });
        // Còn JOIN thì FROM chưa xong.
        if (!trace.steps.some((s) => s.kind === 'join')) done++;
        break;
      }
      case 'join': {
        const active = runIdx('FROM');
        const sideRows = toRows(step.rightRows, step.rightColumns);
        const side = { title: T.sideTable(step.table), cols: toCols(step.rightColumns), rows: sideRows.slice(0, 6), more: Math.max(0, sideRows.length - 6) };
        push({ phase: 'from', active, side, caption: step.on ? T.joinArrive(step.table, step.on) : T.joinCross(step.table), hold: 2400, sfx: [{ name: 'fly' }] });
        const matches = new Map<number, number>();
        const kept = new Set<number>();
        for (const l of step.links) {
          kept.add(l.left);
          if (l.right !== null) matches.set(l.left, (matches.get(l.left) ?? 0) + 1);
        }
        const lonely = rows.filter((r) => !matches.has(r.id)).length;
        rows = rows.map((r) => {
          const n = matches.get(r.id) ?? 0;
          if (n > 0) return { ...r, mark: 'passed' as const, note: T.joinNote(n) };
          return kept.has(r.id) ? { ...r, mark: 'passed' as const, note: T.joinKeep } : { ...r, mark: 'fail' as const, note: T.joinNote(0) };
        });
        push({
          phase: 'from',
          active,
          side,
          caption: step.joinKind === 'left' ? T.joinLeft(lonely, step.table) : T.joinInner(lonely),
          hold: 2400,
          sfx: lonely > 0 && step.joinKind !== 'left' ? [{ name: 'tick' }, { name: 'drop', at: 0.95 }] : [{ name: 'tick' }],
        });
        cols = toCols(step.columns);
        rows = toRows(step.rows, step.columns);
        const last = trace.steps.filter((s) => s.kind === 'join').pop() === step;
        if (last) done++;
        push({ phase: 'from', active: last ? null : active, caption: T.joinDone(rows.length, cols.length), hold: 1800, sfx: [{ name: 'whoosh' }] });
        break;
      }
      case 'subquery': {
        const values = step.rows.map((r) => show(r[0]));
        const caption = step.scalar ? T.subScalar(values[0] ?? 'NULL') : T.subList(step.total, values.slice(0, 6).join(', ') + (step.total > 6 ? ', ...' : ''));
        push({ phase: 'where', active: runIdx('WHERE', 'HAVING', 'SELECT'), caption, hold: 2400, sfx: [{ name: 'pop' }] });
        break;
      }
      case 'where': {
        const kept = step.verdicts.filter((v) => v.pass).length;
        const dropped = step.verdicts.length - kept;
        scan('where', runIdx('WHERE'), step.verdicts, { intro: T.whereIntro, pass: T.wherePass, fail: T.whereFail, bulk: T.whereBulk(kept, dropped) });
        done++;
        push({ phase: 'where', caption: T.whereDone(kept, dropped), hold: 1500, sfx: [{ name: 'ting' }] });
        break;
      }
      case 'group': {
        const active = runIdx('GROUP BY') ?? runIdx('SELECT');
        const keyCols = step.columns.filter((c) => c.key.startsWith('g'));
        const label = (g: (typeof step.groups)[number]) => keyCols.map((_c, i) => show(g.cells[i])).join(', ');
        const intro = step.implicit ? T.groupImplicit : T.groupIntro(step.keys.join(', '));
        const byId = new Map(rows.map((r) => [r.id, r]));
        const groupRows: StageRow[] = step.groups.map((g, gi) => ({ id: g.id, tone: gi % 6, cells: Object.fromEntries(step.columns.map((c, i) => [c.key, g.cells[i]])) }));
        if (rows.length <= BIG) {
          // Các row đổi chỗ để row cùng nhóm đứng cạnh nhau, mỗi nhóm nằm trong một hộp.
          let start = 0;
          const boxes: Frame['boxes'] = [];
          const arranged: StageRow[] = [];
          step.groups.forEach((g, gi) => {
            boxes.push({ label: label(g) || T.stack(g.rowIds.length), start, size: g.rowIds.length, tone: gi % 6 });
            start += g.rowIds.length;
            for (const id of g.rowIds) arranged.push({ ...byId.get(id)!, tone: gi % 6 });
          });
          rows = arranged;
          push({ phase: 'group', active, boxes, caption: intro, hold: 2600, sfx: [{ name: 'whoosh' }, { name: 'fly', at: 0.5 }] });
          cols = toCols(step.columns).map((c) => (c.key.startsWith('a') ? { ...c, state: 'new' as const, count: true } : c));
          rows = groupRows;
          push({ phase: 'group', active, boxes: step.groups.map((g, gi) => ({ label: T.stack(g.rowIds.length), start: gi, size: 1, tone: gi % 6 })), caption: T.groupDone(step.aggs.join(', ')), hold: 2600, sfx: [{ name: 'pop' }, { name: 'tick', at: 0.6 }] });
        } else {
          // Chế độ gọn: mỗi nhóm là một chồng row kèm số đếm.
          cols = toCols(keyCols);
          rows = groupRows.map((r, gi) => ({ ...r, stack: step.groups[gi].rowIds.length }));
          push({ phase: 'group', active, caption: intro, hold: 2600, sfx: [{ name: 'whoosh' }, { name: 'fly', at: 0.5 }] });
          cols = toCols(step.columns).map((c) => (c.key.startsWith('a') ? { ...c, state: 'new' as const, count: true } : c));
          push({ phase: 'group', active, caption: T.groupDone(step.aggs.join(', ')), hold: 2600, sfx: [{ name: 'pop' }, { name: 'tick', at: 0.6 }] });
        }
        cols = cols.map((c) => ({ key: c.key, header: c.header, type: c.type, state: 'on' as const }));
        rows = rows.map((r) => ({ id: r.id, cells: r.cells, tone: r.tone }));
        if (runIdx('GROUP BY') !== null) done++;
        break;
      }
      case 'having': {
        const kept = step.verdicts.filter((v) => v.pass).length;
        const dropped = step.verdicts.length - kept;
        scan('having', runIdx('HAVING'), step.verdicts, { intro: T.havingIntro, pass: T.havingPass, fail: T.havingFail, bulk: T.havingDone(kept, dropped) });
        done++;
        push({ phase: 'having', caption: T.havingDone(kept, dropped), hold: 1500, sfx: [{ name: 'ting' }] });
        break;
      }
      case 'select': {
        const active = runIdx('SELECT');
        const out = step.columns;
        const cell = new Map(step.rows.map((r) => [r.id, r.cells]));
        const plain = step.dropped.length === 0 && step.computed.length === 0 && out.length === cols.length && out.every((c, i) => cols[i]?.key === c.key);
        if (cols.length === 0) {
          // SELECT không có FROM
          cols = toCols(out, 'new');
          rows = toRows(step.rows, out);
          push({ phase: 'select', active, caption: T.noFrom, hold: 1700, sfx: [{ name: 'pop' }] });
        } else if (plain) {
          cols = toCols(out);
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
          rows = rows.map((r) => ({ id: r.id, tone: r.tone, cells: Object.fromEntries(out.map((c, i) => [c.key, cell.get(r.id)?.[i] ?? null])) }));
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
          // Cổng chỉ vẽ được khi các row đứng trước cổng đều nằm trên sân khấu.
          const gate = (closed: boolean) => (n <= SHOWN || rows.length <= BIG ? { after: n, closed, label } : null);
          push({ phase: 'limit', active, gate: gate(false), caption: T.limitIntro(step.count, kw), hold: 1700, sfx: [{ name: 'pop' }] });
          const cut = new Set(step.cut);
          const before = rows;
          rows = before.map((r) => (cut.has(r.id) ? { ...r, mark: 'cut', note: T.outside } : r));
          push({ phase: 'limit', active, gate: gate(true), caption: T.limitDone(cut.size), hold: 1900, sfx: cut.size > 0 ? [{ name: 'gate' }, { name: 'drop', at: 0.95 }] : [{ name: 'gate' }] });
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
