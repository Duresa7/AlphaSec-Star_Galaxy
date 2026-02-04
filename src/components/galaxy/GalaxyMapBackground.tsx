import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural galaxy map for top-down view
export function ProceduralGalaxyMap() {
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
const GalacticCore = ({ ref }: { ref?: React.RefObject<THREE.Mesh> }) => {
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
};

// Spiral arm structures
function SpiralArms() {
  const armCount = 4;
  const arms = useMemo(() => {
    const result = [];
    for (let i = 0; i < armCount; i++) {
      const angle = (Math.PI * 2 / armCount) * i;
      result.push({ angle, key: i });
    }
    return result;
  }, []);
  
  return (
    <group>
      {arms.map(({ angle, key }) => (
        <SpiralArm key={key} baseAngle={angle} />
      ))}
    </group>
  );
}

// Individual spiral arm
function SpiralArm({ baseAngle }: { baseAngle: number }) {
  const segments = 12;
  
  const particles = useMemo(() => {
    const points = [];
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const radius = 15 + t * 60;
      const spiralAngle = baseAngle + t * Math.PI * 0.8;
      
      // Main arm point
      const x = Math.cos(spiralAngle) * radius;
      const y = Math.sin(spiralAngle) * radius;
      
      // Add some scatter around the arm
      for (let j = 0; j < 8; j++) {
        const scatter = (Math.random() - 0.5) * (10 + t * 15);
        const scatterAngle = Math.random() * Math.PI * 2;
        points.push({
          x: x + Math.cos(scatterAngle) * scatter,
          y: y + Math.sin(scatterAngle) * scatter,
          size: 0.3 + Math.random() * 0.5,
          opacity: 0.3 + Math.random() * 0.4,
        });
      }
    }
    return points;
  }, [baseAngle]);
  
  return (
    <group>
      {/* Arm base glow */}
      {Array.from({ length: segments }).map((_, i) => {
        const t = i / segments;
        const radius = 15 + t * 60;
        const spiralAngle = baseAngle + t * Math.PI * 0.8;
        const x = Math.cos(spiralAngle) * radius;
        const y = Math.sin(spiralAngle) * radius;
        const size = 8 + t * 12;
        
        return (
          <mesh key={i} position={[x, y, -0.2]}>
            <circleGeometry args={[size, 16]} />
            <meshBasicMaterial 
              color="#4A7C99"
              transparent 
              opacity={0.06 - t * 0.03}
            />
          </mesh>
        );
      })}
      
      {/* Scattered star clusters in arm */}
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.1]}>
          <circleGeometry args={[p.size, 8]} />
          <meshBasicMaterial 
            color="#B8D4E8"
            transparent 
            opacity={p.opacity * 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

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

// Star field background particles - extended
function StarField() {
  const starCount = 800; // More stars for larger area
  
  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < starCount; i++) {
      // Distribute stars with more density toward center, but cover larger area
      const angle = Math.random() * Math.PI * 2;
      const radiusRand = Math.pow(Math.random(), 0.5);
      const radius = radiusRand * 180; // Extended from 100 to 180
      
      result.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 0.1 + Math.random() * 0.3,
        brightness: 0.2 + Math.random() * 0.6,
        color: Math.random() > 0.8 ? '#FFE4B5' : (Math.random() > 0.5 ? '#FFFFFF' : '#B8D4E8'),
      });
    }
    return result;
  }, []);
  
  return (
    <group position={[0, 0, -0.5]}>
      {stars.map((star, i) => (
        <mesh key={i} position={[star.x, star.y, 0]}>
          <circleGeometry args={[star.size, 6]} />
          <meshBasicMaterial 
            color={star.color}
            transparent 
            opacity={star.brightness}
          />
        </mesh>
      ))}
    </group>
  );
}

// X-Y Axis Grid Overlay for galactic coordinates
function GridOverlay() {
  const gridSpacing = 10; // Each grid line = 1 unit in SWTOR coords (scaled by 10)
  const gridRange = 12; // -12 to +12 range (extended grid)
  
  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    
    // Vertical lines (parallel to Y axis)
    for (let x = -gridRange; x <= gridRange; x++) {
      lines.push({
        key: `v${x}`,
        start: [x * gridSpacing, -gridRange * gridSpacing],
        end: [x * gridSpacing, gridRange * gridSpacing],
        isAxis: x === 0,
      });
    }
    
    // Horizontal lines (parallel to X axis)
    for (let y = -gridRange; y <= gridRange; y++) {
      lines.push({
        key: `h${y}`,
        start: [-gridRange * gridSpacing, y * gridSpacing],
        end: [gridRange * gridSpacing, y * gridSpacing],
        isAxis: y === 0,
      });
    }
    
    return lines;
  }, []);
  
  return (
    <group position={[0, 0, 0.1]}>
      {/* Grid lines */}
      {gridLines.map((line) => {
        const points = [
          new THREE.Vector3(line.start[0], line.start[1], 0),
          new THREE.Vector3(line.end[0], line.end[1], 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={line.key} geometry={geometry}>
            <lineBasicMaterial 
              color={line.isAxis ? "#00FFFF" : "#00BFFF"}
              transparent
              opacity={line.isAxis ? 0.3 : 0.08}
            />
        </line>
        );
      })}
    </group>
  );
}

// Faction territory hints
function RegionTerritories() {
  return (
    <group position={[0, 0, 0.05]}>
      {/* Republic Core territory hint */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[25, 32]} />
        <meshBasicMaterial 
          color="#FFD700"
          transparent 
          opacity={0.03}
        />
      </mesh>
      
      {/* Sith Empire territory hint - upper right */}
      <mesh position={[45, 35, 0]}>
        <circleGeometry args={[20, 32]} />
        <meshBasicMaterial 
          color="#DC143C"
          transparent 
          opacity={0.04}
        />
      </mesh>
      
      {/* Hutt Space hint */}
      <mesh position={[25, -5, 0]}>
        <circleGeometry args={[15, 32]} />
        <meshBasicMaterial 
          color="#808080"
          transparent 
          opacity={0.03}
        />
      </mesh>
    </group>
  );
}

// Legacy fallback - can be removed
export function GalaxyPlaneFallback() {
  return <ProceduralGalaxyMap />;
}

// Placeholder for texture-based version - now redirects to procedural
export function GalaxyMapBackground() {
  return <ProceduralGalaxyMap />;
}
