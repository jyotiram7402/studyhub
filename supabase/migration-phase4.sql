-- StudyHub Phase 4 migration: pgvector, embeddings, RAG, AI study tools.
-- Run in the Supabase SQL editor AFTER migration-phase3.sql.

create extension if not exists vector;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in (
    'upload_approved', 'upload_rejected', 'purchase_success', 'sale_made',
    'review_received', 'report_resolved', 'verification_updated', 'ai_insight'
  )
);

-- ---------------------------------------------------------------------------
-- Notes: AI processing state and derived signals
-- ---------------------------------------------------------------------------

alter table public.notes
  add column ai_status text not null default 'pending'
    check (ai_status in ('pending', 'processing', 'completed', 'failed', 'skipped')),
  add column difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  add column reading_time_minutes int check (reading_time_minutes between 0 and 6000),
  add column quality_score int check (quality_score between 0 and 100),
  add column plagiarism_score numeric(5, 2) not null default 0 check (plagiarism_score between 0 and 100),
  add column plagiarism_note_id uuid references public.notes (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Vector storage
-- ---------------------------------------------------------------------------

-- One embedding per note, computed from title + description + extracted text
create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null unique references public.notes (id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

create index embeddings_vector_idx on public.embeddings
  using hnsw (embedding vector_cosine_ops);

-- Chunked document text for retrieval-augmented answers
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now(),
  unique (note_id, chunk_index)
);

create index document_chunks_note_idx on public.document_chunks (note_id);
create index document_chunks_vector_idx on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- AI-derived content
-- ---------------------------------------------------------------------------

create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null unique references public.notes (id) on delete cascade,
  short_summary text not null,
  key_topics text[] not null default '{}',
  important_points text[] not null default '{}',
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  reading_time_minutes int,
  quality_score int check (quality_score between 0 and 100),
  quality_factors jsonb,
  auto_tags text[] not null default '{}',
  detected jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger summaries_updated_at
  before update on public.summaries
  for each row execute function public.set_updated_at();

create table public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid references public.notes (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_chat_sessions_user_idx on public.ai_chat_sessions (user_id, updated_at desc);

create trigger ai_chat_sessions_updated_at
  before update on public.ai_chat_sessions
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_session_idx on public.ai_messages (session_id, created_at);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid references public.notes (id) on delete cascade,
  question text not null,
  answer text not null,
  review_count int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index flashcards_user_idx on public.flashcards (user_id, created_at desc);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid references public.notes (id) on delete cascade,
  title text not null,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

create index quizzes_user_idx on public.quizzes (user_id, created_at desc);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid not null references public.notes (id) on delete cascade,
  score numeric(6, 5) not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (user_id, note_id)
);

create index recommendations_user_idx on public.recommendations (user_id, score desc);

-- ---------------------------------------------------------------------------
-- Access control helper
-- ---------------------------------------------------------------------------

-- A user may read a note's full content (chunks, RAG answers) when they
-- uploaded it, bought it, or it is a free public listing.
create or replace function public.can_access_note_content(target_note_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.notes n
    where n.id = target_note_id
      and (
        n.uploader_id = auth.uid()
        or public.is_admin()
        or (
          n.status = 'published'
          and n.visibility = 'public'
          and n.moderation_status = 'approved'
          and (
            n.price <= 0
            or exists (
              select 1 from public.purchases p
              where p.note_id = n.id and p.buyer_id = auth.uid()
            )
          )
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Vector search functions
-- ---------------------------------------------------------------------------

create or replace function public.match_notes(
  query_embedding vector(768),
  match_count int default 12
)
returns table (note_id uuid, similarity float)
language sql
stable
security definer set search_path = public
as $$
  select e.note_id, 1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  join public.notes n on n.id = e.note_id
  where n.status = 'published'
    and n.visibility = 'public'
    and n.moderation_status = 'approved'
  order by e.embedding <=> query_embedding
  limit least(match_count, 50);
$$;

create or replace function public.match_related_notes(
  source_note_id uuid,
  match_count int default 6
)
returns table (note_id uuid, similarity float)
language sql
stable
security definer set search_path = public
as $$
  select e.note_id, 1 - (e.embedding <=> src.embedding) as similarity
  from public.embeddings e
  join public.notes n on n.id = e.note_id
  cross join (
    select embedding from public.embeddings where note_id = source_note_id
  ) src
  where n.status = 'published'
    and n.visibility = 'public'
    and n.moderation_status = 'approved'
    and e.note_id <> source_note_id
  order by e.embedding <=> src.embedding
  limit least(match_count, 20);
$$;

-- Chunk retrieval for chatting with a single note; enforces content access.
create or replace function public.match_note_chunks(
  target_note_id uuid,
  query_embedding vector(768),
  match_count int default 6
)
returns table (chunk_index int, content text, similarity float)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.can_access_note_content(target_note_id) then
    return;
  end if;

  return query
  select c.chunk_index, c.content, 1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  where c.note_id = target_note_id
  order by c.embedding <=> query_embedding
  limit least(match_count, 12);
end;
$$;

-- Chunk retrieval across the caller's library (owned + purchased notes).
create or replace function public.match_library_chunks(
  query_embedding vector(768),
  match_count int default 8
)
returns table (note_id uuid, note_title text, chunk_index int, content text, similarity float)
language sql
stable
security definer set search_path = public
as $$
  select c.note_id, n.title, c.chunk_index, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  join public.notes n on n.id = c.note_id
  where n.uploader_id = auth.uid()
     or exists (
       select 1 from public.purchases p
       where p.note_id = c.note_id and p.buyer_id = auth.uid()
     )
  order by c.embedding <=> query_embedding
  limit least(match_count, 16);
$$;

-- Search logging feeds the recommendation engine
create or replace function public.log_search(search_query text)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.activity_logs (user_id, action, target_type, metadata)
  select auth.uid(), 'search', 'query', jsonb_build_object('q', left(search_query, 200))
  where auth.uid() is not null and char_length(search_query) > 0;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.embeddings enable row level security;
alter table public.document_chunks enable row level security;
alter table public.summaries enable row level security;
alter table public.ai_chat_sessions enable row level security;
alter table public.ai_messages enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.recommendations enable row level security;

-- embeddings: readable when the listing itself is publicly visible
create policy "Embeddings of visible notes are readable"
  on public.embeddings for select using (
    exists (
      select 1 from public.notes n
      where n.id = note_id
        and (
          (n.status = 'published' and n.visibility = 'public' and n.moderation_status = 'approved')
          or n.uploader_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Note owners manage their embeddings"
  on public.embeddings for all using (
    public.is_admin()
    or exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  ) with check (
    public.is_admin()
    or exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  );

-- document_chunks: full text only for users with content access
create policy "Chunks are readable with content access"
  on public.document_chunks for select using (public.can_access_note_content(note_id));

create policy "Note owners manage their chunks"
  on public.document_chunks for all using (
    public.is_admin()
    or exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  ) with check (
    public.is_admin()
    or exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  );

-- summaries: visible wherever the listing is visible (marketing surface)
create policy "Summaries of visible notes are readable"
  on public.summaries for select using (
    exists (
      select 1 from public.notes n
      where n.id = note_id
        and (
          (n.status = 'published' and n.visibility = 'public' and n.moderation_status = 'approved')
          or n.uploader_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Note owners manage their summaries"
  on public.summaries for all using (
    public.is_admin()
    or exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  ) with check (
    public.is_admin()
    or exists (select 1 from public.notes where id = note_id and uploader_id = auth.uid())
  );

-- chat sessions and messages are private
create policy "Users manage their chat sessions"
  on public.ai_chat_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage messages in their sessions"
  on public.ai_messages for all using (
    exists (select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- study artefacts are private
create policy "Users manage their flashcards"
  on public.flashcards for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage their quizzes"
  on public.quizzes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage their recommendations"
  on public.recommendations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
