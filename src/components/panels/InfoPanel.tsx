import { useGalaxyStore } from '@/store/galaxyStore';
import type { StarSystem, Fleet, Anomaly, Planet } from '@/types';

const FACTION_LABELS = {
  sith_empire: 'Sith Empire',
  galactic_republic: 'Galactic Republic',
  neutral: 'Neutral',
  contested: 'Contested',
};

const FACTION_COLORS = {
  sith_empire: 'text-red-500',
  galactic_republic: 'text-yellow-400',
  neutral: 'text-gray-400',
  contested: 'text-orange-400',
};

export function InfoPanel() {
  const { infoPanelData, setInfoPanelData, setSelectedSystem, setSelectedPlanet, setSelectedFleet, viewMode } = useGalaxyStore();

  if (!infoPanelData) return null;

  const handleClose = () => {
    setInfoPanelData(null);
    if (viewMode === 'system') {
      setSelectedPlanet(null);
      setSelectedSystem(null);
    } else if (viewMode === 'fleet') {
      setSelectedFleet(null);
    } else {
      setSelectedSystem(null);
    }
  };

  return (
    <div className="absolute right-4 top-4 w-96 apple-card max-h-[calc(100vh-2rem)] overflow-y-auto animate-slide-in-right">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="apple-close-button absolute top-4 right-4 z-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="space-y-4">
        {infoPanelData.type === 'system' && (
          <SystemInfo system={infoPanelData.data as StarSystem} />
        )}

        {infoPanelData.type === 'planet' && (
          <PlanetInfo planet={infoPanelData.data as Planet} />
        )}

        {infoPanelData.type === 'fleet' && (
          <FleetInfo fleet={infoPanelData.data as Fleet} />
        )}

        {infoPanelData.type === 'anomaly' && (
          <AnomalyInfo anomaly={infoPanelData.data as Anomaly} />
        )}
      </div>
    </div>
  );
}

function SystemInfo({ system }: { system: StarSystem }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <h2 className="text-xl font-semibold text-white mb-2">{system.name}</h2>
        <span className={`apple-badge ${
          system.faction === 'sith_empire' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
          system.faction === 'galactic_republic' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        }`}>
          {FACTION_LABELS[system.faction]}
        </span>
      </div>

      <div className="apple-divider" />

      {/* Info grid */}
      <div className="apple-info-grid space-y-2">
        <InfoRow label="Region" value={formatRegion(system.region)} />
        <InfoRow label="Star Type" value={capitalizeFirst(system.starType)} />
        <InfoRow label="Importance" value={capitalizeFirst(system.importance)} />
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed">{system.description}</p>

      {/* Planets */}
      {system.planets.length > 0 && (
        <div>
          <label className="section-label" style={{ marginBottom: '8px' }}>Planets ({system.planets.length})</label>
          <div className="space-y-1 mt-2">
            {system.planets.map(planet => (
              <div key={planet.id} className="apple-info-row group cursor-pointer hover:bg-white/5 transition-colors">
                <span className="text-gray-200 text-sm group-hover:text-cyan-300 transition-colors">{planet.name}</span>
                <span className="text-gray-500 text-xs capitalize">{planet.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notable locations */}
      {system.planets.length > 0 && system.planets[0].notable && (
        <div>
          <label className="section-label" style={{ marginBottom: '8px' }}>Notable Locations</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {system.planets[0].notable.map((loc, i) => (
              <span
                key={i}
                className="apple-badge bg-cyan-900/30 border border-cyan-500/30 text-cyan-200"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hint to zoom in */}
      {system.planets.length > 0 && (
        <div className="text-xs text-gray-500 text-center animate-pulse">
          Click again to enter system view
        </div>
      )}
    </div>
  );
}

function PlanetInfo({ planet }: { planet: Planet }) {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <h2 className="text-xl font-semibold text-white mb-2">{planet.name}</h2>
        <span className={`apple-badge border border-white/10 bg-white/5 ${planetTypeColors[planet.type] || 'text-gray-400'}`}>
          {planet.type.replace('_', ' ')} World
        </span>
      </div>

      <div className="apple-divider" />

      {/* Faction */}
      <div className={`text-sm font-medium ${FACTION_COLORS[planet.faction]} flex items-center gap-2`}>
        <span className="w-2 h-2 rounded-full bg-current shadow-[0_0_5px_currentColor]"></span>
        {FACTION_LABELS[planet.faction]} Territory
      </div>

      {/* Info grid */}
      <div className="apple-info-grid space-y-2">
        {planet.climate && <InfoRow label="Climate" value={planet.climate} />}
        {planet.terrain && <InfoRow label="Terrain" value={planet.terrain} />}
        {planet.population && <InfoRow label="Population" value={planet.population} />}
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed">{planet.description}</p>

      {/* Notable locations */}
      {planet.notable && planet.notable.length > 0 && (
        <div>
          <label className="section-label" style={{ marginBottom: '8px' }}>Points of Interest</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {planet.notable.map((loc, i) => (
              <span
                key={i}
                className="apple-badge bg-cyan-900/30 border border-cyan-500/30 text-cyan-200"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Special warnings */}
      {planet.type === 'destroyed' && (
        <div className="apple-info-grid bg-red-900/10 border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
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
        <div className="apple-info-grid bg-orange-900/10 border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold">
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

function FleetInfo({ fleet }: { fleet: Fleet }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${
            fleet.faction === 'sith_empire' ? 'bg-red-500 shadow-red-500/50' :
            fleet.faction === 'galactic_republic' ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-gray-400'
          }`} />
          <h2 className="text-xl font-semibold text-white">{fleet.name}</h2>
        </div>
        <span className={`apple-badge ${
          fleet.faction === 'sith_empire' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
          fleet.faction === 'galactic_republic' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        }`}>
          {FACTION_LABELS[fleet.faction]}
        </span>
      </div>

      <div className="apple-divider" />

      {/* Info grid */}
      <div className="apple-info-grid space-y-2">
        <InfoRow label="Ship Count" value={`${fleet.shipCount} Vessels`} />
        {fleet.flagship && <InfoRow label="Flagship" value={fleet.flagship} />}
        {fleet.commander && <InfoRow label="Commander" value={fleet.commander} />}
      </div>

      {/* Fleet strength indicator */}
      <div>
        <label className="section-label" style={{ marginBottom: '8px' }}>Fleet Strength</label>
        <div className="w-full bg-black/40 rounded-full h-2 border border-white/10 mt-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              fleet.faction === 'sith_empire' ? 'bg-red-500' : 'bg-yellow-400'
            }`}
            style={{ width: `${Math.min(fleet.shipCount / 2, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {fleet.shipCount < 50 ? 'Light' : fleet.shipCount < 100 ? 'Medium' : 'Heavy'} Task Force
        </div>
      </div>
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
        <h2 className="text-xl font-semibold text-white mb-2">{anomaly.name}</h2>
        <span className={`apple-badge border border-white/10 bg-white/5 ${typeColors[anomaly.type] || 'text-gray-400'}`}>
          {anomaly.type.replace('_', ' ')}
        </span>
      </div>

      <div className="apple-divider" />

      {/* Info */}
      <div className="apple-info-grid">
        <InfoRow label="Radius" value={`${anomaly.radius} parsecs`} />
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed">{anomaly.description}</p>

      {/* Warning for dangerous anomalies */}
      {(anomaly.type === 'black_hole' || anomaly.type === 'nebula') && (
        <div className="apple-info-grid bg-yellow-900/10 border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}

function formatRegion(region: string): string {
  return region.split('_').map(capitalizeFirst).join(' ');
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
