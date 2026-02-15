
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
               check (model_type in ('sith', 'republic', 'venator')),
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
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custom_fleets_model_type_check'
  ) then
    alter table public.custom_fleets
      add constraint custom_fleets_model_type_check
      check (model_type in ('sith', 'republic', 'venator'));
  end if;
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

create or replace function public.fetch_audit_logs_with_display_names(
  p_limit integer default 50,
  p_offset integer default 0
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
  display_name text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    logs.id,
    logs.user_id,
    logs.action,
    logs.entity_type,
    logs.entity_id,
    logs.entity_name,
    logs.details,
    logs.created_at,
    profiles.display_name,
    count(*) over() as total_count
  from public.audit_logs logs
  left join public.profiles profiles on profiles.id = logs.user_id
  where public.current_user_role() in ('admin', 'bossman')
  order by logs.created_at desc
  limit greatest(coalesce(p_limit, 50), 0)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke all on function public.fetch_audit_logs_with_display_names(integer, integer) from public;
grant execute on function public.fetch_audit_logs_with_display_names(integer, integer) to authenticated;

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
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'user'
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
