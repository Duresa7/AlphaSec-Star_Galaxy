export interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  description: string;
  metric?: string;
  metricLabel?: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'update' | 'release' | 'incident' | 'maintenance';
  expandedContent: string;
}

export const SERVICE_STATUSES: ServiceStatus[] = [
  {
    id: 'visitors',
    name: 'Unique Visitors',
    status: 'online',
    description: 'Total unique visitors in the last 30 days.',
    metric: '1,247',
    metricLabel: 'Visitors',
  },
  {
    id: 'members',
    name: 'Member Count',
    status: 'online',
    description: 'Registered members across all roles.',
    metric: '38',
    metricLabel: 'Members',
  },
  {
    id: 'vercel',
    name: 'Vercel Hosting',
    status: 'online',
    description: 'Frontend deployment and CDN delivery.',
  },
  {
    id: 'supabase',
    name: 'Supabase Database',
    status: 'online',
    description: 'PostgreSQL database, auth, and storage services.',
  },
];

export const TIMELINE_ENTRIES: TimelineEntry[] = [
  {
    id: 'tl-1',
    title: 'News Section UI Redesign',
    description: 'Launched the new Medium-inspired news and blog interface.',
    timestamp: '2026-03-09T14:00:00Z',
    type: 'release',
    expandedContent:
      'Complete redesign of the /news, /blog, and /services pages with a clean, typography-focused layout. Includes article reading pages, category filtering, and a services status dashboard.',
  },
  {
    id: 'tl-2',
    title: 'Galaxy Map Performance Optimization',
    description: 'Reduced initial load time by 40% with progressive rendering.',
    timestamp: '2026-03-07T10:30:00Z',
    type: 'update',
    expandedContent:
      'Implemented lazy-loading for star system data and progressive detail rendering. Systems near the camera load full detail first, while distant systems render as simple points until the user zooms in.',
  },
  {
    id: 'tl-3',
    title: 'Changelog System Removed',
    description: 'Replaced the changelog page with integrated timeline updates.',
    timestamp: '2026-03-08T09:00:00Z',
    type: 'update',
    expandedContent:
      'The standalone changelog pages were removed in favor of an integrated timeline on the AlphaSec Services page. This provides a more cohesive view of platform changes alongside service status.',
  },
  {
    id: 'tl-4',
    title: 'Supabase Auth PKCE Flow',
    description: 'Migrated authentication to use PKCE flow for improved security.',
    timestamp: '2026-03-04T16:00:00Z',
    type: 'update',
    expandedContent:
      'Switched from implicit grant to PKCE (Proof Key for Code Exchange) flow for all Supabase authentication. This provides better security for browser-based applications by preventing authorization code interception.',
  },
  {
    id: 'tl-5',
    title: 'v1.4.0 Release',
    description: 'Major release with faction management and fleet customization.',
    timestamp: '2026-02-28T12:00:00Z',
    type: 'release',
    expandedContent:
      'Added custom faction creation with configurable colors and labels. Fleet management now supports drag-and-drop positioning, batch operations, and real-time sync across sessions.',
  },
  {
    id: 'tl-6',
    title: 'Database Maintenance Window',
    description: 'Scheduled maintenance for Supabase PostgreSQL upgrade.',
    timestamp: '2026-02-22T03:00:00Z',
    type: 'maintenance',
    expandedContent:
      'PostgreSQL was upgraded from 15.4 to 15.6 during a planned maintenance window. The upgrade included security patches and performance improvements for JSON operations.',
  },
  {
    id: 'tl-7',
    title: 'Map Rendering Incident',
    description: 'Brief rendering issue affecting fleet visibility on mobile.',
    timestamp: '2026-02-18T11:45:00Z',
    type: 'incident',
    expandedContent:
      'A regression in the instanced rendering pipeline caused fleets to disappear on devices with limited GPU memory. The issue was identified within 30 minutes and a fix was deployed. Root cause: buffer size calculation did not account for mobile GPU constraints.',
  },
  {
    id: 'tl-8',
    title: 'v1.3.0 Release',
    description: 'Added admin dashboard and audit logging.',
    timestamp: '2026-02-10T12:00:00Z',
    type: 'release',
    expandedContent:
      'Introduced the admin dashboard with user management, audit log viewer, and role-based access controls. All administrative actions are now logged to the audit_logs table for compliance and debugging.',
  },
];
