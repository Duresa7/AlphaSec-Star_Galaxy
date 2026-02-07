import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';

export interface ActivityLogEntry {
  id: number;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  message: string;
  metadata: Json | null;
  actorId: string;
  createdAt: string;
}

type ActivityLogRow = {
  id: number;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  metadata: Json | null;
  actor_id: string;
  created_at: string;
};

const toEntry = (row: ActivityLogRow): ActivityLogEntry => ({
  id: row.id,
  eventType: row.event_type,
  entityType: row.entity_type,
  entityId: row.entity_id,
  message: row.message,
  metadata: row.metadata,
  actorId: row.actor_id,
  createdAt: row.created_at,
});

async function getAuthUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function logActivity(params: {
  eventType: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  try {
    const actorId = await getAuthUserId();
    const { error } = await supabase.from('activity_logs').insert({
      event_type: params.eventType,
      message: params.message,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
      actor_id: actorId,
    });

    if (error) {
      console.error('Failed to insert activity log:', error);
    }
  } catch (err) {
    console.error('Failed to insert activity log:', err);
  }
}

export async function fetchActivityLogs(limit = 50): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch activity logs:', error);
    return [];
  }

  const rows = (data || []) as ActivityLogRow[];
  return rows.map(toEntry);
}

export function subscribeToActivityLogs(onChanged: () => void) {
  const channel = supabase
    .channel('activity-log-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
      onChanged();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
