begin;
select set_config('actaro.split_a',gen_random_uuid()::text,true),set_config('actaro.split_b',gen_random_uuid()::text,true),
 set_config('actaro.split_one',gen_random_uuid()::text,true),set_config('actaro.split_two',gen_random_uuid()::text,true),
 set_config('actaro.split_workout',gen_random_uuid()::text,true),set_config('actaro.split_foreign',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('actaro.split_a')::uuid),(current_setting('actaro.split_b')::uuid);
insert into public.workout_templates(id,user_id,name) values(current_setting('actaro.split_workout')::uuid,current_setting('actaro.split_a')::uuid,'Split fixture'),(current_setting('actaro.split_foreign')::uuid,current_setting('actaro.split_b')::uuid,'Foreign fixture');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.split_a'),'role','authenticated')::text,true);
select public.save_training_split(current_setting('actaro.split_one')::uuid,' Week A ',true,
 (select jsonb_agg(case when n=0 then jsonb_build_object('is_rest',false,'workout_id',current_setting('actaro.split_workout')) else jsonb_build_object('is_rest',true,'workout_id',null) end) from generate_series(0,6)n));
do $$ begin
 if (select count(*) from public.training_split_days)<>7 or (select name from public.training_splits)<>'Week A' then raise exception 'Split save failed'; end if;
 begin perform public.save_training_split(current_setting('actaro.split_two')::uuid,'Invalid',true,'[]');raise exception 'Missing days accepted';exception when invalid_parameter_value then null;end;
 begin perform public.save_training_split(current_setting('actaro.split_two')::uuid,'Foreign',true,
  (select jsonb_agg(jsonb_build_object('is_rest',false,'workout_id',current_setting('actaro.split_foreign'))) from generate_series(0,6)));raise exception 'Foreign workout accepted';exception when foreign_key_violation then null;end;
 if not (select is_active from public.training_splits) then raise exception 'Failed save deactivated old split';end if;
 begin perform public.save_training_split(current_setting('actaro.split_one')::uuid,'Broken',false,
  (select jsonb_agg(jsonb_build_object('is_rest',false,'workout_id',null)) from generate_series(0,6)));raise exception 'Unassigned day accepted';exception when invalid_parameter_value then null;end;
 if (select name from public.training_splits)<>'Week A' then raise exception 'Invalid replacement lost original';end if;
end; $$;
select public.save_training_split(current_setting('actaro.split_two')::uuid,'Recovery week',true,(select jsonb_agg(jsonb_build_object('is_rest',true,'workout_id',null)) from generate_series(0,6)));
select public.save_training_split(current_setting('actaro.split_two')::uuid,'Recovery week',true,(select jsonb_agg(jsonb_build_object('is_rest',true,'workout_id',null)) from generate_series(0,6)));
do $$ begin
 if (select count(*) from public.training_splits)<>2 or (select count(*) from public.training_split_days)<>14 or (select count(*) from public.training_splits where is_active)<>1 then raise exception 'Active selection/retry failed';end if;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.split_b'),'role','authenticated')::text,true);
do $$ declare affected integer;begin
 if exists(select 1 from public.training_splits) or exists(select 1 from public.training_split_days) then raise exception 'Other split visible';end if;
 delete from public.training_splits where id=current_setting('actaro.split_one')::uuid;get diagnostics affected=row_count;if affected<>0 then raise exception 'Other split deleted';end if;
 begin perform public.save_training_split(current_setting('actaro.split_one')::uuid,'Spoofed',true,(select jsonb_agg(jsonb_build_object('is_rest',true,'workout_id',null)) from generate_series(0,6)));raise exception 'Other split overwritten';exception when insufficient_privilege then null;end;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.split_a'),'role','authenticated')::text,true);
delete from public.workout_templates where id=current_setting('actaro.split_workout')::uuid;
do $$ begin
 if not exists(select 1 from public.training_split_days where split_id=current_setting('actaro.split_one')::uuid and weekday=0 and workout_id is null and not is_rest) then raise exception 'Deleted workout became rest or lost schedule';end if;
end; $$;
delete from public.training_splits where id=current_setting('actaro.split_two')::uuid;
do $$ begin if exists(select 1 from public.training_split_days where split_id=current_setting('actaro.split_two')::uuid) then raise exception 'Split children retained';end if;end; $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.save_training_split(gen_random_uuid(),'Anon',false,'[]');raise exception 'Anonymous save accepted';exception when insufficient_privilege then null;end;
 begin perform count(*) from public.training_splits;raise exception 'Anonymous read accepted';exception when insufficient_privilege then null;end;
end; $$;
reset role;rollback;
