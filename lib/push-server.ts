import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

let configured = false

function configure() {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function sendPushForNotification(notificationId: string) {
  if (!configure()) {
    return { sent: 0, removed: 0, skipped: true, error: "Web Push用VAPID環境変数が未設定です" }
  }

  const db = admin()
  const { data: notification, error: notificationError } = await db
    .from("notifications")
    .select("id,title,body,link_url,category,priority")
    .eq("id", notificationId)
    .maybeSingle()

  if (notificationError) throw new Error(`通知取得失敗: ${notificationError.message}`)
  if (!notification) return { sent: 0, removed: 0, skipped: true }

  const { data: subscriptions, error: subscriptionError } = await db
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")

  if (subscriptionError) throw new Error(`Push購読取得失敗: ${subscriptionError.message}`)

  const userIds = [...new Set((subscriptions || []).map((sub: any) => sub.user_id))]
  const enabledByUser = new Map<string, boolean>()
  if (userIds.length) {
    const { data: preferences, error: preferenceError } = await db
      .from("notification_preferences")
      .select("user_id,category,enabled")
      .in("user_id", userIds)
      .eq("category", notification.category)
    if (preferenceError) throw new Error(`通知設定取得失敗: ${preferenceError.message}`)
    for (const row of preferences || []) enabledByUser.set(row.user_id, row.enabled !== false)
  }

  const categoryLabels: Record<string, string> = {
    info: "一般のお知らせ",
    mcs: "MCS",
    event: "イベント",
    live: "LIVE / 配信",
    maintenance: "メンテナンス",
    important: "重要なお知らせ",
    youtube: "YouTube新着",
    test: "テスト通知",
  }

  const payload = JSON.stringify({
    // Service Worker側でも変更可能な形にしておき、将来サイト名を変更しても対応しやすくする。
    siteName: "MCS・Ilia.",
    title: notification.title,
    body: notification.body || "",
    url: notification.link_url || "/notifications",
    category: notification.category,
    categoryLabel: categoryLabels[notification.category] || notification.category,
    priority: notification.priority,
    notificationId: notification.id,
    icon: "/site-notification-icon.png",
    badge: "/site-notification-icon.png",
  })

  let sent = 0
  let removed = 0

  for (const sub of (subscriptions || []) as PushSubscriptionRow[]) {
    // 設定が存在しない利用者は従来どおりON扱いにする。
    // 「test」は管理者の動作確認用なので常に送信する。
    if (notification.category !== "test" && enabledByUser.has(sub.user_id) && enabledByUser.get(sub.user_id) === false) {
      continue
    }
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        { TTL: 60 * 60 * 24 },
      )
      sent++
    } catch (error: any) {
      const status = Number(error?.statusCode || 0)
      if (status === 404 || status === 410) {
        await db.from("push_subscriptions").delete().eq("id", sub.id)
        removed++
      } else {
        console.error("Web Push送信失敗:", status, error?.message || error)
      }
    }
  }

  return { sent, removed, skipped: false }
}
