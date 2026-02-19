import { useState } from 'react';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useRole } from '@/hooks/useRole';
import { SearchBar } from '@/components/panels/SearchBar';
import { TimelineControl } from '@/components/panels/TimelineControl';
import { GalaxyOverview } from '@/components/panels/GalaxyOverview';
import { CustomPlanetsPanel } from '@/components/panels/CustomPlanetsPanel';
import { CustomFleetsPanel } from '@/components/panels/CustomFleetsPanel';
import { FilterControls } from '@/components/panels/FilterControls';

function CurrentViewSection() {
  const [collapsed, setCollapsed] = useState(false);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);

  return (
    <div className="holo-panel" style={{ marginTop: '0' }}>
      <label
        className="holo-label holo-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Current View
        </span>
        <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>
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
          <h2 className="text-lg font-semibold mt-3 holo-heading holo-heading-accent">
            {viewMode === 'topdown' ? 'Galaxy Map' : (viewMode === 'system' ? 'Planet View' : 'Fleet View')}
          </h2>
          {viewMode !== 'topdown' && (
            <button
              onClick={() => {
                setSelectedSystem(null);
                setSelectedFleet(null);
                setInfoPanelData(null);
              }}
              className="holo-button mt-4 w-full"
              style={{ padding: '6px 16px' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Return to Galaxy</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function ControlsPanel() {
  const { isAdmin } = useRole();
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);

  return (
    <div className="holo-scroll-invisible absolute left-5 top-5 z-30 space-y-3 max-h-[calc(100vh-3rem)] overflow-y-auto w-[310px] animate-slide-in-left pb-4">
      <SearchBar />
      <CurrentViewSection />
      <TimelineControl />
      <GalaxyOverview />
      {isAdmin && viewMode === 'topdown' && <CustomPlanetsPanel />}
      {isAdmin && viewMode === 'topdown' && <CustomFleetsPanel />}
      <FilterControls />
    </div>
  );
}
