update storage.buckets
set file_size_limit = 536870912,
    allowed_mime_types = array['application/zip']::text[]
where id = 'restaurant-backups';

create index if not exists idx_activation_secrets_restaurant_active
  on public.restaurant_activation_secrets(restaurant_id, is_active, created_at desc);
create index if not exists idx_devices_restaurant_status
  on public.restaurant_devices(restaurant_id, status);
create index if not exists idx_backup_logs_restaurant_id_created
  on public.backup_logs(restaurant_id, created_at desc);
create index if not exists idx_activation_events_restaurant_created
  on public.activation_events(restaurant_id, created_at desc);
create unique index if not exists idx_app_versions_single_latest_published
  on public.app_versions(is_latest)
  where is_latest = true and status = 'published';
