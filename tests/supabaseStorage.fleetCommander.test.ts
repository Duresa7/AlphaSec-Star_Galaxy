import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fleet } from '../src/types';

const mocks = vi.hoisted(() => {
  const state = { selectData: [] as unknown[] };
  return {
    state,
    from: vi.fn(() => ({
      select: vi.fn(async () => ({ data: state.selectData, error: null })),
      upsert: vi.fn(async () => ({ error: null })),
    })),
    authGetUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    from: mocks.from,
    auth: {
      getUser: mocks.authGetUser,
    },
  },
}));

import { batchUpsertFleets, loadCustomFleets } from '../src/data/supabaseStorage';

const buildFleet = (commander?: string): Fleet => ({
  id: 'fleet-1',
  name: 'First Fleet',
  faction: 'sith_empire',
  position: new THREE.Vector3(10, 0, 5),
  shipCount: 21,
  modelType: 'sith',
  commander,
  isCustom: true,
});

describe('supabaseStorage fleet commander mapping', () => {
  beforeEach(() => {
    mocks.from.mockClear();
    mocks.state.selectData = [];
  });

  const getLatestFromCall = () => {
    const latest = mocks.from.mock.results[mocks.from.mock.results.length - 1];
    return latest?.value as { upsert: ReturnType<typeof vi.fn> };
  };

  it('persists trimmed commander values on fleet upsert', async () => {
    await batchUpsertFleets([buildFleet('  Darth Malgus  ')], 'user-1');

    const customFleetCall = getLatestFromCall();

    expect(mocks.from).toHaveBeenCalledWith('custom_fleets');
    expect(customFleetCall.upsert).toHaveBeenCalledTimes(1);

    const [rows] = customFleetCall.upsert.mock.calls[0];
    expect(rows[0].commander).toBe('Darth Malgus');
  });

  it('serializes missing commander values as null on fleet upsert', async () => {
    await batchUpsertFleets([buildFleet()], 'user-1');

    const customFleetCall = getLatestFromCall();
    expect(customFleetCall.upsert).toHaveBeenCalledTimes(1);

    const [rows] = customFleetCall.upsert.mock.calls[0];
    expect(rows[0].commander).toBeNull();
  });

  it('maps null commander values to undefined when loading fleets', async () => {
    mocks.state.selectData = [
      {
        id: 'fleet-1',
        name: 'First Fleet',
        position_x: 10,
        position_y: 0,
        position_z: 5,
        faction: 'sith_empire',
        ship_count: 21,
        model_type: 'sith',
        marker_size: null,
        commander: null,
        composition: [],
        created_by: null,
      },
    ];

    const fleets = await loadCustomFleets();
    expect(fleets).toHaveLength(1);
    expect(fleets[0].commander).toBeUndefined();
  });
});
