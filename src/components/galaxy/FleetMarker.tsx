import { useRef, useState, Suspense } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
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

export function FleetMarker({ fleet }: FleetMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const { setInfoPanelData, setSelectedFleet } = useGalaxyStore();
  
  const color = FACTION_COLORS[fleet.faction];
  const shipType = fleet.faction === 'sith_empire' ? 'sith' : 'republic';
  
  // Subtle bobbing animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = fleet.position.y + Math.sin(state.clock.elapsedTime + fleet.position.x) * 0.2;
    }
  });
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedFleet(fleet.id);
    setInfoPanelData({
      type: 'fleet',
      data: fleet,
    });
  };
  
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  
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
