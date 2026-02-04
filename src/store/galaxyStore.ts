import { create } from 'zustand';
import type { 
  GalaxyStore, 
  ViewMode, 
  InfoPanelData,
  Faction,
  SearchResult
} from '@/types';
import { 
  starSystems, 
  hyperspaceLanes, 
  anomalies, 
  fleets 
} from '@/data/galaxyData';

export const useGalaxyStore = create<GalaxyStore>((set, get) => ({
  // View state
  viewMode: 'topdown',
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  
  // Selection state
  selectedSystemId: null,
  selectedPlanetId: null,
  setSelectedSystem: (id: string | null) => set({ 
    selectedSystemId: id,
    selectedPlanetId: null,
    viewMode: id ? 'system' : 'topdown',
  }),
  setSelectedPlanet: (id: string | null) => set({ 
    selectedPlanetId: id,
    // Stay in system view when selecting a planet
  }),
  
  // Data - use imported data
  systems: starSystems,
  hyperspaceLanes: hyperspaceLanes,
  anomalies: anomalies,
  fleets: fleets,
  
  // UI state
  showHyperspaceLanes: true,
  showFleets: true,
  showAnomalies: true,
  showLabels: true,
  toggleHyperspaceLanes: () => set((state) => ({ showHyperspaceLanes: !state.showHyperspaceLanes })),
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
    
    return results.slice(0, 10); // Limit to 10 results
  },
}));
