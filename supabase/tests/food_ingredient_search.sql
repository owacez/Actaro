-- Read-only acceptance against the installed USDA catalogue. No test account is created.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"12000000-0000-4000-8000-000000000099"}',true);
do $$ declare result public.foods;
begin
  select * into result from public.search_foods('banana',0,'Ingredients') limit 1;
  if result.name is distinct from 'Bananas, raw' then raise exception 'Plain banana buried in search'; end if;
  if result.source_external_id is distinct from '173944' or result.calories <> 89 then raise exception 'USDA banana provenance changed'; end if;
  select * into result from public.search_foods('oats',0,'Ingredients') limit 1;
  if result.name is null or not starts_with(lower(result.name),'oats') then raise exception 'Plain oats buried in search'; end if;
  if result.source_external_id is distinct from '169705' then raise exception 'USDA oats provenance changed'; end if;
  if exists(select 1 from public.search_foods('',0,'Ingredients') where kind='recipe') then raise exception 'Recipe mixed into ingredient-only results'; end if;
  if exists(select 1 from public.search_foods('banana',0,'Recipes')) then raise exception 'Shared food exposed as personal recipe'; end if;
  if (select count(*) from public.search_foods('',0,'Ingredients')) <> 24 then raise exception 'Bounded food page changed'; end if;
  if exists(select 1 from public.search_foods('banana',0,'Ingredients') where user_id is not null) then raise exception 'Other owner food exposed'; end if;
end $$;
rollback;
