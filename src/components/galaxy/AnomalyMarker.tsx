import { useRef, useState, Suspense } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Anomaly } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { AnomalyModel } from '@/components/three/ModelLoader';

interface AnomalyMarkerProps {
  anomaly: Anomaly;
}

const ANOMALY_COLORS = {
  nebula: '#9400D3',
  black_hole: '#FF4500',
  space_station: '#00CED1',
  hyperspace_lane: '#00BFFF',
};

function AnomalyMarker({ anomaly }: AnomalyMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const { showLabels, setInfoPanelData } = useGalaxyStore();

  const color = ANOMALY_COLORS[anomaly.type] || '#FFFFFF';
  useFrame((state) => {
    if (groupRef.current) {
      if (anomaly.type === 'black_hole') {
        groupRef.current.rotation.y += 0.02;
      } else if (anomaly.type === 'nebula') {
        const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 1;
        groupRef.current.scale.setScalar(pulse);
      }
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setInfoPanelData({
      type: 'anomaly',
      data: anomaly,
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
  const renderFallback = () => {
    switch (anomaly.type) {
      case 'black_hole':
        return (
          <group>

            <mesh>
              <sphereGeometry args={[anomaly.radius * 0.3, 32, 32]} />
              <meshBasicMaterial color="#000000" />
            </mesh>

            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[anomaly.radius * 0.6, anomaly.radius * 0.15, 16, 32]} />
              <meshBasicMaterial color="#FF4500" transparent opacity={0.7} />
            </mesh>

            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[anomaly.radius * 0.8, anomaly.radius, 32]} />
              <meshBasicMaterial color="#FF6B00" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );

      case 'nebula':
        return (
          <group>

            {[0.6, 0.8, 1.0].map((scale, i) => (
              <mesh key={i} scale={scale}>
                <icosahedronGeometry args={[anomaly.radius, 1]} />
                <meshBasicMaterial
                  color={i === 2 ? '#9400D3' : i === 1 ? '#00CED1' : '#FF69B4'}
                  transparent
                  opacity={0.3 - i * 0.08}
                  wireframe={i === 0}
                />
              </mesh>
            ))}
          </group>
        );

      case 'space_station':
        return (
          <group>

            <mesh>
              <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
              <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
            </mesh>

            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.2, 0.15, 8, 16]} />
              <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
            </mesh>

            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#00BFFF" />
            </mesh>
          </group>
        );

      case 'hyperspace_lane':
        return (
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
              <meshBasicMaterial color="#00BFFF" transparent opacity={0.5} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh>
            <sphereGeometry args={[anomaly.radius * 0.5, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={groupRef}
      position={anomaly.position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >

      <Suspense fallback={renderFallback()}>
        <AnomalyModel
          type={anomaly.type}
          position={new THREE.Vector3(0, 0, 0)}
          scale={anomaly.radius * 0.5}
        />
      </Suspense>


      {hovered && (
        <mesh>
          <sphereGeometry args={[anomaly.radius * 1.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      )}


      {showLabels && hovered && (
        <Html
          position={[0, anomaly.radius + 2, 0]}
          center
          distanceFactor={30}
          zIndexRange={[0, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="text-center whitespace-nowrap holo-tooltip" style={{ minWidth: '100px' }}>
            <div className="font-medium text-white text-xs">{anomaly.name}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 capitalize">{anomaly.type.replace('_', ' ')}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
export function AnomalyMarkers() {
  const { anomalies, showAnomalies } = useGalaxyStore();

  if (!showAnomalies) return null;

  return (
    <group>
      {anomalies.map(anomaly => (
        <AnomalyMarker key={anomaly.id} anomaly={anomaly} />
      ))}
    </group>
  );
}
