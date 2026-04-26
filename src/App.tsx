import { Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Practice from './routes/Practice';
import Mock from './routes/Mock';
import Infinite from './routes/Infinite';
import Ai from './routes/Ai';
import Login from './routes/Login';
import NotFound from './routes/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/practice/:cert" element={<Practice />} />
      <Route path="/mock/:cert" element={<Mock />} />
      <Route path="/infinite/:cert" element={<Infinite />} />
      <Route path="/ai/:cert" element={<Ai />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
