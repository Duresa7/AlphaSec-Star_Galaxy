import { useState } from 'react';
import type { Fleet, ShipModelType } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import {
  FLEET_STRENGTH_SEGMENTS,
  FLEET_STRENGTH_DIVISOR,
  FLEET_STRENGTH_LIGHT_THRESHOLD,
  FLEET_STRENGTH_HEAVY_THRESHOLD,
} from '@/constants/factions';
import { EditableInfoRow, InfoRow } from '@/components/panels/infoPanelShared';
import { DEFAULT_TOPDOWN_FLEET_MARKER_SIZE } from '@/config/topDownMarkerConfig';

const MODEL_TYPE_LABELS: Record<ShipModelType, string> = {
  republic: 'Republic',
  sith: 'Sith',
  venator: 'Venator',
  valor: 'Valor',
};

export function FleetInfo({ fleet, editable }: { fleet: Fleet; editable: boolean }) {
  const removeCustomFleet = useGalaxyDataStore((s) => s.removeCustomFleet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const updateFleetMarkerSize = useGalaxyDataStore((s) => s.updateFleetMarkerSize);
  const updateFleetStats = useGalaxyDataStore((s) => s.updateFleetStats);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const allFactions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(fleet.name);
  const [editingShipCount, setEditingShipCount] = useState(false);
  const [shipCountDraft, setShipCountDraft] = useState(String(fleet.shipCount));

  const markerSize = fleet.markerSize ?? DEFAULT_TOPDOWN_FLEET_MARKER_SIZE;
  const filledSegments = Math.min(Math.ceil(fleet.shipCount / FLEET_STRENGTH_DIVISOR), FLEET_STRENGTH_SEGMENTS);
  const segmentColor = getFactionBarColor(fleet.faction);

  return (
    <div className="space-y-4">

      <div className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: getFactionBarColor(fleet.faction) }}
          />
          <h2 className="text-xl font-semibold holo-heading">{fleet.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="holo-badge border"
            style={{
              backgroundColor: `${getFactionBarColor(fleet.faction)}33`,
              color: getFactionBarColor(fleet.faction),
              borderColor: `${getFactionBarColor(fleet.faction)}4D`,
            }}
          >
            {getFactionLabel(fleet.faction)}
          </span>
          {fleet.isCustom && (
            <span className="holo-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Custom
            </span>
          )}
        </div>
      </div>

      <div className="holo-divider" />

      <div className="holo-info-grid space-y-2">
        {editable && fleet.isCustom ? (
          <>
            <EditableInfoRow
              label="Name"
              value={fleet.name}
              placeholder="Fleet Name"
              editable
              editing={editingName}
              draft={nameDraft}
              onStartEdit={() => { setEditingName(true); setNameDraft(fleet.name); }}
              onDraftChange={setNameDraft}
              onSave={() => {
                if (nameDraft.trim()) updateFleetStats(fleet.id, { name: nameDraft.trim() });
                setEditingName(false);
              }}
              onCancel={() => setEditingName(false)}
            />
            <EditableInfoRow
              label="Ships"
              value={`${fleet.shipCount} Vessels`}
              placeholder="10"
              editable
              editing={editingShipCount}
              draft={shipCountDraft}
              onStartEdit={() => { setEditingShipCount(true); setShipCountDraft(String(fleet.shipCount)); }}
              onDraftChange={setShipCountDraft}
              onSave={() => {
                const parsed = parseInt(shipCountDraft, 10);
                if (!isNaN(parsed) && parsed > 0) updateFleetStats(fleet.id, { shipCount: parsed });
                setEditingShipCount(false);
              }}
              onCancel={() => setEditingShipCount(false)}
            />
            <div className="flex justify-between items-center text-sm">
              <span className="holo-label-inline">Faction</span>
              <select
                value={fleet.faction}
                onChange={(e) => updateFleetStats(fleet.id, { faction: e.target.value })}
                className="holo-input text-right"
                style={{ padding: '2px 6px', fontSize: '12px' }}
              >
                {allFactions.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="holo-label-inline">Model</span>
              <select
                value={fleet.modelType}
                onChange={(e) => updateFleetStats(fleet.id, { modelType: e.target.value as ShipModelType })}
                className="holo-input text-right"
                style={{ padding: '2px 6px', fontSize: '12px' }}
              >
                {(Object.keys(MODEL_TYPE_LABELS) as ShipModelType[]).map((m) => (
                  <option key={m} value={m}>{MODEL_TYPE_LABELS[m]}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Ship Count" value={`${fleet.shipCount} Vessels`} />
            <InfoRow label="Faction" value={getFactionLabel(fleet.faction)} />
            <InfoRow label="Model" value={MODEL_TYPE_LABELS[fleet.modelType] ?? fleet.modelType} />
          </>
        )}
        {fleet.flagship && <InfoRow label="Flagship" value={fleet.flagship} />}
        {fleet.commander && <InfoRow label="Commander" value={fleet.commander} />}
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
              onChange={(e) => updateFleetMarkerSize(fleet.id, parseFloat(e.target.value))}
              className="holo-slider flex-1"
            />
            <span className="holo-label-orbitron" style={{ color: 'var(--holo-text-primary)', width: '24px', textAlign: 'right' }}>
              {markerSize.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="holo-label" style={{ marginBottom: '8px' }}>Fleet Strength</label>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: FLEET_STRENGTH_SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-3 transition-all duration-300"
              style={{
                background: i < filledSegments ? segmentColor : 'rgba(200, 170, 110, 0.06)',
                border: `1px solid ${i < filledSegments ? segmentColor : 'rgba(200, 170, 110, 0.1)'}`,
                borderRadius: '3px',
                opacity: i < filledSegments ? 1 : 0.35,
              }}
            />
          ))}
        </div>
        <div className="text-xs mt-1 text-right holo-label-orbitron" style={{ color: 'var(--holo-text-muted)', fontSize: '11px' }}>
          {fleet.shipCount < FLEET_STRENGTH_LIGHT_THRESHOLD ? 'Light' : fleet.shipCount < FLEET_STRENGTH_HEAVY_THRESHOLD ? 'Medium' : 'Heavy'} Task Force
        </div>
      </div>

      {editable && fleet.isCustom && (
        <button
          onClick={() => {
            removeCustomFleet(fleet.id);
            setInfoPanelData(null);
            setSelectedFleet(null);
          }}
          className="holo-button holo-button-danger holo-button-sm w-full mt-2"
        >
          Delete Custom Fleet
        </button>
      )}
    </div>
  );
}
