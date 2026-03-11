
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  display_name text not null default '',
  role        text not null default 'user'
                check (role in ('user', 'galaxy_user', 'admin', 'bossman')),
  galaxy_map_requested boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_select_bossman" on public.profiles
  for select to authenticated
  using (public.current_user_role() = 'bossman');
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_user_role());
create policy "profiles_update_bossman" on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'bossman');

create table if not exists public.custom_systems (
  id           text primary key,
  name         text not null,
  position_x   double precision not null default 0,
  position_y   double precision not null default 0,
  position_z   double precision not null default 0,
  custom_color text,
  marker_size  double precision,
  planets      jsonb not null default '[]'::jsonb,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.custom_systems enable row level security;

create policy "custom_systems_select" on public.custom_systems
  for select to authenticated using (true);

create policy "custom_systems_insert" on public.custom_systems
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_systems_update" on public.custom_systems
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_systems_delete" on public.custom_systems
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create table if not exists public.custom_fleets (
  id           text primary key,
  name         text not null,
  position_x   double precision not null default 0,
  position_y   double precision not null default 0,
  position_z   double precision not null default 0,
  faction      text not null default 'neutral',
  model_type   text not null default 'republic'
               check (model_type in ('sith', 'republic', 'valor', 'terminus')),
  ship_count   integer not null default 10,
  marker_size  double precision,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.custom_fleets
  add column if not exists model_type text;

update public.custom_fleets
set model_type = case
  when faction = 'sith_empire' then 'sith'
  else 'republic'
end
where model_type is null;

alter table public.custom_fleets
  alter column model_type set default 'republic',
  alter column model_type set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'custom_fleets_model_type_check'
  ) then
    alter table public.custom_fleets
      drop constraint custom_fleets_model_type_check;
  end if;
  alter table public.custom_fleets
    add constraint custom_fleets_model_type_check
    check (model_type in ('sith', 'republic', 'valor', 'terminus'));
end
$$;

alter table public.custom_fleets enable row level security;

create policy "custom_fleets_select" on public.custom_fleets
  for select to authenticated using (true);

create policy "custom_fleets_insert" on public.custom_fleets
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_fleets_update" on public.custom_fleets
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_fleets_delete" on public.custom_fleets
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id),
  action      text not null,
  entity_type text not null,
  entity_id   text not null default '',
  entity_name text not null default '',
  details     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select" on public.audit_logs
  for select to authenticated
  using (public.current_user_role() in ('admin', 'bossman'));
create policy "audit_logs_insert" on public.audit_logs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_role() in ('admin', 'bossman')
  );

create or replace function public.fetch_audit_logs_page(
  p_limit  integer     default 40,
  p_offset integer     default 0,
  p_query  text        default null,
  p_since  timestamptz default null,
  p_action text        default null
)
returns table (
  id          bigint,
  user_id     uuid,
  action      text,
  entity_type text,
  entity_id   text,
  entity_name text,
  details     jsonb,
  created_at  timestamptz,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with nq as (
    select
      nullif(btrim(p_query),  '') as q,
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
  from public.audit_logs  logs
  left join public.profiles profiles on profiles.id = logs.user_id
  cross join nq
  where public.current_user_role() in ('admin', 'bossman')
    and (
      nq.q is null
      or logs.action                         ilike '%' || nq.q || '%'
      or logs.entity_name                    ilike '%' || nq.q || '%'
      or logs.entity_id                      ilike '%' || nq.q || '%'
      or coalesce(profiles.display_name, '') ilike '%' || nq.q || '%'
    )
    and (p_since is null or logs.created_at >= p_since)
    and (nq.a    is null or logs.action = nq.a)
  order by logs.created_at desc, logs.id desc
  limit  least(greatest(coalesce(p_limit,  40), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) from public;
grant execute on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) to authenticated;

create or replace function public.fetch_audit_logs_total(
  p_query  text        default null,
  p_since  timestamptz default null,
  p_action text        default null
)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  with nq as (
    select
      nullif(btrim(p_query),  '') as q,
      nullif(btrim(p_action), '') as a
  )
  select count(*)::bigint
  from public.audit_logs  logs
  left join public.profiles profiles on profiles.id = logs.user_id
  cross join nq
  where public.current_user_role() in ('admin', 'bossman')
    and (
      nq.q is null
      or logs.action                         ilike '%' || nq.q || '%'
      or logs.entity_name                    ilike '%' || nq.q || '%'
      or logs.entity_id                      ilike '%' || nq.q || '%'
      or coalesce(profiles.display_name, '') ilike '%' || nq.q || '%'
    )
    and (p_since is null or logs.created_at >= p_since)
    and (nq.a    is null or logs.action = nq.a);
$$;

revoke all on function public.fetch_audit_logs_total(text, timestamptz, text) from public;
grant execute on function public.fetch_audit_logs_total(text, timestamptz, text) to authenticated;

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings_select" on public.app_settings
  for select to authenticated
  using (public.current_user_role() in ('admin', 'bossman'));

create policy "app_settings_update" on public.app_settings
  for update to authenticated
  using (public.current_user_role() in ('admin', 'bossman'));

insert into public.app_settings (key, value)
values ('current_year', '3956')
on conflict (key) do nothing;
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role, galaxy_map_requested)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'user',
    coalesce((new.raw_user_meta_data ->> 'galaxy_map_requested')::boolean, false)
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

drop trigger if exists custom_systems_updated_at on public.custom_systems;
create trigger custom_systems_updated_at
  before update on public.custom_systems
  for each row execute function public.update_updated_at();

drop trigger if exists custom_fleets_updated_at on public.custom_fleets;
create trigger custom_fleets_updated_at
  before update on public.custom_fleets
  for each row execute function public.update_updated_at();

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.update_updated_at();

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);
create index if not exists idx_custom_systems_created_by on public.custom_systems (created_by);
create index if not exists idx_custom_fleets_created_by on public.custom_fleets (created_by);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_custom_fleets_faction on public.custom_fleets (faction);

-- Custom factions table
create table if not exists public.custom_factions (
  id          text primary key,
  label       text not null,
  marker_color text not null,
  bar_color   text not null,
  sort_order  integer not null default 0,
  is_builtin  boolean not null default false,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.custom_factions enable row level security;

create policy "custom_factions_select" on public.custom_factions
  for select to authenticated using (true);

create policy "custom_factions_insert" on public.custom_factions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_factions_update" on public.custom_factions
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

create policy "custom_factions_delete" on public.custom_factions
  for delete to authenticated
  using (
    not is_builtin
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'bossman')
    )
  );

drop trigger if exists custom_factions_updated_at on public.custom_factions;
create trigger custom_factions_updated_at
  before update on public.custom_factions
  for each row execute function public.update_updated_at();

-- Fleet composition column
alter table public.custom_fleets
  add column if not exists composition jsonb not null default '[]'::jsonb;

-- Optional fleet commander metadata
alter table public.custom_fleets
  add column if not exists commander text;

-- Seed built-in factions
insert into public.custom_factions (id, label, marker_color, bar_color, sort_order, is_builtin)
values
  ('galactic_republic', 'Galactic Republic', '#FFD700', '#C8AA6E', 0, true),
  ('sith_empire',       'Sith Empire',       '#DC143C', '#DC143C', 1, true),
  ('hutt_cartel',       'Hutt Cartel',       '#8B9A46', '#8B9A46', 2, true),
  ('neutral',           'Neutral',           '#808080', '#808080', 3, true),
  ('contested',         'Contested',         '#FF8C00', '#FF8C00', 4, true)
on conflict (id) do nothing;

-- ── Feedback ──────────────────────────────────────────────────────────────────
create table if not exists public.feedback (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid references public.profiles(id) on delete set null,
  display_name text not null default '',
  category     text not null check (category in ('feature_request', 'bug', 'other')),
  other_label  text,
  message      text not null,
  created_at   timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "feedback_select_bossman" on public.feedback
  for select to authenticated
  using (public.current_user_role() = 'bossman');

create policy "feedback_insert_authenticated" on public.feedback
  for insert to authenticated
  with check (auth.uid() is not null);

create policy "feedback_delete_bossman" on public.feedback
  for delete to authenticated
  using (public.current_user_role() = 'bossman');

-- ── Profile Guards and Sync ───────────────────────────────────────────────────
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email
     and current_setting('app.allow_profile_email_sync', true) is distinct from 'true' then
    raise exception 'Profile email is managed by authentication';
  end if;

  if new.role is distinct from old.role
     and current_setting('app.allow_profile_role_update', true) is distinct from 'true' then
    raise exception 'Use set_user_role() to change roles';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive_fields on public.profiles;
create trigger profiles_guard_sensitive_fields
  before update on public.profiles
  for each row execute function public.guard_profile_sensitive_fields();

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    perform set_config('app.allow_profile_email_sync', 'true', true);

    update public.profiles
    set email = coalesce(new.email, ''),
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email_from_auth();

-- ── Secure Role Changes ───────────────────────────────────────────────────────
create or replace function public.set_user_role(
  p_user_id uuid,
  p_role    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id      uuid := auth.uid();
  v_actor_role    text;
  v_old_role      text;
  v_display_name  text;
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

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;

create or replace function public.fetch_user_management_profiles()
returns table (
  id                   uuid,
  display_name         text,
  email                text,
  role                 text,
  galaxy_map_requested boolean,
  created_at           timestamptz,
  updated_at           timestamptz,
  can_manage           boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id   uuid := auth.uid();
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

revoke all on function public.fetch_user_management_profiles() from public;
grant execute on function public.fetch_user_management_profiles() to authenticated;

-- ── Feedback Integrity ────────────────────────────────────────────────────────
create or replace function public.prepare_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  new.user_id := auth.uid();

  if new.user_id is null then
    raise exception 'Invalid feedback user';
  end if;

  new.message := btrim(new.message);
  if new.message = '' then
    raise exception 'Feedback message is required';
  end if;

  if char_length(new.message) > 2000 then
    raise exception 'Feedback message is too long';
  end if;

  if new.category = 'other' then
    new.other_label := nullif(btrim(coalesce(new.other_label, '')), '');
    if new.other_label is null then
      raise exception 'Other feedback requires a label';
    end if;
  else
    new.other_label := null;
  end if;

  select display_name
  into v_display_name
  from public.profiles
  where id = new.user_id;

  new.display_name := coalesce(
    nullif(v_display_name, ''),
    'Anonymous'
  );

  return new;
end;
$$;

drop trigger if exists feedback_prepare_insert on public.feedback;
create trigger feedback_prepare_insert
  before insert on public.feedback
  for each row execute function public.prepare_feedback_insert();

-- ── Galaxy Access Policies ────────────────────────────────────────────────────
drop policy if exists "custom_systems_select" on public.custom_systems;
create policy "custom_systems_select" on public.custom_systems
  for select to authenticated
  using (public.current_user_role() in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "custom_fleets_select" on public.custom_fleets;
create policy "custom_fleets_select" on public.custom_fleets
  for select to authenticated
  using (public.current_user_role() in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "custom_factions_select" on public.custom_factions;
create policy "custom_factions_select" on public.custom_factions
  for select to authenticated
  using (public.current_user_role() in ('galaxy_user', 'admin', 'bossman'));

-- ── Article Image Bucket Constraints ──────────────────────────────────────────
update storage.buckets
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array[
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
where id = 'article-images';
