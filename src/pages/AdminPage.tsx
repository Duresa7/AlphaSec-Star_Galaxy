import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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

const ROLE_COLORS: Record<UserRole, string> = {
  user: 'rgba(156, 163, 175, 0.85)',
  admin: 'rgba(96, 165, 250, 0.9)',
  bossman: 'rgba(251, 191, 36, 0.95)',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function AdminPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const { profile: currentProfile } = useAuth();
  const { isBossman } = useRole();

  // Audit log state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);

  // User management state
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
      await logAction(currentProfile.id, 'role_changed', 'user', userId, userName, { newRole });
      // Refresh logs to show the change
      loadLogs(logPage);
    }
    setRoleUpdating(null);
  };

  const totalPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE));

  return (
    <div
      className="admin-page"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      {/* Background layers */}
      <div className="admin-page__layer admin-page__layer--base" />
      <div className="admin-page__layer admin-page__layer--grid" />
      <div className="admin-page__layer admin-page__layer--veil" />

      <div className="admin-page__content">
        {/* Topbar */}
        <div className="admin-page__topbar">
          <Link to="/map" className="admin-page__back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Map
          </Link>
          {currentProfile && (
            <span className="admin-page__user-pill">
              {currentProfile.display_name}
              <span className="admin-page__role-dot" style={{ background: ROLE_COLORS[currentProfile.role as UserRole] }} />
            </span>
          )}
        </div>

        {/* Hero */}
        <div className="admin-page__hero">
          <p className="admin-page__kicker">Administration</p>
          <h1 className="admin-page__name">Admin Dashboard</h1>
          <p className="admin-page__role-label">Galaxy Map Management Console</p>
        </div>

        {/* Sections grid */}
        <div className="admin-page__grid">
          {/* Audit Log */}
          <div className="admin-page__section admin-page__section--full">
            <h2 className="admin-page__section-title">Audit Log</h2>

            {logsLoading ? (
              <p className="admin-page__loading">Loading audit logs...</p>
            ) : logs.length === 0 ? (
              <p className="admin-page__empty">No audit entries yet.</p>
            ) : (
              <>
                <div className="admin-page__table-wrap">
                  <table className="admin-page__table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="admin-page__td-time">{formatTime(log.created_at)}</td>
                          <td>{log.display_name || 'Unknown'}</td>
                          <td>
                            <span className="admin-page__action-badge">
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                          </td>
                          <td>{log.entity_name || log.entity_id}</td>
                          <td className="admin-page__td-details">
                            {log.details ? JSON.stringify(log.details).slice(0, 80) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="admin-page__pagination">
                  <button
                    disabled={logPage === 0}
                    onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                    className="admin-page__page-btn"
                  >
                    Prev
                  </button>
                  <span className="admin-page__page-info">
                    Page {logPage + 1} of {totalPages}
                  </span>
                  <button
                    disabled={logPage + 1 >= totalPages}
                    onClick={() => setLogPage((p) => p + 1)}
                    className="admin-page__page-btn"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Management — bossman only */}
          {isBossman && (
            <div className="admin-page__section admin-page__section--full">
              <h2 className="admin-page__section-title">User Management</h2>

              {usersLoading ? (
                <p className="admin-page__loading">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="admin-page__empty">No users found.</p>
              ) : (
                <div className="admin-page__table-wrap">
                  <table className="admin-page__table">
                    <thead>
                      <tr>
                        <th>Display Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td style={{ fontWeight: 600 }}>{user.display_name}</td>
                          <td className="admin-page__td-email">{user.email}</td>
                          <td>
                            <span
                              className="admin-page__role-badge"
                              style={{ color: ROLE_COLORS[user.role], borderColor: ROLE_COLORS[user.role] }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="admin-page__td-time">{formatTime(user.created_at)}</td>
                          <td>
                            {user.id === currentProfile?.id ? (
                              <span className="admin-page__you-label">You</span>
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole, user.display_name)}
                                disabled={roleUpdating === user.id}
                                className="admin-page__role-select"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
