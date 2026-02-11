import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ThreeEvent } from '@react-three/fiber';
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
import { useRole } from '@/hooks/useRole';
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
    viewMode,
    selectedSystemId,
    selectedFleetId,
    fleets,
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
  
  // Get lighting config based on current view mode
  const isSystemView = viewMode === 'system';
  const ambientConfig = isSystemView ? AMBIENT_LIGHT.system : AMBIENT_LIGHT.galaxy;
  const hemisphereConfig = isSystemView ? HEMISPHERE_LIGHT.system : HEMISPHERE_LIGHT.galaxy;
  const directionalConfig = isSystemView ? DIRECTIONAL_LIGHT.system : DIRECTIONAL_LIGHT.galaxy;
  const pointLightsConfig = isSystemView ? POINT_LIGHTS.system : POINT_LIGHTS.galaxy;
  
  return (
    <group>
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
  const { isAdmin } = useRole();
  const { placementMode, pendingCustomPlanet, addCustomSystem, fleetPlacementMode, pendingCustomFleet, addCustomFleet } = useGalaxyStore();

  const handlePlacementClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isAdmin) return;
    if (!placementMode && !fleetPlacementMode) return;
    e.stopPropagation();
    const point = e.point;

    if (placementMode && pendingCustomPlanet) {
      const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      addCustomSystem({
        id: uniqueId,
        name: pendingCustomPlanet.name,
        position: new THREE.Vector3(point.x, 0, point.z),
        faction: 'neutral' as const,
        starType: 'white' as const,
        importance: 'minor' as const,
        description: `Custom planet: ${pendingCustomPlanet.name}`,
        region: 'unknown_regions' as const,
        isCustom: true,
        customColor: pendingCustomPlanet.color,
        planets: [{
          id: `${uniqueId}-prime`,
          name: pendingCustomPlanet.name,
          type: 'terrestrial' as const,
          position: new THREE.Vector3(0, 0, 0),
          radius: 1,
          faction: 'neutral' as const,
          description: `Custom planet: ${pendingCustomPlanet.name}`,
          systemId: uniqueId,
        }],
      });
      return;
    }

    if (fleetPlacementMode && pendingCustomFleet) {
      addCustomFleet({
        id: `custom-fleet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: pendingCustomFleet.name,
        position: new THREE.Vector3(point.x, 0, point.z),
        faction: pendingCustomFleet.faction,
        shipCount: pendingCustomFleet.shipCount,
        isCustom: true,
      });
    }
  };

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

      {/* Invisible ground plane for placement clicks */}
      {(placementMode || fleetPlacementMode) && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          onClick={handlePlacementClick}
        >
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
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
  const {
    viewMode,
    placementMode,
    fleetPlacementMode,
    setSelectedSystem,
    setSelectedFleet,
    setInfoPanelData,
  } = useGalaxyStore();

  // Only deselect when clicking empty space, not when clicking selectable objects.
  const handlePointerMissed = () => {
    if (placementMode || fleetPlacementMode) return;
    switch (viewMode) {
      case 'system':
        setSelectedSystem(null);
        setInfoPanelData(null);
        break;
      case 'fleet':
        setSelectedFleet(null);
        setInfoPanelData(null);
        break;
      default:
        break;
    }
  };

  return (
    <Canvas
      onPointerMissed={handlePointerMissed}
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
