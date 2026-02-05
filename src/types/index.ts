import * as THREE from 'three';

// View modes for the galaxy map
// 'topdown' - 2D overhead view with placeholder markers
// 'system' - 3D view of a selected planet
// 'fleet' - 3D view of a selected fleet
export type ViewMode = 'topdown' | 'system' | 'fleet';

// Faction affiliations
export type Faction = 'sith_empire' | 'galactic_republic' | 'neutral' | 'contested';

// Faction filter state
export type FactionFilters = Record<Faction, boolean>;

// Planet types
export type PlanetType = 
  | 'terrestrial' 
  | 'gas_giant' 
  | 'ice' 
  | 'desert' 
  | 'volcanic' 
  | 'ocean' 
  | 'jungle' 
  | 'city' 
  | 'barren'
  | 'destroyed';

// Anomaly types
export type AnomalyType = 
  | 'nebula' 
  | 'black_hole' 
  | 'space_station' 
  | 'hyperspace_lane';

// Planet data structure
export interface Planet {
  id: string;
  name: string;
  type: PlanetType;
  position: THREE.Vector3;
  radius: number;
  faction: Faction;
  description: string;
  population?: string;
  climate?: string;
  terrain?: string;
  notable?: string[];
  systemId: string;
}

// Star system data structure
export interface StarSystem {
  id: string;
  name: string;
  position: THREE.Vector3;
  faction: Faction;
  planets: Planet[];
  starType: 'yellow' | 'red' | 'blue' | 'white' | 'binary';
  importance: 'capital' | 'major' | 'minor' | 'outpost';
  description: string;
  region: GalaxyRegion;
}

// Galaxy regions
export type GalaxyRegion = 
  | 'deep_core'
  | 'core_worlds'
  | 'colonies'
  | 'inner_rim'
  | 'expansion_region'
  | 'mid_rim'
  | 'outer_rim'
  | 'unknown_regions';

// Hyperspace lane
export interface HyperspaceLane {
  id: string;
  name: string;
  systems: string[]; // System IDs
  type: 'major' | 'minor' | 'secret';
}

// Space anomaly
export interface Anomaly {
  id: string;
  name: string;
  type: AnomalyType;
  position: THREE.Vector3;
  radius: number;
  description: string;
}

// Fleet marker
export interface Fleet {
  id: string;
  name: string;
  faction: Faction;
  position: THREE.Vector3;
  shipCount: number;
  flagship?: string;
  commander?: string;
  systemId?: string;
}

// UI Panel types
export interface InfoPanelData {
  type: 'system' | 'planet' | 'fleet' | 'anomaly' | 'lane';
  data: StarSystem | Planet | Fleet | Anomaly | HyperspaceLane;
}

// Search result type
export interface SearchResult {
  type: 'system' | 'planet';
  id: string;
  name: string;
  parentName?: string;
}

// App state store type
export interface GalaxyStore {
  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Selection state
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedFleetId: string | null;
  setSelectedSystem: (id: string | null) => void;
  setSelectedPlanet: (id: string | null) => void;
  setSelectedFleet: (id: string | null) => void;
  
  // Data
  systems: StarSystem[];
  hyperspaceLanes: HyperspaceLane[];
  anomalies: Anomaly[];
  fleets: Fleet[];
  
  // UI state
  showHyperspaceLanes: boolean;
  showFleets: boolean;
  showAnomalies: boolean;
  showLabels: boolean;
  toggleHyperspaceLanes: () => void;
  toggleFleets: () => void;
  toggleAnomalies: () => void;
  toggleLabels: () => void;
  
  // Info panel
  infoPanelData: InfoPanelData | null;
  setInfoPanelData: (data: InfoPanelData | null) => void;
  
  // Timeline
  currentYear: number; // Default ~4000 BBY
  setCurrentYear: (year: number) => void;
  
  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Search and filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  factionFilters: FactionFilters;
  toggleFactionFilter: (faction: Faction) => void;
  
  // Computed getters
  getFilteredSystems: () => StarSystem[];
  getSearchResults: () => SearchResult[];
}
