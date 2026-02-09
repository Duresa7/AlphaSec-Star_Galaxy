import { useRef, useMemo, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural galaxy map for top-down view
function ProceduralGalaxyMap() {
  const galaxyRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  // Subtle rotation animation for the galaxy
  useFrame((state) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.02) * 0.01;
    }
    if (coreRef.current) {
      // Pulsing core glow
      const pulse = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });
  
  return (
    <group ref={galaxyRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      {/* Galactic Core - bright center */}
      <GalacticCore ref={coreRef} />
      
      {/* Outer Halo */}
      <OuterHalo />
      
      {/* Star Field particles */}
      <StarField />
      
      {/* Grid Overlay */}
      <GridOverlay />
    </group>
  );
}

// Bright galactic core with glow - scaled to match planet coords
const GalacticCore = forwardRef<THREE.Mesh>(function GalacticCore(_, ref) {
  return (
    <group>
      {/* Inner bright core */}
      <mesh>
        <circleGeometry args={[15, 64]} />
        <meshBasicMaterial 
          color="#FFFEF0" 
          transparent 
          opacity={0.4}
        />
      </mesh>
      
      {/* Core glow layer 1 - covers Coruscant area */}
      <mesh ref={ref}>
        <circleGeometry args={[30, 64]} />
        <meshBasicMaterial 
          color="#FFE4B5" 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Core glow layer 2 - mid core worlds */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[50, 64]} />
        <meshBasicMaterial 
          color="#87CEEB" 
          transparent 
          opacity={0.08}
        />
      </mesh>
    </group>
  );
});

// Outer galactic halo - scaled to match planet coords (up to ±90)
function OuterHalo() {
  return (
    <group>
      {/* Inner mid ring - covers most core/mid rim planets */}
      <mesh position={[0, 0, -0.3]}>
        <ringGeometry args={[50, 80, 64]} />
        <meshBasicMaterial 
          color="#1a2a3e"
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Mid ring - outer rim */}
      <mesh position={[0, 0, -0.4]}>
        <ringGeometry args={[80, 110, 64]} />
        <meshBasicMaterial 
          color="#0f1a2a"
          transparent 
          opacity={0.12}
        />
      </mesh>
      
      {/* Extended outer ring - far outer rim */}
      <mesh position={[0, 0, -0.5]}>
        <ringGeometry args={[110, 150, 64]} />
        <meshBasicMaterial 
          color="#0a1520"
          transparent 
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

// Star field background particles - optimized with Points
function StarField() {
  const count = 2000;
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radiusRand = Math.pow(Math.random(), 0.5);
        const radius = radiusRand * 250; 
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = (Math.random() - 0.5) * 5; // Slight depth variation
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Colors
        const color = new THREE.Color();
        const rand = Math.random();
        if (rand > 0.8) color.setHex(0xFFE4B5); 
        else if (rand > 0.5) color.setHex(0xFFFFFF); 
        else color.setHex(0xB8D4E8); 
        
        // Brightness
        const brightness = 0.5 + Math.random() * 0.5;
        color.multiplyScalar(brightness);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, []);

  return (
    <points position={[0, 0, -0.5]} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2.5} // Large enough to see
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

// X-Y Axis Grid Overlay for galactic coordinates
function GridOverlay() {
  const gridSpacing = 10; // Each grid line = 1 unit in SWTOR coords (scaled by 10)
  const gridRange = 20; // -20 to +20 range for a longer interactive grid span
  
  // Generate grid line objects
  const lineObjects = useMemo(() => {
    const objects: THREE.Line[] = [];
    
    // Vertical lines (parallel to Y axis)
    for (let x = -gridRange; x <= gridRange; x++) {
      const points = [
        new THREE.Vector3(x * gridSpacing, -gridRange * gridSpacing, 0),
        new THREE.Vector3(x * gridSpacing, gridRange * gridSpacing, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: x === 0 ? '#00FFFF' : '#00BFFF',
        transparent: true,
        opacity: x === 0 ? 0.3 : 0.08,
      });
      objects.push(new THREE.Line(geometry, material));
    }
    
    // Horizontal lines (parallel to X axis)
    for (let y = -gridRange; y <= gridRange; y++) {
      const points = [
        new THREE.Vector3(-gridRange * gridSpacing, y * gridSpacing, 0),
        new THREE.Vector3(gridRange * gridSpacing, y * gridSpacing, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: y === 0 ? '#00FFFF' : '#00BFFF',
        transparent: true,
        opacity: y === 0 ? 0.3 : 0.08,
      });
      objects.push(new THREE.Line(geometry, material));
    }
    
    return objects;
  }, []);
  
  return (
    <group position={[0, 0, 0.1]}>
      {/* Grid lines */}
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

// Placeholder for texture-based version - now redirects to procedural
export function GalaxyMapBackground() {
  return <ProceduralGalaxyMap />;
}