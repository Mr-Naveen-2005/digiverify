import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Processing from './pages/Processing';
import Result from './pages/Result';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/result" element={<Result />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}
