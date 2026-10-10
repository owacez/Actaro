-- Run as the administrative SQL role through Supabase MCP or SQL Editor.
-- Everything, including disposable Auth records, is rolled back. This does not
-- send emails, read real users' private fields, or require a service key in Expo.
begin;
select set_config('actaro.test_user_a', gen_random_uuid()::text, true);
select set_config('actaro.test_user_b', gen_random_uuid()::text, true);
insert into auth.users (id) values
  (current_setting('actaro.test_user_a')::uuid),
  (current_setting('actaro.test_user_b')::uuid);

do $$
begin
  if (select count(*) from public.profiles where id in (
    current_setting('actaro.test_user_a')::uuid, current_setting('actaro.test_user_b')::uuid
  )) <> 2 then raise exception 'FAIL: profile creation'; end if;
  if (select count(*) from public.user_preferences where user_id in (
    current_setting('actaro.test_user_a')::uuid, current_setting('actaro.test_user_b')::uuid
  ) and time_zone = 'UTC' and weight_unit = 'kg' and length_unit = 'cm'
    and distance_unit = 'km' and energy_unit = 'kcal' and theme = 'system'
    and not notifications_enabled and not gamification_enabled) <> 2 then
    raise exception 'FAIL: default preferences';
  end if;
  if has_function_privilege('authenticated', 'private.initialize_user_profile()', 'execute')
    or has_function_privilege('anon', 'private.initialize_user_profile()', 'execute') then
    raise exception 'FAIL: initialization function exposed';
  end if;
end;
$$;

set local role anon;
do $$
declare q text;
begin
  foreach q in array array[
    'select * from public.profiles', 'select * from public.user_preferences',
    'insert into public.profiles(id) values (gen_random_uuid())',
    'insert into public.user_preferences(user_id) values (gen_random_uuid())',
    'update public.profiles set display_name = ''Anonymous''',
    'update public.user_preferences set theme = ''dark''',
    'delete from public.profiles', 'delete from public.user_preferences'
  ] loop
    begin
      execute q;
      raise exception 'FAIL: anonymous access allowed';
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  if (select count(*) from public.profiles) <> 0
    or (select count(*) from public.user_preferences) <> 0 then
    raise exception 'FAIL: missing JWT exposes data';
  end if;
end;
$$;

select set_config('request.jwt.claims', json_build_object(
  'sub', current_setting('actaro.test_user_a'), 'role', 'authenticated'
)::text, true);
do $$
declare
  q text;
  affected integer;
  original_created timestamptz;
  original_updated timestamptz;
begin
  if (select count(*) from public.profiles) <> 1
    or (select count(*) from public.profiles where id = auth.uid()) <> 1
    or (select count(*) from public.user_preferences) <> 1
    or (select count(*) from public.user_preferences where user_id = auth.uid()) <> 1 then
    raise exception 'FAIL: user A read isolation';
  end if;
  select created_at, updated_at into original_created, original_updated
  from public.profiles where id = auth.uid();
  perform pg_sleep(0.005);
  update public.profiles set display_name = 'Profile Test A' where id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 or not exists (
    select 1 from public.profiles where id = auth.uid()
    and display_name = 'Profile Test A' and created_at = original_created
    and updated_at > original_updated
  ) then raise exception 'FAIL: own profile update/timestamps'; end if;
  select created_at, updated_at into original_created, original_updated
  from public.user_preferences where user_id = auth.uid();
  update public.user_preferences set time_zone = 'Asia/Karachi', weight_unit = 'lb',
    length_unit = 'in', distance_unit = 'mi', energy_unit = 'kJ', theme = 'dark',
    notifications_enabled = true, gamification_enabled = true where user_id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 or not exists (
    select 1 from public.user_preferences where user_id = auth.uid()
    and time_zone = 'Asia/Karachi' and weight_unit = 'lb' and length_unit = 'in'
    and distance_unit = 'mi' and energy_unit = 'kJ' and theme = 'dark'
    and notifications_enabled and gamification_enabled and created_at = original_created
    and updated_at > original_updated
  ) then raise exception 'FAIL: own preference update/timestamps'; end if;

  update public.profiles set display_name = 'Intrusion'
  where id = current_setting('actaro.test_user_b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user profile update'; end if;
  update public.user_preferences set theme = 'dark'
  where user_id = current_setting('actaro.test_user_b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user preference update'; end if;

  -- Protected columns and all client creation/deletion must fail at the grant.
  foreach q in array array[
    'update public.profiles set id = gen_random_uuid()',
    'update public.user_preferences set user_id = gen_random_uuid()',
    'update public.profiles set created_at = now()',
    'update public.profiles set updated_at = now()',
    'update public.user_preferences set created_at = now()',
    'update public.user_preferences set updated_at = now()',
    'insert into public.profiles(id) values (gen_random_uuid())',
    'insert into public.user_preferences(user_id) values (gen_random_uuid())',
    'delete from public.profiles', 'delete from public.user_preferences'
  ] loop
    begin
      execute q;
      raise exception 'FAIL: protected write allowed';
    exception when insufficient_privilege then null;
    end;
  end loop;

  foreach q in array array[
    'update public.profiles set display_name = ''''',
    'update public.profiles set display_name = E'' \t\n''',
    'update public.profiles set display_name = repeat(''x'',81)',
    'update public.user_preferences set time_zone = ''Invalid/Zone''',
    'update public.user_preferences set time_zone = ''''',
    'update public.user_preferences set weight_unit = ''stone''',
    'update public.user_preferences set length_unit = ''feet''',
    'update public.user_preferences set distance_unit = ''yards''',
    'update public.user_preferences set energy_unit = ''joules''',
    'update public.user_preferences set theme = ''neon'''
  ] loop
    begin
      execute q;
      raise exception 'FAIL: invalid value accepted';
    exception when check_violation then null;
    end;
  end loop;
  begin
    update public.user_preferences set time_zone = null;
    raise exception 'FAIL: null timezone accepted';
  exception when not_null_violation then null;
  end;
  -- Null display name is an intentional supported value.
  update public.profiles set display_name = null where id = auth.uid();
end;
$$;

select set_config('request.jwt.claims', json_build_object(
  'sub', current_setting('actaro.test_user_b'), 'role', 'authenticated'
)::text, true);
do $$
begin
  if (select count(*) from public.profiles) <> 1
    or (select count(*) from public.profiles where id = auth.uid() and display_name is null) <> 1
    or (select count(*) from public.user_preferences where user_id = auth.uid() and theme = 'system') <> 1 then
    raise exception 'FAIL: user B data changed or isolation failed';
  end if;
  update public.profiles set display_name = 'Profile Test B' where id = auth.uid();
  if not found then raise exception 'FAIL: user B own update'; end if;
end;
$$;
reset role;

delete from auth.users where id = current_setting('actaro.test_user_a')::uuid;
do $$
begin
  if exists (select 1 from public.profiles where id = current_setting('actaro.test_user_a')::uuid)
    or exists (select 1 from public.user_preferences where user_id = current_setting('actaro.test_user_a')::uuid) then
    raise exception 'FAIL: account deletion cascade';
  end if;
  if not exists (select 1 from public.profiles where id = current_setting('actaro.test_user_b')::uuid) then
    raise exception 'FAIL: cascade affected another user';
  end if;
end;
$$;
select 'PASS: initialization, defaults, anonymous/missing-JWT access, two-user RLS, own updates, protected columns, constraints, timestamps and deletion cascades' as result;
rollback;
