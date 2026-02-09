-- ═══════════════════════════════════════════════════
-- Alpha Blog
-- Public read for published posts; admin-only authoring
-- ═══════════════════════════════════════════════════

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null,
  cover_image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  reading_time_minutes int4 not null default 1 check (reading_time_minutes > 0),
  published_at timestamptz,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_published_at_check
    check (
      (status = 'draft' and published_at is null)
      or (status = 'published' and published_at is not null)
    )
);

alter table blog_posts enable row level security;

drop policy if exists "Public can read published blog_posts" on blog_posts;
create policy "Public can read published blog_posts"
  on blog_posts for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can read all blog_posts" on blog_posts;
create policy "Admins can read all blog_posts"
  on blog_posts for select to authenticated
  using (is_admin(auth.uid()));

drop policy if exists "Admins can insert blog_posts" on blog_posts;
create policy "Admins can insert blog_posts"
  on blog_posts for insert to authenticated
  with check (is_admin(auth.uid()) and auth.uid() = created_by);

drop policy if exists "Admins can update blog_posts" on blog_posts;
create policy "Admins can update blog_posts"
  on blog_posts for update to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

drop policy if exists "Admins can delete blog_posts" on blog_posts;
create policy "Admins can delete blog_posts"
  on blog_posts for delete to authenticated
  using (is_admin(auth.uid()));

drop trigger if exists set_blog_posts_updated_at on blog_posts;
create trigger set_blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();

create index if not exists idx_blog_posts_published_at
  on blog_posts(published_at desc);

create index if not exists idx_blog_posts_created_at
  on blog_posts(created_at desc);

create index if not exists idx_blog_posts_tags_gin
  on blog_posts using gin(tags);

do $$
begin
  begin
    alter publication supabase_realtime add table blog_posts;
  exception
    when duplicate_object then null;
  end;
end $$;
