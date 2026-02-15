import { memo, useMemo, useRef, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Fleet } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { FACTION_MARKER_COLORS } from '@/constants/factions';
import { useMarkerInteraction } from '@/hooks/useMarkerInteraction';
import { ShipModel } from '@/components/three/ModelLoader';
import { DEFAULT_TOPDOWN_FLEET_MARKER_SIZE } from '@/config/topDownMarkerConfig';

interface FleetMarkerProps {
  fleet: Fleet;
}

function useDiamondShape(size: number) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, size);
    shape.lineTo(size, 0);
    shape.lineTo(0, -size);
    shape.lineTo(-size, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [size]);
}

const FleetMarker = memo(function FleetMarker({ fleet }: FleetMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const setInfoPanelData = useGalaxyStore((s) => s.setInfoPanelData);
  const setTopDownFleetSelection = useGalaxyStore((s) => s.setTopDownFleetSelection);
  const setSelectedFleet = useGalaxyStore((s) => s.setSelectedFleet);
  const showLabels = useGalaxyStore((s) => s.showLabels);
  const previewCustomFleetPosition = useGalaxyStore((s) => s.previewCustomFleetPosition);
  const updateCustomFleetPosition = useGalaxyStore((s) => s.updateCustomFleetPosition);
  const setDraggingCustomFleet = useGalaxyStore((s) => s.setDraggingCustomFleet);
  const fleetPlacementMode = useGalaxyStore((s) => s.fleetPlacementMode);

  const color = FACTION_MARKER_COLORS[fleet.faction];
  const shipType = fleet.modelType;
  const markerSize = fleet.markerSize ?? DEFAULT_TOPDOWN_FLEET_MARKER_SIZE;
  const markerScale = markerSize / DEFAULT_TOPDOWN_FLEET_MARKER_SIZE;
  const diamondGeo = useDiamondShape(markerSize);

  const openTopDownFleetEditor = () => {
    setTopDownFleetSelection(fleet.id);
    setInfoPanelData({ type: 'fleet', data: fleet });
  };

  useFrame((state) => {
    if (groupRef.current && !fleet.isCustom) {
      groupRef.current.position.y = fleet.position.y + Math.sin(state.clock.elapsedTime + fleet.position.x) * 0.2;
    }
  });

  const {
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerOver: basePointerOver,
    handlePointerOut: basePointerOut,
  } = useMarkerInteraction({
    entityId: fleet.id,
    position: fleet.position,
    placementMode: fleetPlacementMode,
    onSingleClick: openTopDownFleetEditor,
    onDoubleClick: () => {
      setSelectedFleet(fleet.id);
      setInfoPanelData({ type: 'fleet', data: fleet });
    },
    previewPosition: previewCustomFleetPosition,
    commitPosition: updateCustomFleetPosition,
    setDragging: setDraggingCustomFleet,
  });

  if (fleet.isCustom) {
    return (
      <group position={fleet.position}>
        <mesh
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e) => { basePointerOver(e); setHovered(true); }}
          onPointerOut={() => { basePointerOut(); setHovered(false); }}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={diamondGeo}
          scale={hovered ? 1.3 : 1}
        >
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 1 : 0.9}
          />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 1.1, markerSize * 1.3, 4]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>

        {(showLabels || hovered || fleet.isCustom) && (
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
                textShadow: `0 0 10px ${color}, 0 0 5px ${color}`,
                fontSize: '13px',
                fontWeight: 'bold',
                borderBottom: `2px solid ${color}`,
              }}
            >
              {fleet.name}
              <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.7 }}>
                {fleet.shipCount} ships
              </div>
            </div>
          </Html>
        )}
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={fleet.position}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => { basePointerOver(e); setHovered(true); }}
      onPointerOut={() => { basePointerOut(); setHovered(false); }}
    >
      <Suspense fallback={
        <mesh scale={markerScale}>
          <coneGeometry args={[2, 5, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      }>
        <ShipModel
          type={shipType}
          position={new THREE.Vector3(0, 0, 0)}
          scale={3 * markerScale}
          rotation={[0, Math.PI / 4, 0]}
        />
      </Suspense>

      {hovered && (
        <Html
          position={[0, markerSize * 1.8, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="text-center whitespace-nowrap holo-tooltip"
            style={{ minWidth: '100px' }}
          >
            <div className="font-medium text-white text-xs">{fleet.name}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{fleet.shipCount} ships</div>
          </div>
        </Html>
      )}
    </group>
  );
});

export { FleetMarker };

export function FleetMarkers() {
  const fleets = useGalaxyStore((s) => s.fleets);
  const showFleets = useGalaxyStore((s) => s.showFleets);

  if (!showFleets) return null;

  return (
    <group>
      {fleets.map(fleet => (
        <FleetMarker key={fleet.id} fleet={fleet} />
      ))}
    </group>
  );
}
