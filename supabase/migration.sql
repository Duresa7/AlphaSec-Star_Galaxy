-- ═══════════════════════════════════════════════════
--  Star Wars Interactive Map – Supabase Migration
--  Tables, RLS policies, triggers, indexes
-- ═══════════════════════════════════════════════════

-- ─── 1. profiles ─────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  display_name text not null default '',
  role        text not null default 'user'
                check (role in ('user', 'admin', 'bossman')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: returns the current user's role without triggering RLS on profiles.
-- SECURITY DEFINER runs as the function owner (bypasses RLS), avoiding
-- infinite recursion when profile policies need to check the caller's role.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Users can read their own full profile
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

-- Admins/bossman can read all profiles (for admin panel user list)
create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (public.current_user_role() in ('admin', 'bossman'));

-- Users can update their own display_name only (role column is immutable to self)
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_user_role());

-- Bossman can update any profile (including role changes)
create policy "profiles_update_bossman" on public.profiles
  for update to authenticated
  using (public.current_user_role() = 'bossman');

-- ─── 2. custom_systems ──────────────────────────

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

-- ─── 3. custom_fleets ───────────────────────────

create table if not exists public.custom_fleets (
  id           text primary key,
  name         text not null,
  position_x   double precision not null default 0,
  position_y   double precision not null default 0,
  position_z   double precision not null default 0,
  faction      text not null default 'neutral',
  ship_count   integer not null default 10,
  marker_size  double precision,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

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

-- ─── 4. audit_logs ──────────────────────────────

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

-- user_id must match the caller to prevent audit log forgery
create policy "audit_logs_insert" on public.audit_logs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_role() in ('admin', 'bossman')
  );

-- ─── 5. app_settings (global key/value config) ─

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings_select" on public.app_settings
  for select to authenticated using (true);

create policy "app_settings_update" on public.app_settings
  for update to authenticated
  using (public.current_user_role() in ('admin', 'bossman'));

insert into public.app_settings (key, value)
values ('current_year', '3956')
on conflict (key) do nothing;

-- ─── 6. Triggers ────────────────────────────────

-- Auto-create profile on signup, bossman for duresakadi@gmail.com
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case
      when new.email = 'duresakadi@gmail.com' then 'bossman'
      else 'user'
    end
  );
  return new;
end;
$$;

-- Drop existing trigger if any, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at columns
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

-- ─── 7. Indexes ─────────────────────────────────

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);
create index if not exists idx_custom_systems_created_by on public.custom_systems (created_by);
create index if not exists idx_custom_fleets_created_by on public.custom_fleets (created_by);
