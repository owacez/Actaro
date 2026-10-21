begin;
insert into auth.users(id) values ('12000000-0000-4000-8000-000000000001'), ('12000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-4000-8000-000000000001"}', true);
insert into public.run_sessions(id,user_id,started_at,ended_at,local_date,time_zone,duration_seconds,route)
values ('12000000-0000-4000-8000-000000000003',auth.uid(),'2026-10-21T00:00:00Z','2026-10-21T00:03:00Z','2026-10-21','UTC',60,
  jsonb_build_array(
    jsonb_build_object('latitude',0,'longitude',0,'timestamp',extract(epoch from timestamptz '2026-10-21T00:00:00Z')*1000,'accuracy',5,'segment',0),
    jsonb_build_object('latitude',0,'longitude',0.001,'timestamp',extract(epoch from timestamptz '2026-10-21T00:00:30Z')*1000,'accuracy',5,'segment',0),
    jsonb_build_object('latitude',0.01,'longitude',1,'timestamp',extract(epoch from timestamptz '2026-10-21T00:02:00Z')*1000,'accuracy',5,'segment',1),
    jsonb_build_object('latitude',0.01,'longitude',1.001,'timestamp',extract(epoch from timestamptz '2026-10-21T00:02:30Z')*1000,'accuracy',5,'segment',1)
  ));
do $$ begin
  if (select moving_seconds from public.run_sessions) <> 60 then raise exception 'Moving time includes stopped interval'; end if;
  begin update public.run_sessions set moving_seconds=999; raise exception 'Moving time injection accepted'; exception when sqlstate '428C9' then null; end;
  if abs((select distance_meters from public.run_sessions) - 222.38985) > 0.01 then raise exception 'Distance includes paused travel or is incorrect'; end if;
  if (select route_preview->0 <> route->0 or route_preview->-1 <> route->-1 from public.run_sessions) then raise exception 'Preview lost endpoints'; end if;
  if jsonb_array_length(public.run_route_preview((select jsonb_agg(jsonb_build_object('segment',0)) from generate_series(1,20000)))) > 122 then raise exception 'Preview not bounded'; end if;
  begin update public.run_sessions set user_id='12000000-0000-4000-8000-000000000002'; raise exception 'Owner transfer accepted'; exception when insufficient_privilege then null; end;
  begin update public.run_sessions set time_zone='Fake/Zone'; raise exception 'Invalid zone accepted'; exception when check_violation or invalid_parameter_value then null; end;
  begin update public.run_sessions set local_date='2026-10-20'; raise exception 'Wrong local date accepted'; exception when check_violation then null; end;
  begin update public.run_sessions set duration_seconds=999; raise exception 'Invalid duration accepted'; exception when check_violation then null; end;
  begin update public.run_sessions set route='[]'; raise exception 'Empty route accepted'; exception when invalid_parameter_value then null; end;
  begin update public.run_sessions set route=jsonb_set(route,'{1,accuracy}','80'); raise exception 'Poor GPS accepted'; exception when invalid_parameter_value then null; end;
  begin update public.run_sessions set route=jsonb_set(route,'{2,segment}','0'); raise exception 'GPS gap joined'; exception when invalid_parameter_value then null; end;
  begin update public.run_sessions set route=jsonb_set(route,'{1,latitude}','91'); raise exception 'Invalid coordinates accepted'; exception when invalid_parameter_value then null; end;
  begin update public.run_sessions set route=jsonb_set(route,'{1,timestamp}',route->0->'timestamp'); raise exception 'Duplicate time accepted'; exception when invalid_parameter_value then null; end;
end; $$;
insert into public.run_sessions(id,user_id,started_at,ended_at,local_date,time_zone,duration_seconds,route,notes)
select id,user_id,started_at,ended_at,local_date,time_zone,duration_seconds,route,'Retry' from public.run_sessions
on conflict(id) do update set notes=excluded.notes;
do $$ begin if (select count(*) from public.run_sessions) <> 1 then raise exception 'Retry duplicated run'; end if; end; $$;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-4000-8000-000000000002"}', true);
do $$ begin
  if exists(select 1 from public.run_sessions) then raise exception 'Private route leaked'; end if;
  update public.run_sessions set notes='Foreign edit' where id='12000000-0000-4000-8000-000000000003';
  if found then raise exception 'Foreign update allowed'; end if;
  delete from public.run_sessions where id='12000000-0000-4000-8000-000000000003';
  if found then raise exception 'Foreign delete allowed'; end if;
end; $$;
reset role;
delete from auth.users where id='12000000-0000-4000-8000-000000000001';
do $$ begin if exists(select 1 from public.run_sessions where user_id='12000000-0000-4000-8000-000000000001') then raise exception 'Account deletion left route data'; end if; end; $$;
set local role anon;
do $$ begin
  begin perform * from public.run_sessions; raise exception 'Anonymous route access allowed'; exception when insufficient_privilege then null; end;
end; $$;
rollback;
