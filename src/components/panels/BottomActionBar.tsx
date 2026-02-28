import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useRole } from '@/hooks/useRole';
import { CustomPlanetsPanel } from '@/components/panels/CustomPlanetsPanel';
import { CustomFleetsPanel } from '@/components/panels/CustomFleetsPanel';
import { useState } from 'react';

export function BottomActionBar() {
  const { isAdmin } = useRole();
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const setActiveModule = useGalaxyUIStore((s) => s.setActiveModule);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-3 animate-slide-in-right">
      <div className="holo-toolbar">
        <button
          onClick={() => setActiveModule('mapControls')}
          className={`holo-button holo-button-sm${activeModule === 'mapControls' ? ' is-active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-[11px] font-semibold tracking-wider">Map Controls</span>
        </button>

        {isAdmin && (
          <div className="w-px h-8 bg-white/10 mx-1" />
        )}

        {isAdmin && (
          <div className="flex gap-2">
            <PanelTriggerWrapper
              component={<CustomPlanetsPanel />}
              label="Create Planet"
              icon={(
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              )}
            />
            <PanelTriggerWrapper
              component={<CustomFleetsPanel />}
              label="Create Fleet"
              icon={(
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PanelTriggerWrapper({ component, label, icon }: { component: React.ReactNode, label: string, icon: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`holo-button holo-button-sm${open ? ' is-active' : ''}`}
      >
        {icon}
        <span className="text-[11px] font-semibold tracking-wider">{label}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 z-50">
          <div className="relative">
            {component}
            <button
              onClick={() => setOpen(false)}
              className="holo-close-button absolute top-4 right-4"
              title="Close panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
