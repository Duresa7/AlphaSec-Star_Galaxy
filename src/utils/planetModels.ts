import { useGLTF } from '@react-three/drei';

const PLANET_MODEL_PATHS: Record<string, string> = {
  'alderaan-prime': '/models/planets/alderaan.glb',
  'coruscant-prime': '/models/planets/coruscant.glb',
  'hoth-prime': '/models/planets/hoth.glb',
  'korriban-prime': '/models/planets/korriban.glb',
  'mirial-prime': '/models/planets/mirial.glb',
  'quesh-prime': '/models/planets/quesh.glb',
  'tatooine-prime': '/models/planets/tatooine.glb',
  'tython-prime': '/models/planets/tython.glb',
};

export function hasPlanetModel(planetId: string): boolean {
  return planetId in PLANET_MODEL_PATHS;
}

export function getPlanetModelPath(planetId: string): string {
  return PLANET_MODEL_PATHS[planetId];
}

for (const path of Object.values(PLANET_MODEL_PATHS)) {
  useGLTF.preload(path);
}
