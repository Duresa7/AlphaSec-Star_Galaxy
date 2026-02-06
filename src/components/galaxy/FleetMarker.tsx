import { useRef, useState, useMemo, Suspense } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Fleet, Faction } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { ShipModel } from '@/components/three/ModelLoader';

interface FleetMarkerProps {
  fleet: Fleet;
}

const FACTION_COLORS: Record<Faction, string> = {
  sith_empire: '#DC143C',
  galactic_republic: '#FFD700',
  neutral: '#808080',
  contested: '#FF8C00',
};

const DRAG_THRESHOLD = 2;

// Diamond shape geometry for custom fleet markers in top-down view
function useDiamondShape(size: number) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, size);      // top
    shape.lineTo(size, 0);      // right
    shape.lineTo(0, -size);     // bottom
    shape.lineTo(-size, 0);     // left
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [size]);
}

export function FleetMarker({ fleet }: FleetMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const { gl, camera } = useThree();
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const {
    setInfoPanelData,
    setSelectedFleet,
    showLabels,
    updateCustomFleetPosition,
    setDraggingCustomFleet,
    fleetPlacementMode,
  } = useGalaxyStore();

  const color = FACTION_COLORS[fleet.faction];
  const shipType = fleet.faction === 'sith_empire' ? 'sith' : 'republic';
  const markerSize = 2.2;
  const diamondGeo = useDiamondShape(markerSize);

  // Subtle bobbing animation for non-custom fleets
  useFrame((state) => {
    if (groupRef.current && !fleet.isCustom) {
      groupRef.current.position.y = fleet.position.y + Math.sin(state.clock.elapsedTime + fleet.position.x) * 0.2;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (fleetPlacementMode) return;
    e.stopPropagation();
    setSelectedFleet(fleet.id);
    setInfoPanelData({
      type: 'fleet',
      data: fleet,
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!fleet.isCustom || fleetPlacementMode) return;
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        setDraggingCustomFleet(true);
        didDragRef.current = true;
      }
      if (didDragRef.current) {
        const rect = gl.domElement.getBoundingClientRect();
        const mouseX = ((moveEvent.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((moveEvent.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        if (intersection) {
          updateCustomFleetPosition(fleet.id, new THREE.Vector3(intersection.x, 0, intersection.z));
        }
      }
    };

    const onPointerUp = () => {
      dragStartRef.current = null;
      isDraggingRef.current = false;
      setDraggingCustomFleet(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = fleet.isCustom ? 'grab' : 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (!isDraggingRef.current) {
      document.body.style.cursor = 'auto';
    }
  };

  // Custom fleets use diamond marker in top-down view
  if (fleet.isCustom) {
    return (
      <group position={fleet.position}>
        {/* Diamond marker */}
        <mesh
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
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

        {/* Custom fleet glow ring (diamond outline) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 1.1, markerSize * 1.3, 4]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Label - always show for custom fleets */}
        {(showLabels || hovered || fleet.isCustom) && (
          <Html
            position={[0, 0, -markerSize * 1.5]}
            center
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
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

  // Built-in fleets use 3D ship models
  return (
    <group
      ref={groupRef}
      position={fleet.position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Try to load ship model, fallback to simple geometry */}
      <Suspense fallback={
        <mesh>
          <coneGeometry args={[2, 5, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      }>
        <ShipModel
          type={shipType}
          position={new THREE.Vector3(0, 0, 0)}
          scale={3}
          rotation={[0, Math.PI / 4, 0]}
        />
      </Suspense>

      {/* Label / Tooltip - Shows stats on hover */}
      {hovered && (
        <Html
          position={[0, 4, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="text-center whitespace-nowrap apple-tooltip"
            style={{ minWidth: '100px' }}
          >
            <div className="font-medium text-white text-xs">{fleet.name}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{fleet.shipCount} ships</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Fleet markers container
export function FleetMarkers() {
  const { fleets, showFleets } = useGalaxyStore();

  if (!showFleets) return null;

  return (
    <group>
      {fleets.map(fleet => (
        <FleetMarker key={fleet.id} fleet={fleet} />
      ))}
    </group>
  );
}
