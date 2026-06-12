alter table public.cloud_snapshots
  add column if not exists checksum_kind text not null default 'file_sha256';

alter table public.cloud_snapshots
  drop constraint if exists cloud_snapshots_checksum_kind_check;

alter table public.cloud_snapshots
  add constraint cloud_snapshots_checksum_kind_check
  check (checksum_kind in ('file_sha256', 'logical_v1', 'recovery_v1'));

create index if not exists idx_cloud_snapshots_logical_checksum
  on public.cloud_snapshots(restaurant_id, checksum_kind, database_checksum, created_at desc);

create unique index if not exists idx_one_active_data_command_per_action
  on public.restaurant_data_commands(restaurant_id, action)
  where status in ('pending', 'running');
