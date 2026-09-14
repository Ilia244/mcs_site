-- IRyiaServer Portal: 参加型配信設定
-- Supabase SQL Editorで一度実行してください。

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings"
  on public.site_settings for select
  using (true);

-- 書き込みはRPCだけに限定します。
drop policy if exists "no direct public writes" on public.site_settings;
create policy "no direct public writes"
  on public.site_settings for insert
  with check (false);
drop policy if exists "no direct public updates" on public.site_settings;
create policy "no direct public updates"
  on public.site_settings for update
  using (false);
drop policy if exists "no direct public deletes" on public.site_settings;
create policy "no direct public deletes"
  on public.site_settings for delete
  using (false);

insert into public.site_settings(key, value) values
  ('stream_live', 'false'),
  ('stream_title', 'みんなでサバイバル！'),
  ('stream_description', '視聴者参加型Minecraft配信を開催中！'),
  ('stream_youtube_url', 'https://www.youtube.com/@YOUR_CHANNEL'),
  ('stream_participation_enabled', 'true')
on conflict (key) do nothing;

create or replace function public.admin_save_site_settings(settings text[][])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  item text[];
begin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role is null or caller_role not in ('owner','admin') then
    raise exception 'permission denied';
  end if;

  foreach item slice 1 in array settings loop
    if array_length(item, 1) >= 2 then
      insert into public.site_settings(key, value, updated_at)
      values (item[1], item[2], now())
      on conflict (key) do update
      set value = excluded.value, updated_at = now();
    end if;
  end loop;
end;
$$;

revoke all on function public.admin_save_site_settings(text[][]) from public;
grant execute on function public.admin_save_site_settings(text[][]) to authenticated;
