import type { Faction } from '@/types';

export const FACTION_LABELS: Record<Faction, string> = {
  sith_empire: 'Sith Empire',
  galactic_republic: 'Galactic Republic',
  neutral: 'Neutral',
  contested: 'Contested',
  hutt_cartel: 'Hutt Cartel',
};

/** Marker / icon colors used on the top-down map and fleet markers. */
export const FACTION_MARKER_COLORS: Record<Faction, string> = {
  sith_empire: '#DC143C',
  galactic_republic: '#FFD700',
  neutral: '#808080',
  contested: '#FF8C00',
  hutt_cartel: '#8B9A46',
};

/** Bar / UI accent colors used in info panels and control overlays. */
export const FACTION_BAR_COLORS: Record<Faction, string> = {
  galactic_republic: '#C8AA6E',
  sith_empire: '#DC143C',
  hutt_cartel: '#8B9A46',
  neutral: '#808080',
  contested: '#FF8C00',
};

/** Tailwind text-color classes for faction names. */
export const FACTION_TEXT_CLASSES: Record<Faction, string> = {
  sith_empire: 'text-red-500',
  galactic_republic: 'text-yellow-400',
  neutral: 'text-gray-400',
  contested: 'text-orange-400',
  hutt_cartel: 'text-green-500',
};

/** Config used in the Galaxy Overview stats section. */
export const FACTION_STAT_CONFIG: { key: Faction; label: string; color: string }[] = [
  { key: 'galactic_republic', label: 'Republic', color: '#C8AA6E' },
  { key: 'sith_empire', label: 'Sith Empire', color: '#DC143C' },
  { key: 'hutt_cartel', label: 'Hutt Cartel', color: '#8B9A46' },
  { key: 'neutral', label: 'Neutral', color: '#9E9E9E' },
  { key: 'contested', label: 'Contested', color: '#FFA726' },
];

/** Fleet strength thresholds for display labels. */
export const FLEET_STRENGTH_SEGMENTS = 10;
export const FLEET_STRENGTH_DIVISOR = 20;
export const FLEET_STRENGTH_LIGHT_THRESHOLD = 50;
export const FLEET_STRENGTH_HEAVY_THRESHOLD = 100;
