import { useState, useEffect, useCallback } from 'react';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useRole } from '@/hooks/useRole';

export function TimelineControl() {
  const { isAdmin } = useRole();
  const currentYear = useGalaxyDataStore((s) => s.currentYear);
  const setCurrentYear = useGalaxyDataStore((s) => s.setCurrentYear);

  const [collapsed, setCollapsed] = useState(false);
  const [yearDraft, setYearDraft] = useState(String(currentYear));

  useEffect(() => {
    setYearDraft(String(currentYear));
  }, [currentYear]);

  const commitYear = useCallback(() => {
    const parsed = parseInt(yearDraft, 10);
    if (isNaN(parsed)) {
      setYearDraft(String(currentYear));
      return;
    }
    setCurrentYear(parsed);
    setYearDraft(String(parsed));
  }, [yearDraft, currentYear, setCurrentYear]);

  return (
    <div className="holo-panel" style={{ marginTop: '0' }}>
      <div>
        <label
          className="holo-label holo-section-header"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timeline
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
          <p className="text-[14px] mt-1 holo-body-text">Old Republic Era</p>
        )}
      </div>
      {!collapsed && (
        <>
          <div className="mt-3 flex items-center gap-2">
            {isAdmin ? (
              <input
                type="number"
                value={yearDraft}
                onChange={(e) => setYearDraft(e.target.value)}
                onBlur={commitYear}
                onKeyDown={(e) => { if (e.key === 'Enter') commitYear(); }}
                className="holo-input holo-number-input text-center"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '14px',
                  width: '80px',
                  padding: '4px 8px',
                  color: 'var(--holo-amber)',
                }}
              />
            ) : (
              <span className="holo-label-orbitron" style={{ fontSize: '15px', color: 'var(--holo-amber)' }}>
                {currentYear}
              </span>
            )}
            <span className="holo-label-orbitron" style={{ fontSize: '11px', color: 'var(--holo-text-muted)' }}>BBY</span>
          </div>
          <div className="mt-1">
          </div>
        </>
      )}
    </div>
  );
}
