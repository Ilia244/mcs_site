const PUSH_SITE_NAME = "MCS・Ilia."
const PUSH_SITE_ICON = "/site-notification-icon.png"

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()))

self.addEventListener("push", event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch {}

  const rawTitle = data.title || "新しいお知らせ"
  // Windows/macOSなどで通知だけを見ても、サイト由来だとすぐ分かるように
  // サイト名を通知タイトルの先頭へ付ける。
  const title = data.siteName
    ? `${data.siteName} | ${rawTitle}`
    : `${PUSH_SITE_NAME} | ${rawTitle}`

  const categoryLabel = data.categoryLabel ? `【${data.categoryLabel}】` : ""
  const body = `${categoryLabel}${data.body || "新しいお知らせがあります。"}`

  const options = {
    body,
    icon: data.icon || PUSH_SITE_ICON,
    badge: data.badge || PUSH_SITE_ICON,
    tag: data.notificationId || "mcs-notification",
    renotify: true,
    data: { url: data.url || "/notifications" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", event => {
  event.notification.close()
  const url = event.notification.data?.url || "/notifications"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
