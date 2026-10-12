-- Run as the administrative SQL role after the taxonomy migration.
-- No Auth accounts, emails or existing catalog records are changed.
begin;
select set_config('actaro.taxonomy_fixture_slug', 'schema-test-' || gen_random_uuid()::text, true);

do $$
declare
  table_name text;
  original_id uuid;
  imported_id uuid;
  invalid_value text;
  fixture_slug text := current_setting('actaro.taxonomy_fixture_slug');
begin
  foreach table_name in array array['muscles', 'equipment'] loop
    if not (select relrowsecurity from pg_class
      where oid = format('public.%I', table_name)::regclass) then
      raise exception 'FAIL: RLS disabled on %', table_name;
    end if;
    execute format('insert into public.%I(slug, name) values ($1, $2) returning id', table_name)
      into original_id using fixture_slug, 'Schema test';
    if original_id is null then raise exception 'FAIL: missing generated ID'; end if;
    execute format('insert into public.%I(slug, name) values ($1, $2)
      on conflict (slug) do update set name = excluded.name returning id', table_name)
      into imported_id using fixture_slug, 'Updated schema test';
    if imported_id <> original_id then raise exception 'FAIL: import changed stable ID'; end if;
    begin
      execute format('insert into public.%I(slug, name) values ($1, $2)', table_name)
        using fixture_slug, 'Duplicate';
      raise exception 'FAIL: duplicate slug accepted';
    exception when unique_violation then null;
    end;
    foreach invalid_value in array array['', 'Uppercase', 'two words', '-start', 'end-', repeat('a', 81)] loop
      begin
        execute format('insert into public.%I(slug, name) values ($1, $2)', table_name)
          using invalid_value, 'Schema test';
        raise exception 'FAIL: malformed slug accepted';
      exception when check_violation then null;
      end;
    end loop;
    foreach invalid_value in array array['', '   ', E'\t', ' padded ', repeat('a', 121)] loop
      begin
        execute format('insert into public.%I(slug, name) values ($1, $2)', table_name)
          using fixture_slug || '-invalid', invalid_value;
        raise exception 'FAIL: malformed name accepted';
      exception when check_violation then null;
      end;
    end loop;
    if has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT')
      or has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE')
      or has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE') then
      raise exception 'FAIL: client write grant';
    end if;
  end loop;
end;
$$;

set local role authenticated;
do $$
declare
  table_name text;
  row_count integer;
  query text;
begin
  foreach table_name in array array['muscles', 'equipment'] loop
    execute format('select count(*) from public.%I where slug = $1 and created_at is not null', table_name)
      into row_count using current_setting('actaro.taxonomy_fixture_slug');
    if row_count <> 1 then raise exception 'FAIL: authenticated catalog read'; end if;
    foreach query in array array[
      format('insert into public.%I(slug, name) values (''client-write'', ''Forbidden'')', table_name),
      format('update public.%I set name = ''Forbidden''', table_name),
      format('delete from public.%I', table_name),
      format('truncate public.%I', table_name)
    ] loop
      begin
        execute query;
        raise exception 'FAIL: client mutation permitted';
      exception when insufficient_privilege then null;
      end;
    end loop;
  end loop;
end;
$$;
reset role;

set local role anon;
do $$
declare table_name text;
begin
  foreach table_name in array array['muscles', 'equipment'] loop
    begin
      execute format('select * from public.%I', table_name);
      raise exception 'FAIL: anonymous read grant';
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;
reset role;

-- Verify RLS also denies anonymous reads if SELECT is accidentally granted.
-- This temporary grant, like all fixtures, is undone by ROLLBACK.
grant select on public.muscles, public.equipment to anon;
set local role anon;
do $$
begin
  if (select count(*) from public.muscles) <> 0
    or (select count(*) from public.equipment) <> 0 then
    raise exception 'FAIL: anonymous RLS exposed catalog';
  end if;
end;
$$;
reset role;
rollback;
