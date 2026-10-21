-- Derived thumbnails keep list/Today reads small; full routes are fetched only on detail.
create function public.run_route_preview(p_route jsonb)
returns jsonb language sql immutable security invoker set search_path = '' as $$
  select jsonb_agg(point.value order by point.ordinality)
  from jsonb_array_elements(p_route) with ordinality as point
  where point.ordinality = 1 or point.ordinality = jsonb_array_length(p_route)
    or (point.ordinality - 1) % greatest(1, ceil(jsonb_array_length(p_route)::numeric / 120)::integer) = 0;
$$;
revoke all on function public.run_route_preview(jsonb) from public, anon;
grant execute on function public.run_route_preview(jsonb) to authenticated, service_role;
alter table public.run_sessions
  alter column distance_meters set not null,
  add column route_preview jsonb generated always as (public.run_route_preview(route)) stored not null;
