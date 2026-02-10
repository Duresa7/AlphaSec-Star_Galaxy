import { useState, useRef, useEffect, useCallback } from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';
import type { Faction } from '@/types';

const FACTION_STAT_CONFIG: { key: Faction; label: string; color: string }[] = [
  { key: 'galactic_republic', label: 'Republic', color: '#C8AA6E' },
  { key: 'sith_empire', label: 'Sith Empire', color: '#DC143C' },
  { key: 'hutt_cartel', label: 'Hutt Cartel', color: '#8B9A46' },
  { key: 'neutral', label: 'Neutral', color: '#9E9E9E' },
  { key: 'contested', label: 'Contested', color: '#FFA726' },
];

type SectionKey =
  | 'navigation'
  | 'currentView'
  | 'timeline'
  | 'galaxyOverview'
  | 'customPlanets'
  | 'customFleets'
  | 'filters'
  | 'layers';

export function ControlsPanel() {
  const {
    showFleets,
    showAnomalies,
    showLabels,
    toggleFleets,
    toggleAnomalies,
    toggleLabels,
    currentYear,
    setCurrentYear,
    viewMode,
    searchQuery,
    setSearchQuery,
    factionFilters,
    toggleFactionFilter,
    getSearchResults,
    getFactionStats,
    setSelectedSystem,
    setSelectedPlanet,
    setSelectedFleet,
    setInfoPanelData,
    systems,
    placementMode,
    setPlacementMode,
    fleets,
    fleetPlacementMode,
    setFleetPlacementMode,
  } = useGalaxyStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetColor, setNewPlanetColor] = useState('#4DD0E1');
  const [showFleetCreateForm, setShowFleetCreateForm] = useState(false);
  const [newFleetName, setNewFleetName] = useState('');
  const [newFleetFaction, setNewFleetFaction] = useState<Faction>('neutral');
  const [newFleetShipCount, setNewFleetShipCount] = useState(10);
  const [yearDraft, setYearDraft] = useState(String(currentYear));
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
    navigation: false,
    currentView: false,
    timeline: false,
    galaxyOverview: false,
    customPlanets: false,
    customFleets: false,
    filters: false,
    layers: false,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const searchResults = getSearchResults();
  const factionStats = getFactionStats();

  // Sync year draft when store value changes externally
  useEffect(() => {
    setYearDraft(String(currentYear));
  }, [currentYear]);

  useEffect(() => {
    if (collapsedSections.navigation) {
      setIsSearchFocused(false);
    }
  }, [collapsedSections.navigation]);

  const toggleSection = useCallback((section: SectionKey) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const sectionArrow = useCallback(
    (section: SectionKey) => (collapsedSections[section] ? '\u25b8' : '\u25be'),
    [collapsedSections]
  );

  const commitYear = useCallback(() => {
    const parsed = parseInt(yearDraft, 10);
    if (isNaN(parsed)) {
      setYearDraft(String(currentYear));
      return;
    }
    setCurrentYear(parsed);
    setYearDraft(String(parsed));
  }, [yearDraft, currentYear, setCurrentYear]);

  // Handle search result selection
  const handleSelectResult = (result: { type: 'system' | 'planet' | 'fleet'; id: string; name: string; parentName?: string }) => {
    if (result.type === 'system') {
      const system = systems.find(s => s.id === result.id);
      if (system) {
        setSelectedSystem(system.id);
        setInfoPanelData({ type: 'system', data: system });
      }
    } else if (result.type === 'planet' && result.parentName) {
      const system = systems.find(s => s.name === result.parentName);
      if (system) {
        setSelectedSystem(system.id);
        const planet = system.planets.find(p => p.id === result.id);
        if (planet) {
          setSelectedPlanet(planet.id);
          setInfoPanelData({ type: 'planet', data: planet });
        }
      }
    } else if (result.type === 'fleet') {
      const fleet = fleets.find(f => f.id === result.id);
      if (fleet) {
        setSelectedFleet(fleet.id);
        setInfoPanelData({ type: 'fleet', data: fleet });
      }
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="holo-scroll-invisible absolute left-5 top-5 space-y-5 max-h-[calc(100vh-3rem)] overflow-y-auto w-[280px] animate-slide-in-left pb-4">
      {/* Search Box */}
      <div ref={searchRef} className="relative z-50">
        <div className="holo-panel">
          <label
            className="holo-label flex items-center justify-between gap-2"
            style={{ marginBottom: collapsedSections.navigation ? '0' : '12px', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleSection('navigation')}
          >
            <span>Navigation</span>
            <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>{sectionArrow('navigation')}</span>
          </label>
          {!collapsedSections.navigation && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder=""
                className="holo-input w-full px-4 py-2.5 text-[14px]"
              />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {!collapsedSections.navigation && isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <div className="holo-panel overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-amber-500/5 transition-colors flex items-center gap-3 border-b border-amber-500/10 last:border-0"
                >
                  <span className={`text-[9px] font-semibold px-2 py-0.5 holo-badge ${
                    result.type === 'system'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : result.type === 'fleet'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  }`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {result.type === 'system' ? 'LOC' : result.type === 'fleet' ? 'FLT' : 'PLN'}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-gray-100 text-[13px] font-medium" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{result.name}</span>
                    {result.parentName && (
                      <span className="text-gray-500 text-[11px]">in {result.parentName}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Status */}
      <div className="holo-panel" style={{ marginTop: '16px' }}>
        <label
          className="holo-label flex items-center justify-between gap-2"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('currentView')}
        >
          <span>Current View</span>
          <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>{sectionArrow('currentView')}</span>
        </label>
        {!collapsedSections.currentView && (
          <>
            <h2 className="text-lg font-semibold mt-2" style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-text-primary)' }}>
              {viewMode === 'topdown' ? 'Galaxy Map' : (viewMode === 'system' ? 'Planet View' : 'Fleet View')}
            </h2>
            {viewMode !== 'topdown' && (
              <button
                onClick={() => {
                  setSelectedSystem(null);
                  setSelectedFleet(null);
                  setInfoPanelData(null);
                }}
                className="holo-button mt-4 w-full"
                style={{ padding: '6px 16px' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Return to Galaxy</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Timeline with Year Input */}
      <div className="holo-panel" style={{ marginTop: '16px' }}>
        <div>
          <label
            className="holo-label flex items-center justify-between gap-2"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleSection('timeline')}
          >
            <span>Timeline</span>
            <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>{sectionArrow('timeline')}</span>
          </label>
          {!collapsedSections.timeline && (
            <p className="text-[13px] mt-1" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>Old Republic Era</p>
          )}
        </div>
        {!collapsedSections.timeline && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                value={yearDraft}
                onChange={(e) => setYearDraft(e.target.value)}
                onBlur={commitYear}
                onKeyDown={(e) => { if (e.key === 'Enter') commitYear(); }}
                className="holo-input holo-number-input text-center"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '14px',
                  width: '80px',
                  padding: '4px 8px',
                  color: 'var(--holo-amber)',
                }}
              />
              <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--holo-text-muted)' }}>BBY</span>
            </div>
            <div className="mt-1">
            </div>
          </>
        )}
      </div>

      {/* Galaxy Overview — Faction Stats */}
      <div className="holo-panel" style={{ marginTop: '16px' }}>
        <label
          className="holo-label flex items-center justify-between gap-2"
          style={{ marginBottom: collapsedSections.galaxyOverview ? '0' : '10px', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('galaxyOverview')}
        >
          <span>Galaxy Overview</span>
          <span aria-hidden="true" style={{ color: 'var(--holo-cyan)', opacity: 0.8 }}>{sectionArrow('galaxyOverview')}</span>
        </label>

        {!collapsedSections.galaxyOverview && (
          <div className="space-y-2">
            {FACTION_STAT_CONFIG.map(({ key, label, color }) => {
              const stats = factionStats[key];
              if (!stats || (stats.planets === 0 && stats.fleetShips === 0)) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 py-2 px-2"
                  style={{
                    background: 'rgba(200, 170, 110, 0.03)',
                    border: '1px solid rgba(200, 170, 110, 0.08)',
                    clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)',
                  }}
                >
                  {/* Faction diamond indicator */}
                  <div
                    className="w-2.5 h-2.5 flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                      boxShadow: `0 0 6px ${color}60`,
                    }}
                  />
                  {/* Faction name */}
                  <span
                    className="flex-1 text-[11px] font-medium"
                    style={{ fontFamily: 'Rajdhani, sans-serif', color }}
                  >
                    {label}
                  </span>
                  {/* Stats */}
                  <div className="flex gap-3 text-right">
                    <div className="text-center">
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--holo-text-primary)' }}>
                        {stats.planets}
                      </div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '7px', color: 'var(--holo-text-muted)' }}>
                        PLN
                      </div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '11px', color: 'var(--holo-text-primary)' }}>
                        {stats.fleetShips}
                      </div>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '7px', color: 'var(--holo-text-muted)' }}>
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

      {/* Custom Planets */}
      {viewMode === 'topdown' && (
        <div className="holo-panel" style={{ marginTop: '16px' }}>
          <label
            className="holo-label flex items-center justify-between gap-2"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleSection('customPlanets')}
          >
            <span>Custom Planets</span>
            <span aria-hidden="true" style={{ color: 'var(--holo-cyan)', opacity: 0.8 }}>{sectionArrow('customPlanets')}</span>
          </label>

          {!collapsedSections.customPlanets && (
            <>
              {/* Placement mode indicator */}
              {placementMode && (
                <div className="mt-3 p-3 border" style={{ borderColor: 'rgba(0, 240, 255, 0.3)', background: 'rgba(0, 240, 255, 0.05)', clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)' }}>
                  <p className="text-[12px] font-medium animate-pulse" style={{ color: 'var(--holo-cyan)', fontFamily: 'Orbitron, monospace', fontSize: '10px' }}>
                    Click on the map to place your planet
                  </p>
                  <button
                    onClick={() => setPlacementMode(false)}
                    className="mt-2 text-[11px] hover:text-white transition-colors"
                    style={{ color: 'var(--holo-text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Create form */}
              {showCreateForm && !placementMode ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={newPlanetName}
                    onChange={(e) => setNewPlanetName(e.target.value)}
                    placeholder="Planet name"
                    className="holo-input w-full px-3 py-2 text-[13px]"
                    maxLength={30}
                    autoFocus
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>Color</label>
                    <input
                      type="color"
                      value={newPlanetColor}
                      onChange={(e) => setNewPlanetColor(e.target.value)}
                      className="w-8 h-8 border cursor-pointer bg-transparent"
                      style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
                    />
                    <div
                      className="w-4 h-4"
                      style={{ backgroundColor: newPlanetColor, boxShadow: `0 0 8px ${newPlanetColor}60`, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newPlanetName.trim()) {
                          setPlacementMode(true, { name: newPlanetName.trim(), color: newPlanetColor });
                          setShowCreateForm(false);
                        }
                      }}
                      disabled={!newPlanetName.trim()}
                      className="holo-button flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ padding: '6px 12px' }}
                    >
                      <span className="text-[11px]">Place on Map</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewPlanetName('');
                      }}
                      className="text-[12px] hover:text-white transition-colors px-3"
                      style={{ color: 'var(--holo-text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !placementMode && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="holo-button mt-3 w-full"
                  style={{ padding: '6px 16px' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Planet</span>
                </button>
              )}

              {/* Count of custom planets */}
              {systems.filter(s => s.isCustom).length > 0 && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--holo-text-muted)' }}>
                  {systems.filter(s => s.isCustom).length} custom planet{systems.filter(s => s.isCustom).length !== 1 ? 's' : ''} placed
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Custom Fleets */}
      {viewMode === 'topdown' && (
        <div className="holo-panel" style={{ marginTop: '16px' }}>
          <label
            className="holo-label flex items-center justify-between gap-2"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleSection('customFleets')}
          >
            <span>Custom Fleets</span>
            <span aria-hidden="true" style={{ color: 'var(--holo-crimson)', opacity: 0.8 }}>{sectionArrow('customFleets')}</span>
          </label>

          {!collapsedSections.customFleets && (
            <>
              {/* Placement mode indicator */}
              {fleetPlacementMode && (
                <div className="mt-3 p-3 border" style={{ borderColor: 'rgba(0, 240, 255, 0.3)', background: 'rgba(0, 240, 255, 0.05)', clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)' }}>
                  <p className="text-[12px] font-medium animate-pulse" style={{ color: 'var(--holo-cyan)', fontFamily: 'Orbitron, monospace', fontSize: '10px' }}>
                    Click on the map to place your fleet
                  </p>
                  <button
                    onClick={() => setFleetPlacementMode(false)}
                    className="mt-2 text-[11px] hover:text-white transition-colors"
                    style={{ color: 'var(--holo-text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Create form */}
              {showFleetCreateForm && !fleetPlacementMode ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={newFleetName}
                    onChange={(e) => setNewFleetName(e.target.value)}
                    placeholder="Fleet name"
                    className="holo-input w-full px-3 py-2 text-[13px]"
                    maxLength={30}
                    autoFocus
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>Faction</label>
                    <div className="relative flex-1">
                      <select
                        value={newFleetFaction}
                        onChange={(e) => setNewFleetFaction(e.target.value as Faction)}
                        className="holo-input w-full px-2 py-1.5 pr-7 text-[12px]"
                        style={{
                          background: 'rgba(5, 5, 8, 0.7)',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          backgroundImage:
                            'linear-gradient(45deg, transparent 50%, rgba(200, 170, 110, 0.9) 50%), linear-gradient(135deg, rgba(200, 170, 110, 0.9) 50%, transparent 50%)',
                          backgroundPosition: 'calc(100% - 12px) calc(50% - 2px), calc(100% - 8px) calc(50% - 2px)',
                          backgroundSize: '4px 4px, 4px 4px',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        <option value="neutral">Neutral</option>
                        <option value="galactic_republic">Republic</option>
                        <option value="sith_empire">Sith Empire</option>
                        <option value="hutt_cartel">Hutt Cartel</option>
                        <option value="contested">Contested</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>Ships</label>
                    <input
                      type="number"
                      value={newFleetShipCount}
                      onChange={(e) => setNewFleetShipCount(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={500}
                      className="holo-input flex-1 px-2 py-1.5 text-[12px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (newFleetName.trim()) {
                          setFleetPlacementMode(true, { name: newFleetName.trim(), faction: newFleetFaction, shipCount: newFleetShipCount });
                          setShowFleetCreateForm(false);
                        }
                      }}
                      disabled={!newFleetName.trim()}
                      className="holo-button flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ padding: '6px 12px' }}
                    >
                      <span className="text-[11px]">Place on Map</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowFleetCreateForm(false);
                        setNewFleetName('');
                      }}
                      className="text-[12px] hover:text-white transition-colors px-3"
                      style={{ color: 'var(--holo-text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !fleetPlacementMode && (
                <button
                  onClick={() => setShowFleetCreateForm(true)}
                  className="holo-button mt-3 w-full"
                  style={{ padding: '6px 16px' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Fleet</span>
                </button>
              )}

              {/* Count of custom fleets */}
              {fleets.filter(f => f.isCustom).length > 0 && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--holo-text-muted)' }}>
                  {fleets.filter(f => f.isCustom).length} custom fleet{fleets.filter(f => f.isCustom).length !== 1 ? 's' : ''} placed
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Filter Groups */}
      <div className="holo-panel space-y-4" style={{ marginTop: '16px' }}>
        <label
          className="holo-label flex items-center justify-between gap-2"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleSection('filters')}
        >
          <span>Filters</span>
          <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>{sectionArrow('filters')}</span>
        </label>

        {!collapsedSections.filters && (
          <>
            {/* Faction Filters */}
            <div className="grid grid-cols-2 gap-2">
              <FilterBox
                active={factionFilters.galactic_republic}
                onClick={() => toggleFactionFilter('galactic_republic')}
                label="Republic"
                color="yellow"
              />
              <FilterBox
                active={factionFilters.sith_empire}
                onClick={() => toggleFactionFilter('sith_empire')}
                label="Empire"
                color="red"
              />
              <FilterBox
                active={factionFilters.hutt_cartel}
                onClick={() => toggleFactionFilter('hutt_cartel')}
                label="Hutts"
                color="olive"
              />
              <FilterBox
                active={factionFilters.neutral}
                onClick={() => toggleFactionFilter('neutral')}
                label="Neutral"
                color="gray"
              />
              <FilterBox
                active={factionFilters.contested}
                onClick={() => toggleFactionFilter('contested')}
                label="Contested"
                color="orange"
              />
            </div>

            <div className="holo-divider" />

            <label
              className="holo-label mb-2 flex items-center justify-between gap-2"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => toggleSection('layers')}
            >
              <span>Layers</span>
              <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>{sectionArrow('layers')}</span>
            </label>

            {/* Layer toggles */}
            {!collapsedSections.layers && (
              <div className="grid grid-cols-2 gap-2">
                <FilterBox
                  active={showFleets}
                  onClick={toggleFleets}
                  label="Fleets"
                  color="red"
                />

                <FilterBox
                  active={showAnomalies}
                  onClick={toggleAnomalies}
                  label="Anomalies"
                  color="purple"
                />

                <FilterBox
                  active={showLabels}
                  onClick={toggleLabels}
                  label="Labels"
                  color="yellow"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: FilterBox
// KOTOR-style angular filter toggle
// -----------------------------------------------------------------------------

interface FilterBoxProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: 'blue' | 'yellow' | 'red' | 'orange' | 'gray' | 'purple' | 'cyan' | 'olive';
}

function FilterBox({ active, onClick, label, color = 'blue' }: FilterBoxProps) {
  const activeColor = colorMap[color];

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-3 border transition-all duration-200"
      style={{
        background: active ? `rgba(200, 170, 110, 0.08)` : 'rgba(5, 5, 8, 0.5)',
        borderColor: active ? `${activeColor}60` : 'rgba(200, 170, 110, 0.1)',
        boxShadow: active ? `0 0 0 1px ${activeColor}30, 0 0 12px ${activeColor}15` : 'none',
        clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
      }}
    >
      {/* Indicator — diamond shape */}
      <div
        className={`w-2 h-2 mb-2 transition-all duration-300 ${active ? 'scale-110' : 'scale-90 opacity-50'}`}
        style={{
          backgroundColor: active ? activeColor : '#666',
          boxShadow: active ? `0 0 8px ${activeColor}` : 'none',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      />

      {/* Label */}
      <span
        className="text-[10px] font-medium tracking-wider uppercase"
        style={{
          fontFamily: 'Orbitron, monospace',
          color: active ? activeColor : 'rgba(200, 170, 110, 0.35)',
          textShadow: active ? `0 0 6px ${activeColor}40` : 'none',
        }}
      >
        {label}
      </span>

      {/* Active Glow Background */}
      {active && (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${activeColor}, transparent 70%)` }}
        />
      )}
    </button>
  );
}

// Color map for toggle colors
const colorMap: Record<string, string> = {
  blue: '#64B5F6',
  yellow: '#C8AA6E',
  red: '#DC143C',
  orange: '#FFA726',
  gray: '#9E9E9E',
  purple: '#AB47BC',
  cyan: '#00F0FF',
  olive: '#8B9A46',
};
