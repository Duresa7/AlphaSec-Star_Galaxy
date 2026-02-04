import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Starfield } from '@/components/three/Starfield';
import { CameraController } from '@/components/three/CameraController';
import { SystemMarker } from '@/components/galaxy/SystemMarker';
import { HyperspaceLanes } from '@/components/galaxy/HyperspaceLanes';
import { FleetMarkers } from '@/components/galaxy/FleetMarker';
import { AnomalyMarkers } from '@/components/galaxy/AnomalyMarker';
import { SystemDetailView } from '@/components/galaxy/SystemDetailView';
import { useGalaxyStore } from '@/store/galaxyStore';
import type { StarSystem, HyperspaceLane } from '@/types';

function GalaxyContent() {
  const { 
    systems, 
    hyperspaceLanes, 
    showHyperspaceLanes,
    setIsLoading,
    setSelectedSystem,
    setInfoPanelData,
    viewMode,
    selectedSystemId,
    getFilteredSystems,
  } = useGalaxyStore();
  
  useEffect(() => {
    // Simulate loading complete
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  
  // Get filtered systems for display
  const filteredSystems = getFilteredSystems();
  
  // Get selected system for detail view
  const selectedSystem = selectedSystemId 
    ? systems.find(s => s.id === selectedSystemId) 
    : null;
  
  // Handle clicking on empty space to deselect
  const handleCanvasClick = () => {
    if (viewMode === 'system') {
      // Go back to galaxy view
      setSelectedSystem(null);
      setInfoPanelData(null);
    }
  };
  
  return (
    <group onClick={handleCanvasClick}>
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      
      {/* Point lights for galaxy illumination */}
      <pointLight position={[0, 20, 0]} intensity={0.8} color="#FFD700" distance={100} />
      <pointLight position={[50, 10, 30]} intensity={0.5} color="#DC143C" distance={80} />
      <pointLight position={[-20, 5, -10]} intensity={0.3} color="#1E90FF" distance={60} />
      
      {/* Background starfield - always visible */}
      <Starfield count={20000} radius={500} />
      
      {/* Conditional rendering based on view mode */}
      {viewMode === 'galaxy' && (
        <GalaxyView 
          systems={filteredSystems}
          allSystems={systems}
          hyperspaceLanes={hyperspaceLanes}
          showHyperspaceLanes={showHyperspaceLanes}
        />
      )}
      
      {viewMode === 'system' && selectedSystem && (
        <group position={selectedSystem.position}>
          <SystemDetailView system={selectedSystem} />
        </group>
      )}
      
      {/* Camera controls */}
      <CameraController />
    </group>
  );
}

// Galaxy-level view components
interface GalaxyViewProps {
  systems: StarSystem[];
  allSystems: StarSystem[];
  hyperspaceLanes: HyperspaceLane[];
  showHyperspaceLanes: boolean;
}

function GalaxyView({ systems, allSystems, hyperspaceLanes, showHyperspaceLanes }: GalaxyViewProps) {
  return (
    <>
      {/* Galaxy plane effect - spiral arms hint */}
      <GalaxyPlane />
      
      {/* Hyperspace lanes - use all systems for lane connections */}
      {showHyperspaceLanes && (
        <HyperspaceLanes lanes={hyperspaceLanes} systems={allSystems} />
      )}
      
      {/* Anomalies (nebulae, black holes, stations) */}
      <AnomalyMarkers />
      
      {/* Fleet markers */}
      <FleetMarkers />
      
      {/* Star systems - only show filtered */}
      {systems.map(system => (
        <SystemMarker key={system.id} system={system} />
      ))}
    </>
  );
}

// Galaxy plane with subtle spiral arm effect
function GalaxyPlane() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      {/* Core glow */}
      <mesh>
        <circleGeometry args={[15, 32]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Mid disc */}
      <mesh>
        <ringGeometry args={[15, 60, 64]} />
        <meshBasicMaterial 
          color="#1a1a2e" 
          transparent 
          opacity={0.2}
        />
      </mesh>
      
      {/* Outer halo */}
      <mesh>
        <ringGeometry args={[60, 100, 64]} />
        <meshBasicMaterial 
          color="#0f0f1a" 
          transparent 
          opacity={0.1}
        />
      </mesh>
      
      {/* Faction territory indicators */}
      {/* Republic Core */}
      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[20, 32]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.05}
        />
      </mesh>
      
      {/* Sith Empire region */}
      <mesh position={[50, 30, 0.1]}>
        <circleGeometry args={[15, 32]} />
        <meshBasicMaterial 
          color="#DC143C" 
          transparent 
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[2, 0.5, 16, 32]} />
        <meshBasicMaterial color="#00BFFF" wireframe />
      </mesh>
    </group>
  );
}

export function GalaxyScene() {
  return (
    <Canvas
      camera={{
        position: [0, 60, 100],
        fov: 60,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        alpha: false,
      }}
      style={{
        background: '#0a0a0f',
      }}
    >
      <color attach="background" args={['#050508']} />
      <fog attach="fog" args={['#050508', 150, 500]} />
      
      <Suspense fallback={<LoadingFallback />}>
        <GalaxyContent />
      </Suspense>
    </Canvas>
  );
}
