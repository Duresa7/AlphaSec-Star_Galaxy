import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { MapLoadingPage } from '@/pages/MapLoadingPage';
import { ResumePage } from '@/pages/ResumePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/map-loading" element={<MapLoadingPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
