import { useMemo } from 'react';
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

  const boxes = useMemo(() => layoutCols(frame.cols, width, focus), [frame.cols, width, focus]);
  const boxOf = useMemo(() => new Map(boxes.map((b) => [b.key, b])), [boxes]);

  const yOf = (index: number) => headH + gap + index * (rowH + gap) + (frame.gate && index >= frame.gate.after ? gateSpace : 0);
  const height = yOf(frame.rows.length) + (frame.gate && frame.rows.length <= frame.gate.after ? gateSpace : 0) + 34;
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

      {/* máy soi của WHERE */}
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
      className={`qt-row ${row.mark ? `qt-row--${row.mark}` : ''} ${frame.scan === row.id ? 'qt-row--scan' : ''}`}
      style={{ height: rowH, width }}
      initial={reduced ? false : { y: y - 18, opacity: 0, scale: 0.97 }}
      animate={animate}
      transition={{ ...transition, delay: frame.phase === 'from' && !reduced ? index * 0.035 * t : 0 }}
    >
      {frame.cols.map((c) => {
        const b = boxOf.get(c.key);
        if (!b) return null;
        const v = row.cells[c.key];
        const numeric = typeof v === 'number';
        return (
          <div
            key={c.key}
            className={`qt-td qt-td--${c.state} ${b.sliver ? 'qt-td--sliver' : ''} ${numeric ? 'qt-td--num' : ''} ${v === null ? 'qt-td--null' : ''} ${c.sort ? 'qt-td--sort' : ''}`}
            style={{ transform: `translateX(${b.x}px)`, width: b.w }}
          >
            {!b.sliver && <span>{show(v ?? null)}</span>}
          </div>
        );
      })}
      {row.mark === 'passed' && (
        <span className="qt-tick" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      )}
      {row.note && (
        <span className={`qt-note ${row.mark === 'pass' ? 'qt-note--ok' : row.mark ? 'qt-note--no' : 'qt-note--key'}`}>
          {row.mark === 'pass' && <Icon name="check" size={13} />}
          {row.mark && row.mark !== 'pass' && <Icon name="cross" size={13} />}
          {row.note}
        </span>
      )}
    </m.div>
  );
}
