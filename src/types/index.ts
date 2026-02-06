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
  isCustom?: boolean;
  customColor?: string;
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
  isCustom?: boolean;
}

// UI Panel types
export interface InfoPanelData {
  type: 'system' | 'planet' | 'fleet' | 'anomaly';
  data: StarSystem | Planet | Fleet | Anomaly;
}

// Search result type
export interface SearchResult {
  type: 'system' | 'planet' | 'fleet';
  id: string;
  name: string;
  parentName?: string;
}

// App state store type
export interface GalaxyStore {
  // View state
  viewMode: ViewMode;
  
  // Selection state
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedFleetId: string | null;
  setSelectedSystem: (id: string | null) => void;
  setSelectedPlanet: (id: string | null) => void;
  setSelectedFleet: (id: string | null) => void;
  
  // Data
  systems: StarSystem[];
  anomalies: Anomaly[];
  fleets: Fleet[];
  
  // UI state
  showFleets: boolean;
  showAnomalies: boolean;
  showLabels: boolean;
  toggleFleets: () => void;
  toggleAnomalies: () => void;
  toggleLabels: () => void;
  
  // Info panel
  infoPanelData: InfoPanelData | null;
  setInfoPanelData: (data: InfoPanelData | null) => void;
  
  // Timeline
  currentYear: number; // Default ~4000 BBY
  
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

  // Custom planet creation
  placementMode: boolean;
  pendingCustomPlanet: { name: string; color: string } | null;
  setPlacementMode: (mode: boolean, pending?: { name: string; color: string } | null) => void;
  addCustomSystem: (system: StarSystem) => void;
  removeCustomSystem: (id: string) => void;
  updateCustomSystemPosition: (id: string, position: THREE.Vector3) => void;
  draggingCustomPlanet: boolean;
  setDraggingCustomPlanet: (dragging: boolean) => void;

  // Custom fleet creation
  fleetPlacementMode: boolean;
  pendingCustomFleet: { name: string; faction: Faction; shipCount: number } | null;
  setFleetPlacementMode: (mode: boolean, pending?: { name: string; faction: Faction; shipCount: number } | null) => void;
  addCustomFleet: (fleet: Fleet) => void;
  removeCustomFleet: (id: string) => void;
  updateCustomFleetPosition: (id: string, position: THREE.Vector3) => void;
  draggingCustomFleet: boolean;
  setDraggingCustomFleet: (dragging: boolean) => void;
}
