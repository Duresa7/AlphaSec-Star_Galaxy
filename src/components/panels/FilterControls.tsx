import { useState } from 'react';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { FilterBox } from '@/components/panels/FilterBox';

export function FilterControls() {
  const factionFilters = useGalaxyUIStore((s) => s.factionFilters);
  const toggleFactionFilter = useGalaxyUIStore((s) => s.toggleFactionFilter);
  const showFleets = useGalaxyUIStore((s) => s.showFleets);
  const showAnomalies = useGalaxyUIStore((s) => s.showAnomalies);
  const showLabels = useGalaxyUIStore((s) => s.showLabels);
  const toggleFleets = useGalaxyUIStore((s) => s.toggleFleets);
  const toggleAnomalies = useGalaxyUIStore((s) => s.toggleAnomalies);
  const toggleLabels = useGalaxyUIStore((s) => s.toggleLabels);

  const [collapsed, setCollapsed] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(false);

  return (
    <div className="holo-panel space-y-4" style={{ marginTop: '0' }}>
      <label
        className="holo-label holo-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </span>
        <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>
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
        <>
          <div className="grid grid-cols-2 gap-2">
            <FilterBox active={factionFilters.galactic_republic} onClick={() => toggleFactionFilter('galactic_republic')} label="Republic" color="yellow" />
            <FilterBox active={factionFilters.sith_empire} onClick={() => toggleFactionFilter('sith_empire')} label="Empire" color="red" />
            <FilterBox active={factionFilters.hutt_cartel} onClick={() => toggleFactionFilter('hutt_cartel')} label="Hutts" color="olive" />
            <FilterBox active={factionFilters.neutral} onClick={() => toggleFactionFilter('neutral')} label="Neutral" color="gray" />
            <FilterBox active={factionFilters.contested} onClick={() => toggleFactionFilter('contested')} label="Contested" color="orange" />
          </div>

          <div className="holo-divider" />

          <label
            className="holo-label holo-section-header mb-2"
            onClick={() => setLayersCollapsed(!layersCollapsed)}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Layers
            </span>
            <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>
              {layersCollapsed ? (
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

          {!layersCollapsed && (
            <div className="grid grid-cols-2 gap-2">
              <FilterBox active={showFleets} onClick={toggleFleets} label="Fleets" color="red" />
              <FilterBox active={showAnomalies} onClick={toggleAnomalies} label="Anomalies" color="purple" />
              <FilterBox active={showLabels} onClick={toggleLabels} label="Labels" color="yellow" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
