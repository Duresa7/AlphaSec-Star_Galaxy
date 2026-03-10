import { useEffect, useState, useCallback, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import {
  fetchAuditLogPage,
  fetchAuditLogTotal,
  fetchAllProfiles,
  updateUserRole,
} from "@/data/supabaseStorage";
import type { AuditLogEntry, UserProfile, UserRole } from "@/types";

const PAGE_SIZE = 40;

const ACTION_LABELS: Record<string, string> = {
  system_created: "Created System",
  system_moved: "Moved System",
  system_deleted: "Deleted System",
  system_resized: "Resized System",
  fleet_created: "Created Fleet",
  fleet_moved: "Moved Fleet",
  fleet_deleted: "Deleted Fleet",
  fleet_resized: "Resized Fleet",
  planet_stats_updated: "Updated Planet",
  role_changed: "Changed Role",
};

type TimeFilter = "" | "24h" | "7d" | "30d";

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  "": "All time",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

function getSinceTimestamp(filter: TimeFilter): string | null {
  if (!filter) return null;
  const now = new Date();
  if (filter === "24h") now.setHours(now.getHours() - 24);
  else if (filter === "7d") now.setDate(now.getDate() - 7);
  else if (filter === "30d") now.setDate(now.getDate() - 30);
  return now.toISOString();
}

const ROLE_COLORS: Record<UserRole, string> = {
  user: "#6b7280",
  galaxy_user: "#7c3aed",
  admin: "#1a73e8",
  bossman: "#92761b",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

function getActionTone(action: string): "create" | "move" | "update" {
  if (action.includes("created")) return "create";
  if (action.includes("moved")) return "move";
  return "update";
}

function matchesUser(user: UserProfile, query: string): boolean {
  if (!query) return true;
  const text = [
    user.display_name,
    user.email,
    user.role,
    formatTime(user.created_at),
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(query);
}

export function AdminPage() {
  const location = useLocation();
  const { profile: currentProfile } = useAuth();
  const { isBossman } = useRole();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedAuditQuery, setDebouncedAuditQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("");
  const [actionFilter, setActionFilter] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isUsersView = location.pathname.startsWith("/admin/users");
  const isAuditView = !isUsersView;

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const profiles = await fetchAllProfiles();
    setUsers(profiles);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuditView) {
      setDebouncedAuditQuery("");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextQuery = searchInput.trim();
      setDebouncedAuditQuery((prevQuery) => {
        if (prevQuery !== nextQuery) setLogPage(0);
        return nextQuery;
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isAuditView, searchInput]);

  const sinceTimestamp = useMemo(
    () => getSinceTimestamp(timeFilter),
    [timeFilter],
  );
  const actionArg = actionFilter || null;

  useEffect(() => {
    if (!isAuditView) return;
    let cancelled = false;

    async function loadAuditLogs() {
      setLogsLoading(true);
      const offset = logPage * PAGE_SIZE;

      if (logPage === 0) {
        const [fetchedLogs, total] = await Promise.all([
          fetchAuditLogPage(
            PAGE_SIZE,
            offset,
            debouncedAuditQuery,
            sinceTimestamp,
            actionArg,
          ),
          fetchAuditLogTotal(debouncedAuditQuery, sinceTimestamp, actionArg),
        ]);
        if (!cancelled) {
          setLogs(fetchedLogs);
          setLogTotal(total);
          setLogsLoading(false);
        }
        return;
      }

      const fetchedLogs = await fetchAuditLogPage(
        PAGE_SIZE,
        offset,
        debouncedAuditQuery,
        sinceTimestamp,
        actionArg,
      );
      if (!cancelled) {
        setLogs(fetchedLogs);
        setLogsLoading(false);
      }
    }

    loadAuditLogs();
    return () => {
      cancelled = true;
    };
  }, [isAuditView, logPage, debouncedAuditQuery, sinceTimestamp, actionArg]);

  useEffect(() => {
    if (isUsersView && isBossman) loadUsers();
  }, [isUsersView, isBossman, loadUsers]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  useEffect(() => {
    setSearchInput("");
    setDebouncedAuditQuery("");
    setTimeFilter("");
    setActionFilter("");
    setLogPage(0);
  }, [location.pathname]);

  const searchQuery = searchInput.trim().toLowerCase();
  const isSearchActive = searchQuery.length > 0;
  const isAuditSearchActive = debouncedAuditQuery.length > 0;
  const isAuditFiltered = isAuditSearchActive || !!timeFilter || !!actionFilter;

  const handleAuditRefresh = useCallback(async () => {
    if (!isAuditView) return;
    setLogsLoading(true);
    const [fetchedLogs, total] = await Promise.all([
      fetchAuditLogPage(
        PAGE_SIZE,
        logPage * PAGE_SIZE,
        debouncedAuditQuery,
        sinceTimestamp,
        actionArg,
      ),
      fetchAuditLogTotal(debouncedAuditQuery, sinceTimestamp, actionArg),
    ]);
    setLogs(fetchedLogs);
    setLogTotal(total);
    setLogsLoading(false);
  }, [isAuditView, logPage, debouncedAuditQuery, sinceTimestamp, actionArg]);

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
  ) => {
    if (!currentProfile) return;
    setRoleUpdating(userId);
    const { error } = await updateUserRole(userId, newRole);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: newRole,
                galaxy_map_requested: newRole === "user" ? u.galaxy_map_requested : false,
              }
            : u,
        ),
      );
    }
    setRoleUpdating(null);
  };

  const totalPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE));
  const usersToRender = users.filter((user) => matchesUser(user, searchQuery));
  const pendingRequests = users.filter((u) => u.galaxy_map_requested && u.role === "user");

  return (
    <div
      className={`admin-page${isDrawerOpen ? " admin-page--drawer-open" : ""}`}
    >
      <div
        className={`admin-page__overlay${isDrawerOpen ? " admin-page__overlay--open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden={!isDrawerOpen}
      />
      <div className="admin-page__shell">
        <aside
          className={`admin-page__sidebar${isDrawerOpen ? " admin-page__sidebar--open" : ""}`}
        >
          <div className="admin-page__sidebar-head">
            <span className="admin-page__brand-mark" aria-hidden>
              SW
            </span>
            <span className="admin-page__brand-text">Admin</span>
          </div>
          <nav className="admin-page__nav" aria-label="Admin navigation">
            <NavLink
              to="/map"
              className="admin-page__nav-item"
              onClick={() => setIsDrawerOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Exit to Map</span>
            </NavLink>
            <NavLink
              to="/admin/audit"
              className="admin-page__nav-item"
              onClick={() => setIsDrawerOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="M5 6h14" />
                <path d="M5 12h14" />
                <path d="M5 18h14" />
              </svg>
              <span>Audit Log</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className="admin-page__nav-item"
              onClick={() => setIsDrawerOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="3" />
                <path d="M22 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a3 3 0 010 5.75" />
              </svg>
              <span>Users</span>
            </NavLink>
          </nav>
        </aside>

        <main className="admin-page__main">
          <div className="admin-page__topbar">
            <div className="admin-page__topbar-left">
              <button
                type="button"
                className="admin-page__menu-btn"
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={isDrawerOpen}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              </button>
              <div>
                <h1 className="admin-page__title">
                  {isUsersView ? "User Management" : "Audit Log"}
                </h1>
                <p className="admin-page__subtitle">Admin Control Panel</p>
              </div>
            </div>
            <div className="admin-page__topbar-tools">
              <label className="admin-page__search-wrap" htmlFor="admin-search">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  id="admin-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    isUsersView ? "Search users" : "Search audit logs"
                  }
                />
              </label>
              {isAuditView && (
                <button
                  type="button"
                  className="admin-page__refresh-btn"
                  onClick={() => void handleAuditRefresh()}
                  disabled={logsLoading}
                >
                  Refresh
                </button>
              )}
              {currentProfile && (
                <div className="admin-page__user-pill">
                  <span className="admin-page__user-meta">
                    <span className="admin-page__user-name">
                      {currentProfile.display_name}
                    </span>
                    <span className="admin-page__user-role">
                      {currentProfile.role}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="admin-page__grid">
            {isAuditView && (
              <section className="admin-page__section admin-page__section--full">
                <h2 className="admin-page__section-title">Audit Log</h2>

                <div className="admin-page__filters">
                  <div className="admin-page__filter-group">
                    <span className="admin-page__filter-label">Recent</span>
                    <div className="admin-page__filter-pills">
                      {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map(
                        (key) => (
                          <button
                            key={key}
                            type="button"
                            className={`admin-page__filter-pill${timeFilter === key ? " admin-page__filter-pill--active" : ""}`}
                            onClick={() => {
                              setTimeFilter(key);
                              setLogPage(0);
                            }}
                          >
                            {TIME_FILTER_LABELS[key]}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="admin-page__filter-group">
                    <span className="admin-page__filter-label">Action</span>
                    <div className="admin-page__filter-pills">
                      <button
                        type="button"
                        className={`admin-page__filter-pill${actionFilter === "" ? " admin-page__filter-pill--active" : ""}`}
                        onClick={() => {
                          setActionFilter("");
                          setLogPage(0);
                        }}
                      >
                        All
                      </button>
                      {Object.entries(ACTION_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`admin-page__filter-pill${actionFilter === key ? " admin-page__filter-pill--active" : ""}`}
                          onClick={() => {
                            setActionFilter(key);
                            setLogPage(0);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {logsLoading ? (
                  <p className="admin-page__loading">Loading audit logs...</p>
                ) : logs.length === 0 ? (
                  <p className="admin-page__empty">
                    {isAuditSearchActive
                      ? "No matching audit entries."
                      : "No audit entries yet."}
                  </p>
                ) : (
                  <>
                    <div className="admin-page__table-wrap admin-page__table-wrap--audit">
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
                              <td className="admin-page__td-time">
                                {formatTime(log.created_at)}
                              </td>
                              <td>{log.display_name || "Unknown"}</td>
                              <td>
                                <span
                                  className={`admin-page__action-badge admin-page__action-badge--${getActionTone(log.action)}`}
                                >
                                  {ACTION_LABELS[log.action] || log.action}
                                </span>
                              </td>
                              <td>{log.entity_name || log.entity_id}</td>
                              <td className="admin-page__td-details">
                                {log.details
                                  ? JSON.stringify(log.details).slice(0, 80)
                                  : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-page__pagination">
                      <button
                        disabled={logPage === 0 || logsLoading}
                        onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                        className="admin-page__page-btn"
                      >
                        Prev
                      </button>
                      <span className="admin-page__page-info">
                        Page {logPage + 1} of {totalPages}
                      </span>
                      <button
                        disabled={logPage + 1 >= totalPages || logsLoading}
                        onClick={() => setLogPage((p) => p + 1)}
                        className="admin-page__page-btn"
                      >
                        Next
                      </button>
                    </div>
                    {isAuditFiltered && (
                      <p className="admin-page__search-meta">
                        Showing {logs.length} of {logTotal}{" "}
                        matching result{logTotal === 1 ? "" : "s"}
                      </p>
                    )}
                  </>
                )}
              </section>
            )}

            {isUsersView && (
              <section className="admin-page__section admin-page__section--full">
                <h2 className="admin-page__section-title">User Management</h2>

                {!isBossman ? (
                  <p className="admin-page__empty">
                    Only bossman can access user management.
                  </p>
                ) : usersLoading ? (
                  <p className="admin-page__loading">Loading users...</p>
                ) : (
                  <>
                    {pendingRequests.length > 0 && (
                      <div className="admin-page__pending-galaxy">
                        <h3 className="admin-page__pending-galaxy-title">
                          Pending Galaxy Map Requests
                        </h3>
                        <div className="admin-page__table-wrap">
                          <table className="admin-page__table">
                            <thead>
                              <tr>
                                <th>Display Name</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingRequests.map((user) => (
                                  <tr key={user.id}>
                                    <td style={{ fontWeight: 600 }}>
                                      {user.display_name}
                                    </td>
                                    <td className="admin-page__td-email">
                                      {user.email}
                                    </td>
                                    <td className="admin-page__td-time">
                                      {formatTime(user.created_at)}
                                    </td>
                                    <td>
                                      <button
                                        className="admin-page__grant-btn"
                                        disabled={roleUpdating === user.id}
                                        onClick={() =>
                                          handleRoleChange(
                                            user.id,
                                            "galaxy_user",
                                          )
                                        }
                                      >
                                        {roleUpdating === user.id
                                          ? "Granting..."
                                          : "Grant Access"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {usersToRender.length === 0 ? (
                      <p className="admin-page__empty">
                        {isSearchActive
                          ? "No matching users found."
                          : "No users found."}
                      </p>
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
                            {usersToRender.map((user) => (
                              <tr key={user.id}>
                                <td style={{ fontWeight: 600 }}>
                                  {user.display_name}
                                </td>
                                <td className="admin-page__td-email">
                                  {user.email}
                                </td>
                                <td>
                                  <span
                                    className="admin-page__role-badge"
                                    style={{
                                      color: ROLE_COLORS[user.role],
                                      borderColor: ROLE_COLORS[user.role],
                                    }}
                                  >
                                    {user.role}
                                  </span>
                                </td>
                                <td className="admin-page__td-time">
                                  {formatTime(user.created_at)}
                                </td>
                                <td>
                                  {user.id === currentProfile?.id ? (
                                    <span className="admin-page__you-label">
                                      You
                                    </span>
                                  ) : (
                                    <select
                                      value={user.role}
                                      onChange={(e) =>
                                        handleRoleChange(
                                          user.id,
                                          e.target.value as UserRole,
                                        )
                                      }
                                      disabled={roleUpdating === user.id}
                                      className="admin-page__role-select"
                                    >
                                      <option value="user">user</option>
                                      <option value="galaxy_user">
                                        galaxy_user
                                      </option>
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
                  </>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
