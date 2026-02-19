import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { FleetLogisticsModal } from '@/components/panels/FleetLogisticsModal';

export function CustomFleetsPanel() {
  const fleetPlacementMode = useGalaxyUIStore((s) => s.fleetPlacementMode);
  const setFleetPlacementMode = useGalaxyUIStore((s) => s.setFleetPlacementMode);
  const fleets = useGalaxyDataStore((s) => s.fleets);

  const [collapsed, setCollapsed] = useState(false);
  const [showFleetModal, setShowFleetModal] = useState(false);

  const customCount = fleets.filter(f => f.isCustom).length;

  return (
    <div className="holo-panel" style={{ marginTop: '0' }}>
      <label
        className="holo-label holo-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Custom Fleets
        </span>
        <span aria-hidden="true" style={{ color: 'var(--holo-crimson)', opacity: 0.8 }}>
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </label>

      {!collapsed && (
        <>
          {fleetPlacementMode && (
            <div className="mt-3 p-3 border" style={{ borderColor: 'rgba(0, 240, 255, 0.2)', background: 'rgba(0, 240, 255, 0.04)', borderRadius: '10px' }}>
              <p className="text-[13px] font-medium animate-pulse holo-label-orbitron" style={{ color: 'var(--holo-cyan)' }}>
                Click on the map to place your fleet
              </p>
              <button
                onClick={() => setFleetPlacementMode(false)}
                className="mt-2 text-[11px] hover:text-white transition-colors"
                style={{ color: 'var(--holo-text-muted)' }}
              >
                Cancel
              </button>
            </div>
          )}

          {!fleetPlacementMode && (
            <button
              onClick={() => setShowFleetModal(true)}
              className="holo-button mt-3 w-full"
              style={{ padding: '6px 16px' }}
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
                });
                setShowFleetModal(false);
              }}
              onCancel={() => setShowFleetModal(false)}
            />,
            document.body,
          )}

          {customCount > 0 && (
            <p className="text-[12px] mt-2" style={{ color: 'var(--holo-text-muted)' }}>
              {customCount} custom fleet{customCount !== 1 ? 's' : ''} placed
            </p>
          )}
        </>
      )}
    </div>
  );
}
