import { useState } from 'react';
import type { Planet, Faction, PlanetType } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { FACTION_LABELS, FACTION_BAR_COLORS, FACTION_TEXT_CLASSES } from '@/constants/factions';
import { EditableInfoRow, AddFactionControl } from '@/components/panels/infoPanelShared';
import { PLANET_APPEARANCES } from '@/components/galaxy/SystemDetailView';
import { normalizeFactionControl } from '@/utils/factionControl';
import {
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
} from '@/config/topDownMarkerConfig';

export function PlanetInfo({ planet, editable }: { planet: Planet; editable: boolean }) {
  const updatePlanetStats = useGalaxyDataStore((s) => s.updatePlanetStats);
  const systems = useGalaxyDataStore((s) => s.systems);
  const updateCustomSystemMarkerSize = useGalaxyDataStore((s) => s.updateCustomSystemMarkerSize);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const removeCustomSystem = useGalaxyDataStore((s) => s.removeCustomSystem);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);

  const [editingPopulation, setEditingPopulation] = useState(false);
  const [populationDraft, setPopulationDraft] = useState(planet.population || '');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(planet.description || '');
  const [editingClimate, setEditingClimate] = useState(false);
  const [climateDraft, setClimateDraft] = useState(planet.climate || '');
  const [editingTerrain, setEditingTerrain] = useState(false);
  const [terrainDraft, setTerrainDraft] = useState(planet.terrain || '');
  const [editingInhabitants, setEditingInhabitants] = useState(false);
  const [inhabitantsDraft, setInhabitantsDraft] = useState(planet.nativeInhabitants || '');
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
    updatePlanetStats(planet.systemId, planet.id, { population: populationDraft });
    setEditingPopulation(false);
  };

  const handleControlChange = (faction: Faction, value: number) => {
    const updated = normalizeFactionControl({
      current: factionControl,
      editedFaction: faction,
      editedValue: value,
    });
    const cleaned: Partial<Record<Faction, number>> = {};
    for (const [f, v] of Object.entries(updated)) {
      if (v > 0) cleaned[f as Faction] = v;
    }

    let dominantFaction: Faction = planet.faction;
    let maxPct = 0;
    for (const [f, v] of Object.entries(cleaned) as [Faction, number][]) {
      if (v > maxPct) {
        maxPct = v;
        dominantFaction = f;
      }
    }

    updatePlanetStats(planet.systemId, planet.id, {
      factionControl: cleaned,
      faction: dominantFaction,
    });
  };

  return (
    <div className="space-y-4">

      <div className="pb-3">
        <h2 className="text-xl font-semibold mb-2 holo-heading">{planet.name}</h2>
        <span className={`holo-badge border border-white/10 bg-white/5 ${planetTypeColors[planet.type] || 'text-gray-400'}`}>
          {planet.type.replace('_', ' ')} World
        </span>
      </div>

      <div className="holo-divider" />

      <div className={`text-[14px] font-medium ${FACTION_TEXT_CLASSES[planet.faction]} flex items-center gap-2`} style={{ fontFamily: '"Spline Sans", Manrope, sans-serif' }}>
        <span className="w-2 h-2 bg-current rounded-full"></span>
        {FACTION_LABELS[planet.faction]} Territory
      </div>

      <div className="holo-info-grid space-y-2">
        <EditableInfoRow
          label="Climate"
          value={planet.climate || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingClimate}
          draft={climateDraft}
          onStartEdit={() => { setClimateDraft(planet.climate || ''); setEditingClimate(true); }}
          onDraftChange={setClimateDraft}
          onSave={() => { updatePlanetStats(planet.systemId, planet.id, { climate: climateDraft }); setEditingClimate(false); }}
          onCancel={() => setEditingClimate(false)}
        />
        <EditableInfoRow
          label="Terrain"
          value={planet.terrain || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingTerrain}
          draft={terrainDraft}
          onStartEdit={() => { setTerrainDraft(planet.terrain || ''); setEditingTerrain(true); }}
          onDraftChange={setTerrainDraft}
          onSave={() => { updatePlanetStats(planet.systemId, planet.id, { terrain: terrainDraft }); setEditingTerrain(false); }}
          onCancel={() => setEditingTerrain(false)}
        />
        <EditableInfoRow
          label="Native Inhabitants"
          value={planet.nativeInhabitants || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingInhabitants}
          draft={inhabitantsDraft}
          onStartEdit={() => { setInhabitantsDraft(planet.nativeInhabitants || ''); setEditingInhabitants(true); }}
          onDraftChange={setInhabitantsDraft}
          onSave={() => { updatePlanetStats(planet.systemId, planet.id, { nativeInhabitants: inhabitantsDraft }); setEditingInhabitants(false); }}
          onCancel={() => setEditingInhabitants(false)}
        />
        <EditableInfoRow
          label="Population"
          value={planet.population || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingPopulation}
          draft={populationDraft}
          onStartEdit={() => { setPopulationDraft(planet.population || ''); setEditingPopulation(true); }}
          onDraftChange={setPopulationDraft}
          onSave={() => { handlePopulationSave(); }}
          onCancel={() => setEditingPopulation(false)}
        />
      </div>

      {editable && (
        <div>
          <label className="holo-label" style={{ marginBottom: '8px' }}>Planet Color</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="color"
              value={planet.customColor || (PLANET_APPEARANCES[planet.type as PlanetType] || PLANET_APPEARANCES.terrestrial).color}
              onChange={(e) => updatePlanetStats(planet.systemId, planet.id, { customColor: e.target.value })}
              className="w-8 h-8 border cursor-pointer bg-transparent"
              style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
            />
            <span className="text-[11px] flex-1 holo-label-orbitron" style={{ color: 'var(--holo-text-muted)', fontSize: '9px' }}>
              {planet.customColor ? 'Custom' : 'Type Default'}
            </span>
            {planet.customColor && (
              <button
                onClick={() => updatePlanetStats(planet.systemId, planet.id, { customColor: null })}
                className="text-[9px] uppercase tracking-wide hover:underline holo-label-orbitron"
                style={{ color: 'var(--holo-cyan)' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>Faction Control</label>

        <div className="flex h-3 mt-2 overflow-hidden" style={{ borderRadius: '4px' }}>
          {(Object.entries(factionControl) as [Faction, number][])
            .filter(([, v]) => v > 0)
            .map(([faction, pct]) => (
              <div
                key={faction}
                style={{
                  width: `${pct}%`,
                  backgroundColor: FACTION_BAR_COLORS[faction] || '#808080',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)',
                }}
              />
            ))}
        </div>

        <div className="space-y-2 mt-3">
          {(Object.keys(FACTION_LABELS) as Faction[]).map((faction) => {
            const pct = factionControl[faction] || 0;
            if (pct === 0 && faction !== planet.faction) return null;
            return (
              <div key={faction} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 flex-shrink-0"
                  style={{ backgroundColor: FACTION_BAR_COLORS[faction], borderRadius: '50%' }}
                />
                <span className="text-[10px] flex-1 truncate holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>
                  {FACTION_LABELS[faction]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => handleControlChange(faction, parseInt(e.target.value))}
                  disabled={!editable}
                  className="holo-slider flex-shrink-0"
                  style={{ width: '140px', accentColor: FACTION_BAR_COLORS[faction] }}
                />
                <span className="text-[10px] w-8 text-right holo-label-orbitron" style={{ color: 'var(--holo-text-primary)' }}>
                  {pct}%
                </span>
              </div>
            );
          })}

          {editable && Object.keys(FACTION_LABELS).filter(f => !factionControl[f as Faction]).length > 0 && (
            <AddFactionControl
              existingFactions={Object.keys(factionControl) as Faction[]}
              onAdd={(faction) => handleControlChange(faction, 10)}
            />
          )}
        </div>
      </div>

      <div>
        <label className="holo-label" style={{ marginBottom: '6px' }}>Description</label>
        {editable && editingDescription ? (
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
              style={{ padding: '6px 8px', fontSize: '13px', fontFamily: '"Forum", Rajdhani, serif', resize: 'vertical' }}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { updatePlanetStats(planet.systemId, planet.id, { description: descriptionDraft }); setEditingDescription(false); }}
                className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                style={{ color: 'var(--holo-cyan)' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingDescription(false)}
                className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                style={{ color: 'var(--holo-text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={editable ? () => {
              setDescriptionDraft(planet.description || '');
              setEditingDescription(true);
            } : undefined}
            className={`text-sm leading-relaxed holo-body-text${editable ? ' cursor-pointer hover:underline' : ''}`}
            style={{ textDecorationColor: 'var(--holo-cyan)' }}
            title={editable ? 'Click to edit' : undefined}
          >
            {planet.description || 'No description'}
          </p>
        )}
      </div>

      {editable && viewMode === 'topdown' && (
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
            <span className="holo-label-orbitron" style={{ color: 'var(--holo-text-primary)', width: '24px', textAlign: 'right' }}>
              {markerSize.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>Points of Interest</label>
        {editable && editingNotable ? (
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
                className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                style={{ color: 'var(--holo-cyan)' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingNotable(false)}
                className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                style={{ color: 'var(--holo-text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={editable ? () => {
              setNotableDraft((planet.notable || []).join(', '));
              setEditingNotable(true);
            } : undefined}
            className={editable ? 'cursor-pointer' : ''}
            title={editable ? 'Click to edit' : undefined}
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
              <span className="text-[11px] holo-body-text">
                {editable ? 'Click to add locations' : 'No known locations'}
              </span>
            )}
          </div>
        )}
      </div>

      {planet.type === 'destroyed' && (
        <div className="holo-info-grid" style={{ background: 'rgba(220, 20, 60, 0.08)', borderColor: 'rgba(220, 20, 60, 0.2)' }}>
          <div className="flex items-center gap-2 text-xs font-bold holo-label-orbitron" style={{ color: 'var(--holo-crimson)', fontSize: '9px' }}>
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
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold holo-label-orbitron" style={{ fontSize: '9px' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
            </svg>
            <span>EXTREME VOLCANIC ACTIVITY</span>
          </div>
        </div>
      )}

      {editable && system?.isCustom && (
        <button
          onClick={() => {
            removeCustomSystem(planet.systemId);
            setInfoPanelData(null);
            setSelectedPlanet(null);
            setSelectedSystem(null);
          }}
          className="w-full mt-2 px-4 py-2 border text-[12px] font-medium hover:bg-red-500/20 transition-colors"
          style={{
            borderColor: 'rgba(220, 20, 60, 0.25)',
            background: 'rgba(220, 20, 60, 0.06)',
            color: '#DC143C',
            fontFamily: 'Orbitron, monospace',
            fontSize: '10px',
            borderRadius: '8px',
          }}
        >
          Delete Custom Planet
        </button>
      )}
    </div>
  );
}
