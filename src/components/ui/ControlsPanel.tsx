import { useState, useRef, useEffect } from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';

export function ControlsPanel() {
  const {
    showHyperspaceLanes,
    showFleets,
    showAnomalies,
    showLabels,
    toggleHyperspaceLanes,
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
  } = useGalaxyStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchResults = getSearchResults();

  // Handle search result selection
  const handleSelectResult = (result: { type: 'system' | 'planet'; id: string; name: string; parentName?: string }) => {
    if (result.type === 'system') {
      const system = systems.find(s => s.id === result.id);
      if (system) {
        setSelectedSystem(system.id);
        setInfoPanelData({ type: 'system', data: system });
      }
    } else if (result.type === 'planet' && result.parentName) {
      // Find the system containing this planet
      const system = systems.find(s => s.name === result.parentName);
      if (system) {
        setSelectedSystem(system.id);
        const planet = system.planets.find(p => p.id === result.id);
        if (planet) {
          setInfoPanelData({ type: 'planet', data: planet });
        }
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
                    : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {result.type === 'system' ? 'SYS' : 'PLN'}
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
            active={showHyperspaceLanes}
            onClick={toggleHyperspaceLanes}
            label="Lanes"
            color="cyan"
          />

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
