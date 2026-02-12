import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StarSystem } from '../src/types';
import { useGalaxyStore } from '../src/store/galaxyStore';

const buildSystem = (id: string, name: string, planetId: string, planetName: string): StarSystem => ({
  id,
  name,
  position: new THREE.Vector3(0, 0, 0),
  faction: 'neutral',
  starType: 'white',
  importance: 'minor',
  description: `${name} description`,
  region: 'unknown_regions',
  planets: [
    {
      id: planetId,
      name: planetName,
      type: 'terrestrial',
      position: new THREE.Vector3(0, 0, 0),
      radius: 1,
      faction: 'neutral',
      description: `${planetName} description`,
      systemId: id,
    },
  ],
});

describe('useGalaxyStore.getSearchResults', () => {
  beforeEach(() => {
    useGalaxyStore.setState({
      systems: [
        buildSystem('system-1', 'Alpha Prime', 'planet-1', 'Taris'),
        buildSystem('system-2', 'Alpha Prime', 'planet-2', 'Korriban'),
      ],
      fleets: [],
      searchQuery: 'ta',
    });
  });

  it('includes parentSystemId for planet search hits', () => {
    const results = useGalaxyStore.getState().getSearchResults();
    const taris = results.find((result) => result.type === 'planet' && result.id === 'planet-1');

    expect(taris).toBeDefined();
    expect(taris?.parentSystemId).toBe('system-1');
    expect(taris?.parentName).toBe('Alpha Prime');
  });
});
