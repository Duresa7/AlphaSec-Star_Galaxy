import type { Anomaly } from '@/types';
import { InfoRow } from '@/components/panels/infoPanelShared';

export function AnomalyInfo({ anomaly }: { anomaly: Anomaly }) {
  const typeColors: Record<string, string> = {
    nebula: 'text-purple-400',
    black_hole: 'text-orange-400',
    space_station: 'text-cyan-400',
    hyperspace_lane: 'text-blue-400',
  };

  return (
    <div className="space-y-4">

      <div className="pb-3">
        <h2 className="text-xl font-semibold mb-2 holo-heading">{anomaly.name}</h2>
        <span className={`holo-badge border border-white/10 bg-white/5 ${typeColors[anomaly.type] || 'text-gray-400'}`}>
          {anomaly.type.replace('_', ' ')}
        </span>
      </div>

      <div className="holo-divider" />

      <div className="holo-info-grid">
        <InfoRow label="Radius" value={`${anomaly.radius} parsecs`} />
      </div>

      <p className="text-sm leading-relaxed holo-body-text">{anomaly.description}</p>

      {(anomaly.type === 'black_hole' || anomaly.type === 'nebula') && (
        <div className="holo-info-grid" style={{ background: 'rgba(200, 170, 110, 0.06)', borderColor: 'rgba(200, 170, 110, 0.2)' }}>
          <div className="flex items-center gap-2 text-xs font-bold holo-label-orbitron" style={{ color: 'var(--holo-amber)', fontSize: '9px' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>NAVIGATION HAZARD - CAUTION</span>
          </div>
        </div>
      )}
    </div>
  );
}
