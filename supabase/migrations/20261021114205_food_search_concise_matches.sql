-- Preserve USDA records and nutrition; surface direct food names before composite dishes.
create or replace function public.search_foods(p_query text default '',p_offset integer default 0,p_mode text default 'Search')
returns setof public.foods language sql stable security invoker set search_path='' as $$
 with query as (select coalesce(string_agg(quote_literal(word)||':*',' & '),'')::tsquery as value from regexp_split_to_table(lower(p_query),'[^[:alnum:]]+') word where word<>'')
 select food.* from public.foods food cross join query
 where auth.uid() is not null and not food.archived and length(p_query)<=200 and p_offset between 0 and 100000
 and (btrim(p_query)='' or to_tsvector('simple',food.name)@@query.value)
 and (p_mode='Search'
  or(p_mode='Ingredients' and food.kind<>'recipe')
  or(p_mode='Favorites' and exists(select 1 from public.food_favorites fav where fav.user_id=(select auth.uid()) and fav.food_id=food.id))
  or(p_mode in ('Recent','Frequent') and exists(select 1 from public.food_logs log where log.user_id=(select auth.uid()) and log.food_id=food.id))
  or(p_mode='Custom' and food.user_id=(select auth.uid()) and food.kind='custom')
  or(p_mode='Recipes' and food.user_id=(select auth.uid()) and food.kind='recipe'))
 order by
  case when p_mode='Recent' then(select max(log.created_at) from public.food_logs log where log.user_id=(select auth.uid()) and log.food_id=food.id) end desc nulls last,
  case when p_mode='Frequent' then(select count(*) from public.food_logs log where log.user_id=(select auth.uid()) and log.food_id=food.id) end desc,
  case when btrim(p_query)='' then 0
    when lower(food.name)=lower(btrim(p_query)) then 0
    when starts_with(lower(food.name),lower(btrim(p_query))) then 1 else 2 end,
  case when btrim(p_query)<>'' then length(food.name) end,
  food.name,food.id offset greatest(p_offset,0) limit 24;
$$;
