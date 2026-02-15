import { memo, useState } from 'react';
import { Html } from '@react-three/drei';
import type { StarSystem } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { FACTION_MARKER_COLORS } from '@/constants/factions';
import { useMarkerInteraction } from '@/hooks/useMarkerInteraction';
import {
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
} from '@/config/topDownMarkerConfig';

interface TopDownMarkerProps {
  system: StarSystem;
}

const TopDownMarker = memo(function TopDownMarker({ system }: TopDownMarkerProps) {
  const [hovered, setHovered] = useState(false);

  const setSelectedSystem = useGalaxyStore((s) => s.setSelectedSystem);
  const setTopDownSelection = useGalaxyStore((s) => s.setTopDownSelection);
  const setSelectedPlanet = useGalaxyStore((s) => s.setSelectedPlanet);
  const setInfoPanelData = useGalaxyStore((s) => s.setInfoPanelData);
  const showLabels = useGalaxyStore((s) => s.showLabels);
  const previewCustomSystemPosition = useGalaxyStore((s) => s.previewCustomSystemPosition);
  const updateCustomSystemPosition = useGalaxyStore((s) => s.updateCustomSystemPosition);
  const setDraggingCustomPlanet = useGalaxyStore((s) => s.setDraggingCustomPlanet);
  const placementMode = useGalaxyStore((s) => s.placementMode);

  const primaryPlanetColor = system.planets[0]?.customColor;
  const factionColor = primaryPlanetColor
    || (system.isCustom && system.customColor ? system.customColor : null)
    || FACTION_MARKER_COLORS[system.faction];
  const markerSize =
    system.markerSize ??
    TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE[system.importance] ??
    DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE;

  const openTopDownPlanetEditor = () => {
    const primaryPlanet = system.planets[0];
    setTopDownSelection(system.id, primaryPlanet?.id ?? null);
    if (primaryPlanet) {
      setInfoPanelData({ type: 'planet', data: primaryPlanet });
      return;
    }
    setInfoPanelData({ type: 'system', data: system });
  };

  const {
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerOver: basePointerOver,
    handlePointerOut: basePointerOut,
  } = useMarkerInteraction({
    entityId: system.id,
    position: system.position,
    placementMode,
    onSingleClick: openTopDownPlanetEditor,
    onDoubleClick: () => {
      const primaryPlanet = system.planets[0];
      setSelectedSystem(system.id);
      if (primaryPlanet) {
        setSelectedPlanet(primaryPlanet.id);
        setInfoPanelData({ type: 'planet', data: primaryPlanet });
        return;
      }
      setInfoPanelData({ type: 'system', data: system });
    },
    previewPosition: previewCustomSystemPosition,
    commitPosition: updateCustomSystemPosition,
    setDragging: setDraggingCustomPlanet,
  });

  return (
    <group position={system.position}>
      <mesh
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => { basePointerOver(e); setHovered(true); }}
        onPointerOut={() => { basePointerOut(); setHovered(false); }}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[markerSize * (hovered ? 1.3 : 1), 16]} />
        <meshBasicMaterial
          color={factionColor}
          transparent
          opacity={hovered ? 1 : 0.9}
        />
      </mesh>

      {system.isCustom && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 1.1, markerSize * 1.3, 32]} />
          <meshBasicMaterial
            color={factionColor}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {(showLabels || hovered || system.importance === 'capital' || system.isCustom) && (
        <Html
          position={[0, 0, -markerSize * 1.5]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="text-center whitespace-nowrap px-3 py-1 rounded"
            style={{
              color: '#FFFFFF',
              backgroundColor: hovered ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)',
              textShadow: `0 0 10px ${factionColor}, 0 0 5px ${factionColor}`,
              fontSize: system.importance === 'capital' ? '16px' : '13px',
              fontWeight: 'bold',
              borderBottom: `2px solid ${factionColor}`,
            }}
          >
            {system.name}
          </div>
        </Html>
      )}
    </group>
  );
});

export { TopDownMarker };

export function TopDownMarkers() {
  const getFilteredSystems = useGalaxyStore((s) => s.getFilteredSystems);
  const systems = getFilteredSystems();

  return (
    <>
      {systems.map(system => (
        <TopDownMarker key={system.id} system={system} />
      ))}
    </>
  );
}
