import { uiWorkshop } from '../content/ui-workshop';
import { type RunResult, type Session, splitStatements } from '../engine';
import type { Dialect } from '../engine/types';
import { Icon } from './Icon';
import { ResultTable } from './ResultTable';
import { ErrorCard } from './sql/parts';
import './script-output.css';

const T = uiWorkshop;

export interface ScriptOut {
  results: RunResult[];
  failedAt?: number;
  /** Số lệnh trong editor lúc Chạy. */
  total: number;
}

/** Chạy một đoạn nhiều lệnh trên session và gói kết quả cho `ScriptOutput`. */
export function runScript(session: Session, sql: string, dialect: Dialect): ScriptOut {
  const total = Math.max(1, splitStatements(sql, dialect).length);
  const r = session.runScript(sql);
  return { results: r.results, failedAt: r.failedAt, total };
}

/** Một dòng báo kết quả của lệnh không trả table. Lệnh SELECT không đi qua đây. */
export function describeResult(r: Exclude<RunResult, { ok: false } | { kind: 'select' }>): string {
  const D = T.done;
  switch (r.kind) {
    case 'ddl':
      if (r.op === 'create') return D.create(r.object);
      if (r.op === 'alter') return D.alter(r.object);
      if (r.op === 'drop') return D.drop(r.object);
      if (r.op === 'truncate') return D.truncate(r.object);
      return r.verb === 'drop' ? D.sequenceDrop(r.object) : D.sequenceCreate(r.object);
    case 'dml': {
      const n = r.dml.touched.length;
      const line = r.dml.op === 'insert' ? D.insert(n, r.dml.table) : r.dml.op === 'update' ? D.update(n, r.dml.table) : D.delete(n, r.dml.table);
      return r.dml.pending ? line + D.pending : line;
    }
    case 'tx':
      return r.op === 'commit' ? D.commit(r.changes) : r.op === 'rollback' ? D.rollback(r.changes) : D.begin;
  }
}

/** Kết quả từng lệnh theo thứ tự. Lệnh lỗi thì dừng ở đó, kèm thẻ lỗi. */
export function ScriptOutput({ out, dialect }: { out: ScriptOut; dialect: Dialect }) {
  const failed = out.failedAt !== undefined ? out.results[out.failedAt] : undefined;
  const okResults = out.results.filter((r) => r.ok);
  const multi = out.total > 1;
  return (
    <div className="so" aria-label={T.results}>
      {okResults.length > 0 && (
        <ol className="so__list">
          {out.results.map((r, i) => {
            if (!r.ok) return null;
            return (
              <li key={i} className="so__item">
                {r.kind === 'select' ? (
                  <ResultTable result={r.result} caption={T.selectCaption(i + 1)} maxRows={12} />
                ) : (
                  <p className="so__line">
                    <Icon name="check" size={18} />
                    <span>
                      {multi && <span className="so__no">{T.resultNo(i + 1)}: </span>}
                      {describeResult(r)}
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {failed && !failed.ok && out.failedAt !== undefined && (
        <>
          <p className="so__fail">{T.failedAt(out.failedAt + 1, out.total)}</p>
          <ErrorCard error={failed.error} dialect={dialect} title={T.errorTitle} />
        </>
      )}
    </div>
  );
}
