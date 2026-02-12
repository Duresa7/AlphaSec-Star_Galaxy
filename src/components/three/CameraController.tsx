import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyStore } from '@/store/galaxyStore';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { shouldRecenterTopdown } from '@/components/three/cameraTransition';
const CAMERA_CONFIG = {
  topdown: {
    distance: 100,
    height: 70,
    minDistance: 30,
    maxDistance: 150,
    panSpeed: 1.5,
    rotateSpeed: 0,
    enableRotate: false,
  },
  system: {
    distance: 20,
    height: 10,
    minDistance: 3,
    maxDistance: 80,
    panSpeed: 0.5,
    rotateSpeed: 0.5,
    enableRotate: true,
  },
  fleet: {
    distance: 12,
    height: 4,
    minDistance: 3,
    maxDistance: 40,
    panSpeed: 0.5,
    rotateSpeed: 0.5,
    enableRotate: true,
  },
};

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const { viewMode, selectedSystemId, selectedPlanetId, selectedFleetId, systems, fleets, draggingCustomPlanet, draggingCustomFleet } = useGalaxyStore();
  const previousViewModeRef = useRef<'topdown' | 'system' | 'fleet' | null>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 60, 120));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);
  useEffect(() => {
    const config = CAMERA_CONFIG[viewMode] || CAMERA_CONFIG.system;
    const previousViewMode = previousViewModeRef.current;
    previousViewModeRef.current = viewMode;
    const shouldRecenter = shouldRecenterTopdown(viewMode, previousViewMode);
    if (!shouldRecenter && viewMode === 'topdown') {
      isAnimating.current = false;
      camera.position.y = CAMERA_CONFIG.topdown.height;
      return;
    }

    isAnimating.current = true;

    if (viewMode === 'topdown') {
      targetPosition.current.set(0, config.height, 0);
      targetLookAt.current.set(0, 0, 0);
    } else if (viewMode === 'system' && selectedSystemId) {
      const system = systems.find(s => s.id === selectedSystemId);
      if (system) {
        targetLookAt.current.copy(system.position);
        targetPosition.current.set(
          system.position.x + config.distance * 0.5,
          system.position.y + config.height,
          system.position.z + config.distance
        );
      }
    } else if (viewMode === 'fleet' && selectedFleetId) {
      const fleet = fleets.find(f => f.id === selectedFleetId);
      if (fleet) {
        targetLookAt.current.copy(fleet.position);
        targetPosition.current.set(
          fleet.position.x + config.distance * 0.5,
          fleet.position.y + config.height,
          fleet.position.z + config.distance
        );
      }
    }
    if (controlsRef.current) {
      controlsRef.current.minDistance = config.minDistance;
      controlsRef.current.maxDistance = config.maxDistance;
      controlsRef.current.enableRotate = config.enableRotate;
      controlsRef.current.rotateSpeed = config.rotateSpeed;
      if (viewMode === 'topdown') {
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.maxPolarAngle = Math.PI / 6;
      } else {
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.maxPolarAngle = Math.PI;
      }
    }
    const timer = setTimeout(() => {
      isAnimating.current = false;
    }, 1500);

    return () => clearTimeout(timer);
  }, [viewMode, selectedSystemId, selectedPlanetId, selectedFleetId, systems, fleets]);
  useFrame(() => {
    if (controlsRef.current) {
      if (isAnimating.current) {
        const lerpFactor = 0.03;
        controlsRef.current.target.lerp(targetLookAt.current, lerpFactor);
        camera.position.lerp(targetPosition.current, lerpFactor);
      }
      else if (viewMode === 'topdown') {
        camera.position.y = CAMERA_CONFIG.topdown.height;
      }

      controlsRef.current.update();
    }
  });
  const config = CAMERA_CONFIG[viewMode] || CAMERA_CONFIG.system;

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={config.minDistance}
      maxDistance={config.maxDistance}
      enablePan={!draggingCustomPlanet && !draggingCustomFleet}
      panSpeed={config.panSpeed}
      screenSpacePanning={true}
      enableZoom={viewMode !== 'topdown'}
      enableRotate={viewMode !== 'topdown'}
      rotateSpeed={viewMode === 'topdown' ? 0 : config.rotateSpeed}
      zoomSpeed={0.9}
      minPolarAngle={viewMode === 'topdown' ? 0 : 0}
      maxPolarAngle={viewMode === 'topdown' ? 0.001 : Math.PI}
      minAzimuthAngle={viewMode === 'topdown' ? 0 : -Infinity}
      maxAzimuthAngle={viewMode === 'topdown' ? 0 : Infinity}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: viewMode === 'topdown' ? undefined : THREE.MOUSE.DOLLY,
        RIGHT: viewMode === 'topdown' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      }}
    />
  );
}
