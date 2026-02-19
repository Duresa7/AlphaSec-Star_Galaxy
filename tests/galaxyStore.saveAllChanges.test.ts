import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fleet, StarSystem } from '../src/types';

const mocks = vi.hoisted(() => ({
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

vi.mock('@/data/supabaseStorage', () => ({
  loadCustomSystems: mocks.loadCustomSystems,
  loadCustomFleets: mocks.loadCustomFleets,
  insertCustomSystem: mocks.insertCustomSystem,
  batchUpsertSystems: mocks.batchUpsertSystems,
  deleteCustomSystem: mocks.deleteCustomSystem,
  insertCustomFleet: mocks.insertCustomFleet,
  batchUpsertFleets: mocks.batchUpsertFleets,
  deleteCustomFleet: mocks.deleteCustomFleet,
  logAction: mocks.logAction,
  loadSetting: mocks.loadSetting,
  updateSetting: mocks.updateSetting,
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
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

const buildSystem = (id: string): StarSystem => ({
  id,
  name: id,
  position: new THREE.Vector3(0, 0, 0),
  faction: 'neutral',
  starType: 'white',
  importance: 'minor',
  description: `${id} description`,
  region: 'unknown_regions',
  planets: [
    {
      id: `${id}-prime`,
      name: `${id} Prime`,
      type: 'terrestrial',
      position: new THREE.Vector3(0, 0, 0),
      radius: 1,
      faction: 'neutral',
      description: `${id} Prime description`,
      systemId: id,
    },
  ],
});

const buildFleet = (id: string): Fleet => ({
  id,
  name: id,
  faction: 'neutral',
  position: new THREE.Vector3(0, 0, 0),
  shipCount: 10,
});

describe('useGalaxyDataStore.saveAllChanges', () => {
  beforeEach(() => {
    mocks.batchUpsertSystems.mockReset();
    mocks.batchUpsertFleets.mockReset();
    mocks.updateSetting.mockReset();
    mocks.logAction.mockReset();
    mocks.getAuthenticatedUserId.mockReset();

    mocks.getAuthenticatedUserId.mockResolvedValue('user-1');
    mocks.batchUpsertSystems.mockImplementation(async (systems: StarSystem[]) => {
      if (systems.some(s => s.id === 'system-fail')) {
        throw new Error('failed write');
      }
    });
    mocks.batchUpsertFleets.mockResolvedValue(undefined);
    mocks.updateSetting.mockResolvedValue(undefined);
    mocks.logAction.mockResolvedValue(undefined);

    useGalaxyDataStore.setState({
      systems: [buildSystem('system-ok'), buildSystem('system-fail')],
      fleets: [buildFleet('fleet-ok')],
      currentYear: 4100,
      dirtySystemIds: new Set(['system-ok', 'system-fail']),
      dirtyFleetIds: new Set(['fleet-ok']),
      dirtyTimeline: true,
      hasPendingChanges: true,
    });
  });

  it('keeps failed entities dirty and clears successful entities', async () => {
    await useGalaxyDataStore.getState().saveAllChanges();

    const state = useGalaxyDataStore.getState();

    // Batch upserts are called once per type (not per entity)
    expect(mocks.batchUpsertSystems).toHaveBeenCalledTimes(1);
    expect(mocks.batchUpsertFleets).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetting).toHaveBeenCalledTimes(1);

    // System batch failed → all dirty system IDs stay dirty
    expect(state.dirtySystemIds.has('system-fail')).toBe(true);
    expect(state.dirtySystemIds.has('system-ok')).toBe(true);
    expect(state.dirtyFleetIds.size).toBe(0);
    expect(state.dirtyTimeline).toBe(false);
    expect(state.hasPendingChanges).toBe(true);
  });
});
