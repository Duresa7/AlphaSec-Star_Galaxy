import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { fetchActivityLogs, subscribeToActivityLogs, type ActivityLogEntry } from '@/data/activityLog';
import { useAuthStore } from '@/store/authStore';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function AdminActivityPage() {
  const { hasAdminPermission } = useAuthStore();
  const canViewLog = hasAdminPermission('view_activity_log');
  const canManagePermissions = hasAdminPermission('manage_admin_permissions');
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canViewLog) return;

    let mounted = true;
    const load = async () => {
      const data = await fetchActivityLogs(50);
      if (!mounted) return;
      setEntries(data);
      setIsLoading(false);
    };

    void load();
    const unsubscribe = subscribeToActivityLogs(() => {
      void load();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [canViewLog]);

  if (!canViewLog) {
    return <Navigate to="/map" replace />;
  }

  return (
    <div className="w-screen h-screen overflow-y-auto bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="holo-panel mb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="holo-label mb-2">Admin Console</p>
              <h1
                className="text-xl uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-amber)' }}
              >
                Activity Log
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {canManagePermissions && (
                <Link to="/admin/permissions" className="holo-button" style={{ padding: '8px 12px' }}>
                  Permissions
                </Link>
              )}
              <Link to="/map" className="holo-button" style={{ padding: '8px 12px' }}>
                Back to Map
              </Link>
            </div>
          </div>
        </div>

        <div className="holo-panel">
          {isLoading ? (
            <p style={{ color: 'var(--holo-text-muted)' }}>Loading activity log...</p>
          ) : entries.length === 0 ? (
            <p style={{ color: 'var(--holo-text-muted)' }}>No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="holo-info-grid">
                  <div className="flex items-center justify-between gap-3">
                    <span className="holo-badge bg-cyan-500/20 border border-cyan-500/30 text-cyan-200">
                      {entry.eventType}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--holo-text-muted)' }}>
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm mt-2" style={{ color: 'var(--holo-text-primary)' }}>
                    {entry.message}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]" style={{ color: 'var(--holo-text-muted)' }}>
                    {entry.entityType && <span>entity: {entry.entityType}</span>}
                    {entry.entityId && <span>id: {entry.entityId}</span>}
                    <span>actor: {entry.actorId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
