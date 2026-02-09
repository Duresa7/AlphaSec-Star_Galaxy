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
    <section className="portfolio-hero admin-console-hero" aria-label="Admin activity log">
      <div className="portfolio-hero__layer portfolio-hero__base-image" aria-hidden="true" />
      <div className="portfolio-hero__layer portfolio-hero__grid" aria-hidden="true" />
      <div className="portfolio-hero__layer portfolio-hero__alt-image admin-console-hero__alt" aria-hidden="true" />
      <div className="admin-console-hero__veil" aria-hidden="true" />

      <div className="admin-console">
        <div className="admin-console__container">
          <header className="admin-console__masthead">
            <div>
              <p className="admin-console__eyebrow">Administrative Console</p>
              <h1 className="admin-console__title">Activity Log</h1>
              <p className="admin-console__subtitle">
                Live audit feed for system actions, edits, and operator behavior.
              </p>
            </div>
            <div className="admin-console__actions">
              {canManagePermissions && (
                <Link to="/admin/permissions" className="admin-console__action">
                  Permissions
                </Link>
              )}
              <Link to="/map" className="admin-console__action admin-console__action--primary">
                Back to Map
              </Link>
            </div>
          </header>

          <section className="admin-console__panel">
            <div className="admin-console__panel-head">
              <h2 className="admin-console__panel-title">Event Stream</h2>
              <span className="admin-console__pill">{entries.length} Events</span>
            </div>

            {isLoading ? (
              <p className="admin-console__copy">Loading activity log...</p>
            ) : entries.length === 0 ? (
              <p className="admin-console__copy">No activity yet.</p>
            ) : (
              <div className="admin-console__log-list">
                {entries.map((entry) => (
                  <article key={entry.id} className="admin-console__log-item">
                    <div className="admin-console__log-meta">
                      <span className="admin-console__event-chip">{entry.eventType}</span>
                      <time className="admin-console__timestamp">{formatTimestamp(entry.createdAt)}</time>
                    </div>

                    <p className="admin-console__message">{entry.message}</p>

                    <div className="admin-console__tag-row">
                      {entry.entityType && <span className="admin-console__tag">entity: {entry.entityType}</span>}
                      {entry.entityId && <span className="admin-console__tag">id: {entry.entityId}</span>}
                      <span className="admin-console__tag">actor: {entry.actorId}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
