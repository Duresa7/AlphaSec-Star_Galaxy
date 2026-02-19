import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StarSystem } from '../src/types';

vi.mock('@/data/supabaseStorage', () => ({
  loadCustomSystems: vi.fn(async () => []),
  loadCustomFleets: vi.fn(async () => []),
  insertCustomSystem: vi.fn(async () => {}),
  batchUpsertSystems: vi.fn(async () => {}),
  deleteCustomSystem: vi.fn(async () => {}),
  insertCustomFleet: vi.fn(async () => {}),
  batchUpsertFleets: vi.fn(async () => {}),
  deleteCustomFleet: vi.fn(async () => {}),
  logAction: vi.fn(async () => {}),
  loadSetting: vi.fn(async () => null),
  updateSetting: vi.fn(async () => {}),
  getAuthenticatedUserId: vi.fn(async () => 'user-1'),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
  },
}));

import { useGalaxyDataStore } from '../src/store/galaxyDataStore';
import { useGalaxyUIStore } from '../src/store/galaxyUIStore';

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

describe('useGalaxyDataStore.getSearchResults', () => {
  beforeEach(() => {
    useGalaxyDataStore.setState({
      systems: [
        buildSystem('system-1', 'Alpha Prime', 'planet-1', 'Taris'),
        buildSystem('system-2', 'Alpha Prime', 'planet-2', 'Korriban'),
      ],
      fleets: [],
    });
    useGalaxyUIStore.setState({
      searchQuery: 'ta',
    });
  });

  it('includes parentSystemId for planet search hits', () => {
    const results = useGalaxyDataStore.getState().getSearchResults();
    const taris = results.find((result) => result.type === 'planet' && result.id === 'planet-1');

    expect(taris).toBeDefined();
    expect(taris?.parentSystemId).toBe('system-1');
    expect(taris?.parentName).toBe('Alpha Prime');
  });
});
