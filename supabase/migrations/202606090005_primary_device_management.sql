create or replace function public.approve_primary_device(target_device uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_restaurant uuid;
begin
  select restaurant_id into target_restaurant
  from public.restaurant_devices
  where id = target_device;

  if target_restaurant is null then
    raise exception 'Device not found';
  end if;

  update public.restaurant_devices
  set is_primary = false,
      retired_at = now(),
      lease_version = lease_version + 1
  where restaurant_id = target_restaurant
    and id <> target_device
    and is_primary = true;

  update public.restaurant_devices
  set status = 'approved',
      is_primary = true,
      approved_at = now(),
      blocked_at = null,
      retired_at = null,
      lease_version = lease_version + 1
  where id = target_device;
end;
$$;

create or replace function public.block_restaurant_device(target_device uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.restaurant_devices
  set status = 'blocked',
      is_primary = false,
      blocked_at = now(),
      lease_version = lease_version + 1
  where id = target_device;
$$;
