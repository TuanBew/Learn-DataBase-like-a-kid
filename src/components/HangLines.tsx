import type { CSSProperties, ReactNode } from 'react';

/** Số khoảng trắng đầu dòng (tab tính 2). */
export function leadOf(line: string): number {
  return /^[ \t]*/.exec(line)![0].replace(/\t/g, '  ').length;
}

/** Dòng giờ ("09:00  An    UPDATE ...") treo thẳng vào cột lệnh. Dòng khác treo 2 ký tự sâu hơn lề của nó. */
function schedLen(line: string): number {
  const sched = /^\d{1,2}:\d{2}\s+\S+\s+(?=\S)/.exec(line);
  return sched ? sched[0].length : 0;
}

/** `--lead` là lề đầu dòng, `--ex` là phần treo thêm. CSS thu lề trên màn hình hẹp (xem kit.css). */
export function hangStyle(line: string): CSSProperties {
  const sch = schedLen(line);
  return { '--lead': sch ? 0 : leadOf(line), '--ex': sch || 2 } as CSSProperties;
}

function Lead({ n }: { n: number }) {
  return (
    <span className="hang-lead" aria-hidden="true">
      {' '.repeat(n)}
    </span>
  );
}

function Line({ line }: { line: string }) {
  const sp = /^ +/.exec(line)?.[0].length ?? 0;
  return (
    <span className="hang-line" style={hangStyle(line)}>
      {sp > 0 ? (
        <>
          <Lead n={sp} />
          {line.slice(sp)}
        </>
      ) : (
        line
      )}
    </span>
  );
}

/** Mỗi dòng code là một khối riêng, dòng gập được thụt vào sâu hơn lề của chính dòng đó. */
export function HangLines({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Line key={i} line={line} />
      ))}
    </>
  );
}

/** Như HangLines nhưng cho đoạn code đã tách thành các mảnh (chữ tô nhấn nằm trong mảnh). */
export function HangPieces({ pieces }: { pieces: { text: string; render: (t: string, k: string) => ReactNode }[] }) {
  const lines: { raw: string; nodes: ReactNode[] }[] = [{ raw: '', nodes: [] }];
  pieces.forEach((p, pi) => {
    p.text.split('\n').forEach((seg0, si) => {
      let seg = seg0;
      if (si > 0) lines.push({ raw: '', nodes: [] });
      const cur = lines[lines.length - 1];
      if (seg && cur.raw === '' && seg.startsWith(' ')) {
        const sp = /^ +/.exec(seg)![0];
        cur.nodes.push(<Lead key={`l${pi}-${si}`} n={sp.length} />);
        cur.raw += sp;
        seg = seg.slice(sp.length);
      }
      cur.raw += seg;
      if (seg) cur.nodes.push(p.render(seg, `${pi}-${si}`));
    });
  });
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="hang-line" style={hangStyle(l.raw)}>
          {l.nodes}
        </span>
      ))}
    </>
  );
}
