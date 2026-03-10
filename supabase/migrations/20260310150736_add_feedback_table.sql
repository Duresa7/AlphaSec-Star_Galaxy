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

drop policy if exists "feedback_select_bossman" on public.feedback;
create policy "feedback_select_bossman" on public.feedback
  for select to authenticated
  using (public.current_user_role() = 'bossman');

drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_authenticated" on public.feedback
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "feedback_delete_bossman" on public.feedback;
create policy "feedback_delete_bossman" on public.feedback
  for delete to authenticated
  using (public.current_user_role() = 'bossman');
