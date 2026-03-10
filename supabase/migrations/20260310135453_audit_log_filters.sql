create or replace function public.fetch_audit_logs_page(
  p_limit  integer     default 40,
  p_offset integer     default 0,
  p_query  text        default null,
  p_since  timestamptz default null,
  p_action text        default null
)
returns table (
  id           bigint,
  user_id      uuid,
  action       text,
  entity_type  text,
  entity_id    text,
  entity_name  text,
  details      jsonb,
  created_at   timestamptz,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with nq as (
    select
      nullif(btrim(p_query), '') as q,
      nullif(btrim(p_action), '') as a
  )
  select
    logs.id,
    logs.user_id,
    logs.action,
    logs.entity_type,
    logs.entity_id,
    logs.entity_name,
    logs.details,
    logs.created_at,
    profiles.display_name
  from public.audit_logs logs
  left join public.profiles profiles on profiles.id = logs.user_id
  cross join nq
  where public.current_user_role() in ('admin', 'bossman')
    and (
      nq.q is null
      or logs.action ilike '%' || nq.q || '%'
      or logs.entity_name ilike '%' || nq.q || '%'
      or logs.entity_id ilike '%' || nq.q || '%'
      or coalesce(profiles.display_name, '') ilike '%' || nq.q || '%'
    )
    and (p_since is null or logs.created_at >= p_since)
    and (nq.a is null or logs.action = nq.a)
  order by logs.created_at desc, logs.id desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) from public;
grant execute on function public.fetch_audit_logs_page(integer, integer, text, timestamptz, text) to authenticated;

create or replace function public.fetch_audit_logs_total(
  p_query  text        default null,
  p_since  timestamptz default null,
  p_action text        default null
)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  with nq as (
    select
      nullif(btrim(p_query), '') as q,
      nullif(btrim(p_action), '') as a
  )
  select count(*)::bigint
  from public.audit_logs logs
  left join public.profiles profiles on profiles.id = logs.user_id
  cross join nq
  where public.current_user_role() in ('admin', 'bossman')
    and (
      nq.q is null
      or logs.action ilike '%' || nq.q || '%'
      or logs.entity_name ilike '%' || nq.q || '%'
      or logs.entity_id ilike '%' || nq.q || '%'
      or coalesce(profiles.display_name, '') ilike '%' || nq.q || '%'
    )
    and (p_since is null or logs.created_at >= p_since)
    and (nq.a is null or logs.action = nq.a);
$$;

revoke all on function public.fetch_audit_logs_total(text, timestamptz, text) from public;
grant execute on function public.fetch_audit_logs_total(text, timestamptz, text) to authenticated;
