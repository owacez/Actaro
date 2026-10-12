-- Admin-run, rollback-only. Uses disposable SQL accounts; sends no Auth emails.
begin;
create function pg_temp.assert_true(value boolean, label text) returns void
language plpgsql as $$ begin
  if value is distinct from true then raise exception 'FAIL: %', label; end if;
end; $$;
create function pg_temp.reject(statement text, code text) returns void
language plpgsql security invoker as $$ begin
  begin
    execute statement;
  exception when others then
    if sqlstate = code then return; end if;
    raise;
  end;
  raise exception 'FAIL: invalid operation accepted';
end; $$;
select set_config('actaro.workout_a', gen_random_uuid()::text, true);
select set_config('actaro.workout_b', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('actaro.workout_a')::uuid), (current_setting('actaro.workout_b')::uuid);
select public.import_repdb('[{"source_external_id":"actaro-workout-fixture","name":"ACTARO Workout fixture","instructions":["Fixture instruction"],"difficulty":"beginner","category":"strength","primary_muscles":["actaro-workout-muscle"],"secondary_muscles":[],"equipment":null}]'::jsonb, repeat('c',40));
select set_config('actaro.workout_exercise', (select id::text from public.exercises where source_external_id='actaro-workout-fixture'), true);
select set_config('actaro.template_a', gen_random_uuid()::text, true);
select set_config('actaro.template_b', gen_random_uuid()::text, true);
select set_config('actaro.template_exercise_a', gen_random_uuid()::text, true);
select set_config('actaro.template_set_a', gen_random_uuid()::text, true);
select set_config('actaro.session_a', gen_random_uuid()::text, true);
select set_config('actaro.session_b', gen_random_uuid()::text, true);
select set_config('actaro.session_exercise_a', gen_random_uuid()::text, true);
select set_config('actaro.set_a', gen_random_uuid()::text, true);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.workout_b'),'role','authenticated')::text,true);
insert into public.workout_templates(id,user_id,name) values(current_setting('actaro.template_b')::uuid,current_setting('actaro.workout_b')::uuid,'B template');
insert into public.workout_sessions(id,user_id,name,mode,started_at,local_date,time_zone)
values(current_setting('actaro.session_b')::uuid,current_setting('actaro.workout_b')::uuid,'B session','log_only','2026-10-12 10:00Z','2026-10-12','UTC');
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.workout_a'),'role','authenticated')::text,true);
insert into public.workout_templates(id,user_id,name,notes) values(current_setting('actaro.template_a')::uuid,current_setting('actaro.workout_a')::uuid,'A template','Planned');
insert into public.workout_template_exercises(id,user_id,template_id,exercise_id,position)
values(current_setting('actaro.template_exercise_a')::uuid,current_setting('actaro.workout_a')::uuid,current_setting('actaro.template_a')::uuid,current_setting('actaro.workout_exercise')::uuid,0);
insert into public.workout_template_sets(id,user_id,template_exercise_id,position,reps,weight_kg,rest_seconds,rpe)
values(current_setting('actaro.template_set_a')::uuid,current_setting('actaro.workout_a')::uuid,current_setting('actaro.template_exercise_a')::uuid,0,8,20.125,60,7.5);
insert into public.workout_sessions(id,user_id,template_id,name,mode,started_at,local_date,time_zone)
values(current_setting('actaro.session_a')::uuid,current_setting('actaro.workout_a')::uuid,current_setting('actaro.template_a')::uuid,'A session snapshot','timed','2026-10-12 10:00Z','2026-10-12','UTC');
insert into public.workout_session_exercises(id,user_id,session_id,exercise_id,position)
values(current_setting('actaro.session_exercise_a')::uuid,current_setting('actaro.workout_a')::uuid,current_setting('actaro.session_a')::uuid,current_setting('actaro.workout_exercise')::uuid,0);
insert into public.workout_sets(id,user_id,session_exercise_id,position,reps,weight_kg,completed_at)
values(current_setting('actaro.set_a')::uuid,current_setting('actaro.workout_a')::uuid,current_setting('actaro.session_exercise_a')::uuid,0,10,22.5,'2026-10-12 10:10Z');

do $$
declare t text;
begin
  foreach t in array array['workout_templates','workout_template_exercises','workout_template_sets','workout_sessions','workout_session_exercises','workout_sets'] loop
    execute format('select pg_temp.assert_true(count(*) = 1, %L) from public.%I',t || ' own read',t);
    perform pg_temp.reject(format('update public.%I set user_id = %L',t,current_setting('actaro.workout_b')),'42501');
    perform pg_temp.reject(format('update public.%I set id = gen_random_uuid()',t),'42501');
  end loop;
  perform pg_temp.reject(format('insert into public.workout_templates(user_id,name) values(%L,''spoof'')',current_setting('actaro.workout_b')),'42501');
  perform pg_temp.reject(format('insert into public.workout_template_exercises(user_id,template_id,exercise_id,position) values(%L,%L,%L,0)',current_setting('actaro.workout_a'),current_setting('actaro.template_b'),current_setting('actaro.workout_exercise')),'23503');
  perform pg_temp.reject(format('insert into public.workout_sessions(user_id,template_id,name,mode,local_date,time_zone) values(%L,%L,''foreign'',''log_only'',current_date,''UTC'')',current_setting('actaro.workout_a'),current_setting('actaro.template_b')),'23503');
  perform pg_temp.reject(format('insert into public.workout_session_exercises(user_id,session_id,exercise_id,position) values(%L,%L,%L,0)',current_setting('actaro.workout_a'),current_setting('actaro.session_b'),current_setting('actaro.workout_exercise')),'23503');
  perform pg_temp.reject('update public.workout_templates set name = ''   ''','23514');
  perform pg_temp.reject('update public.workout_template_sets set reps = 0','23514');
  perform pg_temp.reject('update public.workout_template_sets set weight_kg = ''NaN''','23514');
  perform pg_temp.reject('update public.workout_sets set weight_kg = -1','23514');
  perform pg_temp.reject('update public.workout_sets set reps = null','23514');
  perform pg_temp.reject('update public.workout_sets set rpe = 11','23514');
  perform pg_temp.reject('update public.workout_sets set rest_seconds = -1','23514');
  perform pg_temp.reject('update public.workout_template_exercises set position = 100','23514');
  perform pg_temp.reject('update public.workout_sessions set status = ''completed''','23514');
  perform pg_temp.reject('update public.workout_sessions set ended_at = ''2026-10-12 09:59Z'', status = ''completed'',duration_seconds=60','23514');
  perform pg_temp.reject('update public.workout_sessions set ended_at = ''2026-10-12 10:20Z'', status = ''completed''','23514');
  perform pg_temp.reject('update public.workout_sessions set ended_at = ''2026-10-12 10:20Z'', status = ''completed'',duration_seconds=1201','23514');
  perform pg_temp.reject('update public.workout_sessions set mode = ''log_only''','42501');
  perform pg_temp.reject('update public.workout_session_exercises set exercise_name = ''tampered''','42501');
  perform pg_temp.reject('update public.workout_session_exercises set primary_muscle_ids = ''{}''','42501');
  perform pg_temp.reject('update public.workout_sets set session_exercise_id = gen_random_uuid()','42501');
  perform pg_temp.reject('update public.workout_templates set created_at = now()','42501');
  perform pg_temp.reject('update public.workout_sessions set time_zone = ''UTC''','42501');
  perform pg_temp.reject(format('insert into public.workout_sessions(user_id,name,mode,started_at,local_date,time_zone) values(%L,''invalid date'',''log_only'',''2026-10-12 10:00Z'',''2026-10-11'',''UTC'')',current_setting('actaro.workout_a')),'23514');
  perform pg_temp.reject(format('insert into public.workout_sessions(user_id,name,mode,started_at,local_date,time_zone) values(%L,''invalid instant'',''log_only'',''infinity'',''2026-10-12'',''UTC'')',current_setting('actaro.workout_a')),'23514');
  perform pg_temp.reject(format('insert into public.workout_template_exercises(user_id,template_id,exercise_id,position) values(%L,%L,%L,1)',current_setting('actaro.workout_a'),current_setting('actaro.template_a'),gen_random_uuid()),'23503');
  perform pg_temp.reject(format('insert into public.workout_template_sets(user_id,template_exercise_id,position) values(%L,%L,0)',current_setting('actaro.workout_a'),current_setting('actaro.template_exercise_a')),'23505');
end; $$;
update public.workout_templates set name='Changed plan',notes='Revised';
update public.workout_template_exercises set notes='Changed exercise';
update public.workout_template_sets set reps=12,weight_kg=40;
update public.workout_session_exercises set notes='Performed exercise';
update public.workout_sets set reps=11;
update public.workout_sessions set status='completed',ended_at='2026-10-12 10:20Z',duration_seconds=900,notes='Finished';
select pg_temp.assert_true((select name='A session snapshot' and duration_seconds=900 from public.workout_sessions),'template edit preserves session');
select pg_temp.assert_true((select reps=11 and weight_kg=22.5 from public.workout_sets),'planned values independent from actual');
select pg_temp.assert_true((select exercise_name='ACTARO Workout fixture' and cardinality(primary_muscle_ids)=1 from public.workout_session_exercises),'catalog snapshot populated');

-- B cannot see/update/delete A's rows. A's parent IDs cannot be used for B's children.
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.workout_b'),'role','authenticated')::text,true);
do $$ declare t text; affected integer; begin
  foreach t in array array['workout_templates','workout_template_exercises','workout_template_sets','workout_sessions','workout_session_exercises','workout_sets'] loop
    execute format('select pg_temp.assert_true(count(*) = 0, %L) from public.%I where user_id = %L',t || ' other read',t,current_setting('actaro.workout_a'));
    execute format('update public.%I set notes = ''foreign'' where user_id = %L',t,current_setting('actaro.workout_a'));
    get diagnostics affected = row_count; perform pg_temp.assert_true(affected=0,t || ' other update');
    execute format('delete from public.%I where user_id = %L',t,current_setting('actaro.workout_a'));
    get diagnostics affected = row_count; perform pg_temp.assert_true(affected=0,t || ' other delete');
  end loop;
  perform pg_temp.reject(format('insert into public.workout_template_sets(user_id,template_exercise_id,position) values(%L,%L,1)',current_setting('actaro.workout_b'),current_setting('actaro.template_exercise_a')),'23503');
  perform pg_temp.reject(format('insert into public.workout_sets(user_id,session_exercise_id,position) values(%L,%L,1)',current_setting('actaro.workout_b'),current_setting('actaro.session_exercise_a')),'23503');
  perform pg_temp.reject('update public.workout_sessions set duration_seconds=10','23514');
end; $$;
update public.workout_sessions set status='completed',ended_at='2026-10-12 10:30Z';
select pg_temp.assert_true((select duration_seconds is null from public.workout_sessions),'Log Only has no total timer');
reset role;
update public.exercises set name='Catalog edited' where id=current_setting('actaro.workout_exercise')::uuid;
delete from public.exercise_muscles where exercise_id=current_setting('actaro.workout_exercise')::uuid;
select pg_temp.assert_true((select exercise_name='ACTARO Workout fixture' and cardinality(primary_muscle_ids)=1 from public.workout_session_exercises),'catalog change preserves historical snapshot');
set local role anon;
do $$ declare t text; begin
  foreach t in array array['workout_templates','workout_template_exercises','workout_template_sets','workout_sessions','workout_session_exercises','workout_sets'] loop
    perform pg_temp.reject(format('select * from public.%I',t),'42501');
    perform pg_temp.reject(format('update public.%I set notes = ''anon''',t),'42501');
    perform pg_temp.reject(format('delete from public.%I',t),'42501');
    perform pg_temp.reject(format('insert into public.%I default values',t),'42501');
  end loop;
end; $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.workout_a'),'role','authenticated')::text,true);
delete from public.workout_templates;
select pg_temp.assert_true((select count(*)=0 from public.workout_template_sets),'template child cascade');
select pg_temp.assert_true((select count(*)=0 from public.workout_template_exercises),'template exercise cascade');
select pg_temp.assert_true((select template_id is null and user_id=current_setting('actaro.workout_a')::uuid from public.workout_sessions),'template deletion preserves session owner/history');
select pg_temp.assert_true((select count(*)=1 from public.workout_sets),'template deletion preserves performed sets');
delete from public.workout_sets;
delete from public.workout_session_exercises;
delete from public.workout_sessions;
select pg_temp.assert_true((select count(*)=0 from public.workout_sessions),'owned delete');
reset role;
delete from auth.users where id=current_setting('actaro.workout_b')::uuid;
select pg_temp.assert_true(not exists(select 1 from public.workout_sessions where user_id=current_setting('actaro.workout_b')::uuid),'account deletion cascades');
rollback;
