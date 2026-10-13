-- Expected actor prevents account-switch races from moving a pending draft.
create or replace function public.save_workout_session(p_session jsonb,p_expected_version integer,p_mutation_id uuid)
returns integer language plpgsql security invoker set search_path='' as $$
declare owner_id uuid:=auth.uid();saved_session_id uuid;existing public.workout_sessions;item jsonb;target jsonb;exercise_position integer:=0;set_position integer;child_id uuid;written uuid;result_version integer;completed_count integer:=0;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
 if jsonb_typeof(p_session) is distinct from 'object' or p_mutation_id is null or p_expected_version is null or p_expected_version<0 then raise exception 'Invalid session' using errcode='22023';end if;
 if p_session->>'user_id' is distinct from owner_id::text then raise exception 'Account changed' using errcode='42501';end if;
 saved_session_id:=(p_session->>'id')::uuid;
 if saved_session_id is null or p_session->>'status' is distinct from 'completed' or jsonb_typeof(p_session->'exercises') is distinct from 'array' or jsonb_array_length(p_session->'exercises') not between 1 and 100 then raise exception 'Invalid completed workout' using errcode='22023';end if;
 if (select count(distinct e->>'id') from jsonb_array_elements(p_session->'exercises')e)<>jsonb_array_length(p_session->'exercises') then raise exception 'Repeated exercise identity' using errcode='22023';end if;
 perform id from public.profiles where id=owner_id for update;
 select * into existing from public.workout_sessions where id=saved_session_id for update;
 if found then
  if existing.last_mutation_id=p_mutation_id then return existing.version;end if;
  if existing.version<>p_expected_version then raise exception 'Session changed; reload before editing' using errcode='40001';end if;
  if existing.mode is distinct from p_session->>'mode' or existing.started_at is distinct from (p_session->>'started_at')::timestamptz or existing.time_zone is distinct from p_session->>'time_zone' then raise exception 'Recorded session identity changed' using errcode='22023';end if;
  result_version:=existing.version+1;
  update public.workout_sessions set name=btrim(p_session->>'name'),status='completed',ended_at=(p_session->>'ended_at')::timestamptz,duration_seconds=(p_session->>'duration_seconds')::integer,notes=nullif(btrim(p_session->>'notes'),''),version=result_version,last_mutation_id=p_mutation_id where id=saved_session_id and user_id=owner_id;
 else
  if p_expected_version<>0 then raise exception 'Session removed; reload history' using errcode='40001';end if;
  result_version:=1;
  insert into public.workout_sessions(id,user_id,template_id,name,mode,status,started_at,ended_at,local_date,time_zone,duration_seconds,notes,version,last_mutation_id)
  values(saved_session_id,owner_id,(p_session->>'template_id')::uuid,btrim(p_session->>'name'),p_session->>'mode','completed',(p_session->>'started_at')::timestamptz,(p_session->>'ended_at')::timestamptz,(p_session->>'local_date')::date,p_session->>'time_zone',(p_session->>'duration_seconds')::integer,nullif(btrim(p_session->>'notes'),''),result_version,p_mutation_id);
 end if;
 set constraints all deferred;
 delete from public.workout_session_exercises where user_id=owner_id and workout_session_exercises.session_id=saved_session_id and id not in(select (e->>'id')::uuid from jsonb_array_elements(p_session->'exercises')e);
 for item in select value from jsonb_array_elements(p_session->'exercises') loop
  if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'sets') is distinct from 'array' or jsonb_array_length(item->'sets') not between 1 and 100 then raise exception 'Invalid exercise sets' using errcode='22023';end if;
  if (select count(distinct s->>'id') from jsonb_array_elements(item->'sets')s)<>jsonb_array_length(item->'sets') then raise exception 'Repeated set identity' using errcode='22023';end if;
  child_id:=(item->>'id')::uuid;
  -- UPDATE stable rows rather than replacing them: catalog snapshots stay historical.
  select id into written from public.workout_session_exercises where id=child_id;
  if found then
   update public.workout_session_exercises set position=exercise_position,notes=nullif(btrim(item->>'notes'),'') where id=child_id and user_id=owner_id and workout_session_exercises.session_id=saved_session_id and exercise_id=(item->>'exercise_id')::uuid returning id into written;
   if written is null then raise exception 'Exercise identity changed' using errcode='42501';end if;
  else
   insert into public.workout_session_exercises(id,user_id,session_id,exercise_id,position,notes) values(child_id,owner_id,saved_session_id,(item->>'exercise_id')::uuid,exercise_position,nullif(btrim(item->>'notes'),''));
  end if;
  delete from public.workout_sets where user_id=owner_id and session_exercise_id=child_id and id not in(select (s->>'id')::uuid from jsonb_array_elements(item->'sets')s);
  set_position:=0;
  for target in select value from jsonb_array_elements(item->'sets') loop
   if jsonb_typeof(target) is distinct from 'object' then raise exception 'Invalid set' using errcode='22023';end if;
   if target->>'completed_at' is not null then
    if (target->>'completed_at')::timestamptz<(p_session->>'started_at')::timestamptz or (target->>'completed_at')::timestamptz>(p_session->>'ended_at')::timestamptz then raise exception 'Set timestamp outside session' using errcode='22023';end if;
    completed_count:=completed_count+1;
   end if;
   insert into public.workout_sets(id,user_id,session_exercise_id,position,reps,weight_kg,rest_seconds,rpe,notes,completed_at)
   values((target->>'id')::uuid,owner_id,child_id,set_position,(target->>'reps')::integer,(target->>'weight_kg')::numeric,(target->>'rest_seconds')::integer,(target->>'rpe')::numeric,nullif(btrim(target->>'notes'),''),(target->>'completed_at')::timestamptz)
   on conflict(id) do update set position=excluded.position,reps=excluded.reps,weight_kg=excluded.weight_kg,rest_seconds=excluded.rest_seconds,rpe=excluded.rpe,notes=excluded.notes,completed_at=excluded.completed_at
   where workout_sets.user_id=owner_id and workout_sets.session_exercise_id=child_id returning id into written;
   if written is null then raise exception 'Set unavailable' using errcode='42501';end if;
   set_position:=set_position+1;
  end loop;
  exercise_position:=exercise_position+1;
 end loop;
 if completed_count=0 then raise exception 'Complete at least one set' using errcode='22023';end if;
 return result_version;
end; $$;
revoke all on function public.save_workout_session(jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.save_workout_session(jsonb,integer,uuid) to authenticated;


drop function public.save_recovery_check(date,text,integer,integer,integer,integer,text);
create function public.save_recovery_check(p_user_id uuid,p_date date,p_time_zone text,p_energy integer,p_soreness integer,p_sleep integer,p_stress integer default null,p_notes text default '')
returns date language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_date is null or not private.is_valid_time_zone(p_time_zone) or p_date<>(now() at time zone p_time_zone)::date then raise exception 'Only today can be checked in; reload after a date change' using errcode='22023';end if;
 if p_user_id is distinct from auth.uid() then raise exception 'Account changed' using errcode='42501';end if;
 insert into public.recovery_check_ins(user_id,local_date,time_zone,energy,soreness,sleep_quality,stress,notes)
 values(auth.uid(),p_date,p_time_zone,p_energy,p_soreness,p_sleep,p_stress,nullif(btrim(p_notes),''))
 on conflict(user_id,local_date) do update set energy=excluded.energy,soreness=excluded.soreness,sleep_quality=excluded.sleep_quality,stress=excluded.stress,notes=excluded.notes;
 return p_date;
end; $$;
revoke all on function public.save_recovery_check(uuid,date,text,integer,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.save_recovery_check(uuid,date,text,integer,integer,integer,integer,text) to authenticated;
