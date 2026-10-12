-- Administrative import only. One RPC transaction keeps each catalog batch atomic.
create function public.import_repdb(p_exercises jsonb, p_revision text)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  item jsonb;
  exercise_uuid uuid;
  slug_value text;
  relation_role text;
  imported integer := 0;
begin
  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array' or jsonb_array_length(p_exercises) not between 1 and 1000
    or p_revision is null or p_revision !~ '^[a-f0-9]{40}$' then
    raise exception 'Invalid import manifest' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(p_exercises) loop
    insert into public.exercises (name, description, instructions, difficulty, category,
      movement_pattern, source, source_external_id, source_revision, license, attribution)
    values (item->>'name', item->>'description',
      array(select jsonb_array_elements_text(item->'instructions')), item->>'difficulty',
      item->>'category', item->>'movement_pattern', 'repdb', item->>'source_external_id',
      p_revision, 'RepDB Free Tier License v1.0', 'Exercise data by RepDB (repdb.co)')
    on conflict (source, source_external_id) do update set name = excluded.name,
      description = excluded.description, instructions = excluded.instructions,
      difficulty = excluded.difficulty, category = excluded.category,
      movement_pattern = excluded.movement_pattern, source_revision = excluded.source_revision,
      license = excluded.license, attribution = excluded.attribution
    returning id into exercise_uuid;
    delete from public.exercise_muscles where exercise_id = exercise_uuid;
    delete from public.exercise_equipment where exercise_id = exercise_uuid;
    foreach relation_role in array array['primary', 'secondary'] loop
      for slug_value in select jsonb_array_elements_text(item->(relation_role || '_muscles')) loop
        insert into public.muscles (slug, name)
        values (slug_value, initcap(replace(slug_value, '-', ' '))) on conflict (slug) do nothing;
        insert into public.exercise_muscles (exercise_id, muscle_id, role)
        select exercise_uuid, id, relation_role from public.muscles where slug = slug_value
        on conflict (exercise_id, muscle_id) do nothing;
      end loop;
    end loop;
    slug_value := item->>'equipment';
    if slug_value is not null then
      insert into public.equipment (slug, name)
      values (slug_value, initcap(replace(slug_value, '-', ' '))) on conflict (slug) do nothing;
      insert into public.exercise_equipment (exercise_id, equipment_id)
      select exercise_uuid, id from public.equipment where slug = slug_value;
    end if;
    imported := imported + 1;
  end loop;
  return imported;
end;
$$;
revoke all on function public.import_repdb(jsonb, text) from public, anon, authenticated;
grant execute on function public.import_repdb(jsonb, text) to service_role;
