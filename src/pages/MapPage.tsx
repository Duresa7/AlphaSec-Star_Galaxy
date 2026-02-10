import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GalaxyScene } from '@/components/galaxy/GalaxyScene';
import { InfoPanel } from '@/components/panels/InfoPanel';
import { ControlsPanel } from '@/components/panels/ControlsPanel';
import { LoadingScreen } from '@/components/panels/LoadingScreen';
import { useGalaxyStore } from '@/store/galaxyStore';

export function MapPage() {
  const { viewMode, initializeData } = useGalaxyStore();
  const viewLabel = viewMode === 'topdown' ? 'Galaxy Map' : viewMode === 'system' ? 'Planet View' : 'Fleet View';

  // Load custom data from localStorage on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 3D Galaxy Scene */}
      <GalaxyScene />

      {/* UI Overlays */}
      <ControlsPanel />
      <InfoPanel />
      <LoadingScreen />

      {/* Navigation */}
      <div className="absolute bottom-6 right-6 z-40">
        <Link to="/" className="holo-button" style={{ padding: '8px 14px' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span>Alpha Sec</span>
        </Link>
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
          Star Wars
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
            {viewLabel} &bull; Old Republic
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
