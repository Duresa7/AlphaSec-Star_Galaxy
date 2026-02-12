import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ProceduralSkybox() {
  const starsRef = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const colorPalette = [
      new THREE.Color('#9bb0ff'),
      new THREE.Color('#aabfff'),
      new THREE.Color('#cad7ff'),
      new THREE.Color('#f8f7ff'),
      new THREE.Color('#fff4ea'),
      new THREE.Color('#ffd2a1'),
      new THREE.Color('#ffcc6f'),
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 800 + Math.random() * 700;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.05;
    }
  });

  return (
    <group>

      <points ref={starsRef} frustumCulled={false}>
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
