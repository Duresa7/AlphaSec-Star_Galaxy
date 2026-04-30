create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;

create or replace function app_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function app_private.current_user_role() from public, anon;
grant execute on function app_private.current_user_role() to authenticated, service_role;

create or replace function public.current_user_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select app_private.current_user_role()
$$;

revoke execute on function public.current_user_role() from public, anon, authenticated;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or (select app_private.current_user_role()) = 'bossman'
  );

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (
    (select auth.uid()) = id
    or (select app_private.current_user_role()) = 'bossman'
  )
  with check (
    (
      (select auth.uid()) = id
      and role = (select app_private.current_user_role())
    )
    or (select app_private.current_user_role()) = 'bossman'
  );

drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs
  for select to authenticated
  using ((select app_private.current_user_role()) in ('admin', 'bossman'));

drop policy if exists "audit_logs_insert" on public.audit_logs;
create policy "audit_logs_insert" on public.audit_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select app_private.current_user_role()) in ('admin', 'bossman')
  );

drop policy if exists "app_settings_select" on public.app_settings;
create policy "app_settings_select" on public.app_settings
  for select to authenticated
  using ((select app_private.current_user_role()) in ('admin', 'bossman'));

drop policy if exists "app_settings_update" on public.app_settings;
create policy "app_settings_update" on public.app_settings
  for update to authenticated
  using ((select app_private.current_user_role()) in ('admin', 'bossman'));

drop policy if exists "custom_systems_select" on public.custom_systems;
create policy "custom_systems_select" on public.custom_systems
  for select to authenticated
  using ((select app_private.current_user_role()) in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "custom_fleets_select" on public.custom_fleets;
create policy "custom_fleets_select" on public.custom_fleets
  for select to authenticated
  using ((select app_private.current_user_role()) in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "custom_factions_select" on public.custom_factions;
create policy "custom_factions_select" on public.custom_factions
  for select to authenticated
  using ((select app_private.current_user_role()) in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "feedback_select_bossman" on public.feedback;
create policy "feedback_select_bossman" on public.feedback
  for select to authenticated
  using ((select app_private.current_user_role()) = 'bossman');

drop policy if exists "feedback_delete_bossman" on public.feedback;
create policy "feedback_delete_bossman" on public.feedback
  for delete to authenticated
  using ((select app_private.current_user_role()) = 'bossman');

create or replace function app_private.fetch_audit_logs_page(
  p_limit integer default 40,
  p_offset integer default 0,
  p_query text default null,
  p_since timestamptz default null,
  p_action text default null
)
returns table (
  id bigint,
  user_id uuid,
  action text,
  entity_type text,
  entity_id text,
  entity_name text,
  details jsonb,
  created_at timestamptz,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with nq as (
    select
      nullif(btrim(p_query), '') as q,
      nullif(btrim(p_action), '') as a
  )
  select
    logs.id,
    logs.user_id,
    logs.action,
    logs.entity_type,
    logs.entity_id,
    logs.entity_name,
    logs.details,
    logs.created_at,
    profiles.display_name
  from public.audit_logs logs
  left join public.profiles profiles on profiles.id = logs.user_id
  cross join nq
  where app_private.current_user_role() in ('admin', 'bossman')
    and (
      nq.q is null
      or logs.action ilike '%' || nq.q || '%'
      or logs.entity_name ilike '%' || nq.q || '%'
      or logs.entity_id ilike '%' || nq.q || '%'
      or coalesce(profiles.display_name, '') ilike '%' || nq.q || '%'
    )
    and (p_since is null or logs.created_at >= p_since)
    and (nq.a is null or logs.action = nq.a)
  order by logs.created_at desc, logs.id desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke all on function app_private.fetch_audit_logs_page(integer, integer, text, timestamptz, text) from public, anon;
grant execute on function app_private.fetch_audit_logs_page(integer, integer, text, timestamptz, text) to authenticated, service_role;

create or replace function public.fetch_audit_logs_page(
  p_limit integer default 40,
  p_offset integer default 0,
  p_query text default null,
  p_since timestamptz default null,
  p_action text default null
)
returns table (
  id bigint,
  user_id uuid,
  action text,
  entity_type text,
  entity_id text,
  entity_name text,
  details jsonb,
  created_at timestamptz,
  display_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from app_private.fetch_audit_logs_page(p_limit, p_offset, p_query, p_since, p_action)
$$;

revoke execute on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) from public, anon;
grant execute on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) to authenticated;

create or replace function app_private.fetch_audit_logs_total(
  p_query text default null,
  p_since timestamptz default null,
  p_action text default null
)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  with nq as (
    select
      nullif(btrim(p_query), '') as q,
      nullif(btrim(p_action), '') as a
  )
  select count(*)::bigint
  from public.audit_logs logs
  left join public.profiles profiles on profiles.id = logs.user_id
  cross join nq
  where app_private.current_user_role() in ('admin', 'bossman')
    and (
      nq.q is null
      or logs.action ilike '%' || nq.q || '%'
      or logs.entity_name ilike '%' || nq.q || '%'
      or logs.entity_id ilike '%' || nq.q || '%'
      or coalesce(profiles.display_name, '') ilike '%' || nq.q || '%'
    )
    and (p_since is null or logs.created_at >= p_since)
    and (nq.a is null or logs.action = nq.a)
$$;

revoke all on function app_private.fetch_audit_logs_total(text, timestamptz, text) from public, anon;
grant execute on function app_private.fetch_audit_logs_total(text, timestamptz, text) to authenticated, service_role;

create or replace function public.fetch_audit_logs_total(
  p_query text default null,
  p_since timestamptz default null,
  p_action text default null
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select app_private.fetch_audit_logs_total(p_query, p_since, p_action)
$$;

revoke execute on function public.fetch_audit_logs_total(text, timestamptz, text) from public, anon;
grant execute on function public.fetch_audit_logs_total(text, timestamptz, text) to authenticated;

create or replace function app_private.fetch_user_management_profiles()
returns table (
  id uuid,
  display_name text,
  email text,
  role text,
  galaxy_map_requested boolean,
  created_at timestamptz,
  updated_at timestamptz,
  can_manage boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select profiles.role
  into v_actor_role
  from public.profiles
  where profiles.id = v_actor_id;

  if v_actor_role not in ('admin', 'bossman') then
    raise exception 'Only admins can view user management';
  end if;

  return query
  select
    profiles.id,
    profiles.display_name,
    case
      when v_actor_role = 'bossman' then nullif(profiles.email, '')
      else null
    end as email,
    profiles.role,
    profiles.galaxy_map_requested,
    profiles.created_at,
    profiles.updated_at,
    case
      when profiles.id = v_actor_id then false
      when v_actor_role = 'bossman' then true
      else profiles.role in ('user', 'galaxy_user')
    end as can_manage
  from public.profiles
  where v_actor_role = 'bossman'
     or (profiles.role in ('user', 'galaxy_user') and profiles.id <> v_actor_id)
  order by profiles.created_at asc, profiles.display_name asc, profiles.id asc;
end;
$$;

revoke all on function app_private.fetch_user_management_profiles() from public, anon;
grant execute on function app_private.fetch_user_management_profiles() to authenticated, service_role;

create or replace function public.fetch_user_management_profiles()
returns table (
  id uuid,
  display_name text,
  email text,
  role text,
  galaxy_map_requested boolean,
  created_at timestamptz,
  updated_at timestamptz,
  can_manage boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from app_private.fetch_user_management_profiles()
$$;

revoke execute on function public.fetch_user_management_profiles() from public, anon;
grant execute on function public.fetch_user_management_profiles() to authenticated;

create or replace function app_private.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_old_role text;
  v_display_name text;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select role
  into v_actor_role
  from public.profiles
  where id = v_actor_id;

  if v_actor_role not in ('admin', 'bossman') then
    raise exception 'Only admins can change roles';
  end if;

  if p_user_id is null then
    raise exception 'Target user is required';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'You cannot change your own role';
  end if;

  select role, display_name
  into v_old_role, v_display_name
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if v_actor_role = 'admin' then
    if p_role not in ('user', 'galaxy_user') then
      raise exception 'Admins can only assign user or galaxy_user roles';
    end if;

    if v_old_role not in ('user', 'galaxy_user') then
      raise exception 'Admins can only manage user or galaxy_user accounts';
    end if;
  elsif p_role not in ('user', 'galaxy_user', 'admin', 'bossman') then
    raise exception 'Invalid role';
  end if;

  if v_old_role = p_role then
    update public.profiles
    set galaxy_map_requested = case when p_role <> 'user' then false else galaxy_map_requested end,
        updated_at = now()
    where id = p_user_id;
    return;
  end if;

  perform set_config('app.allow_profile_role_update', 'true', true);

  update public.profiles
  set role = p_role,
      galaxy_map_requested = case when p_role <> 'user' then false else galaxy_map_requested end,
      updated_at = now()
  where id = p_user_id;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    details
  )
  values (
    v_actor_id,
    'role_changed',
    'user',
    p_user_id::text,
    coalesce(v_display_name, ''),
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_role
    )
  );
end;
$$;

revoke all on function app_private.set_user_role(uuid, text) from public, anon;
grant execute on function app_private.set_user_role(uuid, text) to authenticated, service_role;

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select app_private.set_user_role(p_user_id, p_role)
$$;

revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;
