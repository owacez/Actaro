-- Administrative rollback-only tests. No emails or real account data is changed.
begin;
select set_config('actaro.test_user_a', gen_random_uuid()::text, true);
select set_config('actaro.test_user_b', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('actaro.test_user_a')::uuid), (current_setting('actaro.test_user_b')::uuid);
select public.import_repdb('[{"source_external_id":"actaro-schema-fixture-weighted","name":"ACTARO SQL fixture Weighted","instructions":["Fixture instruction"],"difficulty":"beginner","category":"strength","primary_muscles":["actaro-schema-muscle"],"secondary_muscles":[],"equipment":"actaro-schema-equipment"},{"source_external_id":"actaro-schema-fixture-bodyweight","name":"ACTARO SQL fixture Bodyweight","instructions":["Fixture instruction"],"difficulty":"beginner","category":"strength","primary_muscles":["actaro-schema-muscle"],"secondary_muscles":[],"equipment":null}]'::jsonb, repeat('a',40));
select set_config('actaro.test_exercise', (select id::text from public.exercises where source_external_id='actaro-schema-fixture-weighted'), true);
select set_config('actaro.test_equipment', (select id::text from public.equipment where slug='actaro-schema-equipment'), true);
select public.import_repdb('[{"source_external_id":"actaro-schema-fixture-weighted","name":"ACTARO SQL fixture Weighted","instructions":["Updated fixture instruction"],"difficulty":"beginner","category":"strength","primary_muscles":["actaro-schema-muscle"],"secondary_muscles":[],"equipment":"actaro-schema-equipment"}]'::jsonb, repeat('b',40));
do $$
begin
  if (select id from public.exercises where source_external_id='actaro-schema-fixture-weighted') <> current_setting('actaro.test_exercise')::uuid
    then raise exception 'FAIL: unstable imported ID'; end if;
  if (select count(*) from public.exercise_muscles where exercise_id=current_setting('actaro.test_exercise')::uuid) <> 1
    then raise exception 'FAIL: duplicate muscle relationships'; end if;
  begin
    insert into public.exercise_media(exercise_id,pose,storage_path,source,source_external_id,license,attribution,sha256,byte_size)
    values(current_setting('actaro.test_exercise')::uuid,'start','https://external.invalid/image.webp','repdb','fixture','fixture','fixture',repeat('a',64),100);
    raise exception 'FAIL: external media path accepted';
  exception when check_violation then null; end;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.test_user_a'),'role','authenticated')::text,true);
select public.save_equipment_profile(array[current_setting('actaro.test_equipment')::uuid]);
do $$
begin
  if (select count(*) from public.search_exercises('ACTARO SQL fixture')) <> 2 then raise exception 'FAIL: search'; end if;
  if (select count(*) from public.search_exercises('ACTARO SQL fixture',p_bodyweight=>true)) <> 1 then raise exception 'FAIL: bodyweight'; end if;
  if (select count(*) from public.search_exercises('ACTARO SQL fixture',p_equipment_id=>current_setting('actaro.test_equipment')::uuid)) <> 1 then raise exception 'FAIL: equipment filter'; end if;
  if (select count(*) from public.search_exercises('ACTARO SQL fixture',p_muscle_id=>(select id from public.muscles where slug='actaro-schema-muscle'))) <> 2 then raise exception 'FAIL: muscle filter'; end if;
  if (select count(*) from public.search_exercises('ACTARO SQL fixture',p_available_only=>true)) <> 2 then raise exception 'FAIL: owned equipment filter'; end if;
  if (select count(*) from public.search_exercises('ACTARO SQL fixture',p_limit=>1,p_offset=>1)) <> 1 then raise exception 'FAIL: pagination'; end if;
  begin
    perform public.import_repdb('[]',repeat('a',40)); raise exception 'FAIL: client imported';
  exception when insufficient_privilege then null; end;
  begin
    update public.exercises set name='Client mutation'; raise exception 'FAIL: client changed catalog';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.user_equipment(user_id,equipment_id) values(current_setting('actaro.test_user_b')::uuid,current_setting('actaro.test_equipment')::uuid);
    raise exception 'FAIL: spoofed equipment owner';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_equipment_profile(array[gen_random_uuid()]); raise exception 'FAIL: unknown equipment';
  exception when foreign_key_violation then null; end;
  if (select count(*) from public.user_equipment) <> 1 then raise exception 'FAIL: failed save lost selection'; end if;
end;
$$;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.test_user_b'),'role','authenticated')::text,true);
do $$
begin
  if (select count(*) from public.user_equipment) <> 0 then raise exception 'FAIL: another account equipment visible'; end if;
  delete from public.user_equipment where user_id=current_setting('actaro.test_user_a')::uuid;
  if (select count(*) from public.search_exercises('ACTARO SQL fixture',p_available_only=>true)) <> 1 then raise exception 'FAIL: other account selection used'; end if;
end;
$$;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('actaro.test_user_a'),'role','authenticated')::text,true);
do $$ begin
  if (select count(*) from public.user_equipment) <> 1 then raise exception 'FAIL: cross-account delete'; end if;
end; $$;
select public.save_equipment_profile('{}'::uuid[]);
do $$ begin
  if (select count(*) from public.user_equipment) <> 0 then raise exception 'FAIL: clear selection'; end if;
end; $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.search_exercises(''); raise exception 'FAIL: anonymous search';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.exercise_media; raise exception 'FAIL: anonymous media metadata';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
rollback;
