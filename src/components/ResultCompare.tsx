import type { GradeReport, ResultSet } from '../engine';
import { uiExercise } from '../content/ui-exercise';
import { ResultTable } from './ResultTable';
import './result-compare.css';

export interface ResultCompareProps {
  actual: ResultSet;
  expected: ResultSet;
  report: GradeReport;
}

const T = uiExercise.compare;

type GradeProblem = GradeReport['problems'][number];

function describe(p: GradeProblem, expected: ResultSet): string[] {
  switch (p.kind) {
    case 'column-count': {
      const out = [T.columnCount(p.expected, p.actual)];
      if (p.extra.length > 0) out.push(T.columnExtra(p.extra));
      if (p.missing.length > 0) out.push(T.columnMissing(p.missing));
      return [out.join(' ')];
    }
    case 'column-order':
      return [T.columnOrder];
    case 'column-names':
      return [T.columnNames(p.at.map((i) => i + 1), p.at.map((i) => expected.columns[i]))];
    case 'rows':
      return [T.rows(p.missing, p.extra)];
    case 'row-order':
      return [T.rowOrder];
  }
}

const marks = (idx: number[], kind: 'extra' | 'missing') => Object.fromEntries(idx.map((i) => [i, kind])) as Record<number, 'extra' | 'missing'>;

export function ResultCompare({ actual, expected, report }: ResultCompareProps) {
  const lines = report.problems.flatMap((p) => describe(p, expected));
  const showExtra = report.extraIdx.length > 0;
  const showMissing = report.missingIdx.length > 0;

  return (
    <section className="rcmp" aria-label={T.problemsLabel}>
      {lines.length > 0 ? (
        <ul className="rcmp__problems">
          {lines.map((l, i) => (
            <li key={i} className="pen">
              {l}
            </li>
          ))}
        </ul>
      ) : (
        report.ok && <p className="rcmp__ok pen">{T.allGood}</p>
      )}

      <div className="rcmp__tables">
        <div className="rcmp__side">
          <ResultTable result={actual} caption={T.yours} rowMarks={marks(report.extraIdx, 'extra')} />
        </div>
        <div className="rcmp__side">
          <ResultTable result={expected} caption={T.expected} rowMarks={marks(report.missingIdx, 'missing')} />
        </div>
      </div>

      {(showExtra || showMissing) && (
        <ul className="rcmp__legend" aria-label={T.legendLabel}>
          {showExtra && (
            <li>
              <span className="rcmp__swatch rcmp__swatch--extra" aria-hidden="true" />
              {T.legendExtra}
            </li>
          )}
          {showMissing && (
            <li>
              <span className="rcmp__swatch rcmp__swatch--missing" aria-hidden="true" />
              {T.legendMissing}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
