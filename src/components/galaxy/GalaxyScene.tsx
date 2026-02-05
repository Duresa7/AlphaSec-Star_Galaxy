import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GalaxySkybox } from '@/components/three/ModelLoader';
import { CameraController } from '@/components/three/CameraController';
import { TopDownMarkers } from '@/components/galaxy/TopDownMarker';
import { GalaxyMapBackground } from '@/components/galaxy/GalaxyMapBackground';
import { FleetMarkers } from '@/components/galaxy/FleetMarker';
import { AnomalyMarkers } from '@/components/galaxy/AnomalyMarker';
import { SystemDetailView } from '@/components/galaxy/SystemDetailView';
import { FleetDetailView } from '@/components/galaxy/FleetDetailView';
import { useGalaxyStore } from '@/store/galaxyStore';
import {
  AMBIENT_LIGHT,
  DIRECTIONAL_LIGHT,
  POINT_LIGHTS,
  HEMISPHERE_LIGHT,
  BACKGROUND_COLOR,
} from '@/config/lightingConfig';

function GalaxyContent() {
  const {
    systems,
    setIsLoading,
    setSelectedSystem,
    setSelectedFleet,
    setInfoPanelData,
    viewMode,
    selectedSystemId,
    selectedFleetId,
    fleets
  } = useGalaxyStore();

  useEffect(() => {
    // Simulate loading complete
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  
  // Get selected system for detail view
  const selectedSystem = selectedSystemId 
    ? systems.find(s => s.id === selectedSystemId) 
    : null;
    
  // Get selected fleet for detail view
  const selectedFleet = selectedFleetId
    ? fleets.find(f => f.id === selectedFleetId)
    : null;
  
  // Handle clicking on empty space to deselect
  const handleCanvasClick = () => {
    if (viewMode === 'system') {
      // Go back to galaxy view
      setSelectedSystem(null);
      setInfoPanelData(null);
    } else if (viewMode === 'fleet') {
      setSelectedFleet(null);
      setInfoPanelData(null);
    }
  };
  
  // Get lighting config based on current view mode
  const isSystemView = viewMode === 'system';
  const ambientConfig = isSystemView ? AMBIENT_LIGHT.system : AMBIENT_LIGHT.galaxy;
  const hemisphereConfig = isSystemView ? HEMISPHERE_LIGHT.system : HEMISPHERE_LIGHT.galaxy;
  const directionalConfig = isSystemView ? DIRECTIONAL_LIGHT.system : DIRECTIONAL_LIGHT.galaxy;
  const pointLightsConfig = isSystemView ? POINT_LIGHTS.system : POINT_LIGHTS.galaxy;
  
  return (
    <group onClick={handleCanvasClick}>
      {/* Environment map for subtle reflections on metallic surfaces */}
      <Environment preset="night" background={false} blur={0.5} />
      
      {/* Hemisphere light for subtle sky/ground gradient */}
      <hemisphereLight
        args={[hemisphereConfig.skyColor, hemisphereConfig.groundColor, hemisphereConfig.intensity]}
      />
      
      {/* Ambient lighting - base illumination */}
      <ambientLight intensity={ambientConfig.intensity} color={ambientConfig.color} />
      
      {/* Main directional light - simulates distant star */}
      <directionalLight
        position={directionalConfig.position}
        intensity={directionalConfig.intensity}
        color={directionalConfig.color}
        castShadow={directionalConfig.castShadow}
      />
      
      {/* Point lights for atmospheric colored illumination */}
      {pointLightsConfig.map((light) => (
        <pointLight
          key={light.name}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
          decay={light.decay}
        />
      ))}
      
      {/* Galaxy skybox - Blender model with stars and nebula */}
      <GalaxySkybox />
      
      {/* Conditional rendering based on view mode */}
      {viewMode === 'topdown' && (
        <TopDownView />
      )}
      
      {viewMode === 'system' && selectedSystem && (
        <group position={selectedSystem.position}>
          <SystemDetailView system={selectedSystem} />
        </group>
      )}

      {viewMode === 'fleet' && selectedFleet && (
        <group position={selectedFleet.position}>
          <FleetDetailView fleet={selectedFleet} />
        </group>
      )}
      
      {/* Camera controls */}
      <CameraController />
    </group>
  );
}

// Top-down view components (2D map with markers)
function TopDownView() {
  return (
    <>
      {/* Procedural galaxy map background */}
      <GalaxyMapBackground />
      
      {/* Anomalies (nebulae, black holes, stations) */}
      <AnomalyMarkers />
      
      {/* Fleet markers */}
      <FleetMarkers />
      
      {/* Top-down planet markers (placeholder dots, not 3D models) */}
      <TopDownMarkers />
    </>
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
        far: 2000,
      }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      shadows
      style={{
        background: BACKGROUND_COLOR,
      }}
    >
      <color attach="background" args={[BACKGROUND_COLOR]} />
      
      <Suspense fallback={<LoadingFallback />}>
        <GalaxyContent />
      </Suspense>
    </Canvas>
  );
}
