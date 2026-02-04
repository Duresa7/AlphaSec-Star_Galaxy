import { useRef, useState, Suspense } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StarSystem, Faction } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { PlanetModel, hasPlanetModel } from '@/components/three/ModelLoader';

interface SystemMarkerProps {
  system: StarSystem;
}

const FACTION_COLORS: Record<Faction, string> = {
  sith_empire: '#DC143C',
  galactic_republic: '#FFD700',
  neutral: '#808080',
  contested: '#FF8C00',
};

const IMPORTANCE_SCALE: Record<string, number> = {
  capital: 1.2,
  major: 1.0,
  minor: 0.9,
  outpost: 0.8,
};

export function SystemMarker({ system }: SystemMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const { selectedSystemId, setSelectedSystem, showLabels, setInfoPanelData } = useGalaxyStore();
  const isSelected = selectedSystemId === system.id;
  
  const importanceScale = IMPORTANCE_SCALE[system.importance] || 1.0;
  const factionColor = FACTION_COLORS[system.faction];
  
  // Get the first planet in the system (if any)
  const planet = system.planets[0];
  const hasPlanet = planet && hasPlanetModel(planet.id);
  const planetScale = planet ? planet.radius * 1.6 * importanceScale : importanceScale * 0.4;
  
  
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
      {/* Planet model or fallback sphere */}
      <group
        ref={groupRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {hasPlanet ? (
          <Suspense fallback={
            <mesh scale={planetScale}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
          }>
            <group scale={planetScale}>
              <PlanetModel
                planetId={planet.id}
                position={new THREE.Vector3(0, 0, 0)}
                scale={1}
              />
            </group>
          </Suspense>
        ) : (
          // Fallback for systems without planet models - simple dot
          <mesh scale={planetScale}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial 
              color={factionColor}
              emissive={factionColor}
              emissiveIntensity={0.3}
            />
          </mesh>
        )}
      </group>
      
      {/* Label */}
      {showLabels && (hovered || isSelected || system.importance === 'capital') && (
        <Html
          position={[0, planetScale * 1.2 + 1, 0]}
          center
          distanceFactor={30}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div 
            className="text-center whitespace-nowrap"
            style={{
              color: factionColor,
              textShadow: '0 0 10px rgba(0,0,0,0.8)',
              fontSize: isSelected ? '14px' : '12px',
              fontWeight: isSelected ? 'bold' : 'normal',
            }}
          >
            {system.name}
          </div>
        </Html>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planetScale * 1.3, planetScale * 1.5, 32]} />
          <meshBasicMaterial 
            color="#00BFFF" 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Hover indicator */}
      {hovered && !isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planetScale * 1.2, planetScale * 1.35, 32]} />
          <meshBasicMaterial 
            color="#FFFFFF" 
            transparent 
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
