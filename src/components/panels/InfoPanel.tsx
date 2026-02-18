import { useMemo } from 'react';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useRole } from '@/hooks/useRole';

import type { StarSystem, Fleet, InfoPanelData, ViewMode } from '@/types';
import { SystemInfo } from '@/components/panels/SystemInfo';
import { PlanetInfo } from '@/components/panels/PlanetInfo';
import { FleetInfo } from '@/components/panels/FleetInfo';
import { AnomalyInfo } from '@/components/panels/AnomalyInfo';

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

  if (infoPanelData?.type === 'planet') {
    const stale = infoPanelData.data;
    const sys = systems.find((s) => s.id === stale.systemId);
    const fresh = sys?.planets.find((p) => p.id === stale.id);
    if (fresh) return { type: 'planet', data: fresh };
  }

  if (infoPanelData?.type === 'system') {
    const fresh = systems.find((s) => s.id === infoPanelData.data.id);
    if (fresh) return { type: 'system', data: fresh };
  }

  if (infoPanelData?.type === 'fleet') {
    const fresh = fleets.find((f) => f.id === infoPanelData.data.id);
    if (fresh) return { type: 'fleet', data: fresh };
  }

  return infoPanelData;
}

export function InfoPanel() {
  const { isAdmin } = useRole();
  const infoPanelData = useGalaxySelectionStore((s) => s.infoPanelData);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const selectedSystemId = useGalaxySelectionStore((s) => s.selectedSystemId);
  const selectedPlanetId = useGalaxySelectionStore((s) => s.selectedPlanetId);
  const selectedFleetId = useGalaxySelectionStore((s) => s.selectedFleetId);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);

  const panelData = useMemo(
    () =>
      resolvePanelData({
        infoPanelData,
        viewMode,
        selectedSystemId,
        selectedPlanetId,
        selectedFleetId,
        systems,
        fleets,
      }),
    [infoPanelData, viewMode, selectedSystemId, selectedPlanetId, selectedFleetId, systems, fleets],
  );

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
        return <SystemInfo system={data.data} editable={isAdmin} />;
      case 'planet':
        return <PlanetInfo planet={data.data} editable={isAdmin} />;
      case 'fleet':
        return <FleetInfo fleet={data.data} editable={isAdmin} />;
      case 'anomaly':
        return <AnomalyInfo anomaly={data.data} />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute right-4 top-4 z-50 w-96 max-h-[calc(100vh-2rem)] animate-slide-in-right">
      <div className="holo-panel max-h-[calc(100vh-2rem)] overflow-y-auto">

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
