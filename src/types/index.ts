import * as THREE from 'three';
export type ViewMode = 'topdown' | 'system' | 'fleet';
export type Faction = 'sith_empire' | 'galactic_republic' | 'neutral' | 'contested' | 'hutt_cartel';
export type FactionFilters = Record<Faction, boolean>;
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
export type AnomalyType =
  | 'nebula'
  | 'black_hole'
  | 'space_station'
  | 'hyperspace_lane';
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
  nativeInhabitants?: string;
  systemId: string;
  factionControl?: Partial<Record<Faction, number>>;
  customColor?: string;
}
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
  markerSize?: number;
}
export type GalaxyRegion =
  | 'deep_core'
  | 'core_worlds'
  | 'colonies'
  | 'inner_rim'
  | 'expansion_region'
  | 'mid_rim'
  | 'outer_rim'
  | 'unknown_regions';
export interface Anomaly {
  id: string;
  name: string;
  type: AnomalyType;
  position: THREE.Vector3;
  radius: number;
  description: string;
}
export interface Fleet {
  id: string;
  name: string;
  faction: Faction;
  position: THREE.Vector3;
  shipCount: number;
  markerSize?: number;
  flagship?: string;
  commander?: string;
  systemId?: string;
  isCustom?: boolean;
}
export type InfoPanelData =
  | { type: 'system'; data: StarSystem }
  | { type: 'planet'; data: Planet }
  | { type: 'fleet'; data: Fleet }
  | { type: 'anomaly'; data: Anomaly };
export interface SearchResult {
  type: 'system' | 'planet' | 'fleet';
  id: string;
  name: string;
  parentName?: string;
  parentSystemId?: string;
}

export type UserRole = 'user' | 'admin' | 'bossman';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type AuditAction =
  | 'system_created'
  | 'system_moved'
  | 'system_deleted'
  | 'system_resized'
  | 'fleet_created'
  | 'fleet_moved'
  | 'fleet_deleted'
  | 'fleet_resized'
  | 'planet_stats_updated'
  | 'role_changed'
  | 'timeline_changed';

export interface AuditLogEntry {
  id: number;
  user_id: string;
  action: AuditAction;
  entity_type: 'system' | 'fleet' | 'user';
  entity_id: string;
  entity_name: string;
  details: Record<string, unknown> | null;
  created_at: string;
  display_name?: string;
}

export interface PlanetStatsUpdate {
  population?: string | null;
  factionControl?: Partial<Record<Faction, number>> | null;
  description?: string | null;
  climate?: string | null;
  terrain?: string | null;
  notable?: string[] | null;
  nativeInhabitants?: string | null;
  customColor?: string | null;
}
export interface GalaxyStore {
  viewMode: ViewMode;
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedFleetId: string | null;
  setSelectedSystem: (id: string | null) => void;
  setTopDownSelection: (systemId: string | null, planetId?: string | null) => void;
  setTopDownFleetSelection: (fleetId: string | null) => void;
  setSelectedPlanet: (id: string | null) => void;
  setSelectedFleet: (id: string | null) => void;
  systems: StarSystem[];
  anomalies: Anomaly[];
  fleets: Fleet[];
  showFleets: boolean;
  showAnomalies: boolean;
  showLabels: boolean;
  toggleFleets: () => void;
  toggleAnomalies: () => void;
  toggleLabels: () => void;
  infoPanelData: InfoPanelData | null;
  setInfoPanelData: (data: InfoPanelData | null) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  factionFilters: FactionFilters;
  toggleFactionFilter: (faction: Faction) => void;
  getFilteredSystems: () => StarSystem[];
  getSearchResults: () => SearchResult[];
  getFactionStats: () => Record<Faction, { planets: number; fleetShips: number }>;
  initializeData: () => Promise<void>;
  updatePlanetStats: (systemId: string, planetId: string, stats: PlanetStatsUpdate) => void;
  placementMode: boolean;
  pendingCustomPlanet: { name: string; color: string } | null;
  setPlacementMode: (mode: boolean, pending?: { name: string; color: string } | null) => void;
  addCustomSystem: (system: StarSystem) => void;
  removeCustomSystem: (id: string) => void;
  previewCustomSystemPosition: (id: string, position: THREE.Vector3) => void;
  updateCustomSystemPosition: (id: string, position: THREE.Vector3, previousPosition?: THREE.Vector3) => void;
  updateCustomSystemMarkerSize: (id: string, markerSize: number) => void;
  draggingCustomPlanet: boolean;
  setDraggingCustomPlanet: (dragging: boolean) => void;
  fleetPlacementMode: boolean;
  pendingCustomFleet: { name: string; faction: Faction; shipCount: number } | null;
  setFleetPlacementMode: (mode: boolean, pending?: { name: string; faction: Faction; shipCount: number } | null) => void;
  addCustomFleet: (fleet: Fleet) => void;
  removeCustomFleet: (id: string) => void;
  previewCustomFleetPosition: (id: string, position: THREE.Vector3) => void;
  updateCustomFleetPosition: (id: string, position: THREE.Vector3, previousPosition?: THREE.Vector3) => void;
  updateFleetMarkerSize: (id: string, markerSize: number) => void;
  draggingCustomFleet: boolean;
  setDraggingCustomFleet: (dragging: boolean) => void;
  dirtySystemIds: Set<string>;
  dirtyFleetIds: Set<string>;
  dirtyTimeline: boolean;
  hasPendingChanges: boolean;
  saveAllChanges: () => Promise<void>;
  discardAllChanges: () => Promise<void>;
}
