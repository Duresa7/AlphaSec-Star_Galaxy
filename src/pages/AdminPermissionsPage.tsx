import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  fetchProfilesForPermissionManagement,
  updateProfileAdminState,
  updateProfilePermissions,
  type AdminProfileRecord,
} from '@/data/adminPermissions';
import type { AdminPermissionKey, AdminPermissions } from '@/types/adminPermissions';
import { DEFAULT_ADMIN_PERMISSIONS } from '@/types/adminPermissions';
import { useAuthStore } from '@/store/authStore';

const PERMISSION_LABELS: Record<AdminPermissionKey, string> = {
  view_activity_log: 'View Activity Log',
  run_global_history: 'Run Global Undo/Redo',
  manage_admin_permissions: 'Manage Admin Permissions',
};

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as AdminPermissionKey[];

function formatName(profile: AdminProfileRecord): string {
  if (profile.displayName?.trim()) return profile.displayName.trim();
  return profile.id;
}

export function AdminPermissionsPage() {
  const { hasAdminPermission, user, initialize } = useAuthStore();
  const canManage = hasAdminPermission('manage_admin_permissions');

  const [profiles, setProfiles] = useState<AdminProfileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setError(null);
    const data = await fetchProfilesForPermissionManagement();
    setProfiles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!canManage) return;
    void loadProfiles();
  }, [canManage]);

  const admins = useMemo(() => profiles.filter((profile) => profile.isAdmin), [profiles]);

  if (!canManage) {
    return <Navigate to="/map" replace />;
  }

  const handleAdminToggle = async (profile: AdminProfileRecord, nextValue: boolean) => {
    if (profile.id === user?.id && !nextValue) {
      setError('You cannot remove your own admin access.');
      return;
    }

    setIsSaving(profile.id);
    setError(null);
    try {
      const nextPermissions: AdminPermissions = nextValue
        ? {
            view_activity_log: true,
            run_global_history: true,
            manage_admin_permissions: false,
          }
        : { ...DEFAULT_ADMIN_PERMISSIONS };

      await updateProfileAdminState(profile.id, nextValue, nextPermissions);
      if (profile.id === user?.id) {
        await initialize();
      }
      await loadProfiles();
    } catch (err) {
      console.error(err);
      setError('Failed to update admin status.');
    } finally {
      setIsSaving(null);
    }
  };

  const handlePermissionToggle = async (
    profile: AdminProfileRecord,
    permission: AdminPermissionKey,
    nextValue: boolean,
  ) => {
    if (!profile.isAdmin) return;
    setIsSaving(profile.id);
    setError(null);
    try {
      const nextPermissions: AdminPermissions = {
        ...profile.permissions,
        [permission]: nextValue,
      };

      // Prevent locking the current user out of this page accidentally.
      if (profile.id === user?.id && permission === 'manage_admin_permissions' && !nextValue) {
        setError('You cannot remove your own Manage Admin Permissions permission.');
        setIsSaving(null);
        return;
      }

      await updateProfilePermissions(profile.id, nextPermissions);
      if (profile.id === user?.id) {
        await initialize();
      }
      await loadProfiles();
    } catch (err) {
      console.error(err);
      setError('Failed to update admin permission.');
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <section className="portfolio-hero admin-console-hero" aria-label="Admin permission management">
      <div className="portfolio-hero__layer portfolio-hero__base-image" aria-hidden="true" />
      <div className="portfolio-hero__layer portfolio-hero__grid" aria-hidden="true" />
      <div className="portfolio-hero__layer portfolio-hero__alt-image admin-console-hero__alt" aria-hidden="true" />
      <div className="admin-console-hero__veil" aria-hidden="true" />

      <div className="admin-console">
        <div className="admin-console__container">
          <header className="admin-console__masthead">
            <div>
              <p className="admin-console__eyebrow">Administrative Console</p>
              <h1 className="admin-console__title">Permission Management</h1>
              <p className="admin-console__subtitle">
                Control who can access high-impact admin tools and operational permissions.
              </p>
            </div>
            <div className="admin-console__actions">
              <Link to="/admin/activity" className="admin-console__action">
                Activity Log
              </Link>
              <Link to="/map" className="admin-console__action admin-console__action--primary">
                Back to Map
              </Link>
            </div>
          </header>

          <section className="admin-console__panel">
            <div className="admin-console__panel-head">
              <h2 className="admin-console__panel-title">Access Summary</h2>
              <span className="admin-console__pill">{admins.length} Admins</span>
            </div>
            <p className="admin-console__copy">
              Assign admin roles and fine-grained permissions per operator profile.
            </p>
            {error && <p className="admin-console__alert">{error}</p>}
          </section>

          <section className="admin-console__panel">
            <div className="admin-console__panel-head">
              <h2 className="admin-console__panel-title">Profiles</h2>
              <span className="admin-console__pill admin-console__pill--muted">{profiles.length} Operators</span>
            </div>

            {isLoading ? (
              <p className="admin-console__copy">Loading profiles...</p>
            ) : (
              <div className="admin-console__profile-grid">
                {profiles.map((profile) => {
                  const isCurrentUser = profile.id === user?.id;
                  const savingProfile = isSaving === profile.id;
                  return (
                    <article
                      key={profile.id}
                      className={`admin-console__profile-card${savingProfile ? ' is-saving' : ''}`}
                    >
                      <div className="admin-console__profile-head">
                        <div className="admin-console__identity">
                          <p className="admin-console__profile-name">{formatName(profile)}</p>
                          <p className="admin-console__profile-id">{profile.id}</p>
                          <div className="admin-console__badge-row">
                            {isCurrentUser && <span className="admin-console__badge">You</span>}
                            {profile.isAdmin && (
                              <span className="admin-console__badge admin-console__badge--admin">Admin</span>
                            )}
                          </div>
                        </div>

                        <label className="admin-console__toggle">
                          <input
                            type="checkbox"
                            checked={profile.isAdmin}
                            disabled={Boolean(isSaving)}
                            onChange={(event) => {
                              void handleAdminToggle(profile, event.target.checked);
                            }}
                          />
                          <span>Admin Access</span>
                        </label>
                      </div>

                      {profile.isAdmin && (
                        <div className="admin-console__permissions-grid">
                          {PERMISSION_KEYS.map((permission) => (
                            <label key={permission} className="admin-console__permission-item">
                              <input
                                type="checkbox"
                                checked={profile.permissions[permission]}
                                disabled={Boolean(isSaving)}
                                onChange={(event) => {
                                  void handlePermissionToggle(profile, permission, event.target.checked);
                                }}
                              />
                              <span>{PERMISSION_LABELS[permission]}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
