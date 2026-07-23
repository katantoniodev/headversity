create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_type text not null check (parent_type in ('task', 'kb_entry')),
  parent_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Users can view their own comments"
  on public.comments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

create index comments_parent_idx on public.comments (parent_type, parent_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_type text not null check (parent_type in ('task', 'kb_entry')),
  parent_id uuid not null,
  file_name text not null,
  storage_path text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.attachments enable row level security;

create policy "Users can view their own attachments"
  on public.attachments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own attachments"
  on public.attachments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own attachments"
  on public.attachments for delete
  using (auth.uid() = user_id);

create index attachments_parent_idx on public.attachments (parent_type, parent_id);

-- Storage bucket for attachment files. Private; access is via RLS-scoped
-- signed URLs, not the public bucket flag.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "Users can upload their own attachment files"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own attachment files"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own attachment files"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
