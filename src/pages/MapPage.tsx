import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GalaxyScene } from '@/components/galaxy/GalaxyScene';
import { InfoPanel } from '@/components/panels/InfoPanel';
import { ControlsPanel } from '@/components/panels/ControlsPanel';
import { LoadingScreen } from '@/components/panels/LoadingScreen';
import { useGalaxyStore } from '@/store/galaxyStore';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export function MapPage() {
  const { viewMode, initializeData, hasPendingChanges, saveAllChanges, discardAllChanges, requestCameraReset, requestZoom } = useGalaxyStore();
  const { session, profile, signOut } = useAuth();
  const { isAdmin } = useRole();
  const [saving, setSaving] = useState(false);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const viewLabel = viewMode === 'topdown' ? 'Galaxy Map' : viewMode === 'system' ? 'Planet View' : 'Fleet View';
  const displayName =
    profile?.display_name
    ?? (typeof session?.user?.user_metadata?.display_name === 'string' ? session.user.user_metadata.display_name : null)
    ?? session?.user?.email?.split('@')[0]
    ?? 'Signed In';
  useEffect(() => {
    void initializeData();

    if (!supabaseConfigured) return;

    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null;
        const state = useGalaxyStore.getState();
        if (state.hasPendingChanges) return;
        void state.initializeData();
      }, 300);
    };

    const channel = supabase
      .channel('shared-map-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_systems' },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_fleets' },
        scheduleRealtimeRefresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        scheduleRealtimeRefresh,
      )
      .subscribe();

    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [initializeData]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <GalaxyScene />

      <ControlsPanel />
      <InfoPanel />
      <LoadingScreen />

      {isAdmin && hasPendingChanges && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 animate-slide-in-right">
          <button
            onClick={async () => {
              setSaving(true);
              await saveAllChanges();
              setSaving(false);
            }}
            disabled={saving}
            className="holo-button"
            style={{ padding: '8px 16px' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => discardAllChanges()}
            disabled={saving}
            className="holo-button"
            style={{ padding: '8px 16px', borderColor: 'rgba(220, 20, 60, 0.3)', color: '#DC143C' }}
          >
            Discard
          </button>
        </div>
      )}

      {viewMode === 'topdown' && (
        <div className="absolute bottom-20 right-6 z-40 flex flex-col gap-2">
          <button
            onClick={() => requestZoom(-1)}
            className="holo-button"
            style={{ padding: '8px 14px' }}
            title="Zoom in"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
            </svg>
          </button>
          <button
            onClick={() => requestZoom(1)}
            className="holo-button"
            style={{ padding: '8px 14px' }}
            title="Zoom out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
            </svg>
          </button>
          <button
            onClick={() => requestCameraReset()}
            className="holo-button"
            style={{ padding: '8px 14px' }}
            title="Reset camera to default position"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4V6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a9 9 0 0117.36-2.35" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 14h-4v4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 14a9 9 0 01-17.36 2.35" />
            </svg>
          </button>
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-40 flex items-center gap-3">
        {isAdmin && (
          <Link to="/admin" className="holo-button" style={{ padding: '8px 14px' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Admin</span>
          </Link>
        )}
        <Link to="/" className="holo-button" style={{ padding: '8px 14px' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span>AlphaSec</span>
        </Link>
      </div>

      <div className="absolute top-5 right-5 z-40">
        {session && (
          <div
            className="flex items-center"
            style={{
              background: 'rgba(12, 12, 18, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(200, 170, 110, 0.15)',
              borderRadius: '12px',
              padding: '6px',
              gap: '4px',
            }}
          >
            <div className="flex items-center gap-3 px-5 py-2.5">
              <span
                className="text-[13px] font-semibold tracking-[0.1em] uppercase"
                style={{ fontFamily: 'Oxanium, Orbitron, monospace', color: 'var(--holo-amber)' }}
              >
                {displayName}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 transition-all duration-200"
              style={{
                fontFamily: 'Oxanium, Orbitron, monospace',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--holo-text-muted)',
                background: 'rgba(200, 170, 110, 0.06)',
                border: '1px solid rgba(200, 170, 110, 0.1)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--holo-amber)'; e.currentTarget.style.background = 'rgba(200, 170, 110, 0.12)'; e.currentTarget.style.borderColor = 'rgba(200, 170, 110, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--holo-text-muted)'; e.currentTarget.style.background = 'rgba(200, 170, 110, 0.06)'; e.currentTarget.style.borderColor = 'rgba(200, 170, 110, 0.1)'; }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none z-0">
        <div className="holo-title-bar">
          <h1
            className="text-xl font-black tracking-[0.3em] uppercase mb-1"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: 'var(--holo-amber)',
            }}
          >
            AlphaSec
          </h1>

          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 170, 110, 0.3))' }} />
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--holo-amber)', opacity: 0.5 }}
              />
              <p
                className="text-[12px] font-bold tracking-[0.3em] uppercase"
                style={{
                  fontFamily: 'Oxanium, Orbitron, monospace',
                  color: 'var(--holo-text-muted)',
                }}
              >
                {viewLabel}
              </p>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--holo-amber)', opacity: 0.5 }}
              />
            </div>
            <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, rgba(200, 170, 110, 0.3), transparent)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
