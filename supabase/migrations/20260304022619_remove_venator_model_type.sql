-- Remap legacy Venator model references before removing the enum value.

update public.custom_fleets
set model_type = 'republic'
where model_type = 'venator';

with remapped as (
  select
    cf.id,
    coalesce(
      jsonb_agg(
        case
          when entry->>'catalogId' = 'republic-venator' then
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(entry, '{catalogId}', '"republic-frigate"'::jsonb, true),
                  '{modelType}', '"republic"'::jsonb, true
                ),
                '{name}', '"Republic Frigate"'::jsonb, true
              ),
              '{shipClass}', '"Frigate"'::jsonb, true
            )
          when entry->>'modelType' = 'venator' then
            jsonb_set(entry, '{modelType}', '"republic"'::jsonb, true)
          else
            entry
        end
        order by ordinality
      ),
      '[]'::jsonb
    ) as new_composition
  from public.custom_fleets cf
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(cf.composition) = 'array' then cf.composition
      else '[]'::jsonb
    end
  ) with ordinality as e(entry, ordinality)
  group by cf.id
)
update public.custom_fleets cf
set composition = remapped.new_composition
from remapped
where cf.id = remapped.id
  and exists (
    select 1
    from jsonb_array_elements(
      case
        when jsonb_typeof(cf.composition) = 'array' then cf.composition
        else '[]'::jsonb
      end
    ) as entry
    where entry->>'modelType' = 'venator'
       or entry->>'catalogId' = 'republic-venator'
  );

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'custom_fleets_model_type_check'
  ) then
    alter table public.custom_fleets
      drop constraint custom_fleets_model_type_check;
  end if;

  alter table public.custom_fleets
    add constraint custom_fleets_model_type_check
    check (model_type in ('sith', 'republic', 'valor', 'terminus'));
end
$$;
