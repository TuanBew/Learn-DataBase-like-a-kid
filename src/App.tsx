import { Suspense, lazy, useEffect } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import { Route, Switch, useLocation } from 'wouter';
import { Header } from './components/Header';
import { exercises } from './content/exercises';
import { lessons } from './content/lessons';
import { databases } from './data';
import { Home } from './pages/Home';

const lessonPage = () => import('./pages/LessonPage');
const exercisePage = () => import('./pages/ExercisePage');
const LessonPage = lazy(lessonPage);
const ExercisePage = lazy(exercisePage);
const NextStepsPage = lazy(() => import('./pages/NextStepsPage'));
const SourcesPage = lazy(() => import('./pages/SourcesPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));

/**
 * Tải trang và nội dung của route đang mở trước khi React vẽ lần đầu.
 * Nếu để React vẽ khung chờ trước, React sẽ hoãn hiện nội dung thêm khoảng 300ms,
 * và tiêu đề bài xuất hiện muộn.
 */
export function preloadRoute(path: string): Promise<unknown> {
  const [, kind, id] = path.split('/');
  if (kind === 'bai') return Promise.all([lessonPage(), lessons[id]?.()]);
  if (kind === 'tap') return Promise.all([exercisePage(), exercises[id]?.().then((ex) => (ex.kind === 'quiz' ? undefined : databases[ex.database]()))]);
  return Promise.resolve();
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
    <LazyMotion features={domMax} strict>
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
              <Route path="/nguon" component={SourcesPage} />
              <Route path="/tien-trinh" component={ProgressPage} />
              <Route path="/chung-nhan" component={CertificatePage} />
              <Route component={Home} />
            </Switch>
          </Suspense>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
