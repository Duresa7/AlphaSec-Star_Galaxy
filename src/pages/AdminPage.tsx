import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useRole } from '@/hooks/useRole';
import { fetchAuditLogs, fetchAllProfiles, updateUserRole, logAction } from '@/data/supabaseStorage';
import type { AuditLogEntry, UserProfile, UserRole } from '@/types';

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  system_created: 'Created System',
  system_moved: 'Moved System',
  system_deleted: 'Deleted System',
  system_resized: 'Resized System',
  fleet_created: 'Created Fleet',
  fleet_moved: 'Moved Fleet',
  fleet_deleted: 'Deleted Fleet',
  fleet_resized: 'Resized Fleet',
  planet_stats_updated: 'Updated Planet',
  role_changed: 'Changed Role',
};

const ACTION_VARIANTS: Record<string, string> = {
  system_created: 'create',
  system_moved: 'move',
  system_deleted: 'delete',
  system_resized: 'resize',
  fleet_created: 'create',
  fleet_moved: 'move',
  fleet_deleted: 'delete',
  fleet_resized: 'resize',
  planet_stats_updated: 'update',
  role_changed: 'role',
};

const ROLE_COLORS: Record<UserRole, string> = {
  user: '#9ca3af',
  admin: '#60a5fa',
  bossman: '#c8aa6e',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function AdminPage() {
  const { profile: currentProfile } = useProfile();
  const { isBossman } = useRole();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const loadLogs = useCallback(async (page: number) => {
    setLogsLoading(true);
    const { logs: fetched, total } = await fetchAuditLogs(PAGE_SIZE, page * PAGE_SIZE);
    setLogs(fetched);
    setLogTotal(total);
    setLogsLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const profiles = await fetchAllProfiles();
    setUsers(profiles);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    loadLogs(logPage);
  }, [loadLogs, logPage]);

  useEffect(() => {
    if (isBossman) loadUsers();
  }, [isBossman, loadUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole, userName: string) => {
    if (!currentProfile) return;
    setRoleUpdating(userId);
    const { error } = await updateUserRole(userId, newRole);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      await logAction('role_changed', 'user', userId, userName, { newRole });
      loadLogs(logPage);
    }
    setRoleUpdating(null);
  };

  const totalPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE));
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'bossman').length;

  return (
    <div className="adm">
      {/* Atmospheric background layers */}
      <div className="adm__bg" />
      <div className="adm__grid-overlay" />
      <div className="adm__glow" />
      <div className="adm__scanline" />

      <div className="adm__shell">
        {/* Top navigation bar */}
        <header className="adm__header">
          <Link to="/map" className="adm__nav-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Galaxy Map</span>
          </Link>

          <div className="adm__header-right">
            {currentProfile && (
              <div className="adm__user-chip">
                <div className="adm__user-avatar" style={{ borderColor: ROLE_COLORS[currentProfile.role as UserRole] }}>
                  {currentProfile.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="adm__user-info">
                  <span className="adm__user-name">{currentProfile.display_name}</span>
                  <span className="adm__user-role" style={{ color: ROLE_COLORS[currentProfile.role as UserRole] }}>
                    {currentProfile.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Hero title area */}
        <div className="adm__hero" style={{ '--stagger': 0 } as React.CSSProperties}>
          <div className="adm__hero-eyebrow">
            <span className="adm__hero-dot" />
            Command Center
          </div>
          <h1 className="adm__hero-title">Admin Console</h1>
          <p className="adm__hero-sub">Monitor activity, manage users, and oversee galaxy operations.</p>
        </div>

        {/* Stat cards row */}
        <div className="adm__stats">
          <div className="adm__stat-card" style={{ '--stagger': 1 } as React.CSSProperties}>
            <div className="adm__stat-icon adm__stat-icon--logs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="adm__stat-body">
              <span className="adm__stat-value">{logTotal.toLocaleString()}</span>
              <span className="adm__stat-label">Audit Events</span>
            </div>
          </div>

          {isBossman && (
            <>
              <div className="adm__stat-card" style={{ '--stagger': 2 } as React.CSSProperties}>
                <div className="adm__stat-icon adm__stat-icon--users">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div className="adm__stat-body">
                  <span className="adm__stat-value">{users.length}</span>
                  <span className="adm__stat-label">Total Users</span>
                </div>
              </div>

              <div className="adm__stat-card" style={{ '--stagger': 3 } as React.CSSProperties}>
                <div className="adm__stat-icon adm__stat-icon--admins">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="adm__stat-body">
                  <span className="adm__stat-value">{adminCount}</span>
                  <span className="adm__stat-label">Privileged</span>
                </div>
              </div>
            </>
          )}

          <div className="adm__stat-card" style={{ '--stagger': isBossman ? 4 : 2 } as React.CSSProperties}>
            <div className="adm__stat-icon adm__stat-icon--pages">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div className="adm__stat-body">
              <span className="adm__stat-value">{totalPages}</span>
              <span className="adm__stat-label">Log Pages</span>
            </div>
          </div>
        </div>

        {/* Audit Log Panel */}
        <section className="adm__panel" style={{ '--stagger': 5 } as React.CSSProperties}>
          <div className="adm__panel-header">
            <div className="adm__panel-title-group">
              <h2 className="adm__panel-title">Audit Log</h2>
              <span className="adm__panel-count">{logTotal} entries</span>
            </div>
            <div className="adm__panel-actions">
              <button
                onClick={() => loadLogs(logPage)}
                className="adm__refresh-btn"
                title="Refresh logs"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
          </div>

          {logsLoading ? (
            <div className="adm__loading">
              <div className="adm__loading-bar" />
              <span>Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="adm__empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>No audit entries recorded yet.</span>
            </div>
          ) : (
            <>
              <div className="adm__table-wrap">
                <table className="adm__table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Operator</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} style={{ '--row-delay': `${i * 25}ms` } as React.CSSProperties}>
                        <td className="adm__td-time">
                          <span className="adm__time-relative">{formatTimeShort(log.created_at)}</span>
                          <span className="adm__time-full">{formatTime(log.created_at)}</span>
                        </td>
                        <td className="adm__td-user">{log.display_name || 'Unknown'}</td>
                        <td>
                          <span className={`adm__action-badge adm__action-badge--${ACTION_VARIANTS[log.action] || 'default'}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="adm__td-entity">{log.entity_name || log.entity_id}</td>
                        <td className="adm__td-details">
                          {log.details ? JSON.stringify(log.details).slice(0, 80) : '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="adm__pagination">
                <button
                  disabled={logPage === 0}
                  onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                  className="adm__page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Prev
                </button>
                <div className="adm__page-indicator">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i;
                    } else if (logPage < 3) {
                      page = i;
                    } else if (logPage > totalPages - 4) {
                      page = totalPages - 5 + i;
                    } else {
                      page = logPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        className={`adm__page-dot ${page === logPage ? 'adm__page-dot--active' : ''}`}
                        onClick={() => setLogPage(page)}
                      >
                        {page + 1}
                      </button>
                    );
                  })}
                  {totalPages > 5 && logPage < totalPages - 3 && (
                    <span className="adm__page-ellipsis">...</span>
                  )}
                </div>
                <button
                  disabled={logPage + 1 >= totalPages}
                  onClick={() => setLogPage((p) => p + 1)}
                  className="adm__page-btn"
                >
                  Next
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </section>

        {/* User Management Panel */}
        {isBossman && (
          <section className="adm__panel" style={{ '--stagger': 6 } as React.CSSProperties}>
            <div className="adm__panel-header">
              <div className="adm__panel-title-group">
                <h2 className="adm__panel-title">User Management</h2>
                <span className="adm__panel-count">{users.length} users</span>
              </div>
              <div className="adm__panel-actions">
                <button
                  onClick={() => loadUsers()}
                  className="adm__refresh-btn"
                  title="Refresh users"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </button>
              </div>
            </div>

            {usersLoading ? (
              <div className="adm__loading">
                <div className="adm__loading-bar" />
                <span>Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="adm__empty">
                <span>No users found.</span>
              </div>
            ) : (
              <div className="adm__table-wrap">
                <table className="adm__table adm__table--users">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={user.id} style={{ '--row-delay': `${i * 30}ms` } as React.CSSProperties}>
                        <td>
                          <div className="adm__user-cell">
                            <div
                              className="adm__user-cell-avatar"
                              style={{ borderColor: ROLE_COLORS[user.role] }}
                            >
                              {user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="adm__user-cell-name">{user.display_name}</span>
                          </div>
                        </td>
                        <td className="adm__td-email">{user.email}</td>
                        <td>
                          <span
                            className="adm__role-badge"
                            style={{
                              '--role-color': ROLE_COLORS[user.role],
                            } as React.CSSProperties}
                          >
                            <span className="adm__role-badge-dot" />
                            {user.role}
                          </span>
                        </td>
                        <td className="adm__td-time">
                          <span className="adm__time-relative">{formatTimeShort(user.created_at)}</span>
                          <span className="adm__time-full">{formatTime(user.created_at)}</span>
                        </td>
                        <td>
                          {user.id === currentProfile?.id ? (
                            <span className="adm__you-label">You</span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole, user.display_name)}
                              disabled={roleUpdating === user.id}
                              className="adm__role-select"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="bossman">bossman</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <footer className="adm__footer">
          Galaxy Map Administration &middot; Authorized Personnel Only
        </footer>
      </div>
    </div>
  );
}
