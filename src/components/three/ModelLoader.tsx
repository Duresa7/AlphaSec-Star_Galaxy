import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ProceduralSkybox } from './ProceduralSkybox';
import type { ShipModelType } from '@/types';

const MODEL_PATHS = {
  sithDreadnought: '/models/ships/sith_dreadnought.glb',
  republicFrigate: '/models/ships/republic_frigate.glb',
  republicVenator: '/models/ships/venator_destroyer.glb',
  republicValor: '/models/ships/valor_class_cruiser.glb',
  sithTerminus: '/models/ships/terminus_destroyer.glb',
  civilianFreighter: '/models/ships/civilian_freighter.glb',
  civilianCorvette: '/models/ships/civilian_corvette.glb',
  civilianTransport: '/models/ships/civilian_transport.glb',
  nebula: '/models/icons/nebula.glb',
  blackHole: '/models/icons/black_hole.glb',
  spaceStation: '/models/icons/space_station.glb',
  hyperspaceMarker: '/models/icons/hyperspace_marker.glb',
  planetAlderaan: '/models/planets/alderaan.glb',
  planetBalmorra: '/models/planets/balmorra.glb',
  planetBelsavis: '/models/planets/belsavis.glb',
  planetCorellia: '/models/planets/corellia.glb',
  planetCoruscant: '/models/planets/coruscant.glb',
  planetDromundKaas: '/models/planets/dromund_kaas.glb',
  planetHoth: '/models/planets/hoth.glb',
  planetHutta: '/models/planets/hutta.glb',
  planetIlum: '/models/planets/ilum.glb',
  planetKorriban: '/models/planets/korriban.glb',
  planetMakeb: '/models/planets/makeb.glb',
  planetNarShaddaa: '/models/planets/nar_shaddaa.glb',
  planetOrdMantell: '/models/planets/ord_mantell.glb',
  planetQuesh: '/models/planets/quesh.glb',
  planetTaris: '/models/planets/taris.glb',
  planetTatooine: '/models/planets/tatooine.glb',
  planetTython: '/models/planets/tython.glb',
  planetVoss: '/models/planets/voss.glb',
};
const PLANET_MODEL_PATHS: Record<string, string> = {
  'alderaan-prime': MODEL_PATHS.planetAlderaan,
  'balmorra-prime': MODEL_PATHS.planetBalmorra,
  'belsavis-prime': MODEL_PATHS.planetBelsavis,
  'corellia-prime': MODEL_PATHS.planetCorellia,
  'coruscant-prime': MODEL_PATHS.planetCoruscant,
  'dromund-kaas-prime': MODEL_PATHS.planetDromundKaas,
  'hoth-prime': MODEL_PATHS.planetHoth,
  'hutta-prime': MODEL_PATHS.planetHutta,
  'ilum-prime': MODEL_PATHS.planetIlum,
  'korriban-prime': MODEL_PATHS.planetKorriban,
  'makeb-prime': MODEL_PATHS.planetMakeb,
  'nar-shaddaa-prime': MODEL_PATHS.planetNarShaddaa,
  'ord-mantell-prime': MODEL_PATHS.planetOrdMantell,
  'quesh-prime': MODEL_PATHS.planetQuesh,
  'taris-prime': MODEL_PATHS.planetTaris,
  'tatooine-prime': MODEL_PATHS.planetTatooine,
  'tython-prime': MODEL_PATHS.planetTython,
  'voss-prime': MODEL_PATHS.planetVoss,
};

interface ShipModelProps {
  type: ShipModelType;
  position: THREE.Vector3;
  scale?: number;
  rotation?: [number, number, number];
}

export function ShipModel({ type, position, scale = 0.5, rotation = [0, 0, 0] }: ShipModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelPath = useMemo(() => {
    switch (type) {
      case 'sith':
        return MODEL_PATHS.sithDreadnought;
      case 'venator':
        return MODEL_PATHS.republicVenator;
      case 'valor':
        return MODEL_PATHS.republicValor;
      case 'terminus':
        return MODEL_PATHS.sithTerminus;
      case 'republic':
      default:
        return MODEL_PATHS.republicFrigate;
    }
  }, [type]);

  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

interface AnomalyModelProps {
  type: 'nebula' | 'black_hole' | 'space_station' | 'hyperspace_lane';
  position: THREE.Vector3;
  scale?: number;
}

export function AnomalyModel({ type, position, scale = 1 }: AnomalyModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const modelPath = useMemo(() => {
    switch (type) {
      case 'nebula': return MODEL_PATHS.nebula;
      case 'black_hole': return MODEL_PATHS.blackHole;
      case 'space_station': return MODEL_PATHS.spaceStation;
      case 'hyperspace_lane': return MODEL_PATHS.hyperspaceMarker;
      default: return null;
    }
  }, [type]);
  const { scene } = useGLTF(modelPath || MODEL_PATHS.nebula);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useFrame(() => {
    if (groupRef.current) {
      if (type === 'black_hole') {
        groupRef.current.rotation.y += 0.01;
      } else if (type === 'nebula') {
        groupRef.current.rotation.y += 0.002;
      } else if (type === 'space_station') {
        groupRef.current.rotation.y += 0.005;
      }
    }
  });

  if (!modelPath) return null;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

interface PlanetModelProps {
  planetId: string;
  position: THREE.Vector3;
  scale?: number;
  rotation?: [number, number, number];
}

export function PlanetModel({ planetId, position, scale = 1, rotation = [0, 0, 0] }: PlanetModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const modelPath = PLANET_MODEL_PATHS[planetId];
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function hasPlanetModel(planetId: string): boolean {
  return planetId in PLANET_MODEL_PATHS;
}

useGLTF.preload(MODEL_PATHS.sithDreadnought);
useGLTF.preload(MODEL_PATHS.republicFrigate);
useGLTF.preload(MODEL_PATHS.republicVenator);
useGLTF.preload(MODEL_PATHS.republicValor);
useGLTF.preload(MODEL_PATHS.sithTerminus);
useGLTF.preload(MODEL_PATHS.nebula);
useGLTF.preload(MODEL_PATHS.blackHole);
useGLTF.preload(MODEL_PATHS.spaceStation);
useGLTF.preload(MODEL_PATHS.hyperspaceMarker);
useGLTF.preload(MODEL_PATHS.civilianFreighter);
useGLTF.preload(MODEL_PATHS.civilianCorvette);
useGLTF.preload(MODEL_PATHS.civilianTransport);

export function GalaxySkybox() {
  return <ProceduralSkybox />;
}
