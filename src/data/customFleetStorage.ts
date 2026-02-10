import * as THREE from 'three';
import type { Fleet } from '@/types';

const STORAGE_KEY = 'star-wars-custom-fleets';

interface SerializedCustomFleet {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  faction: 'sith_empire' | 'galactic_republic' | 'neutral' | 'contested' | 'hutt_cartel';
  shipCount: number;
  markerSize?: number;
  isCustom: boolean;
}

export function loadCustomFleets(): Fleet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: SerializedCustomFleet[] = JSON.parse(raw);
    return data.map(f => ({
      id: f.id,
      name: f.name,
      position: new THREE.Vector3(f.position.x, f.position.y, f.position.z),
      faction: f.faction,
      shipCount: f.shipCount,
      markerSize: typeof f.markerSize === 'number' ? f.markerSize : undefined,
      isCustom: true,
    }));
  } catch {
    return [];
  }
}

export function saveCustomFleets(fleets: Fleet[]): void {
  const customFleets = fleets.filter(f => f.isCustom);
  const data: SerializedCustomFleet[] = customFleets.map(f => ({
    id: f.id,
    name: f.name,
    position: { x: f.position.x, y: f.position.y, z: f.position.z },
    faction: f.faction,
    shipCount: f.shipCount || 10,
    markerSize: f.markerSize,
    isCustom: true,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
