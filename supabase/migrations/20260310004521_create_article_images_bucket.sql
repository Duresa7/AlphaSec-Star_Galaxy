insert into storage.buckets (id, name, public)
values ('article-images', 'article-images', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "Public read article images" on storage.objects;
create policy "Public read article images" on storage.objects
  for select to public
  using (bucket_id = 'article-images');

drop policy if exists "Bossman upload article images" on storage.objects;
create policy "Bossman upload article images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'article-images'
    and (
      select profiles.role
      from public.profiles
      where profiles.id = auth.uid()
    ) = 'bossman'
  );

drop policy if exists "Bossman delete article images" on storage.objects;
create policy "Bossman delete article images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'article-images'
    and (
      select profiles.role
      from public.profiles
      where profiles.id = auth.uid()
    ) = 'bossman'
  );
