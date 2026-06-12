drop index if exists public.idx_one_primary_device_per_restaurant;

update public.restaurant_devices
set is_primary = false,
    retired_at = null
where is_primary = true
   or retired_at is not null;

create or replace function public.approve_restaurant_device(target_device uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.restaurant_devices
    where id = target_device
  ) then
    raise exception 'Device not found';
  end if;

  update public.restaurant_devices
  set status = 'approved',
      is_primary = false,
      approved_at = now(),
      blocked_at = null,
      retired_at = null,
      lease_version = lease_version + 1
  where id = target_device;
end;
$$;

-- Keep the old function harmless for older admin deployments during rollout.
create or replace function public.approve_primary_device(target_device uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.approve_restaurant_device(target_device);
$$;

revoke all on function public.approve_restaurant_device(uuid) from public, anon, authenticated;
revoke all on function public.approve_primary_device(uuid) from public, anon, authenticated;
grant execute on function public.approve_restaurant_device(uuid) to service_role;
grant execute on function public.approve_primary_device(uuid) to service_role;
