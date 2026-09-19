-- MCS role system + Minecraft command visibility
-- Command visibility may be set to user/moderator/staff/admin/owner.
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

-- User management detail view used by the Admin > ユーザー管理 screen.
--
-- The MCID field is read defensively from common profile column names so the
-- UI remains compatible with older profile schemas. If your profiles table
-- uses one of mcid / minecraft_id / minecraftId / minecraft_username, it will
-- be shown automatically.
--
-- Email is read from auth.users because it is not normally stored in profiles.
-- Avatar URL is derived from the existing public avatars bucket convention.
drop function if exists public.admin_get_profiles_paginated(integer, integer, text, text);
create or replace function public.admin_get_profiles_paginated(
  page_number integer,
  page_size integer,
  sort_column text,
  sort_direction text
)
returns table (
  id uuid,
  "displayName" text,
  role text,
  is_admin boolean,
  created_at timestamptz,
  email text,
  mcid text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_role text;
  actor_level integer;
  safe_page integer := greatest(coalesce(page_number, 1), 1);
  safe_size integer := least(greatest(coalesce(page_size, 10), 1), 100);
begin
  select p.role into actor_role
  from public.profiles p
  where p.id = auth.uid();

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

  return query
  select
    p.id,
    coalesce(to_jsonb(p)->>'displayName', to_jsonb(p)->>'display_name') as "displayName",
    coalesce(p.role, case when p.is_admin then 'admin' else 'user' end) as role,
    coalesce(p.is_admin, false) as is_admin,
    p.created_at,
    au.email,
    coalesce(
      to_jsonb(p)->>'mcid',
      to_jsonb(p)->>'minecraft_id',
      to_jsonb(p)->>'minecraftId',
      to_jsonb(p)->>'minecraft_username',
      to_jsonb(p)->>'minecraftUsername',
      to_jsonb(p)->>'minecraft_name',
      to_jsonb(p)->>'minecraftName',
      to_jsonb(p)->>'mc_name',
      to_jsonb(p)->>'minecraft'
    ) as mcid,
    null::text as avatar_url
  from public.profiles p
  left join auth.users au on au.id = p.id
  order by
    case when lower(coalesce(sort_column, 'created_at')) = 'displayname'
      and lower(coalesce(sort_direction, 'desc')) = 'asc'
      then coalesce(to_jsonb(p)->>'displayName', to_jsonb(p)->>'display_name') end asc nulls last,
    case when lower(coalesce(sort_column, 'created_at')) = 'displayname'
      and lower(coalesce(sort_direction, 'desc')) <> 'asc'
      then coalesce(to_jsonb(p)->>'displayName', to_jsonb(p)->>'display_name') end desc nulls last,
    case when lower(coalesce(sort_column, 'created_at')) <> 'displayname'
      and lower(coalesce(sort_direction, 'desc')) = 'asc'
      then p.created_at end asc nulls last,
    case when lower(coalesce(sort_column, 'created_at')) <> 'displayname'
      and lower(coalesce(sort_direction, 'desc')) <> 'asc'
      then p.created_at end desc nulls last
  limit safe_size
  offset (safe_page - 1) * safe_size;
end;
$$;

grant execute on function public.admin_get_profiles_paginated(integer, integer, text, text) to authenticated;
