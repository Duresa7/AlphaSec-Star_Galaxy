import { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Fleet } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { ShipModel } from '@/components/three/ModelLoader';

interface FleetDetailViewProps {
  fleet: Fleet;
}

export function FleetDetailView({ fleet }: FleetDetailViewProps) {
  const { showLabels } = useGalaxyStore();
  const groupRef = useRef<THREE.Group>(null);

  const shipType = fleet.faction === 'sith_empire' ? 'sith' : 'republic';
  const factionColor = fleet.faction === 'sith_empire' ? '#DC143C' : '#FFD700';

  // Larger scale for detail view
  const shipScale = 8;

  return (
    <group ref={groupRef}>
      {/* Main Ship Model */}
      <Suspense fallback={
        <mesh scale={shipScale}>
          <boxGeometry args={[1, 0.5, 2]} />
          <meshStandardMaterial color={factionColor} wireframe />
        </mesh>
      }>
        <ShipModel 
          type={shipType} 
          position={new THREE.Vector3(0, 0, 0)} 
          scale={shipScale}
          rotation={[0, Math.PI / 4, 0]}
        />
      </Suspense>

      {/* Formation ships - add a few smaller ones for atmosphere */}
      {[...Array(2)].map((_, i) => (
        <Suspense key={i} fallback={null}>
          <ShipModel 
            type={shipType}
            position={new THREE.Vector3(
              (i === 0 ? -12 : 12), 
              (i === 0 ? 2 : -2), 
              -10
            )}
            scale={shipScale * 0.4}
            rotation={[0, Math.PI / 4, 0]}
          />
        </Suspense>
      ))}

      {/* Fleet Info Label */}
      {showLabels && (
        <Html
          position={[0, 8, 0]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="text-center whitespace-nowrap holo-tooltip" style={{ padding: '12px 16px' }}>
            <div className="text-base font-semibold text-white">{fleet.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {fleet.commander || 'Unknown Commander'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
