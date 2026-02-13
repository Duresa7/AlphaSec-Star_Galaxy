import { create } from 'zustand';
import type {
  GalaxyStore,
  InfoPanelData,
  Faction,
  SearchResult,
  Planet,
  PlanetStatsUpdate,
} from '@/types';
import { starSystems, anomalies, fleets } from '@/data/galaxyData';
import {
  loadCustomSystems as loadFromSupabase,
  loadCustomFleets as loadFleetsFromSupabase,
  insertCustomSystem,
  upsertSystem,
  deleteCustomSystem as deleteSystemFromSupabase,
  insertCustomFleet,
  upsertFleet,
  deleteCustomFleet as deleteFleetFromSupabase,
  logAction,
  loadSetting,
  updateSetting,
} from '@/data/supabaseStorage';
import { TOPDOWN_MARKER_MAX_SIZE, TOPDOWN_MARKER_MIN_SIZE } from '@/config/topDownMarkerConfig';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { StarSystem, Fleet } from '@/types';

const cloneSystem = (system: StarSystem): StarSystem => ({
  ...system,
  position: system.position.clone(),
  planets: system.planets.map((planet) => ({ ...planet, position: planet.position.clone() })),
});

const cloneFleet = (fleet: Fleet): Fleet => ({
  ...fleet,
  position: fleet.position.clone(),
});

const cloneSystems = (systems: StarSystem[]): StarSystem[] =>
  systems.map((s) => cloneSystem(s));

const cloneFleets = (fleetArr: Fleet[]): Fleet[] =>
  fleetArr.map((f) => cloneFleet(f));

let _systemsSnapshot: StarSystem[] = [];
let _fleetsSnapshot: Fleet[] = [];
let _yearSnapshot: number = 3956;
let _pendingPlanetAudits: Map<string, { systemId: string; planetName: string; fields: Set<string> }> = new Map();
const AUTH_LOOKUP_TIMEOUT_MS = 8_000;

const shouldClearPanelForSystem = (panel: InfoPanelData | null, systemId: string): boolean => {
  if (!panel) return false;
  if (panel.type === 'system') return panel.data.id === systemId;
  if (panel.type === 'planet') return panel.data.systemId === systemId;
  return false;
};

const shouldClearPanelForFleet = (panel: InfoPanelData | null, fleetId: string): boolean => {
  return panel?.type === 'fleet' && panel.data.id === fleetId;
};

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

const clampMarkerSize = (value: number): number => Math.max(TOPDOWN_MARKER_MIN_SIZE, Math.min(TOPDOWN_MARKER_MAX_SIZE, value));

const applyPlanetStatsPatch = (planet: Planet, updates: PlanetStatsUpdate): Planet => {
  const next: Planet = { ...planet };

  if (hasOwn(updates, 'population')) {
    next.population = updates.population ?? undefined;
  }
  if (hasOwn(updates, 'description')) {
    next.description = updates.description ?? '';
  }
  if (hasOwn(updates, 'climate')) {
    next.climate = updates.climate ?? undefined;
  }
  if (hasOwn(updates, 'terrain')) {
    next.terrain = updates.terrain ?? undefined;
  }
  if (hasOwn(updates, 'notable')) {
    next.notable = updates.notable ?? undefined;
  }
  if (hasOwn(updates, 'nativeInhabitants')) {
    next.nativeInhabitants = updates.nativeInhabitants ?? undefined;
  }
  if (hasOwn(updates, 'factionControl')) {
    next.factionControl = updates.factionControl ?? undefined;
  }
  if (hasOwn(updates, 'customColor')) {
    next.customColor = updates.customColor ?? undefined;
  }

  return next;
};

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

const getCurrentUserId = async (): Promise<string | null> => {
  if (!supabaseConfigured) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_LOOKUP_TIMEOUT_MS,
      'Auth user lookup timed out.',
    );
    if (error) {
      console.error('Failed to resolve auth user:', error);
      return null;
    }
    return data.user?.id ?? null;
  } catch (error) {
    console.error('Failed to resolve auth user:', error);
    return null;
  }
};

const auditLog = (
  action: import('@/types').AuditAction,
  entityType: 'system' | 'fleet' | 'user',
  entityId: string,
  entityName: string,
  details?: Record<string, unknown>,
) => {
  logAction(action, entityType, entityId, entityName, details).catch(() => {});
};

const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
  if (incoming.length === 0) return current;

  const overrideMap = new Map(incoming.map((item) => [item.id, item]));
  const merged = current.map((item) => overrideMap.get(item.id) ?? item);
  const existingIds = new Set(current.map((item) => item.id));
  for (const item of incoming) {
    if (existingIds.has(item.id)) continue;
    merged.push(item);
    existingIds.add(item.id);
  }

  return merged;
};

const mergeSavedSnapshotEntries = <T extends { id: string }>(
  currentSnapshot: T[],
  latestData: T[],
  attemptedIds: Set<string>,
  failedIds: Set<string>,
  cloneItem: (item: T) => T,
): T[] => {
  if (attemptedIds.size === 0) return currentSnapshot;

  const latestById = new Map(latestData.map((item) => [item.id, item]));
  const nextSnapshot = currentSnapshot.map((item) => {
    if (!attemptedIds.has(item.id) || failedIds.has(item.id)) {
      return item;
    }

    const latestItem = latestById.get(item.id);
    return latestItem ? cloneItem(latestItem) : item;
  });

  const existingIds = new Set(nextSnapshot.map((item) => item.id));
  for (const id of attemptedIds) {
    if (failedIds.has(id) || existingIds.has(id)) continue;
    const latestItem = latestById.get(id);
    if (!latestItem) continue;
    nextSnapshot.push(cloneItem(latestItem));
    existingIds.add(id);
  }

  return nextSnapshot;
};

export const useGalaxyStore = create<GalaxyStore>((set, get) => ({
  viewMode: 'topdown',
  selectedSystemId: null,
  selectedPlanetId: null,
  selectedFleetId: null,
  setSelectedSystem: (id: string | null) =>
    set({
      selectedSystemId: id,
      selectedPlanetId: null,
      selectedFleetId: null,
      viewMode: id ? 'system' : 'topdown',
    }),
  setSelectedPlanet: (id: string | null) =>
    set({
      selectedPlanetId: id,
    }),
  setSelectedFleet: (id: string | null) =>
    set({
      selectedFleetId: id,
      selectedSystemId: null,
      selectedPlanetId: null,
      viewMode: id ? 'fleet' : 'topdown',
    }),

  setTopDownSelection: (systemId, planetId = null) =>
    set({
      selectedSystemId: systemId,
      selectedPlanetId: planetId ?? null,
      selectedFleetId: null,
    }),

  setTopDownFleetSelection: (fleetId) =>
    set({
      selectedFleetId: fleetId,
      selectedSystemId: null,
      selectedPlanetId: null,
    }),
  systems: [...starSystems],
  anomalies,
  fleets: [...fleets],
  showFleets: true,
  showAnomalies: true,
  showLabels: true,
  toggleFleets: () => set((state) => ({ showFleets: !state.showFleets })),
  toggleAnomalies: () => set((state) => ({ showAnomalies: !state.showAnomalies })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  infoPanelData: null,
  setInfoPanelData: (data: InfoPanelData | null) => set({ infoPanelData: data }),
  currentYear: 3956,
  setCurrentYear: (year: number) => set({ currentYear: year, dirtyTimeline: true, hasPendingChanges: true }),
  isLoading: true,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  searchQuery: '',
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  factionFilters: {
    galactic_republic: true,
    sith_empire: true,
    neutral: true,
    contested: true,
    hutt_cartel: true,
  },
  toggleFactionFilter: (faction: Faction) =>
    set((state) => ({
      factionFilters: {
        ...state.factionFilters,
        [faction]: !state.factionFilters[faction],
      },
    })),
  getFilteredSystems: () => {
    const state = get();
    const query = state.searchQuery.toLowerCase().trim();

    return state.systems.filter((system) => {
      if (!state.factionFilters[system.faction]) {
        return false;
      }

      if (query) {
        const matchesName = system.name.toLowerCase().includes(query);
        const matchesRegion = system.region.replace('_', ' ').toLowerCase().includes(query);
        const matchesPlanets = system.planets.some((p) => p.name.toLowerCase().includes(query));
        return matchesName || matchesRegion || matchesPlanets;
      }

      return true;
    });
  },
  getSearchResults: () => {
    const state = get();
    const query = state.searchQuery.toLowerCase().trim();

    if (!query || query.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];

    state.systems.forEach((system) => {
      if (system.name.toLowerCase().includes(query)) {
        results.push({ type: 'system', id: system.id, name: system.name });
      }

      system.planets.forEach((planet) => {
        if (planet.name.toLowerCase().includes(query)) {
          results.push({
            type: 'planet',
            id: planet.id,
            name: planet.name,
            parentName: system.name,
            parentSystemId: system.id,
          });
        }
      });
    });

    state.fleets.forEach((fleet) => {
      if (fleet.name.toLowerCase().includes(query)) {
        results.push({ type: 'fleet', id: fleet.id, name: fleet.name });
      }
    });

    return results.slice(0, 10);
  },
  getFactionStats: () => {
    const state = get();
    const factions: Faction[] = ['galactic_republic', 'sith_empire', 'neutral', 'contested', 'hutt_cartel'];
    const stats = {} as Record<Faction, { planets: number; fleetShips: number }>;
    for (const f of factions) {
      stats[f] = { planets: 0, fleetShips: 0 };
    }
    for (const system of state.systems) {
      for (const planet of system.planets) {
        if (stats[planet.faction]) {
          stats[planet.faction].planets++;
        }
      }
    }
    for (const fleet of state.fleets) {
      if (stats[fleet.faction]) {
        stats[fleet.faction].fleetShips += fleet.shipCount;
      }
    }
    return stats;
  },
  initializeData: async () => {
    try {
      const [customSystems, customFleets, yearSetting] = await Promise.all([
        loadFromSupabase(),
        loadFleetsFromSupabase(),
        loadSetting('current_year'),
      ]);

      const loadedYear = typeof yearSetting === 'number' ? yearSetting : 3956;
      set(() => ({
        systems: mergeById([...starSystems], customSystems),
        fleets: mergeById([...fleets], customFleets),
        currentYear: loadedYear,
        isLoading: false,
      }));
      const s = get();
      _systemsSnapshot = cloneSystems(s.systems);
      _fleetsSnapshot = cloneFleets(s.fleets);
      _yearSnapshot = loadedYear;
    } catch (err) {
      console.error('Failed to initialize custom data from Supabase:', err);
      set({ isLoading: false });
    }
  },
  updatePlanetStats: (systemId, planetId, updates) => {
    const state = get();
    const resolvedSystem =
      state.systems.find((s) => s.id === systemId) ?? state.systems.find((s) => s.planets.some((p) => p.id === planetId));
    if (!resolvedSystem) return;

    const currentPlanet = resolvedSystem.planets.find((p) => p.id === planetId);
    if (!currentPlanet) return;

    set((currentState) => ({
      systems: currentState.systems.map((s) => {
        const isTargetSystem = s.id === resolvedSystem.id;
        if (!isTargetSystem) return s;
        return {
          ...s,
          planets: s.planets.map((p) => (p.id === planetId ? applyPlanetStatsPatch(p, updates) : p)),
        };
      }),
      dirtySystemIds: new Set(currentState.dirtySystemIds).add(resolvedSystem.id),
      hasPendingChanges: true,
    }));

    const existing = _pendingPlanetAudits.get(planetId);
    const changedFields = Object.keys(updates);
    if (existing) {
      changedFields.forEach((f) => existing.fields.add(f));
    } else {
      _pendingPlanetAudits.set(planetId, {
        systemId: resolvedSystem.id,
        planetName: currentPlanet.name,
        fields: new Set(changedFields),
      });
    }
  },
  placementMode: false,
  pendingCustomPlanet: null,
  draggingCustomPlanet: false,

  setPlacementMode: (mode, pending = null) =>
    set(() => ({
      placementMode: mode,
      pendingCustomPlanet: pending ?? null,
      ...(mode ? { fleetPlacementMode: false, pendingCustomFleet: null } : {}),
    })),

  setDraggingCustomPlanet: (dragging) => set({ draggingCustomPlanet: dragging }),

  addCustomSystem: (system) => {
    set((state) => ({
      systems: [...state.systems, system],
      placementMode: false,
      pendingCustomPlanet: null,
    }));
    getCurrentUserId().then((uid) => {
      if (uid) {
        insertCustomSystem(system, uid).catch(() => {});
        auditLog('system_created', 'system', system.id, system.name);
      }
    });
  },

  removeCustomSystem: (id) => {
    const systemToRemove = get().systems.find((s) => s.id === id);
    set((state) => {
      const isSelected = state.selectedSystemId === id;
      const shouldClear = shouldClearPanelForSystem(state.infoPanelData, id);
      return {
        systems: state.systems.filter((s) => s.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedSystemId: null, selectedPlanetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    deleteSystemFromSupabase(id).catch(() => {});
    if (systemToRemove) {
      auditLog('system_deleted', 'system', id, systemToRemove.name);
    }
  },

  previewCustomSystemPosition: (id, position) => {
    const existing = get().systems.find((s) => s.id === id);
    if (!existing) return;

    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, position: position.clone() } : s)),
    }));
  },

  updateCustomSystemPosition: (id, position) => {
    const existing = get().systems.find((s) => s.id === id);
    if (!existing) return;

    set((state) => ({
      systems: state.systems.map((s) =>
        s.id === id ? { ...s, position: position.clone(), planets: s.planets.map((p) => ({ ...p })) } : s,
      ),
      dirtySystemIds: new Set(state.dirtySystemIds).add(id),
      hasPendingChanges: true,
    }));
  },

  updateCustomSystemMarkerSize: (id, markerSize) => {
    const existing = get().systems.find((s) => s.id === id);
    if (!existing) return;

    const size = clampMarkerSize(markerSize);
    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, markerSize: size } : s)),
      dirtySystemIds: new Set(state.dirtySystemIds).add(id),
      hasPendingChanges: true,
    }));
  },
  fleetPlacementMode: false,
  pendingCustomFleet: null,
  draggingCustomFleet: false,

  setFleetPlacementMode: (mode, pending = null) =>
    set(() => ({
      fleetPlacementMode: mode,
      pendingCustomFleet: pending ?? null,
      ...(mode ? { placementMode: false, pendingCustomPlanet: null } : {}),
    })),

  setDraggingCustomFleet: (dragging) => set({ draggingCustomFleet: dragging }),

  addCustomFleet: (fleet) => {
    set((state) => ({
      fleets: [...state.fleets, fleet],
      fleetPlacementMode: false,
      pendingCustomFleet: null,
    }));
    getCurrentUserId().then((uid) => {
      if (uid) {
        insertCustomFleet(fleet, uid).catch(() => {});
        auditLog('fleet_created', 'fleet', fleet.id, fleet.name);
      }
    });
  },

  removeCustomFleet: (id) => {
    const fleetToRemove = get().fleets.find((f) => f.id === id);
    set((state) => {
      const isSelected = state.selectedFleetId === id;
      const shouldClear = shouldClearPanelForFleet(state.infoPanelData, id);
      return {
        fleets: state.fleets.filter((f) => f.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    deleteFleetFromSupabase(id).catch(() => {});
    if (fleetToRemove) {
      auditLog('fleet_deleted', 'fleet', id, fleetToRemove.name);
    }
  },

  previewCustomFleetPosition: (id, position) => {
    const existing = get().fleets.find((f) => f.id === id);
    if (!existing) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
    }));
  },

  updateCustomFleetPosition: (id, position) => {
    const existing = get().fleets.find((f) => f.id === id);
    if (!existing) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
      dirtyFleetIds: new Set(state.dirtyFleetIds).add(id),
      hasPendingChanges: true,
    }));
  },

  updateFleetMarkerSize: (id, markerSize) => {
    const existing = get().fleets.find((f) => f.id === id);
    if (!existing) return;

    const size = clampMarkerSize(markerSize);
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, markerSize: size } : f)),
      dirtyFleetIds: new Set(state.dirtyFleetIds).add(id),
      hasPendingChanges: true,
    }));
  },
  dirtySystemIds: new Set<string>(),
  dirtyFleetIds: new Set<string>(),
  dirtyTimeline: false,

  hasPendingChanges: false,

  saveAllChanges: async () => {
    const state = get();
    const uid = await getCurrentUserId();
    if (!uid) return;

    const failedSystemIds = new Set<string>();
    const failedFleetIds = new Set<string>();

    await Promise.all(
      [...state.dirtySystemIds].map(async (id) => {
        const system = state.systems.find((s) => s.id === id);
        if (!system) return;

        try {
          await upsertSystem(system, uid);
          const planetAudits = [..._pendingPlanetAudits.entries()].filter(([, v]) => v.systemId === id);
          if (planetAudits.length > 0) {
            for (const [pId, audit] of planetAudits) {
              auditLog('planet_stats_updated', 'system', pId, audit.planetName, {
                fields: [...audit.fields],
              });
              _pendingPlanetAudits.delete(pId);
            }
          } else {
            auditLog('system_moved', 'system', id, system.name);
          }
        } catch (error) {
          console.error(`Failed to save system "${id}":`, error);
          failedSystemIds.add(id);
        }
      }),
    );

    await Promise.all(
      [...state.dirtyFleetIds].map(async (id) => {
        const fleet = state.fleets.find((f) => f.id === id);
        if (!fleet) return;

        try {
          await upsertFleet(fleet, uid);
          auditLog('fleet_moved', 'fleet', id, fleet.name);
        } catch (error) {
          console.error(`Failed to save fleet "${id}":`, error);
          failedFleetIds.add(id);
        }
      }),
    );

    let timelineFailed = false;
    if (state.dirtyTimeline) {
      try {
        await updateSetting('current_year', state.currentYear);
        auditLog('timeline_changed', 'system', 'current_year', 'Timeline', { year: state.currentYear });
      } catch (error) {
        console.error('Failed to save timeline setting:', error);
        timelineFailed = true;
      }
    }

    const nextDirtySystemIds = failedSystemIds;
    const nextDirtyFleetIds = failedFleetIds;
    const nextDirtyTimeline = timelineFailed;
    const hasPendingChanges = nextDirtySystemIds.size > 0 || nextDirtyFleetIds.size > 0 || nextDirtyTimeline;

    set({
      dirtySystemIds: nextDirtySystemIds,
      dirtyFleetIds: nextDirtyFleetIds,
      dirtyTimeline: nextDirtyTimeline,
      hasPendingChanges,
    });

    const saved = get();
    _systemsSnapshot = mergeSavedSnapshotEntries(
      _systemsSnapshot,
      saved.systems,
      state.dirtySystemIds,
      failedSystemIds,
      cloneSystem,
    );
    _fleetsSnapshot = mergeSavedSnapshotEntries(
      _fleetsSnapshot,
      saved.fleets,
      state.dirtyFleetIds,
      failedFleetIds,
      cloneFleet,
    );
    if (state.dirtyTimeline && !timelineFailed) {
      _yearSnapshot = saved.currentYear;
    }
  },

  discardAllChanges: async () => {
    _pendingPlanetAudits.clear();
    set({
      systems: cloneSystems(_systemsSnapshot),
      fleets: cloneFleets(_fleetsSnapshot),
      currentYear: _yearSnapshot,
      dirtySystemIds: new Set<string>(),
      dirtyFleetIds: new Set<string>(),
      dirtyTimeline: false,
      hasPendingChanges: false,
    });
  },
}));
