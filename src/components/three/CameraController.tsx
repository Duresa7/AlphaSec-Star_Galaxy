import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyStore } from '@/store/galaxyStore';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Camera distances for different view modes
const CAMERA_CONFIG = {
  galaxy: {
    distance: 120,
    height: 60,
    minDistance: 0.5,
    maxDistance: 500,
    panSpeed: 1.0,
  },
  system: {
    distance: 25,
    height: 15,
    minDistance: 0.3,
    maxDistance: 150,
    panSpeed: 0.5,
  },
  planet: {
    distance: 5,
    height: 2,
    minDistance: 0.1,
    maxDistance: 50,
    panSpeed: 0.3,
  },
};

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  
  const { viewMode, selectedSystemId, selectedPlanetId, systems } = useGalaxyStore();
  
  // Target position for camera animation
  const targetPosition = useRef(new THREE.Vector3(0, 60, 120));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);
  
  // Update camera target when selection changes
  useEffect(() => {
    isAnimating.current = true;
    
    const config = CAMERA_CONFIG[viewMode];
    
    if (viewMode === 'galaxy') {
      targetPosition.current.set(0, config.height, config.distance);
      targetLookAt.current.set(0, 0, 0);
    } else if (viewMode === 'system' && selectedSystemId) {
      const system = systems.find(s => s.id === selectedSystemId);
      if (system) {
        // Position camera relative to system
        targetLookAt.current.copy(system.position);
        targetPosition.current.set(
          system.position.x + config.distance * 0.3,
          system.position.y + config.height,
          system.position.z + config.distance
        );
      }
    } else if (viewMode === 'planet' && selectedSystemId && selectedPlanetId) {
      const system = systems.find(s => s.id === selectedSystemId);
      if (system) {
        // For planet view, position camera closer
        targetLookAt.current.copy(system.position);
        targetPosition.current.set(
          system.position.x + config.distance * 0.5,
          system.position.y + config.height,
          system.position.z + config.distance
        );
      }
    }
    
    // Update controls limits based on view mode
    if (controlsRef.current) {
      controlsRef.current.minDistance = config.minDistance;
      controlsRef.current.maxDistance = config.maxDistance;
    }
    
    // Stop animation after transition
    const timer = setTimeout(() => {
      isAnimating.current = false;
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [viewMode, selectedSystemId, selectedPlanetId, systems]);
  
  // Smooth camera animation
  useFrame(() => {
    if (controlsRef.current) {
      // Lerp the controls target
      const lerpFactor = isAnimating.current ? 0.03 : 0.1;
      controlsRef.current.target.lerp(targetLookAt.current, lerpFactor);
      
      // Lerp camera position during transitions
      if (isAnimating.current) {
        camera.position.lerp(targetPosition.current, lerpFactor);
      }
      
      controlsRef.current.update();
    }
  });
  
  const config = CAMERA_CONFIG[viewMode];
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={config.minDistance}
      maxDistance={config.maxDistance}
      enablePan={true}
      panSpeed={config.panSpeed}
      rotateSpeed={0.4}
      zoomSpeed={0.9}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  );
}
