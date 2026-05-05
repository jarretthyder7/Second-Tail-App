// Second Tail service worker — push notifications only.
// We deliberately don't precache or intercept fetches; the goal here is just
// to receive Web Push events and route clicks to the right deep link.

self.addEventListener("install", () => {
  // Take over immediately on first install rather than waiting for all tabs
  // to close — the push prompt likely just registered us.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { title: "Second Tail", body: event.data ? event.data.text() : "" }
  }

  const title = payload.title || "Second Tail"
  const options = {
    body: payload.body || "",
    icon: "/logo-dog.png",
    badge: "/logo-dog.png",
    tag: payload.tag,
    // Replace earlier notifications with the same tag (e.g. multiple messages
    // in one conversation collapse into a single banner).
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || "/"

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })

      // Prefer focusing an open tab on the same origin; navigate it to the
      // deep link if it isn't already there.
      for (const client of allClients) {
        try {
          const url = new URL(client.url)
          const target = new URL(targetUrl, self.registration.scope)
          if (url.origin === target.origin) {
            await client.focus()
            if (url.pathname + url.search !== target.pathname + target.search) {
              await client.navigate(target.href)
            }
            return
          }
        } catch {
          // ignore malformed URLs
        }
      }

      await self.clients.openWindow(targetUrl)
    })(),
  )
})
