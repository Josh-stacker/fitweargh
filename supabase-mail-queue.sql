create table if not exists public.mail_queue (
  id uuid primary key default gen_random_uuid(),
  "to" text not null,
  subject text not null,
  html text not null,
  status text not null default 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.mail_queue
  add column if not exists status text not null default 'pending',
  add column if not exists error text,
  add column if not exists sent_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create index if not exists mail_queue_status_created_at_idx
  on public.mail_queue (status, created_at);

alter table public.mail_queue enable row level security;

drop policy if exists "Users can queue email" on public.mail_queue;
create policy "Users can queue email"
  on public.mail_queue
  for insert
  to authenticated, anon
  with check (true);
