import { useState } from 'react';
import { useGalaxyStore } from '@/store/galaxyStore';
import { useAuthStore } from '@/store/authStore';
import type { StarSystem, Fleet, Anomaly, Planet, Faction, InfoPanelData, ViewMode } from '@/types';
import {
  DEFAULT_TOPDOWN_FLEET_MARKER_SIZE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
} from '@/config/topDownMarkerConfig';

const FACTION_LABELS: Record<Faction, string> = {
  sith_empire: 'Sith Empire',
  galactic_republic: 'Galactic Republic',
  neutral: 'Neutral',
  contested: 'Contested',
  hutt_cartel: 'Hutt Cartel',
};

const FACTION_COLORS: Record<Faction, string> = {
  sith_empire: 'text-red-500',
  galactic_republic: 'text-yellow-400',
  neutral: 'text-gray-400',
  contested: 'text-orange-400',
  hutt_cartel: 'text-green-500',
};

function resolvePanelData({
  infoPanelData,
  viewMode,
  selectedSystemId,
  selectedPlanetId,
  selectedFleetId,
  systems,
  fleets,
}: {
  infoPanelData: InfoPanelData | null;
  viewMode: ViewMode;
  selectedSystemId: string | null;
  selectedPlanetId: string | null;
  selectedFleetId: string | null;
  systems: StarSystem[];
  fleets: Fleet[];
}): InfoPanelData | null {
  if (viewMode === 'system' && selectedSystemId) {
    const system = systems.find((s) => s.id === selectedSystemId);
    if (!system) return null;

    const selectedPlanet = selectedPlanetId
      ? system.planets.find((p) => p.id === selectedPlanetId)
      : null;
    if (selectedPlanet) {
      return { type: 'planet', data: selectedPlanet };
    }

    return system.planets[0]
      ? { type: 'planet', data: system.planets[0] }
      : { type: 'system', data: system };
  }

  if (viewMode === 'fleet' && selectedFleetId) {
    const selectedFleet = fleets.find((f) => f.id === selectedFleetId);
    return selectedFleet ? { type: 'fleet', data: selectedFleet } : null;
  }

  return infoPanelData;
}

export function InfoPanel() {
  const {
    infoPanelData,
    setInfoPanelData,
    setSelectedSystem,
    setSelectedPlanet,
    setSelectedFleet,
    viewMode,
    selectedSystemId,
    selectedPlanetId,
    selectedFleetId,
    systems,
    fleets,
  } = useGalaxyStore();

  const panelData = resolvePanelData({
    infoPanelData,
    viewMode,
    selectedSystemId,
    selectedPlanetId,
    selectedFleetId,
    systems,
    fleets,
  });
  if (!panelData) return null;

  const handleClose = () => {
    setInfoPanelData(null);
    switch (viewMode) {
      case 'system':
        setSelectedPlanet(null);
        setSelectedSystem(null);
        break;
      case 'fleet':
        setSelectedFleet(null);
        break;
      default:
        setSelectedSystem(null);
    }
  };

  const renderPanelContent = (data: InfoPanelData) => {
    switch (data.type) {
      case 'system':
        return <SystemInfo system={data.data} />;
      case 'planet':
        return <PlanetInfo planet={data.data} />;
      case 'fleet':
        return <FleetInfo fleet={data.data} />;
      case 'anomaly':
        return <AnomalyInfo anomaly={data.data} />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute right-4 top-4 z-50 w-96 max-h-[calc(100vh-2rem)] animate-slide-in-right">
      <div className="holo-panel max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="holo-close-button absolute -top-2 right-4 z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-4">{renderPanelContent(panelData)}</div>
      </div>
    </div>
  );
}

function SystemInfo({ system }: { system: StarSystem }) {
  const { removeCustomSystem, setInfoPanelData, setSelectedSystem, setSelectedPlanet, updateCustomSystemMarkerSize, viewMode } = useGalaxyStore();
  const { isAdmin } = useAuthStore();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-text-primary)' }}>{system.name}</h2>
        <div className="flex items-center gap-2">
          <span className={`holo-badge ${
            system.faction === 'sith_empire' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
            system.faction === 'galactic_republic' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
            system.faction === 'hutt_cartel' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}>
            {FACTION_LABELS[system.faction]}
          </span>
          {system.isCustom && (
            <span className="holo-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="holo-divider" />

      {/* Info grid */}
      <div className="holo-info-grid space-y-2">
        <InfoRow label="Region" value={formatRegion(system.region)} />
        <InfoRow label="Star Type" value={capitalizeFirst(system.starType)} />
        <InfoRow label="Importance" value={capitalizeFirst(system.importance)} />
      </div>

      {/* Marker Size — custom systems only */}
      {system.isCustom && isAdmin && viewMode === 'topdown' && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>Marker Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={system.markerSize ?? DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE}
              onChange={(e) => updateCustomSystemMarkerSize(system.id, parseFloat(e.target.value))}
              className="holo-slider flex-1"
            />
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--holo-text-primary)', width: '24px', textAlign: 'right' }}>
              {(system.markerSize ?? DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{system.description}</p>

      {/* Planets */}
      {system.planets.length > 0 && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>Planets ({system.planets.length})</label>
          <div className="space-y-1 mt-2">
            {system.planets.map(planet => (
              <div
                key={planet.id}
                className="holo-info-row group cursor-pointer hover:bg-amber-500/5 transition-colors"
                onClick={() => {
                  setSelectedPlanet(planet.id);
                  setInfoPanelData({ type: 'planet', data: planet });
                }}
              >
                <span className="text-sm group-hover:text-cyan-300 transition-colors" style={{ color: 'var(--holo-text-primary)' }}>{planet.name}</span>
                <span className="text-xs capitalize" style={{ color: 'var(--holo-text-muted)' }}>{planet.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notable locations */}
      {system.planets.length > 0 && system.planets[0].notable && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>Notable Locations</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {system.planets[0].notable.map((loc, i) => (
              <span
                key={i}
                className="holo-badge bg-cyan-900/30 border border-cyan-500/30 text-cyan-200"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hint to zoom in */}
      {system.planets.length > 0 && (
        <div className="text-xs text-center animate-pulse" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>
          Select a planet to open details
        </div>
      )}

      {/* Delete button for custom planets */}
      {system.isCustom && isAdmin && (
        <button
          onClick={() => {
            removeCustomSystem(system.id);
            setInfoPanelData(null);
            setSelectedSystem(null);
          }}
          className="w-full mt-2 px-4 py-2 border text-[12px] font-medium hover:bg-red-500/20 transition-colors"
          style={{
            borderColor: 'rgba(220, 20, 60, 0.3)',
            background: 'rgba(220, 20, 60, 0.08)',
            color: '#DC143C',
            fontFamily: 'Orbitron, monospace',
            fontSize: '10px',
            clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
          }}
        >
          Delete Custom Planet
        </button>
      )}
    </div>
  );
}

const FACTION_BAR_COLORS: Record<Faction, string> = {
  galactic_republic: '#C8AA6E',
  sith_empire: '#DC143C',
  hutt_cartel: '#8B9A46',
  neutral: '#808080',
  contested: '#FF8C00',
};

function PlanetInfo({ planet }: { planet: Planet }) {
  const { updatePlanetStats, systems, updateCustomSystemMarkerSize, viewMode } = useGalaxyStore();
  const { isAdmin } = useAuthStore();
  const [editingPopulation, setEditingPopulation] = useState(false);
  const [populationDraft, setPopulationDraft] = useState(planet.population || '');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(planet.description || '');
  const [editingClimate, setEditingClimate] = useState(false);
  const [climateDraft, setClimateDraft] = useState(planet.climate || '');
  const [editingTerrain, setEditingTerrain] = useState(false);
  const [terrainDraft, setTerrainDraft] = useState(planet.terrain || '');
  const [editingNotable, setEditingNotable] = useState(false);
  const [notableDraft, setNotableDraft] = useState((planet.notable || []).join(', '));

  const planetTypeColors: Record<string, string> = {
    terrestrial: 'text-green-400',
    gas_giant: 'text-orange-300',
    ice: 'text-blue-200',
    desert: 'text-yellow-600',
    volcanic: 'text-red-500',
    ocean: 'text-blue-400',
    jungle: 'text-green-500',
    city: 'text-gray-300',
    barren: 'text-gray-500',
    destroyed: 'text-red-400',
  };

  const factionControl = planet.factionControl || { [planet.faction]: 100 };
  const system = systems.find((s) => s.id === planet.systemId);
  const markerSize =
    system?.markerSize ??
    (system ? TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE[system.importance] : DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE);

  const handlePopulationSave = () => {
    if (!isAdmin) return;
    updatePlanetStats(planet.systemId, planet.id, { population: populationDraft });
    setEditingPopulation(false);
  };

  const handleControlChange = (faction: Faction, value: number) => {
    if (!isAdmin) return;
    const updated = { ...factionControl, [faction]: Math.max(0, Math.min(100, value)) };
    // Remove factions with 0%
    const cleaned: Partial<Record<Faction, number>> = {};
    for (const [f, v] of Object.entries(updated)) {
      if (v > 0) cleaned[f as Faction] = v;
    }
    updatePlanetStats(planet.systemId, planet.id, { factionControl: cleaned });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-text-primary)' }}>{planet.name}</h2>
        <span className={`holo-badge border border-white/10 bg-white/5 ${planetTypeColors[planet.type] || 'text-gray-400'}`}>
          {planet.type.replace('_', ' ')} World
        </span>
      </div>

      <div className="holo-divider" />

      {/* Faction */}
      <div className={`text-sm font-medium ${FACTION_COLORS[planet.faction]} flex items-center gap-2`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        <span className="w-2 h-2 bg-current" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 5px currentColor' }}></span>
        {FACTION_LABELS[planet.faction]} Territory
      </div>

      {/* Info grid */}
      <div className="holo-info-grid space-y-2">
        {/* Editable Climate */}
        <EditableInfoRow
          label="Climate"
          value={planet.climate || ''}
          placeholder="Unknown"
          editable={isAdmin}
          editing={editingClimate}
          draft={climateDraft}
          onStartEdit={() => { setClimateDraft(planet.climate || ''); setEditingClimate(true); }}
          onDraftChange={setClimateDraft}
          onSave={() => { updatePlanetStats(planet.systemId, planet.id, { climate: climateDraft }); setEditingClimate(false); }}
          onCancel={() => setEditingClimate(false)}
        />
        {/* Editable Terrain */}
        <EditableInfoRow
          label="Terrain"
          value={planet.terrain || ''}
          placeholder="Unknown"
          editable={isAdmin}
          editing={editingTerrain}
          draft={terrainDraft}
          onStartEdit={() => { setTerrainDraft(planet.terrain || ''); setEditingTerrain(true); }}
          onDraftChange={setTerrainDraft}
          onSave={() => { updatePlanetStats(planet.systemId, planet.id, { terrain: terrainDraft }); setEditingTerrain(false); }}
          onCancel={() => setEditingTerrain(false)}
        />
        {/* Editable Population */}
        <EditableInfoRow
          label="Population"
          value={planet.population || ''}
          placeholder="Unknown"
          editable={isAdmin}
          editing={editingPopulation}
          draft={populationDraft}
          onStartEdit={() => { setPopulationDraft(planet.population || ''); setEditingPopulation(true); }}
          onDraftChange={setPopulationDraft}
          onSave={() => { handlePopulationSave(); }}
          onCancel={() => setEditingPopulation(false)}
        />
      </div>

      {/* Faction Control Percentages */}
      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>Faction Control</label>
        {/* Visual bar */}
        <div className="flex h-3 mt-2 overflow-hidden" style={{ clipPath: 'polygon(2px 0%, calc(100% - 2px) 0%, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0% calc(100% - 2px), 0% 2px)' }}>
          {(Object.entries(factionControl) as [Faction, number][])
            .filter(([, v]) => v > 0)
            .map(([faction, pct]) => (
              <div
                key={faction}
                style={{
                  width: `${pct}%`,
                  backgroundColor: FACTION_BAR_COLORS[faction] || '#808080',
                  boxShadow: `inset 0 0 8px rgba(0,0,0,0.3), 0 0 4px ${FACTION_BAR_COLORS[faction]}40`,
                }}
              />
            ))}
        </div>
        {/* Editable faction sliders */}
        <div className="space-y-2 mt-3">
          {(Object.keys(FACTION_LABELS) as Faction[]).map((faction) => {
            const pct = factionControl[faction] || 0;
            if (pct === 0 && faction !== planet.faction) return null;
            return (
              <div key={faction} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 flex-shrink-0"
                  style={{ backgroundColor: FACTION_BAR_COLORS[faction], clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                />
                <span className="text-[10px] flex-1 truncate" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace' }}>
                  {FACTION_LABELS[faction]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => handleControlChange(faction, parseInt(e.target.value))}
                  disabled={!isAdmin}
                  className="holo-slider flex-shrink-0"
                  style={{ width: '80px', accentColor: FACTION_BAR_COLORS[faction] }}
                />
                <span className="text-[10px] w-8 text-right" style={{ color: 'var(--holo-text-primary)', fontFamily: 'Orbitron, monospace' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
          {/* Button to add another faction's control */}
          {isAdmin && Object.keys(FACTION_LABELS).filter(f => !factionControl[f as Faction]).length > 0 && (
            <AddFactionControl
              existingFactions={Object.keys(factionControl) as Faction[]}
              onAdd={(faction) => handleControlChange(faction, 10)}
            />
          )}
        </div>
      </div>

      {/* Editable Description */}
      <div>
        <label className="holo-label" style={{ marginBottom: '6px' }}>Description</label>
        {isAdmin && editingDescription ? (
          <div className="mt-1">
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  updatePlanetStats(planet.systemId, planet.id, { description: descriptionDraft });
                  setEditingDescription(false);
                }
                if (e.key === 'Escape') setEditingDescription(false);
              }}
              autoFocus
              rows={3}
              className="holo-input w-full text-sm"
              style={{ padding: '6px 8px', fontSize: '13px', fontFamily: 'Rajdhani, sans-serif', resize: 'vertical' }}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { updatePlanetStats(planet.systemId, planet.id, { description: descriptionDraft }); setEditingDescription(false); }}
                className="text-[9px] uppercase tracking-wide"
                style={{ color: 'var(--holo-cyan)', fontFamily: 'Orbitron, monospace' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingDescription(false)}
                className="text-[9px] uppercase tracking-wide"
                style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={
              isAdmin
                ? () => {
                    setDescriptionDraft(planet.description || '');
                    setEditingDescription(true);
                  }
                : undefined
            }
            className={`text-sm leading-relaxed${isAdmin ? ' cursor-pointer hover:underline' : ''}`}
            style={{ color: 'var(--holo-text-muted)', fontFamily: 'Rajdhani, sans-serif', textDecorationColor: 'var(--holo-cyan)' }}
            title={isAdmin ? 'Click to edit' : undefined}
          >
            {planet.description || 'No description'}
          </p>
        )}
      </div>

      {/* Per-selected system marker size (top-down view marker) */}
      {viewMode === 'topdown' && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>Top-Down Marker Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={markerSize}
              onChange={(e) => updateCustomSystemMarkerSize(planet.systemId, parseFloat(e.target.value))}
              className="holo-slider flex-1"
            />
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--holo-text-primary)', width: '24px', textAlign: 'right' }}>
              {markerSize.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Editable Notable Locations */}
      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>Points of Interest</label>
        {isAdmin && editingNotable ? (
          <div className="mt-1">
            <input
              type="text"
              value={notableDraft}
              onChange={(e) => setNotableDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const locations = notableDraft.split(',').map(s => s.trim()).filter(Boolean);
                  updatePlanetStats(planet.systemId, planet.id, { notable: locations });
                  setEditingNotable(false);
                }
                if (e.key === 'Escape') setEditingNotable(false);
              }}
              autoFocus
              placeholder="Location 1, Location 2, ..."
              className="holo-input w-full text-sm"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  const locations = notableDraft.split(',').map(s => s.trim()).filter(Boolean);
                  updatePlanetStats(planet.systemId, planet.id, { notable: locations });
                  setEditingNotable(false);
                }}
                className="text-[9px] uppercase tracking-wide"
                style={{ color: 'var(--holo-cyan)', fontFamily: 'Orbitron, monospace' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingNotable(false)}
                className="text-[9px] uppercase tracking-wide"
                style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={
              isAdmin
                ? () => {
                    setNotableDraft((planet.notable || []).join(', '));
                    setEditingNotable(true);
                  }
                : undefined
            }
            className={isAdmin ? 'cursor-pointer' : undefined}
            title={isAdmin ? 'Click to edit' : undefined}
          >
            {planet.notable && planet.notable.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {planet.notable.map((loc, i) => (
                  <span
                    key={i}
                    className="holo-badge bg-cyan-900/30 border border-cyan-500/30 text-cyan-200"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px]" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>
                {isAdmin ? 'Click to add locations' : 'No locations'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Special warnings */}
      {planet.type === 'destroyed' && (
        <div className="holo-info-grid" style={{ background: 'rgba(220, 20, 60, 0.08)', borderColor: 'rgba(220, 20, 60, 0.2)' }}>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--holo-crimson)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>WARNING: PLANETARY DESTRUCTION</span>
          </div>
        </div>
      )}

      {planet.type === 'volcanic' && (
        <div className="holo-info-grid" style={{ background: 'rgba(255, 140, 0, 0.08)', borderColor: 'rgba(255, 140, 0, 0.2)' }}>
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold" style={{ fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
            <span>EXTREME VOLCANIC ACTIVITY</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AddFactionControl({ existingFactions, onAdd }: { existingFactions: Faction[]; onAdd: (faction: Faction) => void }) {
  const [open, setOpen] = useState(false);
  const available = (Object.keys(FACTION_LABELS) as Faction[]).filter(f => !existingFactions.includes(f));

  if (available.length === 0) return null;

  return open ? (
    <div className="flex flex-wrap gap-1 mt-1">
      {available.map(faction => (
        <button
          key={faction}
          onClick={() => { onAdd(faction); setOpen(false); }}
          className="holo-badge text-[9px] cursor-pointer hover:bg-amber-500/10 transition-colors"
          style={{ borderColor: FACTION_BAR_COLORS[faction], color: FACTION_BAR_COLORS[faction] }}
        >
          + {FACTION_LABELS[faction]}
        </button>
      ))}
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="text-[9px] mt-1 hover:underline"
      style={{ color: 'var(--holo-cyan)', fontFamily: 'Orbitron, monospace' }}
    >
      + Add Faction Influence
    </button>
  );
}

function FleetInfo({ fleet }: { fleet: Fleet }) {
  const { removeCustomFleet, setInfoPanelData, setSelectedFleet, updateFleetMarkerSize, viewMode } = useGalaxyStore();
  const { isAdmin } = useAuthStore();
  const markerSize = fleet.markerSize ?? DEFAULT_TOPDOWN_FLEET_MARKER_SIZE;

  // Segmented meter for fleet strength
  const totalSegments = 10;
  const filledSegments = Math.min(Math.ceil(fleet.shipCount / 20), totalSegments);
  const segmentColor = fleet.faction === 'sith_empire' ? 'var(--holo-crimson)' : fleet.faction === 'hutt_cartel' ? '#8B9A46' : 'var(--holo-amber)';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 animate-pulse"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              backgroundColor: fleet.faction === 'sith_empire' ? '#DC143C' : fleet.faction === 'galactic_republic' ? '#C8AA6E' : fleet.faction === 'hutt_cartel' ? '#8B9A46' : '#808080',
              boxShadow: fleet.faction === 'sith_empire' ? '0 0 8px rgba(220,20,60,0.5)' : fleet.faction === 'hutt_cartel' ? '0 0 8px rgba(139,154,70,0.5)' : '0 0 8px rgba(200,170,110,0.5)',
            }}
          />
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-text-primary)' }}>{fleet.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`holo-badge ${
            fleet.faction === 'sith_empire' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
            fleet.faction === 'galactic_republic' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
            fleet.faction === 'hutt_cartel' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}>
            {FACTION_LABELS[fleet.faction]}
          </span>
          {fleet.isCustom && (
            <span className="holo-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="holo-divider" />

      {/* Info grid */}
      <div className="holo-info-grid space-y-2">
        <InfoRow label="Ship Count" value={`${fleet.shipCount} Vessels`} />
        {fleet.flagship && <InfoRow label="Flagship" value={fleet.flagship} />}
        {fleet.commander && <InfoRow label="Commander" value={fleet.commander} />}
      </div>

      {viewMode === 'topdown' && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>Top-Down Marker Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={markerSize}
              onChange={(e) => updateFleetMarkerSize(fleet.id, parseFloat(e.target.value))}
              className="holo-slider flex-1"
            />
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: 'var(--holo-text-primary)', width: '24px', textAlign: 'right' }}>
              {markerSize.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Fleet strength — KOTOR segmented meter */}
      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>Fleet Strength</label>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-3 transition-all duration-300"
              style={{
                background: i < filledSegments ? segmentColor : 'rgba(200, 170, 110, 0.08)',
                border: `1px solid ${i < filledSegments ? segmentColor : 'rgba(200, 170, 110, 0.15)'}`,
                boxShadow: i < filledSegments ? `0 0 6px ${segmentColor}40` : 'none',
                clipPath: 'polygon(2px 0%, calc(100% - 2px) 0%, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0% calc(100% - 2px), 0% 2px)',
                opacity: i < filledSegments ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <div className="text-xs mt-1 text-right" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>
          {fleet.shipCount < 50 ? 'Light' : fleet.shipCount < 100 ? 'Medium' : 'Heavy'} Task Force
        </div>
      </div>

      {/* Delete button for custom fleets */}
      {fleet.isCustom && isAdmin && (
        <button
          onClick={() => {
            removeCustomFleet(fleet.id);
            setInfoPanelData(null);
            setSelectedFleet(null);
          }}
          className="w-full mt-2 px-4 py-2 border text-[12px] font-medium hover:bg-red-500/20 transition-colors"
          style={{
            borderColor: 'rgba(220, 20, 60, 0.3)',
            background: 'rgba(220, 20, 60, 0.08)',
            color: '#DC143C',
            fontFamily: 'Orbitron, monospace',
            fontSize: '10px',
            clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
          }}
        >
          Delete Custom Fleet
        </button>
      )}
    </div>
  );
}

function AnomalyInfo({ anomaly }: { anomaly: Anomaly }) {
  const typeColors: Record<string, string> = {
    nebula: 'text-purple-400',
    black_hole: 'text-orange-400',
    space_station: 'text-cyan-400',
    hyperspace_lane: 'text-blue-400',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-text-primary)' }}>{anomaly.name}</h2>
        <span className={`holo-badge border border-white/10 bg-white/5 ${typeColors[anomaly.type] || 'text-gray-400'}`}>
          {anomaly.type.replace('_', ' ')}
        </span>
      </div>

      <div className="holo-divider" />

      {/* Info */}
      <div className="holo-info-grid">
        <InfoRow label="Radius" value={`${anomaly.radius} parsecs`} />
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--holo-text-muted)', fontFamily: 'Rajdhani, sans-serif' }}>{anomaly.description}</p>

      {/* Warning for dangerous anomalies */}
      {(anomaly.type === 'black_hole' || anomaly.type === 'nebula') && (
        <div className="holo-info-grid" style={{ background: 'rgba(200, 170, 110, 0.06)', borderColor: 'rgba(200, 170, 110, 0.2)' }}>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--holo-amber)', fontFamily: 'Orbitron, monospace', fontSize: '9px' }}>
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

function EditableInfoRow({
  label,
  value,
  placeholder,
  editable = true,
  editing,
  draft,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  placeholder: string;
  editable?: boolean;
  editing: boolean;
  draft: string;
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '10px' }}>{label}</span>
      {!editable ? (
        <span style={{ color: 'var(--holo-text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {value || placeholder}
        </span>
      ) : editing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            autoFocus
            className="holo-input w-28 text-right"
            style={{ padding: '2px 6px', fontSize: '12px' }}
          />
          <button onClick={onSave} className="text-xs px-1" style={{ color: 'var(--holo-cyan)' }}>
            &#10003;
          </button>
        </div>
      ) : (
        <span
          onClick={onStartEdit}
          className="cursor-pointer hover:underline"
          style={{ color: 'var(--holo-text-primary)', fontFamily: 'Rajdhani, sans-serif', textDecorationColor: 'var(--holo-cyan)' }}
          title="Click to edit"
        >
          {value || placeholder}
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--holo-text-muted)', fontFamily: 'Orbitron, monospace', fontSize: '10px' }}>{label}</span>
      <span style={{ color: 'var(--holo-text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>{value}</span>
    </div>
  );
}

function formatRegion(region: string): string {
  return region.split('_').map(capitalizeFirst).join(' ');
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
