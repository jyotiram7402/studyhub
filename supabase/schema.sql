-- StudyHub Phase 1 schema
-- Run this file in the Supabase SQL editor before deploying the app.

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name text not null check (char_length(full_name) between 1 and 80),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  college text check (char_length(college) <= 120),
  course text check (char_length(course) <= 120),
  semester text check (char_length(semester) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 160),
  country text,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 160),
  description text not null check (char_length(description) between 20 and 5000),
  category_id uuid not null references public.categories (id),
  university_id uuid references public.universities (id),
  course_id uuid references public.courses (id),
  subject_id uuid references public.subjects (id),
  college text check (char_length(college) <= 160),
  board text check (char_length(board) <= 120),
  semester text check (char_length(semester) <= 40),
  department text check (char_length(department) <= 120),
  language text not null default 'English' check (char_length(language) <= 40),
  price numeric(10, 2) not null default 0 check (price >= 0),
  file_path text not null,
  file_name text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  file_type text not null check (
    file_type in ('pdf', 'docx', 'doc', 'ppt', 'pptx', 'zip', 'png', 'jpg', 'jpeg', 'webp')
  ),
  thumbnail_path text,
  preview_pages int not null default 0 check (preview_pages between 0 and 20),
  views bigint not null default 0,
  downloads bigint not null default 0,
  bookmarks_count bigint not null default 0,
  status text not null default 'published' check (status in ('published', 'draft')),
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_uploader_idx on public.notes (uploader_id);
create index notes_category_idx on public.notes (category_id);
create index notes_university_idx on public.notes (university_id);
create index notes_course_idx on public.notes (course_id);
create index notes_subject_idx on public.notes (subject_id);
create index notes_created_idx on public.notes (created_at desc);
create index notes_downloads_idx on public.notes (downloads desc);
create index notes_search_idx on public.notes using gin (search_vector);

create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (note_id, tag_id)
);

create table public.bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create index bookmarks_note_idx on public.bookmarks (note_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create or replace function public.notes_search_vector_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  university_name text;
  course_name text;
  subject_name text;
begin
  select name into university_name from public.universities where id = new.university_id;
  select name into course_name from public.courses where id = new.course_id;
  select name into subject_name from public.subjects where id = new.subject_id;

  new.search_vector :=
    setweight(to_tsvector('simple', unaccent(coalesce(new.title, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(subject_name, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(course_name, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(university_name, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(new.department, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(new.semester, ''))), 'C') ||
    setweight(to_tsvector('simple', unaccent(coalesce(new.description, ''))), 'C');
  return new;
end;
$$;

create trigger notes_search_vector
  before insert or update of title, description, university_id, course_id, subject_id, semester, department
  on public.notes
  for each row execute function public.notes_search_vector_update();

create or replace function public.sync_bookmarks_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.notes set bookmarks_count = bookmarks_count + 1 where id = new.note_id;
    return new;
  else
    update public.notes set bookmarks_count = greatest(bookmarks_count - 1, 0) where id = old.note_id;
    return old;
  end if;
end;
$$;

create trigger bookmarks_count_sync
  after insert or delete on public.bookmarks
  for each row execute function public.sync_bookmarks_count();

-- ---------------------------------------------------------------------------
-- RPC functions (called from the app with the user's session)
-- ---------------------------------------------------------------------------

create or replace function public.increment_note_views(target_note_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.notes set views = views + 1 where id = target_note_id and status = 'published';
$$;

create or replace function public.increment_note_downloads(target_note_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.notes set downloads = downloads + 1 where id = target_note_id and status = 'published';
$$;

create or replace function public.search_notes(search_query text)
returns setof public.notes
language sql
stable
as $$
  select *
  from public.notes
  where status = 'published'
    and search_vector @@ websearch_to_tsquery('simple', unaccent(search_query))
  order by ts_rank(search_vector, websearch_to_tsquery('simple', unaccent(search_query))) desc;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.courses enable row level security;
alter table public.subjects enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.notes enable row level security;
alter table public.note_tags enable row level security;
alter table public.bookmarks enable row level security;

-- profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- reference data: readable by everyone, extendable by signed-in users
create policy "Universities are viewable by everyone"
  on public.universities for select using (true);

create policy "Signed-in users can add universities"
  on public.universities for insert with check (auth.role() = 'authenticated');

create policy "Courses are viewable by everyone"
  on public.courses for select using (true);

create policy "Signed-in users can add courses"
  on public.courses for insert with check (auth.role() = 'authenticated');

create policy "Subjects are viewable by everyone"
  on public.subjects for select using (true);

create policy "Signed-in users can add subjects"
  on public.subjects for insert with check (auth.role() = 'authenticated');

create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

create policy "Tags are viewable by everyone"
  on public.tags for select using (true);

create policy "Signed-in users can add tags"
  on public.tags for insert with check (auth.role() = 'authenticated');

-- notes
create policy "Published notes are viewable by everyone"
  on public.notes for select using (status = 'published' or auth.uid() = uploader_id);

create policy "Users can create their own notes"
  on public.notes for insert with check (auth.uid() = uploader_id);

create policy "Users can update their own notes"
  on public.notes for update using (auth.uid() = uploader_id) with check (auth.uid() = uploader_id);

create policy "Users can delete their own notes"
  on public.notes for delete using (auth.uid() = uploader_id);

-- note_tags
create policy "Note tags are viewable by everyone"
  on public.note_tags for select using (true);

create policy "Note owners can tag their notes"
  on public.note_tags for insert with check (
    exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  );

create policy "Note owners can untag their notes"
  on public.note_tags for delete using (
    exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  );

-- bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks for select using (auth.uid() = user_id);

create policy "Users can add bookmarks"
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can remove bookmarks"
  on public.bookmarks for delete using (auth.uid() = user_id);
