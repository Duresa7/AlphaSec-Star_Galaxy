import { useState, useRef, useEffect, useMemo } from 'react';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import type { SearchResult } from '@/types';

export function SearchBar() {
  const searchQuery = useGalaxyUIStore((s) => s.searchQuery);
  const setSearchQuery = useGalaxyUIStore((s) => s.setSearchQuery);
  const getSearchResults = useGalaxyDataStore((s) => s.getSearchResults);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);

  const [collapsed, setCollapsed] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- systems/fleets/searchQuery trigger recomputation via store
  const searchResults = useMemo(() => getSearchResults(), [searchQuery, systems, fleets, getSearchResults]);

  useEffect(() => {
    if (collapsed) setIsSearchFocused(false);
  }, [collapsed]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'system') {
      const system = systems.find(s => s.id === result.id);
      if (system) {
        setSelectedSystem(system.id);
        setInfoPanelData({ type: 'system', data: system });
      }
    } else if (result.type === 'planet') {
      const system =
        (result.parentSystemId ? systems.find((s) => s.id === result.parentSystemId) : null)
        ?? (result.parentName ? systems.find((s) => s.name === result.parentName) : null);
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

  return (
    <div ref={searchRef} className="relative z-50">
      <div className="holo-panel">
        <label
          className="holo-label holo-section-header"
          style={{ marginBottom: collapsed ? '0' : '12px' }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Navigation
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
          <div className="holo-search-wrapper">
            <svg className="holo-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search systems, planets, fleets..."
              className="holo-input w-full py-2.5 text-[14px]"
            />
          </div>
        )}
      </div>

      {!collapsed && isSearchFocused && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="holo-panel overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-amber-500/5 transition-colors flex items-center gap-3 border-b border-amber-500/10 last:border-0"
              >
                <span className={`text-[10px] font-semibold px-2 py-0.5 holo-badge holo-label-orbitron ${
                  result.type === 'system'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : result.type === 'fleet'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {result.type === 'system' ? 'LOC' : result.type === 'fleet' ? 'FLT' : 'PLN'}
                </span>
                <div className="flex flex-col">
                  <span className="text-gray-100 text-[14px] font-medium holo-body-text">{result.name}</span>
                  {result.parentName && (
                    <span className="text-gray-500 text-[12px]">in {result.parentName}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
