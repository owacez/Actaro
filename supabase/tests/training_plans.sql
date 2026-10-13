begin;
select set_config('actaro.plan_a',gen_random_uuid()::text,true),set_config('actaro.plan_b',gen_random_uuid()::text,true),set_config('actaro.plan_split',gen_random_uuid()::text,true),set_config('actaro.plan_invalid_split',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('actaro.plan_a')::uuid),(current_setting('actaro.plan_b')::uuid);
insert into public.training_plans(slug,name,goal,experience,days_per_week,description,source_url,workouts,days)
select 'invalid-fixture','Invalid fixture','general','any',3,'Fixture','https://example.invalid',jsonb_set(workouts,'{0,exercise_source_ids}','["missing-fixture-exercise"]'),days from public.training_plans where slug='bodyweight';
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.plan_a'),'role','authenticated')::text,true);
do $$ declare picked uuid;begin
 if (select count(*) from public.get_training_plans())<>7 then raise exception 'Catalog missing exercises or invalid preview';end if;
 if exists(select 1 from public.get_training_plans(p_days=>4) where days_per_week<>4) then raise exception 'Day filter failed';end if;
 if (select count(*) from public.get_training_plans(p_goal=>'strength'))<>1 then raise exception 'Goal filter failed';end if;
 if exists(select 1 from public.get_training_plans(p_experience=>'beginner') where experience not in ('beginner','any')) then raise exception 'Experience filter failed';end if;
 if not exists(select 1 from public.get_training_plans() where jsonb_array_length(workouts)>0 and workouts->0->'exercises'->>0 is not null) then raise exception 'Preview lacks exercise names';end if;
 if exists(select 1 from public.get_training_plans(p_available_only=>true) where cardinality(required_equipment)>0) then raise exception 'Unavailable equipment passed filter';end if;
 begin update public.training_plans set name='Spoofed';raise exception 'Shared plan updated';exception when insufficient_privilege then null;end;
 select id into picked from public.training_plans where slug='bodyweight';
 perform public.adopt_training_plan(picked,current_setting('actaro.plan_split')::uuid);
 perform public.adopt_training_plan(picked,current_setting('actaro.plan_split')::uuid);
 if (select count(*) from public.workout_templates)<>1 or (select count(*) from public.training_split_days)<>7 or (select count(*) from public.workout_template_sets)<>8 then raise exception 'Adoption/retry duplication or targets failed';end if;
 if (select count(*) from public.training_split_days where not is_rest)<>3 or not (select is_active from public.training_splits) then raise exception 'Plan schedule failed';end if;
 if exists(select 1 from public.workout_template_sets where weight_kg is not null) then raise exception 'Invented load';end if;
 select id into picked from public.training_plans where slug='invalid-fixture';
 begin perform public.adopt_training_plan(picked,current_setting('actaro.plan_invalid_split')::uuid);raise exception 'Missing exercise adopted';exception when foreign_key_violation then null;end;
 if (select count(*) from public.workout_templates)<>1 or not (select is_active from public.training_splits) then raise exception 'Failed adoption left partial copies';end if;
end; $$;
insert into public.user_equipment(user_id,equipment_id) select auth.uid(),id from public.equipment;
do $$ begin if (select count(*) from public.get_training_plans(p_available_only=>true))<>7 then raise exception 'Equipment availability failed';end if;end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.plan_b'),'role','authenticated')::text,true);
do $$ declare picked uuid;begin
 if exists(select 1 from public.training_splits) or exists(select 1 from public.workout_templates) then raise exception 'Foreign adoption visible';end if;
 select id into picked from public.training_plans where slug='bodyweight';
 begin perform public.adopt_training_plan(picked,current_setting('actaro.plan_split')::uuid);raise exception 'Foreign identity reused';exception when unique_violation or insufficient_privilege then null;end;
 if exists(select 1 from public.workout_templates) then raise exception 'Failed foreign adoption left copies';end if;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.plan_a'),'role','authenticated')::text,true);
update public.workout_templates set name='My editable copy';
do $$ begin
 if not exists(select 1 from public.training_plans where slug='bodyweight' and workouts->0->>'name'='Bodyweight Full Body') then raise exception 'Shared recipe mutated';end if;
end; $$;
delete from public.training_splits;
do $$ begin if (select count(*) from public.workout_templates)<>1 then raise exception 'Split deletion removed workout copy';end if;end; $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.get_training_plans();raise exception 'Anonymous catalog accepted';exception when insufficient_privilege then null;end;
 begin perform public.adopt_training_plan(gen_random_uuid(),gen_random_uuid());raise exception 'Anonymous adoption accepted';exception when insufficient_privilege then null;end;
end; $$;
reset role;rollback;
