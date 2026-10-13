-- Performed facts are persisted atomically; retry and revision checks protect edits.
alter table public.workout_sessions add column version integer not null default 0 check(version>=0);
alter table public.workout_sessions add column last_mutation_id uuid;
grant insert(version,last_mutation_id),update(name,version,last_mutation_id) on public.workout_sessions to authenticated;
alter table public.workout_sets add constraint workout_sets_completion_finite check(completed_at is null or isfinite(completed_at));

create function public.save_workout_session(p_session jsonb,p_expected_version integer,p_mutation_id uuid)
returns integer language plpgsql security invoker set search_path='' as $$
declare owner_id uuid:=auth.uid();saved_session_id uuid;existing public.workout_sessions;item jsonb;target jsonb;exercise_position integer:=0;set_position integer;child_id uuid;written uuid;result_version integer;completed_count integer:=0;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
 if jsonb_typeof(p_session) is distinct from 'object' or p_mutation_id is null or p_expected_version is null or p_expected_version<0 then raise exception 'Invalid session' using errcode='22023';end if;
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

create function public.get_exercise_performance(p_exercise_ids uuid[],p_before timestamptz,p_exclude_session uuid default null)
returns table(exercise_id uuid,previous jsonb,best jsonb)
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_exercise_ids is null or cardinality(p_exercise_ids) not between 1 and 100 or p_before is null or not isfinite(p_before) then raise exception 'Invalid performance query' using errcode='22023';end if;
 return query with facts as materialized (
  select e.exercise_id,s.id session_id,s.started_at,e.position exercise_position,t.position,t.reps,t.weight_kg,t.rpe,
   case when t.weight_kg>0 and t.reps between 1 and 10 then case when t.reps=1 then t.weight_kg else t.weight_kg*(1+t.reps/30.0) end end estimated_1rm
  from public.workout_session_exercises e join public.workout_sessions s on s.id=e.session_id and s.user_id=e.user_id join public.workout_sets t on t.session_exercise_id=e.id and t.user_id=e.user_id
  where e.user_id=auth.uid() and e.exercise_id=any(p_exercise_ids) and s.status='completed' and s.started_at<p_before and (p_exclude_session is null or s.id<>p_exclude_session) and t.completed_at is not null
 ) select requested.id,
  coalesce((select jsonb_agg(jsonb_build_object('reps',f.reps,'weight_kg',f.weight_kg,'rpe',f.rpe) order by f.exercise_position,f.position) from facts f where f.exercise_id=requested.id and f.session_id=(select f2.session_id from facts f2 where f2.exercise_id=requested.id order by f2.started_at desc,f2.session_id desc limit 1)),'[]'::jsonb),
  jsonb_build_object('heaviest_kg',(select max(f.weight_kg) from facts f where f.exercise_id=requested.id),'estimated_1rm',(select max(f.estimated_1rm) from facts f where f.exercise_id=requested.id),'reps_by_weight',coalesce((select jsonb_object_agg(r.weight,r.reps) from (select (f.weight_kg::float8)::text weight,max(f.reps) reps from facts f where f.exercise_id=requested.id and f.weight_kg is not null group by f.weight_kg)r),'{}'::jsonb))
 from (select distinct unnest(p_exercise_ids) id)requested;
end; $$;
revoke all on function public.get_exercise_performance(uuid[],timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.get_exercise_performance(uuid[],timestamptz,uuid) to authenticated;
