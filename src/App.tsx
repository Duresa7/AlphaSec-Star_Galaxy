import { GalaxyScene } from '@/components/galaxy/GalaxyScene';
import { InfoPanel } from '@/components/ui/InfoPanel';
import { ControlsPanel } from '@/components/ui/ControlsPanel';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { TimelinePanel } from '@/components/ui/TimelinePanel';
import { BackToGalaxyButton } from '@/components/ui/BackButton';

function App() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* 3D Galaxy Scene */}
      <GalaxyScene />
      
      {/* UI Overlays */}
      <BackToGalaxyButton />
      <ControlsPanel />
      <InfoPanel />
      <TimelinePanel />
      <LoadingScreen />
      
      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1 className="text-2xl font-bold text-yellow-500/80 tracking-[0.3em] drop-shadow-lg">
          STAR WARS
        </h1>
        <p className="text-sm text-cyan-400/60 tracking-widest">
          GALAXY MAP • OLD REPUBLIC ERA
        </p>
      </div>
    </div>
  );
}

export default App;
