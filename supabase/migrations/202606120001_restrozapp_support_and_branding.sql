create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  requester_name text not null,
  requester_email text not null,
  restaurant_code text not null default '',
  category text not null check (category in ('support', 'activation', 'backup', 'printing', 'feedback')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  owner_note text not null default '',
  source_ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets(status, created_at desc);
create index if not exists support_tickets_restaurant_code_idx
  on public.support_tickets(restaurant_code) where restaurant_code <> '';

alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-assets',
  'restaurant-assets',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
