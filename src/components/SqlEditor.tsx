import { useEffect, useRef } from 'react';
import { Compartment, EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, drawSelection, keymap, lineNumbers } from '@codemirror/view';
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

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: '#5a36d6', fontWeight: '700' },
  { tag: [t.string, t.special(t.string)], color: '#9a3d00' },
  { tag: t.number, color: '#0a6976' },
  { tag: t.comment, color: '#6a6399', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation], color: '#2b1f6b' },
  { tag: t.typeName, color: '#5a36d6' },
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
