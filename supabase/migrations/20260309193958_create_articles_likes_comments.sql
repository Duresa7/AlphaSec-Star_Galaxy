create table if not exists public.articles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title                text not null,
  excerpt              text not null default '',
  content              text not null default '',
  category             text not null default 'Engineering',
  author_id            uuid not null references public.profiles(id) on delete cascade,
  reading_time_minutes integer not null default 1,
  is_featured          boolean not null default false,
  is_trending          boolean not null default false,
  published            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.article_likes (
  article_id  uuid not null references public.articles(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (article_id, user_id)
);

create table if not exists public.article_comments (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references public.articles(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists articles_slug_key on public.articles (slug);
create index if not exists idx_articles_slug on public.articles (slug);
create index if not exists idx_articles_published on public.articles (published, created_at desc);
create index if not exists idx_article_likes_article on public.article_likes (article_id);
create index if not exists idx_article_comments_article on public.article_comments (article_id, created_at);

alter table public.articles enable row level security;
alter table public.article_likes enable row level security;
alter table public.article_comments enable row level security;

drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published" on public.articles
  for select to public
  using (published = true);

drop policy if exists "articles_select_bossman" on public.articles;
create policy "articles_select_bossman" on public.articles
  for select to public
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "articles_insert_bossman" on public.articles;
create policy "articles_insert_bossman" on public.articles
  for insert to public
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "articles_update_bossman" on public.articles;
create policy "articles_update_bossman" on public.articles
  for update to public
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "articles_delete_bossman" on public.articles;
create policy "articles_delete_bossman" on public.articles
  for delete to public
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "likes_select_authenticated" on public.article_likes;
create policy "likes_select_authenticated" on public.article_likes
  for select to public
  using (auth.uid() is not null);

drop policy if exists "likes_insert_own" on public.article_likes;
create policy "likes_insert_own" on public.article_likes
  for insert to public
  with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on public.article_likes;
create policy "likes_delete_own" on public.article_likes
  for delete to public
  using (auth.uid() = user_id);

drop policy if exists "comments_select_all" on public.article_comments;
create policy "comments_select_all" on public.article_comments
  for select to public
  using (true);

drop policy if exists "comments_insert_own" on public.article_comments;
create policy "comments_insert_own" on public.article_comments
  for insert to public
  with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own_or_bossman" on public.article_comments;
create policy "comments_delete_own_or_bossman" on public.article_comments
  for delete to public
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'bossman'
    )
  );
