revoke all on function public.approve_primary_device(uuid) from public, anon, authenticated;
revoke all on function public.block_restaurant_device(uuid) from public, anon, authenticated;
revoke all on function public.bump_restaurant_config_revision() from public, anon, authenticated;

grant execute on function public.approve_primary_device(uuid) to service_role;
grant execute on function public.block_restaurant_device(uuid) to service_role;
