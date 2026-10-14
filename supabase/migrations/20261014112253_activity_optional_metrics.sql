-- Optional numeric RPC arguments preserve unknown values in generated client types.
create or replace function public.save_activity(p_user_id uuid,p_date date,p_steps integer default null,p_distance numeric default null,p_source text default null,p_zone text default 'UTC')
returns date language plpgsql security invoker set search_path='' as $$begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 insert into public.daily_activity(user_id,local_date,steps,distance_km,steps_source,time_zone) values(p_user_id,p_date,p_steps,p_distance,p_source,p_zone) on conflict(user_id,local_date) do update set steps=excluded.steps,distance_km=excluded.distance_km,steps_source=excluded.steps_source,time_zone=excluded.time_zone;
 return p_date;
end;$$;
