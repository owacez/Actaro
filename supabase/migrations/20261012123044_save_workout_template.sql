-- One transaction saves a complete reusable workout; invalid children roll back.
create function public.save_workout_template(p_id uuid, p_name text, p_notes text, p_exercises jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  saved_id uuid;
  item jsonb;
  target jsonb;
  exercise_position integer := 0;
  set_position integer;
  child_id uuid;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_id is null or p_name is null or char_length(btrim(p_name)) not between 1 and 100
    or char_length(p_notes) > 2000 or jsonb_typeof(p_exercises) is distinct from 'array' then
    raise exception 'Invalid workout' using errcode = '22023';
  end if;
  if jsonb_array_length(p_exercises) not between 1 and 100 then
    raise exception 'Choose 1 to 100 exercises' using errcode = '22023';
  end if;
  -- ponytail: last save wins for this owned template; add version checks when concurrent editing is required.
  insert into public.workout_templates(id,user_id,name,notes)
  values(p_id,owner_id,btrim(p_name),nullif(btrim(p_notes),''))
  on conflict(id) do update set name=excluded.name,notes=excluded.notes
  where workout_templates.user_id=owner_id returning id into saved_id;
  if saved_id is null then raise exception 'Workout unavailable' using errcode = '42501'; end if;
  delete from public.workout_template_exercises where template_id=saved_id and user_id=owner_id;
  for item in select value from jsonb_array_elements(p_exercises) loop
    if jsonb_typeof(item) is distinct from 'object' or item->>'exercise_id' is null
      or jsonb_typeof(item->'sets') is distinct from 'array' then
      raise exception 'Invalid exercise' using errcode = '22023';
    end if;
    if jsonb_array_length(item->'sets') not between 1 and 100 then
      raise exception 'Choose 1 to 100 sets' using errcode = '22023';
    end if;
    insert into public.workout_template_exercises(user_id,template_id,exercise_id,position,notes)
    values(owner_id,saved_id,(item->>'exercise_id')::uuid,exercise_position,nullif(btrim(item->>'notes'),''))
    returning id into child_id;
    set_position := 0;
    for target in select value from jsonb_array_elements(item->'sets') loop
      if jsonb_typeof(target) is distinct from 'object' then
        raise exception 'Invalid set' using errcode = '22023';
      end if;
      insert into public.workout_template_sets(user_id,template_exercise_id,position,reps,weight_kg,rest_seconds,rpe,notes)
      values(owner_id,child_id,set_position,(target->>'reps')::integer,(target->>'weight_kg')::numeric,
        (target->>'rest_seconds')::integer,(target->>'rpe')::numeric,nullif(btrim(target->>'notes'),''));
      set_position := set_position + 1;
    end loop;
    exercise_position := exercise_position + 1;
  end loop;
  return saved_id;
end;
$$;
revoke all on function public.save_workout_template(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_workout_template(uuid,text,text,jsonb) to authenticated;
