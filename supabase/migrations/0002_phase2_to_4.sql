-- Transcripts (Phase 2)
create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  meeting_title text not null,
  meeting_date date not null,
  raw_text text not null,
  parsed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.transcripts enable row level security;

create policy "Users can view their own transcripts"
  on public.transcripts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transcripts"
  on public.transcripts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transcripts"
  on public.transcripts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transcripts"
  on public.transcripts for delete
  using (auth.uid() = user_id);

alter table public.tasks
  add constraint tasks_source_transcript_id_fkey
  foreign key (source_transcript_id) references public.transcripts(id) on delete set null;

-- Knowledge base (Phase 3)
create table public.kb_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  source_type text not null default 'manual' check (source_type in ('manual', 'transcript', 'slack_paste')),
  source_ref text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);

alter table public.kb_entries enable row level security;

create policy "Users can view their own kb entries"
  on public.kb_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own kb entries"
  on public.kb_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own kb entries"
  on public.kb_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own kb entries"
  on public.kb_entries for delete
  using (auth.uid() = user_id);

create index kb_entries_search_idx on public.kb_entries using gin (search_vector);
create index kb_entries_tags_idx on public.kb_entries using gin (tags);

-- HubSpot metrics (Phase 4)
create table public.metrics_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  label text not null,
  query jsonb not null,
  display_type text not null check (display_type in ('currency', 'count', 'number')),
  hubspot_link text,
  position integer not null default 0,
  unique (user_id, key)
);

alter table public.metrics_config enable row level security;

create policy "Users can view their own metrics config"
  on public.metrics_config for select
  using (auth.uid() = user_id);

create policy "Users can insert their own metrics config"
  on public.metrics_config for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own metrics config"
  on public.metrics_config for update
  using (auth.uid() = user_id);

create policy "Users can delete their own metrics config"
  on public.metrics_config for delete
  using (auth.uid() = user_id);

create table public.metrics_cache (
  metric_key text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  value jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (user_id, metric_key)
);

alter table public.metrics_cache enable row level security;

create policy "Users can view their own metrics cache"
  on public.metrics_cache for select
  using (auth.uid() = user_id);

create policy "Users can insert their own metrics cache"
  on public.metrics_cache for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own metrics cache"
  on public.metrics_cache for update
  using (auth.uid() = user_id);
