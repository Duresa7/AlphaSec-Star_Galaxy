import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { BossmanRoute } from '@/components/auth/BossmanRoute';

const MapPage = lazy(() => import('@/pages/MapPage').then(m => ({ default: m.MapPage })));
const MapLoadingPage = lazy(() => import('@/pages/MapLoadingPage').then(m => ({ default: m.MapLoadingPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const CreditsPage = lazy(() => import('@/pages/CreditsPage').then(m => ({ default: m.CreditsPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NewsPage = lazy(() => import('@/pages/NewsPage').then(m => ({ default: m.NewsPage })));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/map-loading" element={
          <ProtectedRoute>
            <MapLoadingPage />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <Navigate to="/admin/audit" replace />
          </AdminRoute>
        } />
        <Route path="/admin/audit" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        <Route path="/news" element={
          <BossmanRoute>
            <NewsPage />
          </BossmanRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
