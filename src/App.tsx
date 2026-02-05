import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/components/landing/LandingPage';
import { MapPage } from '@/pages/MapPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
