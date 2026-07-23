create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  detail text,
  status text not null default 'backlog' check (status in ('backlog', 'todo', 'in_progress', 'done')),
  priority text check (priority in ('low', 'med', 'high')),
  due_date date,
  position integer not null default 0,
  source_transcript_id uuid,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index tasks_user_status_position_idx on public.tasks (user_id, status, position);
