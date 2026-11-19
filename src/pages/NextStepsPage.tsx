import { Says } from '../components/Mascot';
import { nextSteps as T } from '../content/next-steps';
import './next-steps.css';

export default function NextStepsPage() {
  return (
    <div className="wrap ns">
      <header className="ns__head">
        <h1>{T.title}</h1>
        <Says mood="happy" size={72}>
          {T.bi}
        </Says>
      </header>

      <section className="sheet ns-free" aria-labelledby="ns-free-title">
        <p className="pen ns-free__pen">{T.freesql.pen}</p>
        <h2 id="ns-free-title">{T.freesql.title}</h2>
        <p className="ns-free__lead">{T.freesql.lead}</p>
        <ul className="ns-free__points">
          {T.freesql.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <a className="btn" href={T.freesql.href} target="_blank" rel="noreferrer">
          {T.freesql.cta}
          <span className="sr-only"> ({T.newTab})</span>
        </a>
      </section>

      <section aria-labelledby="ns-path-title" className="ns-path">
        <h2 id="ns-path-title" className="ns-path__title">
          {T.pathLabel}
        </h2>
        <ol className="ns-path__list">
          {T.steps.map((s, i) => (
            <li key={s.href} className="ns-step">
              <span className="ns-step__num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="ns-step__body">
                <h3>
                  <span className="sr-only">
                    {T.stepWord} {i + 1}:{' '}
                  </span>
                  <a href={s.href} target="_blank" rel="noreferrer">
                    {s.name}
                    <span className="sr-only"> ({T.newTab})</span>
                  </a>
                </h3>
                <p>{s.when}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
