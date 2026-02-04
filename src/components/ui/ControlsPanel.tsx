import { useState, useRef, useEffect } from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';
import type { Faction } from '@/types';

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
    setViewMode,
    searchQuery,
    setSearchQuery,
    factionFilters,
    toggleFactionFilter,
    getSearchResults,
    setSelectedSystem,
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
    <div className="absolute left-4 top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Search Box */}
      <div ref={searchRef} className="relative">
        <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-xs text-gray-500 mb-2">Search Galaxy</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="System or planet..."
            className="w-full bg-gray-900/80 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-cyan-500/30 rounded-lg overflow-hidden backdrop-blur-sm z-50">
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelectResult(result)}
                className="w-full px-3 py-2 text-left hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
              >
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  result.type === 'system' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {result.type === 'system' ? 'SYS' : 'PLN'}
                </span>
                <span className="text-white text-sm">{result.name}</span>
                {result.parentName && (
                  <span className="text-gray-500 text-xs">in {result.parentName}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* View mode indicator */}
      <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs text-gray-500 mb-1">View Mode</div>
        <div className="text-cyan-400 font-bold capitalize">{viewMode}</div>
        {viewMode !== 'galaxy' && (
          <button
            onClick={() => setViewMode('galaxy')}
            className="mt-2 text-xs text-cyan-500 hover:text-cyan-300 transition-colors"
          >
            Return to Galaxy View
          </button>
        )}
      </div>
      
      {/* Timeline */}
      <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs text-gray-500 mb-1">Timeline</div>
        <div className="text-yellow-400 font-bold">{currentYear} BBY</div>
        <div className="text-xs text-gray-400">Old Republic Era</div>
      </div>
      
      {/* Faction Filters */}
      <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs text-gray-500 mb-2">Filter by Faction</div>
        <div className="space-y-1.5">
          <FactionFilterButton
            faction="galactic_republic"
            label="Republic"
            color="yellow"
            active={factionFilters.galactic_republic}
            onClick={() => toggleFactionFilter('galactic_republic')}
          />
          <FactionFilterButton
            faction="sith_empire"
            label="Sith Empire"
            color="red"
            active={factionFilters.sith_empire}
            onClick={() => toggleFactionFilter('sith_empire')}
          />
          <FactionFilterButton
            faction="neutral"
            label="Neutral"
            color="gray"
            active={factionFilters.neutral}
            onClick={() => toggleFactionFilter('neutral')}
          />
          <FactionFilterButton
            faction="contested"
            label="Contested"
            color="orange"
            active={factionFilters.contested}
            onClick={() => toggleFactionFilter('contested')}
          />
        </div>
      </div>
      
      {/* Layer toggles */}
      <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm space-y-2">
        <div className="text-xs text-gray-500 mb-2">Display Layers</div>
        
        <ToggleButton
          active={showHyperspaceLanes}
          onClick={toggleHyperspaceLanes}
          label="Hyperspace Lanes"
          color="cyan"
        />
        
        <ToggleButton
          active={showFleets}
          onClick={toggleFleets}
          label="Fleet Markers"
          color="red"
        />
        
        <ToggleButton
          active={showAnomalies}
          onClick={toggleAnomalies}
          label="Anomalies"
          color="purple"
        />
        
        <ToggleButton
          active={showLabels}
          onClick={toggleLabels}
          label="System Labels"
          color="yellow"
        />
      </div>
      
      {/* Legend */}
      <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs text-gray-500 mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <LegendItem color="bg-yellow-400" label="Republic Capital" />
          <LegendItem color="bg-red-500" label="Sith Capital" />
          <LegendItem color="bg-cyan-400" label="Hyperspace Lane" />
          <LegendItem color="bg-purple-500" label="Anomaly" />
        </div>
      </div>
    </div>
  );
}

interface FactionFilterButtonProps {
  faction: Faction;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function FactionFilterButton({ label, color, active, onClick }: FactionFilterButtonProps) {
  const colorMap: Record<string, { bg: string; border: string; dot: string }> = {
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', dot: 'bg-yellow-400' },
    red: { bg: 'bg-red-500/20', border: 'border-red-500', dot: 'bg-red-500' },
    gray: { bg: 'bg-gray-500/20', border: 'border-gray-500', dot: 'bg-gray-400' },
    orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', dot: 'bg-orange-400' },
  };
  
  const colors = colorMap[color] || colorMap.gray;
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-all ${
        active 
          ? `${colors.bg} border ${colors.border}` 
          : 'bg-gray-800/50 border border-gray-700 opacity-50'
      }`}
    >
      <div className={`w-3 h-3 rounded-full ${active ? colors.dot : 'bg-gray-600'}`} />
      <span className={active ? 'text-white' : 'text-gray-500'}>{label}</span>
      {!active && <span className="ml-auto text-gray-600">hidden</span>}
    </button>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}

function ToggleButton({ active, onClick, label, color }: ToggleButtonProps) {
  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500/20 border-cyan-500',
    red: 'bg-red-500/20 border-red-500',
    purple: 'bg-purple-500/20 border-purple-500',
    yellow: 'bg-yellow-500/20 border-yellow-500',
  };
  
  const dotColors: Record<string, string> = {
    cyan: 'bg-cyan-400',
    red: 'bg-red-400',
    purple: 'bg-purple-400',
    yellow: 'bg-yellow-400',
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-all ${
        active 
          ? `${colorClasses[color]} border` 
          : 'bg-gray-800/50 border border-gray-600 text-gray-400'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${active ? dotColors[color] : 'bg-gray-600'}`} />
      <span className={active ? 'text-white' : 'text-gray-400'}>{label}</span>
    </button>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-gray-300">{label}</span>
    </div>
  );
}
