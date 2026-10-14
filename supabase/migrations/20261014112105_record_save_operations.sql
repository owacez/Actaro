create function public.save_body_record(p_user_id uuid,p_kind text,p_date date,p_value numeric,p_zone text,p_name text default '',p_notes text default '')
returns date language plpgsql security invoker set search_path='' as $$begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 if p_kind='weight' then
  insert into public.body_weights(user_id,local_date,weight_kg,time_zone,notes) values(p_user_id,p_date,p_value,p_zone,nullif(btrim(p_notes),'')) on conflict(user_id,local_date) do update set weight_kg=excluded.weight_kg,time_zone=excluded.time_zone,notes=excluded.notes;
 elsif p_kind='measurement' then
  insert into public.body_measurements(user_id,local_date,measurement,value_cm,time_zone,notes) values(p_user_id,p_date,lower(btrim(p_name)),p_value,p_zone,nullif(btrim(p_notes),'')) on conflict(user_id,measurement,local_date) do update set value_cm=excluded.value_cm,time_zone=excluded.time_zone,notes=excluded.notes;
 else raise exception 'Invalid body record' using errcode='22023';end if;
 return p_date;
end;$$;
create function public.save_activity(p_user_id uuid,p_date date,p_steps integer,p_distance numeric,p_source text,p_zone text)
returns date language plpgsql security invoker set search_path='' as $$begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 insert into public.daily_activity(user_id,local_date,steps,distance_km,steps_source,time_zone) values(p_user_id,p_date,p_steps,p_distance,p_source,p_zone) on conflict(user_id,local_date) do update set steps=excluded.steps,distance_km=excluded.distance_km,steps_source=excluded.steps_source,time_zone=excluded.time_zone;
 return p_date;
end;$$;
create function public.save_steps_target(p_user_id uuid,p_target integer)
returns integer language plpgsql security invoker set search_path='' as $$begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 insert into public.activity_targets(user_id,steps_target)values(p_user_id,p_target)on conflict(user_id)do update set steps_target=excluded.steps_target,updated_at=now();
 return p_target;
end;$$;
create function public.save_goal(p_user_id uuid,p_goal jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$declare g public.goals;begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 g:=jsonb_populate_record(null::public.goals,p_goal);
 if g.user_id is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 insert into public.goals(id,user_id,name,metric,baseline,target,direction,tolerance,start_date,end_date,time_zone,habit_id,exercise_id,measurement)
 values(g.id,p_user_id,btrim(g.name),g.metric,g.baseline,g.target,g.direction,g.tolerance,g.start_date,g.end_date,g.time_zone,g.habit_id,g.exercise_id,g.measurement)
 on conflict(id)do update set name=excluded.name,metric=excluded.metric,baseline=excluded.baseline,target=excluded.target,direction=excluded.direction,tolerance=excluded.tolerance,start_date=excluded.start_date,end_date=excluded.end_date,time_zone=excluded.time_zone,habit_id=excluded.habit_id,exercise_id=excluded.exercise_id,measurement=excluded.measurement;
 return g.id;
end;$$;
revoke all on function public.save_body_record(uuid,text,date,numeric,text,text,text),public.save_activity(uuid,date,integer,numeric,text,text),public.save_steps_target(uuid,integer),public.save_goal(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_body_record(uuid,text,date,numeric,text,text,text),public.save_activity(uuid,date,integer,numeric,text,text),public.save_steps_target(uuid,integer),public.save_goal(uuid,jsonb) to authenticated;
