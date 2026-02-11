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
  const { viewMode, initializeData, hasPendingChanges, saveAllChanges, discardAllChanges } = useGalaxyStore();
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

  // Load custom data from Supabase on mount
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
      {/* 3D Galaxy Scene */}
      <GalaxyScene />

      {/* UI Overlays */}
      <ControlsPanel />
      <InfoPanel />
      <LoadingScreen />

      {/* Save / Discard — admin only, when dirty */}
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
            style={{ padding: '8px 16px', borderColor: 'rgba(220, 20, 60, 0.4)', color: '#DC143C' }}
          >
            Discard
          </button>
        </div>
      )}

      {/* Navigation */}
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

      {/* User info + sign out — top right */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
        {session && (
          <>
            <span
              className="text-[11px] font-semibold tracking-wider uppercase"
              style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-amber)', textShadow: '0 0 6px rgba(200, 170, 110, 0.4)' }}
            >
              {displayName}
            </span>
            <button
              onClick={() => signOut()}
              className="holo-button"
              style={{ padding: '6px 12px', fontSize: '10px' }}
            >
              Sign Out
            </button>
          </>
        )}
      </div>

      {/* Title — KOTOR Holoterm style */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-0 mix-blend-screen opacity-80">
        {/* Top bracket line */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, var(--holo-amber))' }} />
          <div
            className="w-2 h-2"
            style={{
              backgroundColor: 'var(--holo-amber)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              boxShadow: '0 0 6px rgba(200, 170, 110, 0.5)',
            }}
          />
          <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, var(--holo-amber), transparent)' }} />
        </div>

        <h1
          className="text-3xl font-black tracking-[0.4em] uppercase mb-1"
          style={{
            fontFamily: 'Orbitron, monospace',
            color: 'var(--holo-amber)',
            textShadow: '0 0 15px rgba(200, 170, 110, 0.5), 0 0 30px rgba(200, 170, 110, 0.2)',
          }}
        >
          AlphaSec
        </h1>

        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, var(--holo-cyan))' }} />
          <p
            className="text-[10px] font-bold tracking-[0.5em] uppercase"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: 'var(--holo-cyan)',
              textShadow: '0 0 8px rgba(0, 240, 255, 0.5)',
            }}
          >
            {viewLabel}
          </p>
          <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, var(--holo-cyan), transparent)' }} />
        </div>

        {/* Bottom bracket line */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 170, 110, 0.3))' }} />
          <div
            className="w-1.5 h-1.5"
            style={{
              backgroundColor: 'var(--holo-amber)',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              opacity: 0.5,
            }}
          />
          <div className="h-px w-8" style={{ background: 'linear-gradient(90deg, rgba(200, 170, 110, 0.3), transparent)' }} />
        </div>
      </div>
    </div>
  );
}
