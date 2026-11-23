import { Fragment, type ReactNode } from 'react';
import { glossary } from '../content/glossary';
import { Term } from './Term';

// Nhóm cuối bắt mã lỗi Oracle viết trong chữ thường, để mã không bị ngắt dòng ở dấu gạch.
const TOKEN = /\*\*(.+?)\*\*|`([^`]+)`|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|(ORA-\d{5})/g;

/** Tách chuỗi `Rich` thành các node React. Đệ quy cho phần bên trong chữ đậm. */
function parse(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{parse(m[1], key)}</strong>);
    } else if (m[2] !== undefined) {
      out.push(
        <code key={key} className={m[2].length <= 28 ? 'rich-code rich-code--short' : 'rich-code'}>
          {m[2]}
        </code>,
      );
    } else if (m[5] !== undefined) {
      out.push(
        <span key={key} className="nowrap">
          {m[5]}
        </span>,
      );
    } else {
      const id = m[3].trim();
      const entry = glossary[id];
      const label = m[4] ?? entry?.term ?? id;
      out.push(entry ? <Term key={key} id={id}>{label}</Term> : <Fragment key={key}>{label}</Fragment>);
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text }: { text: string }) {
  return <>{parse(text, 'r')}</>;
}
