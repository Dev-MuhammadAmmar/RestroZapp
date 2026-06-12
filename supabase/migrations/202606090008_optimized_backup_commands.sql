alter table public.cloud_snapshots
  add column if not exists database_checksum text,
  add column if not exists status text not null default 'verified',
  add column if not exists verified_at timestamptz;

update public.cloud_snapshots
set database_checksum = coalesce(database_checksum, checksum_sha256),
    status = 'verified',
    verified_at = coalesce(verified_at, created_at);

alter table public.cloud_snapshots
  alter column database_checksum set not null;

alter table public.cloud_snapshots
  drop constraint if exists cloud_snapshots_snapshot_type_check;

update public.cloud_snapshots
set snapshot_type = case
  when snapshot_type = 'daily' then 'weekly'
  when snapshot_type = 'threshold' then 'manual'
  else snapshot_type
end;

alter table public.cloud_snapshots
  add constraint cloud_snapshots_snapshot_type_check
  check (snapshot_type in ('manual', 'weekly', 'monthly'));

alter table public.cloud_snapshots
  drop constraint if exists cloud_snapshots_status_check;

alter table public.cloud_snapshots
  add constraint cloud_snapshots_status_check
  check (status in ('verified', 'failed'));

create index if not exists idx_cloud_snapshots_checksum
  on public.cloud_snapshots(restaurant_id, database_checksum, created_at desc);

create table if not exists public.restaurant_data_commands (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  restaurant_code text not null,
  action text not null check (action in ('push_backup', 'restore_latest')),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  requested_by uuid,
  requested_by_email text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  device_id text,
  result_message text,
  error text
);

create index if not exists idx_data_commands_pending
  on public.restaurant_data_commands(restaurant_id, status, requested_at);

alter table public.restaurant_data_commands enable row level security;
