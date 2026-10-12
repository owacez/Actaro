-- One index per child covers both owner-scoped reads and its composite parent FK.
drop index public.workout_template_exercises_owner_idx;
create index workout_template_exercises_owner_idx on public.workout_template_exercises(user_id, template_id);
drop index public.workout_template_sets_owner_idx;
create index workout_template_sets_owner_idx on public.workout_template_sets(user_id, template_exercise_id);
drop index public.workout_session_exercises_owner_idx;
create index workout_session_exercises_owner_idx on public.workout_session_exercises(user_id, session_id);
drop index public.workout_sets_owner_idx;
create index workout_sets_owner_idx on public.workout_sets(user_id, session_exercise_id);
