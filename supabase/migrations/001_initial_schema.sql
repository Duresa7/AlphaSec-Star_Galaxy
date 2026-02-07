-- ═══════════════════════════════════════════════════
-- Star Wars Galaxy Map — Supabase Schema
-- Shared collaborative model: all authenticated users
-- can read everything; creators can edit/delete their own.
-- ═══════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
-- Utility: auto-update updated_at timestamp
-- ───────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ───────────────────────────────────────────────────
-- Table: profiles
-- ───────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Anyone authenticated can read profiles"
  on profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────────────────────────────────
-- Table: custom_systems
-- ───────────────────────────────────────────────────
create table custom_systems (
  id           text primary key,
  name         text not null,
  position_x   float8 not null,
  position_y   float8 not null default 0,
  position_z   float8 not null,
  custom_color text default '#FFFFFF',
  marker_size  float8,
  created_by   uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table custom_systems enable row level security;

create policy "Anyone authenticated can read custom_systems"
  on custom_systems for select to authenticated using (true);

create policy "Anyone authenticated can insert custom_systems"
  on custom_systems for insert to authenticated with check (auth.uid() = created_by);

create policy "Creator can update custom_systems"
  on custom_systems for update to authenticated using (auth.uid() = created_by);

create policy "Creator can delete custom_systems"
  on custom_systems for delete to authenticated using (auth.uid() = created_by);

create trigger set_custom_systems_updated_at
  before update on custom_systems
  for each row execute function update_updated_at();

-- ───────────────────────────────────────────────────
-- Table: custom_planets (child of custom_systems)
-- ───────────────────────────────────────────────────
create table custom_planets (
  id              text primary key,
  system_id       text not null references custom_systems(id) on delete cascade,
  name            text not null,
  type            text not null default 'terrestrial',
  radius          float8 not null default 1,
  faction         text not null default 'neutral',
  description     text,
  population      text,
  climate         text,
  terrain         text,
  notable         text[],
  faction_control jsonb,
  created_by      uuid not null references profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table custom_planets enable row level security;

create policy "Anyone authenticated can read custom_planets"
  on custom_planets for select to authenticated using (true);

create policy "Anyone authenticated can insert custom_planets"
  on custom_planets for insert to authenticated with check (auth.uid() = created_by);

create policy "Creator can update custom_planets"
  on custom_planets for update to authenticated using (auth.uid() = created_by);

create policy "Creator can delete custom_planets"
  on custom_planets for delete to authenticated using (auth.uid() = created_by);

create trigger set_custom_planets_updated_at
  before update on custom_planets
  for each row execute function update_updated_at();

-- ───────────────────────────────────────────────────
-- Table: custom_fleets
-- ───────────────────────────────────────────────────
create table custom_fleets (
  id           text primary key,
  name         text not null,
  faction      text not null default 'neutral',
  position_x   float8 not null,
  position_y   float8 not null default 0,
  position_z   float8 not null,
  ship_count   int4 not null default 10,
  flagship     text,
  commander    text,
  created_by   uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table custom_fleets enable row level security;

create policy "Anyone authenticated can read custom_fleets"
  on custom_fleets for select to authenticated using (true);

create policy "Anyone authenticated can insert custom_fleets"
  on custom_fleets for insert to authenticated with check (auth.uid() = created_by);

create policy "Creator can update custom_fleets"
  on custom_fleets for update to authenticated using (auth.uid() = created_by);

create policy "Creator can delete custom_fleets"
  on custom_fleets for delete to authenticated using (auth.uid() = created_by);

create trigger set_custom_fleets_updated_at
  before update on custom_fleets
  for each row execute function update_updated_at();

-- ───────────────────────────────────────────────────
-- Table: planet_stats_overrides
-- Overrides for built-in (static) planet data.
-- Any authenticated user can edit these (shared editing).
-- ───────────────────────────────────────────────────
create table planet_stats_overrides (
  planet_id       text primary key,
  system_id       text not null,
  population      text,
  faction_control jsonb,
  description     text,
  climate         text,
  terrain         text,
  notable         text[],
  updated_by      uuid not null references profiles(id) on delete cascade,
  updated_at      timestamptz not null default now()
);

alter table planet_stats_overrides enable row level security;

create policy "Anyone authenticated can read planet_stats_overrides"
  on planet_stats_overrides for select to authenticated using (true);

create policy "Anyone authenticated can insert planet_stats_overrides"
  on planet_stats_overrides for insert to authenticated with check (auth.uid() = updated_by);

create policy "Anyone authenticated can update planet_stats_overrides"
  on planet_stats_overrides for update to authenticated using (true);

create trigger set_planet_stats_overrides_updated_at
  before update on planet_stats_overrides
  for each row execute function update_updated_at();

-- ───────────────────────────────────────────────────
-- Enable Realtime for all custom data tables
-- ───────────────────────────────────────────────────
alter publication supabase_realtime add table custom_systems;
alter publication supabase_realtime add table custom_planets;
alter publication supabase_realtime add table custom_fleets;
alter publication supabase_realtime add table planet_stats_overrides;

-- ───────────────────────────────────────────────────
-- Indexes for common queries
-- ───────────────────────────────────────────────────
create index idx_custom_planets_system_id on custom_planets(system_id);
create index idx_custom_fleets_faction on custom_fleets(faction);
create index idx_planet_stats_overrides_system_id on planet_stats_overrides(system_id);
