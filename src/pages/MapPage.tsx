import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GalaxyScene } from '@/components/galaxy/GalaxyScene';
import { InfoPanel } from '@/components/panels/InfoPanel';
import { IconRail } from '@/components/panels/IconRail';
import { BottomActionBar } from '@/components/panels/BottomActionBar';
import { SearchBar } from '@/components/panels/SearchBar';
import { TimelineControl } from '@/components/panels/TimelineControl';
import { GalaxyOverview } from '@/components/panels/GalaxyOverview';
import { MapControlsPanel } from '@/components/panels/MapControlsPanel';
import { LoadingScreen } from '@/components/panels/LoadingScreen';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useFactionStore } from '@/store/factionStore';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export function MapPage() {
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const requestCameraReset = useGalaxySelectionStore((s) => s.requestCameraReset);
  const requestZoom = useGalaxySelectionStore((s) => s.requestZoom);
  const initializeData = useGalaxyDataStore((s) => s.initializeData);
  const hasPendingChanges = useGalaxyDataStore((s) => s.hasPendingChanges);
  const saveAllChanges = useGalaxyDataStore((s) => s.saveAllChanges);
  const discardAllChanges = useGalaxyDataStore((s) => s.discardAllChanges);
  const { session, profile, signOut } = useAuth();
  const { isAdmin } = useRole();
  const [saving, setSaving] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const factionRefreshTimeoutRef = useRef<number | null>(null);
  const viewLabel = viewMode === 'topdown' ? 'Galaxy Map' : viewMode === 'system' ? 'Planet View' : 'Fleet View';

  const handleDownloadMap = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const labelEls = document.querySelectorAll<HTMLElement>('[data-map-label]');
    labelEls.forEach((el) => {
      const text = el.textContent?.trim();
      if (!text) return;

      const rect = el.getBoundingClientRect();
      const x = (rect.left - canvasRect.left + rect.width / 2) * scaleX;
      const y = (rect.top - canvasRect.top + rect.height / 2) * scaleY;

      const computed = window.getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize) * scaleX;
      const fontWeight = computed.fontWeight;
      const color = computed.color;
      const bgColor = computed.backgroundColor;

      const paddingX = 6 * scaleX;
      const paddingY = 3 * scaleY;

      ctx.font = `${fontWeight} ${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(text).width;
      const textHeight = fontSize;

      const boxX = x - textWidth / 2 - paddingX;
      const boxY = y - textHeight / 2 - paddingY;
      const boxW = textWidth + paddingX * 2;
      const boxH = textHeight + paddingY * 2;
      const r = 4 * scaleX;

      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.moveTo(boxX + r, boxY);
      ctx.lineTo(boxX + boxW - r, boxY);
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
      ctx.lineTo(boxX + boxW, boxY + boxH - r);
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
      ctx.lineTo(boxX + r, boxY + boxH);
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
      ctx.lineTo(boxX, boxY + r);
      ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
      ctx.closePath();
      ctx.fill();

      const borderColor = computed.borderBottomColor;
      if (borderColor && borderColor !== 'transparent') {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2 * scaleX;
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.stroke();
      }

      const textShadow = computed.textShadow;
      if (textShadow && textShadow !== 'none') {
        const parenEnd = textShadow.indexOf(')');
        if (parenEnd !== -1) {
          ctx.shadowColor = textShadow.slice(0, parenEnd + 1);
          ctx.shadowBlur = 10 * scaleX;
        }
      }

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });

    const link = document.createElement('a');
    link.download = 'galaxy-map.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
  }, []);
  const displayName =
    profile?.display_name
    ?? (typeof session?.user?.user_metadata?.display_name === 'string' ? session.user.user_metadata.display_name : null)
    ?? session?.user?.email?.split('@')[0]
    ?? 'Signed In';
  useEffect(() => {
    const init = async () => {
      const factionStore = useFactionStore.getState();
      await factionStore.initializeFactions();
      useGalaxyUIStore.getState().syncFactionFilters(factionStore.getFactionIds());
      await initializeData();
    };
    void init();

    if (!supabaseConfigured) return;

    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null;
        const dataState = useGalaxyDataStore.getState();
        if (dataState.hasPendingChanges) return;
        void dataState.initializeData();
      }, 300);
    };

    const scheduleFactionRefresh = () => {
      if (factionRefreshTimeoutRef.current !== null) {
        window.clearTimeout(factionRefreshTimeoutRef.current);
      }

      factionRefreshTimeoutRef.current = window.setTimeout(async () => {
        factionRefreshTimeoutRef.current = null;
        const factionStore = useFactionStore.getState();
        await factionStore.initializeFactions();
        useGalaxyUIStore.getState().syncFactionFilters(factionStore.getFactionIds());
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_factions' },
        scheduleFactionRefresh,
      )
      .subscribe();

    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      if (factionRefreshTimeoutRef.current !== null) {
        window.clearTimeout(factionRefreshTimeoutRef.current);
        factionRefreshTimeoutRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [initializeData]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <GalaxyScene />

      <div className="absolute top-5 left-5 z-50 flex items-center gap-2">
        <button
          onClick={() => setUiHidden((prev) => !prev)}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/20 text-white/80 hover:text-amber-300 hover:border-amber-400/50 transition-all duration-200 cursor-pointer"
          style={{ background: 'rgba(10, 10, 16, 0.7)', backdropFilter: 'blur(12px)' }}
          title={uiHidden ? 'Show UI' : 'Hide UI'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            {uiHidden ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </>
            )}
          </svg>
        </button>

        <button
          onClick={handleDownloadMap}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/20 text-white/80 hover:text-amber-300 hover:border-amber-400/50 transition-all duration-200 cursor-pointer"
          style={{ background: 'rgba(10, 10, 16, 0.7)', backdropFilter: 'blur(12px)' }}
          title="Download map as PNG"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
        </button>
      </div>

      {!uiHidden && (
        <>
          <IconRail />
          <BottomActionBar />

          <SearchBar />
          <TimelineControl />
          <GalaxyOverview />
          <MapControlsPanel />

          <InfoPanel />

          {isAdmin && hasPendingChanges && (
            <div className="absolute bottom-20 right-6 z-50 flex items-center gap-3 animate-slide-in-right">
              <button
                onClick={async () => {
                  setSaving(true);
                  await saveAllChanges();
                  setSaving(false);
                }}
                disabled={saving}
                className="holo-button holo-button-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => discardAllChanges()}
                disabled={saving}
                className="holo-button holo-button-sm holo-button-danger"
              >
                Discard
              </button>
            </div>
          )}

          {viewMode === 'topdown' && (
            <div className="absolute top-20 right-6 z-40 flex flex-col gap-2">
              <button
                onClick={() => requestZoom(-1)}
                className="holo-button holo-button-sm"
                title="Zoom in"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                </svg>
              </button>
              <button
                onClick={() => requestZoom(1)}
                className="holo-button holo-button-sm"
                title="Zoom out"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
                </svg>
              </button>
              <button
                onClick={() => requestCameraReset()}
                className="holo-button holo-button-sm"
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
              <Link to="/admin" className="holo-button holo-button-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin</span>
              </Link>
            )}
            <Link to="/" className="holo-button holo-button-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>AlphaSec</span>
            </Link>
          </div>

          <div className="absolute top-5 right-5 z-40">
            {session && (
              <div className="holo-account-shell">
                <div className="flex items-center gap-3 px-5 py-2.5">
                  <span
                    className="text-[13px] font-semibold tracking-[0.1em] uppercase"
                    style={{ fontFamily: 'Oxanium, Orbitron, monospace', color: 'rgba(255, 255, 255, 0.8)' }}
                  >
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="holo-account-action"
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
                  color: 'rgba(255, 255, 255, 0.8)',
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
                      color: 'rgba(255, 255, 255, 0.8)',
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
        </>
      )}

      <LoadingScreen />
    </div>
  );
}
