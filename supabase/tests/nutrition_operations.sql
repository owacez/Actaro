begin;
insert into auth.users(id) values('04100000-0000-4000-8000-000000000001'),('04100000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"04100000-0000-4000-8000-000000000001"}',true);
insert into public.foods(id,user_id,name,kind,source,base_unit,base_amount,calories,protein,carbs,fat,portions)
values('04100000-0000-4000-8000-000000000003',auth.uid(),'Ingredient A','custom','user','g',100,165,31,0,3.6,'[{"label":"1 cup","unit":"cup","amount":140}]');
select public.save_food_log(auth.uid(),'04100000-0000-4000-8000-000000000004',current_date,'UTC','Lunch','04100000-0000-4000-8000-000000000003','g',180);
select public.save_food_log(auth.uid(),'04100000-0000-4000-8000-000000000004',current_date,'UTC','Lunch','04100000-0000-4000-8000-000000000003','g',180);
select public.save_recipe(auth.uid(),'04100000-0000-4000-8000-000000000005','Weighted recipe','[{"food_id":"04100000-0000-4000-8000-000000000003","unit":"0","quantity":2}]',2,800);
select public.save_food_log(auth.uid(),'04100000-0000-4000-8000-000000000006',current_date,'UTC','Dinner','04100000-0000-4000-8000-000000000005','g',200);
select public.save_meal(auth.uid(),'04100000-0000-4000-8000-000000000007','Lunch template',current_date,'Lunch');
insert into public.nutrition_targets(user_id,calories,protein,carbs,fat,water_ml) values(auth.uid(),2000,100,200,60,2500);
do $$ begin if not exists(select 1 from public.nutrition_target_history where user_id=auth.uid() and effective_date=current_date and calories=2000) then raise exception 'Target history missing';end if;end; $$;
select public.copy_nutrition(auth.uid(),'04100000-0000-4000-8000-000000000008',current_date-1,'UTC',null,null,'04100000-0000-4000-8000-000000000007','Breakfast');
select public.copy_nutrition(auth.uid(),'04100000-0000-4000-8000-000000000008',current_date-1,'UTC',null,null,'04100000-0000-4000-8000-000000000007','Breakfast');
do $$ begin
 if (select count(*) from public.food_logs)<>3 then raise exception 'Retry duplicate';end if;
 if (select calories from public.food_logs where id='04100000-0000-4000-8000-000000000006')<>115.5 then raise exception 'Recipe weight math';end if;
 if (select count(*) from public.search_foods('Ingredient',0,'Recent'))<>1 then raise exception 'Recent search';end if;
 begin perform public.save_food_log('04100000-0000-4000-8000-000000000002',gen_random_uuid(),current_date,'UTC','Lunch','04100000-0000-4000-8000-000000000003','g',1);raise exception 'Actor mismatch accepted';exception when insufficient_privilege then null;end;
 begin perform public.save_food_log(auth.uid(),gen_random_uuid(),current_date,'UTC','Lunch','04100000-0000-4000-8000-000000000003','ml',1);raise exception 'Invented density';exception when invalid_parameter_value then null;end;
 begin perform public.save_recipe(auth.uid(),gen_random_uuid(),'Bad recipe','[{"food_id":"04100000-0000-4000-8000-000000000003","unit":"g","quantity":1}]',0,800);raise exception 'Zero servings';exception when invalid_parameter_value then null;end;
end; $$;
update public.foods set calories=200 where id='04100000-0000-4000-8000-000000000003';
select public.save_food_log(auth.uid(),'04100000-0000-4000-8000-000000000004',current_date,'UTC','Lunch','04100000-0000-4000-8000-000000000003','g',180);
delete from public.saved_meals where id='04100000-0000-4000-8000-000000000007';
select public.copy_nutrition(auth.uid(),'04100000-0000-4000-8000-000000000008',current_date-1,'UTC',null,null,'04100000-0000-4000-8000-000000000007','Breakfast');
do $$ begin
 if(select count(*) from public.search_foods('Ingred',0,'Search'))<>1 then raise exception 'Prefix search failed';end if;
 if(select count(*) from public.food_logs)<>3 then raise exception 'Changed source retry duplicated';end if;
end; $$;
do $$ begin if(select calories from public.food_logs where id='04100000-0000-4000-8000-000000000004')<>297 then raise exception 'History changed';end if;end; $$;
insert into public.nutrition_target_history(user_id,effective_date,calories,protein,carbs,fat,water_ml)
values(auth.uid(),current_date-10,1800,90,180,50,2000);
update public.nutrition_targets set calories=2200 where user_id=auth.uid();
do $$ begin
 if(select calories from public.nutrition_target_history where effective_date<=current_date-1 order by effective_date desc limit 1)<>1800 then raise exception 'Historical target rewritten';end if;
 if public.copy_nutrition(auth.uid(),'04100000-0000-4000-8000-000000000009',current_date+1,'UTC',current_date)<>2 then raise exception 'Whole day copy';end if;
 if public.copy_nutrition(auth.uid(),'04100000-0000-4000-8000-000000000009',current_date+1,'UTC',current_date)<>2 then raise exception 'Whole day retry';end if;
 if(select count(distinct meal) from public.food_logs where local_date=current_date+1)<>2 then raise exception 'Meal groups lost during copy';end if;
end; $$;
select set_config('request.jwt.claims','{"sub":"04100000-0000-4000-8000-000000000002"}',true);
do $$ begin
 if exists(select 1 from public.saved_meals) or exists(select 1 from public.food_logs) then raise exception 'Private meal leaked';end if;
 if exists(select 1 from public.nutrition_target_history) then raise exception 'Target history leaked';end if;
 begin perform public.copy_nutrition(auth.uid(),gen_random_uuid(),current_date,'UTC',null,null,'04100000-0000-4000-8000-000000000007','Lunch');raise exception 'Foreign saved meal copied';exception when invalid_parameter_value then null;end;
 begin perform public.save_recipe(auth.uid(),gen_random_uuid(),'Foreign ingredient','[{"food_id":"04100000-0000-4000-8000-000000000003","unit":"g","quantity":1}]',2);raise exception 'Foreign recipe ingredient';exception when invalid_parameter_value then null;end;
end; $$;
rollback;
