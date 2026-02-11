import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, supabaseConfigured } = useAuth();
  const location = useLocation();

  // Block access when Supabase is not configured — auth is required
  if (!supabaseConfigured) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="route-auth-loading">
        <div className="route-auth-loading__layer route-auth-loading__layer--base" />
        <div className="route-auth-loading__layer route-auth-loading__layer--grid" />
        <div className="route-auth-loading__veil" />
        <div className="route-auth-loading__card">
          <p className="route-auth-loading__eyebrow">Galaxy Map</p>
          <h2 className="route-auth-loading__title">Authenticating...</h2>
          <p className="route-auth-loading__copy">Verifying your clearance level.</p>
          <div className="route-auth-loading__bar"><span /></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ showAuthModal: true, from: location.pathname }} />;
  }

  return <>{children}</>;
}
