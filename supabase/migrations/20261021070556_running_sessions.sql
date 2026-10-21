-- Private run history. Routes stay local during recording and upload on explicit save.
create function public.run_route_distance(p_route jsonb)
returns double precision language plpgsql immutable security invoker set search_path = '' as $$
declare
  point jsonb; previous_point jsonb; lat double precision; lon double precision;
  stamp double precision; segment integer; gap double precision; metres double precision;
  a double precision; total double precision := 0;
begin
  if jsonb_typeof(p_route) is distinct from 'array' or jsonb_array_length(p_route) not between 1 and 20000 then
    raise exception 'Invalid run route' using errcode = '22023';
  end if;
  for point in select value from jsonb_array_elements(p_route) loop
    if jsonb_typeof(point->'latitude') is distinct from 'number'
      or jsonb_typeof(point->'longitude') is distinct from 'number'
      or jsonb_typeof(point->'timestamp') is distinct from 'number'
      or jsonb_typeof(point->'accuracy') is distinct from 'number'
      or jsonb_typeof(point->'segment') is distinct from 'number' then
      raise exception 'Invalid run point' using errcode = '22023';
    end if;
    lat := (point->>'latitude')::double precision;
    lon := (point->>'longitude')::double precision;
    stamp := (point->>'timestamp')::double precision;
    segment := (point->>'segment')::integer;
    if lat not between -90 and 90 or lon not between -180 and 180
      or stamp not between 0 and 4133980800000
      or (point->>'accuracy')::double precision not between 0 and 35
      or segment not between 0 and 20000 or (point->>'segment')::numeric <> segment then
      raise exception 'Invalid run coordinates' using errcode = '22023';
    end if;
    if previous_point is not null then
      gap := (stamp - (previous_point->>'timestamp')::double precision) / 1000;
      if gap <= 0 or segment < (previous_point->>'segment')::integer then
        raise exception 'Run points must be ordered' using errcode = '22023';
      end if;
      if segment = (previous_point->>'segment')::integer then
        a := power(sin(radians(lat - (previous_point->>'latitude')::double precision) / 2), 2)
          + cos(radians(lat)) * cos(radians((previous_point->>'latitude')::double precision))
          * power(sin(radians(lon - (previous_point->>'longitude')::double precision) / 2), 2);
        metres := 12742000 * asin(sqrt(least(1, greatest(0, a))));
        if gap > 60 or metres / gap > 12 then
          raise exception 'Run route requires a new segment after a GPS gap' using errcode = '22023';
        end if;
        total := total + metres;
      end if;
    end if;
    previous_point := point;
  end loop;
  return total;
end;
$$;
revoke all on function public.run_route_distance(jsonb) from public, anon;
grant execute on function public.run_route_distance(jsonb) to authenticated, service_role;

create table public.run_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  local_date date not null,
  time_zone text not null check (length(time_zone) between 1 and 100 and private.is_valid_time_zone(time_zone)),
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  route jsonb not null,
  distance_meters double precision generated always as (public.run_route_distance(route)) stored,
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  check (local_date = (started_at at time zone time_zone)::date),
  check (ended_at >= started_at and ended_at <= started_at + interval '24 hours'),
  check (duration_seconds <= extract(epoch from ended_at - started_at) + 1),
  check ((route->0->>'timestamp')::double precision >= extract(epoch from started_at) * 1000),
  check ((route->-1->>'timestamp')::double precision <= extract(epoch from ended_at) * 1000)
);
create index run_sessions_owner_date on public.run_sessions(user_id, local_date desc, id);
alter table public.run_sessions enable row level security;
create policy run_sessions_owner on public.run_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.run_sessions from anon, authenticated;
grant select, insert, update, delete on public.run_sessions to authenticated;
grant all on public.run_sessions to service_role;
