create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  restaurant_code text not null unique,
  name text not null,
  address text not null default '',
  phone1 text not null default '',
  phone2 text not null default '',
  status text not null default 'active' check (status in ('active', 'suspended', 'trial')),
  plan text not null default 'standard',
  backup_enabled boolean not null default true,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_activation_secrets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  secret_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.restaurant_configs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  receipt_footer text not null default 'Thank You for Dining with Us!',
  backup_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_devices (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  device_id text not null,
  device_token_hash text,
  computer_name text not null,
  os text not null,
  app_version text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'blocked')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  blocked_at timestamptz,
  last_seen_at timestamptz,
  unique (restaurant_id, device_id)
);

create table if not exists public.activation_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  restaurant_code text not null,
  device_id text,
  event_type text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  device_id text not null,
  restaurant_code text not null,
  type text not null check (type in ('manual', 'daily', 'weekly', 'monthly', 'emergency')),
  status text not null check (status in ('local_only', 'pending_upload', 'uploaded', 'failed')),
  file_name text not null,
  storage_path text,
  size_bytes bigint not null default 0,
  app_version text,
  error text,
  created_at timestamptz not null default now(),
  uploaded_at timestamptz
);

create table if not exists public.app_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  download_url text,
  notes text,
  required boolean not null default false,
  is_latest boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurants_code on public.restaurants(restaurant_code);
create index if not exists idx_devices_status on public.restaurant_devices(status);
create index if not exists idx_backups_restaurant_created on public.backup_logs(restaurant_code, created_at desc);

alter table public.restaurants enable row level security;
alter table public.restaurant_activation_secrets enable row level security;
alter table public.restaurant_configs enable row level security;
alter table public.restaurant_devices enable row level security;
alter table public.activation_events enable row level security;
alter table public.backup_logs enable row level security;
alter table public.app_versions enable row level security;

insert into storage.buckets (id, name, public)
values ('restaurant-backups', 'restaurant-backups', false)
on conflict (id) do nothing;
