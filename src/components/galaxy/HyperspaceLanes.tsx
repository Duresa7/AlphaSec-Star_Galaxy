import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { HyperspaceLane, StarSystem } from '@/types';

interface HyperspaceLanesProps {
  lanes: HyperspaceLane[];
  systems: StarSystem[];
}

const LANE_COLORS = {
  major: '#00BFFF',
  minor: '#4169E1',
  secret: '#9400D3',
};

export function HyperspaceLanes({ lanes, systems }: HyperspaceLanesProps) {
  const systemMap = useMemo(() => {
    const map = new Map<string, StarSystem>();
    systems.forEach(s => map.set(s.id, s));
    return map;
  }, [systems]);
  
  return (
    <group>
      {lanes.map(lane => (
        <HyperspaceLaneLine 
          key={lane.id} 
          lane={lane} 
          systemMap={systemMap}
        />
      ))}
    </group>
  );
}

interface HyperspaceLaneLineProps {
  lane: HyperspaceLane;
  systemMap: Map<string, StarSystem>;
}

function HyperspaceLaneLine({ lane, systemMap }: HyperspaceLaneLineProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    
    lane.systems.forEach(systemId => {
      const system = systemMap.get(systemId);
      if (system) {
        pts.push(system.position.clone());
      }
    });
    
    if (pts.length < 2) return null;
    
    // Create a smooth curve through the points
    const curve = new THREE.CatmullRomCurve3(pts);
    return curve.getPoints(50);
  }, [lane.systems, systemMap]);
  
  const color = LANE_COLORS[lane.type] || LANE_COLORS.minor;
  
  if (!points || points.length < 2) return null;
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={lane.type === 'major' ? 2 : 1}
      transparent
      opacity={0.6}
      dashed
      dashSize={1}
      gapSize={0.5}
    />
  );
}
