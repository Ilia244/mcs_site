self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()))

self.addEventListener("push", event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch {}
  const title = data.title || "MCS・Ilia."
  const options = {
    body: data.body || "新しいお知らせがあります。",
    icon: "/default_avatar.png",
    badge: "/default_avatar.png",
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
