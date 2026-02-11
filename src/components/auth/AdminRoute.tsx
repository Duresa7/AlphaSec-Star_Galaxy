import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, supabaseConfigured } = useAuth();
  const { isAdmin } = useRole();

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
          <p className="route-auth-loading__eyebrow">Admin Panel</p>
          <h2 className="route-auth-loading__title">Verifying Access...</h2>
          <p className="route-auth-loading__copy">Checking authorization level.</p>
          <div className="route-auth-loading__bar"><span /></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ showAuthModal: true }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/map" replace />;
  }

  return <>{children}</>;
}
