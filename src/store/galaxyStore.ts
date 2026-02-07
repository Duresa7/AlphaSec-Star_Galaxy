import { create } from 'zustand';
import type {
  GalaxyStore,
  InfoPanelData,
  Faction,
  SearchResult,
} from '@/types';
import {
  starSystems,
  anomalies,
  fleets
} from '@/data/galaxyData';
import {
  fetchCustomSystems,
  fetchCustomFleets,
  fetchPlanetStatsOverrides,
  insertCustomSystem,
  deleteCustomSystem as deleteSystemFromDB,
  updateSystemPosition,
  updateSystemMarkerSize,
  insertCustomFleet,
  deleteCustomFleet as deleteFleetFromDB,
  updateFleetPosition,
  upsertPlanetStats,
  updateCustomPlanetStats,
  migrateLocalStorageToSupabase,
} from '@/data/supabaseStorage';

const shouldClearPanelForSystem = (panel: InfoPanelData | null, systemId: string): boolean => {
  if (!panel) return false;
  if (panel.type === 'system') return panel.data.id === systemId;
  if (panel.type === 'planet') return panel.data.systemId === systemId;
  return false;
};

const shouldClearPanelForFleet = (panel: InfoPanelData | null, fleetId: string): boolean => {
  return panel?.type === 'fleet' && panel.data.id === fleetId;
};

export const useGalaxyStore = create<GalaxyStore>((set, get) => ({
  // View state
  viewMode: 'topdown',

  // Selection state
  selectedSystemId: null,
  selectedPlanetId: null,
  selectedFleetId: null,
  setSelectedSystem: (id: string | null) => set({
    selectedSystemId: id,
    selectedPlanetId: null,
    selectedFleetId: null,
    viewMode: id ? 'system' : 'topdown',
  }),
  setSelectedPlanet: (id: string | null) => set({
    selectedPlanetId: id,
  }),
  setSelectedFleet: (id: string | null) => set({
    selectedFleetId: id,
    selectedSystemId: null,
    selectedPlanetId: null,
    viewMode: id ? 'fleet' : 'topdown',
  }),

  // Data — start with static data only; custom data loads async via initializeData
  systems: [...starSystems],
  anomalies: anomalies,
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
  toggleFactionFilter: (faction: Faction) => set((state) => ({
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
        const matchesPlanets = system.planets.some(p =>
          p.name.toLowerCase().includes(query)
        );
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
            parentName: system.name
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

  // ─── Supabase Data Initialization ──────────────────

  initializeData: async () => {
    try {
      // Migrate any existing localStorage data first
      await migrateLocalStorageToSupabase();

      const [customSystems, customFleets, overrides] = await Promise.all([
        fetchCustomSystems(),
        fetchCustomFleets(),
        fetchPlanetStatsOverrides(),
      ]);

      set((state) => {
        // Merge stat overrides into static (built-in) systems
        const mergedSystems = state.systems.map((s) => ({
          ...s,
          planets: s.planets.map((p) => {
            const override = overrides.get(p.id);
            if (!override) return p;
            return {
              ...p,
              ...(override.population !== undefined ? { population: override.population } : {}),
              ...(override.factionControl !== undefined ? { factionControl: override.factionControl } : {}),
              ...(override.description !== undefined ? { description: override.description } : {}),
              ...(override.climate !== undefined ? { climate: override.climate } : {}),
              ...(override.terrain !== undefined ? { terrain: override.terrain } : {}),
              ...(override.notable !== undefined ? { notable: override.notable } : {}),
            };
          }),
        }));

        return {
          systems: [...mergedSystems, ...customSystems],
          fleets: [...state.fleets, ...customFleets],
          isLoading: false,
        };
      });
    } catch (err) {
      console.error('Failed to initialize data from Supabase:', err);
      set({ isLoading: false });
    }
  },

  // ─── Remote Event Handlers (Supabase Realtime) ─────

  handleRemoteSystemInsert: (system) => set((state) => {
    if (state.systems.some((s) => s.id === system.id)) return state;
    return { systems: [...state.systems, system] };
  }),

  handleRemoteSystemDelete: (id) => set((state) => {
    const shouldClearPanel = shouldClearPanelForSystem(state.infoPanelData, id);
    const isSelected = state.selectedSystemId === id;
    return {
      systems: state.systems.filter((s) => s.id !== id),
      infoPanelData: shouldClearPanel ? null : state.infoPanelData,
      ...(isSelected ? { selectedSystemId: null, selectedPlanetId: null, viewMode: 'topdown' as const } : {}),
    };
  }),

  handleRemoteSystemUpdate: (id, updates) => set((state) => ({
    systems: state.systems.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  handleRemoteFleetInsert: (fleet) => set((state) => {
    if (state.fleets.some((f) => f.id === fleet.id)) return state;
    return { fleets: [...state.fleets, fleet] };
  }),

  handleRemoteFleetDelete: (id) => set((state) => {
    const shouldClearPanel = shouldClearPanelForFleet(state.infoPanelData, id);
    const isSelected = state.selectedFleetId === id;
    return {
      fleets: state.fleets.filter((f) => f.id !== id),
      infoPanelData: shouldClearPanel ? null : state.infoPanelData,
      ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
    };
  }),

  handleRemoteFleetUpdate: (id, updates) => set((state) => ({
    fleets: state.fleets.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    ),
  })),

  handleRemotePlanetStatsUpdate: (planetId, stats) => set((state) => ({
    systems: state.systems.map((s) => ({
      ...s,
      planets: s.planets.map((p) =>
        p.id === planetId ? { ...p, ...stats } : p
      ),
    })),
  })),

  // ─── Planet Stats Editing ──────────────────────────

  updatePlanetStats: (systemId, planetId, updates) => {
    // Optimistic local update
    set((state) => {
      const newSystems = state.systems.map(s => {
        const hasSystemId = state.systems.some((sys) => sys.id === systemId);
        const isTargetSystem = s.id === systemId;
        const isFallbackMatch = !hasSystemId && s.planets.some((p) => p.id === planetId);
        if (!isTargetSystem && !isFallbackMatch) return s;

        return {
          ...s,
          planets: s.planets.map(p => {
            if (p.id !== planetId) return p;
            return { ...p, ...updates, systemId: s.id };
          }),
        };
      });
      return { systems: newSystems };
    });

    // Persist to Supabase
    const system = get().systems.find(
      (s) => s.id === systemId || s.planets.some((p) => p.id === planetId)
    );
    if (system?.isCustom) {
      updateCustomPlanetStats(planetId, updates).catch(console.error);
    } else {
      upsertPlanetStats(planetId, systemId, {
        population: updates.population,
        factionControl: updates.factionControl,
        description: updates.description,
        climate: updates.climate,
        terrain: updates.terrain,
        notable: updates.notable,
      }).catch(console.error);
    }
  },

  // ─── Custom Planet Creation ────────────────────────

  placementMode: false,
  pendingCustomPlanet: null,
  draggingCustomPlanet: false,

  setPlacementMode: (mode, pending = null) => set({
    placementMode: mode,
    pendingCustomPlanet: pending ?? null,
    ...(mode ? { fleetPlacementMode: false, pendingCustomFleet: null } : {}),
  }),

  setDraggingCustomPlanet: (dragging) => set({ draggingCustomPlanet: dragging }),

  addCustomSystem: (system) => {
    // Optimistic local update
    set((state) => ({
      systems: [...state.systems, system],
      placementMode: false,
      pendingCustomPlanet: null,
    }));
    // Persist to Supabase
    insertCustomSystem(system).catch(console.error);
  },

  removeCustomSystem: (id) => {
    // Optimistic local update
    set((state) => {
      const isSelected = state.selectedSystemId === id;
      const shouldClear = shouldClearPanelForSystem(state.infoPanelData, id);
      return {
        systems: state.systems.filter(s => s.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedSystemId: null, selectedPlanetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    // Persist to Supabase
    deleteSystemFromDB(id).catch(console.error);
  },

  updateCustomSystemPosition: (id, position) => {
    // Optimistic local update
    set((state) => ({
      systems: state.systems.map(s =>
        s.id === id ? { ...s, position: position.clone(), planets: s.planets.map(p => ({ ...p })) } : s
      ),
    }));
    // Persist to Supabase
    updateSystemPosition(id, position.x, position.z).catch(console.error);
  },

  updateCustomSystemMarkerSize: (id, markerSize) => {
    // Optimistic local update
    set((state) => ({
      systems: state.systems.map(s =>
        s.id === id ? { ...s, markerSize } : s
      ),
    }));
    // Persist to Supabase
    updateSystemMarkerSize(id, markerSize).catch(console.error);
  },

  // ─── Custom Fleet Creation ─────────────────────────

  fleetPlacementMode: false,
  pendingCustomFleet: null,
  draggingCustomFleet: false,

  setFleetPlacementMode: (mode, pending = null) => set({
    fleetPlacementMode: mode,
    pendingCustomFleet: pending ?? null,
    ...(mode ? { placementMode: false, pendingCustomPlanet: null } : {}),
  }),

  setDraggingCustomFleet: (dragging) => set({ draggingCustomFleet: dragging }),

  addCustomFleet: (fleet) => {
    // Optimistic local update
    set((state) => ({
      fleets: [...state.fleets, fleet],
      fleetPlacementMode: false,
      pendingCustomFleet: null,
    }));
    // Persist to Supabase
    insertCustomFleet(fleet).catch(console.error);
  },

  removeCustomFleet: (id) => {
    // Optimistic local update
    set((state) => {
      const isSelected = state.selectedFleetId === id;
      const shouldClear = shouldClearPanelForFleet(state.infoPanelData, id);
      return {
        fleets: state.fleets.filter(f => f.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    // Persist to Supabase
    deleteFleetFromDB(id).catch(console.error);
  },

  updateCustomFleetPosition: (id, position) => {
    // Optimistic local update
    set((state) => ({
      fleets: state.fleets.map(f =>
        f.id === id ? { ...f, position: position.clone() } : f
      ),
    }));
    // Persist to Supabase
    updateFleetPosition(id, position.x, position.z).catch(console.error);
  },
}));
