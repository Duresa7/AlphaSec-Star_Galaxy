import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { AdminActivityPage } from '@/pages/AdminActivityPage';
import { AdminPermissionsPage } from '@/pages/AdminPermissionsPage';
import { AuthGate } from '@/components/auth/AuthGate';
import { useAuthStore } from '@/store/authStore';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/map"
          element={(
            <RequireAuth>
              <MapPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/admin/activity"
          element={(
            <RequireAuth>
              <AdminActivityPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/admin/permissions"
          element={(
            <RequireAuth>
              <AdminPermissionsPage />
            </RequireAuth>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  );
}

export default App;
