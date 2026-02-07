import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { AdminActivityPage } from '@/pages/AdminActivityPage';
import { AdminPermissionsPage } from '@/pages/AdminPermissionsPage';
import { AuthGate } from '@/components/auth/AuthGate';

function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/admin/activity" element={<AdminActivityPage />} />
        <Route path="/admin/permissions" element={<AdminPermissionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  );
}

export default App;
