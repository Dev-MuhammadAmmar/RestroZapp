revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;

drop policy if exists "owners can read own profile" on public.owner_profiles;
create policy "owners can read own profile"
on public.owner_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "owners can read audit logs" on public.admin_audit_logs;
create policy "owners can read audit logs"
on public.admin_audit_logs for select
to authenticated
using (
  coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'owner'
);

create index if not exists idx_admin_audit_owner_user
  on public.admin_audit_logs(owner_user_id);
