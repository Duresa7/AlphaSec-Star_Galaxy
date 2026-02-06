import { create } from 'zustand';
import type { 
  GalaxyStore, 
  InfoPanelData,
  Faction,
  SearchResult
} from '@/types';
import {
  starSystems,
  anomalies,
  fleets
} from '@/data/galaxyData';
import { loadCustomSystems, saveCustomSystems } from '@/data/customPlanetStorage';
import { loadCustomFleets, saveCustomFleets } from '@/data/customFleetStorage';

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
    // Stay in system view when selecting a planet
  }),
  setSelectedFleet: (id: string | null) => set({ 
    selectedFleetId: id,
    selectedSystemId: null,
    selectedPlanetId: null,
    viewMode: id ? 'fleet' : 'topdown',
  }),
  
  // Data - use imported data merged with saved custom systems
  systems: [...starSystems, ...loadCustomSystems()],
  anomalies: anomalies,
  fleets: [...fleets, ...loadCustomFleets()],
  
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
      // Check faction filter
      if (!state.factionFilters[system.faction]) {
        return false;
      }
      
      // Check search query
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
    
    // Search systems
    state.systems.forEach((system) => {
      if (system.name.toLowerCase().includes(query)) {
        results.push({ type: 'system', id: system.id, name: system.name });
      }
      
      // Search planets within systems
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

    // Search fleets
    state.fleets.forEach((fleet) => {
      if (fleet.name.toLowerCase().includes(query)) {
        results.push({ type: 'fleet', id: fleet.id, name: fleet.name });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  },

  // Custom planet creation
  placementMode: false,
  pendingCustomPlanet: null,
  draggingCustomPlanet: false,

  setPlacementMode: (mode, pending = null) => set({
    placementMode: mode,
    pendingCustomPlanet: pending ?? null,
    // Clear fleet placement if activating planet placement
    ...(mode ? { fleetPlacementMode: false, pendingCustomFleet: null } : {}),
  }),

  setDraggingCustomPlanet: (dragging) => set({ draggingCustomPlanet: dragging }),

  addCustomSystem: (system) => set((state) => {
    const newSystems = [...state.systems, system];
    saveCustomSystems(newSystems.filter(s => s.isCustom));
    return { systems: newSystems, placementMode: false, pendingCustomPlanet: null };
  }),

  removeCustomSystem: (id) => set((state) => {
    const newSystems = state.systems.filter(s => s.id !== id);
    saveCustomSystems(newSystems.filter(s => s.isCustom));
    return {
      systems: newSystems,
      infoPanelData: state.infoPanelData?.data && 'id' in state.infoPanelData.data && state.infoPanelData.data.id === id
        ? null : state.infoPanelData,
    };
  }),

  updateCustomSystemPosition: (id, position) => set((state) => {
    const newSystems = state.systems.map(s =>
      s.id === id ? { ...s, position: position.clone(), planets: s.planets.map(p => ({ ...p })) } : s
    );
    saveCustomSystems(newSystems.filter(s => s.isCustom));
    return { systems: newSystems };
  }),

  // Custom fleet creation
  fleetPlacementMode: false,
  pendingCustomFleet: null,
  draggingCustomFleet: false,

  setFleetPlacementMode: (mode, pending = null) => set({
    fleetPlacementMode: mode,
    pendingCustomFleet: pending ?? null,
    // Clear planet placement if activating fleet placement
    ...(mode ? { placementMode: false, pendingCustomPlanet: null } : {}),
  }),

  setDraggingCustomFleet: (dragging) => set({ draggingCustomFleet: dragging }),

  addCustomFleet: (fleet) => set((state) => {
    const newFleets = [...state.fleets, fleet];
    saveCustomFleets(newFleets.filter(f => f.isCustom));
    return { fleets: newFleets, fleetPlacementMode: false, pendingCustomFleet: null };
  }),

  removeCustomFleet: (id) => set((state) => {
    const newFleets = state.fleets.filter(f => f.id !== id);
    saveCustomFleets(newFleets.filter(f => f.isCustom));
    const isSelected = state.selectedFleetId === id;
    return {
      fleets: newFleets,
      infoPanelData: state.infoPanelData?.data && 'id' in state.infoPanelData.data && state.infoPanelData.data.id === id
        ? null : state.infoPanelData,
      ...(isSelected ? { selectedFleetId: null, viewMode: 'topdown' as const } : {}),
    };
  }),

  updateCustomFleetPosition: (id, position) => set((state) => {
    const newFleets = state.fleets.map(f =>
      f.id === id ? { ...f, position: position.clone() } : f
    );
    saveCustomFleets(newFleets.filter(f => f.isCustom));
    return { fleets: newFleets };
  }),
}));
