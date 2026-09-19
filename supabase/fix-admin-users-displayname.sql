-- Fix admin user list: preserve the camelCase displayName field in the RPC result.
-- PostgreSQL folds unquoted identifiers in RETURNS TABLE to lowercase.
-- Run this file after the main roles-and-command-visibility.sql.
-- This drops only the v3 read RPCs introduced for the admin user list.

drop function if exists public.admin_get_profiles_paginated_v3(integer, integer, text, text);
drop function if exists public.admin_get_profiles_count_v3();

create or replace function public.admin_get_profiles_paginated_v3(
  page_number integer,
  page_size integer,
  sort_column text default 'created_at',
  sort_direction text default 'desc'
)
returns table (
  id uuid,
  "displayName" text,
  role text,
  is_admin boolean,
  created_at timestamptz,
  email text,
  minecraft_id text,
  minecraft_uuid text,
  minecraft_last_checked timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  offset_rows integer;
begin
  select p.role into actor_role
  from public.profiles p
  where p.id = auth.uid();

  if actor_role not in ('owner','admin') then
    raise exception '権限がありません';
  end if;

  offset_rows := greatest(page_number - 1, 0) * least(greatest(page_size, 1), 100);

  return query
    select
      p.id,
      p."displayName",
      p.role,
      p.is_admin,
      p.created_at,
      au.email::text,
      p.minecraft_id,
      p.minecraft_uuid,
      p.minecraft_last_checked
    from public.profiles p
    left join auth.users au on au.id = p.id
    order by
      case when sort_column='displayName' and lower(sort_direction)='asc' then p."displayName" end asc,
      case when sort_column='displayName' and lower(sort_direction)<>'asc' then p."displayName" end desc,
      case when sort_column='created_at' and lower(sort_direction)='asc' then p.created_at end asc,
      case when sort_column='created_at' and lower(sort_direction)<>'asc' then p.created_at end desc,
      p.created_at desc
    offset offset_rows
    limit least(greatest(page_size, 1), 100);
end;
$$;

revoke all on function public.admin_get_profiles_paginated_v3(integer, integer, text, text) from public;
grant execute on function public.admin_get_profiles_paginated_v3(integer, integer, text, text) to authenticated;

create or replace function public.admin_get_profiles_count_v3()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  result_count integer;
begin
  select p.role into actor_role
  from public.profiles p
  where p.id = auth.uid();

  if actor_role not in ('owner','admin') then
    raise exception '権限がありません';
  end if;

  select count(*)::integer into result_count
  from public.profiles;

  return result_count;
end;
$$;

revoke all on function public.admin_get_profiles_count_v3() from public;
grant execute on function public.admin_get_profiles_count_v3() to authenticated;
