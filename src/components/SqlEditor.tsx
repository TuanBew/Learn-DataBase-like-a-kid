import { useEffect, useRef } from 'react';
import { Compartment, EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, WidgetType, drawSelection, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { MySQL, PLSQL, sql } from '@codemirror/lang-sql';
import { autocompletion, closeBrackets, completionKeymap } from '@codemirror/autocomplete';
import { HighlightStyle, bracketMatching, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Dialect } from '../engine/types';
import './sql-editor.css';

const setError = StateEffect.define<{ from: number; to: number } | null>();
const errorField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = tr.docChanged ? Decoration.none : deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setError)) deco = e.value ? Decoration.set([Decoration.mark({ class: 'cm-sqlerr' }).range(e.value.from, e.value.to)]) : Decoration.none;
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** Thụt treo: dòng gập nối tiếp thụt sâu hơn lề đầu của dòng đó. Lề sâu quá 4 ký tự bị thu lại trên màn hình hẹp. */
class LeadWidget extends WidgetType {
  constructor(readonly n: number) {
    super();
  }
  eq(o: LeadWidget) {
    return o.n === this.n;
  }
  toDOM() {
    const el = document.createElement('span');
    el.className = 'hang-lead';
    el.textContent = ' '.repeat(this.n);
    return el;
  }
}
const hanging = EditorView.decorations.compute(['doc'], (state) => {
  const out = [];
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);
    const sp = /^ +/.exec(line.text)?.[0].length ?? 0;
    const lead = /^[ \t]*/.exec(line.text)![0].replace(/\t/g, '  ').length;
    out.push(Decoration.line({ class: 'hang-cm', attributes: { style: `--lead:${lead}` } }).range(line.from));
    if (sp > 4) out.push(Decoration.replace({ widget: new LeadWidget(sp) }).range(line.from, line.from + sp));
  }
  return Decoration.set(out, true);
});

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--code-kw)', fontWeight: '700' },
  { tag: [t.string, t.special(t.string)], color: 'var(--code-str)' },
  { tag: t.number, color: 'var(--code-num)' },
  { tag: t.comment, color: 'var(--code-com)', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation], color: 'var(--ink)' },
  { tag: t.typeName, color: 'var(--code-kw)' },
]);

interface Props {
  value: string;
  onChange: (v: string) => void;
  dialect: Dialect;
  /** Tên table và column để gợi ý lúc gõ. */
  schema: Record<string, string[]>;
  onRun: () => void;
  /** Chỗ sai cần gạch chân. */
  error: { s: number; e: number } | null;
  label: string;
}

/** Editor SQL dựa trên CodeMirror 6: tô màu, gợi ý tên table và column, Ctrl+Enter để chạy. */
export default function SqlEditor({ value, onChange, dialect, schema, onRun, error, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const lang = useRef(new Compartment());
  const cb = useRef({ onChange, onRun });
  cb.current = { onChange, onRun };

  const language = (d: Dialect) => sql({ dialect: d === 'mysql' ? MySQL : PLSQL, schema, upperCaseKeywords: true });

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          bracketMatching(),
          closeBrackets(),
          autocompletion({ icons: false }),
          syntaxHighlighting(highlight),
          lang.current.of(language(dialect)),
          errorField,
          hanging,
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                cb.current.onRun();
                return true;
              },
            },
            ...completionKeymap,
            ...historyKeymap,
            ...defaultKeymap,
          ]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: lang.current.reconfigure(language(dialect)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialect]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const len = v.state.doc.length;
    if (!error || len === 0) {
      v.dispatch({ effects: setError.of(null) });
      return;
    }
    let from = Math.min(error.s, len);
    let to = Math.min(Math.max(error.e, from), len);
    if (from === to) from = Math.max(0, from - 1);
    if (from === to) to = Math.min(len, to + 1);
    v.dispatch({ effects: setError.of({ from, to }) });
  }, [error]);

  return <div ref={host} className="sqled" />;
}
