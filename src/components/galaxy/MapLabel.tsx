import { Html } from '@react-three/drei';

interface MapLabelProps {
  markerSize: number;
  color: string;
  hovered: boolean;
  title: string;
  subtitle?: string;
  fontSize?: string;
}

export function MapLabel({ markerSize, color, hovered, title, subtitle, fontSize = '13px' }: MapLabelProps) {
  return (
    <Html
      position={[0, 0, -markerSize * 1.5]}
      center
      zIndexRange={[0, 0]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        data-map-label
        className="text-center whitespace-nowrap px-3 py-1 rounded"
        style={{
          color: '#FFFFFF',
          backgroundColor: hovered ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)',
          textShadow: `0 0 10px ${color}, 0 0 5px ${color}`,
          fontSize,
          fontWeight: 'bold',
          borderBottom: `2px solid ${color}`,
        }}
      >
        {title}
        {subtitle && (
          <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.7 }}>
            {subtitle}
          </div>
        )}
      </div>
    </Html>
  );
}
