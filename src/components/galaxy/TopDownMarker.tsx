import { useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { StarSystem, Faction } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';

interface TopDownMarkerProps {
  system: StarSystem;
}

const FACTION_COLORS: Record<Faction, string> = {
  sith_empire: '#DC143C',
  galactic_republic: '#FFD700',
  neutral: '#808080',
  contested: '#FF8C00',
};

const IMPORTANCE_SIZE: Record<string, number> = {
  capital: 3.5,
  major: 2.5,
  minor: 1.8,
  outpost: 1.2,
};

export function TopDownMarker({ system }: TopDownMarkerProps) {
  const [hovered, setHovered] = useState(false);
  
  const { setSelectedSystem, setInfoPanelData, showLabels } = useGalaxyStore();
  
  const factionColor = FACTION_COLORS[system.faction];
  const markerSize = IMPORTANCE_SIZE[system.importance] || 0.4;
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedSystem(system.id);
    setInfoPanelData({
      type: 'system',
      data: system,
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
    <group position={system.position}>
      {/* Main marker dot */}
      <mesh
        onClick={handleClick}
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
      
      {/* Label - positioned above the planet */}
      {(showLabels || hovered || system.importance === 'capital') && (
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
