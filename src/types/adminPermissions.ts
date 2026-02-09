export type AdminPermissionKey =
  | 'view_activity_log'
  | 'run_global_history'
  | 'manage_admin_permissions';

export type AdminPermissions = Record<AdminPermissionKey, boolean>;

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  view_activity_log: false,
  run_global_history: false,
  manage_admin_permissions: false,
};
