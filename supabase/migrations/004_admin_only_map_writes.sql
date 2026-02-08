-- ═══════════════════════════════════════════════════
-- Admin-only map writes + profile policy hardening
-- ═══════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
-- Profiles: tighten read scope and block self-escalation
-- ───────────────────────────────────────────────────
drop policy if exists "Anyone authenticated can read profiles" on profiles;
drop policy if exists "Users can read own profile or admins can read profiles" on profiles;
create policy "Users can read own profile or admins can read profiles"
  on profiles for select to authenticated
  using (auth.uid() = id or is_admin(auth.uid()));

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      has_admin_permission('manage_admin_permissions', auth.uid())
      or (
        is_admin = (select p.is_admin from profiles p where p.id = auth.uid())
        and admin_permissions = (select p.admin_permissions from profiles p where p.id = auth.uid())
      )
    )
  );

drop policy if exists "Permission managers can update profiles" on profiles;
create policy "Permission managers can update profiles"
  on profiles for update to authenticated
  using (has_admin_permission('manage_admin_permissions', auth.uid()))
  with check (has_admin_permission('manage_admin_permissions', auth.uid()));

-- ───────────────────────────────────────────────────
-- Custom systems: admin-only writes
-- ───────────────────────────────────────────────────
drop policy if exists "Anyone authenticated can insert custom_systems" on custom_systems;
drop policy if exists "Creator can update custom_systems" on custom_systems;
drop policy if exists "Creator can delete custom_systems" on custom_systems;
drop policy if exists "Any authenticated user can update custom_systems" on custom_systems;
drop policy if exists "Any authenticated user can delete custom_systems" on custom_systems;
drop policy if exists "Admins can insert custom_systems" on custom_systems;
drop policy if exists "Admins can update custom_systems" on custom_systems;
drop policy if exists "Admins can delete custom_systems" on custom_systems;

create policy "Admins can insert custom_systems"
  on custom_systems for insert to authenticated
  with check (is_admin(auth.uid()) and auth.uid() = created_by);

create policy "Admins can update custom_systems"
  on custom_systems for update to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins can delete custom_systems"
  on custom_systems for delete to authenticated
  using (is_admin(auth.uid()));

-- ───────────────────────────────────────────────────
-- Custom planets: admin-only writes
-- ───────────────────────────────────────────────────
drop policy if exists "Anyone authenticated can insert custom_planets" on custom_planets;
drop policy if exists "Creator can update custom_planets" on custom_planets;
drop policy if exists "Creator can delete custom_planets" on custom_planets;
drop policy if exists "Any authenticated user can update custom_planets" on custom_planets;
drop policy if exists "Any authenticated user can delete custom_planets" on custom_planets;
drop policy if exists "Admins can insert custom_planets" on custom_planets;
drop policy if exists "Admins can update custom_planets" on custom_planets;
drop policy if exists "Admins can delete custom_planets" on custom_planets;

create policy "Admins can insert custom_planets"
  on custom_planets for insert to authenticated
  with check (is_admin(auth.uid()) and auth.uid() = created_by);

create policy "Admins can update custom_planets"
  on custom_planets for update to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins can delete custom_planets"
  on custom_planets for delete to authenticated
  using (is_admin(auth.uid()));

-- ───────────────────────────────────────────────────
-- Custom fleets: admin-only writes
-- ───────────────────────────────────────────────────
drop policy if exists "Anyone authenticated can insert custom_fleets" on custom_fleets;
drop policy if exists "Creator can update custom_fleets" on custom_fleets;
drop policy if exists "Creator can delete custom_fleets" on custom_fleets;
drop policy if exists "Any authenticated user can update custom_fleets" on custom_fleets;
drop policy if exists "Any authenticated user can delete custom_fleets" on custom_fleets;
drop policy if exists "Admins can insert custom_fleets" on custom_fleets;
drop policy if exists "Admins can update custom_fleets" on custom_fleets;
drop policy if exists "Admins can delete custom_fleets" on custom_fleets;

create policy "Admins can insert custom_fleets"
  on custom_fleets for insert to authenticated
  with check (is_admin(auth.uid()) and auth.uid() = created_by);

create policy "Admins can update custom_fleets"
  on custom_fleets for update to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins can delete custom_fleets"
  on custom_fleets for delete to authenticated
  using (is_admin(auth.uid()));

-- ───────────────────────────────────────────────────
-- Planet stats overrides: admin-only writes
-- ───────────────────────────────────────────────────
drop policy if exists "Anyone authenticated can insert planet_stats_overrides" on planet_stats_overrides;
drop policy if exists "Anyone authenticated can update planet_stats_overrides" on planet_stats_overrides;
drop policy if exists "Admins can insert planet_stats_overrides" on planet_stats_overrides;
drop policy if exists "Admins can update planet_stats_overrides" on planet_stats_overrides;

create policy "Admins can insert planet_stats_overrides"
  on planet_stats_overrides for insert to authenticated
  with check (is_admin(auth.uid()) and auth.uid() = updated_by);

create policy "Admins can update planet_stats_overrides"
  on planet_stats_overrides for update to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()) and auth.uid() = updated_by);

-- ───────────────────────────────────────────────────
-- Action history: admin-only inserts
-- ───────────────────────────────────────────────────
drop policy if exists "Authenticated users can insert action_history" on action_history;
drop policy if exists "Admins can insert action_history" on action_history;
create policy "Admins can insert action_history"
  on action_history for insert to authenticated
  with check (is_admin(auth.uid()) and auth.uid() = actor_id);
