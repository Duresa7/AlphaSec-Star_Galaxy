import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { FleetLogisticsModal } from '@/components/panels/FleetLogisticsModal';
import { PlacementNotice } from '@/components/panels/PlacementNotice';

export function CustomFleetsPanel() {
  const fleetPlacementMode = useGalaxyUIStore((s) => s.fleetPlacementMode);
  const setFleetPlacementMode = useGalaxyUIStore((s) => s.setFleetPlacementMode);
  const fleets = useGalaxyDataStore((s) => s.fleets);

  const [showFleetModal, setShowFleetModal] = useState(false);

  const customCount = fleets.filter(f => f.isCustom).length;

  return (
    <div className="holo-panel holo-panel-reset">
      <label
        className="holo-label holo-section-header"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 holo-icon-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Custom Fleets
        </span>
      </label>

          <PlacementNotice active={fleetPlacementMode} entityLabel="fleet" onCancel={() => setFleetPlacementMode(false)} />

          {!fleetPlacementMode && (
            <button
              onClick={() => setShowFleetModal(true)}
              className="holo-button holo-button-sm mt-3 w-full"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Fleet</span>
            </button>
          )}

          {showFleetModal && createPortal(
            <FleetLogisticsModal
              onConfirm={(data) => {
                setFleetPlacementMode(true, {
                  name: data.name,
                  faction: data.faction,
                  shipCount: data.shipCount,
                  modelType: data.modelType,
                  commander: data.commander,
                  composition: data.composition,
                });
                setShowFleetModal(false);
              }}
              onCancel={() => setShowFleetModal(false)}
            />,
            document.body,
          )}

          {customCount > 0 && (
            <p className="holo-meta-count">
              {customCount} custom fleet{customCount !== 1 ? 's' : ''} placed
            </p>
          )}
    </div>
  );
}
