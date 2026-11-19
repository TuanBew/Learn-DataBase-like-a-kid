import { useEffect, useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { show } from '../engine/values';
import { Icon } from '../components/Icon';
import type { Frame, StageRow } from './frames';
import { layoutCols } from './layout';

const FALLING = new Set(['fail', 'dup', 'cut', 'skip']);

interface Props {
  frame: Frame;
  width: number;
  focus: Set<string>;
  speed: number;
  reduced: boolean;
  emptyText: string;
}

/** Con số chạy từ 0 lên, dùng khi một hộp nhóm thu lại thành một row. */
function CountUp({ to, t }: { to: number; t: number }) {
  const [v, setV] = useState(t === 0 ? to : 0);
  useEffect(() => {
    if (t === 0) {
      setV(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / (750 * t));
      setV(k === 1 ? to : Math.round(to * k * (2 - k)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, t]);
  return <>{show(v)}</>;
}

/**
 * Sân khấu: mỗi row là một thanh giấy có vị trí tính sẵn.
 * Vị trí chỉ phụ thuộc vào khung hình, nên lùi hay tới đều ra đúng một cảnh.
 */
export function Stage({ frame, width, focus, speed, reduced, emptyText }: Props) {
  const narrow = width < 560;
  const rowH = narrow ? 30 : 34;
  const gap = narrow ? 5 : 6;
  const headH = narrow ? 26 : 30;
  const gateSpace = narrow ? 22 : 26;
  const boxTop = frame.boxes.length > 0 ? 20 : 0;

  const boxes = useMemo(() => layoutCols(frame.cols, width, focus), [frame.cols, width, focus]);
  const boxOf = useMemo(() => new Map(boxes.map((b) => [b.key, b])), [boxes]);

  const yOf = (index: number) => {
    const before = frame.boxes.filter((b) => b.start <= index).length;
    return headH + gap + index * (rowH + gap) + before * boxTop + (frame.gate && index >= frame.gate.after ? gateSpace : 0);
  };
  const moreH = frame.more ? rowH + 18 : 0;
  const height = yOf(frame.rows.length) + (frame.gate && frame.rows.length <= frame.gate.after ? gateSpace : 0) + moreH + 34;
  const scanIndex = frame.scan === null ? -1 : frame.rows.findIndex((r) => r.id === frame.scan);
  const t = reduced ? 0 : 1 / speed;

  return (
    <div className={`qt-stage ${narrow ? 'qt-stage--narrow' : ''}`} style={{ height, ['--t' as string]: t }}>
      {/* tiêu đề column */}
      <div className="qt-head" style={{ height: headH }}>
        {frame.cols.map((c) => {
          const b = boxOf.get(c.key);
          if (!b) return null;
          return (
            <div
              key={c.key}
              className={`qt-th qt-th--${c.state} ${b.sliver ? 'qt-th--sliver' : ''} ${c.sort ? 'qt-th--sort' : ''}`}
              style={{ transform: `translateX(${b.x}px)`, width: b.w }}
              title={c.header}
            >
              {!b.sliver && <span className="qt-th__name">{c.header}</span>}
              {c.sort && !b.sliver && (
                <span className={`qt-th__sort qt-th__sort--${c.sort}`} aria-hidden="true">
                  <Icon name="arrow" size={12} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* hộp nhóm của GROUP BY */}
      {frame.boxes.map((b, i) => (
        <div
          key={i}
          className={`qt-box qt-tone-n${b.tone}`}
          style={{ transform: `translateY(${yOf(b.start) - 14}px)`, height: b.size * (rowH + gap) - gap + 22 }}
          aria-hidden="true"
        >
          <span className="qt-box__label">{b.label}</span>
        </div>
      ))}

      {/* máy soi của WHERE và HAVING */}
      <m.div
        className="qt-scan"
        style={{ height: rowH + 10 }}
        initial={false}
        animate={{ y: scanIndex >= 0 ? yOf(scanIndex) - 5 : headH, opacity: scanIndex >= 0 ? 1 : 0 }}
        transition={{ type: 'spring', duration: 0.38 * t, bounce: 0.15 }}
        aria-hidden="true"
      >
        <span className="qt-scan__lens">
          <Icon name="eye" size={narrow ? 14 : 16} />
        </span>
        <span className="qt-scan__beam" />
      </m.div>

      {frame.rows.map((r, index) => (
        <Row key={r.id} row={r} y={yOf(index)} index={index} rowH={rowH} width={width} frame={frame} boxOf={boxOf} t={t} reduced={reduced} />
      ))}

      {frame.rows.length === 0 && frame.cols.length > 0 && <p className="qt-empty">{emptyText}</p>}

      {/* chế độ gọn: các row còn lại gom thành một khối */}
      {frame.more && (
        <div className="qt-more" style={{ transform: `translateY(${yOf(frame.rows.length) + 6}px)`, height: rowH }}>
          <span className="qt-more__n">+{frame.more.count}</span>
          <span>{frame.more.text}</span>
        </div>
      )}

      {/* cánh cổng của LIMIT và FETCH FIRST */}
      {frame.gate && (
        <div className={`qt-gate ${frame.gate.closed ? 'qt-gate--closed' : ''}`} style={{ transform: `translateY(${yOf(frame.gate.after) - gateSpace - gap / 2}px)`, height: gateSpace }} aria-hidden="true">
          <span className="qt-gate__post" />
          <span className="qt-gate__arm" />
          <span className="qt-gate__label">{frame.gate.label}</span>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  row: StageRow;
  y: number;
  index: number;
  rowH: number;
  width: number;
  frame: Frame;
  boxOf: Map<string, { x: number; w: number; sliver: boolean }>;
  t: number;
  reduced: boolean;
}

function Row({ row, y, index, rowH, width, frame, boxOf, t, reduced }: RowProps) {
  const falling = row.mark !== undefined && FALLING.has(row.mark);
  const tilt = row.id % 2 === 0 ? 7 : -6;
  const animate =
    falling && !reduced
      ? { y: [y, y, y + rowH * 3.2], rotate: [0, row.id % 2 ? 1.5 : -1.5, tilt], opacity: [1, 1, 0], scale: 1 }
      : { y, rotate: 0, opacity: falling ? 0.45 : 1, scale: 1 };
  const transition = falling && !reduced ? { duration: 1.55 * t, times: [0, 0.6, 1], ease: 'easeIn' as const } : { type: 'spring' as const, duration: 0.6 * t, bounce: 0.2 };

  return (
    <m.div
      className={`qt-row ${row.mark ? `qt-row--${row.mark}` : ''} ${frame.scan === row.id ? 'qt-row--scan' : ''} ${row.tone !== undefined ? `qt-row--tone qt-tone-n${row.tone}` : ''} ${row.stack ? 'qt-row--stack' : ''}`}
      style={{ height: rowH, width }}
      initial={reduced ? false : { y: y - 18, opacity: 0, scale: 0.97 }}
      animate={animate}
      transition={{ ...transition, delay: frame.phase === 'from' && !reduced ? Math.min(index, 14) * 0.035 * t : 0 }}
    >
      {frame.cols.map((c) => {
        const b = boxOf.get(c.key);
        if (!b) return null;
        const v = row.cells[c.key];
        const numeric = typeof v === 'number';
        return (
          <div
            key={c.key}
            className={`qt-td qt-td--${c.state} ${b.sliver ? 'qt-td--sliver' : ''} ${numeric ? 'qt-td--num' : ''} ${v === null || v === undefined ? 'qt-td--null' : ''} ${c.sort ? 'qt-td--sort' : ''}`}
            style={{ transform: `translateX(${b.x}px)`, width: b.w }}
          >
            {!b.sliver && <span>{c.count && numeric ? <CountUp to={v} t={t} /> : show(v ?? null)}</span>}
          </div>
        );
      })}
      {row.mark === 'passed' && !row.note && (
        <span className="qt-tick" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      )}
      {row.stack && <span className="qt-stack">{row.stack} row</span>}
      {row.note && (
        <span className={`qt-note ${row.mark === 'pass' || row.mark === 'passed' ? 'qt-note--ok' : row.mark ? 'qt-note--no' : 'qt-note--key'}`}>
          {(row.mark === 'pass' || row.mark === 'passed') && <Icon name="check" size={13} />}
          {row.mark && row.mark !== 'pass' && row.mark !== 'passed' && <Icon name="cross" size={13} />}
          {row.note}
        </span>
      )}
    </m.div>
  );
}
