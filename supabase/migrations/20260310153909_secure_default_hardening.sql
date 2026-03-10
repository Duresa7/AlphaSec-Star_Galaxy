create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email
     and current_setting('app.allow_profile_email_sync', true) is distinct from 'true' then
    raise exception 'Profile email is managed by authentication';
  end if;

  if new.role is distinct from old.role
     and current_setting('app.allow_profile_role_update', true) is distinct from 'true' then
    raise exception 'Use set_user_role() to change roles';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive_fields on public.profiles;
create trigger profiles_guard_sensitive_fields
  before update on public.profiles
  for each row execute function public.guard_profile_sensitive_fields();

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    perform set_config('app.allow_profile_email_sync', 'true', true);

    update public.profiles
    set email = coalesce(new.email, ''),
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email_from_auth();

create or replace function public.set_user_role(
  p_user_id uuid,
  p_role    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id     uuid := auth.uid();
  v_actor_role   text;
  v_old_role     text;
  v_display_name text;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select role
  into v_actor_role
  from public.profiles
  where id = v_actor_id;

  if v_actor_role <> 'bossman' then
    raise exception 'Only bossman can change roles';
  end if;

  if p_user_id is null then
    raise exception 'Target user is required';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'You cannot change your own role';
  end if;

  if p_role not in ('user', 'galaxy_user', 'admin', 'bossman') then
    raise exception 'Invalid role';
  end if;

  select role, display_name
  into v_old_role, v_display_name
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if v_old_role = p_role then
    update public.profiles
    set galaxy_map_requested = case when p_role <> 'user' then false else galaxy_map_requested end,
        updated_at = now()
    where id = p_user_id;
    return;
  end if;

  perform set_config('app.allow_profile_role_update', 'true', true);

  update public.profiles
  set role = p_role,
      galaxy_map_requested = case when p_role <> 'user' then false else galaxy_map_requested end,
      updated_at = now()
  where id = p_user_id;

  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    details
  )
  values (
    v_actor_id,
    'role_changed',
    'user',
    p_user_id::text,
    coalesce(v_display_name, ''),
    jsonb_build_object(
      'old_role', v_old_role,
      'new_role', p_role
    )
  );
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;

create or replace function public.prepare_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  new.user_id := auth.uid();

  if new.user_id is null then
    raise exception 'Invalid feedback user';
  end if;

  new.message := btrim(new.message);
  if new.message = '' then
    raise exception 'Feedback message is required';
  end if;

  if char_length(new.message) > 2000 then
    raise exception 'Feedback message is too long';
  end if;

  if new.category = 'other' then
    new.other_label := nullif(btrim(coalesce(new.other_label, '')), '');
    if new.other_label is null then
      raise exception 'Other feedback requires a label';
    end if;
  else
    new.other_label := null;
  end if;

  select display_name
  into v_display_name
  from public.profiles
  where id = new.user_id;

  new.display_name := coalesce(
    nullif(v_display_name, ''),
    'Anonymous'
  );

  return new;
end;
$$;

drop trigger if exists feedback_prepare_insert on public.feedback;
create trigger feedback_prepare_insert
  before insert on public.feedback
  for each row execute function public.prepare_feedback_insert();

drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_authenticated" on public.feedback
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "custom_systems_select" on public.custom_systems;
create policy "custom_systems_select" on public.custom_systems
  for select to authenticated
  using (public.current_user_role() in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "custom_fleets_select" on public.custom_fleets;
create policy "custom_fleets_select" on public.custom_fleets
  for select to authenticated
  using (public.current_user_role() in ('galaxy_user', 'admin', 'bossman'));

drop policy if exists "custom_factions_select" on public.custom_factions;
create policy "custom_factions_select" on public.custom_factions
  for select to authenticated
  using (public.current_user_role() in ('galaxy_user', 'admin', 'bossman'));

update storage.buckets
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array[
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
where id = 'article-images';
