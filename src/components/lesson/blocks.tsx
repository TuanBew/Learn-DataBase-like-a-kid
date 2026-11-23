import type { ReactNode } from 'react';
import type { LessonBlock, Source } from '../../content/types';
import { uiLesson } from '../../content/ui-lesson';
import { Rich } from '../Rich';
import { HangLines } from '../HangLines';
import './blocks.css';

type Of<T extends LessonBlock['type']> = Omit<Extract<LessonBlock, { type: T }>, 'type'>;

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i} className="lb-p">
          <Rich text={p} />
        </p>
      ))}
    </>
  );
}

export function StoryBlock({ title, paragraphs }: Of<'story'>) {
  return (
    <section className="lb lb-story">
      <h2 className="lb-story__title">{title}</h2>
      <div className="lb-story__body">
        <Paragraphs items={paragraphs} />
      </div>
    </section>
  );
}

export function TextBlock({ title, paragraphs }: Of<'text'>) {
  return (
    <section className="lb lb-text">
      {title && <h3 className="lb-text__title">{title}</h3>}
      <Paragraphs items={paragraphs} />
    </section>
  );
}

function SourceLink({ source, children }: { source: Source; children: ReactNode }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="lb-link">
      {children}
    </a>
  );
}

export function RealWorldCard({ title, paragraphs, source }: Of<'realworld'>) {
  return (
    <aside className="lb lb-real">
      <span className="lb-real__pin" aria-hidden="true" />
      <p className="pen lb-real__tag">{uiLesson.realWorld}</p>
      <h3 className="lb-real__title">{title}</h3>
      <Paragraphs items={paragraphs} />
      {source && (
        <p className="lb-real__src">
          <SourceLink source={source}>
            {uiLesson.realWorldSource}: {source.name}
          </SourceLink>
          {source.note && <span className="lb-note"> ({source.note})</span>}
        </p>
      )}
    </aside>
  );
}

function Tick() {
  return (
    <svg className="lb-tick" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <path
        d="M4 15 Q8 17 11 23 Q15 11 25 4"
        fill="none"
        stroke="var(--red)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KeyPoints({ items }: Of<'keypoints'>) {
  return (
    <section className="lb lb-key sheet">
      <h3 className="lb-key__title">{uiLesson.keyPoints}</h3>
      <ul className="lb-key__list">
        {items.map((it, i) => (
          <li key={i} className="lb-key__item">
            <Tick />
            <span>
              <Rich text={it} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OracleCard({ body, mysql, oracle }: Of<'oracle'>) {
  return (
    <section className="lb lb-oracle">
      <h3 className="lb-oracle__title">{uiLesson.oracleTitle}</h3>
      <Paragraphs items={body} />
      {(mysql || oracle) && (
        <div className="lb-oracle__grid">
          {mysql && (
            <figure className="lb-code">
              <figcaption className="lb-code__cap">{uiLesson.oracleMysql}</figcaption>
              <pre className="lb-code__pre" tabIndex={0}>
                <code><HangLines text={mysql} /></code>
              </pre>
            </figure>
          )}
          {oracle && (
            <figure className="lb-code lb-code--oracle">
              <figcaption className="lb-code__cap">{uiLesson.oracleOracle}</figcaption>
              <pre className="lb-code__pre" tabIndex={0}>
                <code><HangLines text={oracle} /></code>
              </pre>
            </figure>
          )}
        </div>
      )}
    </section>
  );
}

export function SourcesLine({ items }: Of<'sources'>) {
  return (
    <footer className="lb lb-sources">
      <span className="lb-sources__label">{uiLesson.sources}:</span>{' '}
      {items.map((s, i) => (
        <span key={s.url} className="lb-sources__item">
          <SourceLink source={s}>{s.name}</SourceLink>
          {s.note && <span className="lb-note"> ({s.note})</span>}
          {i < items.length - 1 && '; '}
        </span>
      ))}
    </footer>
  );
}
