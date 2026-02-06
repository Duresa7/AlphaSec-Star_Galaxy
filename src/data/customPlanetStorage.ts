import * as THREE from 'three';
import type { StarSystem } from '@/types';

const STORAGE_KEY = 'star-wars-custom-planets';

interface SerializedCustomSystem {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  customColor: string;
}

export function loadCustomSystems(): StarSystem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: SerializedCustomSystem[] = JSON.parse(raw);
    return data.map(s => ({
      id: s.id,
      name: s.name,
      position: new THREE.Vector3(s.position.x, s.position.y, s.position.z),
      faction: 'neutral' as const,
      starType: 'white' as const,
      importance: 'minor' as const,
      description: `Custom planet: ${s.name}`,
      region: 'unknown_regions' as const,
      isCustom: true,
      customColor: s.customColor,
      planets: [{
        id: `${s.id}-prime`,
        name: s.name,
        type: 'terrestrial' as const,
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'neutral' as const,
        description: `Custom planet: ${s.name}`,
        systemId: s.id,
      }],
    }));
  } catch {
    return [];
  }
}

export function saveCustomSystems(systems: StarSystem[]): void {
  const data: SerializedCustomSystem[] = systems.map(s => ({
    id: s.id,
    name: s.name,
    position: { x: s.position.x, y: s.position.y, z: s.position.z },
    customColor: s.customColor || '#FFFFFF',
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
