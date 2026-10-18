-- Private personal details share the existing owner-only profile policies.
alter table public.profiles
  add column sex text check (sex in ('female','male','intersex','prefer_not_to_say')),
  add column date_of_birth date check (date_of_birth between date '1900-01-01' and current_date),
  add column location text check (length(btrim(location)) between 1 and 120);
grant update(sex,date_of_birth,location) on public.profiles to authenticated;

-- Keep profile details and dated measurements in a single transaction. Blank
-- weight/height leaves existing dated records untouched; deletion stays explicit.
create function public.save_body_form(
  p_user_id uuid,p_date date,p_zone text,
  p_weight numeric default null,p_height numeric default null,
  p_sex text default null,p_date_of_birth date default null,
  p_location text default null,p_notes text default ''
) returns date language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    raise exception 'Account changed' using errcode='42501';
  end if;
  if p_zone is null or not private.is_valid_time_zone(p_zone) then
    raise exception 'Invalid timezone' using errcode='22023';
  end if;
  if p_date is null or p_date not between date '1900-01-01' and (now() at time zone p_zone)::date then
    raise exception 'Invalid log date' using errcode='22023';
  end if;
  update public.profiles set sex=p_sex,date_of_birth=p_date_of_birth,location=nullif(btrim(p_location),'') where id=p_user_id;
  if not found then raise exception 'Profile unavailable' using errcode='42501'; end if;
  if p_weight is not null then
    perform public.save_body_record(p_user_id,'weight',p_date,p_weight,p_zone,'',p_notes);
  end if;
  if p_height is not null then
    perform public.save_body_record(p_user_id,'measurement',p_date,p_height,p_zone,'height',p_notes);
  end if;
  return p_date;
end; $$;
revoke all on function public.save_body_form(uuid,date,text,numeric,numeric,text,date,text,text) from public,anon,authenticated;
grant execute on function public.save_body_form(uuid,date,text,numeric,numeric,text,date,text,text) to authenticated;
