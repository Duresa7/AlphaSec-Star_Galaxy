import { useRef, useState, useMemo, Suspense } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StarSystem, Planet, PlanetType } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import { PlanetModel, hasPlanetModel } from '@/components/three/ModelLoader';

interface SystemDetailViewProps {
  system: StarSystem;
}
export const PLANET_APPEARANCES: Record<PlanetType, {
  color: string;
  roughness: number;
  metalness: number;
  secondaryColor?: string;
  hasRings?: boolean;
  hasClouds?: boolean;
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
}> = {
  terrestrial: {
    color: '#4A7C59',
    roughness: 0.8,
    metalness: 0.1,
    secondaryColor: '#8B7355',
    hasAtmosphere: true,
    atmosphereColor: '#87CEEB',
    hasClouds: true,
  },
  gas_giant: {
    color: '#D4A574',
    roughness: 0.9,
    metalness: 0,
    secondaryColor: '#8B6914',
    hasRings: true,
  },
  ice: {
    color: '#E8F4F8',
    roughness: 0.3,
    metalness: 0.2,
    secondaryColor: '#A8D8EA',
    hasAtmosphere: true,
    atmosphereColor: '#CCE5FF',
  },
  desert: {
    color: '#C2956E',
    roughness: 0.9,
    metalness: 0.05,
    secondaryColor: '#D4A574',
  },
  volcanic: {
    color: '#4A3030',
    roughness: 0.7,
    metalness: 0.3,
    secondaryColor: '#8B0000',
  },
  ocean: {
    color: '#1E5F8A',
    roughness: 0.2,
    metalness: 0.1,
    secondaryColor: '#2E8B57',
    hasAtmosphere: true,
    atmosphereColor: '#87CEEB',
    hasClouds: true,
  },
  jungle: {
    color: '#228B22',
    roughness: 0.85,
    metalness: 0.05,
    secondaryColor: '#006400',
    hasAtmosphere: true,
    atmosphereColor: '#90EE90',
    hasClouds: true,
  },
  city: {
    color: '#505060',
    roughness: 0.4,
    metalness: 0.6,
    secondaryColor: '#303040',
  },
  barren: {
    color: '#696969',
    roughness: 1.0,
    metalness: 0.1,
    secondaryColor: '#505050',
  },
  destroyed: {
    color: '#3A3A3A',
    roughness: 0.9,
    metalness: 0.2,
    secondaryColor: '#1A1A1A',
  },
};

export function SystemDetailView({ system }: SystemDetailViewProps) {
  const { showLabels, viewMode, selectedPlanetId } = useGalaxyStore();
  const planet = system.planets[0];

  if (!planet) {
    return null;
  }

  return (
    <group>

      <StaticPlanet
        planet={planet}
        showLabels={showLabels}
        isDetailView={viewMode === 'system' && selectedPlanetId === planet.id}
        customColor={system.customColor}
      />
    </group>
  );
}
interface StaticPlanetProps {
  planet: Planet;
  showLabels: boolean;
  isDetailView: boolean;
  customColor?: string;
}

function StaticPlanet({ planet, showLabels, isDetailView, customColor }: StaticPlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const { setSelectedPlanet, setInfoPanelData, selectedPlanetId } = useGalaxyStore();
  const isSelected = selectedPlanetId === planet.id;

  const appearance = PLANET_APPEARANCES[planet.type] || PLANET_APPEARANCES.terrestrial;
  const planetSize = planet.radius * 2.2;
  const planetMaterial = useMemo(() => {
    return {
      color: planet.customColor || customColor || appearance.color,
      roughness: appearance.roughness,
      metalness: appearance.metalness,
    };
  }, [appearance, customColor, planet.customColor]);


  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedPlanet(planet.id);
    setInfoPanelData({
      type: 'planet',
      data: planet,
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
  const viewScale = isDetailView ? 1.6 : 1.1;
  const hasGLBModel = hasPlanetModel(planet.id);

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >

      {hasGLBModel ? (
        <Suspense fallback={
          <mesh scale={viewScale * planetSize}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={planetMaterial.color} />
          </mesh>
        }>
          <group scale={viewScale * planetSize}>
            <PlanetModel
              planetId={planet.id}
              position={new THREE.Vector3(0, 0, 0)}
              scale={1}
            />
          </group>
        </Suspense>
      ) : (
        <>

          <mesh scale={viewScale}>
            <sphereGeometry args={[planetSize, 64, 64]} />
            <meshStandardMaterial
              color={planetMaterial.color}
              roughness={planetMaterial.roughness}
              metalness={planetMaterial.metalness}
            />
          </mesh>
        </>
      )}


      {(hovered || isSelected) && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={viewScale}>
          <ringGeometry args={[planetSize * 1.2, planetSize * 1.25, 64]} />
          <meshBasicMaterial
            color={isSelected ? "#00FF00" : "#00BFFF"}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}


      {showLabels && (
        <Html
          position={[0, planetSize * viewScale + 1, 0]}
          center
          distanceFactor={10}
          zIndexRange={[0, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="text-center whitespace-nowrap holo-tooltip">
            <div className="text-sm font-medium text-white">
              {planet.name}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
