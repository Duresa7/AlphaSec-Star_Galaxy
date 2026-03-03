import { useState, useCallback, useMemo } from 'react';
import type { Planet, PlanetType } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { EditableStatCard, AddFactionControl } from '@/components/panels/infoPanelShared';
import { PLANET_APPEARANCES } from '@/components/galaxy/SystemDetailView';
import { normalizeFactionControl } from '@/utils/factionControl';
import {
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
} from '@/config/topDownMarkerConfig';

const PLANET_TYPE_COLORS: Record<string, string> = {
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

const DESCRIPTION_EXPAND_THRESHOLD = 100;

const POI_EXPAND_THRESHOLD = 6;

const SECTION_LABEL = 'holo-label tracking-widest text-white/50 text-[10px] uppercase';
const EDIT_TOGGLE_BTN =
  'text-[10px] uppercase tracking-wider text-white/30 hover:text-white/70 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100';
const SAVE_BTN_BASE = 'px-3 py-1 text-[11px] border rounded transition-colors uppercase tracking-wider';
const CANCEL_BTN = 'px-3 py-1 text-[11px] text-white/50 hover:text-white transition-colors uppercase tracking-wider';

interface PlanetInfoProps {
  planet: Planet;
  editable: boolean;
}

export function PlanetInfo({ planet, editable }: PlanetInfoProps) {
  const updatePlanetStats = useGalaxyDataStore((s) => s.updatePlanetStats);
  const systems = useGalaxyDataStore((s) => s.systems);
  const updateCustomSystemMarkerSize = useGalaxyDataStore((s) => s.updateCustomSystemMarkerSize);
  const removeCustomSystem = useGalaxyDataStore((s) => s.removeCustomSystem);

  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);

  const allFactions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);
  const getFactionIds = useFactionStore((s) => s.getFactionIds);

  const [editingClimate, setEditingClimate] = useState(false);
  const [climateDraft, setClimateDraft] = useState(planet.climate || '');

  const [editingTerrain, setEditingTerrain] = useState(false);
  const [terrainDraft, setTerrainDraft] = useState(planet.terrain || '');

  const [editingInhabitants, setEditingInhabitants] = useState(false);
  const [inhabitantsDraft, setInhabitantsDraft] = useState(planet.nativeInhabitants || '');

  const [editingPopulation, setEditingPopulation] = useState(false);
  const [populationDraft, setPopulationDraft] = useState(planet.population || '');

  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(planet.description || '');

  const [editingNotable, setEditingNotable] = useState(false);
  const [notableDraft, setNotableDraft] = useState((planet.notable || []).join(', '));

  const [expandedRecord, setExpandedRecord] = useState(false);
  const [expandedPOI, setExpandedPOI] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const [typeDraft, setTypeDraft] = useState(planet.customType || '');

  const [editingFaction, setEditingFaction] = useState(false);

  const factionControl = planet.factionControl || { [planet.faction]: 100 };
  const system = systems.find((s) => s.id === planet.systemId);

  const markerSize =
    system?.markerSize ??
    (system
      ? TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE[system.importance]
      : DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE);

  const sortedFactions = useMemo(
    () =>
      (Object.entries(factionControl) as [string, number][])
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a),
    [factionControl],
  );

  const defaultPlanetColor = useMemo(
    () => (PLANET_APPEARANCES[planet.type as PlanetType] || PLANET_APPEARANCES.terrestrial).color,
    [planet.type],
  );

  const badgeColorClass = PLANET_TYPE_COLORS[planet.type] ?? 'text-gray-400';
  const badgeBorderClass = PLANET_TYPE_COLORS[planet.type] ? 'border-current/30' : 'border-white/10';

  const updateStats = useCallback(
    (patch: Parameters<typeof updatePlanetStats>[2]) => {
      updatePlanetStats(planet.systemId, planet.id, patch);
    },
    [updatePlanetStats, planet.systemId, planet.id],
  );

  const handleControlChange = useCallback(
    (faction: string, value: number) => {
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

      let dominantFaction = planet.faction;
      let maxPct = 0;
      for (const [f, v] of Object.entries(cleaned) as [string, number][]) {
        if (v > maxPct) {
          maxPct = v;
          dominantFaction = f;
        }
      }

      updateStats({ factionControl: cleaned, faction: dominantFaction });
    },
    [factionControl, getFactionIds, planet.faction, updateStats],
  );

  const handleDeletePlanet = useCallback(() => {
    removeCustomSystem(planet.systemId);
    setInfoPanelData(null);
    setSelectedPlanet(null);
    setSelectedSystem(null);
  }, [removeCustomSystem, planet.systemId, setInfoPanelData, setSelectedPlanet, setSelectedSystem]);

  const parseNotable = (raw: string) =>
    raw.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-4">

      {/* ── 1. Header ────────────────────────────────────────────────────── */}
      <div className="pb-8 pt-2">
        <h2 className="text-3xl font-bold mb-3 tracking-wide text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          {planet.name}
        </h2>
        <div className="flex items-center gap-3">
          {editable && editingType ? (
            <input
              type="text"
              value={typeDraft}
              onChange={(e) => setTypeDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = typeDraft.trim();
                  updateStats({ customType: trimmed || null });
                  setEditingType(false);
                }
                if (e.key === 'Escape') setEditingType(false);
              }}
              onBlur={() => setEditingType(false)}
              autoFocus
              placeholder={planet.type.replace('_', ' ')}
              className="holo-input holo-field-input text-[11px] uppercase tracking-wider font-semibold px-3 py-1 bg-white/[0.02] border-white/10 focus:border-white/20 transition-colors w-36"
            />
          ) : (
            <span
              onClick={editable ? () => { setTypeDraft(planet.customType || ''); setEditingType(true); } : undefined}
              className={`holo-badge border px-3 py-1 font-semibold tracking-wider text-[11px] uppercase bg-white/5 ${badgeColorClass} ${badgeBorderClass} ${editable ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}`}
              title={editable ? 'Click to edit type' : undefined}
            >
              {planet.customType || planet.type.replace('_', ' ')}
            </span>
          )}
          <div
            className="holo-faction-territory text-[12px] font-medium tracking-wide flex items-center gap-2"
            style={{ color: getFactionBarColor(planet.faction) }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: getFactionBarColor(planet.faction) }}
            />
            {getFactionLabel(planet.faction)}
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4 mb-6" />

      {/* ── 2. Stats Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 pb-8">
        <EditableStatCard
          label="CLIMATE"
          value={planet.climate || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingClimate}
          draft={climateDraft}
          onStartEdit={() => { setClimateDraft(planet.climate || ''); setEditingClimate(true); }}
          onDraftChange={setClimateDraft}
          onSave={() => { updateStats({ climate: climateDraft }); setEditingClimate(false); }}
          onCancel={() => setEditingClimate(false)}
        />
        <EditableStatCard
          label="TERRAIN"
          value={planet.terrain || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingTerrain}
          draft={terrainDraft}
          onStartEdit={() => { setTerrainDraft(planet.terrain || ''); setEditingTerrain(true); }}
          onDraftChange={setTerrainDraft}
          onSave={() => { updateStats({ terrain: terrainDraft }); setEditingTerrain(false); }}
          onCancel={() => setEditingTerrain(false)}
        />
        <EditableStatCard
          label="NATIVE INHABITANTS"
          value={planet.nativeInhabitants || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingInhabitants}
          draft={inhabitantsDraft}
          onStartEdit={() => { setInhabitantsDraft(planet.nativeInhabitants || ''); setEditingInhabitants(true); }}
          onDraftChange={setInhabitantsDraft}
          onSave={() => { updateStats({ nativeInhabitants: inhabitantsDraft }); setEditingInhabitants(false); }}
          onCancel={() => setEditingInhabitants(false)}
        />
        <EditableStatCard
          label="POPULATION"
          value={planet.population || ''}
          placeholder="Unknown"
          editable={editable}
          editing={editingPopulation}
          draft={populationDraft}
          onStartEdit={() => { setPopulationDraft(planet.population || ''); setEditingPopulation(true); }}
          onDraftChange={setPopulationDraft}
          onSave={() => { updateStats({ population: populationDraft }); setEditingPopulation(false); }}
          onCancel={() => setEditingPopulation(false)}
        />
      </div>

      {/* ── 3. Planet Color (admin-only) ─────────────────────────────────── */}
      {editable && (
        <div className="pt-6">
          <label className={SECTION_LABEL}>Planet Color</label>
          <div className="flex items-center gap-3 mt-4">
            <input
              type="color"
              value={planet.customColor || defaultPlanetColor}
              onChange={(e) => updateStats({ customColor: e.target.value })}
              className="holo-color-input"
            />
            <span className="holo-color-mode-label">
              {planet.customColor ? 'Custom' : 'Type Default'}
            </span>
            {planet.customColor && (
              <button
                onClick={() => updateStats({ customColor: null })}
                className="holo-inline-link"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Faction Control ───────────────────────────────────────────── */}
      <div className="pt-8 pb-8 group">
        <div className="flex justify-between items-center mb-8">
          <h3 className={SECTION_LABEL}>Faction Control</h3>
          {editable && (
            <button onClick={() => setEditingFaction(!editingFaction)} className={EDIT_TOGGLE_BTN}>
              {editingFaction ? 'Done' : 'Edit Influence'}
            </button>
          )}
        </div>

        {/* Influence bar */}
        <div className="holo-control-meter h-1.5 rounded-full overflow-hidden bg-white/5 mb-3 flex">
          {sortedFactions.map(([faction, pct]) => (
            <div
              key={faction}
              className="h-full transition-all duration-500 ease-out shadow-[0_0_10px_currentColor]"
              style={{
                width: `${pct}%`,
                backgroundColor: getFactionBarColor(faction),
                color: getFactionBarColor(faction),
              }}
            />
          ))}
        </div>

        {/* Summary vs. Edit mode */}
        {!editingFaction ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {sortedFactions.map(([faction, pct]) => (
              <div key={faction} className="flex items-center gap-1.5 text-[12px]">
                <span
                  className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]"
                  style={{ backgroundColor: getFactionBarColor(faction), color: getFactionBarColor(faction) }}
                />
                <span className="text-white/60">{getFactionLabel(faction)}</span>
                <span className="font-semibold" style={{ color: getFactionBarColor(faction) }}>{pct}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {allFactions.map((f) => {
              const pct = factionControl[f.id] || 0;
              if (pct === 0 && f.id !== planet.faction) return null;

              return (
                <div key={f.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]"
                        style={{ backgroundColor: getFactionBarColor(f.id), color: getFactionBarColor(f.id) }}
                      />
                      <span className="text-white/80">{getFactionLabel(f.id)}</span>
                    </span>
                    <span className="font-bold" style={{ color: getFactionBarColor(f.id) }}>
                      {pct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={pct}
                    onChange={(e) => handleControlChange(f.id, parseInt(e.target.value))}
                    className="holo-slider w-full"
                    style={{ accentColor: getFactionBarColor(f.id) }}
                  />
                </div>
              );
            })}

            {allFactions.filter((f) => !factionControl[f.id]).length > 0 && (
              <div className="pt-2">
                <AddFactionControl
                  existingFactions={Object.keys(factionControl)}
                  onAdd={(faction) => handleControlChange(faction, 10)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 5. Planetary Record ──────────────────────────────────────────── */}
      <div className="pt-8 group">
        <div className="flex justify-between items-center mb-4">
          <h3 className={SECTION_LABEL}>Planetary Record</h3>
        </div>

        {editable && editingDescription ? (
          <div className="mt-1">
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  updateStats({ description: descriptionDraft });
                  setEditingDescription(false);
                }
                if (e.key === 'Escape') setEditingDescription(false);
              }}
              autoFocus
              rows={4}
              className="holo-input holo-field-textarea w-full text-[14px] leading-relaxed p-3 bg-white/[0.02] border-white/5 focus:border-white/20 transition-colors"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setEditingDescription(false)} className={CANCEL_BTN}>
                Cancel
              </button>
              <button
                onClick={() => { updateStats({ description: descriptionDraft }); setEditingDescription(false); }}
                className={`${SAVE_BTN_BASE} bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              onClick={editable ? () => { setDescriptionDraft(planet.description || ''); setEditingDescription(true); } : undefined}
              className={`text-[13px] leading-relaxed text-white/80 ${
                !expandedRecord ? 'line-clamp-2' : ''
              } ${editable ? 'cursor-text hover:text-white transition-colors' : ''}`}
              title={editable ? 'Click to edit' : undefined}
            >
              {planet.description || <span className="text-white/30 italic">No planetary records found.</span>}
            </div>

            {planet.description && planet.description.length > DESCRIPTION_EXPAND_THRESHOLD && (
              <button
                onClick={() => setExpandedRecord(!expandedRecord)}
                className="text-[10px] text-amber-500/70 hover:text-amber-400 uppercase tracking-widest mt-1.5 transition-colors"
              >
                {expandedRecord ? 'Show Less' : 'Read More'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 6. Top-Down Marker Size (admin + topdown only) ───────────────── */}
      {editable && viewMode === 'topdown' && (
        <div className="pt-8">
          <label className={`${SECTION_LABEL} mb-4 block`}>Top-Down Marker Size</label>
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
            <span className="holo-marker-value">{markerSize.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* ── 7. Points of Interest ────────────────────────────────────────── */}
      <div className="pt-8 group">
        <div className="flex justify-between items-center mb-4">
          <h3 className={SECTION_LABEL}>Points of Interest</h3>
        </div>

        {editable && editingNotable ? (
          <div className="mt-1">
            <input
              type="text"
              value={notableDraft}
              onChange={(e) => setNotableDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateStats({ notable: parseNotable(notableDraft) });
                  setEditingNotable(false);
                }
                if (e.key === 'Escape') setEditingNotable(false);
              }}
              autoFocus
              placeholder="Coordinates / Locations (comma separated)"
              className="holo-input holo-field-input w-full text-[13px] p-2 bg-white/[0.02] border-white/5 focus:border-white/20 transition-colors"
            />
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setEditingNotable(false)} className={CANCEL_BTN}>
                Cancel
              </button>
              <button
                onClick={() => { updateStats({ notable: parseNotable(notableDraft) }); setEditingNotable(false); }}
                className={`${SAVE_BTN_BASE} bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border-cyan-500/20`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              onClick={editable ? () => { setNotableDraft((planet.notable || []).join(', ')); setEditingNotable(true); } : undefined}
              className={`min-h-[1.5rem] ${editable ? 'cursor-text' : ''}`}
              title={editable ? 'Click to edit' : undefined}
            >
              {planet.notable && planet.notable.length > 0 ? (
                <div className={`flex flex-wrap gap-2 ${!expandedPOI ? 'max-h-[56px] overflow-hidden' : ''}`}>
                  {planet.notable.map((loc, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[12px] rounded bg-white/[0.03] border border-white/5 text-white/70 flex items-center gap-1.5 transition-colors hover:text-white hover:bg-white/[0.06]"
                    >
                      <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {loc}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-white/30 italic text-[13px]">
                  {editable ? 'Click to register locations...' : 'No surface data available.'}
                </span>
              )}
            </div>

            {planet.notable && planet.notable.length > POI_EXPAND_THRESHOLD && (
              <button
                onClick={() => setExpandedPOI(!expandedPOI)}
                className="text-[10px] text-cyan-500/70 hover:text-cyan-400 uppercase tracking-widest mt-2 transition-colors"
              >
                {expandedPOI ? 'Show Less' : `View All ${planet.notable.length} Locations`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 8. Alerts ────────────────────────────────────────────────────── */}
      {planet.type === 'destroyed' && (
        <div className="holo-info-grid holo-info-grid-danger mt-4">
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
        <div className="holo-info-grid holo-info-grid-warning mt-4">
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

      {/* ── 9. Danger Zone (admin + custom only) ─────────────────────────── */}
      {editable && system?.isCustom && (
        <div className="mt-12 pt-8 pb-4 text-center opacity-30 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleDeletePlanet}
            className="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest font-semibold"
          >
            Delete Custom Planet
          </button>
        </div>
      )}
    </div>
  );
}
