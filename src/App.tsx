import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import IdleSessionGuard from './components/IdleSessionGuard';

const Home = lazy(() => import('./routes/Home'));
const Practice = lazy(() => import('./routes/Practice'));
const Mock = lazy(() => import('./routes/Mock'));
const Infinite = lazy(() => import('./routes/Infinite'));
const Ai = lazy(() => import('./routes/Ai'));
const Open = lazy(() => import('./routes/Open'));
const Login = lazy(() => import('./routes/Login'));
const Stats = lazy(() => import('./routes/Stats'));
const Review = lazy(() => import('./routes/Review'));
const NotFound = lazy(() => import('./routes/NotFound'));

function PageFallback() {
  return <div className="app-bg w-full min-h-screen" />;
}

export default function App() {
  return (
    <>
      <IdleSessionGuard />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/practice/:cert" element={<Practice />} />
          <Route path="/mock/:cert" element={<Mock />} />
          <Route path="/infinite/:cert" element={<Infinite />} />
          <Route path="/ai/:cert" element={<Ai />} />
          <Route path="/open/:cert" element={<Open />} />
          <Route path="/review/:cert" element={<Review />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
