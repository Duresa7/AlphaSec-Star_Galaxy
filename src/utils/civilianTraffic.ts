import * as THREE from 'three';

export interface RouteAnchor {
  id: string;
  position: THREE.Vector3;
}

export interface DensitySettings {
  minConcurrent: number;
  targetConcurrent: number;
  maxConcurrent: number;
}

export interface CivilianTrafficSettings extends DensitySettings {
  trailLength: number;
  minSystemDistance: number;
  minCurvature: number;
  maxCurvature: number;
  minDurationSec: number;
  maxDurationSec: number;
}

export interface CivilianRoute {
  originId: string;
  destinationId: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  distance: number;
  speed: number;
}

export interface RouteSelection {
  origin: RouteAnchor;
  destination: RouteAnchor;
}

export interface CreateCivilianRouteOptions {
  minCurvature?: number;
  maxCurvature?: number;
  minDurationSec?: number;
  maxDurationSec?: number;
  rng?: () => number;
}

export const DEFAULT_CIVILIAN_TRAFFIC_SETTINGS: CivilianTrafficSettings = {
  minConcurrent: 20,
  targetConcurrent: 28,
  maxConcurrent: 35,
  trailLength: 12,
  minSystemDistance: 24,
  minCurvature: 0.12,
  maxCurvature: 0.35,
  minDurationSec: 14,
  maxDurationSec: 30,
};

const DEFAULT_EPSILON = 1e-6;

export const calculateDensityPlan = (
  currentCount: number,
  settings: DensitySettings = DEFAULT_CIVILIAN_TRAFFIC_SETTINGS,
): { spawnCount: number; trimCount: number } => {
  if (currentCount > settings.maxConcurrent) {
    return {
      spawnCount: 0,
      trimCount: Math.max(0, currentCount - settings.targetConcurrent),
    };
  }

  if (currentCount < settings.targetConcurrent) {
    return {
      spawnCount: Math.max(0, settings.targetConcurrent - currentCount),
      trimCount: 0,
    };
  }

  return { spawnCount: 0, trimCount: 0 };
};

export const selectRouteEndpoints = (
  systems: readonly RouteAnchor[],
  minDistance: number,
  rng: () => number = Math.random,
): RouteSelection | null => {
  if (systems.length < 2) return null;

  const viablePairs: Array<[RouteAnchor, RouteAnchor]> = [];
  for (let i = 0; i < systems.length - 1; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      if (systems[i].position.distanceTo(systems[j].position) >= minDistance) {
        viablePairs.push([systems[i], systems[j]]);
      }
    }
  }

  if (viablePairs.length > 0) {
    const [a, b] = viablePairs[Math.floor(rng() * viablePairs.length)];
    return rng() > 0.5 ? { origin: a, destination: b } : { origin: b, destination: a };
  }

  const originIndex = Math.floor(rng() * systems.length);
  let destinationIndex = Math.floor(rng() * (systems.length - 1));
  if (destinationIndex >= originIndex) destinationIndex += 1;
  return {
    origin: systems[originIndex],
    destination: systems[destinationIndex],
  };
};

export const createArcControlPoint = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  minCurvature: number,
  maxCurvature: number,
  rng: () => number = Math.random,
): THREE.Vector3 => {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  const distance = Math.max(direction.length(), DEFAULT_EPSILON);

  const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
  if (perpendicular.lengthSq() <= DEFAULT_EPSILON) {
    perpendicular.set(1, 0, 0);
  } else {
    perpendicular.normalize();
  }

  const curvature = minCurvature + (maxCurvature - minCurvature) * rng();
  const signedOffset = distance * curvature * (rng() > 0.5 ? 1 : -1);
  midpoint.addScaledVector(perpendicular, signedOffset);
  midpoint.y = (start.y + end.y) * 0.5;
  return midpoint;
};

export const createCivilianRoute = (
  origin: RouteAnchor,
  destination: RouteAnchor,
  options: CreateCivilianRouteOptions = {},
): CivilianRoute => {
  const {
    minCurvature = DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.minCurvature,
    maxCurvature = DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxCurvature,
    minDurationSec = DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.minDurationSec,
    maxDurationSec = DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxDurationSec,
    rng = Math.random,
  } = options;

  const start = origin.position.clone();
  const end = destination.position.clone();
  const distance = Math.max(start.distanceTo(end), DEFAULT_EPSILON);
  const control = createArcControlPoint(start, end, minCurvature, maxCurvature, rng);
  const durationSec = minDurationSec + (maxDurationSec - minDurationSec) * rng();

  return {
    originId: origin.id,
    destinationId: destination.id,
    start,
    end,
    control,
    distance,
    speed: distance / Math.max(durationSec, DEFAULT_EPSILON),
  };
};

export const sampleQuadraticBezier = (
  start: THREE.Vector3,
  control: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 => {
  const clampedT = Math.min(1, Math.max(0, t));
  const invT = 1 - clampedT;
  out.set(
    invT * invT * start.x + 2 * invT * clampedT * control.x + clampedT * clampedT * end.x,
    invT * invT * start.y + 2 * invT * clampedT * control.y + clampedT * clampedT * end.y,
    invT * invT * start.z + 2 * invT * clampedT * control.z + clampedT * clampedT * end.z,
  );
  return out;
};

export const tangentQuadraticBezier = (
  start: THREE.Vector3,
  control: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 => {
  const clampedT = Math.min(1, Math.max(0, t));
  out.set(
    2 * (1 - clampedT) * (control.x - start.x) + 2 * clampedT * (end.x - control.x),
    2 * (1 - clampedT) * (control.y - start.y) + 2 * clampedT * (end.y - control.y),
    2 * (1 - clampedT) * (control.z - start.z) + 2 * clampedT * (end.z - control.z),
  );
  return out.normalize();
};

export const advanceShipProgress = (
  progress: number,
  deltaSec: number,
  speed: number,
  routeDistance: number,
): number => {
  const progressDelta = (speed * deltaSec) / Math.max(routeDistance, DEFAULT_EPSILON);
  return Math.min(1, progress + progressDelta);
};

export const appendTrailPoint = (
  trail: readonly THREE.Vector3[],
  nextPoint: THREE.Vector3,
  maxLength: number,
): THREE.Vector3[] => {
  const nextTrail = [...trail, nextPoint.clone()];
  if (nextTrail.length <= maxLength) return nextTrail;
  return nextTrail.slice(nextTrail.length - maxLength);
};
