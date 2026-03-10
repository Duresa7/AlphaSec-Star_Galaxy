drop table if exists public.service_statuses;

create table if not exists public.timeline_entries (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null default '',
  type             text not null default 'update'
                     check (type in ('update', 'release', 'incident', 'maintenance')),
  expanded_content text not null default '',
  "timestamp"      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.timeline_entries enable row level security;

drop policy if exists "Public read timeline entries" on public.timeline_entries;
create policy "Public read timeline entries" on public.timeline_entries
  for select to public
  using (true);

drop policy if exists "Bossman manage timeline entries" on public.timeline_entries;
create policy "Bossman manage timeline entries" on public.timeline_entries
  for all to authenticated
  using (
    (
      select profiles.role
      from public.profiles
      where profiles.id = auth.uid()
    ) = 'bossman'
  )
  with check (
    (
      select profiles.role
      from public.profiles
      where profiles.id = auth.uid()
    ) = 'bossman'
  );
