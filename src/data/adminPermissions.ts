import { supabase } from '@/lib/supabase';
import { logActivity } from '@/data/activityLog';
import type { Json } from '@/types/database';
import type { AdminPermissions } from '@/types/adminPermissions';
import { DEFAULT_ADMIN_PERMISSIONS } from '@/types/adminPermissions';

type ProfilePermissionRow = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  admin_permissions: Json | null;
  created_at: string;
};

export interface AdminProfileRecord {
  id: string;
  displayName: string | null;
  isAdmin: boolean;
  permissions: AdminPermissions;
  createdAt: string;
}

export function normalizeAdminPermissions(value: Json | null | undefined): AdminPermissions {
  const base: AdminPermissions = { ...DEFAULT_ADMIN_PERMISSIONS };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;

  for (const key of Object.keys(base) as (keyof AdminPermissions)[]) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === 'boolean') {
      base[key] = raw;
    }
  }

  return base;
}

function toRecord(row: ProfilePermissionRow): AdminProfileRecord {
  return {
    id: row.id,
    displayName: row.display_name,
    isAdmin: row.is_admin,
    permissions: normalizeAdminPermissions(row.admin_permissions),
    createdAt: row.created_at,
  };
}

export async function fetchProfilesForPermissionManagement(): Promise<AdminProfileRecord[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin, admin_permissions, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch profiles for permission management:', error);
    return [];
  }

  const rows = (data || []) as ProfilePermissionRow[];
  return rows.map(toRecord);
}

export async function updateProfileAdminState(
  profileId: string,
  isAdmin: boolean,
  permissions: AdminPermissions,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_admin: isAdmin,
      admin_permissions: permissions as unknown as Json,
    })
    .eq('id', profileId);

  if (error) {
    console.error('Failed to update profile admin state:', error);
    throw error;
  }

  await logActivity({
    eventType: 'admin_permissions_updated',
    entityType: 'profile',
    entityId: profileId,
    message: `${isAdmin ? 'Granted' : 'Revoked'} admin access for ${profileId}`,
    metadata: {
      isAdmin,
      permissions,
    },
  });
}

export async function updateProfilePermissions(
  profileId: string,
  permissions: AdminPermissions,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ admin_permissions: permissions as unknown as Json })
    .eq('id', profileId);

  if (error) {
    console.error('Failed to update admin permissions:', error);
    throw error;
  }

  await logActivity({
    eventType: 'admin_permissions_updated',
    entityType: 'profile',
    entityId: profileId,
    message: `Updated admin permissions for ${profileId}`,
    metadata: {
      permissions,
    },
  });
}
