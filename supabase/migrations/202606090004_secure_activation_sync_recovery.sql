create table if not exists public.device_signing_keys (
  id text primary key check (id = 'primary'),
  private_jwk jsonb not null,
  public_jwk jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.device_signing_keys enable row level security;

alter table public.restaurant_configs
  add column if not exists config_revision bigint not null default 1;

alter table public.restaurant_devices
  add column if not exists is_primary boolean not null default false,
  add column if not exists lease_version bigint not null default 1,
  add column if not exists retired_at timestamptz;

create unique index if not exists idx_one_primary_device_per_restaurant
  on public.restaurant_devices(restaurant_id)
  where is_primary = true and status = 'approved';

create table if not exists public.restaurant_sync_events (
  sequence bigint generated always as identity primary key,
  event_id uuid not null unique,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  restaurant_code text not null,
  device_id text not null,
  entity text not null,
  entity_id text not null,
  operation text not null check (operation in ('upsert', 'delete')),
  payload jsonb,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists idx_sync_events_restaurant_sequence
  on public.restaurant_sync_events(restaurant_id, sequence);

create table if not exists public.restaurant_sync_checkpoints (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  device_id text not null,
  last_pushed_sequence bigint not null default 0,
  last_pulled_sequence bigint not null default 0,
  last_synced_at timestamptz,
  primary key (restaurant_id, device_id)
);

create table if not exists public.cloud_snapshots (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  restaurant_code text not null,
  device_id text not null,
  storage_path text not null unique,
  file_name text not null,
  size_bytes bigint not null,
  checksum_sha256 text not null,
  sync_sequence bigint not null default 0,
  schema_version integer not null default 0,
  snapshot_type text not null check (snapshot_type in ('manual', 'daily', 'threshold')),
  created_at timestamptz not null default now()
);

create index if not exists idx_cloud_snapshots_restaurant_created
  on public.cloud_snapshots(restaurant_id, created_at desc);

alter table public.restaurant_sync_events enable row level security;
alter table public.restaurant_sync_checkpoints enable row level security;
alter table public.cloud_snapshots enable row level security;

create or replace function public.bump_restaurant_config_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.config_revision := coalesce(old.config_revision, 0) + 1;
  return new;
end;
$$;

drop trigger if exists restaurant_config_revision_trigger on public.restaurant_configs;
create trigger restaurant_config_revision_trigger
before update on public.restaurant_configs
for each row execute function public.bump_restaurant_config_revision();
