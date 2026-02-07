import * as THREE from 'three';
import { supabase } from '@/lib/supabase';
import type { StarSystem, Planet, Fleet, Faction, PlanetType } from '@/types';
import type { Database, Json } from '@/types/database';

type SystemRow = Database['public']['Tables']['custom_systems']['Row'];
type PlanetRow = Database['public']['Tables']['custom_planets']['Row'];
type FleetRow = Database['public']['Tables']['custom_fleets']['Row'];

// ─── Helpers ─────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ─── Row → App Model converters ──────────────────────

function planetRowToModel(row: PlanetRow): Planet {
  return {
    id: row.id,
    name: row.name,
    type: row.type as PlanetType,
    position: new THREE.Vector3(0, 0, 0),
    radius: row.radius,
    faction: row.faction as Faction,
    description: row.description || '',
    population: row.population || undefined,
    climate: row.climate || undefined,
    terrain: row.terrain || undefined,
    notable: row.notable || undefined,
    systemId: row.system_id,
    factionControl: row.faction_control as unknown as Partial<Record<Faction, number>> | undefined,
  };
}

export function systemRowToModel(row: SystemRow, planets: Planet[]): StarSystem {
  return {
    id: row.id,
    name: row.name,
    position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
    faction: (planets[0]?.faction as Faction) || 'neutral',
    starType: 'white',
    importance: 'minor',
    description: planets[0]?.description || `Custom planet: ${row.name}`,
    region: 'unknown_regions',
    isCustom: true,
    customColor: row.custom_color || '#FFFFFF',
    markerSize: row.marker_size || undefined,
    planets,
  };
}

export function fleetRowToModel(row: FleetRow): Fleet {
  return {
    id: row.id,
    name: row.name,
    faction: row.faction as Faction,
    position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
    shipCount: row.ship_count,
    flagship: row.flagship || undefined,
    commander: row.commander || undefined,
    isCustom: true,
  };
}

// ─── Custom Systems ──────────────────────────────────

export async function fetchCustomSystems(): Promise<StarSystem[]> {
  const { data: rawSystems, error: sysErr } = await supabase
    .from('custom_systems')
    .select('*')
    .order('created_at');

  if (sysErr) {
    console.error('Failed to fetch custom systems:', sysErr);
    return [];
  }

  const systemRows = (rawSystems || []) as unknown as SystemRow[];
  if (systemRows.length === 0) return [];

  const { data: rawPlanets, error: plnErr } = await supabase
    .from('custom_planets')
    .select('*');

  if (plnErr) {
    console.error('Failed to fetch custom planets:', plnErr);
  }

  const allPlanetRows = (rawPlanets || []) as unknown as PlanetRow[];

  const planetsBySystem = new Map<string, Planet[]>();
  for (const row of allPlanetRows) {
    const list = planetsBySystem.get(row.system_id) || [];
    list.push(planetRowToModel(row));
    planetsBySystem.set(row.system_id, list);
  }

  return systemRows.map((row) => {
    const planets = planetsBySystem.get(row.id) || [{
      id: `${row.id}-prime`,
      name: row.name,
      type: 'terrestrial' as PlanetType,
      position: new THREE.Vector3(0, 0, 0),
      radius: 1,
      faction: 'neutral' as Faction,
      description: `Custom planet: ${row.name}`,
      systemId: row.id,
    }];
    return systemRowToModel(row, planets);
  });
}

export async function insertCustomSystem(system: StarSystem): Promise<void> {
  const userId = await getAuthUserId();

  const { error: sysErr } = await supabase.from('custom_systems').insert({
    id: system.id,
    name: system.name,
    position_x: system.position.x,
    position_y: system.position.y,
    position_z: system.position.z,
    custom_color: system.customColor || '#FFFFFF',
    marker_size: system.markerSize || null,
    created_by: userId,
  });

  if (sysErr) {
    console.error('Failed to insert custom system:', sysErr);
    return;
  }

  // Insert planets
  for (const planet of system.planets) {
    const { error: plnErr } = await supabase.from('custom_planets').insert({
      id: planet.id,
      system_id: system.id,
      name: planet.name,
      type: planet.type,
      radius: planet.radius,
      faction: planet.faction,
      description: planet.description,
      population: planet.population || null,
      climate: planet.climate || null,
      terrain: planet.terrain || null,
      notable: planet.notable || null,
      faction_control: (planet.factionControl as unknown as Json) || null,
      created_by: userId,
    });

    if (plnErr) console.error('Failed to insert custom planet:', plnErr);
  }
}

export async function deleteCustomSystem(id: string): Promise<void> {
  // Cascade deletes custom_planets automatically
  const { error } = await supabase.from('custom_systems').delete().eq('id', id);
  if (error) console.error('Failed to delete custom system:', error);
}

export async function updateSystemPosition(id: string, x: number, z: number): Promise<void> {
  const { error } = await supabase
    .from('custom_systems')
    .update({ position_x: x, position_z: z })
    .eq('id', id);
  if (error) console.error('Failed to update system position:', error);
}

export async function updateSystemMarkerSize(id: string, markerSize: number): Promise<void> {
  const { error } = await supabase
    .from('custom_systems')
    .update({ marker_size: markerSize })
    .eq('id', id);
  if (error) console.error('Failed to update system marker size:', error);
}

// ─── Custom Fleets ───────────────────────────────────

export async function fetchCustomFleets(): Promise<Fleet[]> {
  const { data, error } = await supabase
    .from('custom_fleets')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('Failed to fetch custom fleets:', error);
    return [];
  }

  const fleetRows = (data || []) as unknown as FleetRow[];
  return fleetRows.map(fleetRowToModel);
}

export async function insertCustomFleet(fleet: Fleet): Promise<void> {
  const userId = await getAuthUserId();

  const { error } = await supabase.from('custom_fleets').insert({
    id: fleet.id,
    name: fleet.name,
    faction: fleet.faction,
    position_x: fleet.position.x,
    position_y: fleet.position.y,
    position_z: fleet.position.z,
    ship_count: fleet.shipCount,
    flagship: fleet.flagship || null,
    commander: fleet.commander || null,
    created_by: userId,
  });

  if (error) console.error('Failed to insert custom fleet:', error);
}

export async function deleteCustomFleet(id: string): Promise<void> {
  const { error } = await supabase.from('custom_fleets').delete().eq('id', id);
  if (error) console.error('Failed to delete custom fleet:', error);
}

export async function updateFleetPosition(id: string, x: number, z: number): Promise<void> {
  const { error } = await supabase
    .from('custom_fleets')
    .update({ position_x: x, position_z: z })
    .eq('id', id);
  if (error) console.error('Failed to update fleet position:', error);
}

// ─── Planet Stats Overrides (built-in planets) ───────

export interface PlanetStatsOverride {
  population?: string | null;
  factionControl?: Partial<Record<Faction, number>> | null;
  description?: string | null;
  climate?: string | null;
  terrain?: string | null;
  notable?: string[] | null;
}

export async function fetchPlanetStatsOverrides(): Promise<Map<string, PlanetStatsOverride>> {
  const { data, error } = await supabase.from('planet_stats_overrides').select('*');

  if (error) {
    console.error('Failed to fetch planet stats overrides:', error);
    return new Map();
  }

  type StatsRow = Database['public']['Tables']['planet_stats_overrides']['Row'];
  const rows = (data || []) as unknown as StatsRow[];
  const map = new Map<string, PlanetStatsOverride>();
  for (const row of rows) {
    map.set(row.planet_id, {
      population: row.population ?? undefined,
      factionControl: row.faction_control as unknown as Partial<Record<Faction, number>> | undefined,
      description: row.description ?? undefined,
      climate: row.climate ?? undefined,
      terrain: row.terrain ?? undefined,
      notable: row.notable ?? undefined,
    });
  }
  return map;
}

export async function upsertPlanetStats(
  planetId: string,
  systemId: string,
  stats: Partial<PlanetStatsOverride>,
): Promise<void> {
  const userId = await getAuthUserId();

  const { error } = await supabase.from('planet_stats_overrides').upsert({
    planet_id: planetId,
    system_id: systemId,
    population: stats.population,
    faction_control: stats.factionControl === undefined ? undefined : (stats.factionControl as unknown as Json),
    description: stats.description,
    climate: stats.climate,
    terrain: stats.terrain,
    notable: stats.notable,
    updated_by: userId,
  }, { onConflict: 'planet_id' });

  if (error) console.error('Failed to upsert planet stats:', error);
}

// ─── Custom Planet Updates (for custom system planets) ──

export async function updateCustomPlanetStats(
  planetId: string,
  stats: {
    population?: string | null;
    factionControl?: Partial<Record<Faction, number>> | null;
    description?: string | null;
    climate?: string | null;
    terrain?: string | null;
    notable?: string[] | null;
  },
): Promise<void> {
  const { error } = await supabase.from('custom_planets').update({
    population: stats.population,
    faction_control: stats.factionControl === undefined ? undefined : (stats.factionControl as unknown as Json),
    description: stats.description,
    climate: stats.climate,
    terrain: stats.terrain,
    notable: stats.notable,
  }).eq('id', planetId);

  if (error) console.error('Failed to update custom planet stats:', error);
}

// ─── Migration: localStorage → Supabase ──────────────

export async function migrateLocalStorageToSupabase(): Promise<void> {
  const { loadCustomSystems } = await import('@/data/customPlanetStorage');
  const { loadCustomFleets } = await import('@/data/customFleetStorage');

  const localSystems = loadCustomSystems();
  const localFleets = loadCustomFleets();

  if (localSystems.length === 0 && localFleets.length === 0) return;

  console.log(`Migrating ${localSystems.length} systems and ${localFleets.length} fleets from localStorage to Supabase...`);

  try {
    await Promise.all([
      ...localSystems.map((s) => insertCustomSystem(s)),
      ...localFleets.map((f) => insertCustomFleet(f)),
    ]);

    // Clear localStorage after successful migration
    localStorage.removeItem('star-wars-custom-planets');
    localStorage.removeItem('star-wars-custom-fleets');
    console.log('Migration complete. localStorage cleared.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}
