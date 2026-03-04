import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fleet } from '../src/types';

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

const buildFleet = (id: string): Fleet => ({
  id,
  name: id,
  faction: 'neutral',
  position: new THREE.Vector3(0, 0, 0),
  shipCount: 10,
  modelType: 'republic',
  isCustom: true,
});

describe('useGalaxyDataStore.updateFleetStats commander updates', () => {
  beforeEach(() => {
    useGalaxyDataStore.setState({
      fleets: [buildFleet('fleet-1')],
      dirtyFleetIds: new Set<string>(),
      hasPendingChanges: false,
    });
  });

  it('sets commander and marks fleet dirty', () => {
    useGalaxyDataStore.getState().updateFleetStats('fleet-1', { commander: 'Admiral Thrawn' });

    const state = useGalaxyDataStore.getState();
    const updated = state.fleets.find((fleet) => fleet.id === 'fleet-1');
    expect(updated?.commander).toBe('Admiral Thrawn');
    expect(state.dirtyFleetIds.has('fleet-1')).toBe(true);
    expect(state.hasPendingChanges).toBe(true);
  });

  it('clears commander when set to undefined', () => {
    useGalaxyDataStore.setState({
      fleets: [{ ...buildFleet('fleet-1'), commander: 'Admiral Trench' }],
      dirtyFleetIds: new Set<string>(),
      hasPendingChanges: false,
    });

    useGalaxyDataStore.getState().updateFleetStats('fleet-1', { commander: undefined });

    const state = useGalaxyDataStore.getState();
    const updated = state.fleets.find((fleet) => fleet.id === 'fleet-1');
    expect(updated?.commander).toBeUndefined();
    expect(state.dirtyFleetIds.has('fleet-1')).toBe(true);
    expect(state.hasPendingChanges).toBe(true);
  });
});
