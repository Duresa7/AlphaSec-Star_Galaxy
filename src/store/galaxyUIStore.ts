import { create } from 'zustand';
import type { GalaxyUIStore, Faction } from '@/types';

export const useGalaxyUIStore = create<GalaxyUIStore>((set) => ({
  showFleets: true,
  showAnomalies: true,
  showLabels: true,
  toggleFleets: () => set((state) => ({ showFleets: !state.showFleets })),
  toggleAnomalies: () => set((state) => ({ showAnomalies: !state.showAnomalies })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

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
}));
