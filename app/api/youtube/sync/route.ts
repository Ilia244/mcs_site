import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendPushForNotification } from "@/lib/push-server"

export const runtime = "nodejs"
export const maxDuration = 60

const withTimeout = <T>(promise: PromiseLike<T>, ms = 10000, message = "処理がタイムアウトしました"): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function authorized(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true
  if (!auth?.startsWith("Bearer ")) return false
  const token = auth.slice(7)
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: { user }, error } = await withTimeout(client.auth.getUser(token), 8000)
  if (error || !user) return false
  const { data: profile, error: profileError } = await withTimeout(admin()
    .from("profiles").select("role,is_admin").eq("id", user.id).maybeSingle(), 8000)
  if (profileError) throw new Error(`プロフィール確認失敗: ${profileError.message}`)
  return profile?.role === "owner" || profile?.role === "admin" || profile?.is_admin === true
}

async function youtubeJson(url: URL) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) })
  const json: any = await response.json().catch(() => ({}))
  if (!response.ok) {
    const reason = json?.error?.errors?.[0]?.reason || json?.error?.message || `HTTP ${response.status}`
    throw new Error(`YouTube API: ${reason}`)
  }
  if (json?.error) throw new Error(`YouTube API: ${json.error.message || "API error"}`)
  return json
}

async function sync(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase環境変数が不足しています" }, { status: 500 })
    }
    if (!await authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    if (!process.env.YOUTUBE_API_KEY) return NextResponse.json({ error: "YOUTUBE_API_KEY is not configured" }, { status: 500 })

    const db = admin()
    const { data: channels, error: channelError } = await withTimeout(db.from("youtube_channels").select("*").eq("enabled", true), 10000)
    if (channelError) return NextResponse.json({ error: `チャンネル取得失敗: ${channelError.message}` }, { status: 500 })

    let synced = 0
    const errors: string[] = []

    for (const ch of channels || []) {
      try {
        let channelId = ch.channel_id as string | null

        if (!channelId && ch.handle) {
          const u = new URL("https://www.googleapis.com/youtube/v3/channels")
          u.searchParams.set("part", "snippet,contentDetails")
          u.searchParams.set("forHandle", String(ch.handle).replace(/^@/, ""))
          u.searchParams.set("key", process.env.YOUTUBE_API_KEY)
          const j = await youtubeJson(u)
          const item = j.items?.[0]
          channelId = item?.id || null
          if (!channelId) throw new Error(`チャンネルを取得できませんでした: ${ch.handle}`)
          const { error } = await db.from("youtube_channels").update({
            channel_id: channelId,
            channel_url: `https://www.youtube.com/channel/${channelId}`,
            avatar_url: item?.snippet?.thumbnails?.high?.url || item?.snippet?.thumbnails?.default?.url || null,
            description: item?.snippet?.description || "",
            updated_at: new Date().toISOString(),
          }).eq("id", ch.id)
          if (error) throw new Error(`チャンネル情報更新失敗: ${error.message}`)
        }

        if (!channelId) throw new Error("チャンネルIDまたは有効なハンドルがありません")

        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
        searchUrl.searchParams.set("part", "snippet")
        searchUrl.searchParams.set("channelId", channelId)
        searchUrl.searchParams.set("order", "date")
        searchUrl.searchParams.set("maxResults", "10")
        searchUrl.searchParams.set("type", "video")
        searchUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY)
        const videos = await youtubeJson(searchUrl)

        for (const item of videos.items || []) {
          const vid = item.id?.videoId
          if (!vid) continue
          const row = {
            channel_id: ch.id,
            video_id: vid,
            kind: "video",
            is_live: false,
            title: item.snippet.title,
            thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || null,
            published_at: item.snippet.publishedAt || null,
            channel_name: ch.display_name,
            channel_role: ch.channel_role,
            updated_at: new Date().toISOString(),
          }
          const { data: existing, error: existingError } = await db.from("youtube_items").select("id").eq("video_id", vid).maybeSingle()
          if (existingError) throw new Error(`動画確認失敗: ${existingError.message}`)
          if (existing) {
            const { error } = await db.from("youtube_items").update(row).eq("id", existing.id)
            if (error) throw new Error(`動画更新失敗: ${error.message}`)
          } else {
            const { error } = await db.from("youtube_items").insert(row)
            if (error) throw new Error(`動画保存失敗: ${error.message}`)
            if (ch.auto_post) {
              const { data: post, error: postError } = await db.from("posts").insert({
                title: item.snippet.title,
                content: `${ch.display_name}から新しいYouTube動画が公開されました。`,
                type: "youtube",
                status: ch.auto_post_mode === "draft" ? "draft" : "published",
                source: "youtube",
                youtube_item_id: vid,
                link_url: `https://www.youtube.com/watch?v=${vid}`,
                thumbnail_url: row.thumbnail_url,
                published_at: ch.auto_post_mode === "draft" ? null : new Date().toISOString(),
              }).select("id").single()
              if (postError) throw new Error(`自動投稿作成失敗: ${postError.message}`)
              if (post && ch.auto_notify && ch.auto_post_mode !== "draft") {
                const { data: notification, error: notificationError } = await db.from("notifications").insert({
                  post_id: post.id, category: "youtube", priority: "normal",
                  title: `${ch.display_name}：新しい動画が公開されました`, body: item.snippet.title,
                  link_url: `/news/${post.id}`,
                }).select("id").single()
                if (notificationError) throw new Error(`自動通知作成失敗: ${notificationError.message}`)
                if (notification?.id) {
                  try { await sendPushForNotification(notification.id) } catch (pushError) { console.error("YouTube Web Push送信失敗:", pushError) }
                }
              }
            }
          }
          synced++
        }

        const liveUrl = new URL("https://www.googleapis.com/youtube/v3/search")
        liveUrl.searchParams.set("part", "snippet")
        liveUrl.searchParams.set("channelId", channelId)
        liveUrl.searchParams.set("eventType", "live")
        liveUrl.searchParams.set("type", "video")
        liveUrl.searchParams.set("maxResults", "10")
        liveUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY)
        const liveSearch = await youtubeJson(liveUrl)
        const liveIds = (liveSearch.items || []).map((x: any) => x.id?.videoId).filter(Boolean)

        const { error: clearLiveError } = await db.from("youtube_items").update({ is_live: false, updated_at: new Date().toISOString() }).eq("channel_id", ch.id).eq("kind", "live")
        if (clearLiveError) throw new Error(`LIVE状態更新失敗: ${clearLiveError.message}`)

        if (liveIds.length) {
          const detailUrl = new URL("https://www.googleapis.com/youtube/v3/videos")
          detailUrl.searchParams.set("part", "snippet,liveStreamingDetails")
          detailUrl.searchParams.set("id", liveIds.join(","))
          detailUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY)
          const details = await youtubeJson(detailUrl)
          for (const v of details.items || []) {
            const live = v.liveStreamingDetails
            const isLive = live?.concurrentViewers !== undefined && !!live?.actualStartTime && !live?.actualEndTime
            const row = {
              channel_id: ch.id, video_id: v.id, kind: "live", is_live: isLive,
              title: v.snippet.title,
              thumbnail_url: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url || null,
              published_at: v.snippet.publishedAt || null,
              started_at: live?.actualStartTime || live?.scheduledStartTime || null,
              viewer_count: live?.concurrentViewers ? Number(live.concurrentViewers) : null,
              channel_name: ch.display_name, channel_role: ch.channel_role,
              updated_at: new Date().toISOString(),
            }
            const { data: ex, error: exError } = await db.from("youtube_items").select("id,is_live").eq("video_id", v.id).maybeSingle()
            if (exError) throw new Error(`LIVE確認失敗: ${exError.message}`)
            if (ex) {
              const { error } = await db.from("youtube_items").update(row).eq("id", ex.id)
              if (error) throw new Error(`LIVE更新失敗: ${error.message}`)
            } else {
              const { error } = await db.from("youtube_items").insert(row)
              if (error) throw new Error(`LIVE保存失敗: ${error.message}`)
            }
            if (isLive && !ex?.is_live && ch.auto_notify) {
              const { data: liveNotification, error } = await db.from("notifications").insert({
                category: "live", priority: "normal", title: `${ch.display_name}が配信を開始しました`,
                body: v.snippet.title, link_url: `https://www.youtube.com/watch?v=${v.id}`,
              }).select("id").single()
              if (error) throw new Error(`LIVE通知作成失敗: ${error.message}`)
              if (liveNotification?.id) {
                try { await sendPushForNotification(liveNotification.id) } catch (pushError) { console.error("LIVE Web Push送信失敗:", pushError) }
              }
            }
          }
        }
      } catch (e: any) {
        errors.push(`${ch.display_name}: ${e?.message || "unknown error"}`)
      }
    }

    return NextResponse.json({ ok: errors.length === 0, synced, channels: channels?.length || 0, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) { return sync(req) }
export async function POST(req: NextRequest) { return sync(req) }
