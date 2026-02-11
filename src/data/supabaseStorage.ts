import * as THREE from 'three';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { StarSystem, Fleet, Faction, Planet, AuditAction, AuditLogEntry, UserProfile } from '@/types';

const AUTH_LOOKUP_TIMEOUT_MS = 8_000;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

const getAuthenticatedUserId = async (): Promise<string | null> => {
  if (!supabaseConfigured) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_LOOKUP_TIMEOUT_MS,
      'Auth user lookup timed out.',
    );
    if (error) {
      console.error('Failed to resolve auth user:', error);
      return null;
    }
    return data.user?.id ?? null;
  } catch (error) {
    console.error('Failed to resolve auth user:', error);
    return null;
  }
};

// ─── Serialize / Deserialize helpers ────────────

interface DbSystem {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  custom_color: string | null;
  marker_size: number | null;
  planets: DbPlanet[];
  created_by: string | null;
}

interface DbPlanet {
  id: string;
  name: string;
  type: string;
  radius: number;
  faction: Faction;
  description: string;
  population?: string;
  climate?: string;
  terrain?: string;
  notable?: string[];
  factionControl?: Partial<Record<Faction, number>>;
}

interface DbFleet {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  faction: Faction;
  ship_count: number;
  marker_size: number | null;
  created_by: string | null;
}

function dbToSystem(row: DbSystem): StarSystem {
  const planets: Planet[] = Array.isArray(row.planets) && row.planets.length > 0
    ? row.planets.map((p, i) => ({
        id: p.id || `${row.id}${i === 0 ? '-prime' : `-planet-${i + 1}`}`,
        name: p.name || row.name,
        type: (p.type || 'terrestrial') as Planet['type'],
        position: new THREE.Vector3(0, 0, 0),
        radius: typeof p.radius === 'number' ? p.radius : 1,
        faction: p.faction || 'neutral',
        description: p.description || `Custom planet: ${p.name || row.name}`,
        population: p.population,
        climate: p.climate,
        terrain: p.terrain,
        notable: p.notable,
        systemId: row.id,
        factionControl: p.factionControl,
      }))
    : [{
        id: `${row.id}-prime`,
        name: row.name,
        type: 'terrestrial' as const,
        position: new THREE.Vector3(0, 0, 0),
        radius: 1,
        faction: 'neutral' as const,
        description: `Custom planet: ${row.name}`,
        systemId: row.id,
      }];

  return {
    id: row.id,
    name: row.name,
    position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
    faction: planets[0]?.faction || 'neutral',
    starType: 'white',
    importance: 'minor',
    description: planets[0]?.description || `Custom planet: ${row.name}`,
    region: 'unknown_regions',
    isCustom: true,
    customColor: row.custom_color || '#FFFFFF',
    markerSize: row.marker_size ?? undefined,
    planets,
  };
}

function dbToFleet(row: DbFleet): Fleet {
  return {
    id: row.id,
    name: row.name,
    position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
    faction: row.faction,
    shipCount: row.ship_count,
    markerSize: row.marker_size ?? undefined,
    isCustom: true,
  };
}

// ─── CRUD: Custom Systems ───────────────────────

export async function loadCustomSystems(): Promise<StarSystem[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from('custom_systems')
    .select('*');
  if (error) {
    console.error('Failed to load custom systems:', error);
    return [];
  }
  return (data as DbSystem[]).map(dbToSystem);
}

export async function insertCustomSystem(system: StarSystem, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_systems').insert({
    id: system.id,
    name: system.name,
    position_x: system.position.x,
    position_y: system.position.y,
    position_z: system.position.z,
    custom_color: system.customColor || null,
    marker_size: system.markerSize ?? null,
    planets: system.planets.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      radius: p.radius,
      faction: p.faction,
      description: p.description,
      population: p.population,
      climate: p.climate,
      terrain: p.terrain,
      notable: p.notable,
      factionControl: p.factionControl,
    })),
    created_by: userId,
  });
  if (error) console.error('Failed to insert custom system:', error);
}

export async function upsertSystem(system: StarSystem, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_systems').upsert({
    id: system.id,
    name: system.name,
    position_x: system.position.x,
    position_y: system.position.y,
    position_z: system.position.z,
    custom_color: system.customColor || null,
    marker_size: system.markerSize ?? null,
    planets: system.planets.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      radius: p.radius,
      faction: p.faction,
      description: p.description,
      population: p.population,
      climate: p.climate,
      terrain: p.terrain,
      notable: p.notable,
      factionControl: p.factionControl,
    })),
    created_by: userId,
  }, { onConflict: 'id' });
  if (error) console.error('Failed to upsert system:', error);
}

export async function deleteCustomSystem(id: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_systems').delete().eq('id', id);
  if (error) console.error('Failed to delete custom system:', error);
}

// ─── CRUD: Custom Fleets ────────────────────────

export async function loadCustomFleets(): Promise<Fleet[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from('custom_fleets')
    .select('*');
  if (error) {
    console.error('Failed to load custom fleets:', error);
    return [];
  }
  return (data as DbFleet[]).map(dbToFleet);
}

export async function insertCustomFleet(fleet: Fleet, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_fleets').insert({
    id: fleet.id,
    name: fleet.name,
    position_x: fleet.position.x,
    position_y: fleet.position.y,
    position_z: fleet.position.z,
    faction: fleet.faction,
    ship_count: fleet.shipCount,
    marker_size: fleet.markerSize ?? null,
    created_by: userId,
  });
  if (error) console.error('Failed to insert custom fleet:', error);
}

export async function upsertFleet(fleet: Fleet, userId: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_fleets').upsert({
    id: fleet.id,
    name: fleet.name,
    position_x: fleet.position.x,
    position_y: fleet.position.y,
    position_z: fleet.position.z,
    faction: fleet.faction,
    ship_count: fleet.shipCount,
    marker_size: fleet.markerSize ?? null,
    created_by: userId,
  }, { onConflict: 'id' });
  if (error) console.error('Failed to upsert fleet:', error);
}

export async function deleteCustomFleet(id: string): Promise<void> {
  if (!supabaseConfigured) return;
  const { error } = await supabase.from('custom_fleets').delete().eq('id', id);
  if (error) console.error('Failed to delete custom fleet:', error);
}

// ─── App Settings (global key/value) ────────────

export async function loadSetting(key: string): Promise<unknown> {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error) {
    console.error(`Failed to load setting "${key}":`, error);
    return null;
  }
  return data?.value ?? null;
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  if (!supabaseConfigured) return;
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from('app_settings')
    .update({ value: value as never, updated_by: userId })
    .eq('key', key);
  if (error) console.error(`Failed to update setting "${key}":`, error);
}

// ─── Audit Logging ──────────────────────────────

export async function logAction(
  action: AuditAction,
  entityType: 'system' | 'fleet' | 'user',
  entityId: string,
  entityName: string,
  details?: Record<string, unknown>,
): Promise<void> {
  if (!supabaseConfigured) return;
  const userId = await getAuthenticatedUserId();
  if (!userId) return;
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details: details ?? null,
  });
  if (error) console.error('Failed to log audit action:', error);
}

export async function fetchAuditLogs(limit = 50, offset = 0): Promise<{ logs: AuditLogEntry[]; total: number }> {
  if (!supabaseConfigured) return { logs: [], total: 0 };
  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_user_id_fkey(display_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    return { logs: [], total: 0 };
  }

  const logs: AuditLogEntry[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as number,
    user_id: row.user_id as string,
    action: row.action as AuditAction,
    entity_type: row.entity_type as 'system' | 'fleet' | 'user',
    entity_id: row.entity_id as string,
    entity_name: row.entity_name as string,
    details: row.details as Record<string, unknown> | null,
    created_at: row.created_at as string,
    display_name: (row.profiles as Record<string, unknown> | null)?.display_name as string | undefined,
  }));

  return { logs, total: count ?? 0 };
}

// ─── User Management ────────────────────────────

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch profiles:', error);
    return [];
  }
  return data as UserProfile[];
}

export async function updateUserRole(userId: string, role: 'user' | 'admin' | 'bossman'): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}
