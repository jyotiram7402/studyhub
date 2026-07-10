-- StudyHub storage buckets and policies
-- Run after schema.sql in the Supabase SQL editor.

-- Private bucket for the actual note files (served through signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-files',
  'note-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do nothing;

-- Public bucket for thumbnails and preview images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- note-files: users upload into a folder named after their user id
create policy "Users can upload note files to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'note-files'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Signed-in users can read note files"
  on storage.objects for select
  using (bucket_id = 'note-files' and auth.role() = 'authenticated');

create policy "Users can delete their own note files"
  on storage.objects for delete
  using (
    bucket_id = 'note-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- thumbnails: publicly readable, owner-scoped writes
create policy "Thumbnails are publicly readable"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "Users can upload thumbnails to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own thumbnails"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
