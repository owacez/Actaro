create function public.get_training_history(p_offset integer default 0,p_query text default '',p_mode text default null)
returns table(id uuid,name text,mode text,local_date date,started_at timestamptz,duration_seconds integer,version integer,exercises integer,sets integer,reps bigint,volume_kg numeric,unknown_weight_sets integer)
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_offset is null or p_offset<0 or p_offset>100000 or char_length(p_query)>120 or (p_mode is not null and p_mode not in ('timed','log_only')) then raise exception 'Invalid history filters' using errcode='22023';end if;
 return query select s.id,s.name,s.mode,s.local_date,s.started_at,s.duration_seconds,s.version,
  count(distinct e.id) filter(where t.id is not null)::integer,count(t.id)::integer,coalesce(sum(t.reps),0),coalesce(sum(t.weight_kg*t.reps),0),count(t.id) filter(where t.weight_kg is null)::integer
 from public.workout_sessions s left join public.workout_session_exercises e on e.session_id=s.id and e.user_id=s.user_id left join public.workout_sets t on t.session_exercise_id=e.id and t.user_id=e.user_id and t.completed_at is not null
 where s.user_id=auth.uid() and s.status='completed' and strpos(lower(s.name),lower(coalesce(btrim(p_query),'')))>0 and (p_mode is null or s.mode=p_mode)
 group by s.id order by s.local_date desc,s.started_at desc,s.id desc limit 11 offset p_offset;
end; $$;
revoke all on function public.get_training_history(integer,text,text) from public,anon,authenticated;
grant execute on function public.get_training_history(integer,text,text) to authenticated;

create function public.get_training_overview(p_from date,p_to date)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_from is null or p_to is null or not isfinite(p_from) or not isfinite(p_to) or p_to-p_from not between 0 and 365 then raise exception 'Choose at most one year' using errcode='22023';end if;
 with sessions as materialized(select s.id,s.local_date from public.workout_sessions s where s.user_id=auth.uid() and s.status='completed' and s.local_date between p_from and p_to),
 facts as materialized(select s.id session_id,s.local_date,e.primary_muscle_ids,t.reps,t.weight_kg from sessions s join public.workout_session_exercises e on e.session_id=s.id and e.user_id=auth.uid() join public.workout_sets t on t.session_exercise_id=e.id and t.user_id=e.user_id where t.completed_at is not null),
 days as(select s.local_date,count(distinct s.id) sessions,count(f.session_id) sets,coalesce(sum(f.reps),0) reps,coalesce(sum(f.reps*f.weight_kg),0) volume_kg,count(f.session_id) filter(where f.weight_kg is null) unknown_weight_sets from sessions s left join facts f on f.session_id=s.id group by s.local_date),
 muscles as(select m.id,m.name,sum(1.0/greatest(cardinality(f.primary_muscle_ids),1)) allocated_sets,coalesce(sum(f.reps*f.weight_kg/greatest(cardinality(f.primary_muscle_ids),1)),0) volume_kg from facts f left join lateral unnest(f.primary_muscle_ids)muscle_id on true left join public.muscles m on m.id=muscle_id group by m.id,m.name)
 select jsonb_build_object('sessions',(select count(*) from sessions),'active_days',(select count(*) from days),'sets',(select count(*) from facts),'reps',(select coalesce(sum(f.reps),0) from facts f),'volume_kg',(select coalesce(sum(f.reps*f.weight_kg),0) from facts f),'unknown_weight_sets',(select count(*) from facts f where f.weight_kg is null),'first_date',(select min(s.local_date) from sessions s),'days',coalesce((select jsonb_agg(to_jsonb(d) order by d.local_date) from days d),'[]'::jsonb),'muscles',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',coalesce(m.name,'Unassigned'),'sets',m.allocated_sets,'volume_kg',m.volume_kg) order by m.allocated_sets desc,m.name nulls last) from muscles m),'[]'::jsonb)) into result;
 return result;
end; $$;
revoke all on function public.get_training_overview(date,date) from public,anon,authenticated;
grant execute on function public.get_training_overview(date,date) to authenticated;

-- RepDB labels this goblet squat as kettlebell: keep the reference data authoritative.
update public.training_plans set description='Editable home template without a bench. Review required equipment and adjust any target or exercise.' where slug='home-workout';
