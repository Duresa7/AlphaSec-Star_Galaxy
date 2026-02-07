import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGalaxyStore } from '@/store/galaxyStore';
import { systemRowToModel, fleetRowToModel } from '@/data/supabaseStorage';
import type { Database } from '@/types/database';
import type { Faction, PlanetType, Planet } from '@/types';
import * as THREE from 'three';

type SystemRow = Database['public']['Tables']['custom_systems']['Row'];
type PlanetRow = Database['public']['Tables']['custom_planets']['Row'];
type FleetRow = Database['public']['Tables']['custom_fleets']['Row'];
type StatsRow = Database['public']['Tables']['planet_stats_overrides']['Row'];

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
    factionControl: row.faction_control as Partial<Record<Faction, number>> | undefined,
  };
}

export function useRealtimeSync() {
  useEffect(() => {
    const store = useGalaxyStore;

    const channel = supabase
      .channel('galaxy-realtime')
      // ── Custom Systems ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'custom_systems' },
        async (payload) => {
          const row = payload.new as SystemRow;
          // Avoid duplicating if we already have it (optimistic update)
          const state = store.getState();
          if (state.systems.some((s) => s.id === row.id)) return;

          // Fetch associated planets
          const { data: rawPlanets } = await supabase
            .from('custom_planets')
            .select('*')
            .eq('system_id', row.id);

          const typedPlanetRows = (rawPlanets || []) as unknown as PlanetRow[];
          const planets: Planet[] = typedPlanetRows.map(planetRowToModel);
          if (planets.length === 0) {
            planets.push({
              id: `${row.id}-prime`,
              name: row.name,
              type: 'terrestrial',
              position: new THREE.Vector3(0, 0, 0),
              radius: 1,
              faction: 'neutral',
              description: `Custom planet: ${row.name}`,
              systemId: row.id,
            });
          }

          store.getState().handleRemoteSystemInsert(systemRowToModel(row, planets));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'custom_systems' },
        (payload) => {
          const row = payload.new as SystemRow;
          store.getState().handleRemoteSystemUpdate(row.id, {
            position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
            customColor: row.custom_color || '#FFFFFF',
            markerSize: row.marker_size || undefined,
            name: row.name,
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'custom_systems' },
        (payload) => {
          const old = payload.old as { id: string };
          store.getState().handleRemoteSystemDelete(old.id);
        },
      )
      // ── Custom Fleets ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'custom_fleets' },
        (payload) => {
          const row = payload.new as FleetRow;
          const state = store.getState();
          if (state.fleets.some((f) => f.id === row.id)) return;
          store.getState().handleRemoteFleetInsert(fleetRowToModel(row));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'custom_fleets' },
        (payload) => {
          const row = payload.new as FleetRow;
          store.getState().handleRemoteFleetUpdate(row.id, {
            position: new THREE.Vector3(row.position_x, row.position_y, row.position_z),
            name: row.name,
            faction: row.faction as Faction,
            shipCount: row.ship_count,
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'custom_fleets' },
        (payload) => {
          const old = payload.old as { id: string };
          store.getState().handleRemoteFleetDelete(old.id);
        },
      )
      // ── Custom Planets (child updates) ──
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'custom_planets' },
        (payload) => {
          const row = payload.new as PlanetRow;
          store.getState().handleRemotePlanetStatsUpdate(row.id, {
            population: row.population || undefined,
            factionControl: row.faction_control as Partial<Record<Faction, number>> | undefined,
            description: row.description || undefined,
            climate: row.climate || undefined,
            terrain: row.terrain || undefined,
            notable: row.notable || undefined,
          });
        },
      )
      // ── Planet Stats Overrides (built-in planet edits) ──
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planet_stats_overrides' },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          const row = payload.new as StatsRow;
          store.getState().handleRemotePlanetStatsUpdate(row.planet_id, {
            population: row.population || undefined,
            factionControl: row.faction_control as Partial<Record<Faction, number>> | undefined,
            description: row.description || undefined,
            climate: row.climate || undefined,
            terrain: row.terrain || undefined,
            notable: row.notable || undefined,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
