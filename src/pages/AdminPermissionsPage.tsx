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
    <div className="w-screen h-screen overflow-y-auto bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="holo-panel mb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="holo-label mb-2">Admin Console</p>
              <h1
                className="text-xl uppercase tracking-[0.2em]"
                style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-amber)' }}
              >
                Permission Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/activity" className="holo-button" style={{ padding: '8px 12px' }}>
                Activity Log
              </Link>
              <Link to="/map" className="holo-button" style={{ padding: '8px 12px' }}>
                Back to Map
              </Link>
            </div>
          </div>
        </div>

        <div className="holo-panel mb-5">
          <p className="text-sm" style={{ color: 'var(--holo-text-muted)' }}>
            Admin users: {admins.length}
          </p>
          {error && (
            <p className="mt-2 text-sm border px-3 py-2" style={{ borderColor: 'rgba(220,20,60,0.35)', color: '#fca5a5' }}>
              {error}
            </p>
          )}
        </div>

        <div className="holo-panel">
          {isLoading ? (
            <p style={{ color: 'var(--holo-text-muted)' }}>Loading profiles...</p>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => {
                const isCurrentUser = profile.id === user?.id;
                return (
                  <div key={profile.id} className="holo-info-grid">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--holo-text-primary)' }}>
                          {formatName(profile)}
                        </p>
                        <p className="text-[11px] break-all" style={{ color: 'var(--holo-text-muted)' }}>
                          {profile.id}
                        </p>
                        {isCurrentUser && (
                          <span className="holo-badge mt-2 inline-block bg-cyan-500/20 border border-cyan-500/30 text-cyan-200">
                            You
                          </span>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: 'var(--holo-text-muted)' }}>
                        <input
                          type="checkbox"
                          checked={profile.isAdmin}
                          disabled={Boolean(isSaving)}
                          onChange={(event) => {
                            void handleAdminToggle(profile, event.target.checked);
                          }}
                        />
                        Admin
                      </label>
                    </div>

                    {profile.isAdmin && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {PERMISSION_KEYS.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center gap-2 text-xs uppercase tracking-wider border px-2 py-2"
                            style={{
                              borderColor: 'rgba(200, 170, 110, 0.2)',
                              color: 'var(--holo-text-muted)',
                            }}
                          >
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
