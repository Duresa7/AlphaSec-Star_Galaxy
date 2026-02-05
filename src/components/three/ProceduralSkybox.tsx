import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ProceduralSkybox() {
  const starsRef = useRef<THREE.Points>(null);
  
  // Generate star sphere
  const { positions, colors } = useMemo(() => {
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    // Star colors (temperature based - blue to red/yellow)
    const colorPalette = [
      new THREE.Color('#9bb0ff'), // Blue-white
      new THREE.Color('#aabfff'), // Blue-white
      new THREE.Color('#cad7ff'), // Blue-white
      new THREE.Color('#f8f7ff'), // White
      new THREE.Color('#fff4ea'), // Yellow-white
      new THREE.Color('#ffd2a1'), // Yellow
      new THREE.Color('#ffcc6f'), // Orange
    ];
    
    for (let i = 0; i < starCount; i++) {
      // Uniform distribution on sphere surface
      // Radius between 800 and 1500 (far background)
      const r = 800 + Math.random() * 700;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Color
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, []);
  
  // Slow rotation of the skybox
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.05;
    }
  });
  
  // Create a custom shader material for stars to handle size attenuation properly across devices
  // Or just use PointsMaterial for simplicity and compatibility
  
  return (
    <group>
      {/* Distant Stars */}
      <points ref={starsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          sizeAttenuation={false}
          vertexColors
          transparent
          opacity={1.0}
          fog={false}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
