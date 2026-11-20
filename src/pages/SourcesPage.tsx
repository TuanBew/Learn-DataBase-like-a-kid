import { Says } from '../components/Mascot';
import { sources as T } from '../content/sources';
import './sources.css';
import { useTitle } from '../lib/useTitle';
import { uiApp } from '../content/ui-app';

function Ext({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> ({T.open})</span>
    </a>
  );
}

export default function SourcesPage() {
  useTitle(uiApp.nav.sources);
  return (
    <div className="wrap src">
      <header className="src__head">
        <h1>{T.title}</h1>
        <Says mood="idle" size={72}>
          {T.bi}
        </Says>
      </header>

      <section aria-labelledby="src-theory">
        <h2 id="src-theory">{T.theory.title}</h2>
        <div className="src__scroll">
          <table className="src-table src-table--stack">
            <thead>
              <tr>
                <th scope="col">{T.cols.name}</th>
                <th scope="col">{T.cols.usedFor}</th>
                <th scope="col">{T.cols.note}</th>
              </tr>
            </thead>
            <tbody>
              {T.theory.items.map((s) => (
                <tr key={s.name}>
                  <th scope="row">{'href' in s && s.href ? <Ext href={s.href}>{s.name}</Ext> : s.name}</th>
                  <td data-label={T.cols.usedFor}>{s.usedFor}</td>
                  <td data-label={T.cols.note}>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sheet src-license" aria-labelledby="src-license">
        <h2 id="src-license">{T.license.title}</h2>
        {T.license.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p>
          <Ext href={T.license.href}>{T.license.linkText}</Ext>
        </p>
      </section>

      <section aria-labelledby="src-dataset">
        <h2 id="src-dataset">{T.dataset.title}</h2>
        <p className="src__lead">{T.dataset.body}</p>
        <p>
          <Ext href={T.dataset.href}>{T.dataset.linkText}</Ext>
        </p>
      </section>

      <section aria-labelledby="src-companies">
        <h2 id="src-companies">{T.companies.title}</h2>
        <p className="src__lead">{T.companies.lead}</p>
        <dl className="src-defs">
          {T.companies.items.map((c) => (
            <div key={c.name} className="src-defs__row">
              <dt>{c.name}</dt>
              <dd>
                {c.claim} <Ext href={c.href}>{c.linkText}</Ext>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="src-fonts">
        <h2 id="src-fonts">{T.fonts.title}</h2>
        <p className="src__lead">
          {T.fonts.lead} <Ext href={T.fonts.href}>{T.fonts.linkText}</Ext>
        </p>
        <div className="src__scroll">
          <table className="src-table src-table--stack">
            <thead>
              <tr>
                <th scope="col">{T.fonts.cols.name}</th>
                <th scope="col">{T.fonts.cols.usedFor}</th>
                <th scope="col">{T.fonts.cols.license}</th>
              </tr>
            </thead>
            <tbody>
              {T.fonts.items.map((f) => (
                <tr key={f.name}>
                  <th scope="row">{f.name}</th>
                  <td data-label={T.fonts.cols.usedFor}>{f.usedFor}</td>
                  <td data-label={T.fonts.cols.license}>{f.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="src-libs">
        <h2 id="src-libs">{T.libs.title}</h2>
        <p className="src__lead">{T.libs.lead}</p>
        <div className="src__scroll">
          <table className="src-table src-table--stack">
            <thead>
              <tr>
                <th scope="col">{T.libs.cols.name}</th>
                <th scope="col">{T.libs.cols.usedFor}</th>
                <th scope="col">{T.libs.cols.license}</th>
              </tr>
            </thead>
            <tbody>
              {T.libs.items.map((l) => (
                <tr key={l.name}>
                  <th scope="row">{l.href ? <Ext href={l.href}>{l.name}</Ext> : l.name}</th>
                  <td data-label={T.libs.cols.usedFor}>{l.usedFor}</td>
                  <td data-label={T.libs.cols.license}>{l.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
