begin;
select set_config('actaro.builder_a',gen_random_uuid()::text,true);
select set_config('actaro.builder_b',gen_random_uuid()::text,true);
select set_config('actaro.builder_id',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('actaro.builder_a')::uuid),(current_setting('actaro.builder_b')::uuid);
select set_config('actaro.builder_exercise',(select id::text from public.exercises order by id limit 1),true);
-- This suite needs a real catalog entry; no mock app data is persisted.
do $$ begin if current_setting('actaro.builder_exercise')='' then raise exception 'Exercise catalog required'; end if; end; $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.builder_a'),'role','authenticated')::text,true);
select public.save_workout_template(current_setting('actaro.builder_id')::uuid,' Builder fixture ','Initial',jsonb_build_array(
 jsonb_build_object('exercise_id',current_setting('actaro.builder_exercise'),'notes','Exercise note','sets',jsonb_build_array(jsonb_build_object('reps',8,'weight_kg',22.5,'rest_seconds',90,'rpe',7.5,'notes','Set note'))),
 jsonb_build_object('exercise_id',current_setting('actaro.builder_exercise'),'sets',jsonb_build_array(jsonb_build_object('reps',10,'weight_kg',null,'rest_seconds',60,'rpe',null)))));
do $$ begin
  if (select count(*) from public.workout_templates)<>1 or (select count(*) from public.workout_template_sets)<>2 then raise exception 'Save failed'; end if;
  if (select name from public.workout_templates)<>'Builder fixture' then raise exception 'Name normalization failed'; end if;
  begin
    perform public.save_workout_template(current_setting('actaro.builder_id')::uuid,'Lost changes',null,jsonb_build_array(jsonb_build_object('exercise_id',current_setting('actaro.builder_exercise'),'sets',jsonb_build_array(jsonb_build_object('reps',0,'rest_seconds',90)))));
    raise exception 'Invalid set accepted';
  exception when check_violation then null; end;
  if (select name from public.workout_templates)<>'Builder fixture' or (select count(*) from public.workout_template_sets)<>2 then raise exception 'Failed save lost original'; end if;
  begin
    perform public.save_workout_template(current_setting('actaro.builder_id')::uuid,'Bad',null,'[]'); raise exception 'Empty workout accepted';
  exception when invalid_parameter_value then null; end;
end; $$;
select public.save_workout_template(current_setting('actaro.builder_id')::uuid,'Saved edit',null,jsonb_build_array(jsonb_build_object('exercise_id',current_setting('actaro.builder_exercise'),'sets',jsonb_build_array(jsonb_build_object('reps',12,'weight_kg',0,'rest_seconds',120)))));
select public.save_workout_template(current_setting('actaro.builder_id')::uuid,'Saved edit',null,jsonb_build_array(jsonb_build_object('exercise_id',current_setting('actaro.builder_exercise'),'sets',jsonb_build_array(jsonb_build_object('reps',12,'weight_kg',0,'rest_seconds',120)))));
do $$ begin
  if (select count(*) from public.workout_templates)<>1 or (select count(*) from public.workout_template_sets)<>1 then raise exception 'Retry duplicated data'; end if;
  if (select reps from public.workout_template_sets)<>12 then raise exception 'Edit failed'; end if;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.builder_b'),'role','authenticated')::text,true);
do $$ begin
  if exists(select 1 from public.workout_templates) then raise exception 'Other workout visible'; end if;
  begin
    perform public.save_workout_template(current_setting('actaro.builder_id')::uuid,'Spoofed',null,jsonb_build_array(jsonb_build_object('exercise_id',current_setting('actaro.builder_exercise'),'sets',jsonb_build_array(jsonb_build_object('reps',1,'rest_seconds',1)))));
    raise exception 'Other owner overwritten';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local role anon;
do $$ begin
  begin perform public.save_workout_template(gen_random_uuid(),'Anon',null,'[]'); raise exception 'Anonymous save accepted';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
rollback;
