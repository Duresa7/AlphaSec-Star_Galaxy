import { useMemo, useState } from 'react';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { FACTION_STAT_CONFIG } from '@/constants/factions';

export function GalaxyOverview() {
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const getFactionStats = useGalaxyDataStore((s) => s.getFactionStats);

  const [collapsed, setCollapsed] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- systems/fleets trigger recomputation via store
  const factionStats = useMemo(() => getFactionStats(), [systems, fleets, getFactionStats]);

  return (
    <div className="holo-panel" style={{ marginTop: '0' }}>
      <label
        className="holo-label holo-section-header"
        style={{ marginBottom: collapsed ? '0' : '10px' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Galaxy Overview
        </span>
        <span aria-hidden="true" style={{ color: 'var(--holo-cyan)', opacity: 0.8 }}>
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </label>

      {!collapsed && (
        <div className="space-y-2">
          {FACTION_STAT_CONFIG.map(({ key, label, color }) => {
            const stats = factionStats[key];
            if (!stats || (stats.planets === 0 && stats.fleets === 0 && stats.shipUnits === 0)) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-3 py-2 px-4"
                style={{
                  background: 'rgba(200, 170, 110, 0.03)',
                  border: '1px solid rgba(200, 170, 110, 0.08)',
                  borderRadius: '8px',
                }}
              >
                <div
                  className="holo-status-dot"
                  style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${color}40` }}
                />
                <span className="flex-1 text-[13px] font-medium holo-body-text" style={{ color }}>
                  {label}
                </span>
                <div className="flex gap-3 text-right">
                  <div className="text-center">
                    <div className="holo-label-orbitron" style={{ fontSize: '13px', color: 'var(--holo-text-primary)' }}>
                      {stats.planets}
                    </div>
                    <div className="holo-label-orbitron" style={{ fontSize: '9px', color: 'var(--holo-text-muted)' }}>
                      PLN
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="holo-label-orbitron" style={{ fontSize: '13px', color: 'var(--holo-text-primary)' }}>
                      {stats.fleets}
                    </div>
                    <div className="holo-label-orbitron" style={{ fontSize: '9px', color: 'var(--holo-text-muted)' }}>
                      FLTS
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="holo-label-orbitron" style={{ fontSize: '13px', color: 'var(--holo-text-primary)' }}>
                      {stats.shipUnits}
                    </div>
                    <div className="holo-label-orbitron" style={{ fontSize: '9px', color: 'var(--holo-text-muted)' }}>
                      SHIPS
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
