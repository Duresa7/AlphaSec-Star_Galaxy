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
  const { infoPanelData, setInfoPanelData, setSelectedSystem, setSelectedPlanet, viewMode } = useGalaxyStore();
  
  if (!infoPanelData) return null;
  
  const handleClose = () => {
    setInfoPanelData(null);
    if (viewMode === 'planet') {
      setSelectedPlanet(null);
    } else {
      setSelectedSystem(null);
    }
  };
  
  return (
    <div className="absolute right-4 top-4 w-80 bg-black/80 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm max-h-[80vh] overflow-y-auto animate-slide-in-right border-glow">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
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
  );
}

function SystemInfo({ system }: { system: StarSystem }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="border-b border-cyan-500/30 pb-2">
        <h2 className="text-xl font-bold text-cyan-400">{system.name}</h2>
        <span className={`text-sm ${FACTION_COLORS[system.faction]}`}>
          {FACTION_LABELS[system.faction]}
        </span>
      </div>
      
      {/* Info grid */}
      <div className="space-y-2 text-sm">
        <InfoRow label="Region" value={formatRegion(system.region)} />
        <InfoRow label="Star Type" value={capitalizeFirst(system.starType)} />
        <InfoRow label="Importance" value={capitalizeFirst(system.importance)} />
      </div>
      
      {/* Description */}
      <div className="pt-2 border-t border-cyan-500/30">
        <p className="text-gray-300 text-sm">{system.description}</p>
      </div>
      
      {/* Planets */}
      {system.planets.length > 0 && (
        <div className="pt-2 border-t border-cyan-500/30">
          <div className="text-xs text-gray-500 mb-2">Planets ({system.planets.length})</div>
          <div className="space-y-1">
            {system.planets.map(planet => (
              <div key={planet.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{planet.name}</span>
                <span className="text-gray-500 capitalize">{planet.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Notable locations */}
      {system.planets.length > 0 && system.planets[0].notable && (
        <div className="pt-2 border-t border-cyan-500/30">
          <div className="text-xs text-gray-500 mb-1">Notable Locations</div>
          <div className="flex flex-wrap gap-1">
            {system.planets[0].notable.map((loc, i) => (
              <span 
                key={i} 
                className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Hint to zoom in */}
      {system.planets.length > 0 && (
        <div className="pt-2 text-xs text-cyan-500/70 text-center">
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
    <div className="space-y-3">
      {/* Header */}
      <div className="border-b border-cyan-500/30 pb-2">
        <h2 className="text-xl font-bold text-cyan-400">{planet.name}</h2>
        <span className={`text-sm capitalize ${planetTypeColors[planet.type] || 'text-gray-400'}`}>
          {planet.type.replace('_', ' ')} World
        </span>
      </div>
      
      {/* Faction */}
      <div className={`text-sm ${FACTION_COLORS[planet.faction]}`}>
        {FACTION_LABELS[planet.faction]} Territory
      </div>
      
      {/* Info grid */}
      <div className="space-y-2 text-sm">
        {planet.climate && <InfoRow label="Climate" value={planet.climate} />}
        {planet.terrain && <InfoRow label="Terrain" value={planet.terrain} />}
        {planet.population && <InfoRow label="Population" value={planet.population} />}
      </div>
      
      {/* Description */}
      <div className="pt-2 border-t border-cyan-500/30">
        <p className="text-gray-300 text-sm">{planet.description}</p>
      </div>
      
      {/* Notable locations */}
      {planet.notable && planet.notable.length > 0 && (
        <div className="pt-2 border-t border-cyan-500/30">
          <div className="text-xs text-gray-500 mb-1">Points of Interest</div>
          <div className="flex flex-wrap gap-1">
            {planet.notable.map((loc, i) => (
              <span 
                key={i} 
                className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Special warnings */}
      {planet.type === 'destroyed' && (
        <div className="pt-2">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <span>Warning: Planetary destruction detected</span>
          </div>
        </div>
      )}
      
      {planet.type === 'volcanic' && (
        <div className="pt-2">
          <div className="flex items-center gap-2 text-orange-400 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" 
              />
            </svg>
            <span>Extreme volcanic activity</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FleetInfo({ fleet }: { fleet: Fleet }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="border-b border-cyan-500/30 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            fleet.faction === 'sith_empire' ? 'bg-red-500' : 
            fleet.faction === 'galactic_republic' ? 'bg-yellow-400' : 'bg-gray-400'
          }`} />
          <h2 className="text-xl font-bold text-cyan-400">{fleet.name}</h2>
        </div>
        <span className={`text-sm ${FACTION_COLORS[fleet.faction]}`}>
          {FACTION_LABELS[fleet.faction]}
        </span>
      </div>
      
      {/* Info grid */}
      <div className="space-y-2 text-sm">
        <InfoRow label="Ship Count" value={fleet.shipCount.toString()} />
        {fleet.flagship && <InfoRow label="Flagship" value={fleet.flagship} />}
        {fleet.commander && <InfoRow label="Commander" value={fleet.commander} />}
      </div>
      
      {/* Fleet strength indicator */}
      <div className="pt-2 border-t border-cyan-500/30">
        <div className="text-xs text-gray-500 mb-1">Fleet Strength</div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              fleet.faction === 'sith_empire' ? 'bg-red-500' : 'bg-yellow-400'
            }`}
            style={{ width: `${Math.min(fleet.shipCount / 2, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {fleet.shipCount < 50 ? 'Light' : fleet.shipCount < 100 ? 'Medium' : 'Heavy'} Force
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
    <div className="space-y-3">
      {/* Header */}
      <div className="border-b border-cyan-500/30 pb-2">
        <h2 className="text-xl font-bold text-cyan-400">{anomaly.name}</h2>
        <span className={`text-sm capitalize ${typeColors[anomaly.type] || 'text-gray-400'}`}>
          {anomaly.type.replace('_', ' ')}
        </span>
      </div>
      
      {/* Info */}
      <div className="space-y-2 text-sm">
        <InfoRow label="Radius" value={`${anomaly.radius} parsecs`} />
      </div>
      
      {/* Description */}
      <div className="pt-2 border-t border-cyan-500/30">
        <p className="text-gray-300 text-sm">{anomaly.description}</p>
      </div>
      
      {/* Warning for dangerous anomalies */}
      {(anomaly.type === 'black_hole' || anomaly.type === 'nebula') && (
        <div className="pt-2">
          <div className="flex items-center gap-2 text-yellow-500 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <span>Navigation Hazard - Exercise Caution</span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
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
