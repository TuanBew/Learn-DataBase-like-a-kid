import { type ComponentType, Suspense, lazy, useEffect } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { Route, Switch, useLocation } from 'wouter';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { exercises } from './content/exercises';
import { lessons } from './content/lessons';
import { databases } from './data';
import { preload } from './lib/useLoad';

/**
 * Một trang tải lười mà vẫn hiện ngay được nếu chunk đã tải xong từ trước.
 * `lazy()` của React luôn hiện khung chờ ở lần vẽ đầu và giữ khung đó khoảng 300ms,
 * kể cả khi chunk đã có sẵn. Trang đã `preload()` thì vẽ thẳng, không qua khung chờ.
 */
function page<P extends object>(load: () => Promise<ComponentType<P>>) {
  let ready: ComponentType<P> | undefined;
  const Lazy = lazy(() => load().then((c) => ({ default: c })));
  const Page = (props: P) => {
    const C = ready ?? Lazy;
    return <C {...props} />;
  };
  Page.preload = () =>
    load().then((c) => {
      ready = c;
    });
  return Page;
}

const motionFeatures = () => import('./motion-features').then((m) => m.default);
const Home = page(() => import('./pages/Home').then((m) => m.Home));
const LessonPage = page(() => import('./pages/LessonPage').then((m) => m.default));
const ExercisePage = page(() => import('./pages/ExercisePage').then((m) => m.default));
const NextStepsPage = page(() => import('./pages/NextStepsPage').then((m) => m.default));
const ReferencePage = page(() => import('./pages/ReferencePage').then((m) => m.default));
const SourcesPage = page(() => import('./pages/SourcesPage').then((m) => m.default));
const ProgressPage = page(() => import('./pages/ProgressPage').then((m) => m.default));
const CertificatePage = page(() => import('./pages/CertificatePage').then((m) => m.default));

/**
 * Tải trang và nội dung của route đang mở trước khi React vẽ lần đầu.
 * Nếu để React vẽ khung chờ trước, React sẽ hoãn hiện nội dung thêm khoảng 300ms,
 * và tiêu đề bài xuất hiện muộn.
 */
export function preloadRoute(path: string): Promise<unknown> {
  const [, kind, id] = path.split('/');
  if (kind === 'bai') return Promise.all([LessonPage.preload(), preload(lessons[id])]);
  if (kind === 'tap') return Promise.all([ExercisePage.preload(), preload(exercises[id]).then((ex) => (!ex || ex.kind === 'quiz' || ex.kind === 'build' ? undefined : preload(databases[ex.database])))]);
  if (kind === 'hoc-tiep') return NextStepsPage.preload();
  if (kind === 'tra-cuu') return ReferencePage.preload();
  if (kind === 'nguon') return SourcesPage.preload();
  if (kind === 'tien-trinh') return ProgressPage.preload();
  if (kind === 'chung-nhan') return CertificatePage.preload();
  return Home.preload();
}

/** Về đầu trang khi đổi trang, hoặc cuộn tới mục có dấu #. */
function ScrollManager() {
  const [path] = useLocation();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const el = hash ? document.getElementById(hash) : null;
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [path]);
  return null;
}

export function App() {
  return (
    <LazyMotion features={motionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <ScrollManager />
        <Header />
        <main id="main">
          <Suspense fallback={<div className="wrap" style={{ minHeight: '60vh' }} />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/bai/:id">{(p) => <LessonPage id={p.id} />}</Route>
              <Route path="/tap/:id">{(p) => <ExercisePage id={p.id} />}</Route>
              <Route path="/hoc-tiep" component={NextStepsPage} />
              <Route path="/tra-cuu" component={ReferencePage} />
              <Route path="/nguon" component={SourcesPage} />
              <Route path="/tien-trinh" component={ProgressPage} />
              <Route path="/chung-nhan" component={CertificatePage} />
              <Route component={Home} />
            </Switch>
            {/* Chân trang nằm trong cùng khung chờ với nội dung, để nó không hiện trước rồi bị đẩy xuống. */}
            <Footer />
          </Suspense>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
