create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  pose text not null check (pose in ('start', 'peak', 'main')),
  media_type text not null default 'image' check (media_type = 'image'),
  storage_path text not null,
  source text not null check (source in ('repdb', 'system')),
  source_external_id text not null check (char_length(source_external_id) between 1 and 512),
  license text not null check (char_length(btrim(license)) > 0),
  attribution text not null check (char_length(btrim(attribution)) > 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  byte_size integer not null check (byte_size between 1 and 1048576),
  created_at timestamptz not null default now(),
  unique (exercise_id, pose),
  check (storage_path = exercise_id::text || '/' || pose || '.webp')
);
alter table public.exercise_media enable row level security;
revoke all on public.exercise_media from public, anon, authenticated;
grant select on public.exercise_media to authenticated;
grant select, insert, update, delete on public.exercise_media to service_role;
create policy exercise_media_read_authenticated on public.exercise_media for select to authenticated using (true);

-- Private licensed app assets: signed-in reads only; imports use server privileges.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-media', 'exercise-media', false, 1048576, array['image/webp']);
create policy exercise_media_storage_read on storage.objects
for select to authenticated using (bucket_id = 'exercise-media');
