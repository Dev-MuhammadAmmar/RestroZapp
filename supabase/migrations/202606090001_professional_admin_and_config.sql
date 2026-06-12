alter table public.restaurant_configs
  add column if not exists locked_setting_keys text[] not null default '{}';

alter table public.app_versions
  add column if not exists status text not null default 'published'
  check (status in ('draft', 'published'));

create table if not exists public.owner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'Owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_email text,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  restaurant_code text not null default '',
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_created
  on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_restaurant
  on public.admin_audit_logs(restaurant_id, created_at desc);

alter table public.owner_profiles enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "owners can read own profile"
on public.owner_profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "owners can read audit logs"
on public.admin_audit_logs for select
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner'
);

comment on column public.restaurant_configs.settings is
  'Operational POS defaults distributed to approved restaurant devices.';
comment on column public.restaurant_configs.locked_setting_keys is
  'Settings that are owner-managed and read-only in the Electron POS.';
