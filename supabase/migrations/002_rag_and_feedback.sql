-- ── Tech Pros Home — RAG Knowledge Base + Feedback ──────────────────────────
-- Run this in Supabase SQL Editor after enabling the pgvector extension.
-- To enable pgvector: Database → Extensions → vector → Enable

-- ── Enable pgvector extension ─────────────────────────────────────────────────
create extension if not exists vector;

-- ── documents ─────────────────────────────────────────────────────────────────
create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  source       text,
  device_type  text,
  brand        text,
  model        text,
  doc_type     text not null default 'manual',
  chunk_count  int not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── chunks ────────────────────────────────────────────────────────────────────
create table if not exists chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid references documents on delete cascade not null,
  content       text not null,
  embedding     vector(1024),
  page_number   int,
  chunk_index   int not null default 0,
  content_hash  text,
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);

create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── match_chunks RPC ──────────────────────────────────────────────────────────
create or replace function match_chunks(
  query_embedding  vector(1024),
  match_threshold  float,
  match_count      int,
  filter_brand     text default null,
  filter_model     text default null
)
returns table (
  id           uuid,
  document_id  uuid,
  content      text,
  page_number  int,
  metadata     jsonb,
  similarity   float,
  doc_title    text,
  doc_brand    text,
  doc_model    text,
  doc_type     text
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.content,
    c.page_number,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.title as doc_title,
    d.brand as doc_brand,
    d.model as doc_model,
    d.doc_type
  from chunks c
  join documents d on d.id = c.document_id
  where
    1 - (c.embedding <=> query_embedding) > match_threshold
    and (filter_brand is null or lower(d.brand) = lower(filter_brand))
    and (filter_model is null or lower(d.model) = lower(filter_model))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ── feedback ──────────────────────────────────────────────────────────────────
create table if not exists feedback (
  id               uuid primary key default gen_random_uuid(),
  message_id       uuid references messages(id) on delete set null,
  conversation_id  uuid references conversations(id) on delete cascade,
  user_id          uuid references auth.users on delete cascade,
  rating           int not null check (rating in (1, -1)),
  comment          text,
  created_at       timestamptz default now()
);

alter table feedback enable row level security;

create policy "Users can insert own feedback"
  on feedback for insert with check (auth.uid() = user_id);

create policy "Service role can read feedback"
  on feedback for select using (true);
