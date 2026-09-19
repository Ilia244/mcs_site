-- MCS role system + Minecraft command visibility
-- Run this in Supabase SQL Editor.
-- Existing profiles.role values are preserved.

-- Supported roles:
-- owner      100  オーナー
-- admin       80  管理者
-- staff       60  スタッフ
-- moderator   40  モデレーター
-- user        10  一般ユーザー

-- Keep the role-change RPC compatible with the site's user management UI.
create or replace function public.admin_update_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  actor_level integer;
  target_role text;
  target_level integer;
begin
  select role into actor_role
  from public.profiles
  where id = auth.uid();

  actor_level := case actor_role
    when 'owner' then 100
    when 'admin' then 80
    when 'staff' then 60
    when 'moderator' then 40
    when 'user' then 10
    else 0
  end;

  if actor_level < 80 then
    raise exception '権限がありません';
  end if;

  if new_role not in ('owner','admin','staff','moderator','user') then
    raise exception '無効なロールです';
  end if;

  select role into target_role
  from public.profiles
  where id = target_id;

  if target_role is null then
    raise exception '対象ユーザーが見つかりません';
  end if;

  target_level := case target_role
    when 'owner' then 100
    when 'admin' then 80
    when 'staff' then 60
    when 'moderator' then 40
    when 'user' then 10
    else 0
  end;

  if target_id = auth.uid() then
    raise exception '自分自身のロールは変更できません';
  end if;

  if target_level >= actor_level then
    raise exception '自分以上の権限を変更することはできません';
  end if;

  -- Only an owner may create/change an owner account.
  if new_role = 'owner' and actor_role <> 'owner' then
    raise exception 'ownerロールはownerのみ設定できます';
  end if;

  update public.profiles
  set role = new_role,
      is_admin = (new_role in ('owner','admin'))
  where id = target_id;
end;
$$;

grant execute on function public.admin_update_role(uuid, text) to authenticated;

-- Optional helper for future UI/API use.
create or replace function public.get_role_level(role_name text)
returns integer
language sql
immutable
as $$
  select case role_name
    when 'owner' then 100
    when 'admin' then 80
    when 'staff' then 60
    when 'moderator' then 40
    when 'user' then 10
    else 0
  end;
$$;


-- Minecraft account linking + admin user directory v2
alter table public.profiles add column if not exists minecraft_id text;
alter table public.profiles add column if not exists minecraft_uuid text;
alter table public.profiles add column if not exists minecraft_last_checked timestamptz;
create unique index if not exists profiles_minecraft_uuid_unique_idx on public.profiles(minecraft_uuid) where minecraft_uuid is not null;

-- Returns admin-visible profile data, including the Auth email and Minecraft link.
create or replace function public.admin_get_profiles_paginated_v3(page_number integer, page_size integer, sort_column text default 'created_at', sort_direction text default 'desc')
returns table (
  id uuid,
  displayName text,
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
  select p.role into actor_role from public.profiles p where p.id = auth.uid();
  if actor_role not in ('owner','admin') then raise exception '権限がありません'; end if;
  offset_rows := greatest(page_number - 1, 0) * least(greatest(page_size, 1), 100);
  return query
    select p.id, p."displayName", p.role, p.is_admin, p.created_at, au.email::text, p.minecraft_id, p.minecraft_uuid, p.minecraft_last_checked
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
revoke all on function public.admin_get_profiles_paginated_v3(integer,integer,text,text) from public;
grant execute on function public.admin_get_profiles_paginated_v3(integer,integer,text,text) to authenticated;

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
  select p.role into actor_role from public.profiles p where p.id = auth.uid();
  if actor_role not in ('owner','admin') then raise exception '権限がありません'; end if;
  select count(*)::integer into result_count from public.profiles;
  return result_count;
end;
$$;
revoke all on function public.admin_get_profiles_count_v3() from public;
grant execute on function public.admin_get_profiles_count_v3() to authenticated;
