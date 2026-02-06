import { useState, useRef, useEffect } from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';

export function ControlsPanel() {
  const {
    showFleets,
    showAnomalies,
    showLabels,
    toggleFleets,
    toggleAnomalies,
    toggleLabels,
    currentYear,
    viewMode,
    searchQuery,
    setSearchQuery,
    factionFilters,
    toggleFactionFilter,
    getSearchResults,
    setSelectedSystem,
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
  const [newFleetFaction, setNewFleetFaction] = useState<'sith_empire' | 'galactic_republic' | 'neutral' | 'contested'>('neutral');
  const [newFleetShipCount, setNewFleetShipCount] = useState(10);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchResults = getSearchResults();

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
    <div className="absolute left-5 top-5 space-y-5 max-h-[calc(100vh-3rem)] overflow-y-auto w-[280px] animate-slide-in-left pb-4">
      {/* Search Box */}
      <div ref={searchRef} className="relative z-50">
        <div className="apple-card">
          <label className="section-label" style={{ marginBottom: '12px' }}>Navigation</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder=""
              className="apple-input w-full px-4 py-2.5 text-[14px]"
            />
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 apple-card overflow-hidden z-50">
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
              >
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  result.type === 'system'
                    ? 'bg-amber-500/10 text-amber-400'
                    : result.type === 'fleet'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {result.type === 'system' ? 'SYS' : result.type === 'fleet' ? 'FLT' : 'PLN'}
                </span>
                <div className="flex flex-col">
                  <span className="text-gray-100 text-[13px] font-medium">{result.name}</span>
                  {result.parentName && (
                    <span className="text-gray-500 text-[11px]">in {result.parentName}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Status */}
      <div className="apple-card" style={{ marginTop: '16px' }}>
        <label className="section-label">Current View</label>
        <h2 className="text-lg font-semibold text-white mt-2">
          {viewMode === 'topdown' ? 'Galaxy Map' : (viewMode === 'system' ? 'System View' : 'Fleet View')}
        </h2>
        {viewMode !== 'topdown' && (
          <button
            onClick={() => {
              setSelectedSystem(null);
              setSelectedFleet(null);
              setInfoPanelData(null);
            }}
            className="apple-button-secondary mt-4 w-full"
            style={{ padding: '6px 16px' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span>Return to Galaxy</span>
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="apple-card" style={{ marginTop: '16px' }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="section-label">Timeline</label>
            <p className="text-[13px] text-gray-400 mt-1">Old Republic Era</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-amber-400">{currentYear}</span>
            <span className="text-[11px] text-gray-500 ml-1">BBY</span>
          </div>
        </div>
      </div>

      {/* Custom Planets */}
      {viewMode === 'topdown' && (
        <div className="apple-card" style={{ marginTop: '16px' }}>
          <label className="section-label">Custom Planets</label>

          {/* Placement mode indicator */}
          {placementMode && (
            <div className="mt-3 p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <p className="text-cyan-300 text-[12px] font-medium animate-pulse">
                Click on the map to place your planet
              </p>
              <button
                onClick={() => setPlacementMode(false)}
                className="mt-2 text-[11px] text-gray-400 hover:text-white transition-colors"
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
                className="apple-input w-full px-3 py-2 text-[13px]"
                maxLength={30}
                autoFocus
              />
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-gray-400 uppercase tracking-wide">Color</label>
                <input
                  type="color"
                  value={newPlanetColor}
                  onChange={(e) => setNewPlanetColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: newPlanetColor, boxShadow: `0 0 8px ${newPlanetColor}60` }}
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
                  className="apple-button-secondary flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ padding: '6px 12px' }}
                >
                  <span className="text-[12px]">Place on Map</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPlanetName('');
                  }}
                  className="text-[12px] text-gray-400 hover:text-white transition-colors px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : !placementMode && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="apple-button-secondary mt-3 w-full"
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
            <p className="text-[11px] text-gray-500 mt-2">
              {systems.filter(s => s.isCustom).length} custom planet{systems.filter(s => s.isCustom).length !== 1 ? 's' : ''} placed
            </p>
          )}
        </div>
      )}

      {/* Custom Fleets */}
      {viewMode === 'topdown' && (
        <div className="apple-card" style={{ marginTop: '16px' }}>
          <label className="section-label">Custom Fleets</label>

          {/* Placement mode indicator */}
          {fleetPlacementMode && (
            <div className="mt-3 p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <p className="text-cyan-300 text-[12px] font-medium animate-pulse">
                Click on the map to place your fleet
              </p>
              <button
                onClick={() => setFleetPlacementMode(false)}
                className="mt-2 text-[11px] text-gray-400 hover:text-white transition-colors"
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
                className="apple-input w-full px-3 py-2 text-[13px]"
                maxLength={30}
                autoFocus
              />
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-gray-400 uppercase tracking-wide">Faction</label>
                <select
                  value={newFleetFaction}
                  onChange={(e) => setNewFleetFaction(e.target.value as typeof newFleetFaction)}
                  className="apple-input flex-1 px-2 py-1.5 text-[12px] bg-black/30"
                >
                  <option value="neutral">Neutral</option>
                  <option value="galactic_republic">Republic</option>
                  <option value="sith_empire">Sith Empire</option>
                  <option value="contested">Contested</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-gray-400 uppercase tracking-wide">Ships</label>
                <input
                  type="number"
                  value={newFleetShipCount}
                  onChange={(e) => setNewFleetShipCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={500}
                  className="apple-input flex-1 px-2 py-1.5 text-[12px]"
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
                  className="apple-button-secondary flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ padding: '6px 12px' }}
                >
                  <span className="text-[12px]">Place on Map</span>
                </button>
                <button
                  onClick={() => {
                    setShowFleetCreateForm(false);
                    setNewFleetName('');
                  }}
                  className="text-[12px] text-gray-400 hover:text-white transition-colors px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : !fleetPlacementMode && (
            <button
              onClick={() => setShowFleetCreateForm(true)}
              className="apple-button-secondary mt-3 w-full"
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
            <p className="text-[11px] text-gray-500 mt-2">
              {fleets.filter(f => f.isCustom).length} custom fleet{fleets.filter(f => f.isCustom).length !== 1 ? 's' : ''} placed
            </p>
          )}
        </div>
      )}

      {/* Filter Groups */}
      <div className="apple-card space-y-4" style={{ marginTop: '16px' }}>
        <label className="section-label">Filters</label>

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

        <div className="h-px bg-white/5 my-3" />

        <label className="section-label mb-2">Layers</label>
        
        {/* Layer toggles */}
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
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: FilterBox
// A clickable box that toggles state, replacing the list-style switches
// -----------------------------------------------------------------------------

interface FilterBoxProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: 'blue' | 'yellow' | 'red' | 'orange' | 'gray' | 'purple' | 'cyan';
}

function FilterBox({ active, onClick, label, color = 'blue' }: FilterBoxProps) {
  const activeColor = colorMap[color];
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
        ${active 
          ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.3)]' 
          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-400'
        }
      `}
      style={{
        boxShadow: active ? `0 0 0 1px ${activeColor}40, inset 0 0 20px ${activeColor}10` : 'none',
        borderColor: active ? `${activeColor}60` : undefined
      }}
    >
      {/* Indicator Dot */}
      <div 
        className={`w-2 h-2 rounded-full mb-2 transition-all duration-300 ${active ? 'scale-110' : 'scale-90 opacity-50'}`}
        style={{ 
          backgroundColor: active ? activeColor : '#666',
          boxShadow: active ? `0 0 8px ${activeColor}` : 'none'
        }} 
      />
      
      {/* Label */}
      <span className={`text-[11px] font-medium tracking-wide uppercase ${active ? 'text-white' : 'text-gray-500'}`}>
        {label}
      </span>
      
      {/* Active Glow Background (Subtle) */}
      {active && (
        <div 
          className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${activeColor}, transparent 70%)` }}
        />
      )}
    </button>
  );
}

// Color map for toggle colors
const colorMap: Record<string, string> = {
  blue: '#64B5F6',
  yellow: '#FFD54F',
  red: '#EF5350',
  orange: '#FFA726',
  gray: '#9E9E9E',
  purple: '#AB47BC',
  cyan: '#4DD0E1',
};
