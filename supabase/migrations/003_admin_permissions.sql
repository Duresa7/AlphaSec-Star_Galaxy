-- ═══════════════════════════════════════════════════
-- Granular admin permissions
-- ═══════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
-- Profiles: add granular admin permissions
-- ───────────────────────────────────────────────────
alter table profiles
  add column if not exists admin_permissions jsonb not null default
  '{
    "view_activity_log": true,
    "run_global_history": true,
    "manage_admin_permissions": true
  }'::jsonb;

create or replace function has_admin_permission(
  permission_name text,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        p.is_admin = true
        and coalesce((p.admin_permissions ->> permission_name)::boolean, false)
      from profiles p
      where p.id = user_id
    ),
    false
  );
$$;

grant execute on function has_admin_permission(text, uuid) to authenticated;

-- ───────────────────────────────────────────────────
-- Profiles update policy: allow permission managers
-- ───────────────────────────────────────────────────
drop policy if exists "Users can update their own profile" on profiles;

create policy "Users can update their own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Permission managers can update profiles"
  on profiles for update to authenticated
  using (has_admin_permission('manage_admin_permissions', auth.uid()))
  with check (has_admin_permission('manage_admin_permissions', auth.uid()));

-- ───────────────────────────────────────────────────
-- Activity log + action history policies now use granular permissions
-- ───────────────────────────────────────────────────
drop policy if exists "Admins can read activity_logs" on activity_logs;
create policy "Users with permission can read activity_logs"
  on activity_logs for select to authenticated
  using (has_admin_permission('view_activity_log', auth.uid()));

drop policy if exists "Admins can read action_history" on action_history;
create policy "Users with permission can read action_history"
  on action_history for select to authenticated
  using (has_admin_permission('run_global_history', auth.uid()));

drop policy if exists "Admins can update action_history" on action_history;
create policy "Users with permission can update action_history"
  on action_history for update to authenticated
  using (has_admin_permission('run_global_history', auth.uid()))
  with check (has_admin_permission('run_global_history', auth.uid()));
