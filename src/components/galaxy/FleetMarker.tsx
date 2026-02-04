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
  
  const { showLabels, setInfoPanelData } = useGalaxyStore();
  
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
      {/* Fleet indicator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 6]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.8 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Ship count indicator dots */}
      {Array.from({ length: Math.min(fleet.shipCount / 20, 5) }).map((_, i) => (
        <mesh 
          key={i} 
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 1.2,
            0,
            Math.sin((i / 5) * Math.PI * 2) * 1.2
          ]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      
      {/* Try to load ship model, fallback to simple geometry */}
      <Suspense fallback={
        <mesh>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      }>
        <ShipModel 
          type={shipType} 
          position={new THREE.Vector3(0, 0, 0)} 
          scale={0.3}
          rotation={[0, Math.PI / 4, 0]}
        />
      </Suspense>
      
      {/* Label */}
      {showLabels && hovered && (
        <Html
          position={[0, 1.5, 0]}
          center
          distanceFactor={30}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div 
            className="text-center whitespace-nowrap px-2 py-1 rounded"
            style={{
              color: color,
              backgroundColor: 'rgba(0,0,0,0.7)',
              fontSize: '11px',
            }}
          >
            <div className="font-bold">{fleet.name}</div>
            <div className="text-xs opacity-75">{fleet.shipCount} ships</div>
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
