import * as THREE from 'three';
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
import {
  fetchLatestRedoAction,
  fetchLatestUndoAction,
  fetchUndoRedoAvailability,
  markActionUndone,
  recordMapAction,
  serializeFleet,
  serializeSystem,
  serializeVector,
  deserializeFleet,
  deserializeSystem,
  deserializeVector,
  toStatsSnapshot,
  type MapActionPayload,
} from '@/data/actionHistory';
import { logActivity } from '@/data/activityLog';
import { useAuthStore } from '@/store/authStore';

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

const vectorChanged = (a: THREE.Vector3, b: THREE.Vector3): boolean => a.distanceToSquared(b) > 1e-9;
const clampMarkerSize = (value: number): number => Math.max(0.5, Math.min(6, value));

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

const statsSnapshotToUpdate = (
  snapshot: MapActionPayload & { systemId?: string; planetId?: string },
): PlanetStatsUpdate => {
  if (!('stats' in snapshot)) return {};
  return {
    population: snapshot.stats.population,
    factionControl: snapshot.stats.factionControl,
    description: snapshot.stats.description,
    climate: snapshot.stats.climate,
    terrain: snapshot.stats.terrain,
    notable: snapshot.stats.notable,
  };
};

let historyReplayDepth = 0;
const isReplayingHistory = () => historyReplayDepth > 0;
const canEditMap = () => useAuthStore.getState().isAdmin;

async function withHistoryReplay(task: () => void | Promise<void>) {
  historyReplayDepth += 1;
  try {
    await task();
  } finally {
    historyReplayDepth -= 1;
  }
}

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
  setTopDownSelection: (systemId: string | null, planetId: string | null = null) =>
    set({
      selectedSystemId: systemId,
      selectedPlanetId: systemId ? planetId : null,
      selectedFleetId: null,
      viewMode: 'topdown',
    }),
  setTopDownFleetSelection: (fleetId: string | null) =>
    set({
      selectedFleetId: fleetId,
      selectedSystemId: null,
      selectedPlanetId: null,
      viewMode: 'topdown',
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

  // Data — start with static data only; custom data loads async via initializeData
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
              ...(override.population !== undefined ? { population: override.population ?? undefined } : {}),
              ...(override.factionControl !== undefined ? { factionControl: override.factionControl ?? undefined } : {}),
              ...(override.description !== undefined ? { description: override.description ?? '' } : {}),
              ...(override.climate !== undefined ? { climate: override.climate ?? undefined } : {}),
              ...(override.terrain !== undefined ? { terrain: override.terrain ?? undefined } : {}),
              ...(override.notable !== undefined ? { notable: override.notable ?? undefined } : {}),
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
  handleRemoteSystemInsert: (system) =>
    set((state) => {
      if (state.systems.some((s) => s.id === system.id)) return state;
      return { systems: [...state.systems, system] };
    }),

  handleRemoteSystemDelete: (id) =>
    set((state) => {
      const shouldClearPanel = shouldClearPanelForSystem(state.infoPanelData, id);
      const isSelected = state.selectedSystemId === id;
      return {
        systems: state.systems.filter((s) => s.id !== id),
        infoPanelData: shouldClearPanel ? null : state.infoPanelData,
        ...(isSelected ? { selectedSystemId: null, selectedPlanetId: null, viewMode: 'topdown' as const } : {}),
      };
    }),

  handleRemoteSystemUpdate: (id, updates) =>
    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  handleRemoteFleetInsert: (fleet) =>
    set((state) => {
      if (state.fleets.some((f) => f.id === fleet.id)) return state;
      return { fleets: [...state.fleets, fleet] };
    }),

  handleRemoteFleetDelete: (id) =>
    set((state) => {
      const shouldClearPanel = shouldClearPanelForFleet(state.infoPanelData, id);
      const isSelected = state.selectedFleetId === id;
      return {
        fleets: state.fleets.filter((f) => f.id !== id),
        infoPanelData: shouldClearPanel ? null : state.infoPanelData,
        ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
      };
    }),

  handleRemoteFleetUpdate: (id, updates) =>
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  handleRemotePlanetStatsUpdate: (planetId, stats) =>
    set((state) => ({
      systems: state.systems.map((s) => ({
        ...s,
        planets: s.planets.map((p) => (p.id === planetId ? { ...p, ...stats } : p)),
      })),
    })),

  // ─── Planet Stats Editing ──────────────────────────
  updatePlanetStats: (systemId, planetId, updates) => {
    if (!canEditMap()) return;
    const state = get();
    const resolvedSystem =
      state.systems.find((s) => s.id === systemId) ?? state.systems.find((s) => s.planets.some((p) => p.id === planetId));
    if (!resolvedSystem) return;

    const currentPlanet = resolvedSystem.planets.find((p) => p.id === planetId);
    if (!currentPlanet) return;

    const previousStats = toStatsSnapshot(currentPlanet);

    // Optimistic local update
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

    // Persist to Supabase
    if (resolvedSystem.isCustom) {
      updateCustomPlanetStats(planetId, {
        population: hasOwn(updates, 'population') ? updates.population ?? null : undefined,
        factionControl: hasOwn(updates, 'factionControl') ? updates.factionControl ?? null : undefined,
        description: hasOwn(updates, 'description') ? updates.description ?? null : undefined,
        climate: hasOwn(updates, 'climate') ? updates.climate ?? null : undefined,
        terrain: hasOwn(updates, 'terrain') ? updates.terrain ?? null : undefined,
        notable: hasOwn(updates, 'notable') ? updates.notable ?? null : undefined,
      }).catch(console.error);
    } else {
      upsertPlanetStats(planetId, resolvedSystem.id, {
        population: hasOwn(updates, 'population') ? updates.population ?? null : undefined,
        factionControl: hasOwn(updates, 'factionControl') ? updates.factionControl ?? null : undefined,
        description: hasOwn(updates, 'description') ? updates.description ?? null : undefined,
        climate: hasOwn(updates, 'climate') ? updates.climate ?? null : undefined,
        terrain: hasOwn(updates, 'terrain') ? updates.terrain ?? null : undefined,
        notable: hasOwn(updates, 'notable') ? updates.notable ?? null : undefined,
      }).catch(console.error);
    }

    if (!isReplayingHistory()) {
      const nextSystem = get().systems.find((s) => s.id === resolvedSystem.id);
      const nextPlanet = nextSystem?.planets.find((p) => p.id === planetId);
      if (nextPlanet) {
        const nextStats = toStatsSnapshot(nextPlanet);
        const before = JSON.stringify(previousStats);
        const after = JSON.stringify(nextStats);
        if (before !== after) {
          void recordMapAction(
            'planet_stats_update',
            { systemId: resolvedSystem.id, planetId, stats: nextStats },
            { systemId: resolvedSystem.id, planetId, stats: previousStats },
          );
          void logActivity({
            eventType: 'planet_stats_updated',
            entityType: 'planet',
            entityId: planetId,
            message: `Updated stats for ${nextPlanet.name}`,
            metadata: { systemId: resolvedSystem.id },
          });
        }
      }
    }
  },

  // ─── Custom Planet Creation ────────────────────────
  placementMode: false,
  pendingCustomPlanet: null,
  draggingCustomPlanet: false,

  setPlacementMode: (mode, pending = null) =>
    set((state) => {
      if (!canEditMap()) {
        return {
          placementMode: false,
          pendingCustomPlanet: null,
          fleetPlacementMode: state.fleetPlacementMode,
          pendingCustomFleet: state.pendingCustomFleet,
        };
      }

      return {
        placementMode: mode,
        pendingCustomPlanet: pending ?? null,
        ...(mode ? { fleetPlacementMode: false, pendingCustomFleet: null } : {}),
      };
    }),

  setDraggingCustomPlanet: (dragging) => set({ draggingCustomPlanet: dragging }),

  addCustomSystem: (system) => {
    if (!canEditMap()) return;
    // Optimistic local update
    set((state) => ({
      systems: [...state.systems, system],
      placementMode: false,
      pendingCustomPlanet: null,
    }));

    // Persist to Supabase
    insertCustomSystem(system).catch(console.error);

    if (!isReplayingHistory()) {
      void recordMapAction('system_create', { system: serializeSystem(system) }, { id: system.id });
      void logActivity({
        eventType: 'custom_system_created',
        entityType: 'system',
        entityId: system.id,
        message: `Created custom planet/system: ${system.name}`,
      });
    }
  },

  removeCustomSystem: (id) => {
    if (!canEditMap()) return;
    const existing = get().systems.find((s) => s.id === id && s.isCustom);

    // Optimistic local update
    set((state) => {
      const isSelected = state.selectedSystemId === id;
      const shouldClear = shouldClearPanelForSystem(state.infoPanelData, id);
      return {
        systems: state.systems.filter((s) => s.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedSystemId: null, selectedPlanetId: null, viewMode: 'topdown' as const } : {}),
      };
    });

    // Persist to Supabase
    deleteSystemFromDB(id).catch(console.error);

    if (!isReplayingHistory() && existing) {
      void recordMapAction('system_delete', { id }, { system: serializeSystem(existing) });
      void logActivity({
        eventType: 'custom_system_deleted',
        entityType: 'system',
        entityId: id,
        message: `Deleted custom planet/system: ${existing.name}`,
      });
    }
  },

  previewCustomSystemPosition: (id, position) => {
    if (!canEditMap()) return;
    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, position: position.clone() } : s)),
    }));
  },

  updateCustomSystemPosition: (id, position, previousPosition) => {
    if (!canEditMap()) return;
    const existing = get().systems.find((s) => s.id === id);
    const previous = previousPosition?.clone() ?? existing?.position.clone();
    if (!existing || !previous) return;

    // Optimistic local update
    set((state) => ({
      systems: state.systems.map((s) =>
        s.id === id ? { ...s, position: position.clone(), planets: s.planets.map((p) => ({ ...p })) } : s,
      ),
    }));

    // Persist to Supabase for custom systems only
    if (existing.isCustom) {
      updateSystemPosition(id, position.x, position.z).catch(console.error);
    }

    if (!isReplayingHistory() && vectorChanged(previous, position)) {
      void recordMapAction(
        'system_move',
        { id, position: serializeVector(position) },
        { id, position: serializeVector(previous) },
      );
      void logActivity({
        eventType: 'custom_system_moved',
        entityType: 'system',
        entityId: id,
        message: existing.isCustom ? `Moved custom system: ${existing.name}` : `Moved system: ${existing.name}`,
        metadata: {
          from: serializeVector(previous),
          to: serializeVector(position),
        },
      });
    }
  },

  updateCustomSystemMarkerSize: (id, markerSize) => {
    const size = clampMarkerSize(markerSize);
    // Optimistic local update
    set((state) => ({
      systems: state.systems.map((s) => (s.id === id ? { ...s, markerSize: size } : s)),
    }));
    const system = get().systems.find((s) => s.id === id);
    // Persist only for editable custom systems
    if (system?.isCustom && canEditMap()) {
      updateSystemMarkerSize(id, size).catch(console.error);
    }
  },

  // ─── Custom Fleet Creation ─────────────────────────
  fleetPlacementMode: false,
  pendingCustomFleet: null,
  draggingCustomFleet: false,

  setFleetPlacementMode: (mode, pending = null) =>
    set((state) => {
      if (!canEditMap()) {
        return {
          fleetPlacementMode: false,
          pendingCustomFleet: null,
          placementMode: state.placementMode,
          pendingCustomPlanet: state.pendingCustomPlanet,
        };
      }

      return {
        fleetPlacementMode: mode,
        pendingCustomFleet: pending ?? null,
        ...(mode ? { placementMode: false, pendingCustomPlanet: null } : {}),
      };
    }),

  setDraggingCustomFleet: (dragging) => set({ draggingCustomFleet: dragging }),

  addCustomFleet: (fleet) => {
    if (!canEditMap()) return;
    // Optimistic local update
    set((state) => ({
      fleets: [...state.fleets, fleet],
      fleetPlacementMode: false,
      pendingCustomFleet: null,
    }));
    // Persist to Supabase
    insertCustomFleet(fleet).catch(console.error);

    if (!isReplayingHistory()) {
      void recordMapAction('fleet_create', { fleet: serializeFleet(fleet) }, { id: fleet.id });
      void logActivity({
        eventType: 'custom_fleet_created',
        entityType: 'fleet',
        entityId: fleet.id,
        message: `Created custom fleet: ${fleet.name}`,
      });
    }
  },

  removeCustomFleet: (id) => {
    if (!canEditMap()) return;
    const existing = get().fleets.find((f) => f.id === id && f.isCustom);

    // Optimistic local update
    set((state) => {
      const isSelected = state.selectedFleetId === id;
      const shouldClear = shouldClearPanelForFleet(state.infoPanelData, id);
      return {
        fleets: state.fleets.filter((f) => f.id !== id),
        infoPanelData: shouldClear ? null : state.infoPanelData,
        ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
      };
    });
    // Persist to Supabase
    deleteFleetFromDB(id).catch(console.error);

    if (!isReplayingHistory() && existing) {
      void recordMapAction('fleet_delete', { id }, { fleet: serializeFleet(existing) });
      void logActivity({
        eventType: 'custom_fleet_deleted',
        entityType: 'fleet',
        entityId: id,
        message: `Deleted custom fleet: ${existing.name}`,
      });
    }
  },

  previewCustomFleetPosition: (id, position) => {
    if (!canEditMap()) return;
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
    }));
  },

  updateCustomFleetPosition: (id, position, previousPosition) => {
    if (!canEditMap()) return;
    const existing = get().fleets.find((f) => f.id === id);
    const previous = previousPosition?.clone() ?? existing?.position.clone();
    if (!existing || !previous) return;

    // Optimistic local update
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, position: position.clone() } : f)),
    }));
    // Persist to Supabase for custom fleets only
    if (existing.isCustom) {
      updateFleetPosition(id, position.x, position.z).catch(console.error);
    }

    if (!isReplayingHistory() && vectorChanged(previous, position)) {
      void recordMapAction(
        'fleet_move',
        { id, position: serializeVector(position) },
        { id, position: serializeVector(previous) },
      );
      void logActivity({
        eventType: 'custom_fleet_moved',
        entityType: 'fleet',
        entityId: id,
        message: existing.isCustom ? `Moved custom fleet: ${existing.name}` : `Moved fleet: ${existing.name}`,
        metadata: {
          from: serializeVector(previous),
          to: serializeVector(position),
        },
      });
    }
  },

  updateFleetMarkerSize: (id, markerSize) => {
    const size = clampMarkerSize(markerSize);
    set((state) => ({
      fleets: state.fleets.map((f) => (f.id === id ? { ...f, markerSize: size } : f)),
    }));
  },

  // ─── Global History (Admin) ────────────────────────
  historyBusy: false,
  canUndo: false,
  canRedo: false,

  refreshHistoryAvailability: async () => {
    if (!useAuthStore.getState().hasAdminPermission('run_global_history')) {
      set({ canUndo: false, canRedo: false, historyBusy: false });
      return;
    }

    const { canUndo, canRedo } = await fetchUndoRedoAvailability();
    set({ canUndo, canRedo });
  },

  undoGlobalAction: async () => {
    if (!useAuthStore.getState().hasAdminPermission('run_global_history')) {
      set({ canUndo: false, canRedo: false, historyBusy: false });
      return;
    }

    set({ historyBusy: true });
    try {
      const action = await fetchLatestUndoAction();
      if (!action) {
        const availability = await fetchUndoRedoAvailability();
        set({ ...availability, historyBusy: false });
        return;
      }

      await withHistoryReplay(async () => {
        switch (action.actionType) {
          case 'system_create':
            if ('id' in action.undoPayload) {
              get().removeCustomSystem(action.undoPayload.id);
            }
            break;
          case 'system_delete':
            if ('system' in action.undoPayload) {
              get().addCustomSystem(deserializeSystem(action.undoPayload.system));
            }
            break;
          case 'system_move':
            if ('id' in action.undoPayload && 'position' in action.undoPayload) {
              get().updateCustomSystemPosition(action.undoPayload.id, deserializeVector(action.undoPayload.position));
            }
            break;
          case 'fleet_create':
            if ('id' in action.undoPayload) {
              get().removeCustomFleet(action.undoPayload.id);
            }
            break;
          case 'fleet_delete':
            if ('fleet' in action.undoPayload) {
              get().addCustomFleet(deserializeFleet(action.undoPayload.fleet));
            }
            break;
          case 'fleet_move':
            if ('id' in action.undoPayload && 'position' in action.undoPayload) {
              get().updateCustomFleetPosition(action.undoPayload.id, deserializeVector(action.undoPayload.position));
            }
            break;
          case 'planet_stats_update':
            if ('planetId' in action.undoPayload && 'systemId' in action.undoPayload) {
              get().updatePlanetStats(
                action.undoPayload.systemId,
                action.undoPayload.planetId,
                statsSnapshotToUpdate(action.undoPayload),
              );
            }
            break;
          default:
            break;
        }
      });

      await markActionUndone(action.id, true);
      void logActivity({
        eventType: 'history_undo',
        entityType: 'history',
        entityId: String(action.id),
        message: `Admin undo applied: ${action.actionType}`,
      });
      const availability = await fetchUndoRedoAvailability();
      set({ ...availability, historyBusy: false });
    } catch (err) {
      console.error('Failed to execute global undo:', err);
      set({ historyBusy: false });
    }
  },

  redoGlobalAction: async () => {
    if (!useAuthStore.getState().hasAdminPermission('run_global_history')) {
      set({ canUndo: false, canRedo: false, historyBusy: false });
      return;
    }

    set({ historyBusy: true });
    try {
      const action = await fetchLatestRedoAction();
      if (!action) {
        const availability = await fetchUndoRedoAvailability();
        set({ ...availability, historyBusy: false });
        return;
      }

      await withHistoryReplay(async () => {
        switch (action.actionType) {
          case 'system_create':
            if ('system' in action.doPayload) {
              get().addCustomSystem(deserializeSystem(action.doPayload.system));
            }
            break;
          case 'system_delete':
            if ('id' in action.doPayload) {
              get().removeCustomSystem(action.doPayload.id);
            }
            break;
          case 'system_move':
            if ('id' in action.doPayload && 'position' in action.doPayload) {
              get().updateCustomSystemPosition(action.doPayload.id, deserializeVector(action.doPayload.position));
            }
            break;
          case 'fleet_create':
            if ('fleet' in action.doPayload) {
              get().addCustomFleet(deserializeFleet(action.doPayload.fleet));
            }
            break;
          case 'fleet_delete':
            if ('id' in action.doPayload) {
              get().removeCustomFleet(action.doPayload.id);
            }
            break;
          case 'fleet_move':
            if ('id' in action.doPayload && 'position' in action.doPayload) {
              get().updateCustomFleetPosition(action.doPayload.id, deserializeVector(action.doPayload.position));
            }
            break;
          case 'planet_stats_update':
            if ('planetId' in action.doPayload && 'systemId' in action.doPayload) {
              get().updatePlanetStats(
                action.doPayload.systemId,
                action.doPayload.planetId,
                statsSnapshotToUpdate(action.doPayload),
              );
            }
            break;
          default:
            break;
        }
      });

      await markActionUndone(action.id, false);
      void logActivity({
        eventType: 'history_redo',
        entityType: 'history',
        entityId: String(action.id),
        message: `Admin redo applied: ${action.actionType}`,
      });
      const availability = await fetchUndoRedoAvailability();
      set({ ...availability, historyBusy: false });
    } catch (err) {
      console.error('Failed to execute global redo:', err);
      set({ historyBusy: false });
    }
  },
}));
