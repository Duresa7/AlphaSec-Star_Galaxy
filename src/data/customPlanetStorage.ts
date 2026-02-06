import * as THREE from 'three';
import type { StarSystem, Planet, PlanetType, Faction } from '@/types';

const STORAGE_KEY = 'star-wars-custom-planets';

interface SerializedCustomPlanet {
  id?: string;
  name?: string;
  type?: PlanetType;
  radius?: number;
  faction?: Faction;
  description?: string;
  population?: string;
  climate?: string;
  terrain?: string;
  notable?: string[];
  factionControl?: Partial<Record<Faction, number>>;
}

interface SerializedCustomSystem {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  customColor?: string;
  planets?: SerializedCustomPlanet[];
}

function createLegacyPlanet(systemId: string, systemName: string): Planet {
  return {
    id: `${systemId}-prime`,
    name: systemName,
    type: 'terrestrial',
    position: new THREE.Vector3(0, 0, 0),
    radius: 1,
    faction: 'neutral',
    description: `Custom planet: ${systemName}`,
    systemId,
  };
}

export function loadCustomSystems(): StarSystem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: SerializedCustomSystem[] = JSON.parse(raw);
    return data.map((s) => {
      const planets: Planet[] = s.planets && s.planets.length > 0
        ? s.planets.map((p, index) => ({
            id: p.id || `${s.id}${index === 0 ? '-prime' : `-planet-${index + 1}`}`,
            name: p.name || (index === 0 ? s.name : `Custom Planet ${index + 1}`),
            type: p.type || 'terrestrial',
            position: new THREE.Vector3(0, 0, 0),
            radius: typeof p.radius === 'number' ? p.radius : 1,
            faction: p.faction || 'neutral',
            description: p.description || `Custom planet: ${p.name || s.name}`,
            population: p.population,
            climate: p.climate,
            terrain: p.terrain,
            notable: p.notable,
            systemId: s.id,
            factionControl: p.factionControl,
          }))
        : [createLegacyPlanet(s.id, s.name)];

      const primaryPlanet = planets[0];

      return {
        id: s.id,
        name: s.name,
        position: new THREE.Vector3(s.position.x, s.position.y, s.position.z),
        faction: primaryPlanet?.faction || 'neutral',
        starType: 'white' as const,
        importance: 'minor' as const,
        description: primaryPlanet?.description || `Custom planet: ${s.name}`,
        region: 'unknown_regions' as const,
        isCustom: true,
        customColor: s.customColor || '#FFFFFF',
        planets,
      };
    });
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
    planets: s.planets.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      radius: p.radius,
      faction: p.faction,
      description: p.description,
      population: p.population,
      climate: p.climate,
      terrain: p.terrain,
      notable: p.notable,
      factionControl: p.factionControl,
    })),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
