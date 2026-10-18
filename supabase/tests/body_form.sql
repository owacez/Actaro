begin;
insert into auth.users(id) values('05200000-0000-4000-8000-000000000101'),('05200000-0000-4000-8000-000000000102');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"05200000-0000-4000-8000-000000000101"}',true);
select public.save_body_form(auth.uid(),current_date,'UTC',80,180,'female','1995-02-14','Example City','First log');
select public.save_body_form(auth.uid(),current_date,'UTC',79,null,'female','1995-02-14','Example City','Updated');
do $$begin
 if (select count(*) from public.body_weights)<>1 or (select weight_kg from public.body_weights)<>79 then raise exception 'Weight replacement failed';end if;
 if (select value_cm from public.body_measurements where measurement='height')<>180 then raise exception 'Blank height destroyed the recorded height';end if;
 if (select sex from public.profiles where id=auth.uid())<>'female' then raise exception 'Personal details not saved';end if;
 begin perform public.save_body_form(auth.uid(),current_date,'UTC',77,-1,'male',null,'Should roll back');raise exception 'Invalid height accepted';exception when check_violation then null;end;
 if (select weight_kg from public.body_weights)<>79 or (select location from public.profiles where id=auth.uid())<>'Example City' then raise exception 'Partial write escaped rollback';end if;
 begin perform public.save_body_form(auth.uid(),current_date,'UTC',p_date_of_birth=>current_date+1);raise exception 'Future birth accepted';exception when check_violation then null;end;
 begin perform public.save_body_form(auth.uid(),current_date,'UTC',p_sex=>'invalid');raise exception 'Invalid sex accepted';exception when check_violation then null;end;
 begin perform public.save_body_form(auth.uid(),current_date,'UTC',p_location=>repeat('a',121));raise exception 'Oversized location accepted';exception when check_violation then null;end;
 begin perform public.save_body_form(auth.uid(),current_date+1,'UTC');raise exception 'Future log accepted';exception when invalid_parameter_value then null;end;
 begin perform public.save_body_form('05200000-0000-4000-8000-000000000102',current_date,'UTC',90);raise exception 'Foreign RPC accepted';exception when insufficient_privilege then null;end;
 update public.profiles set sex='male' where id='05200000-0000-4000-8000-000000000102';
 if found then raise exception 'Foreign profile update accepted';end if;
end;$$;
select public.save_body_form(auth.uid(),current_date,'UTC');
do $$begin
 if (select sex from public.profiles where id=auth.uid()) is not null or (select location from public.profiles where id=auth.uid()) is not null then raise exception 'Optional details not cleared';end if;
 if (select weight_kg from public.body_weights)<>79 then raise exception 'Details-only save erased weight';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"05200000-0000-4000-8000-000000000102"}',true);
do $$begin
 if exists(select 1 from public.body_weights) or exists(select 1 from public.body_measurements) or exists(select 1 from public.profiles where id<>'05200000-0000-4000-8000-000000000102') then raise exception 'Foreign details leaked';end if;
end;$$;
set local role anon;
do $$begin
 begin perform public.save_body_form('05200000-0000-4000-8000-000000000101',current_date,'UTC',80);raise exception 'Anonymous RPC accepted';exception when insufficient_privilege then null;end;
 begin perform 1 from public.profiles;raise exception 'Anonymous details leaked';exception when insufficient_privilege then null;end;
end;$$;
rollback;
