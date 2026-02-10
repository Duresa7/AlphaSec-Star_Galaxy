import { useEffect, useRef, useState } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StarSystem, Faction } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import {
  DRAG_THRESHOLD_PX,
  SINGLE_CLICK_DELAY_MS,
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
} from '@/config/topDownMarkerConfig';

interface TopDownMarkerProps {
  system: StarSystem;
}

const FACTION_COLORS: Record<Faction, string> = {
  sith_empire: '#DC143C',
  galactic_republic: '#FFD700',
  neutral: '#808080',
  contested: '#FF8C00',
  hutt_cartel: '#8B9A46',
};

function TopDownMarker({ system }: TopDownMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const dragOriginRef = useRef<THREE.Vector3 | null>(null);
  const dragPositionRef = useRef<THREE.Vector3 | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const { gl, camera } = useThree();
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const {
    setSelectedSystem,
    setTopDownSelection,
    setSelectedPlanet,
    setInfoPanelData,
    showLabels,
    previewCustomSystemPosition,
    updateCustomSystemPosition,
    setDraggingCustomPlanet,
    placementMode,
  } = useGalaxyStore();

  const factionColor = system.isCustom && system.customColor
    ? system.customColor
    : FACTION_COLORS[system.faction];
  const markerSize =
    system.markerSize ??
    TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE[system.importance] ??
    DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE;

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const openTopDownPlanetEditor = () => {
    const primaryPlanet = system.planets[0];
    setTopDownSelection(system.id, primaryPlanet?.id ?? null);
    if (primaryPlanet) {
      setInfoPanelData({
        type: 'planet',
        data: primaryPlanet,
      });
      return;
    }
    setInfoPanelData({
      type: 'system',
      data: system,
    });
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (placementMode) return;
    e.stopPropagation();
    if (clickTimeoutRef.current !== null) return;
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
      openTopDownPlanetEditor();
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (placementMode) return;
    e.stopPropagation();
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    const primaryPlanet = system.planets[0];
    setSelectedSystem(system.id);
    if (primaryPlanet) {
      setSelectedPlanet(primaryPlanet.id);
      setInfoPanelData({
        type: 'planet',
        data: primaryPlanet,
      });
      return;
    }
    setInfoPanelData({
      type: 'system',
      data: system,
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (placementMode) return;
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOriginRef.current = system.position.clone();
    dragPositionRef.current = system.position.clone();
    didDragRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
        isDraggingRef.current = true;
        setDraggingCustomPlanet(true);
        didDragRef.current = true;
      }
      if (didDragRef.current) {
        // Raycast against Y=0 plane from current mouse position
        const rect = gl.domElement.getBoundingClientRect();
        const mouseX = ((moveEvent.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((moveEvent.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        if (intersection) {
          const nextPosition = new THREE.Vector3(intersection.x, 0, intersection.z);
          dragPositionRef.current = nextPosition.clone();
          previewCustomSystemPosition(system.id, nextPosition);
        }
      }
    };

    const onPointerUp = () => {
      if (didDragRef.current && dragPositionRef.current) {
        const origin = dragOriginRef.current ?? system.position.clone();
        updateCustomSystemPosition(system.id, dragPositionRef.current, origin);
      }

      dragStartRef.current = null;
      isDraggingRef.current = false;
      setDraggingCustomPlanet(false);
      dragOriginRef.current = null;
      dragPositionRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'grab';
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (!isDraggingRef.current) {
      document.body.style.cursor = 'auto';
    }
  };

  return (
    <group position={system.position}>
      {/* Main marker dot */}
      <mesh
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[markerSize * (hovered ? 1.3 : 1), 16]} />
        <meshBasicMaterial
          color={factionColor}
          transparent
          opacity={hovered ? 1 : 0.9}
        />
      </mesh>

      {/* Custom planet glow ring */}
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

      {/* Label - positioned above the planet */}
      {(showLabels || hovered || system.importance === 'capital' || system.isCustom) && (
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
}

// Render all systems as top-down markers
export function TopDownMarkers() {
  const { getFilteredSystems } = useGalaxyStore();
  const systems = getFilteredSystems();

  return (
    <>
      {systems.map(system => (
        <TopDownMarker key={system.id} system={system} />
      ))}
    </>
  );
}
