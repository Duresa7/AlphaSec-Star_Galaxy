-- ═══════════════════════════════════════════════════
-- Blog category support for WordPress-style organization
-- ═══════════════════════════════════════════════════

alter table if exists blog_posts
  add column if not exists category text;

update blog_posts
set category = lower(replace(trim(coalesce(tags[1], 'general')), ' ', '-'))
where category is null;

update blog_posts
set category = 'general'
where category is null
   or btrim(category) = '';

alter table if exists blog_posts
  alter column category set default 'general';

alter table if exists blog_posts
  alter column category set not null;

create index if not exists idx_blog_posts_category
  on blog_posts(category);
