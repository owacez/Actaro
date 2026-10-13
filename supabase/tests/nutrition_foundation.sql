begin;
insert into auth.users(id) values('04000000-0000-4000-8000-000000000001'),('04000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"04000000-0000-4000-8000-000000000001"}',true);
insert into public.foods(id,user_id,name,kind,source,base_unit,base_amount,calories,protein,carbs,fat)
values('04000000-0000-4000-8000-000000000003',auth.uid(),'Private test food','custom','user','g',100,165,31,0,3.6);
insert into public.food_logs(id,user_id,local_date,time_zone,meal,food_id,food_name,source,base_unit,base_amount,base_calories,base_protein,base_carbs,base_fat,portion_label,portion_amount,quantity)
values('04000000-0000-4000-8000-000000000004',auth.uid(),current_date,'UTC','Lunch','04000000-0000-4000-8000-000000000003','Private test food','user','g',100,165,31,0,3.6,'g',1,180);
do $$ begin
 if (select calories from public.food_logs where id='04000000-0000-4000-8000-000000000004')<>297 then raise exception 'Portion calculation failed';end if;
 begin insert into public.nutrition_targets(user_id,calories,protein,carbs,fat,water_ml) values(auth.uid(),'NaN',0,0,0,2000);raise exception 'NaN accepted';exception when check_violation then null;end;
 begin insert into public.food_favorites values('04000000-0000-4000-8000-000000000002','04000000-0000-4000-8000-000000000003');raise exception 'Foreign owner accepted';exception when insufficient_privilege then null;end;
 begin update public.foods set portions='[{"label":"cup","unit":"cup","amount":0}]';raise exception 'Bad portion accepted';exception when check_violation then null;end;
end; $$;
select set_config('request.jwt.claims','{"sub":"04000000-0000-4000-8000-000000000002"}',true);
do $$ begin
 if exists(select 1 from public.foods where id='04000000-0000-4000-8000-000000000003') or exists(select 1 from public.food_logs) then raise exception 'Private data leaked';end if;
 begin insert into public.food_favorites values(auth.uid(),'04000000-0000-4000-8000-000000000003');raise exception 'Foreign food referenced';exception when insufficient_privilege then null;end;
end; $$;
reset role;
delete from public.foods where id='04000000-0000-4000-8000-000000000003';
do $$ begin if (select calories from public.food_logs where id='04000000-0000-4000-8000-000000000004')<>297 then raise exception 'Historical nutrition lost';end if;end; $$;
set local role anon;
do $$ begin begin perform * from public.food_logs;raise exception 'Anonymous read accepted';exception when insufficient_privilege then null;end;end; $$;
rollback;
