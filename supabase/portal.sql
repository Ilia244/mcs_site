-- Ilia./衣李亜 Official Portal / MCS portal schema
-- Execute this file in Supabase SQL Editor after the existing site schema.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings for select using (true);
drop policy if exists "no direct public writes" on public.site_settings;
create policy "no direct public writes" on public.site_settings for insert with check (false);
drop policy if exists "no direct public updates" on public.site_settings;
create policy "no direct public updates" on public.site_settings for update using (false);
drop policy if exists "no direct public deletes" on public.site_settings;
create policy "no direct public deletes" on public.site_settings for delete using (false);

create table if not exists public.tags (
 id uuid primary key default gen_random_uuid(), name text unique not null, slug text unique not null, color text not null default '#22d3ee', icon text not null default '🏷️', created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags for select using (true);
drop policy if exists "admin manage tags" on public.tags;
create policy "admin manage tags" on public.tags for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(), title text not null, content text not null, type text not null default 'info', status text not null default 'draft', source text not null default 'manual', priority text not null default 'normal', link_url text, thumbnail_url text, youtube_item_id text unique, legacy_news_id uuid, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Keep compatibility when this SQL is applied to an already-created posts table.
alter table public.posts add column if not exists legacy_news_id uuid;

-- If an older schema created legacy_news_id as text, convert it to UUID before
-- any comparison with news.id (which is UUID). Invalid old values become NULL.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='posts'
      and column_name='legacy_news_id'
      and data_type='text'
  ) then
    alter table public.posts
      alter column legacy_news_id type uuid
      using case
        when legacy_news_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then legacy_news_id::uuid
        else null
      end;
  end if;
end $$;

create unique index if not exists posts_legacy_news_id_key
  on public.posts(legacy_news_id)
  where legacy_news_id is not null;
alter table public.posts enable row level security;
drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts for select using (status='published');
drop policy if exists "admin manage posts" on public.posts;
create policy "admin manage posts" on public.posts for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

create table if not exists public.post_tags (
 post_id uuid not null references public.posts(id) on delete cascade, tag_id uuid not null references public.tags(id) on delete cascade, primary key(post_id,tag_id)
);
alter table public.post_tags enable row level security;
drop policy if exists "public read post tags" on public.post_tags;
create policy "public read post tags" on public.post_tags for select using (exists(select 1 from public.posts p where p.id=post_id and p.status='published'));
drop policy if exists "admin manage post tags" on public.post_tags;
create policy "admin manage post tags" on public.post_tags for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

create table if not exists public.post_presets (
 id uuid primary key default gen_random_uuid(), name text unique not null, type text not null default 'info', title_template text not null default '', content_template text not null default '', link_url text, default_tag_slugs text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.post_presets enable row level security;
drop policy if exists "admin manage post presets" on public.post_presets;
create policy "admin manage post presets" on public.post_presets for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(), post_id uuid references public.posts(id) on delete set null, category text not null default 'info', priority text not null default 'normal', title text not null, body text, link_url text, expires_at timestamptz, created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "public read active notifications" on public.notifications;
create policy "public read active notifications" on public.notifications for select using (expires_at is null or expires_at > now());
drop policy if exists "admin manage notifications" on public.notifications;
create policy "admin manage notifications" on public.notifications for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

create table if not exists public.user_notifications (
 user_id uuid not null references auth.users(id) on delete cascade, notification_id uuid not null references public.notifications(id) on delete cascade, read_at timestamptz, created_at timestamptz not null default now(), primary key(user_id,notification_id)
);
alter table public.user_notifications enable row level security;
drop policy if exists "users manage own notification state" on public.user_notifications;
create policy "users manage own notification state" on public.user_notifications for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create table if not exists public.youtube_channels (
 id uuid primary key default gen_random_uuid(), channel_id text unique, handle text, display_name text not null, channel_url text not null, channel_role text not null default 'staff', enabled boolean not null default true, show_home boolean not null default true, show_mcs boolean not null default true, show_live boolean not null default true, show_videos boolean not null default true, auto_post boolean not null default true, auto_notify boolean not null default true, auto_post_mode text not null default 'published', avatar_url text, description text, sort_order integer not null default 100, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.youtube_channels enable row level security;
drop policy if exists "public read enabled youtube channels" on public.youtube_channels;
create policy "public read enabled youtube channels" on public.youtube_channels for select using (enabled=true);
drop policy if exists "admin manage youtube channels" on public.youtube_channels;
create policy "admin manage youtube channels" on public.youtube_channels for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

create table if not exists public.youtube_items (
 id uuid primary key default gen_random_uuid(), channel_id uuid not null references public.youtube_channels(id) on delete cascade, video_id text unique not null, kind text not null default 'video', is_live boolean not null default false, title text not null, thumbnail_url text, published_at timestamptz, started_at timestamptz, viewer_count integer, channel_name text not null, channel_role text not null default 'staff', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.youtube_items enable row level security;
drop policy if exists "public read youtube items" on public.youtube_items;
create policy "public read youtube items" on public.youtube_items for select using (exists(select 1 from public.youtube_channels c where c.id=channel_id and c.enabled=true));
drop policy if exists "admin manage youtube items" on public.youtube_items;
create policy "admin manage youtube items" on public.youtube_items for all to authenticated using ((select role from public.profiles where id=auth.uid()) in ('owner','admin')) with check ((select role from public.profiles where id=auth.uid()) in ('owner','admin'));

insert into public.tags(name,slug,color,icon) values
 ('MCS','mcs','#22d3ee','🎮'),('EVENT','event','#c084fc','🎉'),('LIVE','live','#fb7185','🔴'),('MAINTENANCE','maintenance','#fb923c','🔧'),('IMPORTANT','important','#ef4444','🚨'),('YOUTUBE','youtube','#f87171','▶️'),('STAFF','staff','#a78bfa','👤'),('NEW SERVER','new-server','#34d399','🆕'),('参加募集','join','#60a5fa','🙋')
on conflict(slug) do nothing;

insert into public.post_presets(name,type,title_template,content_template,link_url,default_tag_slugs) values
 ('新サーバー開放','mcs','新しいMCSサーバーを開放しました！','新しいMinecraftサーバー「{SERVER_NAME}」を開放しました。

ぜひ参加してください！','/minecraft/join',array['mcs','new-server']),
 ('イベント開催','event','【イベント】{EVENT_NAME}','{EVENT_NAME}を開催します！

開催日時：{DATE}

参加方法：{HOW_TO_JOIN}','/events',array['event','join']),
 ('メンテナンス','maintenance','MCSメンテナンスのお知らせ','以下の日程でメンテナンスを実施します。

日時：{DATE}
対象：{SERVER}
影響：{IMPACT}','/minecraft',array['maintenance']),
 ('配信告知','live','🔴 {CHANNEL_NAME} 配信のお知らせ','{CHANNEL_NAME}が配信を開始します！

配信タイトル：{TITLE}

ぜひご覧ください。','',array['live']),
 ('重要なお知らせ','important','重要なお知らせ','{MESSAGE}','/',array['important'])
on conflict(name) do nothing;

-- Existing legacy news is copied once into the new post system.
insert into public.posts(title,content,type,status,source,legacy_news_id,created_at,updated_at,published_at)
select n.title,n.content,'info',case when n.is_published then 'published' else 'draft' end,'legacy_news',n.id,n.created_at,n.created_at,case when n.is_published then n.created_at else null end from public.news n
where not exists(select 1 from public.posts p where p.legacy_news_id=n.id);

insert into public.site_settings(key,value) values
 ('portal_brand','Ilia./衣李亜'),('portal_subtitle','Official Portal'),('stream_participation_enabled','true') on conflict(key) do nothing;

-- Admin authorization helper for future server-side calls.
create or replace function public.is_portal_admin()
returns boolean language sql stable security invoker as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('owner','admin'));
$$;
revoke all on function public.is_portal_admin() from public;
grant execute on function public.is_portal_admin() to authenticated;


-- Web Push subscriptions. The endpoint is unique per browser/device subscription.
create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text unique not null,
 p256dh text not null,
 auth text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "users read own push subscriptions" on public.push_subscriptions;
create policy "users read own push subscriptions" on public.push_subscriptions
  for select to authenticated using (user_id=auth.uid());
drop policy if exists "users insert own push subscriptions" on public.push_subscriptions;
create policy "users insert own push subscriptions" on public.push_subscriptions
  for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "users update own push subscriptions" on public.push_subscriptions;
create policy "users update own push subscriptions" on public.push_subscriptions
  for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "users delete own push subscriptions" on public.push_subscriptions;
create policy "users delete own push subscriptions" on public.push_subscriptions
  for delete to authenticated using (user_id=auth.uid());
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

-- Per-user Web Push notification type preferences.
create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(user_id, category)
);
alter table public.notification_preferences enable row level security;
drop policy if exists "users manage own notification preferences" on public.notification_preferences;
create policy "users manage own notification preferences" on public.notification_preferences
  for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Deleting an announcement also removes its notification and read-state rows.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_schema='public'
      and table_name='notifications'
      and constraint_name='notifications_post_id_fkey'
  ) then
    alter table public.notifications drop constraint notifications_post_id_fkey;
  end if;
  alter table public.notifications
    add constraint notifications_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade;
exception when duplicate_object then null;
end $$;
