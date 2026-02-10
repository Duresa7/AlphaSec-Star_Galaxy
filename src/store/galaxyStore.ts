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
import { loadCustomSystems, saveCustomSystems } from '@/data/customPlanetStorage';
import { loadCustomFleets, saveCustomFleets } from '@/data/customFleetStorage';
import { TOPDOWN_MARKER_MAX_SIZE, TOPDOWN_MARKER_MIN_SIZE } from '@/config/topDownMarkerConfig';

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
  if (hasOwn(updates, 'factionControl')) {
    next.factionControl = updates.factionControl ?? undefined;
  }

  return next;
};

/** Persist all custom systems currently in state to localStorage. */
const persistSystems = (systems: import('@/types').StarSystem[]) => {
  saveCustomSystems(systems.filter((s) => s.isCustom));
};

/** Persist all custom fleets currently in state to localStorage. */
const persistFleets = (fleets: import('@/types').Fleet[]) => {
  saveCustomFleets(fleets.filter((f) => f.isCustom));
};

/** Add incoming entities only when their ids are not already present. */
const appendMissingById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
  if (incoming.length === 0) return current;

  const existingIds = new Set(current.map((item) => item.id));
  const merged = [...current];

  for (const item of incoming) {
    if (existingIds.has(item.id)) continue;
    merged.push(item);
    existingIds.add(item.id);
  }

  return merged;
};

export const useGalaxyStore = create<GalaxyStore>((set, get) => ({
  // View state
  viewMode: 'topdown',

  // Selection state
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

  // Data — start with static data only; custom data loads via initializeData
  systems: [...starSystems],
  anomalies,
  fleets: [...fleets],

  // UI state
  showFleets: true,
  showAnomalies: true,
  showLabels: true,
  toggleFleets: () => set((state) => ({ showFleets: !state.showFleets })),
  toggleAnomalies: () => set((state) => ({ showAnomalies: !state.showAnomalies })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  // Info panel
  infoPanelData: null,
  setInfoPanelData: (data: InfoPanelData | null) => set({ infoPanelData: data }),

  // Timeline - Old Republic era ~3956 BBY (KOTOR 1)
  currentYear: 3956,
  setCurrentYear: (year: number) => set({ currentYear: year }),

  // Loading
  isLoading: true,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  // Search and filtering
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

  // Computed: filtered systems
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

  // Get search results for dropdown
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

  // Faction stats
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

  // ─── Data Initialization (localStorage) ───────────
  initializeData: async () => {
    try {
      const customSystems = loadCustomSystems();
      const customFleets = loadCustomFleets();

      set((state) => ({
        systems: appendMissingById(state.systems, customSystems),
        fleets: appendMissingById(state.fleets, customFleets),
        isLoading: false,
      }));
    } catch (err) {
      console.error('Failed to initialize custom data from localStorage:', err);
      set({ isLoading: false });
    }
  },

  // ─── Planet Stats Editing ──────────────────────────
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
    }));

    // Persist custom systems to localStorage
    if (resolvedSystem.isCustom) {
      persistSystems(get().systems);
    }
  },

  // ─── Custom Planet Creation ────────────────────────
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
    persistSystems(get().systems);
  },

  removeCustomSystem: (id) => {
    set((state) => {
      const isSelected = state.selectedSystemId === id;
      const shouldClear = shouldClearPanelForSystem(state.infoPanelData, id);
      return {
        systems: state.systems.filter((s) => s.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedSystemId: null, selectedPlanetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    persistSystems(get().systems);
  },

  previewCustomSystemPosition: (id, position) => {
    const existing = get().systems.find((s) => s.id === id && s.isCustom);
    if (!existing) return;

    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, position: position.clone() } : s)),
    }));
  },

  updateCustomSystemPosition: (id, position) => {
    const existing = get().systems.find((s) => s.id === id && s.isCustom);
    if (!existing) return;

    set((state) => ({
      systems: state.systems.map((s) =>
        s.id === id ? { ...s, position: position.clone(), planets: s.planets.map((p) => ({ ...p })) } : s,
      ),
    }));
    persistSystems(get().systems);
  },

  updateCustomSystemMarkerSize: (id, markerSize) => {
    const existing = get().systems.find((s) => s.id === id && s.isCustom);
    if (!existing) return;

    const size = clampMarkerSize(markerSize);
    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, markerSize: size } : s)),
    }));
    persistSystems(get().systems);
  },

  // ─── Custom Fleet Creation ─────────────────────────
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
    persistFleets(get().fleets);
  },

  removeCustomFleet: (id) => {
    set((state) => {
      const isSelected = state.selectedFleetId === id;
      const shouldClear = shouldClearPanelForFleet(state.infoPanelData, id);
      return {
        fleets: state.fleets.filter((f) => f.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    persistFleets(get().fleets);
  },

  previewCustomFleetPosition: (id, position) => {
    const existing = get().fleets.find((f) => f.id === id && f.isCustom);
    if (!existing) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
    }));
  },

  updateCustomFleetPosition: (id, position) => {
    const existing = get().fleets.find((f) => f.id === id && f.isCustom);
    if (!existing) return;

    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
    }));
    persistFleets(get().fleets);
  },

  updateFleetMarkerSize: (id, markerSize) => {
    const existing = get().fleets.find((f) => f.id === id && f.isCustom);
    if (!existing) return;

    const size = clampMarkerSize(markerSize);
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, markerSize: size } : f)),
    }));
    persistFleets(get().fleets);
  },
}));
