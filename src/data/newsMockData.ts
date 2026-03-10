export interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  description: string;
  metric?: string;
  metricLabel?: string;
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
