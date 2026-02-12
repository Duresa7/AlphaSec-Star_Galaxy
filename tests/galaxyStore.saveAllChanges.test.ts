import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fleet, StarSystem } from '../src/types';

const mocks = vi.hoisted(() => ({
  loadCustomSystems: vi.fn(async () => []),
  loadCustomFleets: vi.fn(async () => []),
  insertCustomSystem: vi.fn(async () => {}),
  upsertSystem: vi.fn(async () => {}),
  deleteCustomSystem: vi.fn(async () => {}),
  insertCustomFleet: vi.fn(async () => {}),
  upsertFleet: vi.fn(async () => {}),
  deleteCustomFleet: vi.fn(async () => {}),
  logAction: vi.fn(async () => {}),
  loadSetting: vi.fn(async () => null),
  updateSetting: vi.fn(async () => {}),
  getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
}));

vi.mock('@/data/supabaseStorage', () => ({
  loadCustomSystems: mocks.loadCustomSystems,
  loadCustomFleets: mocks.loadCustomFleets,
  insertCustomSystem: mocks.insertCustomSystem,
  upsertSystem: mocks.upsertSystem,
  deleteCustomSystem: mocks.deleteCustomSystem,
  insertCustomFleet: mocks.insertCustomFleet,
  upsertFleet: mocks.upsertFleet,
  deleteCustomFleet: mocks.deleteCustomFleet,
  logAction: mocks.logAction,
  loadSetting: mocks.loadSetting,
  updateSetting: mocks.updateSetting,
}));

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    auth: {
      getUser: mocks.getUser,
    },
  },
}));

import { useGalaxyStore } from '../src/store/galaxyStore';

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

describe('useGalaxyStore.saveAllChanges', () => {
  beforeEach(() => {
    mocks.upsertSystem.mockReset();
    mocks.upsertFleet.mockReset();
    mocks.updateSetting.mockReset();
    mocks.logAction.mockReset();
    mocks.getUser.mockReset();

    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mocks.upsertSystem.mockImplementation(async (system: StarSystem) => {
      if (system.id === 'system-fail') {
        throw new Error('failed write');
      }
    });
    mocks.upsertFleet.mockResolvedValue(undefined);
    mocks.updateSetting.mockResolvedValue(undefined);
    mocks.logAction.mockResolvedValue(undefined);

    useGalaxyStore.setState({
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
    await useGalaxyStore.getState().saveAllChanges();

    const state = useGalaxyStore.getState();

    expect(mocks.upsertSystem).toHaveBeenCalledTimes(2);
    expect(mocks.upsertFleet).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetting).toHaveBeenCalledTimes(1);

    expect(state.dirtySystemIds.has('system-fail')).toBe(true);
    expect(state.dirtySystemIds.has('system-ok')).toBe(false);
    expect(state.dirtyFleetIds.size).toBe(0);
    expect(state.dirtyTimeline).toBe(false);
    expect(state.hasPendingChanges).toBe(true);
  });
});
