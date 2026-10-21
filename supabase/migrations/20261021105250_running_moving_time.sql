-- Retain the recording timer; derive a separate movement estimate from route segments.
-- Stationary detection starts a new segment so stopped time cannot inflate moving pace.
create function public.run_route_moving_seconds(p_route jsonb)
returns integer language sql immutable security invoker set search_path = '' as $$
  with points as (
    select value, lag(value) over (order by ordinality) as previous
    from jsonb_array_elements(p_route) with ordinality
  )
  select floor(coalesce(sum(case
    when value->>'segment' = previous->>'segment'
    then greatest(0, least(60000,
      (value->>'timestamp')::double precision - (previous->>'timestamp')::double precision))
    else 0 end), 0) / 1000)::integer
  from points;
$$;
revoke all on function public.run_route_moving_seconds(jsonb) from public, anon;
grant execute on function public.run_route_moving_seconds(jsonb) to authenticated, service_role;
alter table public.run_sessions add column moving_seconds integer
  generated always as (least(duration_seconds, public.run_route_moving_seconds(route))) stored not null;
