import type { Fleet } from '@/types';
import { useGalaxyStore } from '@/store/galaxyStore';
import {
  FACTION_LABELS,
  FLEET_STRENGTH_SEGMENTS,
  FLEET_STRENGTH_DIVISOR,
  FLEET_STRENGTH_LIGHT_THRESHOLD,
  FLEET_STRENGTH_HEAVY_THRESHOLD,
} from '@/constants/factions';
import { InfoRow } from '@/components/panels/infoPanelShared';
import { DEFAULT_TOPDOWN_FLEET_MARKER_SIZE } from '@/config/topDownMarkerConfig';

export function FleetInfo({ fleet, editable }: { fleet: Fleet; editable: boolean }) {
  const removeCustomFleet = useGalaxyStore((s) => s.removeCustomFleet);
  const setInfoPanelData = useGalaxyStore((s) => s.setInfoPanelData);
  const setSelectedFleet = useGalaxyStore((s) => s.setSelectedFleet);
  const updateFleetMarkerSize = useGalaxyStore((s) => s.updateFleetMarkerSize);
  const viewMode = useGalaxyStore((s) => s.viewMode);

  const markerSize = fleet.markerSize ?? DEFAULT_TOPDOWN_FLEET_MARKER_SIZE;
  const filledSegments = Math.min(Math.ceil(fleet.shipCount / FLEET_STRENGTH_DIVISOR), FLEET_STRENGTH_SEGMENTS);
  const segmentColor = fleet.faction === 'sith_empire' ? 'var(--holo-crimson)' : fleet.faction === 'hutt_cartel' ? '#8B9A46' : 'var(--holo-amber)';

  return (
    <div className="space-y-4">

      <div className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{
              backgroundColor: fleet.faction === 'sith_empire' ? '#DC143C' : fleet.faction === 'galactic_republic' ? '#C8AA6E' : fleet.faction === 'hutt_cartel' ? '#8B9A46' : '#808080',
              boxShadow: fleet.faction === 'sith_empire' ? '0 0 10px rgba(220,20,60,0.5)' : fleet.faction === 'hutt_cartel' ? '0 0 10px rgba(139,154,70,0.5)' : '0 0 10px rgba(200,170,110,0.5)',
            }}
          />
          <h2 className="text-xl font-semibold holo-heading">{fleet.name}</h2>
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

      <div className="holo-info-grid space-y-2">
        <InfoRow label="Ship Count" value={`${fleet.shipCount} Vessels`} />
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
                boxShadow: i < filledSegments ? `0 0 8px ${segmentColor}30` : 'none',
                borderRadius: '3px',
                opacity: i < filledSegments ? 1 : 0.35,
              }}
            />
          ))}
        </div>
        <div className="text-xs mt-1 text-right holo-label-orbitron" style={{ color: 'var(--holo-text-muted)', fontSize: '9px' }}>
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
          Delete Custom Fleet
        </button>
      )}
    </div>
  );
}
