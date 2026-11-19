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

/**
 * Tải sớm trang và nội dung của route đang mở, song song với lúc React khởi động.
 * Nhờ vậy trang bài học và trang bài tập không phải chờ ba lượt tải nối đuôi nhau.
 */
function preloadRoute(path: string): void {
  const [, kind, id] = path.split('/');
  if (kind === 'bai') {
    void lessonPage();
    void lessons[id]?.();
  } else if (kind === 'tap') {
    void exercisePage();
    void exercises[id]?.().then((ex) => databases[ex.database]());
  }
}
preloadRoute(window.location.pathname);

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
