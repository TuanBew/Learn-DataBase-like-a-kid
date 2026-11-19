import { Link } from 'wouter';
import { uiApp } from '../content/ui-app';
import './footer.css';

const N = uiApp.nav;
const LINKS = [
  { href: '/#muc-luc', text: N.toc },
  { href: '/tien-trinh', text: N.progress },
  { href: '/hoc-tiep', text: N.next },
  { href: '/nguon', text: N.sources },
  { href: '/chung-nhan', text: N.certificate },
];

/** Chân trang: lối tới các trang phụ. */
export function Footer() {
  return (
    <footer className="wrap ftr">
      <nav className="ftr__nav" aria-label={N.footerLabel}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="ftr__link">
            {l.text}
          </Link>
        ))}
      </nav>
      <p>{N.footer}</p>
    </footer>
  );
}
