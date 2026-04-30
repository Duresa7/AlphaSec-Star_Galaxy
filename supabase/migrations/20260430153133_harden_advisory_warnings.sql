revoke execute on function public.cleanup_old_audit_logs() from public, anon, authenticated;
revoke execute on function public.fetch_audit_logs_with_display_names(integer, integer) from public, anon, authenticated;
revoke execute on function public.guard_profile_sensitive_fields() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prepare_feedback_insert() from public, anon, authenticated;
revoke execute on function public.sync_profile_email_from_auth() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

revoke execute on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) from public, anon;
grant execute on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) to authenticated;

revoke execute on function public.fetch_audit_logs_total(text, timestamptz, text) from public, anon;
grant execute on function public.fetch_audit_logs_total(text, timestamptz, text) to authenticated;

revoke execute on function public.fetch_user_management_profiles() from public, anon;
grant execute on function public.fetch_user_management_profiles() to authenticated;

revoke execute on function public.set_user_role(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;

drop policy if exists "Public read article images" on storage.objects;

create index if not exists idx_articles_author_id on public.articles (author_id);
create index if not exists idx_article_likes_user_id on public.article_likes (user_id);
create index if not exists idx_article_comments_user_id on public.article_comments (user_id);
create index if not exists idx_feedback_user_id on public.feedback (user_id);
create index if not exists idx_notification_reads_notification_id on public.notification_reads (notification_id);

drop policy if exists "Bossman can insert notifications" on public.notifications;
create policy "Bossman can insert notifications" on public.notifications
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "Bossman can update notifications" on public.notifications;
create policy "Bossman can update notifications" on public.notifications
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "Bossman can delete notifications" on public.notifications;
create policy "Bossman can delete notifications" on public.notifications
  for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "Users can read their own reads" on public.notification_reads;
create policy "Users can read their own reads" on public.notification_reads
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own reads" on public.notification_reads;
create policy "Users can insert their own reads" on public.notification_reads
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own reads" on public.notification_reads;
create policy "Users can update their own reads" on public.notification_reads
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_authenticated" on public.feedback
  for insert to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists "comments_insert_own" on public.article_comments;
create policy "comments_insert_own" on public.article_comments
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "comments_delete_own_or_bossman" on public.article_comments;
create policy "comments_delete_own_or_bossman" on public.article_comments
  for delete
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "likes_select_authenticated" on public.article_likes;
create policy "likes_select_authenticated" on public.article_likes
  for select
  using ((select auth.uid()) is not null);

drop policy if exists "likes_insert_own" on public.article_likes;
create policy "likes_insert_own" on public.article_likes
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "likes_delete_own" on public.article_likes;
create policy "likes_delete_own" on public.article_likes
  for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "articles_select_published" on public.articles;
drop policy if exists "articles_select_bossman" on public.articles;
drop policy if exists "articles_select_public_or_bossman" on public.articles;
create policy "articles_select_public_or_bossman" on public.articles
  for select
  using (
    published = true
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "articles_insert_bossman" on public.articles;
create policy "articles_insert_bossman" on public.articles
  for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "articles_update_bossman" on public.articles;
create policy "articles_update_bossman" on public.articles
  for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "articles_delete_bossman" on public.articles;
create policy "articles_delete_bossman" on public.articles
  for delete
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'bossman'
    )
  );

drop policy if exists "Bossman manage timeline entries" on public.timeline_entries;
drop policy if exists "Bossman insert timeline entries" on public.timeline_entries;
drop policy if exists "Bossman update timeline entries" on public.timeline_entries;
drop policy if exists "Bossman delete timeline entries" on public.timeline_entries;
create policy "Bossman insert timeline entries" on public.timeline_entries
  for insert to authenticated
  with check (
    (
      select profiles.role
      from public.profiles
      where profiles.id = (select auth.uid())
    ) = 'bossman'
  );

create policy "Bossman update timeline entries" on public.timeline_entries
  for update to authenticated
  using (
    (
      select profiles.role
      from public.profiles
      where profiles.id = (select auth.uid())
    ) = 'bossman'
  )
  with check (
    (
      select profiles.role
      from public.profiles
      where profiles.id = (select auth.uid())
    ) = 'bossman'
  );

create policy "Bossman delete timeline entries" on public.timeline_entries
  for delete to authenticated
  using (
    (
      select profiles.role
      from public.profiles
      where profiles.id = (select auth.uid())
    ) = 'bossman'
  );
