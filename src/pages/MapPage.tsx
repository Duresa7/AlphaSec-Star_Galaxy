import { GalaxyScene } from '@/components/galaxy/GalaxyScene';
import { InfoPanel } from '@/components/panels/InfoPanel';
import { ControlsPanel } from '@/components/panels/ControlsPanel';
import { LoadingScreen } from '@/components/panels/LoadingScreen';

export function MapPage() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 3D Galaxy Scene */}
      <GalaxyScene />

      {/* UI Overlays */}
      <ControlsPanel />
      <InfoPanel />
      <LoadingScreen />

      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-0 mix-blend-screen opacity-80">
        <h1
          className="text-3xl font-black text-yellow-500 tracking-[0.4em] uppercase text-glow-yellow mb-1"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Star Wars
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-cyan-500/50"></div>
          <p className="text-[10px] text-cyan-400 font-bold tracking-[0.5em] uppercase text-glow-cyan">
            Galaxy Map • Old Republic
          </p>
          <div className="h-px w-8 bg-cyan-500/50"></div>
        </div>
      </div>
    </div>
  );
}
