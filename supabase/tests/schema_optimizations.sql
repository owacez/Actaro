begin;
-- Time zones: same answers from the cached lookup; invalid names still rejected by CHECKs.
do $$ begin
 if not private.is_valid_time_zone('Europe/London') or not private.is_valid_time_zone('UTC') then raise exception 'Valid zone rejected';end if;
 if private.is_valid_time_zone('Mars/Olympus_Mons') or private.is_valid_time_zone('') then raise exception 'Invalid zone accepted';end if;
 if (select count(*) from private.time_zones)<>(select count(*) from pg_catalog.pg_timezone_names) then raise exception 'Zone cache incomplete';end if;
end $$;

-- Indexes: redundant ones removed, per-exercise history index present.
do $$ begin
 if to_regclass('public.habit_logs_habit_owner_fk') is not null or to_regclass('public.habit_versions_habit_owner_fk') is not null
  or to_regclass('public.nutrition_copy_requests_owner') is not null then raise exception 'Redundant index kept';end if;
 if to_regclass('public.workout_session_exercises_owner_exercise_idx') is null then raise exception 'Exercise history index missing';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
  and p.proname in ('get_exercise_performance','get_training_history','get_training_overview','get_training_plans') and p.provolatile<>'s')
  then raise exception 'Read function not stable';end if;
end $$;

-- Copy-request ledger: a new request removes only that user's rows older than 30 days.
insert into auth.users(id) values('09100000-0000-4000-8000-000000000001'),('09100000-0000-4000-8000-000000000002');
insert into public.nutrition_copy_requests(id,user_id,request,entry_count) values
 ('09100000-0000-4000-8000-000000000011','09100000-0000-4000-8000-000000000001','{}',1),
 ('09100000-0000-4000-8000-000000000012','09100000-0000-4000-8000-000000000001','{}',1),
 ('09100000-0000-4000-8000-000000000013','09100000-0000-4000-8000-000000000002','{}',1);
-- Age existing rows as time passing would; updates do not run the prune trigger.
update public.nutrition_copy_requests set created_at=now()-interval '40 days'
 where id in('09100000-0000-4000-8000-000000000011','09100000-0000-4000-8000-000000000013');
update public.nutrition_copy_requests set created_at=now()-interval '2 days'
 where id='09100000-0000-4000-8000-000000000012';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"09100000-0000-4000-8000-000000000001"}',true);
insert into public.nutrition_copy_requests(id,user_id,request,entry_count) values('09100000-0000-4000-8000-000000000014',auth.uid(),'{}',1);
reset role;
do $$ begin
 if exists(select 1 from public.nutrition_copy_requests where id='09100000-0000-4000-8000-000000000011') then raise exception 'Old request kept';end if;
 if (select count(*) from public.nutrition_copy_requests where id in('09100000-0000-4000-8000-000000000012','09100000-0000-4000-8000-000000000014'))<>2 then raise exception 'Recent request removed';end if;
 if not exists(select 1 from public.nutrition_copy_requests where id='09100000-0000-4000-8000-000000000013') then raise exception 'Another account pruned';end if;
end $$;

-- Account deletion removes a user with a habit, a log and a habit-linked goal in one step.
insert into auth.users(id) values('09100000-0000-4000-8000-000000000021');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"09100000-0000-4000-8000-000000000021"}',true);
select public.save_habit(auth.uid(),'09100000-0000-4000-8000-000000000022','Walk','numeric','minutes',current_date-14,'UTC',20,array[1,2,3,4,5,6,7]::smallint[],'streak',null,'18:00');
select public.log_habit(auth.uid(),'09100000-0000-4000-8000-000000000022',current_date-1,25);
select public.save_goal(auth.uid(),jsonb_build_object('id','09100000-0000-4000-8000-000000000023','user_id',auth.uid(),'name','Walk weekly','metric','habit_completion_week','habit_id','09100000-0000-4000-8000-000000000022','baseline',0,'target',80,'direction','at_least','tolerance',10,'start_date',current_date-7,'time_zone','UTC'));
reset role;
delete from auth.users where id='09100000-0000-4000-8000-000000000021';
do $$ begin
 if exists(select 1 from public.habits where user_id='09100000-0000-4000-8000-000000000021')
  or exists(select 1 from public.goals where user_id='09100000-0000-4000-8000-000000000021')
  or exists(select 1 from public.habit_logs where user_id='09100000-0000-4000-8000-000000000021') then raise exception 'Deleted account left data';end if;
end $$;
rollback;
