import * as THREE from 'three';
import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/types/database';
import type { Faction, Fleet, Planet, PlanetType, StarSystem } from '@/types';

export type MapActionType =
  | 'system_create'
  | 'system_delete'
  | 'system_move'
  | 'fleet_create'
  | 'fleet_delete'
  | 'fleet_move'
  | 'planet_stats_update';

export type VectorSnapshot = { x: number; y: number; z: number };

export interface PlanetStatsSnapshot {
  population: string | null;
  factionControl: Partial<Record<Faction, number>> | null;
  description: string | null;
  climate: string | null;
  terrain: string | null;
  notable: string[] | null;
}

export interface SerializablePlanet {
  id: string;
  name: string;
  type: PlanetType;
  position: VectorSnapshot;
  radius: number;
  faction: Faction;
  description: string;
  population: string | null;
  climate: string | null;
  terrain: string | null;
  notable: string[] | null;
  systemId: string;
  factionControl: Partial<Record<Faction, number>> | null;
}

export interface SerializableSystem {
  id: string;
  name: string;
  position: VectorSnapshot;
  faction: Faction;
  planets: SerializablePlanet[];
  starType: 'yellow' | 'red' | 'blue' | 'white' | 'binary';
  importance: 'capital' | 'major' | 'minor' | 'outpost';
  description: string;
  region:
    | 'deep_core'
    | 'core_worlds'
    | 'colonies'
    | 'inner_rim'
    | 'expansion_region'
    | 'mid_rim'
    | 'outer_rim'
    | 'unknown_regions';
  isCustom?: boolean;
  customColor?: string;
  markerSize?: number;
}

export interface SerializableFleet {
  id: string;
  name: string;
  faction: Faction;
  position: VectorSnapshot;
  shipCount: number;
  flagship?: string;
  commander?: string;
  systemId?: string;
  isCustom?: boolean;
}

export type MapActionPayload =
  | { system: SerializableSystem }
  | { id: string }
  | { id: string; position: VectorSnapshot }
  | { fleet: SerializableFleet }
  | { systemId: string; planetId: string; stats: PlanetStatsSnapshot };

type ActionHistoryRow = Database['public']['Tables']['action_history']['Row'];

export interface ActionRecord {
  id: number;
  actionType: MapActionType;
  doPayload: MapActionPayload;
  undoPayload: MapActionPayload;
  actorId: string;
  undoneAt: string | null;
  discarded: boolean;
  createdAt: string;
}

async function getAuthUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function toActionRecord(row: ActionHistoryRow): ActionRecord {
  return {
    id: row.id,
    actionType: row.action_type as MapActionType,
    doPayload: row.do_payload as unknown as MapActionPayload,
    undoPayload: row.undo_payload as unknown as MapActionPayload,
    actorId: row.actor_id,
    undoneAt: row.undone_at,
    discarded: row.discarded,
    createdAt: row.created_at,
  };
}

export async function recordMapAction(
  actionType: MapActionType,
  doPayload: MapActionPayload,
  undoPayload: MapActionPayload,
): Promise<void> {
  const actorId = await getAuthUserId();
  const { error } = await supabase.from('action_history').insert({
    action_type: actionType,
    do_payload: doPayload as unknown as Json,
    undo_payload: undoPayload as unknown as Json,
    actor_id: actorId,
  });
  if (error) {
    console.error('Failed to record action history:', error);
  }
}

export async function fetchUndoRedoAvailability(): Promise<{ canUndo: boolean; canRedo: boolean }> {
  const [{ data: undoData, error: undoError }, { data: redoData, error: redoError }] = await Promise.all([
    supabase
      .from('action_history')
      .select('id')
      .eq('discarded', false)
      .is('undone_at', null)
      .order('id', { ascending: false })
      .limit(1),
    supabase
      .from('action_history')
      .select('id')
      .eq('discarded', false)
      .not('undone_at', 'is', null)
      .order('undone_at', { ascending: false })
      .limit(1),
  ]);

  if (undoError) console.error('Failed to query undo availability:', undoError);
  if (redoError) console.error('Failed to query redo availability:', redoError);

  return {
    canUndo: Boolean(undoData && undoData.length > 0),
    canRedo: Boolean(redoData && redoData.length > 0),
  };
}

export async function fetchLatestUndoAction(): Promise<ActionRecord | null> {
  const { data, error } = await supabase
    .from('action_history')
    .select('*')
    .eq('discarded', false)
    .is('undone_at', null)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch undo action:', error);
    return null;
  }

  if (!data) return null;
  return toActionRecord(data as ActionHistoryRow);
}

export async function fetchLatestRedoAction(): Promise<ActionRecord | null> {
  const { data, error } = await supabase
    .from('action_history')
    .select('*')
    .eq('discarded', false)
    .not('undone_at', 'is', null)
    .order('undone_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch redo action:', error);
    return null;
  }

  if (!data) return null;
  return toActionRecord(data as ActionHistoryRow);
}

export async function markActionUndone(actionId: number, undone: boolean): Promise<void> {
  const actorId = await getAuthUserId();
  const { error } = await supabase
    .from('action_history')
    .update({
      undone_at: undone ? new Date().toISOString() : null,
      undone_by: undone ? actorId : null,
    })
    .eq('id', actionId);

  if (error) {
    console.error('Failed to update action undone state:', error);
  }
}

export const serializeVector = (v: THREE.Vector3): VectorSnapshot => ({ x: v.x, y: v.y, z: v.z });
export const deserializeVector = (v: VectorSnapshot): THREE.Vector3 => new THREE.Vector3(v.x, v.y, v.z);

export function serializePlanet(planet: Planet): SerializablePlanet {
  return {
    id: planet.id,
    name: planet.name,
    type: planet.type,
    position: serializeVector(planet.position),
    radius: planet.radius,
    faction: planet.faction,
    description: planet.description,
    population: planet.population ?? null,
    climate: planet.climate ?? null,
    terrain: planet.terrain ?? null,
    notable: planet.notable ?? null,
    systemId: planet.systemId,
    factionControl: planet.factionControl ?? null,
  };
}

export function deserializePlanet(planet: SerializablePlanet): Planet {
  return {
    id: planet.id,
    name: planet.name,
    type: planet.type,
    position: deserializeVector(planet.position),
    radius: planet.radius,
    faction: planet.faction,
    description: planet.description,
    population: planet.population ?? undefined,
    climate: planet.climate ?? undefined,
    terrain: planet.terrain ?? undefined,
    notable: planet.notable ?? undefined,
    systemId: planet.systemId,
    factionControl: planet.factionControl ?? undefined,
  };
}

export function serializeSystem(system: StarSystem): SerializableSystem {
  return {
    id: system.id,
    name: system.name,
    position: serializeVector(system.position),
    faction: system.faction,
    planets: system.planets.map(serializePlanet),
    starType: system.starType,
    importance: system.importance,
    description: system.description,
    region: system.region,
    isCustom: system.isCustom,
    customColor: system.customColor,
    markerSize: system.markerSize,
  };
}

export function deserializeSystem(system: SerializableSystem): StarSystem {
  return {
    id: system.id,
    name: system.name,
    position: deserializeVector(system.position),
    faction: system.faction,
    planets: system.planets.map(deserializePlanet),
    starType: system.starType,
    importance: system.importance,
    description: system.description,
    region: system.region,
    isCustom: system.isCustom,
    customColor: system.customColor,
    markerSize: system.markerSize,
  };
}

export function serializeFleet(fleet: Fleet): SerializableFleet {
  return {
    id: fleet.id,
    name: fleet.name,
    faction: fleet.faction,
    position: serializeVector(fleet.position),
    shipCount: fleet.shipCount,
    flagship: fleet.flagship,
    commander: fleet.commander,
    systemId: fleet.systemId,
    isCustom: fleet.isCustom,
  };
}

export function deserializeFleet(fleet: SerializableFleet): Fleet {
  return {
    id: fleet.id,
    name: fleet.name,
    faction: fleet.faction,
    position: deserializeVector(fleet.position),
    shipCount: fleet.shipCount,
    flagship: fleet.flagship,
    commander: fleet.commander,
    systemId: fleet.systemId,
    isCustom: fleet.isCustom,
  };
}

export const toStatsSnapshot = (planet: Planet): PlanetStatsSnapshot => ({
  population: planet.population ?? null,
  factionControl: planet.factionControl ?? null,
  description: planet.description ?? null,
  climate: planet.climate ?? null,
  terrain: planet.terrain ?? null,
  notable: planet.notable ?? null,
});

export function subscribeToActionHistory(onChanged: () => void) {
  const channel = supabase
    .channel('action-history-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'action_history' }, () => {
      onChanged();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
