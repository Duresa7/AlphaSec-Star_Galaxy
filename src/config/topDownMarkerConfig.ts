import type { StarSystem } from '@/types';

export const DRAG_THRESHOLD_PX = 2;
export const SINGLE_CLICK_DELAY_MS = 220;
export const TOPDOWN_MARKER_MIN_SIZE = 0.5;
export const TOPDOWN_MARKER_MAX_SIZE = 6;

export const DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE = 1.8;
export const DEFAULT_TOPDOWN_FLEET_MARKER_SIZE = 2.2;

export const TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE: Record<StarSystem['importance'], number> = {
  capital: 3.5,
  major: 2.5,
  minor: 1.8,
  outpost: 1.2,
};
