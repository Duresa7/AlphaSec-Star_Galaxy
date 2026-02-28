import { useState } from 'react';
import type { Planet, PlanetType } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
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
  const allFactions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);
  const getFactionIds = useFactionStore((s) => s.getFactionIds);

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

  const handleControlChange = (faction: string, value: number) => {
    const updated = normalizeFactionControl({
      current: factionControl,
      editedFaction: faction,
      editedValue: value,
      factionOrder: getFactionIds(),
    });
    const cleaned: Partial<Record<string, number>> = {};
    for (const [f, v] of Object.entries(updated)) {
      if (v && v > 0) cleaned[f] = v;
    }

    let dominantFaction: string = planet.faction;
    let maxPct = 0;
    for (const [f, v] of Object.entries(cleaned) as [string, number][]) {
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

      <div className="holo-faction-territory" style={{ color: getFactionBarColor(planet.faction) }}>
        <span className="holo-faction-dot" style={{ backgroundColor: getFactionBarColor(planet.faction) }} />
        {getFactionLabel(planet.faction)} Territory
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
          <label className="holo-label holo-section-label">Planet Color</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="color"
              value={planet.customColor || (PLANET_APPEARANCES[planet.type as PlanetType] || PLANET_APPEARANCES.terrestrial).color}
              onChange={(e) => updatePlanetStats(planet.systemId, planet.id, { customColor: e.target.value })}
              className="holo-color-input"
            />
            <span className="holo-color-mode-label">
              {planet.customColor ? 'Custom' : 'Type Default'}
            </span>
            {planet.customColor && (
              <button
                onClick={() => updatePlanetStats(planet.systemId, planet.id, { customColor: null })}
                className="holo-inline-link"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="holo-label holo-section-label">Faction Control</label>

        <div className="holo-control-meter">
          {(Object.entries(factionControl) as [string, number][])
            .filter(([, v]) => v > 0)
            .map(([faction, pct]) => (
              <div
                key={faction}
                className="holo-control-segment"
                style={{
                  width: `${pct}%`,
                  backgroundColor: getFactionBarColor(faction),
                }}
              />
            ))}
        </div>

        <div className="space-y-2 mt-3">
          {allFactions.map((f) => {
            const pct = factionControl[f.id] || 0;
            if (pct === 0 && f.id !== planet.faction) return null;
            return (
              <div key={f.id} className="holo-faction-row">
                <span
                  className="holo-faction-dot"
                  style={{ backgroundColor: getFactionBarColor(f.id) }}
                />
                <span className="holo-faction-name">
                  {getFactionLabel(f.id)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => handleControlChange(f.id, parseInt(e.target.value))}
                  disabled={!editable}
                  className="holo-slider holo-faction-slider"
                  style={{ accentColor: getFactionBarColor(f.id) }}
                />
                <span className="holo-faction-value">
                  {pct}%
                </span>
              </div>
            );
          })}

          {editable && allFactions.filter(f => !factionControl[f.id]).length > 0 && (
            <AddFactionControl
              existingFactions={Object.keys(factionControl)}
              onAdd={(faction) => handleControlChange(faction, 10)}
            />
          )}
        </div>
      </div>

      <div>
        <label className="holo-label holo-section-label-tight">Description</label>
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
              className="holo-input holo-field-textarea w-full"
            />
            <div className="holo-edit-actions">
              <button
                onClick={() => { updatePlanetStats(planet.systemId, planet.id, { description: descriptionDraft }); setEditingDescription(false); }}
                className="holo-edit-action holo-edit-action-save"
              >
                Save
              </button>
              <button
                onClick={() => setEditingDescription(false)}
                className="holo-edit-action holo-edit-action-cancel"
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
            className={`text-sm leading-relaxed holo-body-text holo-editable-text${editable ? ' cursor-pointer hover:underline' : ''}`}
            title={editable ? 'Click to edit' : undefined}
          >
            {planet.description || 'No description'}
          </p>
        )}
      </div>

      {editable && viewMode === 'topdown' && (
        <div>
          <label className="holo-label holo-section-label">Top-Down Marker Size</label>
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
            <span className="holo-marker-value">
              {markerSize.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="holo-label holo-section-label">Points of Interest</label>
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
              className="holo-input holo-field-input w-full text-sm"
            />
            <div className="holo-edit-actions">
              <button
                onClick={() => {
                  const locations = notableDraft.split(',').map(s => s.trim()).filter(Boolean);
                  updatePlanetStats(planet.systemId, planet.id, { notable: locations });
                  setEditingNotable(false);
                }}
                className="holo-edit-action holo-edit-action-save"
              >
                Save
              </button>
              <button
                onClick={() => setEditingNotable(false)}
                className="holo-edit-action holo-edit-action-cancel"
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
        <div className="holo-info-grid holo-info-grid-danger">
          <div className="holo-alert-row holo-alert-danger">
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
        <div className="holo-info-grid holo-info-grid-warning">
          <div className="holo-alert-row holo-alert-warning">
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
          className="holo-button holo-button-danger holo-button-sm w-full mt-2"
        >
          Delete Custom Planet
        </button>
      )}
    </div>
  );
}
