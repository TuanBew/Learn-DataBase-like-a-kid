import { Suspense, lazy, useEffect } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
import { Route, Switch, useLocation } from 'wouter';
import { Header } from './components/Header';
import { Home } from './pages/Home';

const LessonPage = lazy(() => import('./pages/LessonPage'));
const ExercisePage = lazy(() => import('./pages/ExercisePage'));

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
              <Route component={Home} />
            </Switch>
          </Suspense>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}
