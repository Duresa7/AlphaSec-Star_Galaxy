import { useState } from 'react';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';

export function CustomPlanetsPanel() {
  const placementMode = useGalaxyUIStore((s) => s.placementMode);
  const setPlacementMode = useGalaxyUIStore((s) => s.setPlacementMode);
  const systems = useGalaxyDataStore((s) => s.systems);
  const allFactions = useFactionStore((s) => s.factions);

  const [collapsed, setCollapsed] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetColor, setNewPlanetColor] = useState('#4DD0E1');
  const [newPlanetFaction, setNewPlanetFaction] = useState('neutral');

  const customCount = systems.filter(s => s.isCustom).length;

  return (
    <div className="holo-panel" style={{ marginTop: '0' }}>
      <label
        className="holo-label holo-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Custom Planets
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
        <>
          {placementMode && (
            <div className="mt-3 p-3 border" style={{ borderColor: 'rgba(0, 240, 255, 0.2)', background: 'rgba(0, 240, 255, 0.04)', borderRadius: '10px' }}>
              <p className="text-[13px] font-medium animate-pulse holo-label-orbitron" style={{ color: 'var(--holo-cyan)' }}>
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
              <div className="space-y-1">
                <label
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}
                >
                  Faction
                </label>
                <select
                  value={newPlanetFaction}
                  onChange={(e) => setNewPlanetFaction(e.target.value)}
                  className="holo-input w-full px-3 py-2 text-[13px]"
                >
                  {allFactions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[11px] uppercase tracking-wide holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Color</label>
                <input
                  type="color"
                  value={newPlanetColor}
                  onChange={(e) => setNewPlanetColor(e.target.value)}
                  className="w-8 h-8 border cursor-pointer bg-transparent"
                  style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: newPlanetColor }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newPlanetName.trim()) {
                      setPlacementMode(true, {
                        name: newPlanetName.trim(),
                        color: newPlanetColor,
                        faction: newPlanetFaction,
                      });
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
                    setNewPlanetFaction('neutral');
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

          {customCount > 0 && (
            <p className="text-[12px] mt-2" style={{ color: 'var(--holo-text-muted)' }}>
              {customCount} custom planet{customCount !== 1 ? 's' : ''} placed
            </p>
          )}
        </>
      )}
    </div>
  );
}
