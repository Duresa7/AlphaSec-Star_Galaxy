export type ChangeType = 'added' | 'changed' | 'fixed' | 'removed';

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
  changes: { type: ChangeType; text: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v2.4.0',
    date: 'March 5, 2026',
    summary: 'Major update with rewritten fleet rendering, system detail panels, and 40% performance boost.',
    changes: [
      { type: 'added', text: 'System detail panel with garrison data, orbital assets, and faction control overlays' },
      { type: 'added', text: 'Fleet commander assignment support in custom fleet builder' },
      { type: 'changed', text: 'Fleet marker rendering engine rewritten with frame-perfect interpolation' },
      { type: 'changed', text: 'Draw calls reduced by 40% across all map views' },
      { type: 'fixed', text: 'Marker z-fighting on systems with 8+ stationed fleets' },
      { type: 'fixed', text: 'Camera drift on idle resolved' },
    ],
  },
  {
    version: 'v2.3.2',
    date: 'February 24, 2026',
    summary: 'System detail view redesign and camera improvements.',
    changes: [
      { type: 'added', text: 'Smooth camera transitions with configurable easing curves' },
      { type: 'added', text: 'Camera position memory — map remembers your last view' },
      { type: 'changed', text: 'Planet info panels now show garrison strength at a glance' },
      { type: 'fixed', text: 'Panel transition animation inconsistencies on Firefox' },
    ],
  },
  {
    version: 'v2.3.1',
    date: 'February 10, 2026',
    summary: 'Performance hotfix and civilian traffic layer rework.',
    changes: [
      { type: 'changed', text: 'Civilian shipping lanes render with accurate hyperspace route data' },
      { type: 'changed', text: 'Adaptive LOD scaling for low-end devices' },
      { type: 'fixed', text: 'Map load time cut from 4.2s to 1.9s via lazy loading and deferred textures' },
      { type: 'removed', text: 'Deprecated v1 fleet marker API endpoints' },
    ],
  },
  {
    version: 'v2.3.0',
    date: 'January 30, 2026',
    summary: 'Supabase Edge migration and dark mode.',
    changes: [
      { type: 'added', text: 'Full dark mode — every panel, marker, and overlay redesigned for low-light' },
      { type: 'changed', text: '47 serverless functions migrated to Supabase Edge' },
      { type: 'changed', text: 'Cold starts reduced from 800ms to under 50ms' },
      { type: 'fixed', text: 'Edge function timeout on bulk fleet queries' },
    ],
  },
  {
    version: 'v2.2.0',
    date: 'December 15, 2025',
    summary: 'Faction emblem refresh and admin dashboard metrics.',
    changes: [
      { type: 'added', text: 'Admin dashboard metrics panel with real-time usage data' },
      { type: 'changed', text: 'Faction emblem assets updated for all 12 factions' },
      { type: 'changed', text: 'Fleet marker click targets enlarged for mobile' },
      { type: 'fixed', text: 'Settings page dark mode visual inconsistencies' },
    ],
  },
];

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  removed: 'Removed',
};
