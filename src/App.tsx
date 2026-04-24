import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Practice from './routes/Practice';
import Mock from './routes/Mock';
import Drill from './routes/Drill';
import Infinite from './routes/Infinite';
import NotFound from './routes/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice/:cert" element={<Practice />} />
      <Route path="/mock/:cert" element={<Mock />} />
      <Route path="/drill/:cert" element={<Drill />} />
      <Route path="/infinite/:cert" element={<Infinite />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
