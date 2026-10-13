begin;
select set_config('actaro.session_a',gen_random_uuid()::text,true),set_config('actaro.session_b',gen_random_uuid()::text,true),set_config('actaro.session_id',gen_random_uuid()::text,true),set_config('actaro.session_child',gen_random_uuid()::text,true),set_config('actaro.session_set',gen_random_uuid()::text,true),set_config('actaro.session_mutation',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('actaro.session_a')::uuid),(current_setting('actaro.session_b')::uuid);
select public.import_repdb('[{"source_external_id":"actaro-session-fixture","name":"Historical exercise","instructions":["Fixture"],"difficulty":"beginner","category":"strength","primary_muscles":["actaro-session-muscle","actaro-session-muscle-two"],"secondary_muscles":[],"equipment":null}]',repeat('d',40));
select set_config('actaro.session_payload',jsonb_build_object('id',current_setting('actaro.session_id'),'user_id',current_setting('actaro.session_a'),'name','Recorded workout','mode','timed','status','completed','started_at','2026-10-13T10:00:00Z','ended_at','2026-10-13T10:10:00Z','local_date','2026-10-13','time_zone','UTC','duration_seconds',300,'notes','Actual log','exercises',jsonb_build_array(jsonb_build_object('id',current_setting('actaro.session_child'),'exercise_id',(select id from public.exercises where source_external_id='actaro-session-fixture'),'sets',jsonb_build_array(jsonb_build_object('id',current_setting('actaro.session_set'),'reps',8,'weight_kg',20,'rest_seconds',90,'completed_at','2026-10-13T10:05:00Z')))))::text,true);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.session_a'),'role','authenticated')::text,true);
do $$ declare payload jsonb:=current_setting('actaro.session_payload')::jsonb;begin
 begin perform public.save_workout_session(jsonb_set(payload,'{user_id}',to_jsonb(current_setting('actaro.session_b'))),0,gen_random_uuid());raise exception 'Mismatched actor accepted';exception when insufficient_privilege then null;end;
 if public.save_workout_session(payload,0,current_setting('actaro.session_mutation')::uuid)<>1 then raise exception 'Initial version failed';end if;
 if public.save_workout_session(payload,0,current_setting('actaro.session_mutation')::uuid)<>1 or (select count(*) from public.workout_sets)<>1 then raise exception 'Lost-response retry duplicated';end if;
 begin perform public.save_workout_session(payload,0,gen_random_uuid());raise exception 'Stale edit accepted';exception when serialization_failure then null;end;
 begin perform public.save_workout_session(jsonb_set(payload,'{exercises,0,sets,0,reps}','0'),1,gen_random_uuid());raise exception 'Invalid reps accepted';exception when check_violation then null;end;
 if (select version from public.workout_sessions)<>1 or (select reps from public.workout_sets)<>8 then raise exception 'Invalid edit lost prior facts';end if;
 begin perform public.save_workout_session(jsonb_set(payload,'{exercises,0,sets,0,completed_at}','null'),1,gen_random_uuid());raise exception 'Empty completion accepted';exception when invalid_parameter_value then null;end;
 begin perform public.save_workout_session(jsonb_set(payload,'{exercises,0,sets,0,completed_at}','"2026-10-13T12:00:00Z"'),1,gen_random_uuid());raise exception 'Future set accepted';exception when invalid_parameter_value then null;end;
end; $$;
reset role;
update public.exercises set name='New catalog name' where source_external_id='actaro-session-fixture';
set local role authenticated;
do $$ declare payload jsonb:=current_setting('actaro.session_payload')::jsonb;begin
 if public.save_workout_session(jsonb_set(payload,'{exercises,0,sets,0,reps}','9'),1,gen_random_uuid())<>2 then raise exception 'Edit version failed';end if;
 if (select exercise_name from public.workout_session_exercises)<>'Historical exercise' or (select reps from public.workout_sets)<>9 then raise exception 'Edit replaced snapshot or failed';end if;
 if (select previous->0->>'reps' from public.get_exercise_performance(array[(payload->'exercises'->0->>'exercise_id')::uuid],'2026-10-13T10:11:00Z'))<>'9' then raise exception 'Previous values failed';end if;
 if (select best->>'heaviest_kg' from public.get_exercise_performance(array[(payload->'exercises'->0->>'exercise_id')::uuid],'2026-10-13T10:11:00Z'))::numeric<>20 then raise exception 'Best weight failed';end if;
 if (select best->'reps_by_weight'->>'20' from public.get_exercise_performance(array[(payload->'exercises'->0->>'exercise_id')::uuid],'2026-10-13T10:11:00Z'))<>'9' then raise exception 'Matched weight reps failed';end if;
 if (select jsonb_array_length(previous) from public.get_exercise_performance(array[(payload->'exercises'->0->>'exercise_id')::uuid],'2026-10-13T10:11:00Z',current_setting('actaro.session_id')::uuid))<>0 then raise exception 'History edit included itself';end if;
 if to_regprocedure('public.get_training_history(integer,text,text)') is not null then
  if (select volume_kg from public.get_training_history())<>180 or (select reps from public.get_training_history())<>9 then raise exception 'Edited history did not recalculate';end if;
  if (select count(*) from public.get_training_history(p_mode=>'log_only'))<>0 or (select count(*) from public.get_training_history(p_query=>'Recorded'))<>1 then raise exception 'History filters failed';end if;
  if (public.get_training_overview('2026-10-01','2026-10-31')->>'volume_kg')::numeric<>180 or (public.get_training_overview('2026-10-01','2026-10-31')->>'sessions')::integer<>1 then raise exception 'Overview volume/frequency failed';end if;
  if (select sum((m->>'sets')::numeric) from jsonb_array_elements(public.get_training_overview('2026-10-01','2026-10-31')->'muscles')m)<>1 then raise exception 'Primary muscle allocation duplicated sets';end if;
 end if;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.session_b'),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.workout_sessions) then raise exception 'Foreign history visible';end if;
 if (select count(*) from public.get_training_history())<>0 or (public.get_training_overview('2026-10-01','2026-10-31')->>'sets')::integer<>0 then raise exception 'Foreign aggregate visible';end if;
 if exists(select 1 from public.get_exercise_performance(array[(current_setting('actaro.session_payload')::jsonb->'exercises'->0->>'exercise_id')::uuid],'2026-10-13T10:11:00Z') where jsonb_array_length(previous)>0) then raise exception 'Foreign performance visible';end if;
 begin perform public.save_workout_session(current_setting('actaro.session_payload')::jsonb,0,gen_random_uuid());raise exception 'Foreign history overwritten';exception when insufficient_privilege or unique_violation then null;end;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.session_a'),'role','authenticated')::text,true);
delete from public.workout_sessions;
do $$ begin
 begin perform public.save_workout_session(current_setting('actaro.session_payload')::jsonb,2,gen_random_uuid());raise exception 'Deleted history resurrected';exception when serialization_failure then null;end;
 if exists(select 1 from public.workout_sets) then raise exception 'Session deletion left sets';end if;
 if to_regprocedure('public.get_training_history(integer,text,text)') is not null and ((select count(*) from public.get_training_history())<>0 or (public.get_training_overview('2026-10-01','2026-10-31')->>'volume_kg')::numeric<>0) then raise exception 'Deletion left aggregate facts';end if;
end; $$;
reset role;set local role anon;
do $$ begin
 begin perform public.save_workout_session('{}',0,gen_random_uuid());raise exception 'Anonymous save accepted';exception when insufficient_privilege then null;end;
 begin perform public.get_training_history();raise exception 'Anonymous history accepted';exception when insufficient_privilege then null;end;
 begin perform public.get_training_overview(current_date-27,current_date);raise exception 'Anonymous overview accepted';exception when insufficient_privilege then null;end;
end; $$;
reset role;rollback;
