import { Routes, Route, Navigate } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { MapLoadingPage } from '@/pages/MapLoadingPage';
import { ResumePage } from '@/pages/ResumePage';
import { BlogPage } from '@/pages/BlogPage';
import { BlogPostPage } from '@/pages/BlogPostPage';
import { BlogManagePage } from '@/pages/BlogManagePage';
import { AdminActivityPage } from '@/pages/AdminActivityPage';
import { AdminPermissionsPage } from '@/pages/AdminPermissionsPage';
import { AuthGate } from '@/components/auth/AuthGate';
import { useAuthStore } from '@/store/authStore';

function AuthInitializingScreen() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;

  return (
    <section
      className="route-auth-loading"
      aria-label="Initializing access"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="route-auth-loading__layer route-auth-loading__layer--base" aria-hidden="true" />
      <div className="route-auth-loading__layer route-auth-loading__layer--grid" aria-hidden="true" />
      <div className="route-auth-loading__veil" aria-hidden="true" />

      <div className="route-auth-loading__card">
        <p className="route-auth-loading__eyebrow">Navigational Uplink</p>
        <h1 className="route-auth-loading__title">Initializing systems</h1>
        <p className="route-auth-loading__copy">Syncing route access and command permissions...</p>
        <div className="route-auth-loading__bar" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) {
    return <AuthInitializingScreen />;
  }
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
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route
          path="/blog/manage"
          element={(
            <RequireAuth>
              <BlogManagePage />
            </RequireAuth>
          )}
        />
        <Route
          path="/map-loading"
          element={(
            <RequireAuth>
              <MapLoadingPage />
            </RequireAuth>
          )}
        />
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
